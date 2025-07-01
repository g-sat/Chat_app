from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, Query
from typing import Dict, List
from app.core.security import decode_access_token
from app.core.database import SessionLocal
from app.models.user import User
from app.models.ticket import Ticket
from app.models.message import Message
from sqlalchemy.orm import Session
import json

router = APIRouter()

active_connections: Dict[int, List[WebSocket]] = {}

# In-memory call state
user_call_state = {}  # user_id: {'state': 'idle'|'ringing'|'in_call', 'peer': int}
ticket_call_state = {}  # ticket_id: {'state': 'idle'|'ringing'|'in_call', 'users': set}

signal_connections = {}  # user_id: websocket

def get_user_id_from_token(token: str) -> int:
    payload = decode_access_token(token)
    if not payload or "sub" not in payload:
        return None
    return int(payload["sub"])

async def connect_user(user_id: int, websocket: WebSocket):
    if user_id not in active_connections:
        active_connections[user_id] = []
    active_connections[user_id].append(websocket)

async def disconnect_user(user_id: int, websocket: WebSocket):
    if user_id in active_connections:
        active_connections[user_id].remove(websocket)
        if not active_connections[user_id]:
            del active_connections[user_id]

async def send_notification_to_user(user_id: int, payload: str):
    if user_id in active_connections:
        for ws in active_connections[user_id]:
            try:
                await ws.send_text(payload)
            except Exception:
                pass

@router.websocket("/ws/chat/{other_user_id}")
async def websocket_user_chat(websocket: WebSocket, other_user_id: int, token: str = Query(...)):
    user_id = get_user_id_from_token(token)
    if not user_id:
        await websocket.close(code=1008)
        return
    await websocket.accept()
    await connect_user(user_id, websocket)
    db: Session = SessionLocal()
    try:
        while True:
            data = await websocket.receive_text()
            try:
                msg = json.loads(data)
            except Exception:
                msg = None
            if msg is not None:
                continue
            db_message = Message(
                sender_id=user_id,
                receiver_id=other_user_id,
                content=data
            )
            db.add(db_message)
            db.commit()
            db.refresh(db_message)
            if other_user_id in active_connections:
                for ws in active_connections[other_user_id]:
                    await ws.send_text(f"{user_id}: {data}")
    except WebSocketDisconnect:
        await disconnect_user(user_id, websocket)
    finally:
        db.close()

@router.websocket("/ws/ticket/{ticket_id}")
async def websocket_ticket_chat(websocket: WebSocket, ticket_id: int, token: str = Query(...)):
    user_id = get_user_id_from_token(token)
    if not user_id:
        await websocket.close(code=1008)
        return
    await websocket.accept()
    group = f"ticket_{ticket_id}"
    if group not in active_connections:
        active_connections[group] = []
    active_connections[group].append(websocket)
    # --- Robust ticket call state ---
    if ticket_id not in ticket_call_state:
        ticket_call_state[ticket_id] = {'state': 'idle', 'users': set()}
    ticket_call_state[ticket_id]['users'].add(user_id)
    db: Session = SessionLocal()
    try:
        while True:
            data = await websocket.receive_text()
            try:
                msg = json.loads(data)
            except Exception:
                msg = None
            if msg is not None:
                continue
            # Save message to DB
            db_message = Message(
                sender_id=user_id,
                ticket_id=ticket_id,
                content=data
            )
            db.add(db_message)
            db.commit()
            db.refresh(db_message)
            sender = db.query(User).filter(User.id == user_id).first()
            ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
            timestamp = db_message.timestamp.strftime('%I:%M %p') if hasattr(db_message, 'timestamp') and db_message.timestamp else ""
            for ws in list(active_connections[group]):
                await ws.send_text(f"{user_id}:{data}|{timestamp}|{sender.name if sender else ''}")
            if ticket:
                for notify_id in set([ticket.creator_id, ticket.assignee_id]):
                    if notify_id and notify_id != user_id:
                        if notify_id not in active_connections.get(group, []):
                            payload = f"NOTIFY:ticket:{ticket_id}:{ticket.title}:{data[:30]}"
                            await send_notification_to_user(notify_id, payload)
    except WebSocketDisconnect:
        active_connections[group].remove(websocket)
        if not active_connections[group]:
            del active_connections[group]
        # Remove user from ticket call state
        if ticket_id in ticket_call_state:
            ticket_call_state[ticket_id]['users'].discard(user_id)
            if not ticket_call_state[ticket_id]['users']:
                del ticket_call_state[ticket_id]
            else:
                ticket_call_state[ticket_id]['state'] = 'idle'
    finally:
        db.close()

@router.websocket("/ws/signal/{peer_id}")
async def websocket_signal(websocket: WebSocket, peer_id: int, token: str = Query(...)):
    user_id = get_user_id_from_token(token)
    if not user_id:
        await websocket.close(code=1008)
        return
    await websocket.accept()
    signal_connections[user_id] = websocket
    try:
        while True:
            data = await websocket.receive_text()
            # Relay to peer if connected
            peer_ws = signal_connections.get(peer_id)
            if peer_ws:
                await peer_ws.send_text(data)
    except WebSocketDisconnect:
        if user_id in signal_connections:
            del signal_connections[user_id] 
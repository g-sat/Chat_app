from fastapi import FastAPI, Request, Cookie
from fastapi.responses import JSONResponse, HTMLResponse
from fastapi.middleware.cors import CORSMiddleware
from app.routers import auth, ticket, message, ws_chat, user
from app.models.message import Message
from app.core.database import SessionLocal
from app.core.security import decode_access_token
from fastapi.staticfiles import StaticFiles
import os

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

app.include_router(auth.router)
app.include_router(ticket.router)
app.include_router(message.router)
app.include_router(ws_chat.router)
app.include_router(user.router)

app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")
app.mount("/static", StaticFiles(directory="app/static"), name="static")

@app.get("/", response_class=JSONResponse)
def read_root(request: Request):
    return {"message": "Welcome to the backend API. No frontend available."}

def summarize_chat(ticket_id: int, messages):
    """Simple chat summarization - you can enhance this with AI/ML"""
    if not messages:
        return "No messages in this chat."
    
    message_count = len(messages)
    first_message_time = messages[0].timestamp.strftime("%Y-%m-%d %H:%M")
    last_message_time = messages[-1].timestamp.strftime("%Y-%m-%d %H:%M")
    
    return f"Chat has {message_count} messages from {first_message_time} to {last_message_time}."

@app.post("/dashboard/chat/{ticket_id}/summarize", response_class=HTMLResponse)
def dashboard_chat_summarize(ticket_id: int, request: Request, access_token: str = Cookie(None)):
    if not access_token:
        return HTMLResponse("<div>Please log in</div>", status_code=401)
    db = SessionLocal()
    payload = decode_access_token(access_token)
    if not payload or "sub" not in payload:
        return HTMLResponse("<div>Invalid token</div>", status_code=401)
    messages = db.query(Message).filter(Message.ticket_id == ticket_id).order_by(Message.timestamp).all()
    summary = summarize_chat(ticket_id, messages)
    db.close()
    html = f"<div class='mt-2 p-3 bg-blue-100 border-l-4 border-blue-400 text-blue-800 rounded'><b>Chat Summary:</b> {summary}</div>"
    return HTMLResponse(html) 
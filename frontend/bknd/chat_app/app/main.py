from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from app.routers import auth, ticket, message, ws_chat, user
from fastapi.staticfiles import StaticFiles
import os

app = FastAPI()

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
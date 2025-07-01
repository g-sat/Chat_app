# SupportChat Pro – Backend

## Overview
A scalable, AI-ready real-time support chat and ticketing system built with FastAPI, WebSocket, MySQL, SQLAlchemy, Alembic, and modern frontend tools (TailwindCSS, HTMX).

## Setup Instructions

1. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```
2. **Configure database:**
   You will be prompted for MySQL credentials during the initial setup.
3. **Run migrations:**
   ```bash
   alembic upgrade head
   ```
4. **Start the server:**
   ```bash
   uvicorn app.main:app --reload
   ```

---

## Project Structure
- `app/` – Main application code
- `alembic/` – Database migrations
- `requirements.txt` – Python dependencies
- `README.md` – This file

---

For full PRD and features, see the project documentation. 
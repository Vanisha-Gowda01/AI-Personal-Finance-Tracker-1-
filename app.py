import io
import os
import sqlite3
from io import StringIO
from typing import Optional
import pandas as pd
from fastapi import FastAPI, HTTPException, UploadFile, File, Form, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel

# Import existing backend modules (do not modify them!)
from backend.database import (
    create_database,
    create_user,
    get_user_by_email,
    get_user_by_id,
    update_user,
    add_transaction,
    update_transaction,
    delete_transaction,
    save_transactions,
    get_transactions,
    add_goal,
    update_goal,
    delete_goal,
    get_goals
)
from backend.auth import hash_password, verify_password
from backend.insights import generate_insights, chat_with_finance_ai
from backend.categorizer import get_category

# Initialize Database on startup
create_database()

app = FastAPI(title="Personal Finance AI Tracker API")

# Configure CORS for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all during dev; Vite frontend on 5173
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ----------------- PYDANTIC SCHEMAS -----------------

class SignupPayload(BaseModel):
    name: str
    email: str
    password: str

class LoginPayload(BaseModel):
    email: str
    password: str

class UserUpdatePayload(BaseModel):
    name: str
    email: str

class TransactionPayload(BaseModel):
    user_id: int
    date: str
    description: str
    amount: float
    category: str

class GoalPayload(BaseModel):
    user_id: int
    title: str
    target_amount: float
    current_amount: float

class InsightsPayload(BaseModel):
    user_id: int

class ChatPayload(BaseModel):
    user_id: int
    message: str

# ----------------- AUTH ENDPOINTS -----------------

@app.post("/api/auth/signup")
def signup(payload: SignupPayload):
    name = payload.name.strip()
    email = payload.email.strip().lower()
    password = payload.password

    if not name or not email or not password:
        raise HTTPException(status_code=400, detail="Name, email, and password are required.")
    if len(password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters.")

    try:
        pw_hash = hash_password(password)
        user_id = create_user(name, email, pw_hash)
        return {"id": user_id, "name": name, "email": email}
    except sqlite3.IntegrityError:
        raise HTTPException(status_code=400, detail="An account already exists with this email.")
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Registration failed: {str(exc)}")

@app.post("/api/auth/login")
def login(payload: LoginPayload):
    email = payload.email.strip().lower()
    password = payload.password

    if not email or not password:
        raise HTTPException(status_code=400, detail="Email and password are required.")

    user = get_user_by_email(email)
    if not user or not verify_password(password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password.")

    return {"id": user["id"], "name": user["name"], "email": user["email"]}

# ----------------- USER PROFILE -----------------

@app.get("/api/user/{user_id}")
def get_profile(user_id: int):
    user = get_user_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    return {"id": user["id"], "name": user["name"], "email": user["email"]}

@app.put("/api/user/{user_id}")
def update_profile(user_id: int, payload: UserUpdatePayload):
    name = payload.name.strip()
    email = payload.email.strip().lower()

    if not name or not email:
        raise HTTPException(status_code=400, detail="Name and email are required.")

    try:
        update_user(user_id, name, email)
        return {"id": user_id, "name": name, "email": email}
    except sqlite3.IntegrityError:
        raise HTTPException(status_code=400, detail="That email is already in use.")
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Update failed: {str(exc)}")

# ----------------- TRANSACTIONS ENDPOINTS -----------------

@app.get("/api/transactions")
def list_transactions(user_id: int):
    df = get_transactions(user_id)
    if df.empty:
        return []
    
    # Format Date column for JSON compliance
    df["Date"] = df["Date"].dt.strftime("%Y-%m-%d")
    return df.to_dict(orient="records")

@app.post("/api/transactions")
def create_transaction(payload: TransactionPayload):
    if not payload.description.strip():
        raise HTTPException(status_code=400, detail="Description is required.")
    if payload.amount == 0:
        raise HTTPException(status_code=400, detail="Amount cannot be zero.")

    try:
        tx_id = add_transaction(
            payload.user_id,
            payload.date,
            payload.description,
            payload.amount,
            payload.category
        )
        return {
            "id": tx_id,
            "user_id": payload.user_id,
            "Date": payload.date,
            "Description": payload.description,
            "Amount": payload.amount,
            "Category": payload.category
        }
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))

@app.put("/api/transactions/{transaction_id}")
def edit_transaction(transaction_id: int, payload: TransactionPayload):
    if not payload.description.strip():
        raise HTTPException(status_code=400, detail="Description is required.")
    if payload.amount == 0:
        raise HTTPException(status_code=400, detail="Amount cannot be zero.")

    try:
        update_transaction(
            transaction_id,
            payload.user_id,
            payload.date,
            payload.description,
            payload.amount,
            payload.category
        )
        return {"status": "success", "message": "Transaction updated."}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))

@app.delete("/api/transactions/{transaction_id}")
def remove_transaction(transaction_id: int, user_id: int):
    try:
        delete_transaction(transaction_id, user_id)
        return {"status": "success", "message": "Transaction deleted."}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))

# ----------------- CSV UPLOAD & IMPORT/EXPORT -----------------

def _normalize_upload(df):
    column_map = {col.lower().strip(): col for col in df.columns}
    required = {"date", "description", "amount"}
    missing = required - set(column_map)
    if missing:
        raise ValueError("CSV must include Date, Description, and Amount columns.")

    clean = pd.DataFrame(
        {
            "Date": pd.to_datetime(df[column_map["date"]], errors="coerce"),
            "Description": df[column_map["description"]].astype(str),
            "Amount": pd.to_numeric(df[column_map["amount"]], errors="coerce"),
        }
    )
    if "category" in column_map:
        clean["Category"] = df[column_map["category"]].fillna("").astype(str)
    else:
        clean["Category"] = ""

    clean = clean.dropna(subset=["Date", "Amount"])
    return clean

def _categorize_missing(df):
    missing_mask = df["Category"].str.strip().eq("")
    if missing_mask.any():
        descriptions = df.loc[missing_mask, "Description"].unique()
        category_map = {description: get_category(description) for description in descriptions}
        df.loc[missing_mask, "Category"] = df.loc[missing_mask, "Description"].map(
            category_map
        )
    df["Category"] = df["Category"].replace("", "Other")
    return df

@app.post("/api/transactions/upload")
async def upload_csv(file: UploadFile = File(...), user_id: int = Form(...)):
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are allowed.")
    
    try:
        contents = await file.read()
        csv_data = contents.decode("utf-8")
        df_raw = pd.read_csv(io.StringIO(csv_data))
        
        # Normalize and auto-categorize
        df_clean = _normalize_upload(df_raw)
        df_categorized = _categorize_missing(df_clean)
        
        # Save to SQLite using database function
        save_transactions(df_categorized, user_id)
        
        # Return categorized transactions count
        return {"status": "success", "imported": len(df_categorized)}
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"CSV processing error: {str(exc)}")

# ----------------- GOALS ENDPOINTS -----------------

@app.get("/api/goals")
def list_goals(user_id: int):
    df = get_goals(user_id)
    if df.empty:
        return []
    return df.to_dict(orient="records")

@app.post("/api/goals")
def create_goal(payload: GoalPayload):
    if not payload.title.strip():
        raise HTTPException(status_code=400, detail="Goal title is required.")
    if payload.target_amount <= 0:
        raise HTTPException(status_code=400, detail="Target amount must be greater than zero.")

    try:
        goal_id = add_goal(
            payload.user_id,
            payload.title,
            payload.target_amount,
            payload.current_amount
        )
        return {
            "id": goal_id,
            "Goal": payload.title,
            "Target": payload.target_amount,
            "Current": payload.current_amount
        }
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))

@app.put("/api/goals/{goal_id}")
def edit_goal(goal_id: int, payload: GoalPayload):
    if not payload.title.strip():
        raise HTTPException(status_code=400, detail="Goal title is required.")
    if payload.target_amount <= 0:
        raise HTTPException(status_code=400, detail="Target amount must be greater than zero.")

    try:
        update_goal(
            goal_id,
            payload.user_id,
            payload.title,
            payload.target_amount,
            payload.current_amount
        )
        return {"status": "success", "message": "Goal updated."}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))

@app.delete("/api/goals/{goal_id}")
def remove_goal(goal_id: int, user_id: int):
    try:
        delete_goal(goal_id, user_id)
        return {"status": "success", "message": "Goal deleted."}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))

# ----------------- AI ENDPOINTS -----------------

@app.post("/api/ai/insights")
def fetch_insights(payload: InsightsPayload):
    df = get_transactions(payload.user_id)
    try:
        insights_text = generate_insights(df)
        return {"insights": insights_text}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Gemini Insights error: {str(exc)}")

@app.post("/api/ai/chat")
def chat(payload: ChatPayload):
    df = get_transactions(payload.user_id)
    try:
        reply = chat_with_finance_ai(df, payload.message)
        return {"response": reply}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Gemini Chat error: {str(exc)}")

# ----------------- SERVE STATIC FRONTEND (SPA fallback) -----------------

if os.path.exists("frontend/dist"):
    app.mount("/assets", StaticFiles(directory="frontend/dist/assets"), name="assets")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        # API endpoints return 404 if not matched above
        if full_path.startswith("api"):
            return JSONResponse(status_code=404, content={"detail": "Not Found"})
        
        # Check if the requested file exists in dist
        file_path = os.path.join("frontend/dist", full_path)
        if os.path.isfile(file_path):
            return FileResponse(file_path)
        
        # Serve React Router entry point
        return FileResponse("frontend/dist/index.html")

# To run server: uvicorn app:app --host 0.0.0.0 --port 8000
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)

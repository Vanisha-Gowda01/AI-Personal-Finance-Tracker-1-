import sqlite3
from contextlib import contextmanager
from pathlib import Path

import pandas as pd


DB_PATH = Path("finance.db")


@contextmanager
def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
        conn.commit()
    finally:
        conn.close()


def create_database():
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS users(
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
            """
        )
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS transactions(
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                date TEXT NOT NULL,
                description TEXT NOT NULL,
                amount REAL NOT NULL,
                category TEXT NOT NULL,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
            )
            """
        )
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS goals(
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                title TEXT NOT NULL,
                target_amount REAL NOT NULL,
                current_amount REAL NOT NULL DEFAULT 0,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
            )
            """
        )
        _migrate_transactions_table(cursor)
        cursor.execute(
            "CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id)"
        )
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_goals_user_id ON goals(user_id)")


def _migrate_transactions_table(cursor):
    columns = {
        row["name"]
        for row in cursor.execute("PRAGMA table_info(transactions)").fetchall()
    }
    if "user_id" not in columns:
        cursor.execute("ALTER TABLE transactions ADD COLUMN user_id INTEGER")
    if "created_at" not in columns:
        cursor.execute("ALTER TABLE transactions ADD COLUMN created_at TEXT")


def create_user(name, email, password_hash):
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO users(name, email, password_hash) VALUES (?, ?, ?)",
            (name.strip(), email.strip().lower(), password_hash),
        )
        return cursor.lastrowid


def get_user_by_email(email):
    with get_connection() as conn:
        row = conn.execute(
            "SELECT * FROM users WHERE email = ?", (email.strip().lower(),)
        ).fetchone()
        return dict(row) if row else None


def get_user_by_id(user_id):
    with get_connection() as conn:
        row = conn.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
        return dict(row) if row else None


def update_user(user_id, name, email):
    with get_connection() as conn:
        conn.execute(
            "UPDATE users SET name = ?, email = ? WHERE id = ?",
            (name.strip(), email.strip().lower(), user_id),
        )


def add_transaction(user_id, date, description, amount, category):
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
            INSERT INTO transactions(user_id, date, description, amount, category)
            VALUES (?, ?, ?, ?, ?)
            """,
            (user_id, str(date), description.strip(), float(amount), category.strip()),
        )
        return cursor.lastrowid


def update_transaction(transaction_id, user_id, date, description, amount, category):
    with get_connection() as conn:
        conn.execute(
            """
            UPDATE transactions
            SET date = ?, description = ?, amount = ?, category = ?
            WHERE id = ? AND user_id = ?
            """,
            (
                str(date),
                description.strip(),
                float(amount),
                category.strip(),
                transaction_id,
                user_id,
            ),
        )


def delete_transaction(transaction_id, user_id):
    with get_connection() as conn:
        conn.execute(
            "DELETE FROM transactions WHERE id = ? AND user_id = ?",
            (transaction_id, user_id),
        )


def save_transactions(df, user_id):
    required = ["Date", "Description", "Amount", "Category"]
    clean_df = df[required].copy()
    clean_df["user_id"] = user_id
    clean_df = clean_df.rename(
        columns={
            "Date": "date",
            "Description": "description",
            "Amount": "amount",
            "Category": "category",
        }
    )
    with get_connection() as conn:
        clean_df.to_sql("transactions", conn, if_exists="append", index=False)


def get_transactions(user_id):
    with get_connection() as conn:
        df = pd.read_sql_query(
            """
            SELECT id, date AS Date, description AS Description,
                   amount AS Amount, category AS Category
            FROM transactions
            WHERE user_id = ?
            ORDER BY date DESC, id DESC
            """,
            conn,
            params=(user_id,),
        )
    if not df.empty:
        df["Date"] = pd.to_datetime(df["Date"], errors="coerce")
        df["Amount"] = pd.to_numeric(df["Amount"], errors="coerce").fillna(0.0)
    return df


def add_goal(user_id, title, target_amount, current_amount):
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
            INSERT INTO goals(user_id, title, target_amount, current_amount)
            VALUES (?, ?, ?, ?)
            """,
            (user_id, title.strip(), float(target_amount), float(current_amount)),
        )
        return cursor.lastrowid


def update_goal(goal_id, user_id, title, target_amount, current_amount):
    with get_connection() as conn:
        conn.execute(
            """
            UPDATE goals
            SET title = ?, target_amount = ?, current_amount = ?
            WHERE id = ? AND user_id = ?
            """,
            (title.strip(), float(target_amount), float(current_amount), goal_id, user_id),
        )


def delete_goal(goal_id, user_id):
    with get_connection() as conn:
        conn.execute("DELETE FROM goals WHERE id = ? AND user_id = ?", (goal_id, user_id))


def get_goals(user_id):
    with get_connection() as conn:
        df = pd.read_sql_query(
            """
            SELECT id, title AS Goal, target_amount AS Target,
                   current_amount AS Current
            FROM goals
            WHERE user_id = ?
            ORDER BY id DESC
            """,
            conn,
            params=(user_id,),
        )
    return df

import os

from dotenv import load_dotenv
import google.generativeai as genai


load_dotenv()


def _get_model():
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise RuntimeError("GEMINI_API_KEY is not configured in .env")
    genai.configure(api_key=api_key)
    return genai.GenerativeModel("gemini-2.5-flash")


def _financial_snapshot(df):
    if df.empty:
        return 0, 0, {}

    total_income = df[df["Amount"] > 0]["Amount"].sum()
    total_expense = abs(df[df["Amount"] < 0]["Amount"].sum())
    category_summary = (
        df[df["Amount"] < 0]
        .groupby("Category")["Amount"]
        .sum()
        .abs()
        .sort_values(ascending=False)
        .to_dict()
    )
    return total_income, total_expense, category_summary


def generate_insights(df):
    total_income, total_expense, category_summary = _financial_snapshot(df)
    prompt = f"""
    Analyze this personal finance data.

    Income: INR {total_income:,.2f}
    Expense: INR {total_expense:,.2f}
    Category expenses: {category_summary}

    Provide:
    1. Spending analysis
    2. Savings recommendations
    3. Budget recommendations
    4. Two practical next actions

    Keep it concise, specific, and user-friendly.
    """
    response = _get_model().generate_content(prompt)
    return response.text


def chat_with_finance_ai(df, question):
    total_income, total_expense, category_summary = _financial_snapshot(df)
    prompt = f"""
    You are a helpful personal finance assistant. Use the user's financial
    context to answer clearly and practically.

    Income: INR {total_income:,.2f}
    Expense: INR {total_expense:,.2f}
    Category expenses: {category_summary}

    User question: {question}
    """
    response = _get_model().generate_content(prompt)
    return response.text

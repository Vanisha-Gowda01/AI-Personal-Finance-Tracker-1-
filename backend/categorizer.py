import re

import streamlit as st


LABELS = [
    "Food",
    "Travel",
    "Shopping",
    "Bills",
    "Income",
    "Entertainment",
    "Healthcare",
    "Education",
    "Investment",
    "Rent",
    "Other",
]

KEYWORD_RULES = {
    "Income": ["salary", "payroll", "credited", "deposit", "refund", "bonus"],
    "Food": ["swiggy", "zomato", "restaurant", "cafe", "coffee", "food", "grocery"],
    "Travel": ["uber", "ola", "metro", "fuel", "petrol", "flight", "train", "travel"],
    "Shopping": ["amazon", "flipkart", "myntra", "store", "shopping", "mall"],
    "Bills": ["electricity", "water", "wifi", "broadband", "mobile", "recharge", "bill"],
    "Entertainment": ["netflix", "prime", "spotify", "movie", "cinema", "game"],
    "Healthcare": ["hospital", "clinic", "pharmacy", "medical", "doctor", "medicine"],
    "Education": ["school", "college", "course", "tuition", "book", "exam"],
    "Investment": ["mutual fund", "sip", "stocks", "zerodha", "groww", "investment"],
    "Rent": ["rent", "landlord"],
}


def _keyword_category(description):
    text = re.sub(r"\s+", " ", str(description).lower()).strip()
    for category, keywords in KEYWORD_RULES.items():
        if any(keyword in text for keyword in keywords):
            return category
    return "Other"


@st.cache_resource(show_spinner=False)
def load_model():
    try:
        from transformers import pipeline

        return pipeline(
            "zero-shot-classification",
            model="valhalla/distilbart-mnli-12-1",
        )
    except Exception as exc:
        st.session_state.categorizer_warning = (
            "Transformer categorizer is unavailable, using keyword categorization."
        )
        print(f"Transformer categorizer unavailable: {exc}")
        return None


def get_category(description):
    if not description:
        return "Other"

    model = load_model()
    if model is None:
        return _keyword_category(description)

    try:
        result = model(str(description), LABELS)
        return result["labels"][0]
    except Exception as exc:
        print(f"Error categorizing '{description}': {exc}")
        return _keyword_category(description)

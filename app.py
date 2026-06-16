import streamlit as st

from backend.auth import is_authenticated, logout, render_auth_pages
from backend.database import create_database, get_goals, get_transactions
from frontend.ai_insights import render_ai_insights
from frontend.analytics import render_analytics
from frontend.dashboard import render_dashboard
from frontend.goals import render_goals
from frontend.profile import render_profile
from frontend.transactions import render_transactions


st.set_page_config(
    page_title="Personal Finance AI Tracker",
    page_icon="PF",
    layout="wide",
    initial_sidebar_state="expanded",
)


def load_css():
    with open("frontend/styles.css", encoding="utf-8") as css_file:
        st.markdown(f"<style>{css_file.read()}</style>", unsafe_allow_html=True)


def render_sidebar(user):
    st.sidebar.markdown(
        f"""
        <div class="auth-brand">
            <span class="brand-mark">PF</span>
            <div>
                <h1>Finance AI</h1>
                <p>{user["name"]}</p>
            </div>
        </div>
        """,
        unsafe_allow_html=True,
    )

    nav_items = {
        "Dashboard": "Dashboard",
        "Transactions": "Transactions",
        "Analytics": "Analytics",
        "AI Insights": "AI Insights",
        "Budget Goals": "Budget Goals",
        "Profile": "Profile",
        "Logout": "Logout",
    }

    page = st.sidebar.radio(
        "Navigation",
        list(nav_items.keys()),
        format_func=lambda item: nav_items[item],
        label_visibility="collapsed",
        key="page",
    )

    st.sidebar.divider()
    st.sidebar.number_input(
        "Monthly Budget",
        min_value=1_000.0,
        value=float(st.session_state.get("monthly_budget", 50_000.0)),
        step=1_000.0,
        key="monthly_budget",
    )

    return page


def main():
    create_database()
    load_css()

    if not is_authenticated():
        render_auth_pages()
        return

    user = st.session_state.user
    page = render_sidebar(user)

    if page == "Logout":
        logout()

    transactions_df = get_transactions(user["id"])
    goals_df = get_goals(user["id"])

    if page == "Dashboard":
        render_dashboard(transactions_df)
    elif page == "Transactions":
        render_transactions(transactions_df, user["id"])
    elif page == "Analytics":
        render_analytics(transactions_df)
    elif page == "AI Insights":
        render_ai_insights(transactions_df)
    elif page == "Budget Goals":
        render_goals(goals_df, user["id"])
    elif page == "Profile":
        render_profile(transactions_df, user)


if __name__ == "__main__":
    main()

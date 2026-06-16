import sqlite3

import streamlit as st

from backend.database import get_user_by_id, update_user


def render_profile(df, user):
    latest_user = get_user_by_id(user["id"]) or user
    st.markdown(
        """
        <div class="app-header">
            <div class="app-title">
                <h1>Profile</h1>
                <p>Manage account details and review usage.</p>
            </div>
        </div>
        """,
        unsafe_allow_html=True,
    )

    col1, col2, col3 = st.columns(3)
    col1.metric("User Name", latest_user["name"])
    col2.metric("Email", latest_user["email"])
    col3.metric("Total Transactions", len(df))

    st.subheader("Account Settings")
    with st.form("profile_form"):
        name = st.text_input("User Name", value=latest_user["name"])
        email = st.text_input("Email", value=latest_user["email"])
        submitted = st.form_submit_button("Update Profile", use_container_width=True)
        if submitted:
            if not name.strip() or not email.strip():
                st.error("Name and email are required.")
            else:
                try:
                    update_user(user["id"], name, email)
                    st.session_state.user.update({"name": name, "email": email})
                    st.success("Profile updated.")
                    st.rerun()
                except sqlite3.IntegrityError:
                    st.error("That email is already in use.")

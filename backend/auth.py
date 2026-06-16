import base64
import hashlib
import hmac
import os
import sqlite3

import streamlit as st

from backend.database import create_user, get_user_by_email


PBKDF2_ITERATIONS = 390_000


def hash_password(password):
    salt = os.urandom(16)
    password_hash = hashlib.pbkdf2_hmac(
        "sha256", password.encode("utf-8"), salt, PBKDF2_ITERATIONS
    )
    return (
        f"pbkdf2_sha256${PBKDF2_ITERATIONS}$"
        f"{base64.b64encode(salt).decode()}$"
        f"{base64.b64encode(password_hash).decode()}"
    )


def verify_password(password, stored_hash):
    try:
        algorithm, iterations, salt_b64, hash_b64 = stored_hash.split("$", 3)
        if algorithm != "pbkdf2_sha256":
            return False
        salt = base64.b64decode(salt_b64)
        expected_hash = base64.b64decode(hash_b64)
        actual_hash = hashlib.pbkdf2_hmac(
            "sha256", password.encode("utf-8"), salt, int(iterations)
        )
        return hmac.compare_digest(actual_hash, expected_hash)
    except Exception:
        return False


def is_authenticated():
    return bool(st.session_state.get("authenticated") and st.session_state.get("user"))


def set_current_user(user):
    st.session_state.authenticated = True
    st.session_state.user = {
        "id": user["id"],
        "name": user["name"],
        "email": user["email"],
    }


def logout():
    for key in ["authenticated", "user", "page"]:
        st.session_state.pop(key, None)
    st.rerun()


def render_auth_pages():
    if "auth_mode" not in st.session_state:
        st.session_state.auth_mode = "Login"

    st.markdown(
        """
        <div class="auth-hero">
            <span class="brand-mark">PF</span>
            <h1>Personal Finance AI Tracker</h1>
            <p>Smart spending, savings goals, and AI-powered money decisions.</p>
        </div>
        """,
        unsafe_allow_html=True,
    )

    _, center_col, _ = st.columns([1, 0.62, 1])
    with center_col:
        with st.container(border=True):
            st.markdown('<div class="auth-card-title">Welcome Back</div>', unsafe_allow_html=True)
            st.caption("Sign in to continue, or create a new account.")

            login_col, signup_col = st.columns(2)
            if login_col.button("Login", use_container_width=True):
                st.session_state.auth_mode = "Login"
            if signup_col.button("Create Account", use_container_width=True):
                st.session_state.auth_mode = "Create Account"

            if st.session_state.auth_mode == "Login":
                with st.form("login_form"):
                    email = st.text_input("Email", placeholder="you@example.com")
                    password = st.text_input("Password", type="password")
                    submitted = st.form_submit_button("Sign In", use_container_width=True)
                    if submitted:
                        user = get_user_by_email(email)
                        if user and verify_password(password, user["password_hash"]):
                            set_current_user(user)
                            st.success("Welcome back.")
                            st.rerun()
                        else:
                            st.error("Invalid email or password.")

                st.caption("Don't have an account? Click Create Account above.")

            else:
                with st.form("signup_form"):
                    name = st.text_input("Full name")
                    email = st.text_input("Email address", placeholder="you@example.com")
                    password = st.text_input("Create password", type="password")
                    confirm_password = st.text_input("Confirm password", type="password")
                    submitted = st.form_submit_button("Create Account", use_container_width=True)
                    if submitted:
                        if not name.strip() or not email.strip() or not password:
                            st.error("Please fill in all required fields.")
                        elif len(password) < 8:
                            st.error("Password must be at least 8 characters.")
                        elif password != confirm_password:
                            st.error("Passwords do not match.")
                        else:
                            try:
                                user_id = create_user(name, email, hash_password(password))
                                set_current_user(
                                    {"id": user_id, "name": name, "email": email}
                                )
                                st.success("Your account is ready.")
                                st.rerun()
                            except sqlite3.IntegrityError:
                                st.error("An account already exists with this email.")

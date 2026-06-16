from io import StringIO

import pandas as pd
import streamlit as st

from backend.categorizer import get_category
from backend.database import (
    add_transaction,
    delete_transaction,
    save_transactions,
    update_transaction,
)


CATEGORIES = [
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


def render_transactions(df, user_id):
    st.markdown(
        """
        <div class="app-header">
            <div class="app-title">
                <h1>Transactions</h1>
                <p>Add, edit, filter, import, and export your money movement.</p>
            </div>
        </div>
        """,
        unsafe_allow_html=True,
    )

    add_tab, manage_tab, upload_tab = st.tabs(["Add Transaction", "Manage", "Import / Export"])

    with add_tab:
        with st.form("add_transaction_form", clear_on_submit=True):
            col1, col2 = st.columns(2)
            date = col1.date_input("Date")
            category = col2.selectbox("Category", CATEGORIES)
            description = st.text_input("Description")
            amount = st.number_input(
                "Amount",
                help="Use positive values for income and negative values for expenses.",
                step=100.0,
            )
            submitted = st.form_submit_button("Add Transaction", use_container_width=True)
            if submitted:
                if not description.strip():
                    st.error("Description is required.")
                elif amount == 0:
                    st.error("Amount cannot be zero.")
                else:
                    add_transaction(user_id, date, description, amount, category)
                    st.success("Transaction added.")
                    st.rerun()

    with manage_tab:
        search = st.text_input("Search Transactions", placeholder="Search description")
        categories = sorted(df["Category"].dropna().unique().tolist()) if not df.empty else []
        selected_category = st.selectbox("Filter by Category", ["All"] + categories)

        filtered = df.copy()
        if search and not filtered.empty:
            filtered = filtered[
                filtered["Description"].str.contains(search, case=False, na=False)
            ]
        if selected_category != "All" and not filtered.empty:
            filtered = filtered[filtered["Category"] == selected_category]

        st.dataframe(
            filtered[["id", "Date", "Description", "Amount", "Category"]],
            use_container_width=True,
            hide_index=True,
        )

        if not df.empty:
            transaction_id = st.selectbox(
                "Select transaction to edit or delete",
                df["id"].tolist(),
                format_func=lambda item: f"#{item} - {df.loc[df['id'] == item, 'Description'].iloc[0]}",
            )
            selected = df[df["id"] == transaction_id].iloc[0]
            with st.form("edit_transaction_form"):
                col1, col2 = st.columns(2)
                edited_date = col1.date_input("Date", value=selected["Date"].date())
                current_category = (
                    selected["Category"] if selected["Category"] in CATEGORIES else "Other"
                )
                edited_category = col2.selectbox(
                    "Category", CATEGORIES, index=CATEGORIES.index(current_category)
                )
                edited_description = st.text_input(
                    "Description", value=selected["Description"]
                )
                edited_amount = st.number_input(
                    "Amount", value=float(selected["Amount"]), step=100.0
                )
                save_col, delete_col = st.columns(2)
                save_clicked = save_col.form_submit_button(
                    "Save Changes", use_container_width=True
                )
                delete_clicked = delete_col.form_submit_button(
                    "Delete Transaction", use_container_width=True
                )
                if save_clicked:
                    update_transaction(
                        transaction_id,
                        user_id,
                        edited_date,
                        edited_description,
                        edited_amount,
                        edited_category,
                    )
                    st.success("Transaction updated.")
                    st.rerun()
                if delete_clicked:
                    delete_transaction(transaction_id, user_id)
                    st.success("Transaction deleted.")
                    st.rerun()

    with upload_tab:
        uploaded_file = st.file_uploader("Upload CSV", type=["csv"])
        if uploaded_file is not None:
            try:
                upload_df = _normalize_upload(pd.read_csv(uploaded_file))
                with st.spinner("Categorizing missing categories..."):
                    upload_df = _categorize_missing(upload_df)
                st.dataframe(upload_df, use_container_width=True, hide_index=True)
                if st.button("Save Uploaded Transactions", use_container_width=True):
                    save_transactions(upload_df, user_id)
                    st.success("Transactions imported.")
                    st.rerun()
            except Exception as exc:
                st.error(str(exc))

        export_df = df[["Date", "Description", "Amount", "Category"]].copy()
        csv_buffer = StringIO()
        export_df.to_csv(csv_buffer, index=False)
        st.download_button(
            "Download CSV",
            data=csv_buffer.getvalue(),
            file_name="personal_finance_transactions.csv",
            mime="text/csv",
            use_container_width=True,
        )

import pandas as pd
import plotly.express as px
import streamlit as st


def money(value):
    return f"INR {value:,.2f}"


def calculate_summary(df):
    if df.empty:
        return 0.0, 0.0, 0.0
    income = df[df["Amount"] > 0]["Amount"].sum()
    expense = abs(df[df["Amount"] < 0]["Amount"].sum())
    return income, expense, income - expense


def apply_plot_theme(fig):
    fig.update_layout(
        template="plotly_white",
        paper_bgcolor="rgba(0,0,0,0)",
        plot_bgcolor="rgba(0,0,0,0)",
        font_color="#17211d",
        margin=dict(l=20, r=20, t=45, b=20),
        legend=dict(orientation="h", yanchor="bottom", y=1.02, xanchor="right", x=1),
    )
    fig.update_xaxes(gridcolor="#e6eee6", zerolinecolor="#dfe8df")
    fig.update_yaxes(gridcolor="#e6eee6", zerolinecolor="#dfe8df")
    return fig


def metric_card(label, value, subtext, variant):
    st.markdown(
        f"""
        <div class="metric-card {variant}">
            <div class="metric-label">{label}</div>
            <div class="metric-value">{value}</div>
            <div class="metric-sub">{subtext}</div>
        </div>
        """,
        unsafe_allow_html=True,
    )


def render_dashboard(df):
    income, expense, savings = calculate_summary(df)
    budget_limit = st.session_state.get("monthly_budget", 50_000.0)
    budget_status = "Within Budget" if expense <= budget_limit else "Over Budget"

    st.markdown(
        """
        <div class="app-header">
            <div class="app-title">
                <h1>Dashboard</h1>
                <p>Your money overview, refreshed from every transaction.</p>
            </div>
            <div class="chip">Live portfolio snapshot</div>
        </div>
        """,
        unsafe_allow_html=True,
    )

    cols = st.columns(4)
    with cols[0]:
        metric_card("Total Income", money(income), "Credited transactions", "income")
    with cols[1]:
        metric_card("Total Expense", money(expense), "Debited transactions", "expense")
    with cols[2]:
        metric_card("Total Savings", money(savings), "Income minus expenses", "savings")
    with cols[3]:
        metric_card("Budget Status", budget_status, f"Limit {money(budget_limit)}", "budget")

    if df.empty:
        st.info("Add or upload transactions to unlock your dashboard charts.")
        return

    recent = df.sort_values("Date", ascending=False).head(8).copy()
    recent["Date"] = recent["Date"].dt.strftime("%d %b %Y")

    left, right = st.columns([1.05, 0.95])
    with left:
        st.subheader("Recent Transactions")
        st.dataframe(
            recent[["Date", "Description", "Amount", "Category"]],
            use_container_width=True,
            hide_index=True,
        )
    with right:
        expense_df = df[df["Amount"] < 0].copy()
        if not expense_df.empty:
            expense_df["Spend"] = expense_df["Amount"].abs()
            pie = px.pie(
                expense_df,
                names="Category",
                values="Spend",
                hole=0.52,
                title="Expense Distribution",
                color_discrete_sequence=px.colors.qualitative.Set2,
            )
            st.plotly_chart(apply_plot_theme(pie), use_container_width=True)

    expense_df = df[df["Amount"] < 0].copy()
    if expense_df.empty:
        return

    expense_df["Spend"] = expense_df["Amount"].abs()
    monthly = (
        expense_df.dropna(subset=["Date"])
        .assign(Month=lambda data: data["Date"].dt.to_period("M").dt.to_timestamp())
        .groupby("Month", as_index=False)["Spend"]
        .sum()
    )
    category = (
        expense_df.groupby("Category", as_index=False)["Spend"]
        .sum()
        .sort_values("Spend", ascending=False)
    )

    trend_col, bar_col = st.columns(2)
    with trend_col:
        trend = px.line(
            monthly,
            x="Month",
            y="Spend",
            markers=True,
            title="Monthly Expense Trend",
        )
        trend.update_traces(line_color="#18d4ff", marker_size=8)
        st.plotly_chart(apply_plot_theme(trend), use_container_width=True)
    with bar_col:
        bar = px.bar(
            category,
            x="Category",
            y="Spend",
            title="Category-wise Expense",
            color="Spend",
            color_continuous_scale=["#31e39b", "#18d4ff", "#ff5ca8"],
        )
        st.plotly_chart(apply_plot_theme(bar), use_container_width=True)

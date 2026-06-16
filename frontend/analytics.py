import plotly.express as px
import streamlit as st

from frontend.dashboard import apply_plot_theme, calculate_summary, metric_card, money


def render_analytics(df):
    st.markdown(
        """
        <div class="app-header">
            <div class="app-title">
                <h1>Analytics</h1>
                <p>Understand the shape of your spending and saving habits.</p>
            </div>
        </div>
        """,
        unsafe_allow_html=True,
    )

    if df.empty:
        st.info("Add transactions to view analytics.")
        return

    income, expense, savings = calculate_summary(df)
    savings_percentage = (savings / income * 100) if income else 0

    expense_df = df[df["Amount"] < 0].copy()
    expense_df["Spend"] = expense_df["Amount"].abs()
    category = (
        expense_df.groupby("Category", as_index=False)["Spend"]
        .sum()
        .sort_values("Spend", ascending=False)
    )
    top_category = category.iloc[0]["Category"] if not category.empty else "None"

    cols = st.columns(4)
    with cols[0]:
        metric_card("Spending Summary", money(expense), "Total outflow", "expense")
    with cols[1]:
        metric_card("Top Category", top_category, "Highest spend area", "budget")
    with cols[2]:
        metric_card("Savings Percentage", f"{savings_percentage:.1f}%", "Of income", "savings")
    with cols[3]:
        metric_card("Net Savings", money(savings), "After expenses", "income")

    monthly = (
        expense_df.dropna(subset=["Date"])
        .assign(Month=lambda data: data["Date"].dt.to_period("M").dt.to_timestamp())
        .groupby("Month", as_index=False)["Spend"]
        .sum()
    )

    left, right = st.columns(2)
    with left:
        fig = px.area(
            monthly,
            x="Month",
            y="Spend",
            title="Monthly Spending Trend",
            color_discrete_sequence=["#18d4ff"],
        )
        st.plotly_chart(apply_plot_theme(fig), use_container_width=True)
    with right:
        fig = px.treemap(
            category,
            path=["Category"],
            values="Spend",
            title="Category Analysis",
            color="Spend",
            color_continuous_scale=["#31e39b", "#18d4ff", "#ff5ca8"],
        )
        st.plotly_chart(apply_plot_theme(fig), use_container_width=True)

    st.subheader("Category Breakdown")
    bar = px.bar(
        category,
        x="Spend",
        y="Category",
        orientation="h",
        color="Spend",
        color_continuous_scale=["#31e39b", "#18d4ff", "#ff5ca8"],
    )
    st.plotly_chart(apply_plot_theme(bar), use_container_width=True)

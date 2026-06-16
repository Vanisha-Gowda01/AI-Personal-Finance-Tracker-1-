import streamlit as st

from backend.database import add_goal, delete_goal, update_goal
from frontend.dashboard import money


def render_goals(goals_df, user_id):
    st.markdown(
        """
        <div class="app-header">
            <div class="app-title">
                <h1>Budget Goals</h1>
                <p>Create savings goals and track progress to completion.</p>
            </div>
        </div>
        """,
        unsafe_allow_html=True,
    )

    with st.form("create_goal_form", clear_on_submit=True):
        col1, col2, col3 = st.columns(3)
        title = col1.text_input("Savings Goal", placeholder="Emergency fund")
        target = col2.number_input("Target Amount", min_value=1.0, step=1000.0)
        current = col3.number_input("Current Progress", min_value=0.0, step=1000.0)
        submitted = st.form_submit_button("Create Goal", use_container_width=True)
        if submitted:
            if not title.strip():
                st.error("Goal name is required.")
            else:
                add_goal(user_id, title, target, current)
                st.success("Goal created.")
                st.rerun()

    if goals_df.empty:
        st.info("No goals yet. Create your first savings target above.")
        return

    for _, goal in goals_df.iterrows():
        target = max(float(goal["Target"]), 1.0)
        current = max(float(goal["Current"]), 0.0)
        pct = min(current / target, 1.0)
        remaining = max(target - current, 0.0)
        st.markdown(
            f"""
            <div class="goal-card">
                <h3>{goal["Goal"]}</h3>
                <p>{money(current)} saved of {money(target)} target</p>
            </div>
            """,
            unsafe_allow_html=True,
        )
        st.progress(pct, text=f"{pct * 100:.1f}% complete")
        st.caption(f"Remaining amount: {money(remaining)}")

        with st.expander(f"Edit {goal['Goal']}"):
            with st.form(f"edit_goal_{goal['id']}"):
                updated_title = st.text_input("Savings Goal", value=goal["Goal"])
                updated_target = st.number_input(
                    "Target Amount",
                    min_value=1.0,
                    value=float(goal["Target"]),
                    step=1000.0,
                )
                updated_current = st.number_input(
                    "Current Progress",
                    min_value=0.0,
                    value=float(goal["Current"]),
                    step=1000.0,
                )
                save_col, delete_col = st.columns(2)
                save_clicked = save_col.form_submit_button(
                    "Save Goal", use_container_width=True
                )
                delete_clicked = delete_col.form_submit_button(
                    "Delete Goal", use_container_width=True
                )
                if save_clicked:
                    update_goal(
                        goal["id"],
                        user_id,
                        updated_title,
                        updated_target,
                        updated_current,
                    )
                    st.success("Goal updated.")
                    st.rerun()
                if delete_clicked:
                    delete_goal(goal["id"], user_id)
                    st.success("Goal deleted.")
                    st.rerun()

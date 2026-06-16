import streamlit as st

from backend.insights import chat_with_finance_ai, generate_insights


def render_ai_insights(df):
    st.markdown(
        """
        <div class="app-header">
            <div class="app-title">
                <h1>AI Insights</h1>
                <p>Gemini-powered analysis for smarter financial decisions.</p>
            </div>
        </div>
        """,
        unsafe_allow_html=True,
    )

    if df.empty:
        st.info("Add transactions before generating AI insights.")
        return

    if st.button("Generate Financial Insights", use_container_width=True):
        with st.spinner("Analyzing your finances with Gemini..."):
            try:
                st.session_state.generated_insights = generate_insights(df)
            except Exception as exc:
                st.error(f"Could not generate insights: {exc}")

    if st.session_state.get("generated_insights"):
        st.markdown(st.session_state.generated_insights)

    st.subheader("Finance AI Chat")
    if "finance_chat" not in st.session_state:
        st.session_state.finance_chat = []

    for message in st.session_state.finance_chat:
        with st.chat_message(message["role"]):
            st.markdown(message["content"])

    prompt = st.chat_input("Ask about your spending, budget, or savings plan")
    if prompt:
        st.session_state.finance_chat.append({"role": "user", "content": prompt})
        with st.chat_message("user"):
            st.markdown(prompt)
        with st.chat_message("assistant"):
            with st.spinner("Thinking..."):
                try:
                    answer = chat_with_finance_ai(df, prompt)
                except Exception as exc:
                    answer = f"Could not contact Gemini: {exc}"
                st.markdown(answer)
        st.session_state.finance_chat.append({"role": "assistant", "content": answer})

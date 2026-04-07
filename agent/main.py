import uvicorn
from fastapi import BackgroundTasks, FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from langchain_core.messages import HumanMessage

import config
from dependencies import (
    fetch_conversation_messages,
    fetch_user_profile,
    save_conversation_to_flask,
)
from graph.builder import build_graph
from models.schemas import AgentChatRequest, AgentChatResponse, CrisisAlertResponse

app = FastAPI(title="PsySight Agent", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8003", "http://127.0.0.1:8003"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

graph = build_graph()


@app.get("/api/agent/health")
async def health():
    return {"status": "ok", "service": "psysight-agent"}


@app.post("/api/agent/chat", response_model=AgentChatResponse)
async def agent_chat(req: AgentChatRequest, background_tasks: BackgroundTasks):
    user_profile = {}
    history_messages = []

    if req.session_id and not req.anonymous:
        history_messages = await fetch_conversation_messages(req.session_id)
    if not req.anonymous and req.user_id:
        user_profile = await fetch_user_profile(req.user_id)

    from langchain_core.messages import AIMessage

    lc_messages = []
    for msg in history_messages:
        if msg["role"] == "user":
            lc_messages.append(HumanMessage(content=msg["content"]))
        elif msg["role"] == "assistant":
            lc_messages.append(AIMessage(content=msg["content"]))

    lc_messages.append(HumanMessage(content=req.message))

    initial_state = {
        "messages": lc_messages,
        "session_id": req.session_id,
        "turn_count": len(history_messages) // 2,
        "user_id": req.user_id,
        "is_anonymous": req.anonymous,
        "user_profile": user_profile,
        "use_thinking": req.use_thinking,
        "search_mode": req.search_mode,
        "intent": "",
        "scale_locked": False,
        "refuse_count": 0,
        "recommendation_cooldown": 0,
        "extracted_symptoms": [],
        "rag_results": [],
        "crisis_detected": False,
        "crisis_keywords": [],
        "reply": "",
        "recommended_scales": [],
        "last_node": "",
    }

    thread_id = f"session-{req.session_id}" if req.session_id else f"anon-{id(req)}"
    graph_config = {"configurable": {"thread_id": thread_id}}

    result = await graph.ainvoke(initial_state, config=graph_config)

    crisis_alert = None
    if result.get("crisis_detected"):
        crisis_alert = CrisisAlertResponse(
            show=True,
            keywords=result.get("crisis_keywords", []),
            hotlines=[
                {"name": "全国心理援助热线", "phone": "400-161-9995"},
                {"name": "北京心理危机研究与干预中心", "phone": "010-82951332"},
            ],
            message="你不是一个人。现在请优先联系专业支持，我们在这里陪你。",
            persistent=True,
        )

    if not req.anonymous and req.user_id:
        user_msg = {"role": "user", "content": req.message, "crisis_flag": result.get("crisis_detected", False)}
        assistant_msg = {
            "role": "assistant",
            "content": result.get("reply", ""),
            "crisis_flag": result.get("crisis_detected", False),
        }
        scales = result.get("recommended_scales", [])
        if scales:
            assistant_msg["recommended_scale_code"] = scales[0].get("code")
            assistant_msg["recommended_scale_title"] = scales[0].get("title")

        background_tasks.add_task(
            save_conversation_to_flask,
            req.user_id,
            req.session_id,
            [user_msg, assistant_msg],
        )

    model_used = config.DEEPSEEK_MODEL_THINK if req.use_thinking else config.DEEPSEEK_MODEL_FAST

    return AgentChatResponse(
        reply=result.get("reply", ""),
        session_id=result.get("session_id"),
        recommended_scales=[
            {"code": s["code"], "title": s["title"], "scale_id": s.get("scale_id")}
            for s in result.get("recommended_scales", [])
        ],
        crisis_alert=crisis_alert,
        model_used=model_used,
        search_mode_used=req.search_mode,
        intent_detected=result.get("intent", ""),
    )


@app.post("/api/agent/summarize/{session_id}")
async def summarize_session(session_id: int, background_tasks: BackgroundTasks):
    from graph.nodes.summary import run_session_summary

    background_tasks.add_task(run_session_summary, session_id)
    return {"ok": True, "message": "summary task queued"}


if __name__ == "__main__":
    uvicorn.run("main:app", host=config.AGENT_HOST, port=config.AGENT_PORT, reload=True)

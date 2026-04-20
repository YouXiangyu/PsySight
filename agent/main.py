import json
import time
from pathlib import Path

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

_DEBUG_LOG_PATH = Path(__file__).resolve().parent.parent / "debug-e5d1e6.log"


def _debug_ndjson(hypothesis_id: str, location: str, message: str, data: dict) -> None:
    # #region agent log
    try:
        line = (
            json.dumps(
                {
                    "sessionId": "e5d1e6",
                    "hypothesisId": hypothesis_id,
                    "location": location,
                    "message": message,
                    "data": data,
                    "timestamp": int(time.time() * 1000),
                },
                ensure_ascii=False,
            )
            + "\n"
        )
        with open(_DEBUG_LOG_PATH, "a", encoding="utf-8") as f:
            f.write(line)
    except OSError:
        pass
    # #endregion


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
    # #region agent log
    _debug_ndjson(
        "H2",
        "main.py:agent_chat",
        "fastapi_agent_chat_entered",
        {"has_session": bool(req.session_id), "anonymous": bool(req.anonymous)},
    )
    # #endregion
    user_profile = {}
    history_messages = []

    # Keep anonymous chats stateful across turns by issuing a temporary session id.
    effective_session_id = req.session_id
    if req.anonymous and not effective_session_id:
        effective_session_id = -int(time.time() * 1000)

    if effective_session_id and not req.anonymous:
        history_messages = await fetch_conversation_messages(effective_session_id)
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

    thread_id = f"session-{effective_session_id}" if effective_session_id is not None else f"anon-{id(req)}"
    graph_config = {"configurable": {"thread_id": thread_id}}

    existing_state = None
    try:
        snapshot = await graph.aget_state(graph_config)
        if snapshot and snapshot.values:
            existing_state = snapshot.values
    except Exception:
        pass

    if existing_state:
        initial_state = {
            "messages": [HumanMessage(content=req.message)],
            "session_id": effective_session_id,
            "user_id": req.user_id,
            "is_anonymous": req.anonymous,
            "user_profile": user_profile,
            "use_thinking": req.use_thinking,
            "search_mode": req.search_mode,
            "intent": "",
            "crisis_detected": False,
            "crisis_keywords": [],
            "reply": "",
            "recommended_scales": [],
            "rag_results": [],
            "last_node": "",
        }
    else:
        initial_state = {
            "messages": lc_messages,
            "session_id": effective_session_id,
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
            effective_session_id,
            [user_msg, assistant_msg],
        )

    model_used = config.DEEPSEEK_MODEL_THINK if req.use_thinking else config.DEEPSEEK_MODEL_FAST

    return AgentChatResponse(
        reply=result.get("reply", ""),
        session_id=result.get("session_id", effective_session_id),
        recommended_scales=[
            {"code": s["code"], "title": s["title"], "scale_id": s.get("scale_id")}
            for s in result.get("recommended_scales", [])
        ],
        crisis_alert=crisis_alert,
        model_used=model_used,
        search_mode_used=req.search_mode,
        intent_detected=result.get("intent", ""),
    )


@app.get("/api/agent/debug/search")
async def debug_search(q: str = "睡眠"):
    """Test scale search directly with keywords (dev only)."""
    from retrieval.scale_index import get_scale_index_search
    from graph.nodes.test_handoff import _extract_keywords_from_message

    extracted = _extract_keywords_from_message(q)
    search = get_scale_index_search()
    results = search.search(extracted if extracted else [q], top_k=5)
    return {
        "query": q,
        "extracted_keywords": extracted,
        "results": [
            {"code": r["code"], "title": r["title"], "score": r.get("score"), "matched": r.get("matched")}
            for r in results
        ],
    }


@app.get("/api/agent/debug/{session_id}")
async def debug_state(session_id: int):
    """Inspect the current LangGraph checkpoint state for a session (dev only)."""
    thread_id = f"session-{session_id}"
    graph_config = {"configurable": {"thread_id": thread_id}}
    try:
        snapshot = await graph.aget_state(graph_config)
        if not snapshot or not snapshot.values:
            return {"error": "no checkpoint found", "thread_id": thread_id}

        vals = snapshot.values
        messages_summary = []
        for m in vals.get("messages", [])[-10:]:
            messages_summary.append({
                "type": type(m).__name__,
                "content": (m.content[:120] + "...") if len(m.content) > 120 else m.content,
            })

        return {
            "thread_id": thread_id,
            "turn_count": vals.get("turn_count"),
            "intent": vals.get("intent"),
            "extracted_symptoms": vals.get("extracted_symptoms"),
            "scale_locked": vals.get("scale_locked"),
            "refuse_count": vals.get("refuse_count"),
            "recommendation_cooldown": vals.get("recommendation_cooldown"),
            "crisis_detected": vals.get("crisis_detected"),
            "last_node": vals.get("last_node"),
            "recommended_scales": vals.get("recommended_scales"),
            "recent_messages": messages_summary,
        }
    except Exception as exc:
        return {"error": str(exc), "thread_id": thread_id}


@app.post("/api/agent/summarize/{session_id}")
async def summarize_session(session_id: int, background_tasks: BackgroundTasks):
    from graph.nodes.summary import run_session_summary

    background_tasks.add_task(run_session_summary, session_id)
    return {"ok": True, "message": "summary task queued"}


if __name__ == "__main__":
    uvicorn.run("main:app", host=config.AGENT_HOST, port=config.AGENT_PORT, reload=True)


from __future__ import annotations

from langgraph.graph import END, StateGraph

try:
    from graph.edges import after_crisis, after_router, after_recommendation_planner
    from graph.nodes.crisis import crisis_node
    from graph.nodes.direct_recommend import direct_recommend_node
    from graph.nodes.empathy import empathy_node
    from graph.nodes.evidence_extractor import evidence_extractor_node
    from graph.nodes.lock import lock_node
    from graph.nodes.recommendation_planner import recommendation_planner_node
    from graph.nodes.router import router_node
    from graph.nodes.strategic_clarify import strategic_clarify_node
    from memory.checkpointer import get_checkpointer
    from models.state import PsyState
except ModuleNotFoundError:
    from agent.graph.edges import after_crisis, after_router, after_recommendation_planner
    from agent.graph.nodes.direct_recommend import direct_recommend_node
    from agent.graph.nodes.evidence_extractor import evidence_extractor_node
    from agent.graph.nodes.recommendation_planner import recommendation_planner_node
    from agent.graph.nodes.strategic_clarify import strategic_clarify_node
    from agent.models.state import PsyState
    # These modules rely on the original repo runtime and are expected after merge.
    from graph.nodes.crisis import crisis_node
    from graph.nodes.empathy import empathy_node
    from graph.nodes.lock import lock_node
    from graph.nodes.router import router_node
    from memory.checkpointer import get_checkpointer


def build_graph() -> StateGraph:
    graph = StateGraph(PsyState)

    graph.add_node("crisis", crisis_node)
    graph.add_node("router", router_node)
    graph.add_node("evidence_extractor", evidence_extractor_node)
    graph.add_node("recommendation_planner", recommendation_planner_node)
    graph.add_node("direct_recommend", direct_recommend_node)
    graph.add_node("strategic_clarify", strategic_clarify_node)
    graph.add_node("empathy", empathy_node)
    graph.add_node("lock", lock_node)

    graph.set_entry_point("crisis")
    graph.add_conditional_edges("crisis", after_crisis, {"crisis_end": END, "router": "router"})
    graph.add_conditional_edges("router", after_router, {"lock": "lock", "evidence_extractor": "evidence_extractor"})
    graph.add_edge("evidence_extractor", "recommendation_planner")
    graph.add_conditional_edges(
        "recommendation_planner",
        after_recommendation_planner,
        {
            "direct_recommend": "direct_recommend",
            "strategic_clarify": "strategic_clarify",
            "empathy": "empathy",
        },
    )
    graph.add_edge("direct_recommend", END)
    graph.add_edge("strategic_clarify", END)
    graph.add_edge("empathy", END)
    graph.add_edge("lock", END)

    checkpointer = get_checkpointer()
    return graph.compile(checkpointer=checkpointer)

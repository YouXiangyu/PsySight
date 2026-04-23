from __future__ import annotations

from langgraph.graph import END, StateGraph

from graph.edges import after_crisis, after_router
from graph.nodes.crisis import crisis_node
from graph.nodes.empathy import empathy_node
from graph.nodes.lock import lock_node
from graph.nodes.router import router_node
from graph.nodes.test_handoff import test_handoff_node
from memory.checkpointer import get_checkpointer
from models.state import PsyState


def build_graph() -> StateGraph:
    graph = StateGraph(PsyState)

    graph.add_node("crisis", crisis_node)
    graph.add_node("router", router_node)
    graph.add_node("empathy", empathy_node)
    graph.add_node("lock", lock_node)
    graph.add_node("test_handoff", test_handoff_node)

    graph.set_entry_point("crisis")

    graph.add_conditional_edges(
        "crisis",
        after_crisis,
        {"crisis_end": END, "router": "router"},
    )

    graph.add_conditional_edges(
        "router",
        after_router,
        {"empathy": "empathy", "lock": "lock", "test_handoff": "test_handoff"},
    )

    graph.add_edge("empathy", END)
    graph.add_edge("lock", END)
    graph.add_edge("test_handoff", END)

    checkpointer = get_checkpointer()
    return graph.compile(checkpointer=checkpointer)

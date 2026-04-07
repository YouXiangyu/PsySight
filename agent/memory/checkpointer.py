from __future__ import annotations

from langgraph.checkpoint.memory import MemorySaver


def get_checkpointer() -> MemorySaver:
    """Return a checkpointer for LangGraph state persistence.

    Using MemorySaver for now (in-process, lost on restart).
    Can be upgraded to SqliteSaver / PostgresSaver for production.
    """
    return MemorySaver()

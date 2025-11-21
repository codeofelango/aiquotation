from typing import Any, Dict

try:
	from langgraph.graph import StateGraph, END
	_HAS_LANGGRAPH = True
except Exception:
	_HAS_LANGGRAPH = False

from . import data_collector, embedding_agent, ranking_agent, feedback_agent, experiment_agent, learning_agent


async def run_recommendation_graph(state: Dict[str, Any]) -> Dict[str, Any]:
	"""
	Builds a minimal multi-agent flow. If langgraph is unavailable, falls back to sequential execution.
	"""
	if not _HAS_LANGGRAPH:
		state = await data_collector.run(state)
		state = await embedding_agent.run(state)
		state = await ranking_agent.run(state)
		state = await feedback_agent.run(state)
		state = await experiment_agent.run(state)
		state = await learning_agent.run(state)
		return state

	# LangGraph path
	graph = StateGraph(dict)
	graph.add_node("data_collector", data_collector.run)
	graph.add_node("embedding_agent", embedding_agent.run)
	graph.add_node("ranking_agent", ranking_agent.run)
	graph.add_node("feedback_agent", feedback_agent.run)
	graph.add_node("experiment_agent", experiment_agent.run)
	graph.add_node("learning_agent", learning_agent.run)

	graph.set_entry_point("data_collector")
	graph.add_edge("data_collector", "embedding_agent")
	graph.add_edge("embedding_agent", "ranking_agent")
	graph.add_edge("ranking_agent", "feedback_agent")
	graph.add_edge("feedback_agent", "experiment_agent")
	graph.add_edge("experiment_agent", "learning_agent")
	graph.add_edge("learning_agent", END)

	app = graph.compile()
	final_state = await app.ainvoke(state)
	return final_state



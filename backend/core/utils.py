from datetime import datetime, timezone
from typing import Iterable, List


def now_utc() -> datetime:
	return datetime.now(timezone.utc)


def to_pgvector_literal(vec: Iterable[float]) -> str:
	# pgvector accepts '[v1, v2, ...]' literal; we keep limited precision for size
	return "[" + ",".join(f"{float(v):.6f}" for v in vec) + "]"



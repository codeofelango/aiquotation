import os
from pathlib import Path
from dataclasses import dataclass
from typing import Optional


def _manual_load_env_file(path: Path) -> None:
	if not path.exists():
		return
	encodings = ("utf-8", "utf-16", "utf-16-le", "utf-16-be", "latin-1")
	for enc in encodings:
		try:
			with open(path, "r", encoding=enc) as f:
				for raw_line in f:
					line = raw_line.strip()
					if not line or line.startswith("#") or "=" not in line:
						continue
					key, value = line.split("=", 1)
					key = key.strip()
					value = value.strip().strip('"').strip("'")
					if key and key not in os.environ:
						os.environ[key] = value
			break
		except Exception:
			continue


def _load_environment() -> None:
	try:
		from dotenv import load_dotenv, find_dotenv
	except Exception:
		load_dotenv = None
		find_dotenv = None

	backend_dir = Path(__file__).parent.parent
	candidates = [
		backend_dir / ".env",
		backend_dir / ".env.local",
		backend_dir.parent / ".env",
		backend_dir.parent / ".env.local",
	]

	if load_dotenv is not None:
		for p in candidates:
			if p.exists():
				load_dotenv(dotenv_path=p, override=False)
		if find_dotenv is not None:
			found = find_dotenv(usecwd=True)
			if found:
				load_dotenv(found, override=False)

	# Fallback manual parsing (handles alternate encodings)
	for p in candidates:
		_manual_load_env_file(p)


_load_environment()


@dataclass(frozen=True)
class Settings:
	database_url: str
	ml_api_base_url: str
	ml_api_key: str
	embedding_model_name: str
	rerank_model_name: str
	llm_model_name: str
	backend_host: str = "0.0.0.0"
	backend_port: int = 8000


_settings: Optional[Settings] = None


def _get_database_url_from_env() -> str:
	candidates = (
		"DATABASE_URL",
		"DATABASE_URI",
		"POSTGRES_URL",
		"PGDATABASE_URL",
		"DB_URL",
	)
	for key in candidates:
		value = os.getenv(key)
		if value:
			return value

	# Attempt to construct from discrete components if no single URL provided.
	host = os.getenv("POSTGRES_HOST") or os.getenv("DB_HOST") or os.getenv("PGHOST")
	port = os.getenv("POSTGRES_PORT") or os.getenv("DB_PORT") or os.getenv("PGPORT") or "5432"
	database = os.getenv("POSTGRES_DB") or os.getenv("DB_NAME") or os.getenv("PGDATABASE")
	user = os.getenv("POSTGRES_USER") or os.getenv("DB_USER") or os.getenv("PGUSER")
	password = os.getenv("POSTGRES_PASSWORD") or os.getenv("DB_PASSWORD") or os.getenv("PGPASSWORD")

	# If we have at least host, database, and user we can synthesize a URL.
	if host and database and user:
		pw_segment = f":{password}" if password else ""
		return f"postgresql://{user}{pw_segment}@{host}:{port}/{database}"

	return ""


def get_settings() -> Settings:
	global _settings
	if _settings is None:
		_settings = Settings(
			database_url=_get_database_url_from_env(),
			ml_api_base_url=os.getenv("ML_API_BASE_URL", "https://api.euron.one/api/v1/euri"),
			ml_api_key=os.getenv("ML_API_KEY", ""),
			embedding_model_name=os.getenv("EMBEDDING_MODEL_NAME", "M2-BERT-80M-32K-Retrieval"),
			rerank_model_name=os.getenv("RERANK_MODEL_NAME", "Qwen-3-32B"),
			llm_model_name=os.getenv("LLM_MODEL_NAME", "GPT-5-Mini"),
			backend_host=os.getenv("BACKEND_HOST", "0.0.0.0"),
			backend_port=int(os.getenv("BACKEND_PORT", "8000")),
		)
	return _settings


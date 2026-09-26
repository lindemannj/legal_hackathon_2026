"""Configuration and paths for the standalone Python backend."""

import os
from dataclasses import dataclass
from pathlib import Path

from dotenv import load_dotenv


BACKEND_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BACKEND_DIR / ".env")


def _boolean(name: str, default: bool = False) -> bool:
    value = os.getenv(name, str(default)).lower()
    if value not in {"true", "false"}:
        raise ValueError(f"{name} muss true oder false sein")
    return value == "true"


@dataclass(frozen=True)
class Settings:
    port: int
    frontend_origin: str
    database_path: Path
    seed_path: Path
    seed_on_start: bool
    demo_mode: bool
    demo_passwort: str
    jwt_secret: str


def settings() -> Settings:
    database_url = os.getenv("DATABASE_URL", "file:./dev.db")
    if not database_url.startswith("file:"):
        raise ValueError("DATABASE_URL muss ein SQLite-Pfad mit file: sein")
    database_name = database_url.removeprefix("file:")
    if not database_name:
        raise ValueError("DATABASE_URL enthält keinen Pfad")
    database_path = Path(database_name)
    if not database_path.is_absolute():
        # Prisma resolves file: URLs relative to prisma/schema.prisma.
        database_path = BACKEND_DIR / "prisma" / database_path

    seed_path = Path(os.getenv("SEED_PATH", "../seed/demo-daten.txt"))
    if not seed_path.is_absolute():
        seed_path = BACKEND_DIR / seed_path

    port = int(os.getenv("PORT", "3001"))
    if not 1 <= port <= 65535:
        raise ValueError("PORT muss zwischen 1 und 65535 liegen")
    demo_passwort = os.getenv("DEMO_PASSWORT", "")
    jwt_secret = os.getenv("JWT_SECRET", "")
    if not demo_passwort or not jwt_secret:
        raise ValueError("DEMO_PASSWORT und JWT_SECRET sind erforderlich")
    return Settings(
        port=port,
        frontend_origin=os.getenv("FRONTEND_ORIGIN", "http://localhost:8080"),
        database_path=database_path.resolve(),
        seed_path=seed_path.resolve(),
        seed_on_start=_boolean("SEED_ON_START"),
        demo_mode=_boolean("DEMO_MODE"),
        demo_passwort=demo_passwort,
        jwt_secret=jwt_secret,
    )

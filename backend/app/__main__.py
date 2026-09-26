"""Commands: python -m app serve|seed|reset."""

import argparse

import uvicorn

from .config import settings
from .seed import reset_database, seed_database


def main() -> None:
    parser = argparse.ArgumentParser(description="Klaris Python-Backend")
    parser.add_argument("command", choices=("serve", "seed", "reset"), nargs="?", default="serve")
    args = parser.parse_args()
    config = settings()
    if args.command == "seed":
        seed_database(config)
    elif args.command == "reset":
        reset_database(config)
    else:
        uvicorn.run("app.main:app", host="0.0.0.0", port=config.port)


if __name__ == "__main__":
    main()

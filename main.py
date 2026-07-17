"""Top-level ASGI entrypoint.

This file re-exports the FastAPI `app` defined in `fast_api/main.py` so
commands like `uvicorn main:app --reload` work from the repository root.
"""

from fast_api.main import app


if __name__ == "__main__":
    # Allow running with `python main.py` for local development
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

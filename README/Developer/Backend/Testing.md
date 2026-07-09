## Backend Testing

This project uses pytest for integration tests that exercise the Services/Drivers against a MongoDB instance. The test suite expects a MongoDB instance with the fixtures referenced by the tests (object ids in `tests/test_routes.py`).

### What the test fixture does

A session-scoped pytest fixture automatically creates a minimal Flask app and pushes an app context.

### Environment variables used by tests

- `MONGODB_URI` -- required. The MongoDB connection URI used by tests and by the app.
- `MONGODB_NAME` -- optional. If set, this will be used as the database name for both runtime and testing connections.

### Run tests locally

```bash
pytest -q Backend/tests/test_routes.py
```

### CI notes (GitHub Actions)

The workflow `.github/workflows/RouteTesting.yml` has been updated: tests no longer start a background Flask server. The workflow sets `MONGODB_URI` and `MONGODB_NAME` from secrets and runs `pytest` with `PYTHONPATH` pointing at `Backend`.

### Quality gates to run after making changes

- Lint / static checks: ensure no syntax errors (`python -m pyflakes` or your preferred linter)
- Unit / integration tests: run `pytest -q Backend/tests/test_routes.py` (or the subset you changed)
- Smoke test: import the backend services to ensure there are no import-time errors

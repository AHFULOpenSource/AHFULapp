from functools import wraps
from flask import request, jsonify, g
from Services.VerificationDriver import VerificationDriver
import asyncio


def _authenticate_session(verifyFn):
    """Extract session cookies and validate via the given VerificationDriver method."""
    userId = request.cookies.get("session_id")
    magicBits = request.cookies.get("magic_bits")
    if not userId:
        return None, (
            jsonify({"authenticated": False, "error": "We require goodies to enter."}),
            401,
        )

    if not magicBits:
        return None, (
            jsonify({"authenticated": False, "error": "The Dragon roared too Loudly for your Magic."}),
            401,
        )

    magicBits = magicBits[-32:]

    user, err = verifyFn(userId, magicBits)
    if err:
        return None, (
            jsonify({"authenticated": False, "error": f"Invalid session token. Hint: {err}"}),
            401,
        )

    return (user, userId, magicBits), None


def login_required_unverified(f):
    @wraps(f)
    async def decorated_function(*args, **kwargs):
        authData, errResponse = _authenticate_session(VerificationDriver.confirm_user_unverified)
        if errResponse:
            return errResponse

        user, userId, magicBits = authData
        g.user_id = userId
        g.token = magicBits
        g.email = (user.get("email") or "").strip().lower()

        if "Admin" in user["roles"]:
            g.role = "Admin"
        elif "Developer" in user["roles"]:
            g.role = "Developer"
        else:
            g.role = "User"

        if asyncio.iscoroutinefunction(f):
            return await f(*args, **kwargs)
        return f(*args, **kwargs)
    return decorated_function


def login_required_user(f):
    @wraps(f)
    async def decorated_function(*args, **kwargs):
        authData, errResponse = _authenticate_session(VerificationDriver.confirm_user_login)
        if errResponse:
            return errResponse

        user, userId, magicBits = authData
        g.user_id = userId
        g.token = magicBits
        g.email = (user.get("email") or "").strip().lower()

        if "Admin" in user["roles"]:
            g.role = "Admin"
        elif "Developer" in user["roles"]:
            g.role = "Developer"
        else:
            g.role = "User"

        # If the wrapped route is async, run it in a fresh event loop.
        # Keeping the decorator itself synchronous avoids forcing Flask to
        # treat every view as a coroutine (which triggers asgiref/ensure_sync
        # and can block in WSGI/gunicorn sync workers).
        if asyncio.iscoroutinefunction(f):
            return await f(*args, **kwargs)
        return f(*args, **kwargs)
    return decorated_function


def login_required_dev(f):
    @wraps(f)
    async def decorated_function(*args, **kwargs):
        authData, errResponse = _authenticate_session(VerificationDriver.confirm_user_developer)
        if errResponse:
            return errResponse

        _, userId, magicBits = authData
        g.user_id = userId
        g.token = magicBits
        g.role = "Developer"

        if asyncio.iscoroutinefunction(f):
            return await f(*args, **kwargs)
        return f(*args, **kwargs)
    return decorated_function


def login_required_admin(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        authData, errResponse = _authenticate_session(VerificationDriver.confirm_user_admin)
        if errResponse:
            return errResponse

        _, userId, magicBits = authData
        g.user_id = userId
        g.token = magicBits
        g.role = "Admin"

        return f(*args, **kwargs)
    return decorated_function


def login_required_gym_owner(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        authData, errResponse = _authenticate_session(VerificationDriver.confirm_user_gym_owner)
        if errResponse:
            return errResponse

        _, userId, magicBits = authData
        g.user_id = userId
        g.token = magicBits
        g.role = "Developer"

        return f(*args, **kwargs)
    return decorated_function

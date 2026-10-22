from flask import  Blueprint, request, jsonify, g
from google.adk.runners import InMemoryRunner
from google.genai import types
import character
import asyncio
from dotenv import load_dotenv
load_dotenv()
from Auth.verification import login_required_user, login_required_dev, login_required_admin, login_required_gym_owner

chatRouteBlueprint = Blueprint("chat", __name__,  url_prefix="/AHFULchats")

adk_session = None
session_lock = asyncio.Lock()

# Use a dictionary to store sessions by user ID instead of a single global variable
active_adk_sessions = {}

runner = InMemoryRunner(
    agent=character.root_agent,
    app_name="AHFUL App",
)

@chatRouteBlueprint.route("/", methods=["POST"])
@login_required_user
async def chat():
    user_message = request.json.get("message")

    # 1. Pull the actual user ID from your web framework's auth mechanism
    # (e.g., from a browser cookie, JWT, or session state)
    actual_user_id = g.user_id  #<-- The dynamic ID is injected here with g from Flask's request context. This ensures that each user gets their own session.
    
    if not actual_user_id:
        return {"error": "User not authenticated"}

    # 2. Get or create an ADK session specifically for THIS user
    if actual_user_id not in active_adk_sessions:
        async with session_lock:
            # Double-check inside the lock to prevent race conditions
            if actual_user_id not in active_adk_sessions:
                active_adk_sessions[actual_user_id] = await runner.session_service.create_session(
                    app_name=runner.app_name, 
                    user_id=actual_user_id   
                )
    
    # 3. Retrieve the correct session for the current request
    user_adk_session = active_adk_sessions[actual_user_id]

    content = types.Content(parts=[types.Part(text=user_message)])
    response_text = ""
    async for event in runner.run_async(
        user_id=user_adk_session.user_id,
        session_id=user_adk_session.id,
        new_message=content,
    ):
        if event.content and event.content.parts and event.content.parts[0].text:
            response_text += event.content.parts[0].text

    return jsonify({'response': response_text})
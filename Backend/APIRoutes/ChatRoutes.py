from flask import  Blueprint, request, jsonify
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

runner = InMemoryRunner(
    agent=character.root_agent,
    app_name="AHFUL App",
)

@chatRouteBlueprint.route("/", methods=["POST"])
@login_required_user
async def chat():
    user_message = request.json.get("message")

    global adk_session
    if adk_session is None:
        async with session_lock:
            if adk_session is None:
                adk_session = await runner.session_service.create_session(
                    app_name=runner.app_name, user_id="inapp_user"
                )

    content = types.Content(parts=[types.Part(text=user_message)])
    response_text = ""
    async for event in runner.run_async(
        user_id=adk_session.user_id,
        session_id=adk_session.id,
        new_message=content,
    ):
        if event.content and event.content.parts and event.content.parts[0].text:
            #TODO: testing to see what the RAW response from Google is in event.content.parts
            print("Google Response:", event.content.parts)
            response_text += event.content.parts[0].text

            #TODO: Driver call to store new workout part back to DB under User. 
            #TODO: DURING storage Check WHAT GOOGLE GAVE was valid. 
            #TODO: Send response back to Frontend to have user decide to store. 

    return jsonify({'response': response_text})
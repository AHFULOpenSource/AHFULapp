import logging
import os
from google.adk.agents.llm_agent import LlmAgent

from pydantic import BaseModel
from google.adk.agents import Agent

# 1. Map the exact structure from your screenshot
class Exercise(BaseModel):
    name: str                           # e.g., "AHFUL Squat"
    targetMuscles: list[str]            # e.g., ["quadriceps"]
    bodyParts: list[str]                # e.g., ["legs"]
    equipments: list[str]               
    secondaryMuscles: list[str]         # e.g., ["glutes", "hamstrings"]
    instructions: list[str]             # e.g., ["1. Stand with feet...", "2. Sit back..."]

# 2. Wrap it in the payload for the tool
class WorkoutPlan(BaseModel):
    target_track: str 
    exercises: list[Exercise]

# 3. Define the tool
# This is the tool your app exposes to the agent
def save_template_plan(plan: WorkoutPlan) -> str:
    """Use this tool ONLY when you have determined the user's workout goals and generated their custom workout."""
    # In your app code, this is where you save to DB or send to the frontend UI
    print(f"Generated a {plan.difficulty_level} {plan.target_track} workout!")
    # Return a message so the agent knows it succeeded and can say goodbye to the user
    return "Workout plan successfully saved to the application."

# Define the agent
root_agent = LlmAgent(
    name="companion_fitness_coach",
    model="gemini-3.5-flash",
    instruction="""You are an expert fitness coach. You are looking to start a friendly conversation
    with the user to figure out their fitness goals (e.g., hypertrophy, mobility, HIIT, Maintainance, etc.) 
    and their current fitness level (e.g., beginner, intermediate, advanced),and which muscle groups to target.
    Once you agree on a direction, generate a list of appropriate exercises using your expert knowledge.
    Generate a list of exercises based on their needs. You must break down each exercise into 
    specific target muscles, secondary muscles, required equipment, and step-by-step instructions.
    """,
    #When ready, you MUST call the `save_template_plan` tool to save it.
   #tools=[save_template_plan]
)

#Services & Drivers know how to implement business Logic related to the Route operations.
#   Intermediate between Routes and Objects.  Ensures validations and rules are applied before
#   Calling Objects to interact with DB
from DataModels.WorkoutObject import WorkoutObject
from DataModels.UserObject import UserObject
from DataModels.GymObject import GymObject
from bson import ObjectId, errors as bson_errors


# The WorkoutDriver is responsible for implementing the business logic related to workout operations.
#   It acts as an intermediary between the API routes and the data models,
#   ensuring that all necessary validations and rules are applied before interacting with
#   the database.
class WorkoutDriver:
    # ── Helper ─────────────────────────────────────────────────────────────────
    @staticmethod
    def _validate_obj_id(id, name):
        try:
            return ObjectId(str(id)), None
        except (bson_errors.InvalidId, TypeError, ValueError):
            return None, f"Invalid {name} format; must be a 24-hex string"

    @staticmethod
    def verify_operation(user_id, workout_id):
        if (not user_id) or (not workout_id):
            return None, "Missing user or workout_id"

        # Convert IDs safely
        user_id, err = WorkoutDriver._validate_obj_id(user_id, "user_id")
        if err:
            return None, err
        # Convert IDs safely
        workout_id, err = WorkoutDriver._validate_obj_id(workout_id, "workout_id")
        if err:
            return None, err

        user = UserObject.find_by_id(user_id)
        if not user:
            return None, "User not found"
        workout = WorkoutObject.find_by_id(workout_id)
        if not workout:
            return None, "Food not found"

        if user["_id"] == workout["user_id"]:
            return "Operation valid", None
        elif ("Admin" in user["roles"]) or ("Developer" in user["roles"]):
            return "Operation valid", None
        else:
            return None, "You must operate on your own object or have sufficient privileges"

    # ── Create ─────────────────────────────────────────────────────────────────
    @staticmethod
    def create_workout(user_id, gym_id, title, startTime, endTime):
        # Validate required fields
        if (not user_id) or (startTime is None):
            return None, "You are missing a user_id or startTime. Please fix, then attempt to create workout again"

        oid, err = WorkoutDriver._validate_obj_id(user_id, "user_id")
        if err:
            return None, err
        gym_oid = None
        if gym_id is not None:
            gym_oid, err = WorkoutDriver._validate_obj_id(gym_id, "gym_id")
            if err:
                return None, err

        # Ensure the user exists
        user = UserObject.find_by_id(user_id)
        if not user:
            return None, "User not found"

        # Ensure the gym exists if provided
        if gym_oid is not None:
            # GymObject.find_by_id requires both gym id and the requesting user's id
            gym = GymObject.find_by_id(gym_id, user_id)
            if not gym:
                return None, "Gym not found or inaccessible"

        workout_data = {
            "user_id": ObjectId(user_id),
            "title": title,
            "startTime": int(startTime),
            "endTime": int(endTime),
            "template": False,
            "gym_id": ObjectId(gym_id)
        }

        try:
            response = WorkoutObject.create(workout_data)
            return response, None
        except Exception as e:
            return None, str(e)

    # ── Read ─────────────────────────────────────────────────────────────────
    @staticmethod
    def get_all_workouts():
        try:
            workouts = WorkoutObject.find_all()
            return workouts, None
        except Exception as e:
            return None, str(e)

    @staticmethod
    def get_workout_by_id(id):
        if (not id):
            return None, "You are missing a workout id. Please fix, then attempt to create workout again"
        oid, err = WorkoutDriver._validate_obj_id(id, "workout_id")
        if err:
            return None, err
        try:
            workout = WorkoutObject.find_by_id(oid)
            if not workout:
                return None, "Workout not found"
            return workout, None
        except Exception as e:
            return None, str(e)

    @staticmethod
    def get_workouts_by_user(user_id):
        if (not user_id):
            return None, "You are missing a user id. Please fix, then attempt to create workout again"
        oid, err = WorkoutDriver._validate_obj_id(user_id, "user_id")
        if err:
            return None, err
        try:
            workouts = WorkoutObject.find_by_user(user_id)
            if not workouts:
                return None, "Workout not found"
            return workouts, None
        except Exception as e:
            return None, str(e)

    # ── Update ─────────────────────────────────────────────────────────────────
    @staticmethod
    def update_workout(id, updates):
        # Validate target id
        if not id:
            return None, "You must provide a workout id to update"

        obj, err = WorkoutDriver._validate_obj_id(id, "workout_id")
        if err:
            return None, err

        if not updates:
            return None, "You must provide at least one field to update"

        if updates.get("gym_id"):
            updates["gym_id"] = ObjectId(updates["gym_id"])

        # Allowed fields to update
        allowed_fields = {
            "title",
            "startTime",
            "endTime",
            "gym_id"
        }

        # Filter only allowed fields
        sanitized_updates = {k: v for k, v in updates.items() if k in allowed_fields}

        # Perform the update via the data model
        updated = WorkoutObject.update(id, sanitized_updates)
        if not updated:
            return None, "Workout not found or no changes applied"
        else:
            return updated, None

    # ── Delete ─────────────────────────────────────────────────────────────────
    @staticmethod
    def delete_workout(id):
        # Validate input
        if not id:
            return None, "You must provide a workout id to delete"
        oid, err = WorkoutDriver._validate_obj_id(id, "workout_id")
        if err:
            return None, err

        try:
            response = WorkoutObject.delete(id)
            if not response:
                # Either not found, or already removed
                return None, "Workout not found or already deleted"
            return response, None
        except Exception as e:
            return None, str(e)
    # ── Streak Calculation ─────────────────────────────────────────────────────
    @staticmethod
    def get_streak(user_id):
        try:
            # Validate user_id
            if not user_id:
                return None, "User ID is required"

            oid, err = WorkoutDriver._validate_obj_id(user_id, "user_id")
            if err:
                return None, err

            # Get all workouts for user, sorted by startTime descending
            workouts = WorkoutObject.find_by_user(user_id)
            if not workouts:
                return {"streak": 0, "lastWorkoutDate": None}, None

            from datetime import datetime, timedelta

            # Extract unique dates (calendar days) from workouts
            dates = set()
            for workout in workouts:
                if workout.get("startTime"):
                    # Convert timestamp to date
                    dt = datetime.fromtimestamp(workout["startTime"])
                    dates.add(dt.date())

            if not dates:
                return {"streak": 0, "lastWorkoutDate": None}, None

            # Sort dates in descending order
            sorted_dates = sorted(dates, reverse=True)
            today = datetime.now().date()
            yesterday = today - timedelta(days=1)

            # Check if most recent workout was today or yesterday
            most_recent = sorted_dates[0]
            if most_recent not in [today, yesterday]:
                # Streak is broken - no activity today or yesterday
                return {"streak": 0, "lastWorkoutDate": str(most_recent)}, None

            # Count consecutive days
            streak = 1
            for i in range(len(sorted_dates) - 1):
                current_date = sorted_dates[i]
                next_date = sorted_dates[i + 1]
                expected_prev = current_date - timedelta(days=1)

                if next_date == expected_prev:
                    streak += 1
                else:
                    break

            return {"streak": streak, "lastWorkoutDate": str(most_recent)}, None
        except Exception as e:
            return None, str(e)

    # ── Favorite ───────────────────────────────────────────────────────────────
    @staticmethod
    def toggle_favorite(user_id, workout_id):
        """Toggle favorite status of a workout."""
        # Validate inputs
        if not user_id or not workout_id:
            return None, "user_id and workout_id are required"

        # Validate workout_id format
        workout_oid, err = WorkoutDriver._validate_obj_id(workout_id, "workout_id")
        if err:
            return None, err

        try:
            # Check that workout exists and belongs to user
            workout = WorkoutObject.find_by_id(workout_oid)
            if not workout:
                return None, "Workout not found"

            # Verify user owns the workout
            if str(workout.get("user_id")) != str(user_id):
                return None, "You can only modify your own workouts"

            updated = WorkoutObject.toggle_favorite(workout_oid)
            if not updated:
                return None, "Workout not found"
            return updated, None
        except Exception as e:
            return None, str(e)

    @staticmethod
    def get_favorite_workouts(user_id):
        """Get all favorite workouts for a user."""
        if not user_id:
            return None, "user_id is required"

        oid, err = WorkoutDriver._validate_obj_id(user_id, "user_id")
        if err:
            return None, err

        try:
            workouts = WorkoutObject.find_favorites_by_user(user_id)
            return workouts, None
        except Exception as e:
            return None, str(e)

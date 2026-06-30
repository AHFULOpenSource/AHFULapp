#Services & Drivers know how to implement business Logic related to the Route operations.
#   Intermediate between Routes and Objects.  Ensures validations and rules are applied before
#   Calling Objects to interact with DB
from DataModels.PersonalExObject import PersonalExObject
from DataModels.UserObject import UserObject
from DataModels.WorkoutObject import WorkoutObject
from DataModels.ExerciseObject import ExerciseObject
from bson import ObjectId, errors as bson_errors


# The PersonalExDriver is responsible for implementing the business logic related to personalEx operations.
#   It acts as an intermediary between the API routes and the data models,
#   ensuring that all necessary validations and rules are applied before interacting with
#   the database.
class PersonalExDriver:
    # ── Helper ─────────────────────────────────────────────────────────────────
    @staticmethod
    def _validate_obj_id(id, name):
        try:
            return ObjectId(str(id)), None
        except (bson_errors.InvalidId, TypeError, ValueError):
            return None, f"Invalid {name} format; must be a 24-hex string"
        
    @staticmethod
    def verify_operation(user_id, pe_id):
        if (not user_id) or (not pe_id):
            return None, "Missing user or pe_id"
        
        # Convert IDs safely
        user_id, err = PersonalExDriver._validate_obj_id(user_id, "user_id")
        if err:
            return None, err
        # Convert IDs safely
        pe_id, err = PersonalExDriver._validate_obj_id(pe_id, "pe_id")
        if err:
            return None, err
        
        user = UserObject.find_by_id(user_id)
        if not user:
            return None, "User not found"
        pe = PersonalExObject.find_by_id(pe_id)
        if not pe:
            return None, "PersonalEx not found"
        
        if user["_id"] == pe["user_id"]:
            return "Operation valid", None
        elif ("Admin" in user["roles"]) or ("Developer" in user["roles"]):
            return "Operation valid", None
        else:
            return None, "You must operate on your own object or have sufficient privileges"

    # ── Create ─────────────────────────────────────────────────────────────────
    @staticmethod
    def create_personal_ex(user_id, exercise_id, workout_id, reps, sets, weight, duration, distance, complete, template=None):
        # Validate required fields
        if (not user_id) or (not exercise_id) or (not workout_id):
            return None, "You are missing a user_id, workout_id or exercise_id. Please fix, then attempt to create personalEx again"

        oidU, err = PersonalExDriver._validate_obj_id(user_id, "user_id")
        if err:
            return None, err
        oidW, err = PersonalExDriver._validate_obj_id(workout_id, "workout_id")
        if err:
            return None, err
        oidE, err = PersonalExDriver._validate_obj_id(exercise_id, "exercise_id")
        if err:
            return None, err

        # Ensure the user exists
        user = UserObject.find_by_id(user_id)
        if not user:
            return None, "User not found"

        # Ensure the exercise exists, in data base or external
        exercise = ExerciseObject.find_by_id(exercise_id)
        if not exercise:
            return None, "Exercise not found"

        # Ensure the workout exists
        if not template:
            workout = WorkoutObject.find_by_id(workout_id)
            if not workout:
                return None, "workout not found"
        else:
            template = WorkoutObject.find_template(workout_id)
            if not template:
                return None, "template not found"


        personal_ex_data = {
            "user_id": ObjectId(user_id),
            "exercise_id": ObjectId(exercise_id),
            "workout_id": ObjectId(workout_id),
            "reps": int(reps),
            "sets": int(sets),
            "weight": int(weight) if str(weight).isdigit() else weight, # sets to int if possible
            "duration": int(duration) if str(duration).isdigit() else duration, # sets to int if possible
            "distance": int(distance) if str(distance).isdigit() else distance, # sets to int if possible
            "complete": complete
        }

        try:
            response = PersonalExObject.create(personal_ex_data)
            return response, None
        except Exception as e:
            return None, str(e)

    # ── Read ─────────────────────────────────────────────────────────────────
    @staticmethod
    def get_all_personal_exs():
        try:
            personalExs = PersonalExObject.find_all()
            if not personalExs:
                return None, "PersonalEx not found"
            return personalExs, None
        except Exception as e:
            return None, str(e)

    @staticmethod
    def get_personal_ex_by_id(id):
        if not id:
            return None, "You must provide a personal ex id to grab"
        oid, err = PersonalExDriver._validate_obj_id(id, "personal ex id")
        if err:
            return None, err
        try:
            personalEx = PersonalExObject.find_by_id(id)
            if not personalEx:
                return None, "PersonalEx not found"
            return personalEx, None
        except Exception as e:
            return None, str(e)

    @staticmethod
    def get_personal_exs_by_user(user_id):
        if not user_id:
            return None, "You must provide a user id to grab"
        oid, err = PersonalExDriver._validate_obj_id(user_id, "user_id")
        if err:
            return None, err
        try:
            personalEx = PersonalExObject.find_by_user(user_id)
            if not personalEx:
                return None, "PersonalEx not found"
            return personalEx, None
        except Exception as e:
            return None, str(e)

    @staticmethod
    def get_personal_exs_by_workout(workout_id):
        # Validate target id
        if not workout_id:
            return None, "You must provide a workout id to update"
        oid, err = PersonalExDriver._validate_obj_id(workout_id, "workout_id")
        if err:
            return None, err
        try:
            personalEx = PersonalExObject.find_by_workout(workout_id)
            if not personalEx:
                return None, "PersonalEx not found"
            return personalEx, None
        except Exception as e:
            return None, str(e)

    # ── Update ─────────────────────────────────────────────────────────────────
    @staticmethod
    def update_personal_ex(id, updates):
        # Validate target id
        if not id:
            return None, "You must provide a personal ex id to update"

        obj, err = PersonalExDriver._validate_obj_id(id, "personal_ex_id")
        if err:
            return None, err

        if not updates:
            return None, "You must provide at least one field to update"

        # Allowed fields to update
        allowed_fields = {
            "reps",
            "sets",
            "weight",
            "duration",
            "distance",
            "complete",
        }

        # Filter only allowed fields
        sanitized_updates = {k: v for k, v in updates.items() if k in allowed_fields}

        # Perform the update via the data model
        updated = PersonalExObject.update(id, sanitized_updates)
        if not updated:
            return None, "PersonalEx not found or no changes applied"
        else:
            return updated, None

    # ── Delete ─────────────────────────────────────────────────────────────────
    @staticmethod
    def delete_personal_ex(id):
        # Validate input
        if not id:
            return None, "You must provide a personal ex id to delete"
        obj, err = PersonalExDriver._validate_obj_id(id, "personal_ex_id")
        if err:
            return None, err

        try:
            response = PersonalExObject.delete(id)
            if not response:
                # Either not found, or already removed
                return None, "Personal ex not found or already deleted"
            return response, None
        except Exception as e:
            return None, str(e)

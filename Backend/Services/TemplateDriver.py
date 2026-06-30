#Services & Drivers know how to implement business Logic related to the Route operations.
#   Intermediate between Routes and Objects.  Ensures validations and rules are applied before
#   Calling Objects to interact with DB
from DataModels.TemplateObject import TemplateObject
from DataModels.UserObject import UserObject
from bson import ObjectId, errors as bson_errors
from datetime import datetime



# The TemplateDriver is responsible for implementing the business logic related to template operations.
#   It acts as an intermediary between the API routes and the data models,
#   ensuring that all necessary validations and rules are applied before interacting with
#   the database.
class TemplateDriver:

    # ── HELPER ─────────────────────────────────────────────────────────────────
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
        user_id, err = TemplateDriver._validate_obj_id(user_id, "user_id")
        if err:
            return None, err
        # Convert IDs safely
        workout_id, err = TemplateDriver._validate_obj_id(workout_id, "workout_id")
        if err:
            return None, err

        user = UserObject.find_by_id(user_id)
        if not user:
            return None, "User not found"
        workout = TemplateObject.find_by_id(workout_id)
        if not workout:
            return None, "Food not found"

        if user["_id"] == workout["user_id"]:
            return "Operation valid", None
        elif ("Admin" in user["roles"]) or ("Developer" in user["roles"]):
            return "Operation valid", None
        else:
            return None, "You must operate on your own object or have sufficient privileges"
        
    # ── CREATE ─────────────────────────────────────────────────────────────────
    @staticmethod
    def create_template(user_id, title, exercises):
        # Validate required fields
        if (not user_id):
            return None, "You are missing a user_id. Please fix, then attempt to create template again"

        oid, err = TemplateDriver._validate_obj_id(user_id, "user_id")
        if err:
            return None, err

        # Ensure the user exists
        user = UserObject.find_by_id(user_id)
        if not user:
            return None, "User not found"

        template_data = {
            "user_id": ObjectId(user_id),
            "title": title,
            "created_at": datetime.utcnow(),
            "notes": "",
            "exercises": exercises,
        }

        try:
            response = TemplateObject.create(template_data)
            return response, None
        except Exception as e:
            return None, str(e)
        
    # ── READ / GET ─────────────────────────────────────────────────────────────────
    @staticmethod
    def get_user_templates(user_id):
        if (not user_id):
            return None, "You are missing a user id. Please fix, then attempt to create template again"
        oid, err = TemplateDriver._validate_obj_id(user_id, "user_id")
        if err:
            return None, err
        try:
            templates = TemplateObject.find_user_templates(user_id)
            if not templates:
                return None, "Templates not found"
            return templates, None
        except Exception as e:
            return None, str(e)
        
    @staticmethod
    def get_template(id):
        if (not id):
            return None, "You are missing an id. Please fix, then attempt to create template again"
        oid, err = TemplateDriver._validate_obj_id(id, "id")
        if err:
            return None, err
        try:
            template = TemplateObject.find_template(id)
            if not template:
                return None, "Template not found"
            return template, None
        except Exception as e:
            return None, str(e)
        
    # -- UPDATE -----------------------------------------------------------------
    @staticmethod
    def update_template(id, updates):
        if (not id):
            return None, "You are missing an id. Please fix, then attempt to update template again"
        oid, err = TemplateDriver._validate_obj_id(id, "id")
        if err:
            return None, err
        try:
            # Allowed fields to update
            allowed_fields = {
                "title",
                "created_at",
                "notes"
            }

            # Filter only allowed fields
            sanitized_updates = {k: v for k, v in updates.items() if k in allowed_fields}

            #TODO: IMPLEMENT THIS after Sanitization of updates. 


            return "Not Implemented", None
        except Exception as e:
            return None, str(e)

    # ── DELETE ─────────────────────────────────────────────────────────────────
    @staticmethod
    def delete_workout(id):
        # Validate input
        if not id:
            return None, "You must provide a workout id to delete"
        oid, err = TemplateDriver._validate_obj_id(id, "workout_id")
        if err:
            return None, err

        try:
            response = TemplateObject.delete(id)
            if not response:
                # Either not found, or already removed
                return None, "Template not found or already deleted"
            return response, None
        except Exception as e:
            return None, str(e)
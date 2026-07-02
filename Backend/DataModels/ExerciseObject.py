# DataModel & Objects are essentially the Database Access Layer
# They know how to talk to Mongo DB Collection and that is it. 
from bson import ObjectId
from Services.MongoDriver import get_collection

class ExerciseObject:
    # ── Helpers ────────────────────────────────────────────────────────────────
    @staticmethod
    def _serialize(exercise):
        """Convert MongoDB document to JSON-safe dict."""
        if exercise:
            exercise["_id"] = str(exercise["_id"])
            if "owner_id" in exercise and exercise["owner_id"] is not None:
                exercise["owner_id"] = str(exercise["owner_id"])
        return exercise
    
    # ── Validation ─────────────────────────────────────────────────────────────
    @staticmethod
    def validate(data):
        """Validate exercise data. Returns (is_valid, error_message)."""
        if not data:
            return False, "No data provided"
        
        if "name" not in data or not isinstance(data["name"], str) or not data["name"].strip():
            return False, "Name is required and must be a non-empty string"
        
        array_fields = ["targetMuscles", "bodyParts", "equipments", "secondaryMuscles", "instructions"]
        for field in array_fields:
            if field in data and not isinstance(data[field], list):
                return False, f"{field} must be an array"
        
        return True, None
    
    # ── Create ─────────────────────────────────────────────────────────────────
    @staticmethod
    def create(exercise_data):
        is_valid, error = ExerciseObject.validate(exercise_data)
        if not is_valid:
            return None, error
        result = get_collection('exercise').insert_one(exercise_data)
        return str(result.inserted_id), None

    # ── Read ──────────────────────────────────────────────────────────────────
    @staticmethod
    def find_all():
        workout = get_collection('exercise').find()
        return [ExerciseObject._serialize(w) for w in workout]
    
    @staticmethod
    def find_by_id(id):
        workout = get_collection('exercise').find_one({"_id": ObjectId(id)})
        return ExerciseObject._serialize(workout)
        
    # ── Delete ─────────────────────────────────────────────────────────────────
    @staticmethod
    def delete(id):
        result = get_collection('exercise').delete_one({"_id": ObjectId(id)})
        return id if result.deleted_count == 1 else None
    
    # ── Update ─────────────────────────────────────────────────────────────────
    @staticmethod
    def update(id, updates):
        if not updates or not isinstance(updates, dict):
            return None

        allowed_fields = {
            "owner_id",
            "name",
            "gifUrl",
            "targetMuscles",
            "bodyParts",
            "equipments",
            "secondaryMuscles",
            "instructions"
        }

        sanitized_updates = {
            k: v
            for k, v in updates.items()
            if k in allowed_fields and v is not None
        }

        if not sanitized_updates:
            return None
        result = get_collection('exercise').update_one(
            {"_id": ObjectId(id)},
            {"$set": sanitized_updates}
        )

        if result.matched_count == 0:
            return None

        # Return the updated document
        updated = get_collection('exercise').find_one({"_id": ObjectId(id)})
        return ExerciseObject._serialize(updated)

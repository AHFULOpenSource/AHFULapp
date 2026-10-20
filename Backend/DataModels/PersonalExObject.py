# DataModel & Objects are essentially the Database Access Layer
# They know how to talk to Mongo DB Collection and that is it. 
from bson import ObjectId
from Services.MongoDriver import get_collection

class PersonalExObject:
    # ── Helpers ────────────────────────────────────────────────────────────────
    @staticmethod
    def _serialize(personalEx):
        """Convert MongoDB document to JSON-safe dict."""
        if personalEx:
            personalEx["_id"] = str(personalEx["_id"])
            personalEx["user_id"] = str(personalEx["user_id"])
            personalEx["workout_id"] = str(personalEx["workout_id"])
            personalEx["exercise_id"] = str(personalEx["exercise_id"])
        return personalEx
    
    # ── Create ─────────────────────────────────────────────────────────────────
    @staticmethod
    def create(personalEx_data):
        result = get_collection('personalExercise').insert_one(personalEx_data)
        return str(result.inserted_id)

    # ── Read ──────────────────────────────────────────────────────────────────
    @staticmethod
    def find_all():
        personalEx = get_collection('personalExercise').find()
        return [PersonalExObject._serialize(w) for w in personalEx]

    @staticmethod
    def find_by_id(id):
        personalEx = get_collection('personalExercise').find_one({"_id": ObjectId(id)})
        return PersonalExObject._serialize(personalEx)
    
    @staticmethod
    def find_by_user(user_id):
        personalEx = get_collection('personalExercise').find({"user_id": ObjectId(user_id)}).sort("order", 1)
        return [PersonalExObject._serialize(w) for w in personalEx]
    
    @staticmethod
    def find_by_workout(workout_id):
        personalEx = get_collection('personalExercise').find({"workout_id": ObjectId(workout_id)}).sort("order", 1)
        return [PersonalExObject._serialize(w) for w in personalEx]
    
    # ── Update ──────────────────────────────────────────────────────────────────
    @staticmethod
    def update(id, updates):
        if not updates:
            return None

        filter_doc = {"_id": ObjectId(id)}
        update_doc = {"$set": updates}
        result = get_collection('personalExercise').update_one(filter_doc, update_doc)

        # If no document matched the id, return None
        if result.matched_count == 0:
            return None

        # Fetch and return the current state after update (serialized)
        updated = get_collection('personalExercise').find_one(filter_doc)
        return PersonalExObject._serialize(updated)

    # ── Delete ──────────────────────────────────────────────────────────────────
    @staticmethod
    def delete(id):
        result = get_collection('personalExercise').delete_one({"_id": ObjectId(id)})
        return id if result.deleted_count == 1 else None
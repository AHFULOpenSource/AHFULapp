# DataModel & Objects are essentially the Database Access Layer
# They know how to talk to Mongo DB Collection and that is it. 
from bson import ObjectId
from Services.MongoDriver import get_collection

class WorkoutObject:
    # ── Helpers ────────────────────────────────────────────────────────────────
    @staticmethod
    def _serialize(workout):
        """Convert MongoDB document to JSON-safe dict."""
        if workout:
            workout["_id"] = str(workout["_id"])
            workout["user_id"] = str(workout["user_id"])
            workout["gym_id"] = str(workout["gym_id"])
        return workout
    
    # ── Create ─────────────────────────────────────────────────────────────────
    @staticmethod
    def create(workout_data):
        result = get_collection('workout').insert_one(workout_data)
        return str(result.inserted_id)

    # ── Read ──────────────────────────────────────────────────────────────────
    @staticmethod
    def find_all():
        workout = get_collection('workout').find()
        return [WorkoutObject._serialize(w) for w in workout]

    @staticmethod   
    def find_by_id(id):
        workout = get_collection('workout').find_one({"_id": ObjectId(id)})
        return WorkoutObject._serialize(workout)
    
    @staticmethod
    def find_by_user(user_id):
        workout = get_collection('workout').find({"user_id": ObjectId(user_id)})
        return [WorkoutObject._serialize(w) for w in workout]

    # ── Update ──────────────────────────────────────────────────────────────────
    @staticmethod
    def update(id, updates):
        if not updates:
            return None

        filter_doc = {"_id": ObjectId(id)}
        update_doc = {"$set": updates}
        result = get_collection('workout').update_one(filter_doc, update_doc)

        # If no document matched the id, return None
        if result.matched_count == 0:
            return None

        # Fetch and return the current state after update (serialized)
        updated = get_collection('workout').find_one(filter_doc)
        return WorkoutObject._serialize(updated)

    # ── Delete ──────────────────────────────────────────────────────────────────
    @staticmethod
    def delete(id):
        result = get_collection('workout').delete_one({"_id": ObjectId(id)})
        return id if result.deleted_count == 1 else None

    # ── Favorite ────────────────────────────────────────────────────────────────
    @staticmethod
    def toggle_favorite(id):
        """Toggle the favorite status of a workout."""
        workout = get_collection('workout').find_one({"_id": ObjectId(id)})
        if not workout:
            return None
        
        # Toggle favorite field
        current_favorite = workout.get("favorite", False)
        new_favorite = not current_favorite
        
        result = get_collection('workout').update_one(
            {"_id": ObjectId(id)},
            {"$set": {"favorite": new_favorite}}
        )
        
        if result.matched_count == 0:
            return None
        
        # Return updated workout
        updated = get_collection('workout').find_one({"_id": ObjectId(id)})
        return WorkoutObject._serialize(updated)

    @staticmethod
    def find_favorites_by_user(user_id):
        """Get all favorite workouts for a user."""
        workouts = get_collection('workout').find({
            "user_id": ObjectId(user_id),
            "favorite": True
            })
        return [WorkoutObject._serialize(w) for w in workouts]
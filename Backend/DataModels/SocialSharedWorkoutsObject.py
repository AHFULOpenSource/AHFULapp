from bson import ObjectId
from datetime import datetime
from Services.MongoDriver import get_collection


class SocialSharedWorkoutsObject:
    @staticmethod
    def _serialize(shared):
        if shared:
            shared["_id"] = str(shared["_id"])
            if shared.get("workout_id") is not None:
                shared["workout_id"] = str(shared["workout_id"])
            if shared.get("from_user") is not None:
                shared["from_user"] = str(shared["from_user"])
            if shared.get("to_user") is not None:
                shared["to_user"] = str(shared["to_user"])
        return shared

    @staticmethod
    def find_by_id(shared_id):
        shared = get_collection("socialSharedWorkouts").find_one({"_id": ObjectId(shared_id)})
        return SocialSharedWorkoutsObject._serialize(shared)

    @staticmethod
    def find_by_to_user(user_id):
        shared = get_collection("socialSharedWorkouts").find({"to_user": ObjectId(user_id)})
        return [SocialSharedWorkoutsObject._serialize(s) for s in shared]

    @staticmethod
    def find_by_from_user(user_id):
        shared = get_collection("socialSharedWorkouts").find({"from_user": ObjectId(user_id)})
        return [SocialSharedWorkoutsObject._serialize(s) for s in shared]

    @staticmethod
    def create(workout_id, from_user, to_user):
        now_ts = int(datetime.now().timestamp())
        shared_doc = {
            "workout_id": ObjectId(workout_id),
            "from_user": ObjectId(from_user),
            "to_user": ObjectId(to_user),
            "shared_at": now_ts,
        }
        result = get_collection("socialSharedWorkouts").insert_one(shared_doc)
        return str(result.inserted_id)

    @staticmethod
    def delete(shared_id):
        result = get_collection("socialSharedWorkouts").delete_one({"_id": ObjectId(shared_id)})
        return result.deleted_count > 0

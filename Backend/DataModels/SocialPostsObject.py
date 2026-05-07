from bson import ObjectId
from datetime import datetime
from Services.MongoDriver import get_collection


class SocialPostsObject:
    @staticmethod
    def _serialize(post):
        if post:
            post["_id"] = str(post["_id"])
            if post.get("shared_to_user_id") is not None:
                post["shared_to_user_id"] = str(post["shared_to_user_id"])
            if post.get("owner_user_id") is not None:
                post["owner_user_id"] = str(post["owner_user_id"])
        return post

    @staticmethod
    def find_by_id(post_id):
        post = get_collection("socialPosts").find_one({"_id": ObjectId(post_id)})
        return SocialPostsObject._serialize(post)

    @staticmethod
    def find_for_wall(user_id):
        query = {
            "$or": [
                {"is_public": True},
                {"shared_to_user_id": ObjectId(user_id)},
            ]
        }
        posts = get_collection("socialPosts").find(query)
        return [SocialPostsObject._serialize(p) for p in posts]

    @staticmethod
    def create(notes, owner_user_id, is_public=False, shared_to_user_id=None):
        now_ts = int(datetime.now().timestamp())
        post_doc = {
            "notes": notes,
            "is_public": bool(is_public),
            "shared_to_user_id": ObjectId(shared_to_user_id) if shared_to_user_id else None,
            "owner_user_id": ObjectId(owner_user_id),
            "created_at": now_ts,
            "updated_at": now_ts,
        }
        result = get_collection("socialPosts").insert_one(post_doc)
        return str(result.inserted_id)

    @staticmethod
    def delete(post_id):
        result = get_collection("socialPosts").delete_one({"_id": ObjectId(post_id)})
        return result.deleted_count > 0

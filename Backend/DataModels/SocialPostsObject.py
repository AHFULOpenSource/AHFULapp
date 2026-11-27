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
        """Return all public posts plus private posts sent or received by user_id."""
        uid = ObjectId(user_id)
        query = {
            "$or": [
                {"is_public": True},
                {"is_public": False, "shared_to_user_id": uid},
                {"is_public": False, "owner_user_id": uid},
            ]
        }
        posts = get_collection("socialPosts").find(query).sort([("created_at", -1), ("_id", -1)])
        return [SocialPostsObject._serialize(p) for p in posts]

    @staticmethod
    def find_public(limit=100):
        """Return global public posts sorted newest-first."""
        posts = (
            get_collection("socialPosts")
            .find({"is_public": True})
            .sort([("created_at", -1), ("_id", -1)])
            .limit(limit)
        )
        return [SocialPostsObject._serialize(p) for p in posts]

    @staticmethod
    def find_private_peer_ids(user_id):
        """Return distinct peer ObjectId strings for private posts involving user_id."""
        uid = ObjectId(user_id)
        pipeline = [
            {
                "$match": {
                    "is_public": False,
                    "$or": [{"owner_user_id": uid}, {"shared_to_user_id": uid}],
                }
            },
            {
                "$group": {
                    "_id": {
                        "$cond": [
                            {"$eq": ["$owner_user_id", uid]},
                            "$shared_to_user_id",
                            "$owner_user_id",
                        ]
                    }
                }
            },
        ]
        docs = get_collection("socialPosts").aggregate(pipeline)
        return [str(doc["_id"]) for doc in docs if doc.get("_id")]

    @staticmethod
    def find_conversation_summaries_for_user(user_id):
        """Aggregate 1-on-1 private conversation summaries sorted by latest message."""
        uid = ObjectId(user_id)
        pipeline = [
            {
                "$match": {
                    "is_public": False,
                    "$or": [{"owner_user_id": uid}, {"shared_to_user_id": uid}],
                }
            },
            {"$sort": {"created_at": -1, "_id": -1}},
            {
                "$group": {
                    "_id": {
                        "$cond": [
                            {"$eq": ["$owner_user_id", uid]},
                            "$shared_to_user_id",
                            "$owner_user_id",
                        ]
                    },
                    "last_message": {"$first": "$$ROOT"},
                    "last_message_at": {"$first": "$created_at"},
                    "message_count": {"$sum": 1},
                }
            },
            {"$sort": {"last_message_at": -1}},
        ]
        summaries = []
        for doc in get_collection("socialPosts").aggregate(pipeline):
            peerId = doc.get("_id")
            if not peerId:
                continue
            summaries.append(
                {
                    "peer_user_id": str(peerId),
                    "last_message": SocialPostsObject._serialize(doc.get("last_message")),
                    "last_message_at": doc.get("last_message_at"),
                    "message_count": doc.get("message_count", 0),
                }
            )
        return summaries

    @staticmethod
    def find_conversation(user_id, peer_user_id, since=None):
        """Return chronological 1-on-1 private posts between user_id and peer_user_id."""
        uid = ObjectId(user_id)
        pid = ObjectId(peer_user_id)
        query = {
            "is_public": False,
            "$or": [
                {"owner_user_id": uid, "shared_to_user_id": pid},
                {"owner_user_id": pid, "shared_to_user_id": uid},
            ],
        }
        if since is not None:
            query["created_at"] = {"$gt": int(since)}
        posts = get_collection("socialPosts").find(query).sort([("created_at", 1), ("_id", 1)])
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

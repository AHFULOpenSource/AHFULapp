from datetime import datetime
import re
from bson import ObjectId, errors as bson_errors

from DataModels.SocialObject import SocialObject
from DataModels.SocialPostsObject import SocialPostsObject
from DataModels.SocialSharedWorkoutsObject import SocialSharedWorkoutsObject
from DataModels.UserObject import UserObject
from DataModels.WorkoutObject import WorkoutObject
from Services.MongoDriver import get_collection


class SocialDriver:
    @staticmethod
    def _validate_obj_id(id_value, name):
        try:
            return ObjectId(str(id_value)), None
        except (bson_errors.InvalidId, TypeError, ValueError):
            return None, f"Invalid {name} format; must be a 24-hex string"

    @staticmethod
    def _normalize_email(email):
        if not isinstance(email, str):
            return None
        normalized = email.strip().lower()
        return normalized if normalized else None

    @staticmethod
    def _build_user_summary(user):
        if not user:
            return None
        name = user.get("name")
        if not name:
            name = user.get("email")
        return {
            "email": user.get("email"),
            "name": name,
        }

    @staticmethod
    def _find_user_by_email_case_insensitive(email):
        normalized = SocialDriver._normalize_email(email)
        if not normalized:
            return None

        user = UserObject.find_by_email(normalized)
        if user:
            return user

        regex = f"^{re.escape(normalized)}$"
        user_doc = get_collection("user").find_one({"email": {"$regex": regex, "$options": "i"}})
        if not user_doc:
            return None

        user_doc["_id"] = str(user_doc["_id"])
        return user_doc

    @staticmethod
    def resolve_user_id_by_email(email):
        user = SocialDriver._find_user_by_email_case_insensitive(email)
        if not user:
            return None, "User not found"
        return user.get("_id"), None

    @staticmethod
    def get_all_friendships():
        try:
            friendships = SocialObject.find_all()
            return friendships, None
        except Exception as e:
            return None, str(e)

    @staticmethod
    def get_friendship_by_id(friendship_id):
        if not friendship_id:
            return None, "friendship_id is required"
        oid, err = SocialDriver._validate_obj_id(friendship_id, "friendship_id")
        if err:
            return None, err
        try:
            friendship = SocialObject.find_by_id(oid)
            if not friendship:
                return None, "Friendship not found"
            return friendship, None
        except Exception as e:
            return None, str(e)

    @staticmethod
    def get_friendships_by_user(user_id):
        if not user_id:
            return None, "user_id is required"
        oid, err = SocialDriver._validate_obj_id(user_id, "user_id")
        if err:
            return None, err
        try:
            user = UserObject.find_by_id(oid)
            if not user:
                return None, "User not found"
            user_email = SocialDriver._normalize_email(user.get("email"))
            if not user_email:
                return None, "User is missing email"
            # Return only confirmed friendships (ConfirmedSince is not None)
            friendships = SocialObject.find_by_user_email(user_email)
            confirmed = [f for f in (friendships or []) if (f.get("ConfirmedSince") is not None)]
            return confirmed, None
        except Exception as e:
            return None, str(e)

    @staticmethod
    def get_friendships_by_email(user_email):
        normalized = SocialDriver._normalize_email(user_email)
        if not normalized:
            return None, "user_email is required"
        try:
            # Only return friendships that have been confirmed
            friendships = SocialObject.find_by_user_email(normalized)
            confirmed = [f for f in (friendships or []) if (f.get("ConfirmedSince") is not None)]
            return confirmed, None
        except Exception as e:
            return None, str(e)

    @staticmethod
    def get_pending_friend_requests_for_user(user_id):
        if not user_id:
            return None, "user_id is required"
        oid, err = SocialDriver._validate_obj_id(user_id, "user_id")
        if err:
            return None, err
        try:
            user = UserObject.find_by_id(oid)
            if not user:
                return None, "User not found"
            user_email = SocialDriver._normalize_email(user.get("email"))
            if not user_email:
                return None, "User is missing email"
            # Retrieve all friendships for this user and filter for pending
            # Pending = ConfirmedSince is None (not confirmed yet) and the user
            # appears as either User1Email or User2Email on the record.
            friendships = SocialObject.find_by_user_email(user_email)
            pending = [
                f for f in (friendships or []) if (f.get("ConfirmedSince") is None)
            ]
            return pending, None
        except Exception as e:
            return None, str(e)

    @staticmethod
    def get_pending_friend_requests_for_email(user_email):
        normalized = SocialDriver._normalize_email(user_email)
        if not normalized:
            return None, "user_email is required"
        try:
            # Get all friendships for this email and return those not yet confirmed
            friendships = SocialObject.find_by_user_email(normalized)
            pending = [
                f for f in (friendships or []) if (f.get("ConfirmedSince") is None)
            ]
            return pending, None
        except Exception as e:
            return None, str(e)

    @staticmethod
    def find_pending_friend_requests():
        try:
            # Find all friendships and consider pending those without a confirmation timestamp
            friendships = SocialObject.find_all()
            pending = [f for f in (friendships or []) if (f.get("ConfirmedSince") is None)]
            return pending, None
        except Exception as e:
            return None, str(e)

    @staticmethod
    def create_friend_request(user1_id, user2_email, user1_email=None):
        if not user1_id:
            return None, "user1_id is required"
        if not user2_email:
            return None, "user2_email is required"

        user1_oid, err = SocialDriver._validate_obj_id(user1_id, "user1_id")
        if err:
            return None, err

        try:
            user1 = UserObject.find_by_id(user1_oid)
            if not user1:
                return None, "Requesting user not found"

            normalized_user1_email = SocialDriver._normalize_email(user1_email or user1.get("email"))
            if not normalized_user1_email:
                return None, "Requesting user is missing email"

            user2 = SocialDriver._find_user_by_email_case_insensitive(user2_email)
            if not user2:
                return None, "User with that email was not found"

            normalized_user2_email = SocialDriver._normalize_email(user2.get("email"))
            if not normalized_user2_email:
                return None, "User with that email has no email on file"

            if normalized_user1_email == normalized_user2_email:
                return None, "You cannot send a friend request to yourself"

            existing = SocialObject.find_between_emails(normalized_user1_email, normalized_user2_email)
            if existing:
                if existing.get("User1Accepted") and existing.get("User2Accepted"):
                    return None, "You are already friends"
                return None, "A friend request already exists between these users"

            friendship_id = SocialObject.create(normalized_user1_email, normalized_user2_email)
            friendship = SocialObject.find_by_id(friendship_id)
            return friendship, None
        except Exception as e:
            return None, str(e)

    @staticmethod
    def accept_friend_request(friendship_id, acting_user_email):
        if not friendship_id:
            return None, "friendship_id is required"
        normalized_actor_email = SocialDriver._normalize_email(acting_user_email)
        if not normalized_actor_email:
            return None, "acting_user_email is required"

        friendship_oid, err = SocialDriver._validate_obj_id(friendship_id, "friendship_id")
        if err:
            return None, err

        try:
            friendship = SocialObject.find_by_id(friendship_oid)
            if not friendship:
                return None, "Friendship not found"

            user1_email = SocialDriver._normalize_email(friendship.get("User1Email"))
            user2_email = SocialDriver._normalize_email(friendship.get("User2Email"))

            if normalized_actor_email not in (user1_email, user2_email):
                return None, "You may only operate on your own data"

            updates = {}
            user1_accepted = bool(friendship.get("User1Accepted"))
            user2_accepted = bool(friendship.get("User2Accepted"))

            if normalized_actor_email == user1_email and not user1_accepted:
                updates["User1Accepted"] = True
                user1_accepted = True
            if normalized_actor_email == user2_email and not user2_accepted:
                updates["User2Accepted"] = True
                user2_accepted = True

            if user1_accepted and user2_accepted and not friendship.get("ConfirmedSince"):
                updates["ConfirmedSince"] = int(datetime.now().timestamp())

            if not updates:
                return friendship, None

            updated = SocialObject.update(friendship_oid, updates)
            return updated, None
        except Exception as e:
            return None, str(e)

    @staticmethod
    def delete_friendship(friendship_id, acting_user_email=None, acting_role=None):
        if not friendship_id:
            return None, "friendship_id is required"

        friendship_oid, err = SocialDriver._validate_obj_id(friendship_id, "friendship_id")
        if err:
            return None, err

        try:
            friendship = SocialObject.find_by_id(friendship_oid)
            if not friendship:
                return None, "Friendship not found"

            if acting_role not in ("Developer", "Admin"):
                normalized_actor_email = SocialDriver._normalize_email(acting_user_email)
                if not normalized_actor_email:
                    return None, "acting_user_email is required"

                user1_email = SocialDriver._normalize_email(friendship.get("User1Email"))
                user2_email = SocialDriver._normalize_email(friendship.get("User2Email"))
                if normalized_actor_email not in (user1_email, user2_email):
                    return None, "You may only operate on your own data"

            deleted = SocialObject.delete(friendship_oid)
            return {"deleted": deleted}, None
        except Exception as e:
            return None, str(e)

    @staticmethod
    def get_shared_workouts_for_user(user_id):
        if not user_id:
            return None, "user_id is required"
        oid, err = SocialDriver._validate_obj_id(user_id, "user_id")
        if err:
            return None, err
        try:
            user = UserObject.find_by_id(oid)
            if not user:
                return None, "User not found"

            shared_workouts = SocialSharedWorkoutsObject.find_by_to_user(user_id)
            enrichedWorkoutsToReturn = []

            for shared in shared_workouts or []:
                workout = None
                if shared.get("workout_id"):
                    workout = WorkoutObject.find_by_id(shared.get("workout_id"))

                from_user = None
                if shared.get("from_user"):
                    from_user = UserObject.find_by_id(shared.get("from_user"))

                sharedWorkoutEntry = {}
                sharedWorkoutEntry.update(
                    {
                        "shared_id": shared.get("_id"),
                        "workout_id": shared.get("workout_id"),
                        "title": workout.get("title"),
                        "startTime": workout.get("startTime"),
                        "endTime": workout.get("endTime"),
                        "template": workout.get("template"),
                        "gym_id": workout.get("gym_id"),
                        "sharedBy": SocialDriver._build_user_summary(from_user),
                    }
                )
                enrichedWorkoutsToReturn.append(sharedWorkoutEntry)

            return enrichedWorkoutsToReturn, None
        except Exception as e:
            return None, str(e)

    @staticmethod
    def get_wall_posts_for_user(user_id):
        if not user_id:
            return None, "user_id is required"
        oid, err = SocialDriver._validate_obj_id(user_id, "user_id")
        if err:
            return None, err
        try:
            user = UserObject.find_by_id(oid)
            if not user:
                return None, "User not found"

            posts = SocialPostsObject.find_for_wall(user_id)
            enriched = []

            for post in posts or []:
                owner = None
                if post.get("owner_user_id"):
                    owner = UserObject.find_by_id(post.get("owner_user_id"))

                post_entry = dict(post)
                post_entry["owner"] = SocialDriver._build_user_summary(owner)
                enriched.append(post_entry)

            return enriched, None
        except Exception as e:
            return None, str(e)

    @staticmethod
    def create_shared_workout(from_user_id, workout_id, to_user_email, acting_role=None):
        if not from_user_id:
            return None, "from_user_id is required"
        if not workout_id:
            return None, "workout_id is required"
        normalized_email = SocialDriver._normalize_email(to_user_email)
        if not normalized_email:
            return None, "to_user_email is required"

        from_oid, err = SocialDriver._validate_obj_id(from_user_id, "from_user_id")
        if err:
            return None, err

        workout_oid, err = SocialDriver._validate_obj_id(workout_id, "workout_id")
        if err:
            return None, err

        try:
            from_user = UserObject.find_by_id(from_oid)
            if not from_user:
                return None, "Requesting user not found"

            to_user = SocialDriver._find_user_by_email_case_insensitive(normalized_email)
            if not to_user:
                return None, "User with that email was not found"

            if str(from_user.get("_id")) == str(to_user.get("_id")):
                return None, "You cannot share a workout with yourself"

            friendship = SocialObject.find_between_emails(
                SocialDriver._normalize_email(from_user.get("email")),
                SocialDriver._normalize_email(to_user.get("email")),
            )
            if not friendship or friendship.get("ConfirmedSince") is None:
                return None, "You can only share workouts with confirmed friends"

            workout = WorkoutObject.find_by_id(workout_oid)
            if not workout:
                return None, "Workout not found"

            if acting_role not in ("Developer", "Admin") and str(workout.get("user_id")) != str(from_user_id):
                return None, "You may only share your own workouts"

            shared_id = SocialSharedWorkoutsObject.create(workout_oid, from_oid, to_user.get("_id"))
            shared = SocialSharedWorkoutsObject.find_by_id(shared_id)
            return shared, None
        except Exception as e:
            return None, str(e)

    @staticmethod
    def create_wall_post(owner_user_id, notes, is_public=False, shared_to_user_email=None):
        if not owner_user_id:
            return None, "owner_user_id is required"
        if not notes:
            return None, "notes is required"

        owner_oid, err = SocialDriver._validate_obj_id(owner_user_id, "owner_user_id")
        if err:
            return None, err

        try:
            owner_user = UserObject.find_by_id(owner_oid)
            if not owner_user:
                return None, "Owner user not found"

            to_user = None
            if shared_to_user_email:
                normalized_email = SocialDriver._normalize_email(shared_to_user_email)
                if not normalized_email:
                    return None, "shared_to_user_email is invalid"

                to_user = SocialDriver._find_user_by_email_case_insensitive(normalized_email)
                if not to_user:
                    return None, "User with that email was not found"

                friendship = SocialObject.find_between_emails(
                    SocialDriver._normalize_email(owner_user.get("email")),
                    SocialDriver._normalize_email(to_user.get("email")),
                )
                if not friendship or friendship.get("ConfirmedSince") is None:
                    return None, "You can only share posts with confirmed friends"

            post_id = SocialPostsObject.create(
                notes=notes,
                owner_user_id=owner_oid,
                is_public=is_public,
                shared_to_user_id=to_user.get("_id") if to_user else None,
            )
            post = SocialPostsObject.find_by_id(post_id)
            return post, None
        except Exception as e:
            return None, str(e)

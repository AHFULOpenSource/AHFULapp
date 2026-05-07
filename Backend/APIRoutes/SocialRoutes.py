from flask import Blueprint, request, jsonify, g

from Services.SocialDriver import SocialDriver
from Auth.verification import login_required_user, login_required_dev


socialRouteBlueprint = Blueprint("social", __name__, url_prefix="/AHFULsocial")


@socialRouteBlueprint.route("/", methods=["GET"])
@login_required_dev
def get_all_friendships():
    friendships, error = SocialDriver.get_all_friendships()
    if error:
        return jsonify({"error": error}), 500
    return (friendships), 200


@socialRouteBlueprint.route("/<friendship_id>", methods=["GET"])
@login_required_user
def get_friendship(friendship_id):
    friendship, error = SocialDriver.get_friendship_by_id(friendship_id)
    if error:
        return jsonify({"error": error}), 404

    actor_email = (g.email or "").strip().lower()
    if (
        g.role not in ("Developer", "Admin")
        and actor_email not in (
            (friendship.get("User1Email") or "").strip().lower(),
            (friendship.get("User2Email") or "").strip().lower(),
        )
    ):
        return jsonify({"error": "You may only access your own data"}), 403

    return jsonify(friendship), 200


@socialRouteBlueprint.route("/user", methods=["GET"])
@login_required_user
def get_friendships_for_current_user():
    friendships, error = SocialDriver.get_friendships_by_email(g.email)
    if error:
        return jsonify({"error": error}), 404
    return jsonify(friendships), 200


@socialRouteBlueprint.route("/pending", methods=["GET"])
@login_required_user
def get_pending_friendships_for_current_user():
    friendships, error = SocialDriver.get_pending_friend_requests_for_email(g.email)
    if error:
        return jsonify({"error": error}), 404
    return jsonify(friendships), 200


@socialRouteBlueprint.route("/request", methods=["POST"])
@login_required_user
def create_friend_request():
    user1_id = g.user_id
    user_1_email = g.email
    data = request.get_json() or {}
    user2_email = data.get("email")
    if not user2_email:
        return jsonify({"error": "user2_email is required"}), 400

    friendship, error = SocialDriver.create_friend_request(user1_id, user2_email, g.email)
    if error:
        return jsonify({"error": error}), 400
    return jsonify(friendship), 201


@socialRouteBlueprint.route("/accept/<friendship_id>", methods=["PUT"])
@login_required_user
def accept_friend_request(friendship_id):
    friendship, error = SocialDriver.accept_friend_request(friendship_id, g.email)
    if error:
        return jsonify({"error": error}), 400
    return jsonify(friendship), 200


@socialRouteBlueprint.route("/delete/<friendship_id>", methods=["DELETE"])
@login_required_user
def delete_friendship(friendship_id):
    result, error = SocialDriver.delete_friendship(friendship_id, g.email, g.role)
    if error:
        return jsonify({"error": error}), 404
    return jsonify(result), 200


@socialRouteBlueprint.route("/shared-workouts", methods=["GET"])
@login_required_user
def get_shared_workouts_for_user():
    workouts, error = SocialDriver.get_shared_workouts_for_user(g.user_id)
    if error:
        return jsonify({"error": error}), 400
    return jsonify(workouts), 200


@socialRouteBlueprint.route("/shared-workouts", methods=["POST"])
@login_required_user
def create_shared_workout():
    data = request.get_json() or {}
    workout_id = data.get("workout_id")
    to_user_email = data.get("to_user_email")

    if not workout_id or not to_user_email:
        return jsonify({"error": "workout_id and to_user_email are required"}), 400

    shared, error = SocialDriver.create_shared_workout(
        from_user_id=g.user_id,
        workout_id=workout_id,
        to_user_email=to_user_email,
        acting_role=g.role,
    )
    if error:
        return jsonify({"error": error}), 400
    return jsonify(shared), 201


@socialRouteBlueprint.route("/wall-posts", methods=["GET"])
@login_required_user
def get_wall_posts_for_user():
    posts, error = SocialDriver.get_wall_posts_for_user(g.user_id)
    if error:
        return jsonify({"error": error}), 400
    return jsonify(posts), 200


@socialRouteBlueprint.route("/wall-posts", methods=["POST"])
@login_required_user
def create_wall_post():
    data = request.get_json() or {}
    notes = data.get("notes")
    is_public = data.get("is_public", False)
    shared_to_user_email = data.get("shared_to_user_email")

    if not notes:
        return jsonify({"error": "notes is required"}), 400

    post, error = SocialDriver.create_wall_post(
        owner_user_id=g.user_id,
        notes=notes,
        is_public=is_public,
        shared_to_user_email=shared_to_user_email,
    )
    if error:
        return jsonify({"error": error}), 400
    return jsonify(post), 201

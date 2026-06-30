from flask import Blueprint, request, jsonify, g
from Services.WorkoutDriver import WorkoutDriver
from Auth.verification import login_required_user, login_required_dev, login_required_admin, login_required_gym_owner

workoutRouteBlueprint = Blueprint("workouts", __name__, url_prefix="/AHFULworkouts")

# ── GET all workouts ───────────────────────────────────────
@workoutRouteBlueprint.route("/", methods=["GET"])
@login_required_admin
def get_all_workouts():
    workouts, error = WorkoutDriver.get_all_workouts()
    if error:
        return jsonify({"error": error}), 500
    return jsonify(workouts), 200

# ── GET all workouts for a specific user ──────────────────────────────────────
@workoutRouteBlueprint.route("/<user_id>", methods=["GET"])
@login_required_user
def get_workouts_by_user(user_id):
    # Own user request, devs or admins only
    if (user_id != g.user_id) and (g.role != "Developer") and (g.role != "Admin"):
        return jsonify({"error": "You may only access your own data"}), 403
    workouts, error = WorkoutDriver.get_workouts_by_user(user_id)
    if error:
        return jsonify({"error": error}), 404
    return jsonify(workouts), 200


# ── GET single workout ────────────────────────────────────────────────────────
@workoutRouteBlueprint.route("/id/<workout_id>", methods=["GET"])
@login_required_user
def get_workout(workout_id):
    res, err = WorkoutDriver.verify_operation(g.user_id, workout_id)
    if err:
        return jsonify({"error": err}), 400
    workout, error = WorkoutDriver.get_workout_by_id(workout_id)
    if error:
        return jsonify({"error": error}), 404
    return jsonify(workout), 200

# ── CREATE workout────────────────────────────────────────────────────────────
@workoutRouteBlueprint.route("/create", methods=["POST"])
@login_required_user
def create_workout():
    data = request.get_json()
    if not data:
        return jsonify({"error": "No data provided"}), 400

    workout_id, error = WorkoutDriver.create_workout(
        user_id=g.user_id,
        gym_id=data.get("gym_id") or "000000000000000000000000",
        title=data.get("title"),
        startTime=data.get("startTime"),
        endTime=data.get("endTime"),
    )

    if error:
        return jsonify({"error": error}), 400
    return jsonify({"workout_id": workout_id, "message": "Workout created"}), 201

# Only update own? dev for now
# ── UPDATE personalEx ───────────────────────────────────────────────────────────
@workoutRouteBlueprint.route("/update/<workout_id>", methods=["PUT"])
@login_required_user
def update_workout(workout_id):
    if not workout_id:
        return jsonify({"error": "You must provide a workout id to update"}), 400

    res, err = WorkoutDriver.verify_operation(g.user_id, workout_id)
    if err:
        return jsonify({"error": err}), 400

    data = request.get_json(silent=True)
    if not data or not isinstance(data, dict):
        return jsonify({"error": "You must provide a JSON body with at least one field to update"}), 400

    if not data.get("gym_id"):
        data["gym_id"] = "000000000000000000000000"

    # Call the driver (it already validates allowed fields & id)
    updated, error = WorkoutDriver.update_workout(id=workout_id, updates=data)

    if error:
        err_lower = error.lower()
        if "not found" in err_lower:
            return jsonify({"error": error}), 404
        return jsonify({"error": error}), 400

    return jsonify({"message": "Workout updated", "workout": updated}), 200

# Only delete own? dev for now
# ── DELETE workout ────────────────────────────────────────────────────────────────
@workoutRouteBlueprint.route("/delete/<workout_id>", methods=["DELETE"])
@login_required_dev
def delete_workout(workout_id):
    if not workout_id:
        return jsonify({"error": "You must provide a workout id to delete"}), 400

    res, err = WorkoutDriver.verify_operation(g.user_id, workout_id)
    if err:
        return jsonify({"error": err}), 400

    response, error = WorkoutDriver.delete_workout(workout_id)
    if error:
        return jsonify({"error": error}), 400
    return jsonify({"message": "Workout deleted", "workout_id": response}), 200

# ── GET workout streak for user ──────────────────────────────────────
@workoutRouteBlueprint.route("/streak/<user_id>", methods=["GET"])
@login_required_user
def get_workout_streak(user_id):
    # Own user request, devs or admins only
    if (user_id != g.user_id) and (g.role != "Developer") and (g.role != "Admin"):
        return jsonify({"error": "You may only access your own data"}), 403
    streak_data, error = WorkoutDriver.get_streak(user_id)
    if error:
        return jsonify({"error": error}), 404
    return jsonify(streak_data), 200

# ── GET favorite workouts for user ──────────────────────────────────────
@workoutRouteBlueprint.route("/favorites/<user_id>", methods=["GET"])
@login_required_user
def get_favorite_workouts(user_id):
    # Own user request, devs or admins only
    if (user_id != g.user_id) and (g.role != "Developer") and (g.role != "Admin"):
        return jsonify({"error": "You may only access your own data"}), 403

    workouts, error = WorkoutDriver.get_favorite_workouts(user_id)
    if error:
        return jsonify({"error": error}), 404

    return jsonify(workouts), 200

# ── FAVORITE workout ────────────────────────────────────────────────────────────
@workoutRouteBlueprint.route("/<workout_id>/favorite", methods=["PUT"])
@login_required_user
def toggle_favorite_workout(workout_id):
    if not workout_id:
        return jsonify({"error": "workout_id is required"}), 400

    workout, error = WorkoutDriver.toggle_favorite(g.user_id, workout_id)
    if error:
        return jsonify({"error": error}), 400

    favorite_status = workout.get("favorite", False)
    return jsonify({
        "message": f"Workout marked as {'favorite' if favorite_status else 'not favorite'}",
        "workout": workout
    }), 200

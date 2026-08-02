from flask import Blueprint, request, jsonify, g
from Services.PersonalExDriver import PersonalExDriver
from Auth.verification import login_required_user, login_required_dev, login_required_admin, login_required_gym_owner

personalExRouteBlueprint = Blueprint("personalEx", __name__, url_prefix="/AHFULpersonalEx")

# ── GET all personalExs ──────────────────────────────────────
@personalExRouteBlueprint.route("/", methods=["GET"])
@login_required_dev
def get_all_personal_exs():
    personalExs, error = PersonalExDriver.get_all_personal_exs()
    if error:
        return jsonify({"error": error}), 500
    return jsonify(personalExs), 200

# ── GET all personalExs for a specific user ──────────────────────────────────────
@personalExRouteBlueprint.route("/userid", methods=["GET"])
@login_required_user
def get_personal_exs_by_user():
    personalExs, error = PersonalExDriver.get_personal_exs_by_user(g.user_id)
    if error:
        if "not found" in error.lower():
            return jsonify({"error": error}), 404
        elif error:
            return jsonify({"error": error}), 400
    return jsonify(personalExs), 200

#TODO: Update as I changed from DEV to User
# Ensure only grab own obj??, dev for now
# ── GET all personalExs for a specific workout ──────────────────────────────────────
@personalExRouteBlueprint.route("/workout/<workout_id>", methods=["GET"])
@login_required_user
def get_personal_exs_by_workout(workout_id):
    personalExs, error = PersonalExDriver.get_personal_exs_by_workout(workout_id=workout_id)
    if error:
        if "not found" in error.lower():
            return jsonify({"error": error}), 404
        elif error:
            return jsonify({"error": error}), 400
    return jsonify(personalExs), 200

# Ensure only grab own obj?? dev for now
# ── GET single personalEx ────────────────────────────────────────────────────────
@personalExRouteBlueprint.route("/id/<id>", methods=["GET"])
@login_required_dev
def get_personal_ex(id):
    personalEx, error = PersonalExDriver.get_personal_ex_by_id(id)
    if error:
        if "not found" in error.lower():
            return jsonify({"error": error}), 404
        elif error:
            return jsonify({"error": error}), 400
    return jsonify(personalEx), 200

# ── CREATE personalEx ────────────────────────────────────────────────────────────
@personalExRouteBlueprint.route("/create", methods=["POST"])
@login_required_user
def create_personal_ex():
    data = request.get_json()
    if not data:
        return jsonify({"error": "No data provided"}), 400
    
    template=data.get("template")
    if not template:
        template = False
    else:
        template = True

    personal_ex_id, error = PersonalExDriver.create_personal_ex(
        user_id=data.get("user_id"),
        exercise_id=data.get("exercise_id"),
        workout_id=data.get("workout_id"),
        reps=data.get("reps"),
        sets=data.get("sets"),
        weight=data.get("weight"),
        duration=data.get("duration"),
        distance=data.get("distance"),
        complete=data.get("complete"),
        template=template
    )
    
    if error:
        return jsonify({"error": error}), 400
    return jsonify({"personal_ex_id": personal_ex_id, "message": "Personal Ex created"}), 201

# Only update own???, dev for now
# ── UPDATE personalEx ───────────────────────────────────────────────────────────
@personalExRouteBlueprint.route("/update/<personal_ex_id>", methods=["PUT"])
@login_required_dev
def update_personal_ex(personal_ex_id):
    if not personal_ex_id:
        return jsonify({"error": "You must provide a personal ex id to update"}), 400

    data = request.get_json(silent=True)
    if not data or not isinstance(data, dict):
        return jsonify({"error": "You must provide a JSON body with at least one field to update"}), 400

    # Call the driver (it already validates allowed fields & id)
    updated, error = PersonalExDriver.update_personal_ex(id=personal_ex_id, updates=data)

    if error:
        return jsonify({"error": error}), 400
    
    return jsonify({"message": "Personal ex updated", "personal_ex": updated}), 200

# Only update own?? dev for now
# ── DELETE personalEx ────────────────────────────────────────────────────────────────
@personalExRouteBlueprint.route("/delete/<personal_ex_id>", methods=["DELETE"])
@login_required_dev
def delete_personal_ex(personal_ex_id):
    if not personal_ex_id:
        return jsonify({"error": "You must provide a personal ex id to delete"}), 400

    response, error = PersonalExDriver.delete_personal_ex(personal_ex_id)
    if error:
        return jsonify({"error": error}), 400
    return jsonify({"message": "Personal ex deleted", "personal_ex_id": response}), 200
from flask import Blueprint, request, jsonify, g
from Services.TemplateDriver import TemplateDriver
from Auth.verification import login_required_user, login_required_dev, login_required_admin, login_required_gym_owner

templateRouteBlueprint = Blueprint("template", __name__, url_prefix="/AHFULtemplate")

# ── GET all templates for a specific user ──────────────────────────────────────
@templateRouteBlueprint.route("/user", methods=["GET"])
@login_required_user
def get_templates():
    # Own user request, devs or admins only
    if (g.user_id) and (g.role != "Developer") and (g.role != "Admin"):
        return jsonify({"error": "You may only access your own data"}), 403
    workouts, error = TemplateDriver.get_user_templates(g.user_id)
    if error:
        return jsonify({"error": error}), 404
    return jsonify(workouts), 200

# ── GET template by id ──────────────────────────────────────
@templateRouteBlueprint.route("/<id>", methods=["GET"])
@login_required_user
def get_template(template_id):
    res, err = TemplateDriver.verify_operation(g.user_id, template_id)
    if err:
        return jsonify({"error": err}), 400
    workouts, error = TemplateDriver.get_template(template_id)
    if error:
        return jsonify({"error": error}), 404
    return jsonify(workouts), 200

# ── CREATE template ────────────────────────────────────────────────────────────
@templateRouteBlueprint.route("/create", methods=["POST"])
@login_required_user
def create_template():
    data = request.get_json()
    if not data:
        return jsonify({"error": "No data provided"}), 400

    template_id, error = TemplateDriver.create_template(
        user_id=g.user_id,
        title=data.get("title"),
        exercises=data.get("exercises", [])
    )

    if error:
        return jsonify({"error": error}), 400
    return jsonify({"template_id": template_id, "message": "Template created"}), 201

# Only delete own? dev for now
# ── DELETE workout ────────────────────────────────────────────────────────────────
@templateRouteBlueprint.route("/delete/<id>", methods=["DELETE"])
@login_required_dev
def delete_template(id):
    if not id:
        return jsonify({"error": "You must provide a template id to delete"}), 400

    res, err = TemplateDriver.verify_operation(g.user_id, id)
    if err:
        return jsonify({"error": err}), 400

    response, error = TemplateDriver.delete_workout(id)
    if error:
        return jsonify({"error": error}), 400
    return jsonify({"message": "Workout deleted", "workout_id": response}), 200


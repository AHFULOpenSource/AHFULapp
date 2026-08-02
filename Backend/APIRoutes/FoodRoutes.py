from flask import Blueprint, request, jsonify, g
from Services.FoodDriver import FoodDriver
from Auth.verification import login_required_user, login_required_dev, login_required_admin, login_required_gym_owner

foodRouteBlueprint = Blueprint("foods", __name__, url_prefix="/AHFULfoods")

# ── DELETE food ────────────────────────────────────────────────────────────────
@foodRouteBlueprint.route("/delete/<food_id>", methods=["DELETE"])
@login_required_user
def delete_food(food_id):
    if not food_id:
        return jsonify({"error": "You must provide a food id to delete"}), 400

    res, err = FoodDriver.verify_operation(g.user_id, food_id)
    if err:
        return jsonify({"error": err}), 400

    response, error = FoodDriver.delete_food(food_id)
    if error:
        return jsonify({"error": error}), 400
    return jsonify({"message": "Food deleted", "food_id": response}), 200

# ── GET all foods ────────────────────────────
@foodRouteBlueprint.route("/", methods=["GET"])
@login_required_dev
def get_all_food():
    food, error = FoodDriver.get_all_food()
    if error:
        return jsonify({"error": error}), 500
    return jsonify(food), 200

# ── GET favorite foods for user ──────────────────────────────────────
@foodRouteBlueprint.route("/favorites/<user_id>", methods=["GET"])
@login_required_user
def get_favorite_foods(user_id):
    # Own user request, devs or admins only
    if (user_id != g.user_id) and (g.role != "Developer") and (g.role != "Admin"):
        return jsonify({"error": "You may only access your own data"}), 403

    foods, error = FoodDriver.get_favorite_foods(user_id)
    if error:
        return jsonify({"error": error}), 404

    return jsonify(foods), 200

# ── GET specific food by id ────────────────────────────
@foodRouteBlueprint.route("/id/<id>", methods=["GET"])
@login_required_dev
def get_food_by_id(id):
    food, error = FoodDriver.get_food_by_id(id)
    if error:
        return jsonify({"error": error}), 404
    return jsonify(food), 200

# ── SEARCH USDA FoodData Central API (MUST BE BEFORE CATCH-ALL ROUTES) ────────────────────────────────
@foodRouteBlueprint.route("/search/usda", methods=["GET"])
@login_required_user
def search_usda_foods():
    """
    Search USDA FoodData Central for foods.
    Query parameter: q (search query)
    """
    query = request.args.get("q", "").strip()
    max_results = request.args.get("limit", 10, type=int)

    if not query:
        return jsonify({"error": "Search query (q) is required"}), 400

    foods, error = FoodDriver.search_usda_foods(query, max_results)

    if error:
        return jsonify({"error": error}), 500

    return jsonify({"foods": foods}), 200

# ── GET food streak for user ──────────────────────────────────────
@foodRouteBlueprint.route("/streak/<user_id>", methods=["GET"])
@login_required_user
def get_food_streak(user_id):
    if (user_id != g.user_id) and (g.role != "Developer") and (g.role != "Admin"):
        return jsonify({"error": "You may only access your own data"}), 403
    streak_data, error = FoodDriver.get_streak(user_id)
    if error:
        return jsonify({"error": error}), 500
    return jsonify(streak_data), 200

# ── GET foods by user id ────────────────────────────────────────────────────────────
@foodRouteBlueprint.route("/userid", methods=["GET"])
@login_required_user
def get_food_by_user():
    # Own user request, devs or admins only
    food, error = FoodDriver.get_food_by_user(g.user_id)
    if error:
        return jsonify({"error": error}), 404
    return jsonify(food), 200

# ── CREATE food ────────────────────────────────────────────────────────────────
@foodRouteBlueprint.route("/create", methods=["POST"])
@login_required_user
def create_food():
    data = request.get_json()
    if not data:
        return jsonify({"error": "No data provided"}), 400

    food_id, error = FoodDriver.create_food(
        user_id=g.user_id,
        name=data.get("name"),
        servings=data.get("servings"),
        type=data.get("type"),
        calories=data.get("calories"),
        carbs=data.get("carbs"),
        fat=data.get("fat"),
        protein=data.get("protein"),
        fdcId=data.get("fdcId"),
        servingSize=data.get("servingSize"),
        servingUnit=data.get("servingUnit")
    )

    if error:
        return jsonify({"error": error}), 400
    return jsonify({"food_id": food_id, "message": "food created"}), 201

# ── Toggle FAVORITE food for a given food you own  ────────────────────────────────────────────────────────────
@foodRouteBlueprint.route("/<food_id>/favorite", methods=["PUT"])
@login_required_user
def toggle_favorite_food(food_id):
    if not food_id:
        return jsonify({"error": "food_id is required"}), 400

    food, error = FoodDriver.toggle_favorite(g.user_id, food_id)
    if error:
        return jsonify({"error": error}), 400

    favorite_status = food.get("favorite", False)
    return jsonify({
        "message": f"Food marked as {'favorite' if favorite_status else 'not favorite'}",
        "food": food
    }), 200

# ── UPDATE food ────────────────────────────────────────────────────────────────
@foodRouteBlueprint.route("/update/<food_id>", methods=["PUT"])
@login_required_user
def update_food(food_id):
    data = request.get_json()

    if not data or not isinstance(data, dict):
        return jsonify({"error": "No data provided"}), 400

    res, err = FoodDriver.verify_operation(g.user_id, food_id)
    if err:
        return jsonify({"error": err}), 400

    updates = {
        "name": data.get("name"),
        "calories": data.get("calories"),
        "servings": data.get("servings"),
        "type": data.get("type"),
        "time": data.get("time"),
        "carbs": data.get("carbs"),
        "fat": data.get("fat"),
        "protein": data.get("protein"),
        "fdcId": data.get("fdcId"),
        "servingSize": data.get("servingSize"),
        "servingUnit": data.get("servingUnit")
    }

    updated, error = FoodDriver.update_food(food_id, updates)
    if error:
        return jsonify({"error": error}), 400

    return jsonify(updated), 200

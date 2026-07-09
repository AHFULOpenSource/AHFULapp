#Services & Drivers know how to implement business Logic related to the Route operations.
#   Intermediate between Routes and Objects.  Ensures validations and rules are applied before
#   Calling Objects to interact with DB
from DataModels.FoodObject import FoodObject
from DataModels.UserObject import UserObject
from bson import ObjectId, errors as bson_errors
import requests
import os

# The FoodDriver is responsible for implementing the business logic related to food operations.
#  It acts as an intermediary between the API routes and the data models,
# ensuring that all necessary validations and rules are applied before interacting with
# the database.
class FoodDriver:
    # ── Helper ─────────────────────────────────────────────────────────────────
    @staticmethod
    def _validate_obj_id(id, name):
        try:
            return ObjectId(str(id)), None
        except (bson_errors.InvalidId, TypeError, ValueError):
            return None, f"Invalid {name} format; must be a 24-hex string"

    @staticmethod
    def verify_operation(user_id, food_id):
        if (not user_id) or (not food_id):
            return None, "Missing user or food_id"

        # Convert IDs safely
        user_id, err = FoodDriver._validate_obj_id(user_id, "user_id")
        if err:
            return None, err
        # Convert IDs safely
        food_id, err = FoodDriver._validate_obj_id(food_id, "food_id")
        if err:
            return None, err

        user = UserObject.find_by_id(user_id)
        if not user:
            return None, "User not found"
        food = FoodObject.find_by_id(food_id)
        if not food:
            return None, "Food not found"

        if user["_id"] == food["user_id"]:
            return "Operation valid", None
        elif ("Admin" in user["roles"]) or ("Developer" in user["roles"]):
            return "Operation valid", None
        else:
            return None, "You must operate on your own object or have sufficient privileges"

    # ── Create ─────────────────────────────────────────────────────────────────
    @staticmethod
    def create_food(user_id, name, servings, type, calories=None, carbs=None, fat=None, protein=None, fdcId=None, servingSize=None, servingUnit=None):
        # Validate required fields
        if (not user_id) or (not name) or (calories is None) or (not servings) or (not type):
            return None, "You are missing a value. Please fix, then attempt to create food again"

        # Convert IDs safely
        user_id, err = FoodDriver._validate_obj_id(user_id, "userid")
        if err:
            return None, err

        # Ensure the user exists
        user = UserObject.find_by_id(user_id)
        if not user:
            return None, "User not found"

        food_data = {
            "user_id": user_id,
            "name": name,
            "calories": calories,
            "servings": servings,
            "type": type,
            "time": int(__import__("time").time()),
            "favorite": False,
            "carbs": carbs,
            "fat": fat,
            "protein": protein,
            "fdcId": fdcId,
            "servingSize": servingSize,
            "servingUnit": servingUnit
        }

        try:
            response = FoodObject.create(food_data)
            return response, None
        except Exception as e:
            return None, str(e)

    # ── Read ─────────────────────────────────────────────────────────────────
    @staticmethod
    def get_all_food():
        try:
            food = FoodObject.find_all()
            return food, None
        except Exception as e:
            return None, str(e)

    @staticmethod
    def get_food_by_user(id):
        if not id:
            return None, "You must provide a user id to get"
        oid, err = FoodDriver._validate_obj_id(id, "food_id")
        if err:
            return None, err
        try:
            food = FoodObject.find_by_user(id)
            return food, None
        except Exception as e:
            return None, str(e)

    @staticmethod
    def get_food_by_id(id):
        if not id:
            return None, "You must provide a food id to get"
        oid, err = FoodDriver._validate_obj_id(id, "food_id")
        if err:
            return None, err
        try:
            food = FoodObject.find_by_id(id)
            if not food:
                return None, "Food not found"
            return food, None
        except Exception as e:
            return None, str(e)

    # ── Update ─────────────────────────────────────────────────────────────────
    @staticmethod
    def update_food(id, updates):
        if not id:
            return None, "You must provide a food id to update"
        oid, err = FoodDriver._validate_obj_id(id, "food_id")
        if err:
            return None, err

        if not updates or not isinstance(updates, dict):
            return None, "You must provide at least one field to update"

         # Allowed fields to update
        allowed_fields = {
            "name",
            "calories",
            "servings",
            "type",
            "time",
            "carbs",
            "fat",
            "protein",
            "fdcId",
            "servingSize",
            "servingUnit"
        }

        # Filter only allowed fields
        sanitized_updates = {k: v for k, v in updates.items() if k in allowed_fields and v is not None}

        if not sanitized_updates:
            return None, "No valid fields to update"

        # Type validation map
        string_fields = {"name", "type", "servingUnit"}
        numeric_fields = {"calories", "servings", "time", "carbs", "fat", "protein", "fdcId", "servingSize"}

        for field, value in sanitized_updates.items():
            if field in string_fields and not isinstance(value, str):
                return None, f"'{field}' must be a string"
            if field in numeric_fields and not isinstance(value, (int, float)):
                return None, f"'{field}' must be a number"
            if field not in string_fields and field not in numeric_fields:
                return None, f"Unknown field '{field}'"

        try:
            updated = FoodObject.update(id, sanitized_updates)
            if not updated:
                return None, "Food not found"
            return updated, None
        except Exception as e:
            return None, str(e)

    # ── Delete ─────────────────────────────────────────────────────────────────
    @staticmethod
    def delete_food(id):
        if not id:
            return None, "You must provide a food id to delete"
        oid, err = FoodDriver._validate_obj_id(id, "food_id")
        if err:
            return None, err
        # Validate input
        if not id:
            return None, "You must provide a food id to delete"

        try:
            response = FoodObject.delete(id)
            if not response:
                # Either not found, or already removed
                return None, "Food not found or already deleted"
            return response, None
        except Exception as e:
            return None, str(e)

    # ── Streak Calculation ─────────────────────────────────────────────────────
    @staticmethod
    def get_streak(user_id):
        try:
            # Validate user_id
            if not user_id:
                return None, "User ID is required"

            oid, err = FoodDriver._validate_obj_id(user_id, "user_id")
            if err:
                return None, err

            # Get all food logs for user
            foods = FoodObject.find_by_user(user_id)
            if not foods:
                return {"streak": 0, "lastFoodDate": None}, None

            from datetime import datetime, timedelta

            # Extract unique dates (calendar days) from food logs
            dates = set()
            for food in foods:
                if food.get("time"):
                    # Convert timestamp to date
                    dt = datetime.fromtimestamp(food["time"])
                    dates.add(dt.date())

            if not dates:
                return {"streak": 0, "lastFoodDate": None}, None

            # Sort dates in descending order
            sorted_dates = sorted(dates, reverse=True)
            today = datetime.now().date()
            yesterday = today - timedelta(days=1)

            # Check if most recent food log was today or yesterday
            most_recent = sorted_dates[0]
            if most_recent not in [today, yesterday]:
                # Streak is broken - no activity today or yesterday
                return {"streak": 0, "lastFoodDate": str(most_recent)}, None

            # Count consecutive days
            streak = 1
            for i in range(len(sorted_dates) - 1):
                current_date = sorted_dates[i]
                next_date = sorted_dates[i + 1]
                expected_prev = current_date - timedelta(days=1)

                if next_date == expected_prev:
                    streak += 1
                else:
                    break

            return {"streak": streak, "lastFoodDate": str(most_recent)}, None
        except Exception as e:
            return None, str(e)

    # ── USDA FoodData Central API Integration ─────────────────────────────────────
    @staticmethod
    def search_usda_foods(query, max_results=10):
        """
        Search USDA FoodData Central API for foods.
        Returns a list of foods with their FDC ID and nutritional information.
        """
        try:
            if not query or len(query.strip()) < 2:
                return [], None

            api_key = os.getenv("USDA_API_KEY")
            if not api_key:
                print("[ERROR] USDA_API_KEY not found in environment variables")
                return None, "USDA API key not configured"

            # USDA FDC API endpoint
            url = "https://api.nal.usda.gov/fdc/v1/foods/search"

            params = {
                "query": query,
                "api_key": api_key,
                "pageSize": max_results,
                "pageNumber": 1
            }

            print(f"[DEBUG] Calling USDA API with query: {query}")
            response = requests.get(url, params=params, timeout=10)

            print(f"[DEBUG] USDA API response status: {response.status_code}")

            if response.status_code != 200:
                error_msg = f"USDA API error: {response.status_code}"
                print(f"[ERROR] {error_msg}")
                print(f"[DEBUG] Response: {response.text[:500]}")
                return None, error_msg

            data = response.json()
            foods = data.get("foods", [])
            print(f"[DEBUG] Found {len(foods)} foods from USDA API")

            # Process and normalize results
            results = []
            for food in foods:
                food_entry = {
                    "fdcId": food.get("fdcId"),
                    "name": food.get("description", ""),
                    "calories": None,
                    "protein": None,
                    "carbs": None,
                    "fat": None,
                    "servingSize": None,
                    "servingUnit": None
                }

                # Extract nutritional information from foodNutrients
                if food.get("foodNutrients"):
                    for nutrient in food["foodNutrients"]:
                        nutrient_name = nutrient.get("nutrientName", "").lower()
                        nutrient_unit = nutrient.get("unitName", "").lower()
                        nutrient_value = nutrient.get("value")

                        # Energy / Calories: look for "energy" or "calor" in name and "kcal" in unit
                        if ("energy" in nutrient_name or "calor" in nutrient_name) and "kcal" in nutrient_unit:
                            food_entry["calories"] = nutrient_value
                        # Protein
                        elif "protein" in nutrient_name and food_entry["protein"] is None:
                            food_entry["protein"] = nutrient_value
                        # Carbohydrates
                        elif "carbohydrate" in nutrient_name and food_entry["carbs"] is None:
                            food_entry["carbs"] = nutrient_value
                        # Total Fat
                        elif "total" in nutrient_name and "lipid" in nutrient_name and food_entry["fat"] is None:
                            food_entry["fat"] = nutrient_value

                # Get serving size info if available
                if food.get("servingSize"):
                    food_entry["servingSize"] = food.get("servingSize")
                if food.get("servingSizeUnit"):
                    food_entry["servingUnit"] = food.get("servingSizeUnit")

                results.append(food_entry)

            print(f"[DEBUG] Processed {len(results)} food entries")
            return results, None

        except requests.exceptions.Timeout:
            error_msg = "USDA API request timed out. Please try again."
            print(f"[ERROR] {error_msg}")
            return None, error_msg
        except requests.exceptions.ConnectionError as e:
            error_msg = f"Connection error with USDA API: {str(e)}"
            print(f"[ERROR] {error_msg}")
            return None, error_msg
        except requests.exceptions.RequestException as e:
            error_msg = f"Network error connecting to USDA API: {str(e)}"
            print(f"[ERROR] {error_msg}")
            return None, error_msg
        except ValueError as e:
            error_msg = f"Invalid JSON response from USDA API: {str(e)}"
            print(f"[ERROR] {error_msg}")
            return None, error_msg
        except Exception as e:
            error_msg = f"Error searching USDA foods: {str(e)}"
            print(f"[ERROR] {error_msg}")
            import traceback
            traceback.print_exc()
            return None, error_msg

    # ── Favorite ───────────────────────────────────────────────────────────────
    @staticmethod
    def toggle_favorite(user_id, food_id):
        """Toggle favorite status of a food."""
        # Validate inputs
        if not user_id or not food_id:
            return None, "user_id and food_id are required"

        # Validate food_id format
        food_oid, err = FoodDriver._validate_obj_id(food_id, "food_id")
        if err:
            return None, err

        try:
            # Check that food exists and belongs to user
            food = FoodObject.find_by_id(food_oid)
            if not food:
                return None, "Food not found"

            # Verify user owns the food
            if str(food.get("user_id")) != str(user_id):
                return None, "You can only modify your own foods"

            updated = FoodObject.toggle_favorite(food_oid)
            if not updated:
                return None, "Food not found"
            return updated, None
        except Exception as e:
            return None, str(e)

    @staticmethod
    def get_favorite_foods(user_id):
        """Get all favorite foods for a user."""
        if not user_id:
            return None, "user_id is required"

        oid, err = FoodDriver._validate_obj_id(user_id, "user_id")
        if err:
            return None, err

        try:
            foods = FoodObject.find_favorites_by_user(user_id)
            return foods, None
        except Exception as e:
            return None, str(e)

#Services & Drivers know how to implement business Logic related to the Route operations.  Intermediate between Routes and Objects.  Ensures validations and rules are applied before Calling Objects to interact with
from DataModels.ExerciseObject import ExerciseObject
from DataModels.UserObject import UserObject
import json
from urllib.parse import urlencode
from bson import ObjectId, errors as bson_errors

class ExerciseDriver:
    # Static mapping and lists to avoid external API calls
    MUSCLE_MAP = {
        "abdominals": ["abs"],
        "abductors": ["abductors"],
        "abs": ["abs"],
        "adductors": ["adductors"],
        "biceps": ["biceps"],
        "calves": ["calves"],
        "chest": ["chest"],
        "core": ["abs", "obliques"],
        "forearms": ["forearm"],
        "full body": ["chest", "upper-back", "deltoids", "biceps", "triceps", "quadriceps", "hamstrings"],
        "glute medius": ["gluteal"],
        "glutes": ["gluteal"],
        "grip": ["forearm"],
        "hamstrings": ["hamstring"],
        "inner thighs": ["adductors"],
        "lats": ["upper-back"],
        "legs": ["quadriceps", "hamstrings", "calves"],
        "lower abs": ["abs"],
        "lower back": ["lower-back"],
        "mid back": ["upper-back"],
        "middle back": ["upper-back"],
        "neck": ["neck"],
        "obliques": ["obliques"],
        "quadriceps": ["quadriceps"],
        "rear delts": ["deltoids"],
        "shins": ["tibialis"],
        "shoulders": ["deltoids"],
        "sternocleidomastoid": ["neck"],
        "traps": ["trapezius"],
        "triceps": ["triceps"],
        "upper chest": ["chest"],
    }

    # Flattened unique list of muscle groups (values from MUSCLE_MAP)
    MUSCLES = sorted({m for vals in MUSCLE_MAP.values() for m in vals})

    # Body parts: include both the mapping keys and the normalized muscle groups
    BODYPARTS = sorted(set(list(MUSCLE_MAP.keys()) + list(MUSCLES)))

    # A reasonable static equipment list to use in place of the external API
    EQUIPMENTS = sorted([
        "barbell",
        "dumbbell",
        "kettlebell",
        "machine",
        "body weight",
        "medicine ball",
        "resistance band",
        "cable",
        "pull-up bar",
        "rower",
        "treadmill",
        "stationary bike",
        "elliptical",
        "sandbag",
        "sled",
        "smith machine",
        "victory rope",
    ])
    @staticmethod
    def normalize(items):
        if not items:
            return []

        # If we got a single dict, wrap it in a list
        if isinstance(items, dict):
            items = [items]
        elif not isinstance(items, (list, tuple)):
            # Unknown shape; bail out safely
            return []

        out = []
        for item in items:
            if not isinstance(item, dict):
                continue
            new_item = dict(item)  # shallow copy
            if "exercise_id" in new_item and "_id" not in new_item:
                new_item["_id"] = new_item.pop("exercise_id")
            out.append(new_item)
        return out

    @staticmethod
    def _validate_obj_id(id, name):
        try:
            return ObjectId(str(id)), None
        except (bson_errors.InvalidId, TypeError, ValueError):
            return None, f"Invalid {name} format; must be a 24-hex string"
        
    @staticmethod
    def verify_operation(user_id, exercise_id):
        if (not user_id) or (not exercise_id):
            return None, "Missing user or exercise_id"
        
        # Convert IDs safely
        user_id, err = ExerciseDriver._validate_obj_id(user_id, "user_id")
        if err:
            return None, err
        # Convert IDs safely
        exercise_id, err = ExerciseDriver._validate_obj_id(exercise_id, "exercise_id")
        if err:
            return None, err
        
        user = UserObject.find_by_id(user_id)
        if not user:
            return None, "User not found"
        exercise = ExerciseObject.find_by_id(exercise_id)
        if not exercise:
            return None, "Exercise not found"
        
        if user["_id"] == exercise["user_id"]:
            return "Operation valid", None
        elif ("Admin" in user["roles"]) or ("Developer" in user["roles"]):
            return "Operation valid", None
        else:
            return None, "You must operate on your own object or have sufficient privileges"

        
        
#--------------------------------------------------------------------------------------------------------------------------------------------------
        
    @staticmethod
    def get_initial_exercises():
        try:
            internalExercises = ExerciseObject.find_all()

            return internalExercises, None
        except Exception as e:
            return None, str(e)
        
    #Search exercises by name using external API and internal DB, then combine results
    @staticmethod
    def search_exercises(searchString):
        try:
            #Internal search for exercises that match the search string (case-insensitive) and combine with external API results
            internalWorkableData = ExerciseObject.find_all()

            # Filter internal exercises based on search string
            filtered_exercises = [
                ex                                              # 1. keep this item
                for ex in internalWorkableData                  # 2. loop through every exercise
                if searchString.lower() in ex["name"].lower()   # 3. only if this condition is true
            ]

            #Combine All Exercises and Return
            totalList = filtered_exercises
            return totalList, None
        
        except ValueError as e:
            return None, "Invalid JSON response: " + str(e)
        except Exception as e:
            return None, str(e)
        
    @staticmethod
    def get_exercise_by_id(id):
        # Convert IDs safely
        oid, err = ExerciseDriver._validate_obj_id(id, "exercise id")
        
        if oid:
            try:
                int_exercise = ExerciseObject.find_by_id(id)
                return int_exercise, None
            except Exception as e:
                return None, str(e)
        
        else:
            return None, "Exercise not found"

    @staticmethod
    def create_exercise(formData, owner_id):
        try:
            instructions_raw = formData.get("instructions", "")
            if isinstance(instructions_raw, str):
                instructions = [line.strip() for line in instructions_raw.split("\n") if line.strip()]
            else:
                instructions = instructions_raw if isinstance(instructions_raw, list) else []

            equipment_value = formData.get("equipment", "")
            equipments = [equipment_value] if equipment_value else []

            exercise_data = {
                "owner_id": ObjectId(owner_id),
                "name": formData.get("name"),
                "targetMuscles": formData.get("targetMuscles", []),
                "bodyParts": formData.get("bodyParts", []),
                "equipments": equipments,
                "secondaryMuscles": formData.get("secondaryMuscles", []),
                "instructions": instructions,
                "gifUrl": formData.get("gifUrl", ""),
            }
            
            exercise_id, error = ExerciseObject.create(exercise_data)
            if error:
                return None, error
            return exercise_id, None
        except Exception as e:
            return None, str(e)

    def update_exercise(exercise_id, update_data):
        try:
            existing_exercise = ExerciseObject.find_by_id(exercise_id)
            if not existing_exercise:
                return False, "Exercise not found"

            # Update fields
            for key in ["owner_id", "name", "body_part", "difficulty", "equipment", "instructions", "type"]:
                if key in update_data:
                    existing_exercise[key] = update_data[key]

            # Save updated exercise
            ExerciseObject.update(exercise_id, existing_exercise)
            return True, None
        except Exception as e:
            return False, str(e)
        
    @staticmethod
    def delete_exercise(exercise_id):
        exercise_id, err = ExerciseDriver._validate_obj_id(exercise_id, "exercise_id")
        if err:
            return None, err
        try:
            existing_exercise = ExerciseObject.find_by_id(exercise_id)
            if not existing_exercise:
                return False, "Exercise not found"

            ExerciseObject.delete(exercise_id)
            return True, None
        except Exception as e:
            return False, str(e)

    @staticmethod
    def get_bodyparts():
        try:
            return ExerciseDriver.BODYPARTS, None
        except Exception as e:
            return None, str(e)

    @staticmethod
    def get_muscles():
        try:
            # Return the normalized list of muscle groups (values from MUSCLE_MAP)
            return ExerciseDriver.MUSCLES, None
        except Exception as e:
            return None, str(e)

    @staticmethod
    def get_equipments():
        try:
            return ExerciseDriver.EQUIPMENTS, None
        except Exception as e:
            return None, str(e)

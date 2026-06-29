import os
import requests
from bson import ObjectId, errors as bson_errors
from Services.GymDriver import GymDriver
from Services.UserDriver import UserDriver
from Services.FoodDriver import FoodDriver
from Services.PersonalExDriver import PersonalExDriver
from Services.WorkoutDriver import WorkoutDriver
from Services.MeasurementDriver import MeasurementDriver
from Services.TaskDriver import TaskDriver
from Services.PromoDriver import PromoDriver

# Food

def test_find_food_by_id():
    # Give a valid gym_id
    oid = "699d0f5f888d8f649698307e"
    food, err = FoodDriver.get_food_by_id(oid)

    if err is not None:
        print("1.  There was a testing error on Test 1 Object was: ", food, "Error Was: ", err)

    # Assertions
    assert err is None
    assert food is not None
    assert food.get("_id") == oid
    assert food.get("user_id") == "699d0093795741a59fe13616"
    assert food.get("name") == "Apple"
    assert food.get("calsPerServing") == 95
    assert food.get("servings") == 1
    assert food.get("type") == "Lunch"
    assert food.get("time") == 1708473601

    # Give a invalid format (Non 24-hex string) user_id
    bad_oid = "699d0f5f888d8f649698307"
    food, err = FoodDriver.get_food_by_id(bad_oid)

    if err is None:
        print("2.  There should have been an error but wasn't on Test 2. Object was: ", food, "Error Was: ", err)

    # Expected
    bad_err_code = "Invalid food_id format; must be a 24-hex string"
    
    # Assertions
    assert food is None
    assert err == bad_err_code

    # Give a correctly formatted but non-existent (oid not in DB) user_id
    inv_oid = "000000000000000000000000"
    food, err = FoodDriver.get_food_by_id(inv_oid)

    if err is None:
        print("3.  There should have been an error but wasn't on Test 3. Object was: ", food, "Error Was: ", err)

    # Expected
    inv_err_code = "Food not found"
    
    # Assertions
    assert food is None
    assert err == inv_err_code

def test_find_food_by_user():
    # Give a valid email
    user_id = "699d0093795741a59fe13616"
    foods, err = FoodDriver.get_food_by_user(user_id)

    food = next((item for item in foods if item["_id"] == "699d0f5f888d8f649698307e"), None)

    if err is not None:
        print("5.  There was a testing error on Test 5 Object was: ", food, "Error Was: ", err)

    # Assertions
    assert err is None
    assert food is not None
    assert food.get("_id") == "699d0f5f888d8f649698307e"
    assert food.get("user_id") == user_id
    assert food.get("name") == "Apple"
    assert food.get("calsPerServing") == 95
    assert food.get("servings") == 1
    assert food.get("type") == "Lunch"
    assert food.get("time") == 1708473601

    # Give a invalid format (Non 24-hex string) user_id
    bad_user_id = "699d0093795741a59fe1361"
    food, err = FoodDriver.get_food_by_user(bad_user_id)

    if err is None:
        print("6.  There should have been an error but wasn't on Test 6. Object was: ", food, "Error Was: ", err)

    # Expected
    bad_err_code = "Invalid food_id format; must be a 24-hex string"
    
    # Assertions
    assert food is None
    assert err == bad_err_code

    # Give a correctly formatted but non-existent (oid not in DB) user_id
    inv_oid = "000000000000000000000000"
    food, err = FoodDriver.get_food_by_id(inv_oid)

    if err is None:
        print("7.  There should have been an error but wasn't on Test 7. Object was: ", food, "Error Was: ", err)

    # Expected
    inv_err_code = "Food not found"
    
    # Assertions
    assert food is None
    assert err == inv_err_code

def test_create_delete_food():
    # Give a valid user
    user_id = "699d0093795741a59fe13616"
    name = "Lettuce"
    calsPerServing = 0
    servings = 99
    type = "Snack"
    time = 0
    response_id, err = FoodDriver.create_food(user_id, name, calsPerServing, servings, type, time)

    if err is not None:
        print("8.  There was a testing error on Test 8 Object was: ", response_id, "Error Was: ", err)
        
    # Check if response is valid id
    try:
        responseObj = ObjectId(str(response_id))
    except (bson_errors.InvalidId, TypeError, ValueError):
        assert(False)

    # Give created gym_id
    food, err = FoodDriver.get_food_by_id(response_id)

    if err is not None:
        print("9.  There was a testing error on Test 9 Object was: ", food, "Error Was: ", err)

    # Assertions
    assert err is None
    assert food is not None
    assert food.get("_id") == response_id
    assert food.get("user_id") == "699d0093795741a59fe13616"
    assert food.get("name") == "Lettuce"
    assert food.get("calsPerServing") == 0
    assert food.get("servings") == 99
    assert food.get("type") == "Snack"
    assert food.get("time") == 0

    # Delete created gym
    response, err = FoodDriver.delete_food(response_id)
    if err is not None:
        print("10.  There was a testing error on Test 10 Object was: ", response, "Error Was: ", err)
    # Assertions
    assert response == response_id

def test_update_food_roundtrip():
    # Known existing document id from your tests/fixtures
    food_id = "699d0f5f888d8f649698307e"

    # Fetch the current/original state
    original, err = FoodDriver.get_food_by_id(food_id)
    if err is not None:
        print("Fetch original failed:", err)
    assert err is None
    assert original is not None
    assert original.get("_id") == food_id

    # Save original values for restore
    orig_user_id         = original.get("user_id")
    orig_name           = original.get("name")
    orig_calsPerServing = original.get("calsPerServing")
    orig_servings       = original.get("servings")
    orig_type           = original.get("type")
    orig_time           = original.get("time")

    # Sanity checks
    assert isinstance(orig_name, str)
    assert isinstance(orig_calsPerServing, int)
    assert isinstance(orig_servings, int)
    assert isinstance(orig_type, str)
    assert isinstance(orig_time, int)

    # UPDATE all editable fields
    new_values = {
        "name": "Banana",
        "calsPerServing": 105,
        "servings": 2,
        "type": "Snack",
        "time": 1708473602
    }

    updated, err = FoodDriver.update_food(food_id, new_values)
    if err is not None:
        print("Update failed:", err)
    assert err is None
    assert updated is not None
    assert updated.get("_id") == food_id

    # Assert updated values persisted
    assert updated.get("user_id") == orig_user_id
    assert updated.get("name") == new_values["name"]
    assert updated.get("calsPerServing") == new_values["calsPerServing"]
    assert updated.get("servings") == new_values["servings"]
    assert updated.get("type") == new_values["type"]
    assert updated.get("time") == new_values["time"]

    # Re-fetch to ensure DB persistence
    fetched, err = FoodDriver.get_food_by_id(food_id)
    if err is not None:
        print("Fetch after update failed:", err)
    assert err is None
    assert fetched is not None

    assert fetched.get("name") == new_values["name"]
    assert fetched.get("calsPerServing") == new_values["calsPerServing"]
    assert fetched.get("servings") == new_values["servings"]
    assert fetched.get("type") == new_values["type"]
    assert fetched.get("time") == new_values["time"]

    # RESTORE original values
    restore_payload = {
        "name": orig_name,
        "calsPerServing": orig_calsPerServing,
        "servings": orig_servings,
        "type": orig_type,
        "time": orig_time
    }

    restored, err = FoodDriver.update_food(food_id, restore_payload)
    if err is not None:
        print("Restore failed:", err)
    assert err is None
    assert restored is not None

    assert restored.get("name") == orig_name
    assert restored.get("calsPerServing") == orig_calsPerServing
    assert restored.get("servings") == orig_servings
    assert restored.get("type") == orig_type
    assert restored.get("time") == orig_time

    # Final re-fetch to ensure DB restore persisted
    final, err = FoodDriver.get_food_by_id(food_id)
    if err is not None:
        print("Fetch after restore failed:", err)
    assert err is None
    assert final is not None

    assert final.get("name") == orig_name
    assert final.get("calsPerServing") == orig_calsPerServing
    assert final.get("servings") == orig_servings
    assert final.get("type") == orig_type
    assert final.get("time") == orig_time
    
def test_food_invalid_inputs():
    valid_food_id = "699d0f5f888d8f649698307e"
    valid_user_id = "699d0093795741a59fe13616"

    # ===============================================================
    # CREATE FOOD — INVALID INPUTS
    # ===============================================================
    base_create = {
        "user_id": valid_user_id,
        "name": "Apple",
        "calsPerServing": 95,
        "servings": 1,
        "type": "Snack",
        "time": 123
    }

    # Missing required values
    missing_cases = [
        {**base_create, "user_id": None},
        {**base_create, "name": ""},
        {**base_create, "calsPerServing": None},
        {**base_create, "servings": 0},
        {**base_create, "type": ""},
        {**base_create, "time": None},
    ]

    for case in missing_cases:
        resp, err = FoodDriver.create_food(**case)
        assert resp is None
        assert err == "You are missing a value. Please fix, then attempt to create food again"

    # Invalid user_id formats
    resp, err = FoodDriver.create_food("nothex", "Apple", 95, 1, "Snack", 100)
    assert resp is None
    assert err == "Invalid userid format; must be a 24-hex string"

    # User not found
    resp, err = FoodDriver.create_food("000000000000000000000000", "Apple", 95, 1, "Snack", 100)
    assert resp is None
    assert err == "User not found"

    # GET FOOD INVALID INPUTS
    for bad_id in [None, "", "nothex", 123, [], {}]:
        resp, err = FoodDriver.get_food_by_id(bad_id)
        assert resp is None
        assert err is not None

    for bad_id in [None, "", "nothex", 123, [], {}]:
        resp, err = FoodDriver.get_food_by_user(bad_id)
        assert resp is None
        assert err is not None

    # DELETE FOOD INVALID INPUTS
    # Missing id
    resp, err = FoodDriver.delete_food(None)
    assert resp is None
    assert err == "You must provide a food id to delete"

    # Wrong types
    for bad_id in ["", 123, [], {}]:
        resp, err = FoodDriver.delete_food(bad_id)
        assert resp is None
        assert err is not None

    # Valid format but not found
    resp, err = FoodDriver.delete_food("000000000000000000000000")
    assert resp is None
    assert err == "Food not found or already deleted"

    # UPDATE FOOD INVALID INPUTS
    # Invalid food_id formats
    for bad in [None, "", 123, [], {}, "nothex"]:
        resp, err = FoodDriver.update_food(bad, {"name": "Test"})
        assert resp is None
        assert err == "Invalid food_id format; must be a 24-hex string" or "You must provide a food id to update"

    # Missing updates argument
    resp, err = FoodDriver.update_food(valid_food_id, None)
    assert resp is None
    assert err == "You must provide at least one field to update"

    # updates is not a dict
    for bad in ["string", 123, [], True, 3.14]:
        resp, err = FoodDriver.update_food(valid_food_id, bad)
        assert resp is None
        assert err == "You must provide at least one field to update"

    # No valid fields
    resp, err = FoodDriver.update_food(valid_food_id, {"junk": 123})
    assert resp is None
    assert err == "No valid fields to update"

    # Invalid types for allowed fields
    invalid_field_cases = [
        {"name": 123},
        {"calsPerServing": "bad"},
        {"servings": "many"},
        {"type": 999},
        {"time": "nope"},
    ]

    for updates in invalid_field_cases:
        resp, err = FoodDriver.update_food(valid_food_id, updates)
        assert resp is None
        assert err is not None

    # Mixed valid + invalid
    resp, err = FoodDriver.update_food(valid_food_id, {"name": "Good", "calsPerServing": "bad"})
    assert resp is None
    assert err is not None

    # Valid format but food does not exist
    resp, err = FoodDriver.update_food("000000000000000000000000", {"name": "Test"})
    assert resp is None
    assert err == "Food not found"

def test_food_partial_empty_unknown_updates():
    valid_user_id = "699d0093795741a59fe13616"
    valid_food_id = "699d0f5f888d8f649698307e"

    original, err = FoodDriver.get_food_by_id(valid_food_id)

    # UPDATE — PARTIAL UPDATE
    partial_update = {"name": "PartialUpdateName"}
    updated, err = FoodDriver.update_food(valid_food_id, partial_update)

    assert err is None
    assert updated is not None
    assert updated.get("name") == "PartialUpdateName"

    # UPDATE — EMPTY DICT
    resp, err = FoodDriver.update_food(valid_food_id, {})
    assert resp is None
    assert err == "You must provide at least one field to update" or err == "No valid fields to update"

    # UPDATE — ONLY UNKNOWN FIELDS
    unknown_update = {"notARealField": 123, "user_id": "SHOULD_NOT_BE_ALLOWED"}

    resp, err = FoodDriver.update_food(valid_food_id, unknown_update)
    assert resp is None
    assert err == "No valid fields to update"

    # UPDATE — MIX OF VALID + UNKNOWN FIELDS
    # unknown fields should be ignored, valid ones applied
    mixed_update = {
        "name": "MixedUpdateName",
        "calsPerServing": 200,
        "junk": "ignore me",
        "somethingElse": 999,
    }

    updated, err = FoodDriver.update_food(valid_food_id, mixed_update)
    assert err is None
    assert updated.get("name") == "MixedUpdateName"
    assert updated.get("calsPerServing") == 200
    assert "junk" not in updated
    assert "somethingElse" not in updated

    # RESTORE ORIGINAL VALUES
    # Fetch original to restore exactly
    restore = {
        "name": original["name"],
        "calsPerServing": original["calsPerServing"],
        "servings": original["servings"],
        "type": original["type"],
        "time": original["time"],
    }

    restored, err = FoodDriver.update_food(valid_food_id, restore)
    assert err is None
    assert restored["name"] == original["name"]

# Gym

def test_find_gym_by_id():
    # Give a valid gym_id
    oid = "699cff88400d9d43a32e924d"
    gym, err = GymDriver.get_gym_by_id(oid, "699d0093795741a59fe13616")

    if err is not None:
        print("11.  There was a testing error on Test 11 Object was: ", gym, "Error Was: ", err)

    # Assertions
    assert err is None
    assert gym is not None
    assert gym.get("_id") == oid
    assert gym.get("name") == "Downtown Fitness"
    assert gym.get("address") == "123 Main St, Anytown, USA"
    assert gym.get("cost") == 49.99
    assert gym.get("link") == "https://examplegym.com"
    assert gym.get("isPublic") == True

    # Give a bad gym_id
    bad_oid = "699cff88400d9d43a32e924"
    gym, err = GymDriver.get_gym_by_id(bad_oid, "699d0093795741a59fe13616")

    if err is not None:
        print("12.  There was a testing error on Test 12 Object was: ", gym, "Error Was: ", err)

    # Expected
    bad_err_code = "Invalid gym_id format; must be a 24-hex string"
    
    # Assertions
    assert gym is None
    assert err == bad_err_code

    # Give an invalid gym_id
    inv_oid = "111111111111111111111111"
    
    gym, err = GymDriver.get_gym_by_id(inv_oid, "699d0093795741a59fe13616")

    if err is not None:
        print("13.  There was a testing error on Test 13 Object was: ", gym, "Error Was: ", err)

    # Expected
    inv_err_code = "Gym not found"
    
    # Assertions
    assert gym is None
    assert err == inv_err_code    

def test_create_delete_gym():
    # Give a valid gym_id
    user_id = ObjectId("699d0093795741a59fe13616")
    name = "A test Gym, you shouldnt see this"
    address = "Hell"
    type = "General"
    cost = 0.0
    link = "www.testgym.com"
    lat = 1.0
    long = 2.0
    notes = "test"
    response_id, res_err = GymDriver.create_gym(user_id, name, address, type, cost, link, lat, long, notes)

    print("Response: ", response_id)

    if res_err is not None:
        print("14.  There was a testing error on Test 14 Object was: ", response_id, "Error Was: ", res_err)

    # Check if response is valid id
    try:
        responseObj = ObjectId(str(response_id))
    except (bson_errors.InvalidId, TypeError, ValueError):
        assert(False)

    # Give created gym_id
    gym, err = GymDriver.get_gym_by_id(response_id, user_id)

    if err is not None:
        print(gym, err)

    # Assertions
    assert err is None
    assert gym is not None
    assert gym.get("_id") == response_id
    assert gym.get("name") == "A test Gym, you shouldnt see this"
    assert gym.get("address") == "Hell"
    assert gym.get("cost") == 0.0
    assert gym.get("link") == "www.testgym.com"

    # Delete created gym
    response, err = GymDriver.delete_gym(response_id, user_id)
    if err is not None:
        print("15.  There was a testing error on Test 15 Object was: ", response, "Error Was: ", err)
    # Assertions
    assert response == response_id

def test_update_gym_roundtrip():
    gym_id = "699cff88400d9d43a32e924d"  # replace with a known existing id in your test DB

    # Fetch current/original state
    original, err = GymDriver.get_gym_by_id(gym_id, "699d0093795741a59fe13616")
    if err is not None:
        print("Fetch original gym failed:", err)
    assert err is None
    assert original is not None
    assert original.get("_id") == gym_id

    # Keep original values for restore
    orig_name = original.get("name")
    orig_address = original.get("address")
    orig_cost = original.get("cost")
    orig_link = original.get("link")
    orig_lat = original.get("lat")
    orig_lng = original.get("lng")
    orig_notes = original.get("notes")

    # Update all allowed fields
    new_values = {
        "name":    "Test Gym",
        "address": "456 Main St, Testville, USA",
        "cost":    19.99,
        "link":    "https://gym.example.com",
        "lat":     44.1234,
        "lng":     -91.5678,
        "notes":   "Test roundtrip"
    }
    updated, err = GymDriver.update_gym(gym_id, "699d0093795741a59fe13616", new_values)
    if err is not None:
        print("Update gym failed:", err)
    assert err is None
    assert updated is not None
    assert updated.get("_id") == gym_id

    # Assert fields updated
    assert updated.get("name") == new_values["name"]
    assert updated.get("address") == new_values["address"]
    assert updated.get("cost") == new_values["cost"]
    assert updated.get("link") == new_values["link"]
    assert updated.get("lat") == new_values["lat"]
    assert updated.get("lng") == new_values["lng"]
    assert updated.get("notes") == new_values["notes"]

    # Re-fetch to confirm persistence
    fetched_after_update, err = GymDriver.get_gym_by_id(gym_id, "699d0093795741a59fe13616")
    if err is not None:
        print("Fetch after update failed:", err)
    assert err is None
    assert fetched_after_update is not None
    assert fetched_after_update.get("_id") == gym_id

    assert fetched_after_update.get("name") == new_values["name"]
    assert fetched_after_update.get("address") == new_values["address"]
    assert fetched_after_update.get("cost") == new_values["cost"]
    assert fetched_after_update.get("link") == new_values["link"]
    assert fetched_after_update.get("lat") == new_values["lat"]
    assert fetched_after_update.get("lng") == new_values["lng"]
    assert fetched_after_update.get("notes") == new_values["notes"]

    # Restore original values
    restore_payload = {
        "name":    orig_name,
        "address": orig_address,
        "cost":    orig_cost,
        "link":    orig_link,
        "lat":     orig_lat,
        "lng":     orig_lng,
        "notes":   orig_notes
    }
    restored, err = GymDriver.update_gym(gym_id, "699d0093795741a59fe13616", restore_payload)
    if err is not None:
        print("Restore gym failed:", err)
    assert err is None
    assert restored is not None
    assert restored.get("_id") == gym_id

    # Assert restored to original
    assert restored.get("name") == orig_name
    assert restored.get("address") == orig_address
    assert restored.get("cost") == orig_cost
    assert restored.get("link") == orig_link
    assert restored.get("lat") == orig_lat
    assert restored.get("lng") == orig_lng
    assert restored.get("notes") == orig_notes

    # Re-fetch to confirm final persistence
    fetched_after_restore, err = GymDriver.get_gym_by_id(gym_id, "699d0093795741a59fe13616")
    if err is not None:
        print("Fetch after restore failed:", err)
    assert err is None
    assert fetched_after_restore is not None
    assert fetched_after_restore.get("_id") == gym_id

    assert fetched_after_restore.get("name") == orig_name
    assert fetched_after_restore.get("address") == orig_address
    assert fetched_after_restore.get("cost") == orig_cost
    assert fetched_after_restore.get("link") == orig_link
    assert fetched_after_restore.get("lat") == orig_lat
    assert fetched_after_restore.get("lng") == orig_lng
    assert fetched_after_restore.get("notes") == orig_notes

def test_gym_invalid_inputs_combined():
    valid_gym_id = "699cff88400d9d43a32e924d"

    # CREATE — INVALID INPUTS
    # Missing required name/address
    resp, err = GymDriver.create_gym("699d0093795741a59fe13616", "", "Address", "General", 0, "", 0, 0, "")
    assert resp is None
    assert err == "You are missing a name or address. Please fix, then attempt to create gym again"

    resp, err = GymDriver.create_gym("699d0093795741a59fe13616", "Gym", "", "General", 0, "", 0, 0, "")
    assert resp is None
    assert err == "You are missing a name or address. Please fix, then attempt to create gym again"

    # GET GYM INVALID INPUTS
    for bad in [None, "", "nothex", 123, [], {}]:
        resp, err = GymDriver.get_gym_by_id(bad, "699d0093795741a59fe13616")
        assert resp is None
        assert err == "Invalid gym_id format; must be a 24-hex string" or err is not None

    # Valid format but not found
    resp, err = GymDriver.get_gym_by_id("111111111111111111111111", "699d0093795741a59fe13616")
    assert resp is None
    assert err == "Gym not found"

    # DELETE GYM INVALID INPUTS
    resp, err = GymDriver.delete_gym(None, "699d0093795741a59fe13616")
    assert resp is None
    assert err == "You must provide a gym_id to delete"

    for bad in ["", [], {}, 123]:
        resp, err = GymDriver.delete_gym(bad, "699d0093795741a59fe13616")
        assert resp is None
        assert err == "Invalid gym_id format; must be a 24-hex string" or "You must provide a gym_id to delete"

    resp, err = GymDriver.delete_gym("111111111111111111111111", "699d0093795741a59fe13616")
    assert resp is None
    assert err == "Gym not found or already deleted"

def test_gym_partial_empty_unknown_updates():
    gym_id = "699cff88400d9d43a32e924d"

    # Fetch original state to restore later
    original, err = GymDriver.get_gym_by_id(gym_id, "699d0093795741a59fe13616")
    assert err is None

    orig_values = {
        "name": original["name"],
        "address": original["address"],
        "cost": original["cost"],
        "link": original["link"],
        "lat": original["lat"],
        "lng": original["lng"],
        "notes": original["notes"],
    }

    # PARTIAL UPDATE
    update_1 = {"name": "PartialName"}
    updated, err = GymDriver.update_gym(gym_id, "699d0093795741a59fe13616", update_1)
    assert err is None
    assert updated["name"] == "PartialName"

    # EMPTY UPDATE (should error)
    resp, err = GymDriver.update_gym(gym_id, "699d0093795741a59fe13616", {})
    assert resp is None
    assert err == "You must provide at least one field to update" or err == "No valid fields to update"

    # ONLY UNKNOWN FIELDS (should error)
    resp, err = GymDriver.update_gym(gym_id, "699d0093795741a59fe13616", {"notAField": 123, "junk": True})
    assert resp is None
    assert err == "No valid fields to update"

    # MIXED VALID + UNKNOWN (valid applied, unknown ignored)
    update_2 = {
        "name": "MixedName",
        "cost": 999.99,
        "junk": 5,
        "invalidField": "ignore",
    }
    updated, err = GymDriver.update_gym(gym_id, "699d0093795741a59fe13616", update_2)
    assert err is None
    assert updated["name"] == "MixedName"
    assert updated["cost"] == 999.99
    assert "junk" not in updated
    assert "invalidField" not in updated

    # RESTORE ORIGINAL VALUES
    restored, err = GymDriver.update_gym(gym_id, "699d0093795741a59fe13616", orig_values)
    assert err is None

    for key, val in orig_values.items():
        assert restored[key] == val

# Personal Ex

def test_find_personal_ex_by_id():
    # Give a valid _id
    oid = "69ab5596dc5dee4f518a01cd"
    ex, err = PersonalExDriver.get_personal_ex_by_id(oid)

    if err is not None:
        print("16.  There was a testing error on Test 16 Object was: ", ex, "Error Was: ", err)

    # Assertions
    assert err is None
    assert ex is not None
    assert ex.get("_id") == oid
    assert ex.get("complete") == False
    assert ex.get("distance") == 0
    assert ex.get("duration") == 120
    assert ex.get("exercise_id") == "69b4885e542988e24fee392e"
    assert ex.get("reps") == 10
    assert ex.get("sets") == 35
    assert ex.get("user_id") == "699d0093795741a59fe13616"
    assert ex.get("weight") == 150
    assert ex.get("workout_id") == "699d05d8f1677119323250bc"

    # Give a bad _id
    bad_oid = "69ab5596dc5dee4f518a01c"
    ex, err = PersonalExDriver.get_personal_ex_by_id(bad_oid)

    if err is not None:
        print("17.  There was a testing error on Test 17 Object was: ", ex, "Error Was: ", err)

    # Expected
    bad_err_code = "Invalid personal ex id format; must be a 24-hex string"
    
    # Assertions
    assert ex is None
    assert err == bad_err_code

    # Give an invalid _id
    inv_oid = "000000000000000000000000"
    ex, err = PersonalExDriver.get_personal_ex_by_id(inv_oid)

    if err is not None:
        print("18.  There was a testing error on Test 18 Object was: ", ex, "Error Was: ", err)

    # Expected
    inv_err_code = "PersonalEx not found"
    
    # Assertions
    assert ex is None
    assert err == inv_err_code 

def test_find_personal_ex_by_workout():
    # Give a valid _id
    oid = "699d05d8f1677119323250bc"
    exs, err = PersonalExDriver.get_personal_exs_by_workout(oid)

    if err is not None:
        print("19.  There was a testing error on Test 19 Object was: ", exs, "Error Was: ", err)
    
    pe_oid = "69ab5596dc5dee4f518a01cd"
    filtered = [d for d in exs if d.get("_id") == pe_oid]

    assert len(filtered) == 1

    # Assertions
    assert err is None
    assert filtered[0] is not None
    assert filtered[0].get("_id") == pe_oid
    assert filtered[0].get("complete") == False
    assert filtered[0].get("distance") == 0
    assert filtered[0].get("duration") == 120
    assert filtered[0].get("exercise_id") == "69b4885e542988e24fee392e"
    assert filtered[0].get("reps") == 10
    assert filtered[0].get("sets") == 35
    assert filtered[0].get("user_id") == "699d0093795741a59fe13616"
    assert filtered[0].get("weight") == 150
    assert filtered[0].get("workout_id") == "699d05d8f1677119323250bc"

    # Give a bad _id
    bad_oid = "699d05d8f1677119323250b"
    exs, err = PersonalExDriver.get_personal_exs_by_workout(bad_oid)

    if err is not None:
        print("20.  There was a testing error on Test 20 Object was: ", exs, "Error Was: ", err)

    # Expected
    bad_err_code = "Invalid workout_id format; must be a 24-hex string"
    
    # Assertions
    assert exs is None
    assert err == bad_err_code

    # Give an invalid _id
    inv_oid = "000000000000000000000000"
    exs, err = PersonalExDriver.get_personal_exs_by_workout(inv_oid)

    if err is not None:
        print("21.  There was a testing error on Test 21 Object was: ", exs, "Error Was: ", err)

    # Expected
    inv_err_code = "PersonalEx not found"
    
    # Assertions
    assert exs is None
    assert err == inv_err_code 

def test_find_personal_ex_by_user():
    # Give a valid _id
    oid = "699d0093795741a59fe13616"
    exs, err = PersonalExDriver.get_personal_exs_by_user(oid)

    if err is not None:
        print("22.  There was a testing error on Test 22 Object was: ", exs, "Error Was: ", err)
    
    pe_oid = "69ab5596dc5dee4f518a01cd"
    filtered = [d for d in exs if d.get("_id") == pe_oid]

    assert len(filtered) == 1

    # Assertions
    assert err is None
    assert filtered[0] is not None
    assert filtered[0].get("_id") == pe_oid
    assert filtered[0].get("complete") == False
    assert filtered[0].get("distance") == 0
    assert filtered[0].get("duration") == 120
    assert filtered[0].get("exercise_id") == "69b4885e542988e24fee392e"
    assert filtered[0].get("reps") == 10
    assert filtered[0].get("sets") == 35
    assert filtered[0].get("user_id") == "699d0093795741a59fe13616"
    assert filtered[0].get("weight") == 150
    assert filtered[0].get("workout_id") == "699d05d8f1677119323250bc"

    # Give a bad _id
    bad_oid = "699d0093795741a59fe1361"
    exs, err = PersonalExDriver.get_personal_exs_by_user(bad_oid)

    if err is not None:
        print("23.  There was a testing error on Test 23 Object was: ", exs, "Error Was: ", err)

    # Expected
    bad_err_code = "Invalid user_id format; must be a 24-hex string"
    
    # Assertions
    assert exs is None
    assert err == bad_err_code

    # Give an invalid _id
    inv_oid = "000000000000000000000000"
    exs, err = PersonalExDriver.get_personal_exs_by_user(inv_oid)

    if err is not None:
        print("24.  There was a testing error on Test 24 Object was: ", exs, "Error Was: ", err)

    # Expected
    inv_err_code = "PersonalEx not found"
    
    # Assertions
    assert exs is None
    assert err == inv_err_code 

def test_create_delete_personal_ex():
    # Give a valid gym_id
    completed = False
    distance = 0
    duration = 240
    exercise_id = "698d0bc06e5117c22dd7774b"
    workout_id = "69d43248f826ab5daa4431af"
    reps = 1
    sets = 1
    user_id = "699d0093795741a59fe13616"
    weight = 600
    response_id, err = PersonalExDriver.create_personal_ex(user_id, exercise_id, workout_id, reps, sets, weight, duration, distance, completed)

    if err is not None:
        print("25.  There was a testing error on Test 25 Object was: ", response_id, "Error Was: ", err)

    # Check if response is valid id
    try:
        responseObj = ObjectId(str(response_id))
    except (bson_errors.InvalidId, TypeError, ValueError):
        assert(False)

    # Give created gym_id
    personalEx, err = PersonalExDriver.get_personal_ex_by_id(response_id)

    if err is not None:
        print("26.  There was a testing error on Test 26 Object was: ", personalEx, "Error Was: ", err)

    # Assertions
    assert err is None
    assert personalEx is not None
    assert personalEx.get("_id") == response_id
    assert personalEx.get("complete") == False
    assert personalEx.get("distance") == 0
    assert personalEx.get("duration") == 240
    assert personalEx.get("exercise_id") == "698d0bc06e5117c22dd7774b"
    assert personalEx.get("workout_id") == "69d43248f826ab5daa4431af"
    assert personalEx.get("reps") == 1
    assert personalEx.get("sets") == 1
    assert personalEx.get("user_id") == "699d0093795741a59fe13616"
    assert personalEx.get("weight") == 600

    # Delete created gym
    response, err = PersonalExDriver.delete_personal_ex(response_id)
    if err is not None:
        print("27.  There was a testing error on Test 27 Object was: ", response, "Error Was: ", err)
    # Assertions
    assert response == response_id
   
def test_update_personal_ex_roundtrip():
    personal_ex_id = "69ab5596dc5dee4f518a01cd"

    original, err = PersonalExDriver.get_personal_ex_by_id(personal_ex_id)
    if err is not None:
        print("Fetch original failed:", err)
    assert err is None
    assert original is not None
    assert original.get("_id") == personal_ex_id

    orig_reps      = original.get("reps")
    orig_sets      = original.get("sets")
    orig_weight    = original.get("weight")
    orig_duration  = original.get("duration")
    orig_distance  = original.get("distance")
    orig_complete  = original.get("complete")

    restore = {
        "reps": orig_reps,
        "sets": orig_sets,
        "weight": orig_weight,
        "duration": orig_duration,
        "distance": orig_distance,
        "complete": orig_complete
    }

    new_values = {
        "reps": 999,
        "sets": 999,
        "weight": 999,    
        "duration": 999,    
        "distance": 999,  
        "complete": True
    }

    updated, err_1 = PersonalExDriver.update_personal_ex(id=personal_ex_id, updates=new_values)
    fetched_after_update, err_2 = PersonalExDriver.get_personal_ex_by_id(personal_ex_id)
    restored, err_3 = PersonalExDriver.update_personal_ex(id=personal_ex_id, updates=restore)
    fetched_after_restore, err_4 = PersonalExDriver.get_personal_ex_by_id(personal_ex_id)

    if err_1 is not None:
        print("Update failed:", err)

    assert err is None
    assert updated is not None
    assert updated.get("_id") == personal_ex_id

    assert updated.get("reps") == new_values["reps"]
    assert updated.get("sets") == new_values["sets"]
    assert updated.get("weight") == new_values["weight"]
    assert updated.get("duration") == new_values["duration"]
    assert updated.get("distance") == new_values["distance"]
    assert updated.get("complete") == new_values["complete"]

    if err_2 is not None:
        print("Fetch after update failed:", err)
    assert err_2 is None
    assert fetched_after_update is not None
    assert fetched_after_update.get("_id") == personal_ex_id

    # Assert values are exactly as updated
    assert fetched_after_update.get("reps") == new_values["reps"]
    assert fetched_after_update.get("sets") == new_values["sets"]
    assert fetched_after_update.get("weight") == new_values["weight"]
    assert fetched_after_update.get("duration") == new_values["duration"]
    assert fetched_after_update.get("distance") == new_values["distance"]
    assert fetched_after_update.get("complete") == new_values["complete"]

    if err_3 is not None:
        print("Restore failed:", err)
    assert err is None
    assert restored is not None
    assert restored.get("_id") == personal_ex_id

    # Assert restored document reflects the original values
    assert restored.get("reps") == orig_reps
    assert restored.get("sets") == orig_sets
    assert restored.get("weight") == orig_weight
    assert restored.get("duration") == orig_duration
    assert restored.get("distance") == orig_distance
    assert restored.get("complete") == orig_complete

    
    if err_4 is not None:
        print("Fetch after restore failed:", err)
    assert err_4 is None
    assert fetched_after_restore is not None
    assert fetched_after_restore.get("_id") == personal_ex_id

    assert fetched_after_restore.get("reps") == orig_reps
    assert fetched_after_restore.get("sets") == orig_sets
    assert fetched_after_restore.get("weight") == orig_weight
    assert fetched_after_restore.get("duration") == orig_duration
    assert fetched_after_restore.get("distance") == orig_distance
    assert fetched_after_restore.get("complete") == orig_complete

def test_personal_ex_invalid_inputs_combined():
    valid_user_id = "699d0093795741a59fe13616"
    valid_workout_id = "69d43248f826ab5daa4431af"
    valid_personal_ex_id = "69ab5596dc5dee4f518a01cd"

    # CREATE — INVALID INPUTS

    # Missing required identifiers
    missing_required = [
        (None, "ex", valid_workout_id),
        (valid_user_id, None, valid_workout_id),
        (valid_user_id, "ex", None),
    ]
    for uid, exid, wid in missing_required:
        resp, err = PersonalExDriver.create_personal_ex(
            uid, exid, wid,
            reps=1, sets=1, weight=100, duration=60, distance="0", complete=False
        )
        assert resp is None
        assert err == "You are missing a user_id, workout_id or exercise_id. Please fix, then attempt to create personalEx again"

    # Invalid user / workout IDs
    for bad in ["nothex", 123, [], {}, ""]:
        resp, err = PersonalExDriver.create_personal_ex(
            bad, "ex", valid_workout_id,
            reps=1, sets=1, weight=100, duration=60, distance=0, complete=False
        )
        assert resp is None
        assert err == "You are missing a user_id, workout_id or exercise_id. Please fix, then attempt to create personalEx again" or "Invalid user_id format; must be a 24-hex string"

    for bad in ["nothex", 123, [], {}, ""]:
        resp, err = PersonalExDriver.create_personal_ex(
            valid_user_id, "ex", bad,
            reps=1, sets=1, weight=100, duration=60, distance=0, complete=False
        )
        assert resp is None
        assert err == "You are missing a user_id, workout_id or exercise_id. Please fix, then attempt to create personalEx again" or "Invalid user_id format; must be a 24-hex string"

    # GET PERSONAL EX BY ID — INVALID INPUTS

    for bad in [None, "", 123, [], {}, "nothex"]:
        resp, err = PersonalExDriver.get_personal_ex_by_id(bad)
        assert resp is None
        assert "Invalid personal ex id format" in err or err is not None

    resp, err = PersonalExDriver.get_personal_ex_by_id("000000000000000000000000")
    assert resp is None
    assert err == "PersonalEx not found"

    # GET PERSONAL EX BY USER — INVALID INPUTS

    for bad in [None, "", 123, [], {}, "nothex"]:
        resp, err = PersonalExDriver.get_personal_exs_by_user(bad)
        assert resp is None
        assert "Invalid user_id format" in err or err is not None

    resp, err = PersonalExDriver.get_personal_exs_by_user("000000000000000000000000")
    assert resp is None
    assert err == "PersonalEx not found"

    # GET PERSONAL EX BY WORKOUT — INVALID INPUTS

    for bad in [None, "", 123, [], {}, "nothex"]:
        resp, err = PersonalExDriver.get_personal_exs_by_workout(bad)
        assert resp is None
        assert "Invalid workout_id format" in err or err is not None

    resp, err = PersonalExDriver.get_personal_exs_by_workout("000000000000000000000000")
    assert resp is None
    assert err == "PersonalEx not found"

    # DELETE PERSONAL EX — INVALID INPUTS

    resp, err = PersonalExDriver.delete_personal_ex(None)
    assert resp is None
    assert err == "You must provide a personal ex id to delete"

    for bad in ["", 123, [], {}, "nothex"]:
        resp, err = PersonalExDriver.delete_personal_ex(bad)
        assert resp is None
        assert err == "You must provide a personal ex id to delete" or "Invalid personal_ex_id format; must be a 24-hex string"

    resp, err = PersonalExDriver.delete_personal_ex("000000000000000000000000")
    assert resp is None
    assert err == "Personal ex not found or already deleted"

    # UPDATE PERSONAL EX — INVALID INPUTS

    for bad in [None, "", 123, [], {}, "nothex"]:
        resp, err = PersonalExDriver.update_personal_ex(bad, {"reps": 10})
        assert resp is None
        assert err == "You must provide a personal ex id to update" or "Invalid personal_ex_id format; must be a 24-hex string"

    resp, err = PersonalExDriver.update_personal_ex(valid_personal_ex_id, None)
    assert resp is None
    assert err == "You must provide at least one field to update"

def test_personal_ex_partial_empty_unknown_updates():
    personal_ex_id = "69ab5596dc5dee4f518a01cd"

    # Fetch original
    original, err = PersonalExDriver.get_personal_ex_by_id(personal_ex_id)
    assert err is None

    orig_values = {
        "reps": original["reps"],
        "sets": original["sets"],
        "weight": original["weight"],
        "duration": original["duration"],
        "distance": original["distance"],
        "complete": original["complete"],
    }

    # Partial update: only 1 field
    partial = {"reps": 123}
    updated, err = PersonalExDriver.update_personal_ex(personal_ex_id, partial)
    assert err is None
    assert updated["reps"] == 123

    # Empty update should error
    resp, err = PersonalExDriver.update_personal_ex(personal_ex_id, {})
    assert resp is None
    assert err == "You must provide at least one field to update"

    # Unknown-only fields should error
    resp, err = PersonalExDriver.update_personal_ex(personal_ex_id, {"junk": 55})
    assert resp is None
    assert err == "PersonalEx not found or no changes applied" or err == "You must provide at least one field to update"

    # Mixed fields: valid + unknown
    # Unknown should be ignored
    mixed = {
        "reps": 888,
        "junk": True,
        "invalidField": "ignore",
    }
    updated, err = PersonalExDriver.update_personal_ex(personal_ex_id, mixed)
    assert err is None
    assert updated["reps"] == 888
    assert "junk" not in updated
    assert "invalidField" not in updated

    # Restore original values
    restored, err = PersonalExDriver.update_personal_ex(personal_ex_id, orig_values)
    assert err is None

    for k, v in orig_values.items():
        assert restored[k] == v

# User

def test_find_user_by_id():
    # Give a valid gym_id
    oid = "699d0093795741a59fe13616"
    user, err = UserDriver.get_user_by_id(oid)

    if err is not None:
        print("28.  There was a testing error on Test 28 Object was: ", user, "Error Was: ", err)

    # Assertions
    assert err is None
    assert user is not None
    assert user.get("_id") == oid
    assert user.get("name") == "Test User"
    assert user.get("email") == "test@email.com"
    assert user.get("picture") == "pic.png"
    assert user.get("last_login_time") == 1000000000
    assert user.get("last_login_expire") == 1000000009
    assert user.get("magic_bits") == "010101010101010101010101010101_0"

    # Give a bad user_id
    bad_oid = "699d0093795741a59fe1361"
    user, err = UserDriver.get_user_by_id(bad_oid)

    if err is not None:
        print("29.  There was a testing error on Test 29 Object was: ", user, "Error Was: ", err)

    # Expected
    bad_err_code = "Invalid user_id format; must be a 24-hex string"
    
    # Assertions
    assert user is None
    assert err == bad_err_code

    # Give an invalid user_id
    inv_oid = "000000000000000000000000"
    user, err = UserDriver.get_user_by_id(inv_oid)

    if err is not None:
        print("30.  There was a testing error on Test 30 Object was: ", user, "Error Was: ", err)

    # Expected
    inv_err_code = "User not found"
    
    # Assertions
    assert user is None
    assert err == inv_err_code

def test_find_user_by_email():
    # Give a valid email
    email = "test@email.com"
    user, err = UserDriver.get_user_by_email(email)

    if err is not None:
        print("31.  There was a testing error on Test 31 Object was: ", user, "Error Was: ", err)

    # Assertions
    assert err is None
    assert user is not None
    assert user.get("_id") == "699d0093795741a59fe13616"
    assert user.get("name") == "Test User"
    assert user.get("email") == email
    assert user.get("picture") == "pic.png"
    assert user.get("last_login_time") == 1000000000
    assert user.get("last_login_expire") == 1000000009
    assert user.get("magic_bits") == "010101010101010101010101010101_0"

    # Give an empty email
    inv_email = ""
    user, err = UserDriver.get_user_by_email(inv_email)

    if err is not None:
        print("32.  There was a testing error on Test 32 Object was: ", user, "Error Was: ", err)

    # Expected
    inv_err_code = "User not found"
    
    # Assertions
    assert user is None
    assert err == inv_err_code   

def test_add_remove_role_by_id_roundtrip():
    user_id = "69c1ae61ea43bc1bee414ddf"
    adder_id = "699d0093795741a59fe13616"
    test_role = "Gym Owner"

    # Fetch current/original state
    user, err = UserDriver.get_user_by_id(user_id)
    if err is not None:
        print("Fetch original user failed:", err)
    assert err is None
    assert user is not None
    assert user.get("_id") == user_id

    # Add the test role via the driver
    updated_user, err = UserDriver.add_role_by_id(user_id=user_id, adder_id=adder_id, role=test_role)
    if err is not None:
        print("Add role failed:", err)
    assert err is None
    assert updated_user is not None
    assert test_role in updated_user.get("roles", [])

    # Re-fetch and verify role present
    fetched, err = UserDriver.get_user_by_id(user_id)
    assert err is None
    assert fetched is not None
    assert test_role in fetched.get("roles", [])

    # Remove the test role via the driver
    updated_user, err = UserDriver.remove_role_by_id(user_id=user_id, remover_id=adder_id, role=test_role)
    if err is not None:
        print("Remove role failed:", err)
    assert err is None
    assert updated_user is not None
    assert test_role not in updated_user.get("roles", [])

    # Re-fetch and verify role removed
    fetched_after, err = UserDriver.get_user_by_id(user_id)
    assert err is None
    assert fetched_after is not None
    assert test_role not in fetched_after.get("roles", [])

def test_add_remove_role_by_email_roundtrip():
    user_email = "tskoglundd@gmail.com"
    adder_id = "699d0093795741a59fe13616"
    test_role = "Gym Owner"

    # Fetch current/original state
    user, err = UserDriver.get_user_by_email(user_email)
    if err is not None:
        print("Fetch original user failed:", err)
    assert err is None
    assert user is not None
    assert user.get("email") == user_email

    # Add the test role via the driver
    updated_user, err = UserDriver.add_role_by_email(user_email=user_email, adder_id=adder_id, role=test_role)
    if err is not None:
        print("Add role failed:", err)
    assert err is None
    assert updated_user is not None
    assert test_role in updated_user.get("roles", [])

    # Re-fetch and verify role present
    fetched, err = UserDriver.get_user_by_email(user_email)
    assert err is None
    assert fetched is not None
    assert test_role in fetched.get("roles", [])

    # Remove the test role via the driver
    updated_user, err = UserDriver.remove_role_by_email(user_email=user_email, remover_id=adder_id, role=test_role)
    if err is not None:
        print("Remove role failed:", err)
    assert err is None
    assert updated_user is not None
    assert test_role not in updated_user.get("roles", [])

    # Re-fetch and verify role removed
    fetched_after, err = UserDriver.get_user_by_email(user_email)
    assert err is None
    assert fetched_after is not None
    assert test_role not in fetched_after.get("roles", [])

def test_user_invalid_inputs_combined():
    valid_user_id = "699d0093795741a59fe13616"
    valid_other_user_id = "699f79574048f9ec8b5b0ed3"
    valid_admin_id = "699d0093795741a59fe13616"   # must be an Admin or Developer in DB
    valid_email = "test@email.com"

    # GET USER BY ID — INVALID INPUTS
    for bad in [None, "", 123, [], {}, "nothex"]:
        user, err = UserDriver.get_user_by_id(bad)
        assert user is None
        assert err == "Invalid user_id format; must be a 24-hex string" or err is not None

    user, err = UserDriver.get_user_by_id("000000000000000000000000")
    assert user is None
    assert err == "User not found"

    # GET USER BY EMAIL — INVALID INPUTS
    for bad in [None, "", 123, [], {}, "not-an-email"]:
        user, err = UserDriver.get_user_by_email(bad)
        assert user is None
        assert err == "User not found" or err is not None

    # ADD ROLE BY ID — INVALID INPUTS
    # Missing required fields
    resp, err = UserDriver.add_role_by_id(None, valid_admin_id, "User")
    assert resp is None
    assert err == "user_id is required"

    resp, err = UserDriver.add_role_by_id(valid_user_id, valid_admin_id, None)
    assert resp is None
    assert err == "role is required"

    # Invalid identifier formats
    for bad in ["nothex", 123, [], {}, ""]:
        resp, err = UserDriver.add_role_by_id(bad, valid_admin_id, "User")
        assert resp is None
        assert err == "Invalid user_id format; must be a 24-hex string" or "user_id is required"

    for bad in ["nothex", 123, [], {}, ""]:
        resp, err = UserDriver.add_role_by_id(valid_user_id, bad, "User")
        assert resp is None
        assert err == "Invalid adder_id format; must be a 24-hex string" or "user_id is required"

    # Invalid role
    resp, err = UserDriver.add_role_by_id(valid_user_id, valid_admin_id, "Super Saiyan")
    assert resp is None
    assert err == "Provided role is unidentified"

    # Invalid admin permissions (adder exists but has no Admin/Dev role)
    # Note: depends on DB; this test will work as long as user has no admin power
    resp, err = UserDriver.add_role_by_id(valid_user_id, valid_other_user_id, "User")
    assert resp is None
    assert err in ["Adder not found", "Adder does not have permission"]

    # REMOVE ROLE BY ID — INVALID INPUTS
    resp, err = UserDriver.remove_role_by_id(None, valid_admin_id, "User")
    assert resp is None
    assert err == "user_id is required"

    resp, err = UserDriver.remove_role_by_id(valid_user_id, valid_admin_id, None)
    assert resp is None
    assert err == "Role is required"

    resp, err = UserDriver.remove_role_by_id(valid_user_id, "nothex", "User")
    assert resp is None
    assert err == "Invalid remover_id format; must be a 24-hex string"

    # DEACTIVATE USER BY ID — INVALID INPUTS
    resp, err = UserDriver.deactivate_user_by_id(None, valid_admin_id)
    assert resp is None
    assert err == "user_id is required"

    resp, err = UserDriver.deactivate_user_by_id(valid_user_id, None)
    assert resp is None
    assert err == "deactivator_id is required"

    for bad in ["nothex", 123, [], {}, ""]:
        resp, err = UserDriver.deactivate_user_by_id(bad, valid_admin_id)
        assert resp is None
        assert "Invalid user_id format" or "user_id is required"

    for bad in ["nothex", 123, [], {}, ""]:
        resp, err = UserDriver.deactivate_user_by_id(valid_user_id, bad)
        assert resp is None
        assert "Invalid deactivator_id format" or "deactivator_id is required"

    # UPDATE USER — INVALID INPUTS
    # Empty update dict
    resp, err = UserDriver.update_user(valid_email, {})
    assert resp is None
    assert err == "No valid fields to update"

    # Remove password & _id automatically
    resp, err = UserDriver.update_user(valid_email, {"password": "hack", "_id": "fake"})
    assert err == "No valid fields to update"

    # DELETE USER — INVALID INPUTS
    resp, err = UserDriver.delete_user(None)
    assert resp is None
    assert err == "User not found"

    resp, err = UserDriver.delete_user("not-an-email")
    assert resp is None
    assert err == "User not found"

# TO DO    
# def test_create_user():
#     pass

# def test_user_roles():
#     pass

# Workout

def test_find_workout_by_id():
    # Give a valid _id
    oid = "69d43248f826ab5daa4431af"
    ex, err = WorkoutDriver.get_workout_by_id(oid)

    if err is not None:
        print("33.  There was a testing error on Test 33 Object was: ", ex, "Error Was: ", err)

    # Assertions
    assert err is None
    assert ex is not None
    assert ex.get("_id") == oid
    assert ex.get("user_id") == "699d0093795741a59fe13616"
    assert ex.get("gym_id") == "699cff88400d9d43a32e924d"
    assert ex.get("title") == "A test workout"
    assert ex.get("startTime") == 1
    assert ex.get("endTime") == 2

    # Give a bad _id
    bad_oid = "69af2a4598d0f4227b25ed7"
    ex, err = WorkoutDriver.get_workout_by_id(bad_oid)

    if err is not None:
        print("34.  There was a testing error on Test 34 Object was: ", ex, "Error Was: ", err)

    # Expected
    bad_err_code = "Invalid workout_id format; must be a 24-hex string"
    
    # Assertions
    assert ex is None
    assert err == bad_err_code

    # Give an invalid _id
    inv_oid = "000000000000000000000000"
    ex, err = WorkoutDriver.get_workout_by_id(inv_oid)

    if err is not None:
        print("35.  There was a testing error on Test 35 Object was: ", ex, "Error Was: ", err)

    # Expected
    inv_err_code = "Workout not found"
    
    # Assertions
    assert ex is None
    assert err == inv_err_code 

def test_find_workout_by_user():
    # Give a valid _id
    oid = "699d0093795741a59fe13616"
    exs, err = WorkoutDriver.get_workouts_by_user(oid)

    if err is not None:
        print("36.  There was a testing error on Test 36 Object was: ", exs, "Error Was: ", err)
    
    wo_oid = "69d43248f826ab5daa4431af"
    filtered = [d for d in exs if d.get("_id") == wo_oid]

    assert len(filtered) == 1

    # Assertions
    assert err is None
    assert filtered[0] is not None
    assert filtered[0].get("_id") == wo_oid
    assert filtered[0].get("user_id") == "699d0093795741a59fe13616"
    assert filtered[0].get("gym_id") == "699cff88400d9d43a32e924d"
    assert filtered[0].get("title") == "A test workout"
    assert filtered[0].get("startTime") == 1
    assert filtered[0].get("endTime") == 2

    # Give a bad _id
    bad_oid = "699d0093795741a59fe1361"
    exs, err = WorkoutDriver.get_workouts_by_user(bad_oid)

    if err is not None:
        print("37.  There was a testing error on Test 37 Object was: ", exs, "Error Was: ", err)

    # Expected
    bad_err_code = "Invalid user_id format; must be a 24-hex string"
    
    # Assertions
    assert exs is None
    assert err == bad_err_code

    # Give an invalid _id
    inv_oid = "000000000000000000000000"
    exs, err = WorkoutDriver.get_workouts_by_user(inv_oid)

    if err is not None:
        print("38.  There was a testing error on Test 38 Object was: ", exs, "Error Was: ", err)

    # Expected
    inv_err_code = "Workout not found"
    
    # Assertions
    assert exs is None
    assert err == inv_err_code 

def test_find_template_by_user():
    # Give a valid _id
    oid = "699d0093795741a59fe13616"
    temps, err = WorkoutDriver.get_user_templates(oid)

    if err is not None:
        print("39.  There was a testing error on Test 39 Object was: ", temps, "Error Was: ", err)
    
    tp_oid = "69c19753432188dfcd568ddc"
    filtered = [d for d in temps if d.get("_id") == tp_oid]

    assert len(filtered) == 1

    # Assertions
    assert err is None
    assert filtered[0] is not None
    assert filtered[0].get("_id") == tp_oid
    assert filtered[0].get("user_id") == "699d0093795741a59fe13616"
    assert filtered[0].get("title") == "My Weekend Workout Template"
    assert filtered[0].get("template") == True
    assert filtered[0].get("startTime") == 0

    # Give a bad _id
    bad_oid = "699d0093795741a59fe1361"
    temps, err = WorkoutDriver.get_user_templates(bad_oid)

    if err is not None:
        print("40.  There was a testing error on Test 40 Object was: ", temps, "Error Was: ", err)

    # Expected
    bad_err_code = "Invalid user_id format; must be a 24-hex string"
    
    # Assertions
    assert temps is None
    assert err == bad_err_code

    # Give an invalid _id
    inv_oid = "000000000000000000000000"
    temps, err = WorkoutDriver.get_user_templates(inv_oid)

    if err is not None:
        print("41.  There was a testing error on Test 41 Object was: ", temps, "Error Was: ", err)

    # Expected
    inv_err_code = "Templates not found"
    
    # Assertions
    assert temps is None
    assert err == inv_err_code 

    template_id = "69c19753432188dfcd568ddc"  # known existing template
    template, err = WorkoutDriver.get_template(template_id)

    assert err is None
    assert template is not None
    assert template.get("_id") == template_id
    
    template, err = WorkoutDriver.get_template(None)
    assert template is None
    assert err == "You are missing an id. Please fix, then attempt to create workout again"

def test_create_delete_workout():
    # Give a valid gym_id
    gym_id = "699cff88400d9d43a32e924d"
    startTime = "1"
    endTime = "2"
    title = "A test workout"
    user_id = "699d0093795741a59fe13616"
    response_id, err = WorkoutDriver.create_workout(user_id, gym_id, title, startTime, endTime)

    if err is not None:
        print("42.  There was a testing error on Test 42 Object was: ", response_id, "Error Was: ", err)

    # Check if response is valid id
    try:
        responseObj = ObjectId(str(response_id))
    except (bson_errors.InvalidId, TypeError, ValueError):
        assert(False)

    # Give created workout_id
    workout, err = WorkoutDriver.get_workout_by_id(response_id)

    if err is not None:
        print("43.  There was a testing error on Test 43 Object was: ", workout, "Error Was: ", err)

    # Assertions
    assert err is None
    assert workout is not None
    assert workout.get("_id") == response_id
    assert workout.get("gym_id") == "699cff88400d9d43a32e924d"
    assert workout.get("startTime") == 1
    assert workout.get("endTime") == 2
    assert workout.get("user_id") == "699d0093795741a59fe13616"
    
    # Delete created gym
    response, err = WorkoutDriver.delete_workout(response_id)
    if err is not None:
        print("44.  There was a testing error on Test 44 Object was: ", response, "Error Was: ", err)
    # Assertions
    assert response == response_id

def test_create_delete_template():
    # Give a valid gym_id
    title = "A test template"
    user_id = "699d0093795741a59fe13616"
    response_id, err = WorkoutDriver.create_template(user_id, title)

    if err is not None:
        print("45.  There was a testing error on Test 45 Object was: ", response_id, "Error Was: ", err)

    # Check if response is valid id
    try:
        responseObj = ObjectId(str(response_id))
    except (bson_errors.InvalidId, TypeError, ValueError):
        assert(False)

    # Give created workout_id
    templates, err = WorkoutDriver.get_user_templates(user_id)

    if err is not None:
        print("46.  There was a testing error on Test 46 Object was: ", templates, "Error Was: ", err)

    filtered = [d for d in templates if d.get("_id") == response_id]

    # Assertions
    assert err is None
    assert filtered is not None
    assert filtered[0].get("_id") == response_id
    assert filtered[0].get("startTime") == 0
    assert filtered[0].get("user_id") == "699d0093795741a59fe13616"
    assert filtered[0].get("title") == "A test template"
    assert filtered[0].get("template") == True
    
    # Delete created template
    response, err = WorkoutDriver.delete_workout(response_id)
    if err is not None:
        print("47.  There was a testing error on Test 47 Object was: ", response, "Error Was: ", err)
    # Assertions
    assert response == response_id
   
def test_update_workout_roundtrip():
    # Known existing document id from your tests/fixtures
    workout_id = "69d43248f826ab5daa4431af"

    original, err = WorkoutDriver.get_workout_by_id(workout_id)
    if err is not None:
        print("Fetch original failed:", err)
    assert err is None
    assert original is not None
    assert original.get("_id") == workout_id

    # Keep a copy of original values for roundtrip restore
    orig_title     = original.get("title")
    orig_startTime = original.get("startTime")
    orig_endTime   = original.get("endTime")

    new_values = {
        "title": "Updated Workout Title",
        "startTime": 10,
        "endTime": 20
    }
    updated, err = WorkoutDriver.update_workout(id=workout_id, updates=new_values)
    if err is not None:
        print("Update failed:", err)
    assert err is None
    assert updated is not None
    assert updated.get("_id") == workout_id

    # Assert updated values persisted
    assert updated.get("title") == new_values["title"]
    assert updated.get("startTime") == new_values["startTime"]
    assert updated.get("endTime") == new_values["endTime"]

    fetched_after_update, err = WorkoutDriver.get_workout_by_id(workout_id)
    if err is not None:
        print("Fetch after update failed:", err)
    assert err is None
    assert fetched_after_update is not None
    assert fetched_after_update.get("_id") == workout_id

    # Assert values are exactly as updated
    assert fetched_after_update.get("title") == new_values["title"]
    assert fetched_after_update.get("startTime") == new_values["startTime"]
    assert fetched_after_update.get("endTime") == new_values["endTime"]

    restore_payload = {
        "title": orig_title,
        "startTime": orig_startTime,
        "endTime": orig_endTime
    }
    restored, err = WorkoutDriver.update_workout(id=workout_id, updates=restore_payload)
    if err is not None:
        print("Restore failed:", err)
    assert err is None
    assert restored is not None
    assert restored.get("_id") == workout_id

    # Assert restored document reflects the original values
    assert restored.get("title") == orig_title
    assert restored.get("startTime") == orig_startTime
    assert restored.get("endTime") == orig_endTime

    fetched_after_restore, err = WorkoutDriver.get_workout_by_id(workout_id)
    if err is not None:
        print("Fetch after restore failed:", err)
    assert err is None
    assert fetched_after_restore is not None
    assert fetched_after_restore.get("_id") == workout_id

    assert fetched_after_restore.get("title") == orig_title
    assert fetched_after_restore.get("startTime") == orig_startTime
    assert fetched_after_restore.get("endTime") == orig_endTime

def test_workout_invalid_inputs_combined():
    valid_user_id = "699d0093795741a59fe13616"
    valid_gym_id = "699cff88400d9d43a32e924d"
    valid_workout_id = "69d43248f826ab5daa4431af"

    # GET WORKOUT BY ID — INVALID INPUTS
    for bad in [None, "", 123, [], {}, "nothex"]:
        resp, err = WorkoutDriver.get_workout_by_id(bad)
        assert resp is None
        assert err == "You are missing a user id. Please fix, then attempt to create workout again" or "Invalid user_id format; must be a 24-hex string"

    resp, err = WorkoutDriver.get_workout_by_id("000000000000000000000000")
    assert resp is None
    assert err == "Workout not found"

    # GET WORKOUTS BY USER — INVALID INPUTS
    for bad in [None, "", 123, [], {}, "nothex"]:
        resp, err = WorkoutDriver.get_workouts_by_user(bad)
        assert resp is None
        assert err == "You are missing a user id. Please fix, then attempt to create workout again" or "Invalid user_id format; must be a 24-hex string"

    resp, err = WorkoutDriver.get_workouts_by_user("000000000000000000000000")
    assert resp is None
    assert err == "Workout not found"

    # GET TEMPLATES — INVALID INPUTS
    for bad in [None, "", 123, [], {}, "nothex"]:
        resp, err = WorkoutDriver.get_user_templates(bad)
        assert resp is None
        assert err == "You are missing a user id. Please fix, then attempt to create workout again" or "Invalid user_id format; must be a 24-hex string"

    resp, err = WorkoutDriver.get_user_templates("000000000000000000000000")
    assert resp is None
    assert err == "Templates not found"

    # CREATE WORKOUT — INVALID INPUTS
    # Missing required
    resp, err = WorkoutDriver.create_workout(None, valid_gym_id, "Test", "1", "2")
    assert resp is None
    assert err == "You are missing a user_id or startTime. Please fix, then attempt to create workout again"

    resp, err = WorkoutDriver.create_workout(valid_user_id, valid_gym_id, "Test", None, "2")
    assert resp is None
    assert err == "You are missing a user_id or startTime. Please fix, then attempt to create workout again"

    # Invalid userIds
    for bad in ["nothex", 123, [], {}, ""]:
        resp, err = WorkoutDriver.create_workout(bad, valid_gym_id, "Test", "1", "2")
        assert resp is None
        assert err == "Invalid user_id format; must be a 24-hex string" or "You are missing a user_id or startTime. Please fix, then attempt to create workout again"

    # Invalid gym_ids
    for bad in ["nothex", 123, [], {}, ""]:
        resp, err = WorkoutDriver.create_workout(valid_user_id, bad, "Test", "1", "2")
        assert resp is None
        assert err == "Invalid gym_id format; must be a 24-hex string"

    resp, err = WorkoutDriver.create_workout("111111111111111111111111", valid_gym_id, "Test", "1", "2")
    assert resp is None
    assert err == "User not found"

    resp, err = WorkoutDriver.create_workout(valid_user_id, "111111111111111111111111", "Test", "1", "2")
    assert resp is None
    # Accept either the short or more descriptive error returned by the driver
    assert err == "Gym not found" or err == "Gym not found or inaccessible"

    # CREATE TEMPLATE — INVALID INPUTS
    resp, err = WorkoutDriver.create_template(None, "TestTemplate")
    assert resp is None
    assert err == "You are missing a user_id. Please fix, then attempt to create workout again"

    resp, err = WorkoutDriver.create_template("nothex", "TestTemplate")
    assert resp is None
    assert err == "Invalid user_id format; must be a 24-hex string"

    resp, err = WorkoutDriver.create_template("000000000000000000000000", "TestTemplate")
    assert resp is None
    assert err == "User not found"

    # DELETE WORKOUT — INVALID INPUTS
    resp, err = WorkoutDriver.delete_workout(None)
    assert resp is None
    assert err == "You must provide a workout id to delete"

    for bad in ["", 123, [], {}, "nothex"]:
        resp, err = WorkoutDriver.delete_workout(bad)
        assert resp is None
        assert err == "Invalid workout_id format; must be a 24-hex string" or "You must provide a workout id to delete"

    resp, err = WorkoutDriver.delete_workout("000000000000000000000000")
    assert resp is None
    assert err == "Workout not found or already deleted"

    # UPDATE WORKOUT — INVALID INPUTS
    for bad in [None, "", 123, [], {}, "nothex"]:
        resp, err = WorkoutDriver.update_workout(bad, {"title": "New"})
        assert resp is None
        assert err == "You must provide a personal ex id to update" or "Invalid workout_id format; must be a 24-hex string"

    resp, err = WorkoutDriver.update_workout(valid_workout_id, None)
    assert resp is None
    assert err == "You must provide at least one field to update"

    bad_id = "nothex"
    template, err = WorkoutDriver.get_template(bad_id)

    assert template is None
    assert err == "Invalid id format; must be a 24-hex string"

    template, err = WorkoutDriver.get_template("000000000000000000000000")

    assert template is None
    assert err == "Template not found"

def test_workout_partial_empty_unknown_updates():
    
    workout_id = "69d43248f826ab5daa4431af"

    original, err = WorkoutDriver.get_workout_by_id(workout_id)
    assert err is None

    orig_values = {
        "title": original["title"],
        "startTime": original["startTime"],
        "endTime": original["endTime"],
    }

    partial = {"title": "PartialTitle"}
    updated, err = WorkoutDriver.update_workout(workout_id, partial)
    assert err is None
    assert updated["title"] == "PartialTitle"

    resp, err = WorkoutDriver.update_workout(workout_id, {})
    assert resp is None
    assert err == "You must provide at least one field to update"

    resp, err = WorkoutDriver.update_workout(workout_id, {"junk": 123})
    assert resp is None
    assert err == "Workout not found or no changes applied" or "You must provide at least one field to update"

    mixed = {
        "title": "MixedTitle",
        "startTime": 500,
        "junk": True,
        "badField": "ignore"
    }
    updated, err = WorkoutDriver.update_workout(workout_id, mixed)
    assert err is None
    assert updated["title"] == "MixedTitle"
    assert updated["startTime"] == 500

    restored, err = WorkoutDriver.update_workout(workout_id, orig_values)
    assert err is None
    assert restored["title"] == orig_values["title"]
    assert restored["startTime"] == orig_values["startTime"]
    assert restored["endTime"] == orig_values["endTime"]

# Measurements

def test_find_measurement_by_id():
    oid = "69b4884923803f807becacf4"
    m, err = MeasurementDriver.get_measurement_by_id(oid)

    if err is not None:
        print("48.  There was a testing error on Test 48 Object was: ", m, "Error Was: ", err)

    # Assertions
    assert err is None
    assert m is not None
    assert m.get("_id") == oid
    assert m.get("user_id") == "699f79394048f9ec8b5b0ed2"
    assert m.get("date") == 1773273600
    assert m.get("arms") == 40
    assert m.get("hips") == 105
    assert m.get("chest") == 90
    assert m.get("weight") == 200
    assert m.get("waist") == 90
    assert m.get("thighs") == 25

    # Bad ID
    bad_oid = "69b4880023803f807becacf"
    m, err = MeasurementDriver.get_measurement_by_id(bad_oid)

    assert m is None
    assert err == "Invalid measurement_id format; must be a 24-hex string"

    # Invalid (valid format but not found)
    inv_oid = "000000000000000000000000"
    m, err = MeasurementDriver.get_measurement_by_id(inv_oid)

    assert m is None
    assert err == "Measurement not found"

def test_find_measurements_by_user():
    user_id = "699f79394048f9ec8b5b0ed2"
    m, err = MeasurementDriver.get_measurements_by_user(user_id)

    assert err is None
    assert isinstance(m, list)
    assert len(m) > 0

    # Find the known object
    known = next((x for x in m if x["_id"] == "69b4884923803f807becacf4"), None)
    assert known is not None
    assert known.get("arms") == 40

    # Bad user_id format
    bad_uid = "699f79394048f9ec8b5b0ed"
    m, err = MeasurementDriver.get_measurements_by_user(bad_uid)
    assert m is None or m == []

def test_create_delete_measurement():
    user_id = "699f79394048f9ec8b5b0ed2"

    data = {
        "date": 1773964800,
        "arms": 50,
        "waist": 100,
        "weight": 200
    }

    new_id, err = MeasurementDriver.create_measurement(user_id, data)
    if err is not None:
        print("49.  There was a testing error on Test 49 Object was: ", new_id, "Error Was: ", err)

    # Ensure valid ObjectId
    try:
        ObjectId(str(new_id))
    except Exception:
        assert False

    # Check creation
    m, err = MeasurementDriver.get_measurement_by_id(new_id)
    assert err is None
    assert m is not None
    assert m.get("_id") == new_id
    assert m.get("arms") == 50
    assert m.get("waist") == 100
    assert m.get("weight") == 200

    # DELETE
    response, err = MeasurementDriver.delete_measurement(new_id)
    assert response == new_id

    # Verify deletion
    m, err = MeasurementDriver.get_measurement_by_id(new_id)
    assert m is None

def test_update_measurement_roundtrip():
    oid = "69b4884923803f807becacf4"

    original, err = MeasurementDriver.get_measurement_by_id(oid)
    assert err is None
    assert original is not None

    orig_arms    = original.get("arms")
    orig_hips    = original.get("hips")
    orig_chest   = original.get("chest")
    orig_weight  = original.get("weight")
    orig_waist   = original.get("waist")
    orig_thighs  = original.get("thighs")

    new_vals = {
        "arms": 1.1,
        "hips":  2.2,
        "chest": 3.3,
        "weight": 4.4,
        "waist":  5.5,
        "thighs": 6.6
    }

    updated, err = MeasurementDriver.update_measurement(oid, new_vals)
    assert err is None
    assert updated is not None

    assert updated.get("arms") == 1.1
    assert updated.get("hips") == 2.2
    assert updated.get("chest") == 3.3
    assert updated.get("weight") == 4.4
    assert updated.get("waist") == 5.5
    assert updated.get("thighs") == 6.6

    # Fetch again to confirm DB persistence
    fetched, err = MeasurementDriver.get_measurement_by_id(oid)
    assert err is None
    assert fetched.get("arms") == 1.1

    # Restore original
    restore = {
        "arms": orig_arms,
        "hips": orig_hips,
        "chest": orig_chest,
        "weight": orig_weight,
        "waist": orig_waist,
        "thighs": orig_thighs
    }

    restored, err = MeasurementDriver.update_measurement(oid, restore)
    assert err is None
    assert restored is not None

    assert restored.get("arms") == orig_arms
    assert restored.get("hips") == orig_hips
    assert restored.get("chest") == orig_chest
    assert restored.get("weight") == orig_weight
    assert restored.get("waist") == orig_waist
    assert restored.get("thighs") == orig_thighs

def test_create_measurement_missing_date():
    user_id = "699f79394048f9ec8b5b0ed2"
    data = {
        "arms": 40
    }

    resp, err = MeasurementDriver.create_measurement(user_id, data)
    assert resp is None
    assert err == "You must provide a measurement date"

def test_create_measurement_no_values():
    user_id = "699f79394048f9ec8b5b0ed2"
    data = {
        "date": 1773964800
    }

    resp, err = MeasurementDriver.create_measurement(user_id, data)
    assert resp is None
    assert err == "You must provide at least one measurement value"

def test_create_measurement_invalid_field_value():
    user_id = "699f79394048f9ec8b5b0ed2"
    data = {
        "date": 1773360000,
        "weight": "abc"     # invalid
    }

    resp, err = MeasurementDriver.create_measurement(user_id, data)
    assert resp is None
    assert "Invalid weight" in err

    data = {
        "date": "2026-03-20T00:00:00.000Z", # invalid
        "weight": 20     
    }

    
    resp, err = MeasurementDriver.create_measurement(user_id, data)
    assert resp is None
    assert "type did not match" in err

def test_delete_measurement_invalid_id():
    resp, err = MeasurementDriver.delete_measurement("123")
    assert resp is None
    assert err == "Invalid measurement_id format; must be a 24-hex string"

# Tasks

def test_find_task_by_id():
    oid = "69c07dd86eb4c5de09881b06"
    task, err = TaskDriver.get_task_by_id(oid)

    if err is not None:
        print("50.  There was a testing error on Test 50 Object was: ", task, "Error Was: ", err)

    assert err is None
    assert task is not None
    assert task.get("_id") == oid
    assert task.get("name") == "Something I should Do"
    assert task.get("note") is not None
    assert task.get("dueTime") == 1774229940
    assert task.get("user_id") == "69996a73313d1a459f4529da"
    assert task.get("completed") is True

    bad_oid = "69c07dd86eb4c5de09881b0"
    task, err = TaskDriver.get_task_by_id(bad_oid)

    assert task is None
    assert "24-hex string" in err

    inv_oid = "000000000000000000000000"
    task, err = TaskDriver.get_task_by_id(inv_oid)

    assert task is None
    assert err == "Task not found"

def test_find_tasks_by_user():
    user_id = "69996a73313d1a459f4529da"
    tasks, err = TaskDriver.get_tasks_by_user(user_id)

    if err is not None:
        print("51.  There was a testing error on Test 51 Object was: ", tasks, "Error Was: ", err)

    assert err is None
    assert isinstance(tasks, list)

    known = next((t for t in tasks if t["_id"] == "69c07dd86eb4c5de09881b06"), None)
    assert known is not None
    assert known.get("name") == "Something I should Do"

    bad_uid = "69996a73313d1a459f4529d"
    tasks, err = TaskDriver.get_tasks_by_user(bad_uid)

    assert tasks is None
    assert "24-hex string" in err

def test_create_delete_task():
    user_id = "69996a73313d1a459f4529da"

    data = {
        "name": "New Task",
        "note": "Auto-generated test task",
        "dueTime": 1900000000,
        "completed": False
    }

    created, err = TaskDriver.create_task(user_id, data)

    if err is not None:
        print("52.  There was a testing error on Test 52 Object was: ", created, "Error Was: ", err)

    assert err is None
    assert created is not None

    try:
        ObjectId(str(created["_id"]))
    except Exception:
        assert False

    fetched, err = TaskDriver.get_task_by_id(created["_id"])
    assert err is None
    assert fetched.get("name") == "New Task"
    assert fetched.get("note") == "Auto-generated test task"
    assert fetched.get("dueTime") == 1900000000
    assert fetched.get("completed") is False

    deleted, err = TaskDriver.delete_task(created["_id"])
    assert err is None
    assert deleted.get("deleted") is True or deleted.get("deleted") == 1

    after, err = TaskDriver.get_task_by_id(created["_id"])
    assert after is None

def test_update_task_roundtrip():
    task_id = "69c07dd86eb4c5de09881b06"

    original, err = TaskDriver.get_task_by_id(task_id)
    assert err is None
    assert original is not None

    orig_name = original.get("name")
    orig_note = original.get("note")
    orig_due = original.get("dueTime")
    orig_completed = original.get("completed")

    new_vals = {
        "name": "Updated Task",
        "note": "Updated Note",
        "dueTime": 1888888888,
        "completed": True
    }

    updated, err = TaskDriver.update_task(task_id, new_vals)

    assert err is None
    assert updated is not None

    assert updated.get("name") == new_vals["name"]
    assert updated.get("note") == new_vals["note"]
    assert updated.get("dueTime") == new_vals["dueTime"]
    assert updated.get("completed") == new_vals["completed"]

    fetched, err = TaskDriver.get_task_by_id(task_id)
    assert err is None
    assert fetched.get("name") == "Updated Task"

    restore = {
        "name": orig_name,
        "note": orig_note,
        "dueTime": orig_due,
        "completed": orig_completed
    }

    restored, err = TaskDriver.update_task(task_id, restore)
    assert err is None
    assert restored is not None

    assert restored.get("name") == orig_name
    assert restored.get("note") == orig_note
    assert restored.get("dueTime") == orig_due
    assert restored.get("completed") == orig_completed

    fetched_after, err = TaskDriver.get_task_by_id(task_id)
    assert err is None
    assert fetched_after.get("name") == orig_name

def test_create_task_missing_name():
    user_id = "69996a73313d1a459f4529da"
    data = {"note": "Missing name"}

    task, err = TaskDriver.create_task(user_id, data)

    assert task is None
    assert err == "name is required"

def test_create_task_invalid_user_id():
    user_id = "notvalid123"
    data = {"name": "Bad User"}

    task, err = TaskDriver.create_task(user_id, data)

    assert task is None
    assert "24-hex string" in err

def test_delete_task_invalid_id():
    deleted, err = TaskDriver.delete_task("123")

    assert deleted is None
    assert "24-hex string" in err

def test_delete_task_not_found():
    deleted, err = TaskDriver.delete_task("000000000000000000000000")

    assert deleted is None
    assert err == "Task not found"

def test_find_promo_by_id():
    oid = "69efbaca3fb064208bde07c8"
    promo, err = PromoDriver.get_promo_by_id(oid)

    if err is not None:
        print(promo, err)

    assert err is None
    assert promo is not None
    assert promo.get("_id") == oid
    assert promo.get("gym_id") == "699cff88400d9d43a32e924d"
    assert promo.get("type") == "Coupon"
    assert promo.get("timeStart") == 1778873896
    assert promo.get("timeEnd") == 1779451200
    assert promo.get("redeemable") is True
    assert promo.get("_testObject") is True

    bad_oid = "69efbaca3fb064208bde07"
    promo, err = PromoDriver.get_promo_by_id(bad_oid)

    assert promo is None
    assert "24-hex string" in err

    inv_oid = "000000000000000000000000"
    promo, err = PromoDriver.get_promo_by_id(inv_oid)

    assert promo is None
    assert err == "Promo not found"

def test_find_promos_by_gym():
    gym_id = "699cff88400d9d43a32e924d"
    promos, err = PromoDriver.get_promos_by_gym(gym_id)

    if err is not None:
        print(promos, err)

    assert err is None
    assert isinstance(promos, list)
    assert len(promos) >= 3

    found_types = {p["type"] for p in promos}
    assert "Coupon" in found_types
    assert "Event" in found_types
    assert "Give Away" in found_types

    bad_gid = "699cff88400d9d43a32e92"
    promos, err = PromoDriver.get_promos_by_gym(bad_gid)

    assert promos is None
    assert "24-hex string" in err

def test_get_all_promos():
    promos, err = PromoDriver.get_all_promos()

    if err is not None:
        print(promos, err)

    assert err is None
    assert isinstance(promos, list)
    assert len(promos) >= 3

def test_create_and_delete_promo():
    gym_id = "699cff88400d9d43a32e924d"
    user_id = "699d0093795741a59fe13616"

    data = {
        "type": "Coupon",
        "timeStart": 2000000000,
        "timeEnd": 2000003600,
        "redeemable": True,
        "_testObject": True
    }

    created, err = PromoDriver.create_promo(gym_id, user_id, data)

    if err is not None:
        print(created, err)

    assert err is None
    assert created is not None

    try:
        ObjectId(str(created["_id"]))
    except Exception:
        assert False

    fetched, err = PromoDriver.get_promo_by_id(created["_id"])
    assert err is None
    assert fetched.get("type") == "Coupon"
    assert fetched.get("redeemable") is True
    assert fetched.get("_testObject") is True

    deleted, err = PromoDriver.delete_promo(created["_id"])
    assert err is None
    assert deleted.get("deleted") is True or deleted.get("deleted") == 1

    after, err = PromoDriver.get_promo_by_id(created["_id"])
    assert after is None

def test_update_promo_roundtrip():
    promo_id = "69efbaff3fb064208bde07cd"
    user_id = "699d0093795741a59fe13616"

    original, err = PromoDriver.get_promo_by_id(promo_id)
    assert err is None
    assert original is not None

    orig_type = original.get("type")
    orig_redeem = original.get("redeemable")

    updates = {
        "type": "Event Updated",
        "redeemable": True
    }

    updated, err = PromoDriver.update_promo(promo_id, user_id, updates)
    assert err is None
    assert updated is not None

    assert updated.get("type") == "Event Updated"
    assert updated.get("redeemable") is True

    fetched, err = PromoDriver.get_promo_by_id(promo_id)
    assert err is None
    assert fetched.get("type") == "Event Updated"

    restore = {
        "type": orig_type,
        "redeemable": orig_redeem
    }

    restored, err = PromoDriver.update_promo(promo_id, user_id, restore)
    assert err is None
    assert restored is not None

    assert restored.get("type") == orig_type
    assert restored.get("redeemable") == orig_redeem

def test_delete_promo_invalid_id():
    deleted, err = PromoDriver.delete_promo("123")

    assert deleted is None
    assert "24-hex string" in err

def test_delete_promo_not_found():
    deleted, err = PromoDriver.delete_promo("000000000000000000000000")

    assert deleted is None
    assert err == "Promo not found"
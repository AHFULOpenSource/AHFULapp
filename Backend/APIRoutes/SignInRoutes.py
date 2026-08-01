from flask import Blueprint, request, jsonify, current_app, make_response, g
from Services.SignInDriver import SignInDriver
from Services.UserDriver import UserDriver
from Services.VerificationDriver import VerificationDriver
from Services.UserSettingsDriver import UserSettingsDriver
from datetime import datetime
from time import time
from math import trunc
from Auth.verification import login_required_user, login_required_dev, login_required_admin, login_required_gym_owner

# Used to group views
signInRouteBlueprint = Blueprint('auth', __name__, url_prefix='/AHFULauth')

# ── POST Login with Google Auth ────────────────────────────────────────────────────────────
@signInRouteBlueprint.route('/google-login', methods=['POST'])
def google_login():
    # Get POST Data sent from Google Sign In Button. 
    postAuthData = request.get_json()
    if not postAuthData:
        #Return 400 Error -- No Data. 
        return jsonify({"error": "No authentication data provided"}), 400
    print("Logging in with AHFUL Google Auth")

    response, err = SignInDriver.google_login(postAuthData)
    if err:
        print(f"Error in google_login route: {err}")
        return jsonify({"error": err}), 500

    return response

# ── POST Log Out ────────────────────────────────────────────────────────────
@signInRouteBlueprint.route('/logout', methods=['POST'])
@login_required_user
def logout():
    session_id = request.cookies.get('session_id')
    userData, err = UserDriver.get_user_by_id(session_id)
    if userData:
        userData["last_login_expire"] = 0
        UserDriver.update_user_info(dataToBeUpdated=userData)

    # Clear cookie on logout (instruct browser to remove)
    response = make_response(jsonify({"message": "Logout successful"}), 200)
    response.set_cookie(
        'session_id', 
        '', 
        httponly=True, 
        secure=True, 
        samesite='Strict', 
        max_age=0, 
        path='/')
    
    response.set_cookie(
        'magic_bits', 
        '', 
        httponly=True, 
        secure=True, 
        samesite='Strict', 
        max_age=0, 
        path='/')
    
    return response

#── GET whoami (Logged in or not) ────────────────────────────────────────────────────────────
@signInRouteBlueprint.route('/whoami', methods=['POST'])
def whoami():
    try:
        currTime = trunc(time())
        user_id = request.cookies.get("session_id")

        # Validate session by user id from cookie
        routeUserObject, error = UserDriver.get_user_by_id(user_id)
        if not routeUserObject:
            return jsonify({"backend_authenticated": False, "error": "No session cookie found. 2. Please Sign in."}), 200

        # Check expiry stored on server
        foundExpiryTime = routeUserObject["last_login_expire"]
        # Normalize any Rouge foundExpiryTime (treat non-numeric as expired)
        try:
            foundExpiryTime = int(foundExpiryTime)
        except Exception:
            foundExpiryTime = 0

        if currTime > foundExpiryTime:
            return jsonify({"backend_authenticated": False, "error": "Session expired.  Please Sign in again."}), 200

        #Successful Auth, return user info
        retrievedUserSettings, settings_err = UserSettingsDriver.get_user_settings(user_id)

        # 1. Create the response object with the user info and flags
        response = make_response(jsonify({
            "backend_authenticated": True,
            "message": "Session Cookie Verified & Logged with Backend.",
        }))

        # 2. Set the cookie with security flags
        # We store ONLY the session/user ID here
        #Magic Bits and session are not refreshed here. 
        response.set_cookie(
            'user_settings',        # Cookie name
            retrievedUserSettings["_id"],# Cookie value
            httponly=True,       # Prevents JS access (XSS protection)
            secure=True,         # Ensures cookie is sent over HTTPS only
            samesite='Strict',      # CSRF protection (use 'Strict' for high security)
            max_age=3600         # Expiration in seconds (e.g., 1 hour)
        )

        #Log to Console & Security Logging. 
        print (f"Settings Retrieved with Session Cookie: {retrievedUserSettings['_id']} for user: {user_id}")
        return response

    except Exception as e:
        print(f"Error in whoami route: {e}")
        return jsonify({"error": f"Whatever you sent was not properly handeled yet.  Read more here: {e}."}), 500

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
@signInRouteBlueprint.route('/firebase-login', methods=['POST'])
def firebase_backend_route():
    # Get POST Data sent from Google Sign In Button. 
    postAuthData = request.get_json()
    if not postAuthData:
        #Return 400 Error -- No Data. 
        return jsonify({"error": "No authentication data provided"}), 400
    print("Logging in with AHFUL Firebase Auth")

    response, err = SignInDriver.ahful_backend_firebase_login(postAuthData)
    if err:
        print(f"Error in firebase_backend_route route: {err}")
        return jsonify({"error": err}), 500

    return response

# ── POST Log Out ────────────────────────────────────────────────────────────
@signInRouteBlueprint.route('/logout', methods=['POST'])
def logout():
    sessionId = request.cookies.get('session_id')
    magicBits = request.cookies.get('magic_bits')
    if sessionId and magicBits:
        userData, err = VerificationDriver.confirm_user_unverified(sessionId, magicBits[-32:])
        if userData and not err:
            userData["last_login_expire"] = 0
            UserDriver.update_user_info(dataToBeUpdated=userData)

    # Clear cookies on logout (instruct browser to remove)
    response = make_response(jsonify({"message": "Logout successful"}), 200)
    for cookieName in ('session_id', 'magic_bits', 'user_settings'):
        response.set_cookie(
            cookieName,
            '',
            httponly=True,
            secure=True,
            samesite='Strict',
            max_age=0,
            path='/',
        )

    return response

#── POST whoami (Logged in or not) ────────────────────────────────────────────────────────────
@signInRouteBlueprint.route('/whoami', methods=['POST'])
def whoami():
    try:
        userId = request.cookies.get("session_id")
        magicBits = request.cookies.get("magic_bits")

        if not userId or not magicBits:
            return jsonify({
                "backend_authenticated": False,
                "expired": False,
                "error": "No session cookie found. Please Sign in.",
            }), 200

        # Validate session, magic_bits, account status, and expiry on server
        routeUserObject, err = VerificationDriver.confirm_user_unverified(userId, magicBits[-32:])
        if err or not routeUserObject:
            errText = err or "Session invalid."
            isExpired = "too old" in errText.lower()
            return jsonify({
                "backend_authenticated": False,
                "expired": isExpired,
                "error": "Session expired. Please Sign in again." if isExpired else errText,
            }), 200

        try:
            foundExpiryTime = int(routeUserObject.get("last_login_expire") or 0)
        except Exception:
            foundExpiryTime = 0

        retrievedUserSettings, settingsErr = UserSettingsDriver.get_user_settings(userId)

        response = make_response(jsonify({
            "backend_authenticated": True,
            "email_verified": bool(routeUserObject.get("email_verified", False)),
            "expires_at": foundExpiryTime,
            "message": "Session Cookie Verified & Logged with Backend.",
        }))

        if retrievedUserSettings and not settingsErr and retrievedUserSettings.get("_id"):
            response.set_cookie(
                'user_settings',
                retrievedUserSettings["_id"],
                httponly=True,
                secure=True,
                samesite='Strict',
                max_age=3600,
                path='/',
            )
            print(
                f"Settings Retrieved with Session Cookie: "
                f"{retrievedUserSettings['_id']} for user: {userId}"
            )

        return response

    except Exception as e:
        print(f"Error in whoami route: {e}")
        return jsonify({
            "error": f"Whatever you sent was not properly handeled yet.  Read more here: {e}."
        }), 500

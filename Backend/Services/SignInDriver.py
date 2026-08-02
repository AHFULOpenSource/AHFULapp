from Services.UserDriver import UserDriver
from Services.VerificationDriver import VerificationDriver
from Services.UserSettingsDriver import UserSettingsDriver
from flask import jsonify, make_response, g
from time import time
from math import trunc
from datetime import datetime
from firebase_admin import auth
#Services & Drivers know how to implement business Logic related to the Route operations.  Intermediate between Routes and Objects.  Ensures validations and rules are applied before Calling Objects to interact with DB

class SignInDriver:
    def google_login(postAuthData):
        #session_service: SessionService = current_app.session_service

        token = postAuthData.get("token")
        if not token:
            return None, "No google token provided to the Backend.  You cannot login without something to login with.  What is this? Anarchy?"

        # verify JWT
        decodedUserInfo: dict = auth.verify_id_token(token)
        print(decodedUserInfo)
        if not decodedUserInfo:
            return None, "Invalid google token provided to Backend.  Dont come in here with Sloppily Copied Keys."

        tokenBits = token[-32:] 

        # Check if user already exists, else create new user_info document
        #TODO: Look at this because i checks based on email. 
        routeUserObject, account_error = UserDriver.get_user_by_email(decodedUserInfo.get("email"))

        if account_error:
            routeUserObject = UserDriver.create_user({
                "name": decodedUserInfo.get("name"),
                "email": decodedUserInfo.get("email"),
                "email_verified": decodedUserInfo.get("email_verified"),
                "phone_number" : "", # No phone number from google, will update later with phone verification.
                "phone_verified": False,
                "picture": decodedUserInfo.get("picture"),
                "updated_at": datetime.now(),
                "last_login_time": decodedUserInfo.get("auth_time"),
                "last_login_method": decodedUserInfo.get("firebase").get("sign_in_provider"),
                "last_login_expire" : decodedUserInfo.get("exp"),
                "deactivated": False, 
                "magic_bits" : tokenBits,
                "roles": ["user"],
                "firebase_id": decodedUserInfo.get("user_id")


            })
        elif routeUserObject:
            # Disabled user check in sign in, untested
            if routeUserObject.get('deactivated', False):
                return None, "Your account has been disabled"

            # Update last login time
            routeUserObject['last_login_time'] = decodedUserInfo.get("auth_time")
            routeUserObject["last_login_method"] = decodedUserInfo.get("firebase").get("sign_in_provider")
            routeUserObject["email_verified"] = decodedUserInfo.get("email_verified")
            routeUserObject["last_login_expire"] = decodedUserInfo.get("exp")
            routeUserObject['magic_bits'] = tokenBits
            
            UserDriver.update_user_info(dataToBeUpdated=routeUserObject)
        else:
            #Return 500 Error -- User Not Created or Found. This should never happen. 
            return None, "You didn't return a UserObject or an Error.  What in the Heavens"

        #Refresh routeUserObject to get current info & id
        routeUserObject, error = UserDriver.get_user_by_email(decodedUserInfo.get("email"))

        if error:
            return None, "An error occurred while retrieving user information right after it was created/Updated. You Must have been a Bull in a china shop."
        elif routeUserObject:
            #Now that we have updated UserInfo, pull or create user settings and handle emails
            if account_error:
                UserSettingsDriver.create_default_user_settings(routeUserObject["_id"])
                #Refresh user settings to pull default settings we just created.
                retrievedUserSettings, settings_err = UserSettingsDriver.get_user_settings(routeUserObject["_id"])
            else:
                # If user already existed, we should have settings.  Pull them to set cookie. 
                retrievedUserSettings, settings_err = UserSettingsDriver.get_user_settings(routeUserObject["_id"])
            if settings_err:
                try:
                    UserSettingsDriver.create_default_user_settings(routeUserObject["_id"])
                except Exception as e:
                    return None, "I'm Fried, we just tried to pull user settings on login and failed. {e} "

            # 1. Create the response object with the user info and flags
            response = make_response(jsonify({
                "backend_authenticated": True,
                "message": "Firebase Login Registered & Session registered with Backend."
            }))

            # 2. Set the cookie with User ID
            # We store ONLY the session/user ID here
            response.set_cookie(
                'session_id',        # Cookie name
                routeUserObject["_id"],# Cookie value
                httponly=True,       # Prevents JS access (XSS protection)
                secure=True,         # Ensures cookie is sent over HTTPS only
                samesite='Strict',      # CSRF protection (use 'Strict' for high security)
                max_age=3600         # Expiration in seconds (e.g., 1 hour)
            )

            # 3. Set the cookie with User Settings ID
            # We store ONLY the session/user ID here
            response.set_cookie(
                'user_settings',        # Cookie name
                retrievedUserSettings["_id"],# Cookie value
                httponly=True,       # Prevents JS access (XSS protection)
                secure=True,         # Ensures cookie is sent over HTTPS only
                samesite='Strict',      # CSRF protection (use 'Strict' for high security)
                max_age=3600         # Expiration in seconds (e.g., 1 hour)
            )

            # 4. Set MagicBits Cookie with Token.
            response.set_cookie(
                'magic_bits',        # Cookie name
                tokenBits,              # Cookie value
                httponly=True,       # Prevents JS access (XSS protection)
                secure=True,         # Ensures cookie is sent over HTTPS only
                samesite='Strict',      # CSRF protection (use 'Strict' for high security)
                max_age=3600         # Expiration in seconds (e.g., 1 hour)
            )

            #Log to Console & Security Logging. 
            print (f"Logged in & set cookie(s!) for user_id: {routeUserObject['name']}")
            return response, None
        else:
            #Return 500 Error -- User Not Created or Found. This should never happen. 
            return None, "You didn't return a UserObject or an Error.  What in the Heavens, You literally just... Bro. "


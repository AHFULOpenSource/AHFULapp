#Services & Drivers know how to implement business Logic related to the Route operations.
#   Intermediate between Routes and Objects.  Ensures validations and rules are applied before
#   Calling Objects to interact with DB
from DataModels.UserObject import UserObject
from DataModels.VerificationObject import VerificationObject
from datetime import datetime
from bson import ObjectId, errors as bson_errors
import secrets
import string
from Services.EmailDriver import send_email

# The EmailDriver is responsible for implementing the business logic related to user operations.
#   It acts as an intermediary between the API routes and the data models,
#   ensuring that all necessary validations and rules are applied before interacting with
#   the database.
class VerificationDriver:
    # ── Helper ─────────────────────────────────────────────────────────────────
    @staticmethod
    def _validate_obj_id(id, name):
        try:
            return ObjectId(str(id)), None
        except (bson_errors.InvalidId, TypeError, ValueError):
            return None, f"Invalid {name} format; must be a 24-hex string"
        
    @staticmethod
    def generate_code(length=8):
        characters = string.ascii_uppercase + string.digits
        return ''.join(secrets.choice(characters) for _ in range(length))
    
    @staticmethod
    def confirm_user_unverified(user_id, bits):
        # Validate vars present
        if not user_id:
            return None, "user_id is required"
        if not bits:
            return None, "bits is required"

        # Validate user_id valid
        oid, err = VerificationDriver._validate_obj_id(user_id, "user_id")
        if err:
            return None, err
        
        try:
            #Find user, ensure exists
            user = UserObject.find_by_id(user_id)
            if not user:
                return None, "User not found"
            elif user["deactivated"] == True:
                return None, "Your account has been deactivated :("
            elif user["magic_bits"] != bits:
                return None, "These bits don't match :("
            elif datetime.now().timestamp() - user["last_login_expire"] > 0:
                return None, "These bits are too old :,("
            else:
                return user, None
                
        except Exception as e:
            return None, str(e)

    @staticmethod
    def confirm_user_login(user_id, bits):
        # Validate vars present
        if not user_id:
            return None, "user_id is required"
        if not bits:
            return None, "bits is required"

        # Validate user_id valid
        oid, err = VerificationDriver._validate_obj_id(user_id, "user_id")
        if err:
            return None, err
        
        try:
            #Find user, ensure exists
            user = UserObject.find_by_id(user_id)
            if not user:
                return None, "User not found"
            elif user["deactivated"] == True:
                return None, "Your account has been deactivated :("
            elif user["email_verified"] == False:
                return None, "Your email has not been verified, who are you? >:["
            elif user["magic_bits"] != bits:
                return None, "These bits don't match :("
            elif datetime.now().timestamp() - user["last_login_expire"] > 0:
                return None, "These bits are too old :,("
            else:
                return user, None
                
        except Exception as e:
            return None, str(e)
        
    @staticmethod
    def confirm_user_developer(user_id, bits):
        user, err = VerificationDriver.confirm_user_login(user_id, bits)
        if err:
            return None, err
        elif (("Admin" not in user["roles"]) and ("Developer" not in user["roles"])):
            return None, "User does not have permission"
        else:
            return user, None
        
    @staticmethod
    def confirm_user_admin(user_id, bits):
        user, err = VerificationDriver.confirm_user_login(user_id, bits)
        if err:
            return None, err
        elif ("Admin" not in user["roles"]):
            return None, "User does not have permission"
        else:
            return user, None
        
    @staticmethod
    def confirm_user_gym_owner(user_id, bits):
        user, err = VerificationDriver.confirm_user_login(user_id, bits)
        if err:
            return None, err
        elif ("Gym Owner" not in user["roles"]):
            return None, "User does not have permission"
        else:
            return user, None
        
    @staticmethod
    def verify_user_email(user_id):
        # Validate user_id present
        if not user_id:
            return None, "user_id is required"

        # Validate user_id valid
        oid, err = VerificationDriver._validate_obj_id(user_id, "user_id")
        if err:
            return None, err
        
        try:
            #Find user, ensure exists
            user = UserObject.find_by_id(user_id)
            if not user:
                return None, "User not found"
            else:
                # Check if already verified
                if user.get("email_verified"):
                    return "User already verified", None
                # Check if user provided email
                if not user.get("email"):
                    return None, "User lacks email"
                
                # Get current verifications
                verifies = VerificationObject.find_type_by_user(user_id, "email")
                print(verifies)
                # If verification already exists
                if (len(verifies) == 1):
                    # If verification is stale (10 min)
                    if (datetime.now().timestamp() - verifies[0]["created_at"]) > 600:
                        # Delete stale verification
                        deleted = VerificationObject.delete(verifies[0]["_id"])
                        if deleted is not None: 
                            # Send new verification email
                            response, err = VerificationDriver.send_not_verified_email(user_id, user.get("email"), VerificationDriver.generate_code())
                            if err is None:
                                # Call verification func recursively
                                response, err = VerificationDriver.verify_user_email(user_id)
                                # Returns stale email text with recursive response
                                if err is None:
                                    return "current email stale, retrying", None
                                return None, err
                            # if err when sending new email
                            return None, err
                        # if err on deleting state email
                        return  None, "error deleting stale email, "
                    # fresh verification exists
                    return "email already sent", None
                # Should not get here, big error
                elif (len(verifies) > 1):
                    return None, "multiple email verifications exist" 
                
                # No verification exists, send new one
                response, err = VerificationDriver.send_not_verified_email(user_id, user.get("email"), VerificationDriver.generate_code())
                if err is None:
                    return response, None
                else:
                    return None, err
        except Exception as e:
            return None, str(e)
        
    @staticmethod
    def verify_user_phone(user_id):
        # Validate user_id present
        if not user_id:
            return None, "user_id is required"

        # Validate user_id valid
        oid, err = VerificationDriver._validate_obj_id(user_id, "user_id")
        if err:
            return None, err
        
        try:
            #Find user, ensure exists
            user = UserObject.find_by_id(user_id)
            if not user:
                return None, "User not found"
            else:
                # Check if already verified
                if user.get("phone_verified"):
                    return "User already verified", None
                # Check if user provided email
                if not user.get("phone_number"):
                    return None, "User lacks phone number"
                
                # Get current verifications
                verifies = VerificationObject.find_type_by_user(user_id, "phone")
                print(verifies)
                # If verification already exists
                if (len(verifies) == 1):
                    # If verification is stale (10 min)
                    if (datetime.now().timestamp() - verifies[0]["created_at"]) > 600:
                        # Delete stale verification
                        deleted = VerificationObject.delete(verifies[0]["_id"])
                        if deleted is not None: 
                            # Send new verification email
                            response, err = VerificationDriver.send_not_verified_text(user_id, user.get("phone_number"), VerificationDriver.generate_code())
                            if err is None:
                                # Call verification func recursively
                                response, err = VerificationDriver.verify_user_phone(user_id)
                                # Returns stale text with recursive response
                                if err is None:
                                    return "current text stale, retrying", None
                                return None, err
                            # if err when sending new text
                            return None, err
                        # if err on deleting state text
                        return  "error deleting stale text, ", None
                    # fresh verification exists
                    return "text already sent", None
                # Should not get here, big error
                elif (len(verifies) > 1):
                    return None, "multiple text verifications exist" 
                
                # No verification exists, send new one
                response, err = VerificationDriver.send_not_verified_text(user_id, user.get("phone_number"), VerificationDriver.generate_code())
                if err is None:
                    return response, None
                else:
                    return None, err
        except Exception as e:
            return None, str(e)
        
    # Send Email
    @staticmethod
    def send_not_verified_email(user_id, email, token):
        try:
            # Create verification obj with passed in token, user_id
            response, err = VerificationObject.create("email", token, user_id)
            if err is None:
                print(response)
            else:
                return None, err
        except Exception as e:
            return None, str(e)
        
        # Link contains token id and token text
        link = f"https://www.ahful.app/api/AHFULverify/verify/email/{response}/{token}"

        send_email(
            to_address=email,
            subject="Your email is not verified",
            body_text=(
                "Hello,\n\n"
                "Our records show that your email has not been verified yet.\n\n"
                "You currently may have limited access to the application.\n\n"
                "Please verify your email to unlock full access.\n\n"
                f"Your verification link is {link}\n\n"
                "Thank you for Signing up from the AHFUL Team!"
            )
        )

        return "Verification email sent", None
    
    @staticmethod
    def confirm_email_token(token_id, token):
        verify = VerificationObject.find_by_id(token_id)
        if verify:
            if verify["token"] == token:
                res = UserObject.enable_verification(verify["user_id"], "email")
                deleted = VerificationObject.delete(token_id)
                if deleted:
                    response = "Email sucessfully verified, verification token deleted, " + str(res)
                    return response, None
                else:
                    response = "Email sucessfully verified, verification token failed to deleted, " + str(res)
                    return response, None
            else:
                return None, "Token not found or incorrect token text"
        else:
            return None, "Token not found or incorrect token text"
        
    # Send text
    @staticmethod
    def send_not_verified_text(user_id, number, token):
        try:
            # Create verification obj with passed in token, user_id
            response, err = VerificationObject.create("email", token, user_id)
            if err is None:
                print(response)
            else:
                return None, err
        except Exception as e:
            return None, str(e)
        
        # Link contains token id and token text
        link = f"https://www.ahful.app/api/AHFULverify/verify/phone/{response}/{token}"


        return "Verification text Not Setup Yet.", None
    
    @staticmethod
    def confirm_phone_token(token_id, token):
        verify = VerificationObject.find_by_id(token_id)
        if verify:
            if verify["token"] == token:
                res = UserObject.enable_verification(verify["user_id"], "phone")
                deleted = VerificationObject.delete(token_id)
                if deleted:
                    response = "Phone sucessfully verified, verification token deleted, " + str(res)
                    return response, None
                else:
                    response = "Phone sucessfully verified, verification token failed to deleted, " + str(res)
                    return response, None
            else:
                return None, "Token not found or incorrect token text"
        else:
            return None, "Token not found or incorrect token text"
        
    @staticmethod
    def deverify_user(user_id, type):
        # Validate inputs
        if not user_id:
            return None, "user_id is required"

        # Validate ObjectIds
        oid, err = VerificationDriver._validate_obj_id(user_id, "user_id")
        if err:
            return None, err

        user = UserObject.find_by_id(user_id)
        if not user:
            return None, "User not found"

        try:
            updated_user = UserObject.disable_verification(user["_id"], type)
            if not updated_user:
                return None, "Error disabling verification"
            return updated_user, None
        except ValueError as ve:
            return None, str(ve)
        except Exception as e:
            return None, f"Failed to disable verification: {e}"
from flask import Blueprint, request, jsonify, redirect, g
from Services.VerificationDriver import VerificationDriver
from Auth.verification import login_required_user, login_required_dev, login_required_admin, login_required_gym_owner, login_required_unverified

verificationRouteBlueprint = Blueprint("verification", __name__, url_prefix="/AHFULverify")

# ── VERIFY email by id ─────────────────────────────────────────────────────
@verificationRouteBlueprint.route("/verify/email/user_id/", methods=["POST"])
@login_required_unverified
def verify_email_by_user_id():
    data = request.get_json()
    if not data:
        return jsonify({"error": "No data provided"}), 400

    user_id = data.get("user_id")

    # Own user request, devs or admins only
    if (user_id != g.user_id) and (g.role != "Developer") and (g.role != "Admin"):
        return jsonify({"error": "You may only access your own data"}), 403

    res, err = VerificationDriver.verify_user_email(user_id)

    if err:
        if "not found" in err.lower():
            return jsonify({"error": err}), 404
        return jsonify({"error": err}), 400

    return jsonify({"message": res}), 200

# ── VERIFY phone by id ─────────────────────────────────────────────────────
@verificationRouteBlueprint.route("/verify/phone/user_id/", methods=["POST"])
@login_required_unverified
def verify_phone_by_user_id():
    data = request.get_json()
    if not data:
        return jsonify({"error": "No data provided"}), 400

    user_id = data.get("user_id")

    # Own user request, devs or admins only
    if (user_id != g.user_id) and (g.role != "Developer") and (g.role != "Admin"):
        return jsonify({"error": "You may only access your own data"}), 403
    
    res, err = VerificationDriver.verify_user_phone(user_id)

    if err:
        if "not found" in err.lower():
            return jsonify({"error": err}), 404
        return jsonify({"error": err}), 400

    return jsonify({"message": res}), 200

# ── VERIFY email token─────────────────────────────────────────────────────
@verificationRouteBlueprint.route("/verify/email/<token_id>/<token>",methods=["GET"])
def verify_email_token(token_id, token):
    res, err = VerificationDriver.confirm_email_token(token_id, token)

    front_end_base = "https://ahful.app/EmailVerification"
    
    if err: 
        return redirect(
            f"{front_end_base}?status=error&message={err}"
        )
    
    return redirect(
        f"{front_end_base}?status=success"
    )

# ── VERIFY phone token─────────────────────────────────────────────────────
@verificationRouteBlueprint.route("/verify/phone/<token_id>/<token>",methods=["GET"])
def verify_phone_token(token_id, token):
    res, err = VerificationDriver.confirm_phone_token(token_id, token)

    front_end_base = "https://ahful.app/PhoneVerification"
    
    if err: 
        return redirect(
            f"{front_end_base}?status=error&message={err}"
        )
    
    return redirect(
        f"{front_end_base}?status=success"
    )

# ── Start email flow for user, admin only ────────────────────────────────────────────────────────────
@verificationRouteBlueprint.route("/email_flow/<user_id>", methods=["GET"])
@login_required_admin
def email_flow(user_id):
    response, error = VerificationDriver.verify_user_email(user_id)
    if error:
        return jsonify({"error": error}), 404
    return jsonify(response), 200

# ── DEVERIFY email or phone by user_id ─────────────────────────────────────
@verificationRouteBlueprint.route("/deverify/user_id/", methods=["POST"])
@login_required_admin
def deverify_user():
    data = request.get_json()
    if not data:
        return jsonify({"error": "No data provided"}), 400

    user_id = data.get("user_id")
    v_type = data.get("type")  # expected: "email" or "phone"

    # Validate verification type
    if not v_type or v_type not in ("email", "phone"):
        return jsonify({"error": "type must be 'email' or 'phone'"}), 400

    res, err = VerificationDriver.deverify_user(user_id, v_type)

    if err:
        if "not found" in err.lower():
            return jsonify({"error": err}), 404
        return jsonify({"error": err}), 400

    return jsonify({
        "message": f"{v_type} verification disabled",
        "user": res
    }), 200


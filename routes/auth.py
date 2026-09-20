from flask import Blueprint, request, jsonify, session
from werkzeug.security import generate_password_hash, check_password_hash
from models import db, User

auth_bp = Blueprint("auth", __name__)


@auth_bp.route("/api/register", methods=["POST"])
def register():
    data = request.get_json()

    if not data:
        return jsonify({"error": "Дані не передані"}), 400

    username = data.get("username", "").strip()
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")

    if not username or not email or not password:
        return jsonify({"error": "Усі поля є обов'язковими"}), 400

    if "@" not in email or "." not in email:
        return jsonify({"error": "Некоректна електронна адреса"}), 400

    if len(password) < 6:
        return jsonify({"error": "Пароль повинен містити щонайменше 6 символів"}), 400

    existing_user = User.query.filter_by(email=email).first()

    if existing_user:
        return jsonify({"error": "Користувач з такою електронною адресою вже існує"}), 409

    user = User(
        username=username,
        email=email,
        password_hash=generate_password_hash(password)
    )

    db.session.add(user)
    db.session.commit()

    return jsonify({
        "message": "Користувача успішно зареєстровано"
    }), 201


@auth_bp.route("/api/login", methods=["POST"])
def login():
    data = request.get_json()

    if not data:
        return jsonify({"error": "Дані не передані"}), 400

    email = data.get("email", "").strip().lower()
    password = data.get("password", "")

    if not email or not password:
        return jsonify({"error": "Email та пароль є обов'язковими"}), 400

    user = User.query.filter_by(email=email).first()

    if not user or not check_password_hash(user.password_hash, password):
        return jsonify({"error": "Неправильний email або пароль"}), 401

    session["user_id"] = user.id

    return jsonify({
        "message": "Авторизація успішна",
        "user": {
            "id": user.id,
            "username": user.username,
            "email": user.email
        }
    }), 200


@auth_bp.route("/api/logout", methods=["POST"])
def logout():
    session.pop("user_id", None)

    return jsonify({
        "message": "Вихід виконано успішно"
    }), 200
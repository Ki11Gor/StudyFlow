from flask import Blueprint, request, jsonify, session
from models import db, Subject

subjects_bp = Blueprint("subjects", __name__)


def get_current_user_id():
    return session.get("user_id")


@subjects_bp.route("/api/subjects", methods=["GET"])
def get_subjects():
    user_id = get_current_user_id()

    if not user_id:
        return jsonify({"error": "Необхідна авторизація"}), 401

    subjects = Subject.query.filter_by(user_id=user_id).all()

    return jsonify([
        {
            "id": subject.id,
            "name": subject.name
        }
        for subject in subjects
    ]), 200


@subjects_bp.route("/api/subjects", methods=["POST"])
def create_subject():
    user_id = get_current_user_id()

    if not user_id:
        return jsonify({"error": "Необхідна авторизація"}), 401

    data = request.get_json()

    if not data:
        return jsonify({"error": "Дані не передані"}), 400

    name = data.get("name", "").strip()

    if not name:
        return jsonify({"error": "Назва предмета є обов'язковою"}), 400

    subject = Subject(
        name=name,
        user_id=user_id
    )

    db.session.add(subject)
    db.session.commit()

    return jsonify({
        "message": "Предмет успішно створено",
        "subject": {
            "id": subject.id,
            "name": subject.name
        }
    }), 201


@subjects_bp.route("/api/subjects/<int:subject_id>", methods=["PUT"])
def update_subject(subject_id):
    user_id = get_current_user_id()

    if not user_id:
        return jsonify({"error": "Необхідна авторизація"}), 401

    subject = Subject.query.filter_by(
        id=subject_id,
        user_id=user_id
    ).first()

    if not subject:
        return jsonify({"error": "Предмет не знайдено"}), 404

    data = request.get_json()

    if not data:
        return jsonify({"error": "Дані не передані"}), 400

    name = data.get("name", "").strip()

    if not name:
        return jsonify({"error": "Назва предмета є обов'язковою"}), 400

    subject.name = name
    db.session.commit()

    return jsonify({
        "message": "Предмет успішно оновлено",
        "subject": {
            "id": subject.id,
            "name": subject.name
        }
    }), 200


@subjects_bp.route("/api/subjects/<int:subject_id>", methods=["DELETE"])
def delete_subject(subject_id):
    user_id = get_current_user_id()

    if not user_id:
        return jsonify({"error": "Необхідна авторизація"}), 401

    subject = Subject.query.filter_by(
        id=subject_id,
        user_id=user_id
    ).first()

    if not subject:
        return jsonify({"error": "Предмет не знайдено"}), 404

    db.session.delete(subject)
    db.session.commit()

    return jsonify({
        "message": "Предмет успішно видалено"
    }), 200
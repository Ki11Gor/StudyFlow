from flask import Blueprint, request, jsonify, session
from datetime import datetime
from models import db, Task, Subject

tasks_bp = Blueprint("tasks", __name__)


def get_current_user_id():
    return session.get("user_id")


def task_to_dict(task):
    return {
        "id": task.id,
        "title": task.title,
        "description": task.description,
        "deadline": task.deadline.isoformat() if task.deadline else None,
        "priority": task.priority,
        "status": task.status,
        "subject_id": task.subject_id
    }


@tasks_bp.route("/api/tasks", methods=["GET"])
def get_tasks():
    user_id = get_current_user_id()

    if not user_id:
        return jsonify({"error": "Необхідна авторизація"}), 401

    tasks = Task.query.filter_by(user_id=user_id).all()

    return jsonify([
        task_to_dict(task) for task in tasks
    ]), 200


@tasks_bp.route("/api/tasks/<int:task_id>", methods=["GET"])
def get_task(task_id):
    user_id = get_current_user_id()

    if not user_id:
        return jsonify({"error": "Необхідна авторизація"}), 401

    task = Task.query.filter_by(
        id=task_id,
        user_id=user_id
    ).first()

    if not task:
        return jsonify({"error": "Завдання не знайдено"}), 404

    return jsonify(task_to_dict(task)), 200


@tasks_bp.route("/api/tasks", methods=["POST"])
def create_task():
    user_id = get_current_user_id()

    if not user_id:
        return jsonify({"error": "Необхідна авторизація"}), 401

    data = request.get_json()

    if not data:
        return jsonify({"error": "Дані не передані"}), 400

    title = data.get("title", "").strip()
    description = data.get("description", "").strip()
    subject_id = data.get("subject_id")
    deadline_value = data.get("deadline")
    priority = data.get("priority", "medium")
    status = data.get("status", "planned")

    if not title:
        return jsonify({"error": "Назва завдання є обов'язковою"}), 400

    if not subject_id:
        return jsonify({"error": "Необхідно вибрати предмет"}), 400

    subject = Subject.query.filter_by(
        id=subject_id,
        user_id=user_id
    ).first()

    if not subject:
        return jsonify({"error": "Предмет не знайдено"}), 404

    if priority not in ["low", "medium", "high"]:
        return jsonify({"error": "Некоректний пріоритет"}), 400

    if status not in ["planned", "in_progress", "completed"]:
        return jsonify({"error": "Некоректний статус"}), 400

    deadline = None

    if deadline_value:
        try:
            deadline = datetime.strptime(
                deadline_value,
                "%Y-%m-%d"
            ).date()
        except ValueError:
            return jsonify({
                "error": "Некоректний формат дедлайну. Використовуйте YYYY-MM-DD"
            }), 400

    task = Task(
        title=title,
        description=description,
        deadline=deadline,
        priority=priority,
        status=status,
        subject_id=subject_id,
        user_id=user_id
    )

    db.session.add(task)
    db.session.commit()

    return jsonify({
        "message": "Завдання успішно створено",
        "task": task_to_dict(task)
    }), 201


@tasks_bp.route("/api/tasks/<int:task_id>", methods=["PUT"])
def update_task(task_id):
    user_id = get_current_user_id()

    if not user_id:
        return jsonify({"error": "Необхідна авторизація"}), 401

    task = Task.query.filter_by(
        id=task_id,
        user_id=user_id
    ).first()

    if not task:
        return jsonify({"error": "Завдання не знайдено"}), 404

    data = request.get_json()

    if not data:
        return jsonify({"error": "Дані не передані"}), 400

    if "title" in data:
        title = str(data["title"]).strip()

        if not title:
            return jsonify({"error": "Назва завдання не може бути порожньою"}), 400

        task.title = title

    if "description" in data:
        task.description = str(data["description"]).strip()

    if "priority" in data:
        if data["priority"] not in ["low", "medium", "high"]:
            return jsonify({"error": "Некоректний пріоритет"}), 400

        task.priority = data["priority"]

    if "status" in data:
        if data["status"] not in ["planned", "in_progress", "completed"]:
            return jsonify({"error": "Некоректний статус"}), 400

        task.status = data["status"]

    if "deadline" in data:
        if data["deadline"]:
            try:
                task.deadline = datetime.strptime(
                    data["deadline"],
                    "%Y-%m-%d"
                ).date()
            except ValueError:
                return jsonify({
                    "error": "Некоректний формат дедлайну. Використовуйте YYYY-MM-DD"
                }), 400
        else:
            task.deadline = None

    db.session.commit()

    return jsonify({
        "message": "Завдання успішно оновлено",
        "task": task_to_dict(task)
    }), 200


@tasks_bp.route("/api/tasks/<int:task_id>", methods=["DELETE"])
def delete_task(task_id):
    user_id = get_current_user_id()

    if not user_id:
        return jsonify({"error": "Необхідна авторизація"}), 401

    task = Task.query.filter_by(
        id=task_id,
        user_id=user_id
    ).first()

    if not task:
        return jsonify({"error": "Завдання не знайдено"}), 404

    db.session.delete(task)
    db.session.commit()

    return jsonify({
        "message": "Завдання успішно видалено"
    }), 200

@tasks_bp.route("/api/tasks/upcoming", methods=["GET"])
def get_upcoming_tasks():
    user_id = get_current_user_id()

    if not user_id:
        return jsonify({"error": "Необхідна авторизація"}), 401

    tasks = Task.query.filter(
        Task.user_id == user_id,
        Task.status != "completed",
        Task.deadline.isnot(None)
    ).order_by(Task.deadline.asc()).all()

    return jsonify([
        task_to_dict(task) for task in tasks
    ]), 200

@tasks_bp.route("/api/statistics", methods=["GET"])
def get_statistics():
    user_id = get_current_user_id()

    if not user_id:
        return jsonify({"error": "Необхідна авторизація"}), 401

    total = Task.query.filter_by(user_id=user_id).count()
    planned = Task.query.filter_by(
        user_id=user_id,
        status="planned"
    ).count()
    in_progress = Task.query.filter_by(
        user_id=user_id,
        status="in_progress"
    ).count()
    completed = Task.query.filter_by(
        user_id=user_id,
        status="completed"
    ).count()

    completion_percent = 0

    if total > 0:
        completion_percent = round((completed / total) * 100, 1)

    return jsonify({
        "total": total,
        "planned": planned,
        "in_progress": in_progress,
        "completed": completed,
        "completion_percent": completion_percent
    }), 200
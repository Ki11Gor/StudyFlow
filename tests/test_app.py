import pytest
from flask import Flask

from models import db
from routes.auth import auth_bp
from routes.subjects import subjects_bp
from routes.tasks import tasks_bp


@pytest.fixture
def client():
    test_app = Flask(__name__)

    test_app.config["TESTING"] = True
    test_app.config["SECRET_KEY"] = "test-secret-key"
    test_app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///:memory:"
    test_app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

    db.init_app(test_app)

    test_app.register_blueprint(auth_bp)
    test_app.register_blueprint(subjects_bp)
    test_app.register_blueprint(tasks_bp)

    with test_app.app_context():
        db.create_all()

        with test_app.test_client() as client:
            yield client

        db.session.remove()
        db.drop_all()


def test_register_success(client):
    response = client.post(
        "/api/register",
        json={
            "username": "student",
            "email": "student@test.com",
            "password": "123456"
        }
    )

    assert response.status_code == 201
    assert response.get_json()["message"] == "Користувача успішно зареєстровано"


def test_register_invalid_email(client):
    response = client.post(
        "/api/register",
        json={
            "username": "student",
            "email": "incorrect-email",
            "password": "123456"
        }
    )

    assert response.status_code == 400
    assert response.get_json()["error"] == "Некоректна електронна адреса"


def test_login_success(client):
    client.post(
        "/api/register",
        json={
            "username": "student",
            "email": "student@test.com",
            "password": "123456"
        }
    )

    response = client.post(
        "/api/login",
        json={
            "email": "student@test.com",
            "password": "123456"
        }
    )

    assert response.status_code == 200
    assert response.get_json()["message"] == "Авторизація успішна"


def test_create_subject(client):
    client.post(
        "/api/register",
        json={
            "username": "student",
            "email": "student@test.com",
            "password": "123456"
        }
    )

    client.post(
        "/api/login",
        json={
            "email": "student@test.com",
            "password": "123456"
        }
    )

    response = client.post(
        "/api/subjects",
        json={
            "name": "Програмування"
        }
    )

    assert response.status_code == 201
    assert response.get_json()["subject"]["name"] == "Програмування"


def test_create_task_and_statistics(client):
    client.post(
        "/api/register",
        json={
            "username": "student",
            "email": "student@test.com",
            "password": "123456"
        }
    )

    client.post(
        "/api/login",
        json={
            "email": "student@test.com",
            "password": "123456"
        }
    )

    subject_response = client.post(
        "/api/subjects",
        json={
            "name": "Програмування"
        }
    )

    subject_id = subject_response.get_json()["subject"]["id"]

    task_response = client.post(
        "/api/tasks",
        json={
            "title": "Практична робота",
            "description": "Перевірка роботи тестів",
            "subject_id": subject_id,
            "deadline": "2026-09-30",
            "priority": "high",
            "status": "planned"
        }
    )

    assert task_response.status_code == 201

    response = client.get("/api/statistics")
    statistics = response.get_json()

    assert response.status_code == 200
    assert statistics["total"] == 1
    assert statistics["planned"] == 1
    assert statistics["completed"] == 0
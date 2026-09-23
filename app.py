from flask import Flask, render_template
from models import db
from routes.auth import auth_bp
from routes.subjects import subjects_bp
from routes.tasks import tasks_bp

app = Flask(__name__)

app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///studyflow.db"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
app.config["SECRET_KEY"] = "studyflow-secret-key"

db.init_app(app)

app.register_blueprint(auth_bp)
app.register_blueprint(subjects_bp)
app.register_blueprint(tasks_bp)

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/login")
def login_page():
    return render_template("login.html")

@app.route("/register")
def register_page():
    return render_template("register.html")

@app.route("/subjects")
def subjects_page():
    return render_template("subjects.html")

@app.route("/tasks")
def tasks_page():
    return render_template("tasks.html")

@app.route("/tasks/add")
def add_task_page():
    return render_template("add_task.html")

@app.route("/tasks/edit/<int:task_id>")
def edit_task_page(task_id):
    return render_template("edit_task.html", task_id=task_id)

@app.route("/statistics")
def statistics_page():
    return render_template("statistics.html")

with app.app_context():
    db.create_all()


if __name__ == "__main__":
    app.run(debug=True)


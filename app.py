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


with app.app_context():
    db.create_all()


if __name__ == "__main__":
    app.run(debug=True)
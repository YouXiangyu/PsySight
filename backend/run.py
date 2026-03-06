from app import app
from bootstrap.startup_tasks import run_startup_tasks


if __name__ == "__main__":
    with app.app_context():
        run_startup_tasks()
    app.run(debug=True, port=8004, host="0.0.0.0", threaded=True)

from bootstrap.runtime_migrations import bootstrap_scale_codes, run_lightweight_migrations
from models import db


def run_startup_tasks() -> None:
    db.create_all()
    run_lightweight_migrations()
    db.create_all()
    bootstrap_scale_codes()

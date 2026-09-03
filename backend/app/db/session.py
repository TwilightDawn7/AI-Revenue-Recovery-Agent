import os
import logging
from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker
from app.core.config import settings

logger = logging.getLogger("uvicorn")

DB_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SQLITE_PATH = os.path.join(DB_DIR, "recovery_app.db")

database_url = settings.DATABASE_URL
try:
    if database_url.startswith("postgresql"):
        test_engine = create_engine(
            database_url,
            connect_args={"client_encoding": "utf8"},
            pool_pre_ping=True
        )
        with test_engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        engine = test_engine
    else:
        engine = create_engine(database_url, connect_args={"check_same_thread": False})
except Exception as e:
    logger.warning(f"Database connection to PostgreSQL failed: {e}. Falling back to local SQLite database.")
    engine = create_engine(f"sqlite:///{SQLITE_PATH}", connect_args={"check_same_thread": False})

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.database.session import get_db
from app.models import Base
from app.core.security import get_password_hash
from app.models.user import User

# Set up an in-memory SQLite database for testing
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base.metadata.create_all(bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

import pytest

@pytest.fixture(autouse=True, scope="module")
def override_db_for_auth():
    app.dependency_overrides[get_db] = override_get_db
    yield
    app.dependency_overrides.pop(get_db, None)

client = TestClient(app)

def test_register_passenger():
    response = client.post(
        "/api/auth/register",
        json={"email": "passenger@example.com", "password": "securepassword"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "passenger@example.com"
    assert data["role"] == "PASSENGER"
    assert "id" in data

def test_register_duplicate_email():
    response = client.post(
        "/api/auth/register",
        json={"email": "passenger@example.com", "password": "securepassword"}
    )
    assert response.status_code == 400
    assert "already exists" in response.json()["detail"]

def test_login_success():
    response = client.post(
        "/api/auth/login",
        data={"username": "passenger@example.com", "password": "securepassword"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["email"] == "passenger@example.com"

def test_login_invalid_password():
    response = client.post(
        "/api/auth/login",
        data={"username": "passenger@example.com", "password": "wrongpassword"}
    )
    assert response.status_code == 401

def test_admin_route_protection():
    # Attempt to access dashboard without token
    response = client.get("/api/dashboard/stats")
    assert response.status_code == 401

    # Get passenger token
    login_response = client.post(
        "/api/auth/login",
        data={"username": "passenger@example.com", "password": "securepassword"}
    )
    token = login_response.json()["access_token"]

    # Attempt to access dashboard with PASSENGER token
    response = client.get(
        "/api/dashboard/stats",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 403 # Forbidden

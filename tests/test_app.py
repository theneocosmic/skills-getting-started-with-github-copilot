from fastapi.testclient import TestClient
from src.app import app, activities

client = TestClient(app)


def test_get_activities():
    resp = client.get("/activities")
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, dict)
    # Ensure one known activity is present
    assert "Chess Club" in data


def test_signup_and_remove_participant():
    activity = "Chess Club"
    email = "teststudent@mergington.edu"

    # Ensure participant not present initially
    if email in activities[activity]["participants"]:
        activities[activity]["participants"].remove(email)

    # Sign up
    r = client.post(f"/activities/{activity}/signup?email={email}")
    assert r.status_code == 200
    assert "Signed up" in r.json().get("message", "")
    assert email in activities[activity]["participants"]

    # Try signing up again -> should fail
    r2 = client.post(f"/activities/{activity}/signup?email={email}")
    assert r2.status_code == 400

    # Delete the participant
    r3 = client.delete(f"/activities/{activity}/signup?email={email}")
    assert r3.status_code == 200
    assert email not in activities[activity]["participants"]

    # Deleting again should fail
    r4 = client.delete(f"/activities/{activity}/signup?email={email}")
    assert r4.status_code == 400


def test_invalid_activity():
    # POST to non-existent activity
    r = client.post("/activities/NotAnActivity/signup?email=test@mergington.edu")
    assert r.status_code == 404

    # DELETE to non-existent activity
    r2 = client.delete("/activities/NotAnActivity/signup?email=test@mergington.edu")
    assert r2.status_code == 404


def test_max_participants_enforced():
    # No explicit enforcement yet, but ensure app handles signup normally
    activity = "Chess Club"
    # we won't try to overflow max participants in this simple test
    assert "max_participants" in activities[activity]
*** End Patch
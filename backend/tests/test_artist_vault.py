"""
Backend test suite for SPOTLIGHT / Artist Vault.
Covers: auth (register/login/me/logout), artists list, spot/unspot,
vault, /me/stats, leaderboard, tier progression.
"""
import os
import uuid
import time
import requests
import pytest

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
# fallback to frontend .env if env not present in this shell
if not BASE_URL:
    try:
        with open("/app/frontend/.env") as f:
            for line in f:
                if line.startswith("REACT_APP_BACKEND_URL"):
                    BASE_URL = line.split("=", 1)[1].strip().strip('"').rstrip("/")
                    break
    except Exception:
        pass

API = f"{BASE_URL}/api"

ADMIN_EMAIL = "admin@artistvault.com"
ADMIN_PASSWORD = "vault123"


@pytest.fixture(scope="session")
def s():
    sess = requests.Session()
    sess.headers.update({"Content-Type": "application/json"})
    return sess


def _auth_headers(token):
    return {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}


@pytest.fixture(scope="session")
def admin_token(s):
    r = s.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    assert r.status_code == 200, f"Admin login failed: {r.status_code} {r.text}"
    data = r.json()
    assert "token" in data and "user" in data
    return data["token"]


@pytest.fixture(scope="session")
def new_user(s):
    """Create a brand new user; reused across tests for cleanup-friendly flow."""
    email = f"test_{uuid.uuid4().hex[:10]}@example.com"
    password = "spotter123"
    name = "Test Spotter"
    r = s.post(f"{API}/auth/register", json={"name": name, "email": email, "password": password})
    assert r.status_code == 200, f"Register failed: {r.status_code} {r.text}"
    data = r.json()
    assert data["user"]["email"] == email.lower()
    assert data["user"]["name"] == name
    assert isinstance(data["token"], str) and len(data["token"]) > 20
    return {"email": email, "password": password, "name": name,
            "token": data["token"], "id": data["user"]["id"]}


# ---------------- Health / Root ----------------
class TestRoot:
    def test_api_root(self, s):
        r = s.get(f"{API}/")
        assert r.status_code == 200
        assert r.json().get("message") == "Artist Vault API"


# ---------------- Auth ----------------
class TestAuth:
    def test_admin_login(self, admin_token):
        assert isinstance(admin_token, str)

    def test_register_duplicate_email_fails(self, s, new_user):
        r = s.post(f"{API}/auth/register",
                   json={"name": "Dup", "email": new_user["email"], "password": "x"})
        assert r.status_code == 400
        assert "already" in r.json().get("detail", "").lower()

    def test_login_invalid_password(self, s, new_user):
        r = s.post(f"{API}/auth/login",
                   json={"email": new_user["email"], "password": "wrongpass"})
        assert r.status_code == 401

    def test_me_with_bearer(self, s, new_user):
        r = s.get(f"{API}/auth/me", headers=_auth_headers(new_user["token"]))
        assert r.status_code == 200
        body = r.json()
        assert body["email"] == new_user["email"].lower()
        assert body["id"] == new_user["id"]
        assert body["name"] == new_user["name"]

    def test_me_without_token_401(self, s):
        r = requests.get(f"{API}/auth/me")  # bypass session cookies
        assert r.status_code == 401

    def test_logout_endpoint(self, s, new_user):
        r = s.post(f"{API}/auth/logout", headers=_auth_headers(new_user["token"]))
        assert r.status_code == 200
        assert r.json().get("ok") is True


# ---------------- Artists ----------------
class TestArtists:
    def test_list_artists_public(self, s):
        r = requests.get(f"{API}/artists")
        assert r.status_code == 200
        arr = r.json()
        assert isinstance(arr, list)
        assert len(arr) >= 12, f"expected >=12 seeded artists, got {len(arr)}"
        a = arr[0]
        for key in ("id", "name", "genre", "image_url", "momentum", "trend", "spot_count"):
            assert key in a, f"missing '{key}' in artist payload"
        assert isinstance(a["trend"], list) and len(a["trend"]) > 0
        assert a["spotted"] is None  # public listing

    def test_artists_with_bearer_returns_spotted_status(self, new_user):
        r = requests.get(f"{API}/artists", headers=_auth_headers(new_user["token"]))
        assert r.status_code == 200
        arr = r.json()
        # field should still be present (None when not spotted)
        assert "spotted" in arr[0]


# ---------------- Spots / Vault / Stats ----------------
class TestSpotsFlow:
    def test_full_spot_unspot_vault_stats(self, s):
        # 1) create fresh user (isolated state)
        email = f"test_{uuid.uuid4().hex[:10]}@example.com"
        reg = s.post(f"{API}/auth/register",
                     json={"name": "Flow User", "email": email, "password": "spotter123"})
        assert reg.status_code == 200
        token = reg.json()["token"]
        H = _auth_headers(token)

        # 2) fetch artists, pick first 3
        r = requests.get(f"{API}/artists", headers=H)
        assert r.status_code == 200
        artists = r.json()
        picks = artists[:3]
        positions = []

        # 3) spot 3 artists
        for art in picks:
            sp = requests.post(f"{API}/spots/{art['id']}", headers=H)
            assert sp.status_code == 200, f"spot failed: {sp.status_code} {sp.text}"
            body = sp.json()
            assert "position" in body and isinstance(body["position"], int)
            assert body["position"] >= 1
            assert body["artist"]["id"] == art["id"]
            assert "tier" in body and "title" in body["tier"]
            positions.append(body["position"])

        # 4) double-spot should 400
        dup = requests.post(f"{API}/spots/{picks[0]['id']}", headers=H)
        assert dup.status_code == 400

        # 5) /me/stats -> total 3
        st = requests.get(f"{API}/me/stats", headers=H)
        assert st.status_code == 200
        stats = st.json()
        assert stats["total"] == 3
        assert stats["tier"]["spots"] == 3
        # 3 spots => tier "Tracker" (min 3)
        assert stats["tier"]["title"] in ("Tracker", "Curator")

        # 6) /vault -> 3 items
        v = requests.get(f"{API}/vault", headers=H)
        assert v.status_code == 200
        vault = v.json()
        assert "items" in vault and len(vault["items"]) == 3
        assert "tier" in vault and "spotter_id" in vault
        item0 = vault["items"][0]
        for k in ("artist_id", "name", "genre", "image_url", "momentum",
                  "trend", "position", "spotted_at", "is_early"):
            assert k in item0

        # 7) unspot one -> vault has 2
        un = requests.delete(f"{API}/spots/{picks[0]['id']}", headers=H)
        assert un.status_code == 200
        v2 = requests.get(f"{API}/vault", headers=H).json()
        assert len(v2["items"]) == 2
        ids_left = {i["artist_id"] for i in v2["items"]}
        assert picks[0]["id"] not in ids_left

        # 8) artist listing now reflects spotted on the remaining ones
        arts_after = requests.get(f"{API}/artists", headers=H).json()
        by_id = {a["id"]: a for a in arts_after}
        assert by_id[picks[1]["id"]]["spotted"] is not None
        assert by_id[picks[0]["id"]]["spotted"] is None

    def test_spot_requires_auth(self):
        # pick any artist id
        artists = requests.get(f"{API}/artists").json()
        r = requests.post(f"{API}/spots/{artists[0]['id']}")
        assert r.status_code == 401

    def test_spot_nonexistent_artist(self, new_user):
        r = requests.post(f"{API}/spots/does-not-exist",
                          headers=_auth_headers(new_user["token"]))
        assert r.status_code == 404


# ---------------- Leaderboard ----------------
class TestLeaderboard:
    def test_leaderboard_public(self, s):
        r = requests.get(f"{API}/leaderboard")
        assert r.status_code == 200
        rows = r.json()
        assert isinstance(rows, list)
        if rows:
            row = rows[0]
            for k in ("rank", "name", "spots", "early", "tier"):
                assert k in row
            assert row["rank"] == 1

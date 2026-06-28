from dotenv import load_dotenv
from pathlib import Path
load_dotenv(Path(__file__).parent / '.env')

import os
import jwt
import bcrypt
import uuid
import random
import logging
from datetime import datetime, timezone, timedelta
from typing import List, Optional, Annotated

from fastapi import FastAPI, APIRouter, Request, HTTPException, Depends, Response
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
from pydantic import BaseModel, Field, EmailStr, BeforeValidator, ConfigDict

# ---------- DB ----------
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

JWT_SECRET = os.environ['JWT_SECRET']
JWT_ALGORITHM = "HS256"

app = FastAPI()
api = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("artist_vault")

# ---------- Helpers ----------
PyObjectId = Annotated[str, BeforeValidator(str)]


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))


def create_access_token(user_id: str, email: str) -> str:
    payload = {"sub": user_id, "email": email,
               "exp": datetime.now(timezone.utc) + timedelta(days=7), "type": "access"}
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


SPOTTER_TIERS = [
    {"level": 1, "title": "Initiate", "min": 0},
    {"level": 2, "title": "Scout", "min": 1},
    {"level": 3, "title": "Tracker", "min": 3},
    {"level": 4, "title": "Curator", "min": 6},
    {"level": 5, "title": "Tastemaker", "min": 10},
    {"level": 6, "title": "Oracle", "min": 16},
]


def tier_for(count: int) -> dict:
    current = SPOTTER_TIERS[0]
    for t in SPOTTER_TIERS:
        if count >= t["min"]:
            current = t
    nxt = next((t for t in SPOTTER_TIERS if t["min"] > count), None)
    return {
        "level": current["level"],
        "title": current["title"],
        "spots": count,
        "next_title": nxt["title"] if nxt else None,
        "next_at": nxt["min"] if nxt else None,
        "to_next": (nxt["min"] - count) if nxt else 0,
    }


# ---------- Models ----------
class RegisterInput(BaseModel):
    name: str
    email: EmailStr
    password: str


class LoginInput(BaseModel):
    email: EmailStr
    password: str


# ---------- Auth ----------
async def get_current_user(request: Request) -> dict:
    token = request.cookies.get("access_token")
    if not token:
        auth = request.headers.get("Authorization", "")
        if auth.startswith("Bearer "):
            token = auth[7:]
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user = await db.users.find_one({"_id": ObjectId(payload["sub"])})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        user["id"] = str(user["_id"])
        user.pop("_id", None)
        user.pop("password_hash", None)
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")


def public_user(user: dict) -> dict:
    return {"id": user["id"], "name": user["name"], "email": user["email"]}


@api.post("/auth/register")
async def register(body: RegisterInput, response: Response):
    email = body.email.lower()
    if await db.users.find_one({"email": email}):
        raise HTTPException(status_code=400, detail="Email already registered")
    doc = {
        "name": body.name.strip() or "Spotter",
        "email": email,
        "password_hash": hash_password(body.password),
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    res = await db.users.insert_one(doc)
    uid = str(res.inserted_id)
    token = create_access_token(uid, email)
    response.set_cookie("access_token", token, httponly=True, secure=False,
                        samesite="lax", max_age=604800, path="/")
    return {"token": token, "user": {"id": uid, "name": doc["name"], "email": email}}


@api.post("/auth/login")
async def login(body: LoginInput, response: Response):
    email = body.email.lower()
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(body.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    uid = str(user["_id"])
    token = create_access_token(uid, email)
    response.set_cookie("access_token", token, httponly=True, secure=False,
                        samesite="lax", max_age=604800, path="/")
    return {"token": token, "user": {"id": uid, "name": user["name"], "email": email}}


@api.post("/auth/logout")
async def logout(response: Response):
    response.delete_cookie("access_token", path="/")
    return {"ok": True}


@api.get("/auth/me")
async def me(user: dict = Depends(get_current_user)):
    return public_user(user)


# ---------- Artists ----------
async def artist_with_status(artist: dict, user_id: Optional[str]):
    artist = dict(artist)
    artist["id"] = artist.pop("_id") if "_id" in artist else artist["id"]
    spotted = None
    if user_id:
        spot = await db.spots.find_one({"user_id": user_id, "artist_id": artist["id"]})
        if spot:
            spotted = {"position": spot["position"], "spotted_at": spot["spotted_at"]}
    artist["spotted"] = spotted
    return artist


async def optional_user(request: Request) -> Optional[dict]:
    try:
        return await get_current_user(request)
    except HTTPException:
        return None


@api.get("/artists")
async def list_artists(request: Request):
    user = await optional_user(request)
    uid = user["id"] if user else None
    artists = await db.artists.find().sort("momentum", -1).to_list(100)
    return [await artist_with_status(a, uid) for a in artists]


@api.get("/artists/{artist_id}")
async def get_artist(artist_id: str, request: Request):
    user = await optional_user(request)
    uid = user["id"] if user else None
    artist = await db.artists.find_one({"_id": artist_id})
    if not artist:
        raise HTTPException(status_code=404, detail="Artist not found")
    return await artist_with_status(artist, uid)


# ---------- Spotting ----------
@api.post("/spots/{artist_id}")
async def spot_artist(artist_id: str, user: dict = Depends(get_current_user)):
    artist = await db.artists.find_one({"_id": artist_id})
    if not artist:
        raise HTTPException(status_code=404, detail="Artist not found")
    existing = await db.spots.find_one({"user_id": user["id"], "artist_id": artist_id})
    if existing:
        raise HTTPException(status_code=400, detail="Already spotted")
    updated = await db.artists.find_one_and_update(
        {"_id": artist_id}, {"$inc": {"spot_count": 1}}, return_document=True
    )
    position = updated["spot_count"]
    now = datetime.now(timezone.utc).isoformat()
    spot = {
        "_id": str(uuid.uuid4()),
        "user_id": user["id"],
        "artist_id": artist_id,
        "position": position,
        "spotted_at": now,
    }
    await db.spots.insert_one(spot)
    total = await db.spots.count_documents({"user_id": user["id"]})
    return {
        "position": position,
        "spotted_at": now,
        "artist": {"id": artist_id, "name": artist["name"], "genre": artist["genre"],
                   "image_url": artist["image_url"]},
        "tier": tier_for(total),
    }


@api.delete("/spots/{artist_id}")
async def unspot_artist(artist_id: str, user: dict = Depends(get_current_user)):
    res = await db.spots.delete_one({"user_id": user["id"], "artist_id": artist_id})
    if res.deleted_count:
        await db.artists.update_one({"_id": artist_id}, {"$inc": {"spot_count": -1}})
    return {"ok": True}


@api.get("/vault")
async def get_vault(user: dict = Depends(get_current_user)):
    spots = await db.spots.find({"user_id": user["id"]}).sort("spotted_at", -1).to_list(200)
    items = []
    for s in spots:
        artist = await db.artists.find_one({"_id": s["artist_id"]})
        if not artist:
            continue
        items.append({
            "artist_id": s["artist_id"],
            "name": artist["name"],
            "genre": artist["genre"],
            "image_url": artist["image_url"],
            "momentum": artist["momentum"],
            "trend": artist["trend"],
            "position": s["position"],
            "spotted_at": s["spotted_at"],
            "is_early": s["position"] <= 10,
        })
    return {"items": items, "tier": tier_for(len(items)), "spotter_id": user["id"][-6:].upper()}


@api.get("/me/stats")
async def my_stats(user: dict = Depends(get_current_user)):
    total = await db.spots.count_documents({"user_id": user["id"]})
    early = await db.spots.count_documents({"user_id": user["id"], "position": {"$lte": 10}})
    return {"total": total, "early": early, "tier": tier_for(total)}


@api.get("/leaderboard")
async def leaderboard():
    pipeline = [
        {"$group": {"_id": "$user_id", "spots": {"$sum": 1},
                    "early": {"$sum": {"$cond": [{"$lte": ["$position", 10]}, 1, 0]}}}},
        {"$sort": {"spots": -1, "early": -1}},
        {"$limit": 20},
    ]
    rows = await db.spots.aggregate(pipeline).to_list(20)
    result = []
    for i, r in enumerate(rows):
        try:
            u = await db.users.find_one({"_id": ObjectId(r["_id"])})
        except Exception:
            u = None
        result.append({
            "rank": i + 1,
            "name": u["name"] if u else "Anonymous",
            "spots": r["spots"],
            "early": r["early"],
            "tier": tier_for(r["spots"]),
        })
    return result


@api.get("/")
async def root():
    return {"message": "Artist Vault API"}


app.include_router(api)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------- Seed ----------
SEED_ARTISTS = [
    ("Nova Ashe", "Alt-Pop", "https://images.unsplash.com/photo-1634733049839-0292be607569?w=900&q=80"),
    ("Kairo", "Punjabi Hip-Hop", "https://images.unsplash.com/photo-1592700819903-308f4820372d?w=900&q=80"),
    ("Vela", "R&B / Soul", "https://images.unsplash.com/photo-1766766464722-b3c33d720732?w=900&q=80"),
    ("Dbox", "Drill", "https://images.unsplash.com/photo-1644353224392-7e532d7b8f4b?w=900&q=80"),
    ("Lune", "Indie Folk", "https://images.unsplash.com/photo-1776149266586-40ab83a045e9?w=900&q=80"),
    ("Cipher", "Electronic", "https://images.unsplash.com/photo-1610716632318-acfc6a85d1ed?w=900&q=80"),
    ("Saint Vega", "Trap", "https://images.unsplash.com/photo-1517151172077-1e1a85edc948?w=900&q=80"),
    ("Echo Wren", "Dream Pop", "https://images.unsplash.com/photo-1602811471274-99e6fba6b20d?w=900&q=80"),
    ("Onyx", "Afrobeats", "https://images.unsplash.com/photo-1655373325205-bbae7ede0e21?w=900&q=80"),
    ("Mara Sol", "Latin Pop", "https://images.unsplash.com/photo-1563726576073-eb2d255af648?w=900&q=80"),
    ("Halcyon", "Lo-Fi", "https://images.unsplash.com/photo-1610716632424-4d45990bcd48?w=900&q=80"),
    ("Riven", "Rock", "https://images.pexels.com/photos/13589605/pexels-photo-13589605.jpeg?auto=compress&w=900"),
]


def random_trend():
    val = random.uniform(20, 60)
    out = []
    for _ in range(24):
        val += random.uniform(-6, 9)
        val = max(5, min(99, val))
        out.append(round(val, 1))
    return out


@app.on_event("startup")
async def startup():
    await db.users.create_index("email", unique=True)
    # seed artists
    if await db.artists.count_documents({}) == 0:
        docs = []
        for name, genre, img in SEED_ARTISTS:
            trend = random_trend()
            docs.append({
                "_id": str(uuid.uuid4()),
                "name": name,
                "genre": genre,
                "image_url": img,
                "momentum": trend[-1],
                "trend": trend,
                "spot_count": random.randint(2, 120),
            })
        await db.artists.insert_many(docs)
        logger.info("Seeded %d artists", len(docs))
    # seed admin
    admin_email = os.environ.get("ADMIN_EMAIL")
    admin_password = os.environ.get("ADMIN_PASSWORD")
    if admin_email and admin_password:
        existing = await db.users.find_one({"email": admin_email})
        if not existing:
            await db.users.insert_one({
                "name": "Admin",
                "email": admin_email,
                "password_hash": hash_password(admin_password),
                "created_at": datetime.now(timezone.utc).isoformat(),
            })


@app.on_event("shutdown")
async def shutdown():
    client.close()

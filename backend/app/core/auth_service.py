import json
import uuid
import os
from pathlib import Path
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
import bcrypt
import jwt

SECRET_KEY = os.getenv("JWT_SECRET", "amr_sentinel_super_secret_biotech_key_2026")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 # 24 hours

USERS_DB_FILE = Path(__file__).resolve().parent.parent.parent / "data" / "users.json"
USERS_DB_FILE.parent.mkdir(parents=True, exist_ok=True)

class AuthService:
    def __init__(self, db_path: Path = USERS_DB_FILE):
        self.db_path = db_path
        self._ensure_db()

    def _ensure_db(self):
        if not self.db_path.exists():
            # Seed with default senior researcher
            default_salt = bcrypt.gensalt()
            default_pw_hash = bcrypt.hashpw("Biotech2026!".encode(), default_salt).decode()
            seed_users = {
                "researcher@amrsentinel.org": {
                    "id": "usr_default_001",
                    "full_name": "Dr. Sarah Chen, Ph.D.",
                    "email": "researcher@amrsentinel.org",
                    "password_hash": default_pw_hash,
                    "role": "Principal Microbiology Investigator",
                    "institution": "Institute of Antimicrobial Genomics",
                    "created_at": datetime.utcnow().isoformat()
                }
            }
            with open(self.db_path, "w", encoding="utf-8") as f:
                json.dump(seed_users, f, indent=2)

    def _read_users(self) -> Dict[str, Any]:
        with open(self.db_path, "r", encoding="utf-8") as f:
            return json.load(f)

    def _write_users(self, data: Dict[str, Any]):
        with open(self.db_path, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2)

    def register_user(self, full_name: str, email: str, password: str, institution: Optional[str] = None) -> Dict[str, Any]:
        email_clean = email.strip().lower()
        users = self._read_users()
        if email_clean in users:
            raise ValueError("An account with this institutional email already exists.")

        salt = bcrypt.gensalt()
        pw_hash = bcrypt.hashpw(password.encode(), salt).decode()
        user_id = f"usr_{uuid.uuid4().hex[:10]}"

        new_user = {
            "id": user_id,
            "full_name": full_name.strip(),
            "email": email_clean,
            "password_hash": pw_hash,
            "role": "AMR Research Scientist",
            "institution": institution.strip() if institution else "Biotechnology Research Laboratory",
            "created_at": datetime.utcnow().isoformat()
        }
        users[email_clean] = new_user
        self._write_users(users)
        return {
            "id": new_user["id"],
            "full_name": new_user["full_name"],
            "email": new_user["email"],
            "role": new_user["role"],
            "institution": new_user["institution"],
            "created_at": new_user["created_at"]
        }

    def authenticate_user(self, email: str, password: str) -> Optional[Dict[str, Any]]:
        email_clean = email.strip().lower()
        users = self._read_users()
        user = users.get(email_clean)
        if not user:
            return None

        if bcrypt.checkpw(password.encode(), user["password_hash"].encode()):
            return {
                "id": user["id"],
                "full_name": user["full_name"],
                "email": user["email"],
                "role": user["role"],
                "institution": user.get("institution", "Biotechnology Research Lab"),
                "created_at": user["created_at"]
            }
        return None

    def create_access_token(self, user_data: Dict[str, Any]) -> str:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        payload = {
            "sub": user_data["id"],
            "email": user_data["email"],
            "full_name": user_data["full_name"],
            "role": user_data["role"],
            "institution": user_data.get("institution"),
            "exp": expire
        }
        return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

    def decode_token(self, token: str) -> Optional[Dict[str, Any]]:
        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            return payload
        except jwt.PyJWTError:
            return None

auth_service = AuthService()

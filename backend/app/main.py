import os
import time
from collections import deque

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, EmailStr

app = FastAPI(
    title="Portfolio API",
    description="Backend du portfolio terminal",
    version="1.0.0",
)

def _parse_allowed_origins(raw: str | None) -> list[str]:
    if not raw:
        return ["http://localhost:3036"]
    parts = [p.strip() for p in raw.split(",")]
    return [p for p in parts if p]


ALLOWED_ORIGINS = _parse_allowed_origins(os.getenv("ALLOWED_ORIGINS"))

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Rate limit très léger pour éviter le spam sur /api/contact
# (en mémoire, par IP ; suffisant pour un portfolio)
_CONTACT_WINDOW_S = int(os.getenv("CONTACT_RATE_WINDOW_S", "60"))
_CONTACT_MAX_PER_WINDOW = int(os.getenv("CONTACT_RATE_MAX", "10"))
_contact_hits: dict[str, deque[float]] = {}


@app.middleware("http")
async def rate_limit_contact(request: Request, call_next):
    if request.method.upper() == "POST" and request.url.path == "/api/contact":
        ip = request.client.host if request.client else "unknown"
        now = time.time()
        q = _contact_hits.get(ip)
        if q is None:
            q = deque()
            _contact_hits[ip] = q
        cutoff = now - _CONTACT_WINDOW_S
        while q and q[0] < cutoff:
            q.popleft()
        if len(q) >= _CONTACT_MAX_PER_WINDOW:
            return JSONResponse(
                status_code=429,
                content={
                    "ok": False,
                    "message": "Trop de requêtes. Réessayez plus tard.",
                },
            )
        q.append(now)
    return await call_next(request)


class ContactPayload(BaseModel):
    name: str
    email: EmailStr
    message: str


@app.get("/api/health")
def health():
    return {"status": "ok", "service": "portfolio-api"}


@app.post("/api/contact")
def contact(payload: ContactPayload):
    # Pour l'instant on simule l'envoi (à brancher sur un vrai envoi d'email plus tard)
    return {
        "ok": True,
        "message": "Message reçu. (En production, envoi d'email ici.)",
    }

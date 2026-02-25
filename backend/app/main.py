from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr

app = FastAPI(
    title="Portfolio API",
    description="Backend du portfolio terminal",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


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

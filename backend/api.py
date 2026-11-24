
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from classifier import classify_email, detect_priority
from response_generator import generate_response


# Initialize FastAPI
app = FastAPI(title="Email AI Assistant API")


# Allow React frontend to connect
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Request model
class EmailRequest(BaseModel):
    email: str


# Home route
@app.get("/")
def home():
    return {
        "message": "Email AI Assistant API is running!"
    }


# Analyze email endpoint
@app.post("/analyze")
def analyze_email(request: EmailRequest):

    email = request.email.strip()

    # Validate email content
    if not email:
        raise HTTPException(
            status_code=400,
            detail="Email cannot be empty"
        )

    try:
        # 1. Classify email
        category, confidence = classify_email(email)

        # 2. Detect priority
        priority = detect_priority(email)

        # 3. Generate AI reply
        reply = generate_response(
            email,
            category,
            priority
        )

        # Return analysis result
        return {
            "category": category,
            "confidence": round(float(confidence), 2),
            "priority": priority,
            "reply": reply
        }

    except Exception as error:
        raise HTTPException(
            status_code=503,
            detail=f"Email analysis failed: {str(error)}"
        )

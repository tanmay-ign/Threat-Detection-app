from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.routes import detection, health, alerts, video, websocket, system, detections
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

UPLOADS_DIR = "uploads"
os.makedirs(UPLOADS_DIR, exist_ok=True)

app = FastAPI(
    title="Threat Detection API",
    description="API for threat detection and image storage",
    version="1.0.0"
)

# CORS Configuration - Update ALLOWED_ORIGINS for production
ALLOWED_ORIGINS = os.getenv(
    "ALLOWED_ORIGINS",
    "*"  # Default to allow all in development
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router, prefix="/api", tags=["Health"])
app.include_router(system.router, prefix="/api", tags=["System"])
app.include_router(detection.router, prefix="/api", tags=["Detection"])
app.include_router(detections.router, prefix="/api", tags=["Detections"])
app.include_router(alerts.router, prefix="/api", tags=["Alerts"])
app.include_router(video.router, prefix="/api", tags=["Video"])
app.include_router(websocket.router, tags=["WebSocket"])

# Mount static files for image serving
app.mount("/uploads", StaticFiles(directory=UPLOADS_DIR), name="uploads")

@app.get("/")
async def root():
    return {
        "message": "Threat Detection API",
        "status": "running",
        "version": "1.0.0"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

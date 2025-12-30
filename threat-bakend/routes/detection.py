from fastapi import APIRouter

router = APIRouter()

from app.routes.upload import router as upload_router

router.include_router(upload_router)

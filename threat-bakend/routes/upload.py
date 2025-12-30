from fastapi import APIRouter, File, UploadFile, Form, HTTPException, Query
from typing import Optional
from datetime import datetime, timedelta
from app.utils.image_storage import store_image
from app.routes.websocket import broadcast_alert
from app.routes.system import update_frame_timestamp
from app.db.mongodb import get_detections_collection
import asyncio

router = APIRouter()


@router.post("/detect/upload")
async def upload_detection(
    image: UploadFile = File(..., description="Image file to upload"),
    object_type: str = Form(..., description="Type of object detected"),
    category: str = Form(..., description="Category of the object"),
    threat_level: str = Form(..., description="Threat level from AI (SAFE, MEDIUM, HIGH, CRITICAL)"),
    camera_id: str = Form(..., description="Camera ID that captured the image"),
    unique_object_id: str = Form(..., description="Unique object identifier for deduplication"),
    confidence: Optional[float] = Form(None, description="Detection confidence score"),
    location: Optional[str] = Form(None, description="Camera location")
):
    """
    Upload detected object image and store in MongoDB.
    
    - **image**: Image file (JPEG, PNG)
    - **object_type**: Type of object (e.g., 'person', 'weapon', 'bag')
    - **category**: Specific category (e.g., 'knife', 'gun', 'backpack')
    - **threat_level**: Threat level from AI (SAFE, MEDIUM, HIGH, CRITICAL) - stored exactly as received
    - **camera_id**: ID of the camera that captured the image
    - **unique_object_id**: Unique identifier for this specific object instance
    - **confidence**: Optional detection confidence score
    - **location**: Optional camera location
    """
    try:
        update_frame_timestamp()
        
        if not image.content_type.startswith("image/"):
            raise HTTPException(status_code=400, detail="File must be an image")
        
        image_bytes = await image.read()
        
        if len(image_bytes) == 0:
            raise HTTPException(status_code=400, detail="Empty image file")
        
        metadata = {
            "camera_id": camera_id,
            "unique_object_id": unique_object_id,  # Store unique ID
            "filename": image.filename,
            "content_type": image.content_type,
            "file_size": len(image_bytes)
        }
        
        if confidence is not None:
            metadata["confidence"] = confidence
        
        if location is not None:
            metadata["location"] = location
        
        result = store_image(
            image_bytes=image_bytes,
            object_type=object_type,
            category=category,
            threat_level=threat_level,  # Store exactly what AI sends
            metadata=metadata
        )
        
        if result.get("status") == "duplicate":
            raise HTTPException(
                status_code=409,
                detail=f"Duplicate detection: {unique_object_id} already exists"
            )
        
        if threat_level in ['HIGH', 'CRITICAL', 'MEDIUM']:
            alert_data = {
                "object_type": object_type,
                "category": category,
                "threat_level": threat_level,  # Use exact value from AI
                "camera_id": camera_id,
                "unique_object_id": unique_object_id,
                "timestamp": metadata.get("timestamp", ""),
                "confidence": confidence,
                "location": location,
                "image_url": result.get("image_url"),
                "filename": result.get("filename"),
                "document_id": result.get("document_id")
            }
            asyncio.create_task(broadcast_alert(alert_data))
        
        return {
            "status": "success",
            "message": "Image uploaded and stored successfully",
            "data": result
        }
        
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing upload: {str(e)}")


@router.get("/detect/history")
async def get_detection_history(
    limit: int = Query(100, description="Maximum number of results"),
    hours: int = Query(24, description="Number of hours to look back"),
    threat_level: Optional[str] = Query(None, description="Filter by threat level")
):
    """
    Get detection history for the specified time period.
    
    - **limit**: Maximum number of detections to return
    - **hours**: Number of hours to look back (default: 24)
    - **threat_level**: Optional filter by threat level
    """
    try:
        collection = get_detections_collection()
        if collection is None:
            return {"detections": [], "total": 0, "error": "Database not available"}
        
        time_threshold = datetime.now() - timedelta(hours=hours)
        
        query_filter = {
            "timestamp": {"$gte": time_threshold}
        }
        
        if threat_level:
            query_filter["threat_level"] = threat_level.upper()
        
        cursor = collection.find(query_filter).sort("timestamp", -1).limit(limit)
        
        detections = []
        for detection in cursor:
            detection["_id"] = str(detection["_id"])
            if isinstance(detection.get("timestamp"), datetime):
                detection["timestamp"] = detection["timestamp"].isoformat()
            detections.append(detection)
        
        return {
            "detections": detections,
            "total": len(detections)
        }
    
    except Exception as e:
        return {
            "detections": [],
            "total": 0,
            "error": str(e)
        }


@router.get("/detect/alerts")
async def get_recent_alerts(
    limit: int = Query(50, description="Maximum number of alerts"),
    hours: int = Query(24, description="Number of hours to look back")
):
    """
    Get recent alerts (ALL detections including SAFE).
    
    - **limit**: Maximum number of alerts to return
    - **hours**: Number of hours to look back (default: 24)
    """
    try:
        collection = get_detections_collection()
        if collection is None:
            return {"alerts": [], "total": 0, "error": "Database not available"}
        
        time_threshold = datetime.now() - timedelta(hours=hours)
        
        query_filter = {
            "timestamp": {"$gte": time_threshold}
        }
        
        cursor = collection.find(query_filter).sort("timestamp", -1).limit(limit)
        
        alerts = []
        for alert in cursor:
            alert["_id"] = str(alert["_id"])
            if isinstance(alert.get("timestamp"), datetime):
                alert["timestamp"] = alert["timestamp"].isoformat()
            alerts.append(alert)
        
        return {
            "alerts": alerts,
            "total": len(alerts)
        }
    
    except Exception as e:
        return {
            "alerts": [],
            "total": 0,
            "error": str(e)
        }

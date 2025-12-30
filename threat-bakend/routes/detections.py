from fastapi import APIRouter, Query
from typing import Optional
from datetime import datetime
from app.db.mongodb import get_detections_collection

router = APIRouter()


@router.get("/detections")
async def get_detections(
    object_type: Optional[str] = Query(None, description="Filter by object type (person, weapon, bag, object)"),
    threat_level: Optional[str] = Query(None, description="Filter by threat level (SAFE, MEDIUM, HIGH, CRITICAL)"),
    limit: int = Query(100, description="Maximum number of results"),
    skip: int = Query(0, description="Number of results to skip")
):
    """
    Get all detections with optional filtering.
    Groups by unique_object_id to show only unique objects.
    
    - **object_type**: Filter by type (person, weapon, bag, object)
    - **threat_level**: Filter by threat level
    - **limit**: Maximum results to return
    - **skip**: Number of results to skip (for pagination)
    """
    try:
        collection = get_detections_collection()
        if collection is None:
            return {"detections": [], "total": 0, "error": "Database not available"}
        
        query_filter = {}
        if object_type:
            query_filter["object_type"] = object_type
        if threat_level:
            query_filter["threat_level"] = threat_level.upper()
        
        unique_ids = collection.distinct("unique_object_id", query_filter)
        
        detections = []
        for unique_id in unique_ids[skip:skip+limit]:
            detection = collection.find_one(
                {**query_filter, "unique_object_id": unique_id},
                sort=[("timestamp", -1)]  # Get latest detection for this object
            )
            if detection:
                detection["_id"] = str(detection["_id"])
                if isinstance(detection.get("timestamp"), datetime):
                    detection["timestamp"] = detection["timestamp"].isoformat()
                detections.append(detection)
        
        return {
            "detections": detections,
            "total": len(unique_ids)
        }
    
    except Exception as e:
        return {
            "detections": [],
            "total": 0,
            "error": str(e)
        }


@router.get("/detections/stats")
async def get_detection_stats():
    """
    Get detection statistics based on UNIQUE objects only.
    
    Counts unique object_ids to avoid counting repeated detections.
    
    Returns:
        - total: Total unique objects detected
        - persons: Unique persons detected
        - weapons: Unique weapons detected
        - bags: Unique bags detected
        - objects: Unique normal objects detected
        - by_type: Breakdown by object type
        - by_threat_level: Breakdown by threat level
    """
    try:
        collection = get_detections_collection()
        if collection is None:
            return {"error": "Database not available"}
        
        total_unique = len(collection.distinct("unique_object_id"))
        
        persons = len(collection.distinct("unique_object_id", {"object_type": "person"}))
        weapons = len(collection.distinct("unique_object_id", {"object_type": "weapon"}))
        bags = len(collection.distinct("unique_object_id", {"object_type": "bag"}))
        objects = len(collection.distinct("unique_object_id", {"object_type": "object"}))
        
        safe = len(collection.distinct("unique_object_id", {"threat_level": "SAFE"}))
        medium = len(collection.distinct("unique_object_id", {"threat_level": "MEDIUM"}))
        high = len(collection.distinct("unique_object_id", {"threat_level": "HIGH"}))
        critical = len(collection.distinct("unique_object_id", {"threat_level": "CRITICAL"}))
        
        return {
            "total": total_unique,
            "persons": persons,
            "weapons": weapons,
            "bags": bags,
            "objects": objects,
            "by_type": {
                "person": persons,
                "weapon": weapons,
                "bag": bags,
                "object": objects
            },
            "by_threat_level": {
                "SAFE": safe,
                "MEDIUM": medium,
                "HIGH": high,
                "CRITICAL": critical
            }
        }
    
    except Exception as e:
        return {"error": str(e)}


@router.get("/alerts")
async def get_alerts(
    limit: int = Query(50, description="Maximum number of alerts"),
    skip: int = Query(0, description="Number of results to skip")
):
    """
    Get alerts (MEDIUM, HIGH, CRITICAL threats only).
    Groups by unique_object_id to show only unique threats.
    
    - **limit**: Maximum results to return
    - **skip**: Number of results to skip
    """
    try:
        collection = get_detections_collection()
        if collection is None:
            return {"alerts": [], "total": 0, "error": "Database not available"}
        
        query_filter = {
            "threat_level": {"$in": ["MEDIUM", "HIGH", "CRITICAL"]}
        }
        
        unique_ids = collection.distinct("unique_object_id", query_filter)
        
        alerts = []
        for unique_id in unique_ids[skip:skip+limit]:
            alert = collection.find_one(
                {**query_filter, "unique_object_id": unique_id},
                sort=[("timestamp", -1)]
            )
            if alert:
                alert["_id"] = str(alert["_id"])
                if isinstance(alert.get("timestamp"), datetime):
                    alert["timestamp"] = alert["timestamp"].isoformat()
                alerts.append(alert)
        
        return {
            "alerts": alerts,
            "total": len(unique_ids)
        }
    
    except Exception as e:
        return {
            "alerts": [],
            "total": 0,
            "error": str(e)
        }

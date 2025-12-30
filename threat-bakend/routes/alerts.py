from fastapi import APIRouter, HTTPException, Query
from typing import Optional
from datetime import datetime, timedelta
from app.db.mongodb import (
    get_weapons_collection,
    get_unattended_bags_collection,
    get_persons_collection,
    get_objects_collection
)

router = APIRouter()


@router.get("/detect/alerts")
async def get_alerts(
    threat_level: Optional[str] = Query(None, description="Filter by threat level (HIGH, MEDIUM, LOW, SAFE)"),
    limit: int = Query(50, description="Maximum number of alerts to return"),
    hours: int = Query(24, description="Get alerts from last N hours")
):
    """
    Fetch recent alerts from the detection system.
    
    - **threat_level**: Optional filter by threat level
    - **limit**: Maximum number of results (default: 50)
    - **hours**: Get alerts from last N hours (default: 24)
    """
    try:
        alerts = []
        
        time_threshold = datetime.now() - timedelta(hours=hours)
        
        query_filter = {"timestamp": {"$gte": time_threshold}}
        if threat_level:
            query_filter["threat_level"] = threat_level.upper()
        
        weapons_collection = get_weapons_collection()
        if weapons_collection is not None:
            weapons = list(weapons_collection.find(query_filter).sort("timestamp", -1).limit(limit))
            for weapon in weapons:
                weapon["_id"] = str(weapon["_id"])
                if "image_id" in weapon:
                    weapon["image_id"] = str(weapon["image_id"])
                weapon["timestamp"] = weapon["timestamp"].isoformat()
                weapon["alert_type"] = "weapon"
                alerts.append(weapon)
        
        bags_collection = get_unattended_bags_collection()
        if bags_collection is not None:
            bags = list(bags_collection.find(query_filter).sort("timestamp", -1).limit(limit))
            for bag in bags:
                bag["_id"] = str(bag["_id"])
                if "image_id" in bag:
                    bag["image_id"] = str(bag["image_id"])
                bag["timestamp"] = bag["timestamp"].isoformat()
                bag["alert_type"] = "unattended_bag"
                alerts.append(bag)
        
        if not threat_level or threat_level.upper() == "SAFE":
            persons_collection = get_persons_collection()
            if persons_collection is not None:
                persons = list(persons_collection.find(query_filter).sort("timestamp", -1).limit(limit))
                for person in persons:
                    person["_id"] = str(person["_id"])
                    if "image_id" in person:
                        person["image_id"] = str(person["image_id"])
                    person["timestamp"] = person["timestamp"].isoformat()
                    person["alert_type"] = "person"
                    alerts.append(person)
        
        if not threat_level or threat_level.upper() == "SAFE":
            objects_collection = get_objects_collection()
            if objects_collection is not None:
                objects = list(objects_collection.find(query_filter).sort("timestamp", -1).limit(limit))
                for obj in objects:
                    obj["_id"] = str(obj["_id"])
                    if "image_id" in obj:
                        obj["image_id"] = str(obj["image_id"])
                    obj["timestamp"] = obj["timestamp"].isoformat()
                    obj["alert_type"] = "object"
                    alerts.append(obj)
        
        alerts.sort(key=lambda x: x["timestamp"], reverse=True)
        
        alerts = alerts[:limit]
        
        return {
            "status": "success",
            "count": len(alerts),
            "alerts": alerts
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching alerts: {str(e)}")


@router.get("/detect/alerts/stats")
async def get_alert_stats(hours: int = Query(24, description="Get stats from last N hours")):
    """
    Get statistics about alerts.
    
    - **hours**: Get stats from last N hours (default: 24)
    """
    try:
        time_threshold = datetime.now() - timedelta(hours=hours)
        query_filter = {"timestamp": {"$gte": time_threshold}}
        
        stats = {
            "weapons": 0,
            "unattended_bags": 0,
            "persons": 0,
            "objects": 0,
            "total": 0
        }
        
        weapons_collection = get_weapons_collection()
        if weapons_collection is not None:
            stats["weapons"] = weapons_collection.count_documents(query_filter)
        
        bags_collection = get_unattended_bags_collection()
        if bags_collection is not None:
            stats["unattended_bags"] = bags_collection.count_documents(query_filter)
        
        persons_collection = get_persons_collection()
        if persons_collection is not None:
            stats["persons"] = persons_collection.count_documents(query_filter)
        
        objects_collection = get_objects_collection()
        if objects_collection is not None:
            stats["objects"] = objects_collection.count_documents(query_filter)
        
        stats["total"] = stats["weapons"] + stats["unattended_bags"] + stats["persons"] + stats["objects"]
        
        return {
            "status": "success",
            "period_hours": hours,
            "stats": stats
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching stats: {str(e)}")


@router.get("/detect/history")
async def get_detection_history(
    limit: int = Query(100, description="Maximum number of detections to return"),
    hours: int = Query(24, description="Get detections from last N hours"),
    threat_level: Optional[str] = Query(None, description="Filter by threat level")
):
    """
    Fetch detection history with pagination and filtering.
    
    - **limit**: Maximum number of results (default: 100)
    - **hours**: Get detections from last N hours (default: 24)
    - **threat_level**: Optional filter by threat level
    """
    try:
        detections = []
        
        time_threshold = datetime.now() - timedelta(hours=hours)
        
        query_filter = {"timestamp": {"$gte": time_threshold}}
        if threat_level:
            query_filter["threat_level"] = threat_level.upper()
        
        collections = [
            (get_weapons_collection(), "weapon"),
            (get_unattended_bags_collection(), "unattended_bag"),
            (get_persons_collection(), "person"),
            (get_objects_collection(), "object")
        ]
        
        for collection, alert_type in collections:
            if collection is not None:
                docs = list(collection.find(query_filter).sort("timestamp", -1).limit(limit))
                for doc in docs:
                    doc["_id"] = str(doc["_id"])
                    if "image_id" in doc:
                        doc["image_id"] = str(doc["image_id"])
                    doc["timestamp"] = doc["timestamp"].isoformat()
                    doc["alert_type"] = alert_type
                    detections.append(doc)
        
        detections.sort(key=lambda x: x["timestamp"], reverse=True)
        
        detections = detections[:limit]
        
        return {
            "status": "success",
            "count": len(detections),
            "detections": detections
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching detection history: {str(e)}")

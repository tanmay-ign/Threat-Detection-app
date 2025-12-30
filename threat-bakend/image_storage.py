from datetime import datetime
from bson import ObjectId
from pymongo.errors import DuplicateKeyError
import os
import uuid
from app.db.mongodb import get_detections_collection


UPLOADS_DIR = "uploads"
# Use environment variable for BASE_URL, fallback to localhost for development
BASE_URL = os.getenv("BACKEND_URL", "http://localhost:8000")

os.makedirs(UPLOADS_DIR, exist_ok=True)


def store_image(image_bytes, object_type, category, threat_level, metadata=None):
    """
    Store image as static file and insert metadata into MongoDB detections collection.
    
    IMPORTANT: Images are saved EXACTLY as received from AI.
    - NO resizing
    - NO re-encoding
    - NO quality changes
    - Saved as-is in binary format
    
    UNIQUE CONSTRAINT:
    - Each unique_object_id can only be inserted ONCE
    - Duplicate inserts are rejected automatically
    - Ensures one detection per unique object
    
    Args:
        image_bytes: Image data in bytes (JPEG from AI with quality=95)
        object_type: Type of object detected (e.g., 'weapon', 'person', 'bag', 'object')
        category: Specific category (e.g., 'knife', 'gun', 'backpack')
        threat_level: Threat level from AI ('SAFE', 'MEDIUM', 'HIGH', 'CRITICAL')
        metadata: Additional metadata dictionary (must include 'unique_object_id')
    
    Returns:
        dict: Contains image_url, filename, document_id, and status
        
    Raises:
        Exception: If unique_object_id is missing or duplicate
    """
    if metadata is None:
        metadata = {}
    
    unique_object_id = metadata.get('unique_object_id')
    if not unique_object_id:
        raise Exception("unique_object_id is required in metadata")
    
    collection = get_detections_collection()
    if collection is None:
        raise Exception("Detections collection not available")
    
    existing = collection.find_one({"unique_object_id": unique_object_id})
    if existing:
        return {
            "image_url": existing.get("image_url"),
            "filename": existing.get("filename"),
            "document_id": str(existing.get("_id")),
            "status": "duplicate",
            "message": f"Object {unique_object_id} already exists in database"
        }
    
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    unique_id = str(uuid.uuid4())[:8]
    filename = f"{object_type}_{category}_{timestamp}_{unique_id}.jpg"
    filepath = os.path.join(UPLOADS_DIR, filename)
    
    try:
        with open(filepath, 'wb') as f:
            f.write(image_bytes)  
    except Exception as e:
        raise Exception(f"Failed to save image file: {str(e)}")
    
    image_url = f"{BASE_URL}/uploads/{filename}"
    
    document = {
        "image_url": image_url,
        "filename": filename,
        "filepath": filepath,
        "object_type": object_type,
        "category": category,
        "threat_level": threat_level,  
        "timestamp": datetime.now(),
        **metadata  
    }
    
    try:
        result = collection.insert_one(document)
        return {
            "image_url": image_url,
            "filename": filename,
            "document_id": str(result.inserted_id),
            "status": "success",
            "message": "New detection stored successfully"
        }
    except DuplicateKeyError:
        try:
            os.remove(filepath)
        except:
            pass
        
        existing = collection.find_one({"unique_object_id": unique_object_id})
        return {
            "image_url": existing.get("image_url"),
            "filename": existing.get("filename"),
            "document_id": str(existing.get("_id")),
            "status": "duplicate",
            "message": f"Duplicate unique_object_id: {unique_object_id}"
        }

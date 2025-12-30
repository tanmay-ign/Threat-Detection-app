from pymongo import MongoClient, ASCENDING
from pymongo.errors import ConnectionFailure
from gridfs import GridFS
from dotenv import load_dotenv
import os

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/")

try:
    client = MongoClient(MONGO_URI)
    client.admin.command('ping')
    print("MongoDB connection successful!")
except ConnectionFailure as e:
    print(f"MongoDB connection failed: {e}")
    client = None

threats_db = client["threats_db"] if client is not None else None
normal_db = client["normal_db"] if client is not None else None

detections_collection = threats_db["detections"] if threats_db is not None else None

weapons_collection = threats_db["weapons"] if threats_db is not None else None
unattended_bags_collection = threats_db["unattended_bags"] if threats_db is not None else None

persons_collection = normal_db["persons"] if normal_db is not None else None
objects_collection = normal_db["objects"] if normal_db is not None else None
bags_collection = normal_db["bags"] if normal_db is not None else None

threats_fs = GridFS(threats_db) if threats_db is not None else None
normal_fs = GridFS(normal_db) if normal_db is not None else None

if detections_collection is not None:
    try:
        detections_collection.create_index(
            [("unique_object_id", ASCENDING)],
            unique=True,
            name="unique_object_id_index"
        )
        print("✅ Unique index created on 'unique_object_id' field")
    except Exception as e:
        print(f"⚠️ Index creation info: {e}")

def get_detections_collection():
    """Returns the unified detections collection"""
    return detections_collection

def get_threats_db():
    """Returns the threats database instance"""
    return threats_db

def get_normal_db():
    """Returns the normal database instance"""
    return normal_db

def get_weapons_collection():
    """Returns the weapons collection from threats_db"""
    return weapons_collection

def get_unattended_bags_collection():
    """Returns the unattended_bags collection from threats_db"""
    return unattended_bags_collection

def get_persons_collection():
    """Returns the persons collection from normal_db"""
    return persons_collection

def get_objects_collection():
    """Returns the objects collection from normal_db"""
    return objects_collection

def get_bags_collection():
    """Returns the bags collection from normal_db"""
    return bags_collection

def get_threats_gridfs():
    """Returns the GridFS instance for threats_db"""
    return threats_fs

def get_normal_gridfs():
    """Returns the GridFS instance for normal_db"""
    return normal_fs

def close_connection():
    """Close MongoDB connection"""
    if client is not None:
        client.close()
        print("MongoDB connection closed")

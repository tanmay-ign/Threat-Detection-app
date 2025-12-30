from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
import cv2
import asyncio
import os
from typing import Optional

router = APIRouter()

MOBILE_CAMERA_URL = os.getenv("MOBILE_CAMERA_URL", "http://192.168.29.177:8080/video")
USE_MOBILE_CAMERA = os.getenv("USE_MOBILE_CAMERA", "true").lower() == "true"

camera = None
camera_lock = asyncio.Lock()


def get_camera():
    """Get or initialize camera instance"""
    global camera
    if camera is None or not camera.isOpened():
        if USE_MOBILE_CAMERA:
            print(f"[VIDEO] Connecting to mobile camera: {MOBILE_CAMERA_URL}")
            camera = cv2.VideoCapture(MOBILE_CAMERA_URL, cv2.CAP_FFMPEG)
        else:
            print("[VIDEO] Using webcam (camera 0)")
            camera = cv2.VideoCapture(0)
        
        if not camera.isOpened():
            print("[VIDEO ERROR] Failed to open camera")
            return None
        
        camera.set(cv2.CAP_PROP_BUFFERSIZE, 1)
        print("[VIDEO] Camera opened successfully")
    
    return camera


def generate_frames():
    """Generate video frames from camera"""
    cam = get_camera()
    
    if cam is None:
        import numpy as np
        blank_frame = np.zeros((480, 640, 3), dtype=np.uint8)
        cv2.putText(blank_frame, "Camera Not Available", (150, 240),
                   cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 255, 255), 2)
        
        ret, buffer = cv2.imencode('.jpg', blank_frame)
        frame = buffer.tobytes()
        yield (b'--frame\r\n'
               b'Content-Type: image/jpeg\r\n\r\n' + frame + b'\r\n')
        return
    
    try:
        while True:
            success, frame = cam.read()
            
            if not success:
                print("[VIDEO] Failed to read frame, reconnecting...")
                global camera
                camera = None
                cam = get_camera()
                if cam is None:
                    break
                continue
            
            frame = cv2.resize(frame, (640, 480))
            
            ret, buffer = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 80])
            
            if not ret:
                continue
            
            frame_bytes = buffer.tobytes()
            
            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n'
                   b'Content-Length: ' + str(len(frame_bytes)).encode() + b'\r\n'
                   b'\r\n' + frame_bytes + b'\r\n')
            
    except GeneratorExit:
        print("[VIDEO] Client disconnected")
    except Exception as e:
        print(f"[VIDEO ERROR] {e}")
        if camera is not None:
            camera.release()
            camera = None


@router.get("/video")
async def video_feed():
    """
    Stream live video feed from camera.
    Returns MJPEG stream.
    """
    try:
        return StreamingResponse(
            generate_frames(),
            media_type="multipart/x-mixed-replace; boundary=frame"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error streaming video: {str(e)}")


@router.get("/video/snapshot")
async def get_snapshot():
    """
    Get a single snapshot from the camera.
    """
    try:
        cam = get_camera()
        
        if cam is None:
            raise HTTPException(status_code=503, detail="Camera not available")
        
        success, frame = cam.read()
        
        if not success:
            raise HTTPException(status_code=500, detail="Failed to capture frame")
        
        ret, buffer = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 90])
        
        if not ret:
            raise HTTPException(status_code=500, detail="Failed to encode frame")
        
        return StreamingResponse(
            iter([buffer.tobytes()]),
            media_type="image/jpeg"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error capturing snapshot: {str(e)}")


@router.on_event("shutdown")
async def shutdown_camera():
    """Release camera on shutdown"""
    global camera
    if camera is not None:
        camera.release()

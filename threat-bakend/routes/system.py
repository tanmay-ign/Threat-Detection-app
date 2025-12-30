from fastapi import APIRouter
from datetime import datetime
import time

router = APIRouter()

_system_state = {
    "ai_running": False,
    "last_frame_time": None,
    "start_time": time.time()
}


def update_frame_timestamp():
    """
    Update the last frame timestamp.
    This should be called by the AI detection system every time it processes a frame.
    """
    global _system_state
    _system_state["ai_running"] = True
    _system_state["last_frame_time"] = datetime.now().isoformat()


def get_system_state():
    """Get the current system state"""
    return _system_state.copy()


@router.get("/system/status")
async def get_system_status():
    """
    Get system status information.
    
    Returns:
        - ai_running: Boolean indicating if AI is running
        - last_frame_time: ISO timestamp of last processed frame
        - uptime_seconds: Number of seconds the system has been running
    """
    uptime = time.time() - _system_state["start_time"]
    
    return {
        "ai_running": _system_state["ai_running"],
        "last_frame_time": _system_state["last_frame_time"],
        "uptime_seconds": round(uptime, 2)
    }


@router.post("/system/heartbeat")
async def update_heartbeat():
    """
    Update system heartbeat.
    Called by AI detection system to indicate it's still running.
    """
    update_frame_timestamp()
    return {
        "status": "success",
        "message": "Heartbeat updated"
    }

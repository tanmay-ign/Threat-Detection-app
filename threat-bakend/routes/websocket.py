from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import List
import json
import asyncio

router = APIRouter()

active_connections: List[WebSocket] = []


class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        print(f"[WS] Client connected. Total connections: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)
        print(f"[WS] Client disconnected. Total connections: {len(self.active_connections)}")

    async def send_personal_message(self, message: str, websocket: WebSocket):
        await websocket.send_text(message)

    async def broadcast(self, message: dict):
        """Broadcast message to all connected clients"""
        disconnected = []
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception as e:
                print(f"[WS ERROR] Failed to send to client: {e}")
                disconnected.append(connection)
        
        for connection in disconnected:
            if connection in self.active_connections:
                self.active_connections.remove(connection)


manager = ConnectionManager()


@router.websocket("/ws/alerts")
async def websocket_alerts(websocket: WebSocket):
    """
    WebSocket endpoint for real-time alert notifications.
    Clients connect here to receive instant threat updates.
    """
    await manager.connect(websocket)
    
    try:
        await websocket.send_json({
            "type": "connection",
            "status": "connected",
            "message": "Connected to alert stream"
        })
        
        while True:
            try:
                data = await websocket.receive_text()
                
                if data == "ping":
                    await websocket.send_json({"type": "pong"})
                    
            except WebSocketDisconnect:
                break
            except Exception as e:
                print(f"[WS ERROR] {e}")
                break
                
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        print(f"[WS ERROR] Connection error: {e}")
        manager.disconnect(websocket)


async def broadcast_alert(alert_data: dict):
    """
    Broadcast alert to all connected WebSocket clients.
    Call this function when a new threat is detected.
    
    Args:
        alert_data: Dictionary containing alert information
    """
    message = {
        "type": "alert",
        "data": alert_data
    }
    await manager.broadcast(message)
    print(f"[WS] Broadcasted alert to {len(manager.active_connections)} clients")


__all__ = ['router', 'manager', 'broadcast_alert']

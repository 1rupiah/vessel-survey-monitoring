"""
websocket_server.py
FastAPI backend that streams vessel telemetry to connected clients via WebSocket.

Real deployment:
  - Replace NMEASimulator.tick() with actual serial port reads
  - Add authentication middleware
  - Add PostgreSQL/TimescaleDB logging for track archival
"""

import asyncio
import json
import logging

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from nmea_simulator import NMEASimulator

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
log = logging.getLogger(__name__)

app = FastAPI(title="VesselTrack API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Shared simulator (one vessel, many clients)
simulator = NMEASimulator()

# Connected clients registry
class ConnectionManager:
    def __init__(self):
        self.active: list[WebSocket] = []

    async def connect(self, ws: WebSocket):
        await ws.accept()
        self.active.append(ws)
        log.info(f"Client connected. Total: {len(self.active)}")

    def disconnect(self, ws: WebSocket):
        self.active.remove(ws)
        log.info(f"Client disconnected. Total: {len(self.active)}")

    async def broadcast(self, payload: dict):
        data = json.dumps(payload)
        dead = []
        for ws in self.active:
            try:
                await ws.send_text(data)
            except Exception:
                dead.append(ws)
        for ws in dead:
            self.active.remove(ws)


manager = ConnectionManager()


@app.get("/health")
async def health():
    return {"status": "ok", "clients": len(manager.active)}


@app.websocket("/ws")
async def websocket_endpoint(ws: WebSocket):
    await manager.connect(ws)
    try:
        while True:
            # We don't expect messages from client, but keep reading to detect disconnects
            await asyncio.wait_for(ws.receive_text(), timeout=0.01)
    except asyncio.TimeoutError:
        pass
    except WebSocketDisconnect:
        manager.disconnect(ws)


async def broadcast_loop():
    """Push telemetry to all clients at ~2.5 Hz (400ms interval)."""
    while True:
        if manager.active:
            payload = simulator.tick()
            await manager.broadcast(payload)
        else:
            simulator.tick()  # keep sim advancing even with no clients
        await asyncio.sleep(0.4)


@app.on_event("startup")
async def startup():
    asyncio.create_task(broadcast_loop())
    log.info("VesselTrack WebSocket server started on ws://localhost:8000/ws")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("websocket_server:app", host="0.0.0.0", port=8000, reload=True)

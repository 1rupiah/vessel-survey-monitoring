# 🛥️ VesselTrack Real-time Survey Line Monitor

A full-stack web application for real-time vessel tracking and bathymetric survey line monitoring, built from hands-on experience in offshore geophysical surveys.

## Screenshots

### Follow Mode ON

![VesselTrack Dashboard Follow ON](images/screenshot%20-%20follow-on.png)

### Follow Mode OFF

![VesselTrack Dashboard Follow OFF](images/screenshot%20-%20follow-off.png)

## Overview

This tool replicates the kind of real-time situational awareness needed aboard survey vessels — combining navigation (GPS/NMEA), single-beam sonar depth, ADCP current data, and survey line progress into a single unified dashboard.

**Built for:** hydrographic surveyors, offshore data acquisition engineers, and marine geophysicists.

---

## Features

| Feature                | Description                                                     |
| ---------------------- | --------------------------------------------------------------- |
| 🗺️ Live Map            | Leaflet.js map with real-time vessel track overlay              |
| 📏 Survey Line Monitor | Planned vs completed line progress with XTE (Cross-Track Error) |
| 📡 Navigation Panel    | SOG, COG, Gyro heading, lat/lon (WGS-84)                        |
| 🌊 ADCP                | Current speed/direction, backscatter, bottom track status       |
| ✅ QC Flags            | Real-time automated data quality checks                         |
| 📈 Sensor History      | Live sparkline charts for depth, SOG, current speed             |
| 📋 Event Log           | Timestamped system and alert log                                |
| ⬇️ CSV Export          | Download vessel track as timestamped CSV                        |
| 🔌 WebSocket           | Live data push from Python backend (400ms interval)             |
| 🟡 Fallback Sim        | Browser-side simulator runs if backend is offline               |

---

## Architecture

```
vessel-survey-monitor/
├── frontend/               React + Vite + Leaflet.js + Recharts
│   └── src/
│       ├── components/     MapView, SensorPanel, QCFlags, SurveyLineList
│       ├── hooks/          useVesselData (WebSocket + fallback sim)
│       └── utils/          geo.js (XTE, DMS conversion)
│
└── backend/                Python FastAPI + WebSocket
    ├── websocket_server.py  Broadcasts telemetry at 2.5 Hz
    └── nmea_simulator.py    Simulated vessel — swap for real NMEA serial
```

**Data flow:**

```
[NMEA Serial / Simulator] → FastAPI WS Server → WebSocket → React Frontend → Leaflet Map
```

---

## Quick Start

### Option A: Frontend only (no Python needed)

The frontend includes a built-in simulator — just run it and it works immediately.

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`

---

### Option B: Full stack (frontend + Python backend)

**Terminal 1 - Backend:**

```bash
cd backend
pip install -r requirements.txt
python websocket_server.py
```

**Terminal 2 - Frontend:**

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`

The frontend auto-detects the WebSocket at `ws://localhost:8000/ws`.  
If backend is unreachable, it silently falls back to the browser simulator.

---

## Connecting Real Instruments

The `NMEASimulator.tick()` method in `backend/nmea_simulator.py` is the integration point. Replace it with real serial port reads:

```python
# Example with pyserial + pynmea2
import serial
import pynmea2

ser = serial.Serial('/dev/ttyUSB0', 4800)
line = ser.readline().decode('ascii', errors='replace')
msg = pynmea2.parse(line)
# map msg fields to NavData, SonarData, etc.
```

Supported instruments (real-world):

- **GPS/DGPS:** Any NMEA 0183 source (GGA, RMC sentences)
- **Sonar:** Kongsberg EA440, Reson SeaBat, Elac Seabeam
- **ADCP:** Teledyne RDI Workhorse, SonTek ADP
- **Gyro:** Sperry, Tokimec, Northrop Grumman

---

## Tech Stack

| Layer       | Tech                                                |
| ----------- | --------------------------------------------------- |
| Frontend    | React 18, Vite, Leaflet.js, react-leaflet, Recharts |
| Backend     | Python 3.11, FastAPI, WebSockets, Uvicorn           |
| Data Format | JSON over WebSocket                                 |
| Map Tiles   | OpenStreetMap                                       |

---

## Background

Built based on experience in offshore geophysical survey operations — data acquisition (sonar, ADCP), QC/processing, navigation & positioning, and reporting. This project demonstrates how those workflows translate into software.

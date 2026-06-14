"""
nmea_simulator.py
Generates simulated vessel telemetry data mimicking real NMEA/sensor streams.
In a real deployment, replace this with actual NMEA serial port parsing.
"""

import math
import random
import time
from dataclasses import dataclass, field, asdict
from typing import List


@dataclass
class NavData:
    lat: float
    lon: float
    sog: float      # Speed Over Ground (knots)
    cog: float      # Course Over Ground (degrees True)
    hdg: float      # Gyro heading (degrees True)


@dataclass
class SonarData:
    depth: float    # meters


@dataclass
class ADCPData:
    current_speed: float   # m/s
    current_dir: float     # degrees True
    backscatter: float     # dB
    bottom_track: str      # GOOD / POOR / LOST


@dataclass
class SurveyLine:
    id: int
    name: str
    start: dict
    end: dict
    pct: float = 0.0


@dataclass
class SurveyState:
    active_line: int
    lines: List[SurveyLine]


class NMEASimulator:
    """
    Simulates a vessel running bathymetric survey lines.
    Replace `get_telemetry()` output with real parsed NMEA sentences
    from a serial port (e.g. using pyserial + pynmea2) for live operation.
    """

    BASE_LAT = -5.2000
    BASE_LON = 115.4000
    N_LINES  = 6
    LINE_SPACING_DEG = 0.003
    LINE_LENGTH_DEG  = 0.05
    TICKS_PER_LINE   = 400

    def __init__(self):
        self.t = 0
        self.active_line = 0
        self.lines = self._build_lines()

    def _build_lines(self) -> List[SurveyLine]:
        lines = []
        for i in range(self.N_LINES):
            lat = self.BASE_LAT - i * self.LINE_SPACING_DEG
            lines.append(SurveyLine(
                id=i,
                name=f"L-{i+1:02d}",
                start={"lat": lat, "lon": self.BASE_LON},
                end={"lat": lat,   "lon": self.BASE_LON + self.LINE_LENGTH_DEG},
            ))
        return lines

    def tick(self) -> dict:
        """Advance simulation one step and return telemetry dict."""
        self.t += 1
        ln = self.lines[self.active_line]
        t_norm = (self.t % self.TICKS_PER_LINE) / self.TICKS_PER_LINE

        dlat = ln.end["lat"] - ln.start["lat"]
        dlon = ln.end["lon"] - ln.start["lon"]

        lat = ln.start["lat"] + dlat * t_norm + random.gauss(0, 0.00005)
        lon = ln.start["lon"] + dlon * t_norm + random.gauss(0, 0.00005)

        hdg_rad = math.atan2(dlon, dlat)
        hdg = (math.degrees(hdg_rad) + 360) % 360

        # Update line progress
        ln.pct = t_norm * 100
        if t_norm > 0.995 and self.active_line < len(self.lines) - 1:
            ln.pct = 100
            self.active_line += 1
            self.t = 0

        nav = NavData(
            lat=lat,
            lon=lon,
            sog=4.5 + math.sin(self.t * 0.05) * 0.8 + random.gauss(0, 0.15),
            cog=(hdg + random.gauss(0, 1.5) + 360) % 360,
            hdg=(hdg + 360) % 360,
        )
        sonar = SonarData(
            depth=80 + math.sin(self.t * 0.02) * 25 + random.gauss(0, 1.5),
        )
        adcp = ADCPData(
            current_speed=max(0, 0.25 + math.sin(self.t * 0.03) * 0.15 + random.gauss(0, 0.03)),
            current_dir=(180 + math.sin(self.t * 0.01) * 40 + 360) % 360,
            backscatter=-65 + math.sin(self.t * 0.04) * 5,
            bottom_track="GOOD" if sonar.depth < 300 else "POOR",
        )
        survey = SurveyState(
            active_line=self.active_line,
            lines=self.lines,
        )

        return {
            "type":   "telemetry",
            "ts":     time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            "nav":    asdict(nav),
            "sonar":  asdict(sonar),
            "adcp":   asdict(adcp),
            "survey": {
                "active_line": survey.active_line,
                "lines": [asdict(l) for l in survey.lines],
            },
        }

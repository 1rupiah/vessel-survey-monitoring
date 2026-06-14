import { useState, useEffect, useRef, useCallback } from 'react'

// ── Fallback simulator (runs in browser when backend is offline) ──────────
function createSimulator(onData) {
  let t = 0
  let activeLine = 0
  const BASE_LAT = -5.2000
  const BASE_LON = 115.4000

  const lines = Array.from({ length: 6 }, (_, i) => ({
    id: i,
    name: `L-${String(i + 1).padStart(2, '0')}`,
    start: { lat: BASE_LAT - i * 0.003, lon: BASE_LON },
    end:   { lat: BASE_LAT - i * 0.003, lon: BASE_LON + 0.05 },
    pct: 0,
  }))

  const interval = setInterval(() => {
    t++
    const ln = lines[activeLine]
    const tNorm = (t % 400) / 400
    const dlat = ln.end.lat - ln.start.lat
    const dlon = ln.end.lon - ln.start.lon

    const lat = ln.start.lat + dlat * tNorm + (Math.random() - 0.5) * 0.0001
    const lon = ln.start.lon + dlon * tNorm + (Math.random() - 0.5) * 0.0001
    const hdg = Math.atan2(dlon, dlat) * 180 / Math.PI

    ln.pct = tNorm * 100

    if (tNorm > 0.995 && activeLine < lines.length - 1) {
      ln.pct = 100
      activeLine++
      t = 0
    }

    onData({
      type: 'telemetry',
      ts: new Date().toISOString(),
      nav: {
        lat, lon,
        sog: 4.5 + Math.sin(t * 0.05) * 0.8 + (Math.random() - 0.5) * 0.3,
        cog: (hdg + (Math.random() - 0.5) * 3 + 360) % 360,
        hdg: (hdg + 360) % 360,
      },
      sonar: {
        depth: 80 + Math.sin(t * 0.02) * 25 + (Math.random() - 0.5) * 3,
      },
      adcp: {
        current_speed: 0.25 + Math.sin(t * 0.03) * 0.15 + Math.random() * 0.05,
        current_dir: (180 + Math.sin(t * 0.01) * 40 + 360) % 360,
        backscatter: -65 + Math.sin(t * 0.04) * 5,
        bottom_track: 'GOOD',
      },
      survey: {
        active_line: activeLine,
        lines: lines.map(l => ({ ...l })),
      },
    })
  }, 400)

  return () => clearInterval(interval)
}

// ── Hook ──────────────────────────────────────────────────────────────────
export function useVesselData() {
  const [data, setData]       = useState(null)
  const [connected, setConnected] = useState(false)
  const [source, setSource]   = useState('sim') // 'ws' | 'sim'
  const wsRef   = useRef(null)
  const stopSim = useRef(null)

  const startSim = useCallback(() => {
    setSource('sim')
    setConnected(true)
    stopSim.current = createSimulator(setData)
  }, [])

  useEffect(() => {
    // Try WebSocket first
    try {
      const ws = new WebSocket(`ws://${window.location.hostname}:8000/ws`)
      wsRef.current = ws

      const timeout = setTimeout(() => {
        if (ws.readyState !== WebSocket.OPEN) {
          ws.close()
          startSim()
        }
      }, 2000)

      ws.onopen = () => {
        clearTimeout(timeout)
        setSource('ws')
        setConnected(true)
      }
      ws.onmessage = (e) => {
        try { setData(JSON.parse(e.data)) } catch {}
      }
      ws.onerror = () => {
        clearTimeout(timeout)
        ws.close()
        startSim()
      }
      ws.onclose = () => {
        if (source === 'ws') startSim()
      }
    } catch {
      startSim()
    }

    return () => {
      wsRef.current?.close()
      stopSim.current?.()
    }
  }, []) // eslint-disable-line

  return { data, connected, source }
}

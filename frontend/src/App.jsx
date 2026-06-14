import React, { useState, useEffect, useRef } from 'react'
import MapView       from './components/MapView'
import SensorPanel   from './components/SensorPanel'
import QCFlags       from './components/QCFlags'
import SurveyLineList from './components/SurveyLineList'
import RightPanel    from './components/RightPanel'
import { useVesselData } from './hooks/useVesselData'
import { calcXTE } from './utils/geo'

const MAX_TRACK = 2000

export default function App() {
  const { data, connected, source } = useVesselData()
  const [track,     setTrack]     = useState([])
  const [recording, setRecording] = useState(true)
  const [follow,    setFollow]    = useState(true)
  const [utc,       setUtc]       = useState('')

  // UTC clock
  useEffect(() => {
    const id = setInterval(() => {
      const n = new Date()
      setUtc(`${String(n.getUTCHours()).padStart(2,'0')}:${String(n.getUTCMinutes()).padStart(2,'0')}:${String(n.getUTCSeconds()).padStart(2,'0')} UTC`)
    }, 1000)
    return () => clearInterval(id)
  }, [])

  // Record track
  useEffect(() => {
    if (!data || !recording) return
    const { nav, sonar } = data
    setTrack(t => {
      const next = [...t, { lat: nav.lat, lon: nav.lon, sog: nav.sog, depth: sonar.depth, ts: data.ts }]
      return next.length > MAX_TRACK ? next.slice(-MAX_TRACK) : next
    })
  }, [data, recording])

  // XTE
  let xte = 0
  if (data?.survey) {
    const ln = data.survey.lines?.[data.survey.active_line]
    if (ln) {
      xte = calcXTE(data.nav.lat, data.nav.lon, ln.start.lat, ln.start.lon, ln.end.lat, ln.end.lon)
    }
  }

  // Export CSV
  function exportCSV() {
    if (!track.length) return
    let csv = 'timestamp,latitude,longitude,sog_kn,depth_m\n'
    track.forEach(p => { csv += `${p.ts},${p.lat.toFixed(6)},${p.lon.toFixed(6)},${p.sog.toFixed(2)},${p.depth.toFixed(1)}\n` })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
    a.download = `vessel_track_${new Date().toISOString().slice(0,10)}.csv`
    a.click()
  }

  const dotStyle = (ok, blink=true) => ({
    width: 8, height: 8, borderRadius: '50%',
    background: ok ? 'var(--good)' : 'var(--text-dim)',
    boxShadow: ok ? '0 0 6px var(--good)' : 'none',
    animation: ok && blink ? 'blink 1.4s ease-in-out infinite' : 'none',
  })

  const btnStyle = (active) => ({
    background: active ? 'rgba(0,229,255,0.08)' : 'transparent',
    border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
    color: active ? 'var(--accent)' : 'var(--text-dim)',
    fontFamily: 'var(--font-ui)',
    fontSize: 12, letterSpacing: 1,
    padding: '5px 12px', cursor: 'pointer',
    textTransform: 'uppercase',
    transition: 'all 0.15s',
  })

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100vh', overflow:'hidden' }}>

      {/* ── HEADER ── */}
      <header style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '8px 16px',
        background: 'var(--panel)',
        borderBottom: '1px solid var(--border)',
        flexShrink: 0, zIndex: 100,
      }}>
        <div>
          <div style={{ fontFamily:'var(--font-mono)', color:'var(--accent)', fontSize:18, letterSpacing:3 }}>
            VESSELTRACK
          </div>
          <div style={{ fontFamily:'var(--font-mono)', fontSize:10, color:'var(--text-dim)', letterSpacing:2 }}>
            Real-time Survey Line Monitor
          </div>
        </div>

        <div style={{ display:'flex', gap:24, alignItems:'center' }}>
          {[
            { label:'GPS LOCK',    ok: !!data },
            { label:'SONAR',       ok: !!data },
            { label: source==='ws' ? 'WS CONNECTED' : 'SIM MODE', ok: connected, blink: source==='ws' },
            { label: recording ? 'RECORDING' : 'PAUSED',          ok: recording, blink: recording },
          ].map((s,i) => (
            <div key={i} style={{ display:'flex', alignItems:'center', gap:6, fontSize:12, letterSpacing:1, textTransform:'uppercase', color:'var(--text-dim)' }}>
              <div style={dotStyle(s.ok, s.blink ?? true)} />
              {s.label}
            </div>
          ))}
        </div>

        <div style={{ fontFamily:'var(--font-mono)', fontSize:16, color:'var(--accent)', letterSpacing:2 }}>
          {utc}
        </div>
      </header>

      {/* ── BODY ── */}
      <div style={{ flex:1, display:'flex', overflow:'hidden' }}>

        {/* Left panel */}
        <div style={{ display:'flex', flexDirection:'column', overflowY:'auto', overflowX:'hidden', width:260, flexShrink:0, background:'var(--panel)', borderRight:'1px solid var(--border)' }}>
          <SensorPanel data={data} />
          <QCFlags data={data} />
          <SurveyLineList
            lines={data?.survey?.lines}
            activeLine={data?.survey?.active_line ?? 0}
            xte={xte}
          />
        </div>

        {/* Map */}
        <div style={{ flex:1, position:'relative', overflow:'hidden' }}>
          <MapView data={data} track={track} follow={follow} />

          {/* Map controls */}
          <div style={{ position:'absolute', bottom:12, left:12, zIndex:1000, display:'flex', gap:6 }}>
            <button style={btnStyle(follow)} onClick={() => setFollow(f => !f)}>
              {follow ? '⊕ FOLLOW' : '⊕ FOLLOW'}
            </button>
            <button
              style={btnStyle(recording)}
              onClick={() => setRecording(r => !r)}
            >
              {recording ? '● REC ON' : '● REC OFF'}
            </button>
            <button style={btnStyle(false)} onClick={() => setFollow(true)}>
              RESET
            </button>
          </div>

          {/* Track count */}
          <div style={{
            position:'absolute', bottom:12, right:12, zIndex:1000,
            fontFamily:'var(--font-mono)', fontSize:11, color:'var(--text-dim)',
            background:'rgba(9,13,20,0.8)', padding:'4px 8px',
            border:'1px solid var(--border)',
          }}>
            TRACK PTS: <span style={{color:'var(--accent)'}}>{track.length}</span>
          </div>
        </div>

        {/* Right panel */}
        <RightPanel data={data} onExport={exportCSV} />
      </div>

      {/* ── FOOTER ── */}
      <footer style={{
        display:'flex', alignItems:'center', gap:20,
        padding:'5px 16px',
        background:'var(--panel)',
        borderTop:'1px solid var(--border)',
        fontFamily:'var(--font-mono)', fontSize:11,
        color:'var(--text-dim)', flexShrink:0,
      }}>
        <span>VESSEL: <span style={{color:'var(--accent)'}}>MV SURVEY-01</span></span>
        <span style={{color:'var(--dim)'}}>|</span>
        <span>PROJ: <span style={{color:'var(--accent)'}}>BATHY-2025-IDN</span></span>
        <span style={{color:'var(--dim)'}}>|</span>
        <span>ACTIVE LINE: <span style={{color:'var(--accent)'}}>
          {data?.survey?.lines?.[data?.survey?.active_line]?.name ?? '--'}
        </span></span>
        <span style={{color:'var(--dim)'}}>|</span>
        <span>XTE: <span style={{color: xte>30?'var(--danger)':xte>15?'var(--warn)':'var(--accent)'}}>
          {xte.toFixed(1)} m
        </span></span>
        <span style={{marginLeft:'auto', color:'var(--text-dim)'}}>
          SOURCE: {source === 'ws' ? '🔴 LIVE WebSocket' : '🟡 SIMULATION'}
        </span>
      </footer>
    </div>
  )
}

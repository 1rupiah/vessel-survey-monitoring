import React, { useEffect, useRef, useState } from 'react'
import { LineChart, Line, ResponsiveContainer, YAxis } from 'recharts'

// ── Sparkline ────────────────────────────────────────────────
function Spark({ data, color, label }) {
  return (
    <div style={{ padding: '8px 14px 0' }}>
      <div style={{ fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase', color: 'var(--text-dim)', marginBottom: 2 }}>
        {label}
      </div>
      <ResponsiveContainer width="100%" height={36}>
        <LineChart data={data.map((v, i) => ({ i, v }))}>
          <YAxis domain={['auto', 'auto']} hide />
          <Line
            type="monotone" dataKey="v" dot={false}
            stroke={color} strokeWidth={1.5} isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

// ── Log entry ────────────────────────────────────────────────
const typeColor = { info: 'var(--accent)', warn: 'var(--warn)', error: 'var(--danger)' }

// ── Main component ───────────────────────────────────────────
const MAX_HIST = 80
const MAX_LOG  = 80

export default function RightPanel({ data, onExport }) {
  const [depthH, setDepthH] = useState([])
  const [sogH,   setSogH]   = useState([])
  const [curH,   setCurH]   = useState([])
  const [logs,   setLogs]   = useState([
    { ts: '--:--:--', msg: 'System initialized', type: 'info' },
    { ts: '--:--:--', msg: 'GPS lock acquired — PDOP: 1.2', type: 'info' },
    { ts: '--:--:--', msg: 'Sonar online — 200kHz single-beam', type: 'info' },
    { ts: '--:--:--', msg: 'ADCP online — 300kHz WH Navigator', type: 'info' },
  ])
  const prevLine = useRef(null)
  const logCounter = useRef(0)

  useEffect(() => {
    if (!data) return
    const { nav, sonar, adcp, survey } = data

    setDepthH(h => [...h.slice(-MAX_HIST + 1), sonar.depth])
    setSogH  (h => [...h.slice(-MAX_HIST + 1), nav.sog])
    setCurH  (h => [...h.slice(-MAX_HIST + 1), adcp.current_speed])

    const now = new Date()
    const ts = `${String(now.getUTCHours()).padStart(2,'0')}:${String(now.getUTCMinutes()).padStart(2,'0')}:${String(now.getUTCSeconds()).padStart(2,'0')}`

    const newLogs = []
    logCounter.current++

    const activeLn = survey?.lines?.[survey.active_line]
    if (activeLn && prevLine.current !== survey.active_line) {
      if (prevLine.current !== null) newLogs.push({ ts, msg: `Line ${survey.lines[prevLine.current]?.name} completed ✓`, type: 'info' })
      newLogs.push({ ts, msg: `Starting line ${activeLn.name}`, type: 'info' })
      prevLine.current = survey.active_line
    }
    if (sonar.depth < 20 && logCounter.current % 25 === 0)
      newLogs.push({ ts, msg: `WARN: Shallow water ${sonar.depth.toFixed(1)}m`, type: 'warn' })
    if (logCounter.current % 60 === 0)
      newLogs.push({ ts, msg: `Depth: ${sonar.depth.toFixed(1)}m — SOG: ${nav.sog.toFixed(1)}kn`, type: 'info' })

    if (newLogs.length > 0)
      setLogs(l => [...newLogs.reverse(), ...l].slice(0, MAX_LOG))
  }, [data])

  return (
    <div style={{
      width: 220, flexShrink: 0,
      background: 'var(--panel)',
      borderLeft: '1px solid var(--border)',
      display: 'flex', flexDirection: 'column',
      overflow: 'hidden',
    }}>
      <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)', fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--text-dim)' }}>
        <span style={{ display:'inline-block', width:3, height:10, background:'var(--accent)', marginRight:6 }} />
        History
      </div>

      <Spark data={depthH} color="#00e5ff" label="Depth (m)" />
      <Spark data={sogH}   color="#00e676" label="SOG (kn)" />
      <Spark data={curH}   color="#ffb300" label="Cur. Speed (m/s)" />

      <div style={{ padding: '8px 14px', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', marginTop: 8, fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--text-dim)' }}>
        <span style={{ display:'inline-block', width:3, height:10, background:'var(--accent)', marginRight:6 }} />
        Event Log
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '4px 0' }}>
        {logs.map((l, i) => (
          <div key={i} style={{
            display: 'flex', gap: 6, padding: '3px 14px',
            fontSize: 11, lineHeight: 1.4,
            borderLeft: `2px solid ${typeColor[l.type] ?? 'var(--accent)'}`,
            marginLeft: 0,
            background: l.type === 'warn' ? 'rgba(255,179,0,0.04)' : l.type === 'error' ? 'rgba(255,61,87,0.04)' : 'transparent',
          }}>
            <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-dim)', flexShrink: 0 }}>{l.ts}</span>
            <span style={{ color: 'var(--text)' }}>{l.msg}</span>
          </div>
        ))}
      </div>

      <button onClick={onExport} style={{
        margin: '10px 14px',
        background: 'transparent',
        border: '1px solid var(--border)',
        color: 'var(--text-dim)',
        fontFamily: 'var(--font-ui)',
        fontSize: 12,
        letterSpacing: 1,
        padding: '7px',
        cursor: 'pointer',
        textTransform: 'uppercase',
        transition: 'all 0.2s',
      }}
        onMouseEnter={e => { e.target.style.borderColor='var(--good)'; e.target.style.color='var(--good)' }}
        onMouseLeave={e => { e.target.style.borderColor='var(--border)'; e.target.style.color='var(--text-dim)' }}
      >
        ⬇ Export Track CSV
      </button>
    </div>
  )
}

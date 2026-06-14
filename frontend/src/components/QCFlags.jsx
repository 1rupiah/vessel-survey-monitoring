import React from 'react'

function badge(pass) {
  return {
    fontFamily: 'var(--font-mono)',
    fontSize: 10,
    letterSpacing: 1,
    padding: '2px 7px',
    borderRadius: 2,
    background: pass ? 'rgba(0,230,118,0.12)' : 'rgba(255,61,87,0.12)',
    color: pass ? 'var(--good)' : 'var(--danger)',
    border: `1px solid ${pass ? 'rgba(0,230,118,0.3)' : 'rgba(255,61,87,0.3)'}`,
  }
}

export default function QCFlags({ data }) {
  if (!data) return null
  const { nav, sonar, adcp } = data

  const flags = [
    { name: 'GPS Position',   pass: true },
    { name: 'Sonar Depth',    pass: sonar.depth > 2 && sonar.depth < 500 },
    { name: 'ADCP Velocity',  pass: adcp.current_speed < 3.0 },
    { name: 'Gyro Heading',   pass: true },
    { name: 'SOG Range',      pass: nav.sog < 8 },
    { name: 'Bottom Track',   pass: adcp.bottom_track === 'GOOD' },
  ]

  return (
    <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)' }}>
      <div style={{
        fontSize: 11, letterSpacing: 2, textTransform: 'uppercase',
        color: 'var(--text-dim)', marginBottom: 10,
        display: 'flex', alignItems: 'center', gap: 6,
      }}>
        <span style={{ display:'inline-block', width:3, height:10, background:'var(--accent)', flexShrink:0 }} />
        QC Flags
      </div>
      {flags.map((f, i) => (
        <div key={i} style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '5px 0',
          borderBottom: i < flags.length - 1 ? '1px solid var(--border)' : 'none',
          fontSize: 12,
        }}>
          <span style={{ color: 'var(--text)' }}>{f.name}</span>
          <span style={badge(f.pass)}>{f.pass ? 'PASS' : 'FAIL'}</span>
        </div>
      ))}
    </div>
  )
}

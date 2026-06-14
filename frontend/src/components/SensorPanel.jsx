import React from 'react'
import { toDMS } from '../utils/geo'

const styles = {
  panel: {
    background: 'var(--panel)',
    borderRight: '1px solid var(--border)',
    display: 'flex',
    flexDirection: 'column',
    overflowY: 'auto',
    width: 260,
    flexShrink: 0,
  },
  section: {
    borderBottom: '1px solid var(--border)',
    padding: '12px 14px',
  },
  title: {
    fontSize: 11,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: 'var(--text-dim)',
    marginBottom: 10,
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  },
  titleBar: {
    display: 'inline-block',
    width: 3, height: 10,
    background: 'var(--accent)',
    flexShrink: 0,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 8,
  },
  card: {
    background: 'var(--bg)',
    border: '1px solid var(--border)',
    borderRadius: 4,
    padding: '8px 10px',
    position: 'relative',
    overflow: 'hidden',
  },
  cardAccent: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    height: 2,
    background: 'var(--accent)',
    opacity: 0.4,
  },
  label: {
    fontSize: 10,
    letterSpacing: 1,
    color: 'var(--text-dim)',
    textTransform: 'uppercase',
  },
  value: {
    fontFamily: 'var(--font-mono)',
    fontSize: 18,
    color: 'var(--accent)',
    lineHeight: 1.2,
    marginTop: 2,
  },
  unit: {
    fontSize: 10,
    color: 'var(--text-dim)',
  },
}

function Card({ label, value, unit, accent, warn, danger }) {
  const accentColor = danger ? 'var(--danger)' : warn ? 'var(--warn)' : accent || 'var(--accent)'
  const barColor = danger ? 'var(--danger)' : warn ? 'var(--warn)' : 'var(--accent)'
  return (
    <div style={styles.card}>
      <div style={{ ...styles.cardAccent, background: barColor, opacity: (warn || danger) ? 1 : 0.4 }} />
      <div style={styles.label}>{label}</div>
      <div style={{ ...styles.value, color: accentColor }}>{value ?? '--'}</div>
      <div style={styles.unit}>{unit}</div>
    </div>
  )
}

export default function SensorPanel({ data }) {
  if (!data) return <div style={styles.panel} />

  const { nav, sonar, adcp } = data

  return (
    <div style={styles.panel}>
      {/* Navigation */}
      <div style={styles.section}>
        <div style={styles.title}><span style={styles.titleBar} /> Navigation</div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-dim)', marginBottom: 8 }}>
          {toDMS(nav.lat, true)}<br />
          {toDMS(nav.lon, false)}
        </div>
        <div style={styles.grid}>
          <Card label="Lat"     value={nav.lat.toFixed(5)+'°'}  unit="WGS-84" />
          <Card label="Lon"     value={nav.lon.toFixed(5)+'°'}  unit="WGS-84" />
          <Card label="SOG"     value={nav.sog.toFixed(1)}       unit="knots"
            warn={nav.sog > 7} />
          <Card label="COG"     value={String(Math.round(nav.cog) % 360).padStart(3,'0')+'°'} unit="True" />
          <Card label="Heading" value={String(Math.round(nav.hdg) % 360).padStart(3,'0')+'°'} unit="Gyro" />
          <Card label="Depth"   value={sonar.depth.toFixed(1)}   unit="m (sonar)"
            warn={sonar.depth < 20} danger={sonar.depth < 10} />
        </div>
      </div>

      {/* ADCP */}
      <div style={styles.section}>
        <div style={styles.title}><span style={styles.titleBar} /> ADCP / Water Column</div>
        <div style={styles.grid}>
          <Card label="Cur. Speed" value={adcp.current_speed.toFixed(2)} unit="m/s"
            warn={adcp.current_speed > 2} />
          <Card label="Cur. Dir."  value={String(Math.round(adcp.current_dir)).padStart(3,'0')+'°'} unit="True" />
          <Card label="Bottom Trk" value={adcp.bottom_track} unit="mode"
            warn={adcp.bottom_track !== 'GOOD'} />
          <Card label="Backscatter" value={adcp.backscatter.toFixed(1)} unit="dB" />
        </div>
      </div>
    </div>
  )
}

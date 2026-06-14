import React from 'react'

export default function SurveyLineList({ lines = [], activeLine = 0, xte = 0 }) {
  return (
    <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)' }}>
      <div style={{
        fontSize: 11, letterSpacing: 2, textTransform: 'uppercase',
        color: 'var(--text-dim)', marginBottom: 10,
        display: 'flex', alignItems: 'center', gap: 6,
      }}>
        <span style={{ display:'inline-block', width:3, height:10, background:'var(--accent)', flexShrink:0 }} />
        Survey Lines
      </div>

      {/* XTE indicator */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: 10, padding: '6px 8px',
        background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 3,
      }}>
        <span style={{ fontSize: 11, color: 'var(--text-dim)', letterSpacing: 1 }}>XTE</span>
        <span style={{
          fontFamily: 'var(--font-mono)', fontSize: 14,
          color: xte > 30 ? 'var(--danger)' : xte > 15 ? 'var(--warn)' : 'var(--good)',
        }}>
          {xte.toFixed(1)} m
        </span>
      </div>

      {lines.map((ln, i) => {
        const pct = Math.min(100, Math.max(0, ln.pct ?? 0))
        const isActive = i === activeLine
        const isDone   = pct >= 99.9

        return (
          <div key={ln.id ?? i} style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '6px 0',
            borderBottom: i < lines.length - 1 ? '1px solid var(--border)' : 'none',
            animation: isActive ? 'fadeIn 0.3s ease' : undefined,
          }}>
            <span style={{
              fontFamily: 'var(--font-mono)', fontSize: 11,
              color: 'var(--text-dim)', width: 24,
            }}>{String(i + 1).padStart(2, '0')}</span>

            <span style={{
              flex: 1, fontSize: 12,
              color: isActive ? 'var(--accent)' : isDone ? 'var(--good)' : 'var(--text)',
              fontWeight: isActive ? 600 : 400,
            }}>
              {ln.name}
            </span>

            <div style={{
              width: 48, height: 4,
              background: 'var(--dim)', borderRadius: 2, overflow: 'hidden',
            }}>
              <div style={{
                width: `${pct}%`, height: '100%', borderRadius: 2,
                background: isDone ? 'var(--good)' : isActive ? 'var(--accent)' : 'var(--dim)',
                transition: 'width 0.5s',
              }} />
            </div>

            <span style={{
              fontFamily: 'var(--font-mono)', fontSize: 10,
              color: isActive ? 'var(--accent)' : isDone ? 'var(--good)' : 'var(--text-dim)',
              width: 32, textAlign: 'right',
            }}>
              {Math.round(pct)}%
            </span>
          </div>
        )
      })}
    </div>
  )
}

import { useEffect, useMemo, useState } from 'react'
import Header from '../components/Header.jsx'
import BottomNav from '../components/BottomNav.jsx'
import { MONTHS } from '../lib/dates.js'
import { getPlayers, getAttendanceForMonth, getFeesForMonth } from '../lib/db.js'
import { buildAttendancePdf, shareOrDownloadPdf } from '../lib/pdf.js'

export default function Reports() {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())
  const [players, setPlayers] = useState([])
  const [attendance, setAttendance] = useState([])
  const [fees, setFees] = useState([])

  useEffect(() => {
    let active = true
    Promise.all([
      getPlayers(),
      getAttendanceForMonth(year, month),
      getFeesForMonth(year, month),
    ]).then(([p, a, f]) => {
      if (!active) return
      setPlayers(p)
      setAttendance(a)
      setFees(f)
    })
    return () => { active = false }
  }, [year, month])

  const sessionDates = useMemo(
    () => [...new Set(attendance.map((a) => a.date))],
    [attendance]
  )

  const perPlayer = useMemo(() => {
    return players.map((p) => {
      const recs = attendance.filter((a) => a.player_id === p.id)
      const present = recs.filter((a) => a.status === 'present').length
      const total = sessionDates.length
      const pct = total ? Math.round((present / total) * 100) : 0
      return { ...p, present, total, pct }
    })
  }, [players, attendance, sessionDates])

  const totalMoney = useMemo(
    () => fees.reduce((s, f) => s + Number(f.amount), 0),
    [fees]
  )

  const avgAttendance = useMemo(() => {
    if (perPlayer.length === 0) return 0
    return Math.round(perPlayer.reduce((s, p) => s + p.pct, 0) / perPlayer.length)
  }, [perPlayer])

  const [sharing, setSharing] = useState(false)

  function changeMonth(delta) {
    let m = month + delta
    let y = year
    if (m < 0) { m = 11; y -= 1 }
    if (m > 11) { m = 0; y += 1 }
    setMonth(m)
    setYear(y)
  }

  async function handleSharePdf() {
    if (perPlayer.length === 0) {
      alert('No attendance data for this month to share.')
      return
    }
    setSharing(true)
    try {
      const doc = buildAttendancePdf({
        year,
        month,
        perPlayer,
        sessions: sessionDates.length,
        avgAttendance,
        totalMoney,
      })
      const filename = `RudraFC-Attendance-${MONTHS[month]}-${year}.pdf`
      await shareOrDownloadPdf(doc, filename)
    } catch (e) {
      alert('Could not create the PDF: ' + e.message)
    } finally {
      setSharing(false)
    }
  }

  return (
    <>
      <Header title="Reports" />
      <div className="content">
        <div className="calendar-title" style={{ padding: 0, marginBottom: 12 }}>
          <button className="btn btn-grey" style={{ padding: '4px 12px' }} onClick={() => changeMonth(-1)}>‹</button>
          <span>{MONTHS[month]} {year}</span>
          <button className="btn btn-grey" style={{ padding: '4px 12px' }} onClick={() => changeMonth(1)}>›</button>
        </div>

        <button
          className="btn btn-green btn-block"
          style={{ marginBottom: 14 }}
          onClick={handleSharePdf}
          disabled={sharing}
        >
          {sharing ? 'Preparing…' : '📄 Share Attendance Report (PDF)'}
        </button>

        <div className="stat-cards">
          <div className="stat">
            <div className="num">{sessionDates.length}</div>
            <div className="lbl">Sessions</div>
          </div>
          <div className="stat">
            <div className="num">{players.length}</div>
            <div className="lbl">Players</div>
          </div>
          <div className="stat">
            <div className="num">{avgAttendance}%</div>
            <div className="lbl">Avg Attendance</div>
          </div>
          <div className="stat">
            <div className="num">₹{totalMoney}</div>
            <div className="lbl">Collected</div>
          </div>
        </div>

        <div className="section-title">Player Attendance</div>
        {perPlayer.length === 0 ? (
          <div className="empty-state">No data for this month.</div>
        ) : (
          perPlayer.map((p) => (
            <div className="report-row" key={p.id}>
              <div style={{ flex: '0 0 40%', minWidth: 0 }}>
                <div style={{ fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                <div style={{ color: '#888', fontSize: 12 }}>{p.present}/{p.total} present</div>
              </div>
              <div className="bar"><span style={{ width: `${p.pct}%` }} /></div>
              <div className="pct">{p.pct}%</div>
            </div>
          ))
        )}
      </div>
      <BottomNav />
    </>
  )
}

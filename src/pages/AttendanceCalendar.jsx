import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../components/Header.jsx'
import BottomNav from '../components/BottomNav.jsx'
import { MONTHS, WEEKDAYS, buildMonthGrid, ymd, todayYMD } from '../lib/dates.js'
import { getAttendanceForMonth, getPlayers } from '../lib/db.js'

export default function AttendanceCalendar() {
  const navigate = useNavigate()
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())
  const [attendance, setAttendance] = useState([])
  const [totalPlayers, setTotalPlayers] = useState(0)
  const today = todayYMD()

  useEffect(() => {
    let active = true
    Promise.all([getAttendanceForMonth(year, month), getPlayers()]).then(([att, players]) => {
      if (!active) return
      setAttendance(att)
      setTotalPlayers(players.length)
    })
    return () => {
      active = false
    }
  }, [year, month])

  // Build a per-day summary of present counts
  const summary = useMemo(() => {
    const map = {}
    attendance.forEach((a) => {
      if (!map[a.date]) map[a.date] = { present: 0, absent: 0 }
      if (a.status === 'present') map[a.date].present += 1
      else map[a.date].absent += 1
    })
    return map
  }, [attendance])

  const cells = buildMonthGrid(year, month)

  function changeMonth(delta) {
    let m = month + delta
    let y = year
    if (m < 0) { m = 11; y -= 1 }
    if (m > 11) { m = 0; y += 1 }
    setMonth(m)
    setYear(y)
  }

  const legend = (
    <div className="header-legend">
      <div><span className="dot red" />Absent</div>
      <div><span className="dot green" />All Present</div>
    </div>
  )

  return (
    <>
      <Header title={`${MONTHS[month].slice(0, 3)} ${year}`} right={legend} />
      <div className="content">
        <div className="toolbar">
          <span className="range">📅 {MONTHS[month]} {year}</span>
          <span className="spacer" />
          <button className="btn btn-green" onClick={() => navigate(`/attendance/${today}`)}>
            + Add Attendance
          </button>
        </div>

        <button className="btn btn-report" onClick={() => navigate('/reports')}>
          📊 Click to View Attendance Report
        </button>

        <div className="weekdays">
          {WEEKDAYS.map((w) => (
            <div key={w}>{w}</div>
          ))}
        </div>

        <div className="calendar">
          <div className="calendar-title">
            <button className="btn btn-grey" style={{ padding: '4px 12px' }} onClick={() => changeMonth(-1)}>‹</button>
            <span>{MONTHS[month]} {year}</span>
            <button className="btn btn-grey" style={{ padding: '4px 12px' }} onClick={() => changeMonth(1)}>›</button>
          </div>
          <div className="cal-grid">
            {cells.map((day, i) => {
              if (day === null) return <div key={`e${i}`} className="cal-cell empty" />
              const dateStr = ymd(year, month, day)
              const s = summary[dateStr]
              const isToday = dateStr === today
              const allPresent = s && totalPlayers > 0 && s.present === totalPlayers && s.absent === 0
              return (
                <div
                  key={dateStr}
                  className={`cal-cell ${isToday ? 'today' : ''}`}
                  onClick={() => navigate(`/attendance/${dateStr}`)}
                >
                  <span>{day}</span>
                  {s && (
                    <span className={`count ${allPresent ? 'full' : ''}`}>
                      {s.present} / {totalPlayers || s.present + s.absent}
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
      <BottomNav />
    </>
  )
}

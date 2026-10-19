import { useEffect, useMemo, useState } from 'react'
import Header from '../components/Header.jsx'
import BottomNav from '../components/BottomNav.jsx'
import { MONTHS, WEEKDAYS, buildMonthGrid, ymd } from '../lib/dates.js'
import { getFeesForMonth } from '../lib/db.js'

export default function MoneyCalendar() {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())
  const [fees, setFees] = useState([])

  useEffect(() => {
    let active = true
    getFeesForMonth(year, month).then((f) => {
      if (active) setFees(f)
    })
    return () => { active = false }
  }, [year, month])

  const perDay = useMemo(() => {
    const map = {}
    fees.forEach((f) => {
      map[f.date] = (map[f.date] || 0) + Number(f.amount)
    })
    return map
  }, [fees])

  const total = useMemo(
    () => fees.reduce((sum, f) => sum + Number(f.amount), 0),
    [fees]
  )

  const cells = buildMonthGrid(year, month)

  function changeMonth(delta) {
    let m = month + delta
    let y = year
    if (m < 0) { m = 11; y -= 1 }
    if (m > 11) { m = 0; y += 1 }
    setMonth(m)
    setYear(y)
  }

  return (
    <>
      <Header title="Money" />
      <div className="content">
        <div className="money-banner">
          Total Money: {total}
          <span className="spacer" style={{ flex: 1 }} />
          <span className="link">Money Report ⬇</span>
        </div>

        <div className="weekdays">
          {WEEKDAYS.map((w) => <div key={w}>{w}</div>)}
        </div>

        <div className="calendar">
          <div className="calendar-title">
            <button className="btn btn-grey" style={{ padding: '4px 12px' }} onClick={() => changeMonth(-1)}>‹</button>
            <span>{MONTHS[month]} {year}</span>
            <span style={{ fontSize: 15 }}>Total: {total}</span>
            <button className="btn btn-grey" style={{ padding: '4px 12px' }} onClick={() => changeMonth(1)}>›</button>
          </div>
          <div className="cal-grid">
            {cells.map((day, i) => {
              if (day === null) return <div key={`e${i}`} className="cal-cell empty" />
              const dateStr = ymd(year, month, day)
              const amt = perDay[dateStr]
              return (
                <div key={dateStr} className={`cal-cell ${amt ? 'has-money' : ''}`}>
                  <span>{day}</span>
                  {amt ? <span className="money">{amt}</span> : null}
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

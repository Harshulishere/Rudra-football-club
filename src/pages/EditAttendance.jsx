import { useEffect, useMemo, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Header from '../components/Header.jsx'
import { prettyDate } from '../lib/dates.js'
import {
  getPlayers,
  getAttendanceForDate,
  saveAttendance,
  getFeesForMonth,
  setFee,
} from '../lib/db.js'

export default function EditAttendance() {
  const { date } = useParams()
  const navigate = useNavigate()
  const [players, setPlayers] = useState([])
  const [state, setState] = useState({}) // playerId -> { status, remarks }
  const [money, setMoney] = useState({}) // playerId -> amount
  const [search, setSearch] = useState('')
  const [saving, setSaving] = useState(false)
  const [modal, setModal] = useState(null) // { type, playerId }
  const [modalValue, setModalValue] = useState('')

  useEffect(() => {
    const [y, m] = date.split('-').map(Number)
    Promise.all([
      getPlayers(),
      getAttendanceForDate(date),
      getFeesForMonth(y, m - 1),
    ]).then(([pl, att, fees]) => {
      setPlayers(pl)
      const st = {}
      pl.forEach((p) => {
        const rec = att.find((a) => a.player_id === p.id)
        st[p.id] = {
          status: rec ? rec.status : 'present',
          remarks: rec ? rec.remarks || '' : '',
        }
      })
      setState(st)
      const mon = {}
      fees.filter((f) => f.date === date).forEach((f) => {
        mon[f.player_id] = f.amount
      })
      setMoney(mon)
    })
  }, [date])

  const filtered = useMemo(
    () => players.filter((p) => p.name.toLowerCase().includes(search.toLowerCase())),
    [players, search]
  )

  function toggle(playerId) {
    setState((prev) => ({
      ...prev,
      [playerId]: {
        ...prev[playerId],
        status: prev[playerId].status === 'present' ? 'absent' : 'present',
      },
    }))
  }

  function setAll(status) {
    setState((prev) => {
      const next = { ...prev }
      players.forEach((p) => {
        next[p.id] = { ...next[p.id], status }
      })
      return next
    })
  }

  function openModal(type, playerId) {
    setModal({ type, playerId })
    if (type === 'money') setModalValue(String(money[playerId] || ''))
    else setModalValue(state[playerId]?.remarks || '')
  }

  function saveModal() {
    const { type, playerId } = modal
    if (type === 'money') {
      const amt = Number(modalValue) || 0
      setMoney((prev) => ({ ...prev, [playerId]: amt }))
    } else {
      setState((prev) => ({
        ...prev,
        [playerId]: { ...prev[playerId], remarks: modalValue },
      }))
    }
    setModal(null)
  }

  async function handleSave() {
    setSaving(true)
    try {
      const records = players.map((p) => ({
        player_id: p.id,
        status: state[p.id]?.status || 'present',
        remarks: state[p.id]?.remarks || '',
      }))
      await saveAttendance(date, records)
      // persist money per player for this date
      await Promise.all(
        players.map((p) => setFee(p.id, date, Number(money[p.id]) || 0))
      )
      navigate('/attendance')
    } catch (e) {
      alert('Failed to save: ' + e.message)
    } finally {
      setSaving(false)
    }
  }

  const subheader = (
    <div className="subheader">
      <div className="tab">Edit Attendance</div>
      <div className="tab date">{prettyDate(date)}</div>
    </div>
  )

  return (
    <>
      <Header title="Rudra FC" right={<span className="icon-btn">ⓘ</span>} />
      {subheader}
      <div className="content">
        <input
          className="search"
          placeholder="🔍 Search Players"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="bulk-row">
          <label>
            <input
              type="checkbox"
              onChange={(e) => e.target.checked && setAll('present')}
            />
            All Present
          </label>
          <label>
            <input
              type="checkbox"
              onChange={(e) => e.target.checked && setAll('absent')}
            />
            All Absent
          </label>
        </div>

        {filtered.length === 0 && (
          <div className="empty-state">No players yet. Add players first.</div>
        )}

        {filtered.map((p) => {
          const st = state[p.id] || { status: 'present' }
          const initials = p.name.split(' ').map((n) => n[0]).slice(0, 2).join('')
          return (
            <div className="player-card" key={p.id}>
              {p.photo_url ? (
                <img className="pic" src={p.photo_url} alt={p.name} />
              ) : (
                <div className="pic">{initials}</div>
              )}
              <div className="info">
                <div className="name">{p.name}</div>
                <div className="meta">{p.gender} | REG: {p.reg_no}</div>
                {st.remarks ? <div className="meta">📝 {st.remarks}</div> : null}
                {money[p.id] ? <div className="meta">₹ {money[p.id]}</div> : null}
              </div>
              <div className="mini-actions">
                <button className="chip" onClick={() => openModal('money', p.id)}>Edit Money</button>
                <button className="chip" onClick={() => openModal('remarks', p.id)}>Edit Remarks</button>
              </div>
              <button
                className={`status-toggle ${st.status}`}
                onClick={() => toggle(p.id)}
              >
                <span className="big">{st.status === 'present' ? 'P' : 'A'}</span>
                <span className="small">{st.status === 'present' ? 'Present' : 'Absent'}</span>
              </button>
            </div>
          )
        })}

        <div className="save-bar">
          <button className="btn btn-green btn-block" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : '💾 Save'}
          </button>
        </div>
      </div>

      {modal && (
        <div className="modal-backdrop" onClick={() => setModal(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>{modal.type === 'money' ? 'Edit Money' : 'Edit Remarks'}</h3>
            <div className="field">
              {modal.type === 'money' ? (
                <input
                  type="number"
                  value={modalValue}
                  onChange={(e) => setModalValue(e.target.value)}
                  placeholder="Amount"
                  autoFocus
                />
              ) : (
                <textarea
                  rows={3}
                  value={modalValue}
                  onChange={(e) => setModalValue(e.target.value)}
                  placeholder="Remarks"
                  autoFocus
                />
              )}
            </div>
            <div className="modal-actions">
              <button className="btn btn-grey btn-block" onClick={() => setModal(null)}>Cancel</button>
              <button className="btn btn-green btn-block" onClick={saveModal}>Save</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

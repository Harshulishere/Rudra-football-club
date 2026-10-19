import { useEffect, useState } from 'react'
import Header from '../components/Header.jsx'
import BottomNav from '../components/BottomNav.jsx'
import { getPlayers, addPlayer, updatePlayer, deletePlayer } from '../lib/db.js'

const empty = { name: '', gender: 'male', reg_no: '', photo_url: '' }

export default function Players() {
  const [players, setPlayers] = useState([])
  const [modal, setModal] = useState(null) // null | { ...player, id? }
  const [form, setForm] = useState(empty)
  const [loading, setLoading] = useState(true)

  async function load() {
    setLoading(true)
    const p = await getPlayers()
    setPlayers(p)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  function openAdd() {
    setForm(empty)
    setModal({ mode: 'add' })
  }

  function openEdit(p) {
    setForm({ name: p.name, gender: p.gender, reg_no: p.reg_no, photo_url: p.photo_url || '' })
    setModal({ mode: 'edit', id: p.id })
  }

  async function save() {
    if (!form.name.trim()) {
      alert('Name is required')
      return
    }
    if (modal.mode === 'add') {
      await addPlayer({ ...form })
    } else {
      await updatePlayer(modal.id, { ...form })
    }
    setModal(null)
    load()
  }

  async function remove(p) {
    if (!confirm(`Remove ${p.name}? This also deletes their attendance records.`)) return
    await deletePlayer(p.id)
    load()
  }

  const addBtn = (
    <button className="icon-btn" onClick={openAdd} aria-label="Add player">＋</button>
  )

  return (
    <>
      <Header title="Players" right={addBtn} />
      <div className="content">
        <button className="btn btn-green btn-block" style={{ marginBottom: 14 }} onClick={openAdd}>
          ＋ Add Player
        </button>

        {loading ? (
          <div className="empty-state">Loading…</div>
        ) : players.length === 0 ? (
          <div className="empty-state">No players yet. Add your first player.</div>
        ) : (
          players.map((p) => {
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
                </div>
                <div className="mini-actions">
                  <button className="chip" onClick={() => openEdit(p)}>Edit</button>
                  <button className="chip" style={{ background: 'var(--red)' }} onClick={() => remove(p)}>Delete</button>
                </div>
              </div>
            )
          })
        )}
      </div>

      {modal && (
        <div className="modal-backdrop" onClick={() => setModal(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>{modal.mode === 'add' ? 'Add Player' : 'Edit Player'}</h3>
            <div className="field">
              <label>Name</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} autoFocus />
            </div>
            <div className="field">
              <label>Gender</label>
              <select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}>
                <option value="male">male</option>
                <option value="female">female</option>
                <option value="other">other</option>
              </select>
            </div>
            <div className="field">
              <label>Registration No.</label>
              <input value={form.reg_no} onChange={(e) => setForm({ ...form, reg_no: e.target.value })} />
            </div>
            <div className="field">
              <label>Photo URL (optional)</label>
              <input value={form.photo_url} onChange={(e) => setForm({ ...form, photo_url: e.target.value })} placeholder="https://…" />
            </div>
            <div className="modal-actions">
              <button className="btn btn-grey btn-block" onClick={() => setModal(null)}>Cancel</button>
              <button className="btn btn-green btn-block" onClick={save}>Save</button>
            </div>
          </div>
        </div>
      )}
      <BottomNav />
    </>
  )
}

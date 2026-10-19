import { supabase, isSupabaseConfigured } from './supabase'

/*
 * Data access layer for Rudra FC.
 *
 * Tables (Supabase):
 *   players      -> id, name, gender, reg_no, photo_url, created_at
 *   attendance   -> id, player_id, date (YYYY-MM-DD), status ('present'|'absent'), remarks
 *   fees         -> id, player_id, date (YYYY-MM-DD), amount
 *
 * If Supabase is not configured, everything is stored in localStorage so the
 * app is fully usable as a demo.
 */

const LS_KEY = 'rudra_fc_data_v1'

function readLocal() {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (raw) return JSON.parse(raw)
  } catch (e) {
    console.warn('local read failed', e)
  }
  return { players: [], attendance: [], fees: [] }
}

function writeLocal(data) {
  localStorage.setItem(LS_KEY, JSON.stringify(data))
}

function seedIfEmpty() {
  const data = readLocal()
  if (data.players.length === 0) {
    data.players = [
      { id: crypto.randomUUID(), name: 'Arham Maheshwari', gender: 'male', reg_no: '01', photo_url: '', created_at: new Date().toISOString() },
      { id: crypto.randomUUID(), name: 'Vakshal Maheshwari', gender: 'male', reg_no: '02', photo_url: '', created_at: new Date().toISOString() },
      { id: crypto.randomUUID(), name: 'Dhyan Thackar', gender: 'male', reg_no: '03', photo_url: '', created_at: new Date().toISOString() },
      { id: crypto.randomUUID(), name: 'Aatish Sharma', gender: 'male', reg_no: '04', photo_url: '', created_at: new Date().toISOString() },
      { id: crypto.randomUUID(), name: 'Kahan Ashani', gender: 'male', reg_no: '05', photo_url: '', created_at: new Date().toISOString() },
      { id: crypto.randomUUID(), name: 'Meet Sawnani Paresh', gender: 'male', reg_no: '06', photo_url: '', created_at: new Date().toISOString() },
    ]
    writeLocal(data)
  }
}

if (!isSupabaseConfigured) seedIfEmpty()

// ---------- Players ----------

export async function getPlayers() {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from('players')
      .select('*')
      .order('created_at', { ascending: true })
    if (error) throw error
    return data
  }
  return readLocal().players
}

export async function addPlayer(player) {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from('players')
      .insert([player])
      .select()
      .single()
    if (error) throw error
    return data
  }
  const data = readLocal()
  const rec = { id: crypto.randomUUID(), created_at: new Date().toISOString(), ...player }
  data.players.push(rec)
  writeLocal(data)
  return rec
}

export async function updatePlayer(id, patch) {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase.from('players').update(patch).eq('id', id).select().single()
    if (error) throw error
    return data
  }
  const data = readLocal()
  const p = data.players.find((x) => x.id === id)
  if (p) Object.assign(p, patch)
  writeLocal(data)
  return p
}

export async function deletePlayer(id) {
  if (isSupabaseConfigured) {
    const { error } = await supabase.from('players').delete().eq('id', id)
    if (error) throw error
    return
  }
  const data = readLocal()
  data.players = data.players.filter((x) => x.id !== id)
  data.attendance = data.attendance.filter((x) => x.player_id !== id)
  data.fees = data.fees.filter((x) => x.player_id !== id)
  writeLocal(data)
}

// ---------- Attendance ----------

export async function getAttendanceForMonth(year, month) {
  // month is 0-indexed
  const start = `${year}-${String(month + 1).padStart(2, '0')}-01`
  const endDate = new Date(year, month + 1, 0).getDate()
  const end = `${year}-${String(month + 1).padStart(2, '0')}-${String(endDate).padStart(2, '0')}`
  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from('attendance')
      .select('*')
      .gte('date', start)
      .lte('date', end)
    if (error) throw error
    return data
  }
  return readLocal().attendance.filter((a) => a.date >= start && a.date <= end)
}

export async function getAttendanceForDate(date) {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase.from('attendance').select('*').eq('date', date)
    if (error) throw error
    return data
  }
  return readLocal().attendance.filter((a) => a.date === date)
}

export async function saveAttendance(date, records) {
  // records: [{ player_id, status, remarks }]
  if (isSupabaseConfigured) {
    // remove existing for the date then insert fresh
    const { error: delErr } = await supabase.from('attendance').delete().eq('date', date)
    if (delErr) throw delErr
    const rows = records.map((r) => ({ ...r, date }))
    const { error } = await supabase.from('attendance').insert(rows)
    if (error) throw error
    return
  }
  const data = readLocal()
  data.attendance = data.attendance.filter((a) => a.date !== date)
  records.forEach((r) => {
    data.attendance.push({ id: crypto.randomUUID(), date, ...r })
  })
  writeLocal(data)
}

// ---------- Fees / Money ----------

export async function getFeesForMonth(year, month) {
  const start = `${year}-${String(month + 1).padStart(2, '0')}-01`
  const endDate = new Date(year, month + 1, 0).getDate()
  const end = `${year}-${String(month + 1).padStart(2, '0')}-${String(endDate).padStart(2, '0')}`
  if (isSupabaseConfigured) {
    const { data, error } = await supabase.from('fees').select('*').gte('date', start).lte('date', end)
    if (error) throw error
    return data
  }
  return readLocal().fees.filter((f) => f.date >= start && f.date <= end)
}

export async function setFee(playerId, date, amount) {
  if (isSupabaseConfigured) {
    // upsert one fee row per player/date
    const { error: delErr } = await supabase
      .from('fees')
      .delete()
      .eq('player_id', playerId)
      .eq('date', date)
    if (delErr) throw delErr
    if (amount > 0) {
      const { error } = await supabase.from('fees').insert([{ player_id: playerId, date, amount }])
      if (error) throw error
    }
    return
  }
  const data = readLocal()
  data.fees = data.fees.filter((f) => !(f.player_id === playerId && f.date === date))
  if (amount > 0) {
    data.fees.push({ id: crypto.randomUUID(), player_id: playerId, date, amount })
  }
  writeLocal(data)
}

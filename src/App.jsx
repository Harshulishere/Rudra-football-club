import { Routes, Route } from 'react-router-dom'
import Dashboard from './pages/Dashboard.jsx'
import AttendanceCalendar from './pages/AttendanceCalendar.jsx'
import EditAttendance from './pages/EditAttendance.jsx'
import MoneyCalendar from './pages/MoneyCalendar.jsx'
import Players from './pages/Players.jsx'
import Reports from './pages/Reports.jsx'
import Login from './pages/Login.jsx'
import { useAuth } from './lib/auth.jsx'

export default function App() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="app-shell">
        <div className="empty-state" style={{ marginTop: 80 }}>Loading…</div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="app-shell">
        <Login />
      </div>
    )
  }

  return (
    <div className="app-shell">
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/attendance" element={<AttendanceCalendar />} />
        <Route path="/attendance/:date" element={<EditAttendance />} />
        <Route path="/money" element={<MoneyCalendar />} />
        <Route path="/players" element={<Players />} />
        <Route path="/reports" element={<Reports />} />
      </Routes>
    </div>
  )
}

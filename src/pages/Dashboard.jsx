import { useNavigate } from 'react-router-dom'
import Header from '../components/Header.jsx'
import BottomNav from '../components/BottomNav.jsx'
import { isSupabaseConfigured } from '../lib/supabase.js'
import { useAuth } from '../lib/auth.jsx'

export default function Dashboard() {
  const navigate = useNavigate()
  const { user, signOut } = useAuth()

  const tiles = [
    { label: 'Attendance', icon: '📘', cls: 'blue', to: '/attendance' },
    { label: 'Reports', icon: '📊', cls: 'orange', to: '/reports' },
    { label: 'Add / View\nPlayers', icon: '➕', cls: 'green', to: '/players' },
    { label: 'Money', icon: '₹', cls: 'sky', to: '/money' },
  ]

  const logoutBtn = (
    <button className="icon-btn" onClick={signOut} title="Log out" aria-label="Log out">
      ⎋
    </button>
  )

  const initial = (user?.email || 'R').charAt(0).toUpperCase()

  return (
    <>
      <Header title="Rudra FC" showBack={false} avatar={initial} right={logoutBtn} />
      <div className="content">
        {user?.email && (
          <div className="welcome-row">
            Signed in as <strong>{user.email}</strong>
          </div>
        )}
        {!isSupabaseConfigured && (
          <div className="banner-info">
            Running in demo mode (local storage). Add your Supabase keys in a
            <code> .env </code> file to sync data to the cloud.
          </div>
        )}
        <div className="grid">
          {tiles.map((t) => (
            <button key={t.label} className={`tile ${t.cls}`} onClick={() => navigate(t.to)}>
              <span className="tile-icon">{t.icon}</span>
              <span style={{ whiteSpace: 'pre-line' }}>{t.label}</span>
            </button>
          ))}
          <button className="tile pink span-2" onClick={() => navigate('/players')}>
            <span className="tile-icon">⚙️</span>
            <span>Customize Your Club</span>
          </button>
        </div>
      </div>
      <BottomNav />
    </>
  )
}

import { NavLink } from 'react-router-dom'

const items = [
  { to: '/', icon: '🏠', label: 'Home', end: true },
  { to: '/reports', icon: '📊', label: 'Reports' },
  { to: '/money', icon: '₹', label: 'Money' },
  { to: '/players', icon: '👥', label: 'Players' },
]

export default function BottomNav() {
  return (
    <nav className="bottom-nav">
      {items.map((it) => (
        <NavLink key={it.to} to={it.to} end={it.end}>
          <span className="nav-icon">{it.icon}</span>
          <span>{it.label}</span>
        </NavLink>
      ))}
    </nav>
  )
}

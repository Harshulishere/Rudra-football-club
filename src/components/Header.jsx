import { useNavigate } from 'react-router-dom'

export default function Header({ title, showBack = true, right = null, avatar = null }) {
  const navigate = useNavigate()
  return (
    <div className="header">
      {showBack ? (
        <button className="back-btn" onClick={() => navigate(-1)} aria-label="Back">
          ←
        </button>
      ) : avatar ? (
        <div className="avatar">{avatar}</div>
      ) : (
        <span style={{ width: 34 }} />
      )}
      <h1>{title}</h1>
      {right || <span style={{ width: 34 }} />}
    </div>
  )
}

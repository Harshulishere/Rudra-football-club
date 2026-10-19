import { useState } from 'react'
import { useAuth } from '../lib/auth.jsx'
import { isSupabaseConfigured } from '../lib/supabase.js'

export default function Login() {
  const { signIn, signUp } = useAuth()
  const [mode, setMode] = useState('login') // 'login' | 'signup'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(e) {
    e.preventDefault()
    setError('')
    setInfo('')
    if (!email.trim() || !password) {
      setError('Enter your email and password.')
      return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }
    setBusy(true)
    try {
      if (mode === 'login') {
        await signIn(email.trim(), password)
      } else {
        const { needsConfirmation } = await signUp(email.trim(), password)
        if (needsConfirmation) {
          setInfo('Account created. Check your email to confirm, then log in.')
          setMode('login')
        }
      }
    } catch (err) {
      setError(err.message || 'Something went wrong.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <div className="header">
        <div className="avatar">R</div>
        <h1>Rudra FC</h1>
        <span style={{ width: 34 }} />
      </div>
      <div className="content" style={{ paddingTop: 30 }}>
        <div className="auth-card">
          <h2 style={{ marginTop: 0, textAlign: 'center' }}>
            {mode === 'login' ? 'Welcome back' : 'Create your account'}
          </h2>
          <p style={{ textAlign: 'center', color: '#888', marginTop: -6 }}>
            {mode === 'login'
              ? 'Log in to manage attendance'
              : 'Sign up to join the club'}
          </p>

          {!isSupabaseConfigured && (
            <div className="banner-info">
              Demo mode: accounts are stored locally in this browser. Add Supabase
              keys for real email accounts.
            </div>
          )}

          {error && <div className="auth-error">{error}</div>}
          {info && <div className="banner-info">{info}</div>}

          <form onSubmit={submit}>
            <div className="field">
              <label>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
              />
            </div>
            <div className="field">
              <label>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              />
            </div>
            <button className="btn btn-green btn-block" type="submit" disabled={busy}>
              {busy ? 'Please wait…' : mode === 'login' ? 'Log In' : 'Sign Up'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: 16 }}>
            {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <button
              className="link-btn"
              onClick={() => {
                setMode(mode === 'login' ? 'signup' : 'login')
                setError('')
                setInfo('')
              }}
            >
              {mode === 'login' ? 'Sign up' : 'Log in'}
            </button>
          </p>
        </div>
      </div>
    </>
  )
}

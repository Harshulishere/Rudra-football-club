import { createContext, useContext, useEffect, useState } from 'react'
import { supabase, isSupabaseConfigured } from './supabase'

/*
 * Auth layer for Rudra FC.
 *
 * - With Supabase configured: real email/password auth via Supabase Auth.
 * - Without Supabase (demo mode): a lightweight local-storage account store so
 *   signup/login still works for trying the app. NOT secure — demo only.
 *
 * Attendance data is shared: every authenticated user can see and edit all
 * attendance (enforced by the RLS policies in supabase/schema.sql).
 */

const AuthContext = createContext(null)

const DEMO_USERS_KEY = 'rudra_fc_demo_users'
const DEMO_SESSION_KEY = 'rudra_fc_demo_session'

function readDemoUsers() {
  try {
    return JSON.parse(localStorage.getItem(DEMO_USERS_KEY)) || []
  } catch {
    return []
  }
}
function writeDemoUsers(users) {
  localStorage.setItem(DEMO_USERS_KEY, JSON.stringify(users))
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isSupabaseConfigured) {
      supabase.auth.getSession().then(({ data }) => {
        setUser(data.session?.user ?? null)
        setLoading(false)
      })
      const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
        setUser(session?.user ?? null)
      })
      return () => sub.subscription.unsubscribe()
    }
    // demo mode
    try {
      const saved = JSON.parse(localStorage.getItem(DEMO_SESSION_KEY))
      if (saved) setUser(saved)
    } catch {
      /* ignore */
    }
    setLoading(false)
  }, [])

  async function signUp(email, password) {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.auth.signUp({ email, password })
      if (error) throw error
      // If email confirmation is on, session will be null until confirmed.
      return {
        needsConfirmation: !data.session,
      }
    }
    // demo
    const users = readDemoUsers()
    if (users.some((u) => u.email === email)) {
      throw new Error('An account with this email already exists.')
    }
    users.push({ email, password })
    writeDemoUsers(users)
    const u = { email, id: email }
    localStorage.setItem(DEMO_SESSION_KEY, JSON.stringify(u))
    setUser(u)
    return { needsConfirmation: false }
  }

  async function signIn(email, password) {
    if (isSupabaseConfigured) {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      return
    }
    // demo
    const users = readDemoUsers()
    const match = users.find((u) => u.email === email && u.password === password)
    if (!match) throw new Error('Invalid email or password.')
    const u = { email, id: email }
    localStorage.setItem(DEMO_SESSION_KEY, JSON.stringify(u))
    setUser(u)
  }

  async function signOut() {
    if (isSupabaseConfigured) {
      await supabase.auth.signOut()
    } else {
      localStorage.removeItem(DEMO_SESSION_KEY)
      setUser(null)
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

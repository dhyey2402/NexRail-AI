import { createContext, useContext, useState, useEffect } from 'react'
import type { ReactNode } from 'react'
import { getCurrentUser } from '../services/api'
import { setToken, clearToken, getToken } from '../services/tokenStorage'

interface User {
  id: number
  email: string
  role: string
  is_active: boolean
}

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (token: string, user: User) => void
  logout: () => void
  checkAuth: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const checkAuth = async () => {
    try {
      const token = getToken()
      if (token) {
        const userData = await getCurrentUser()
        if (userData.role !== 'ADMIN') {
          throw new Error('Not an admin')
        }
        setUser(userData)
      } else {
        setUser(null)
      }
    } catch (error) {
      console.error('Failed to authenticate:', error)
      clearToken()
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    checkAuth()
  }, [])

  const login = (token: string, userData: User) => {
    setToken(token)
    setUser(userData)
  }

  const logout = () => {
    clearToken()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertCircle, ShieldCheck } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { login as apiLogin } from '../services/api'

export function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { login } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const data = await apiLogin({ email, password })
      if (data.user.role !== 'ADMIN') {
        throw new Error('Unauthorized: Admin access required')
      }
      login(data.access_token, data.user)
      navigate('/')
    } catch (err: any) {
      setError(err.message || 'Failed to login')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 p-4">
      <div className="w-full max-w-md rounded-xl border border-zinc-800 bg-zinc-900/50 p-8 shadow-xl">
        <div className="mb-8 flex flex-col items-center space-y-2 text-center">
          <div className="mb-4 flex justify-center">
            <div className="rounded-full bg-emerald-500/10 p-3">
              <ShieldCheck className="h-6 w-6 text-emerald-400" />
            </div>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100">Admin Console</h1>
          <p className="text-sm text-zinc-400">Enter your credentials to access the RailWise admin dashboard</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 rounded-lg bg-red-900/20 p-3 text-sm text-red-400 border border-red-900/50">
              <AlertCircle className="h-4 w-4" />
              <p>{error}</p>
            </div>
          )}
          
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium text-zinc-300">Email</label>
            <input
              id="email"
              type="email"
              placeholder="admin@railwise.in"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
          
          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium text-zinc-300">Password</label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
          
          <button 
            type="submit" 
            disabled={loading}
            className="w-full rounded-md bg-emerald-500 px-4 py-2 text-sm font-medium text-zinc-950 hover:bg-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 focus:ring-offset-zinc-950 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  )
}

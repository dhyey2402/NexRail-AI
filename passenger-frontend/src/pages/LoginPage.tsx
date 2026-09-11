import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Card, CardTitle, CardHint } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/AuthContext'
import { login as apiLogin } from '@/services/api'
import { Train } from 'lucide-react'

export function LoginPage() {
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
      login(data.access_token, data.user)
      navigate('/search')
    } catch (err: any) {
      setError(err.message || 'Failed to login')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-[80vh] items-center justify-center p-4">
      <Card className="w-full max-w-md bg-surface p-8 shadow-2xl shadow-black/20">
        <div className="mb-8 flex flex-col items-center justify-center text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/10">
            <Train className="h-6 w-6 text-accent" />
          </div>
          <CardTitle className="mt-4 text-2xl">Welcome Back</CardTitle>
          <CardHint>Sign in to your RailWise account</CardHint>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg bg-danger/10 p-3 text-sm text-danger">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium text-ink">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-border bg-ground px-4 py-2.5 text-ink outline-none transition-colors focus:border-accent"
              placeholder="Enter your email"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-ink">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-border bg-ground px-4 py-2.5 text-ink outline-none transition-colors focus:border-accent"
              placeholder="Enter your password"
            />
          </div>

          <Button type="submit" className="w-full py-6 text-base" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </Button>

          <p className="mt-4 text-center text-sm text-muted">
            Don't have an account?{' '}
            <Link to="/register" className="font-medium text-accent hover:underline">
              Register here
            </Link>
          </p>
        </form>
      </Card>
    </div>
  )
}

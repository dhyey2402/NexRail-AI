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
      <Card className="w-full max-w-sm bg-surface p-6">
        <div className="mb-6 flex flex-col items-center justify-center text-center">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-accent">
            <Train className="h-4 w-4 text-white" />
          </div>
          <CardTitle className="mt-3 text-lg">Sign In</CardTitle>
          <CardHint>Access your NexRail account</CardHint>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {error && (
            <div className="rounded-md bg-danger/10 border border-danger/20 p-2.5 text-[12px] text-danger">
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-[12px] font-medium text-ink">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md border border-border bg-surface-2 px-3 py-2 text-[13px] text-ink outline-none transition-colors focus:border-accent"
              placeholder="you@example.com"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[12px] font-medium text-ink">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md border border-border bg-surface-2 px-3 py-2 text-[13px] text-ink outline-none transition-colors focus:border-accent"
              placeholder="Enter your password"
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </Button>

          <p className="text-center text-[12px] text-muted">
            Don't have an account?{' '}
            <Link to="/register" className="font-medium text-accent hover:underline">
              Register
            </Link>
          </p>
        </form>
      </Card>
    </div>
  )
}

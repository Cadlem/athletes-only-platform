import { useMutation } from '@tanstack/react-query'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { LoadingPage } from '~/components/ui/loading'

export const Route = createFileRoute('/claim/$id')({
  component: ClaimPage,
  pendingComponent: LoadingPage,
})

type ClaimResponse = {
  token: string
  athlete: {
    id: string
    displayName: string
    sport: string
    claimStatus: string
    verificationStatus: string
  }
  isNewUser: boolean
  preSubscriberCount: number
  activatedCount: number
}

function ClaimPage() {
  const { id } = Route.useParams()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [error, setError] = useState('')

  const claimMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/v1/athletes/claim/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, displayName }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(body.error ?? `HTTP ${res.status}`)
      }
      return res.json() as Promise<ClaimResponse>
    },
    onSuccess: (data) => {
      // Store token for API auth (optional — cookie is also set by better-auth)
      if (data.token) {
        localStorage.setItem('auth_token', data.token)
      }
      navigate({ to: '/claim-success', state: { athlete: data.athlete, preSubscriberCount: data.preSubscriberCount } })
    },
    onError: (err: Error) => {
      setError(err.message)
    },
  })

  return (
    <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="text-3xl font-bold text-amber-400">
            Athletes Only
          </Link>
          <p className="text-gray-400 mt-2">Claim your athlete profile</p>
        </div>

        <div className="bg-gray-900 rounded-xl border border-gray-800 p-8">
          <h1 className="text-xl font-bold mb-1">Claim Your Profile</h1>
          <p className="text-gray-400 text-sm mb-6">
            Enter your email and create a password to claim this athlete profile.
          </p>

          <form
            onSubmit={(e) => {
              e.preventDefault()
              claimMutation.mutate()
            }}
            className="space-y-5"
          >
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-amber-500"
                placeholder="you@example.com"
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-amber-500"
                placeholder="Min 6 characters"
              />
            </div>

            {/* Display Name (optional) */}
            <div>
              <label htmlFor="displayName" className="block text-sm font-medium text-gray-300 mb-2">
                Display Name <span className="text-gray-500 text-xs">(optional)</span>
              </label>
              <input
                id="displayName"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-amber-500"
                placeholder="How you want to be known"
              />
            </div>

            {/* Error */}
            {error && (
              <div className="text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-lg px-4 py-3">
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={claimMutation.isPending}
              className="w-full bg-amber-500 hover:bg-amber-600 disabled:bg-amber-500/50 text-gray-900 font-semibold py-3 rounded-lg transition-colors"
            >
              {claimMutation.isPending ? 'Claiming profile...' : 'Claim Profile'}
            </button>
          </form>

          <div className="mt-6 text-center text-gray-400 text-sm">
            <Link to={`/unclaimed-profile/${id}`} className="text-gray-500 hover:text-gray-300">
              ← Back to profile
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

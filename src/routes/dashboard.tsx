import { createFileRoute, Link } from '@tanstack/react-router'
import { useSession } from '~/lib/better-auth/auth-client'
import { signOut } from '~/lib/better-auth/auth-client'

export const Route = createFileRoute('/dashboard')({
  component: DashboardPage,
})

export function DashboardPage() {
  const session = useSession()

  if (!session.data) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Please sign in to view your dashboard</h1>
          <Link
            to="/signin"
            className="text-amber-400 hover:text-amber-300"
          >
            Sign In
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link to="/" className="text-2xl font-bold text-amber-400">
              Athletes Only
            </Link>
            <nav className="hidden md:flex items-center gap-6">
              <Link to="/rosters" className="text-gray-300 hover:text-white transition-colors">
                Rosters
              </Link>
              <Link to="/live-feed" className="text-gray-300 hover:text-white transition-colors">
                Live
              </Link>
              <Link to="/deals" className="text-gray-300 hover:text-white transition-colors">
                Deals
              </Link>
              <Link to="/dashboard" className="text-amber-400 font-medium">
                Dashboard
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-400">
              {session.data.user.name || session.data.user.email}
            </span>
            <button
              onClick={() => signOut()}
              className="text-sm text-gray-300 hover:text-white transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Dashboard</h1>

        {/* User Info */}
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Profile</h2>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center text-2xl font-bold text-gray-900">
              {session.data.user.name?.charAt(0) || session.data.user.email?.charAt(0) || 'U'}
            </div>
            <div>
              <div className="font-semibold text-lg">
                {session.data.user.name || 'User'}
              </div>
              <div className="text-gray-400">{session.data.user.email}</div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link
            to="/rosters"
            className="bg-gray-900 rounded-xl border border-gray-800 p-6 hover:border-amber-500/50 transition-colors"
          >
            <div className="text-3xl mb-3">👥</div>
            <h3 className="font-semibold text-lg mb-2">Browse Athletes</h3>
            <p className="text-gray-400 text-sm">Discover and follow your favorite athletes</p>
          </Link>
          
          <Link
            to="/deals"
            className="bg-gray-900 rounded-xl border border-gray-800 p-6 hover:border-amber-500/50 transition-colors"
          >
            <div className="text-3xl mb-3">🎁</div>
            <h3 className="font-semibold text-lg mb-2">Request Deals</h3>
            <p className="text-gray-400 text-sm">Get personalized content from athletes</p>
          </Link>
          
          <Link
            to="/live-feed"
            className="bg-gray-900 rounded-xl border border-gray-800 p-6 hover:border-amber-500/50 transition-colors"
          >
            <div className="text-3xl mb-3">🎬</div>
            <h3 className="font-semibold text-lg mb-2">Watch Live</h3>
            <p className="text-gray-400 text-sm">Stream live sessions from athletes</p>
          </Link>
        </div>
      </div>
    </div>
  )
}

import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useSession, signOut } from '~/lib/better-auth/auth-client'
import { sampleVideos } from '~/lib/videos'
import { LoadingPage } from '~/components/ui/loading'

export const Route = createFileRoute('/')({
  component: LandingPage,
  pendingComponent: LoadingPage,
})

export function LandingPage() {
  const session = useSession()
  const liveVideos = sampleVideos.filter(v => v.status === 'live')

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link to="/" className="text-3xl font-bold text-amber-400 font-script">
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
            </nav>
          </div>
          <div className="flex items-center gap-4">
            {session.data ? (
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
            ) : (
              <>
                <Link
                  to="/signin"
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/signup"
                  className="bg-amber-500 hover:bg-amber-600 text-gray-900 font-semibold px-4 py-2 rounded-lg transition-colors"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-amber-500/10 to-transparent" />
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              Connect with{' '}
              <span className="text-amber-400">Elite Athletes</span>
            </h1>
            <p className="text-xl text-gray-400 mb-8">
              Get exclusive access to your favorite college athletes. Watch live sessions,
              request personalized deals, and follow their journey.
            </p>
            <div className="flex items-center justify-center gap-4">
              <Link
                to="/signup"
                className="bg-amber-500 hover:bg-amber-600 text-gray-900 font-semibold px-8 py-3 rounded-lg transition-colors text-lg"
              >
                Join Now
              </Link>
              <Link
                to="/rosters"
                className="border border-gray-700 hover:border-gray-600 text-white font-semibold px-8 py-3 rounded-lg transition-colors text-lg"
              >
                Browse Athletes
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Live Now Section */}
      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
              <h2 className="text-3xl font-bold">Live Now</h2>
            </div>
            <Link
              to="/live-feed"
              className="text-amber-400 hover:text-amber-300 transition-colors"
            >
              View All →
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {liveVideos.slice(0, 3).map((video) => (
              <Link
                key={video.id}
                to={`/live-feed?video=${video.id}`}
                className="group block bg-gray-900 rounded-xl overflow-hidden border border-gray-800 hover:border-amber-500/50 transition-all"
              >
                <div className="aspect-video bg-gray-800 relative">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-16 h-16 bg-amber-500/20 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                      <div className="w-12 h-12 bg-amber-500 rounded-full flex items-center justify-center">
                        <svg className="w-6 h-6 text-gray-900 ml-1" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                  <div className="absolute top-3 left-3 bg-red-500 text-white text-xs font-semibold px-2 py-1 rounded">
                    LIVE
                  </div>
                  <div className="absolute bottom-3 right-3 bg-black/70 text-white text-sm px-2 py-1 rounded">
                    {video.viewerCount.toLocaleString()} watching
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-lg mb-1 group-hover:text-amber-400 transition-colors">
                    {video.title}
                  </h3>
                  <p className="text-gray-400 text-sm">{video.athlete}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Athletes Section */}
      <section className="py-16 px-4 bg-gray-900/50">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold">Featured Athletes</h2>
            <Link
              to="/rosters"
              className="text-amber-400 hover:text-amber-300 transition-colors"
            >
              View All →
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { name: 'John Track Star', sport: 'Track & Field', school: 'UCLA' },
              { name: 'Jane Basketball Pro', sport: 'Basketball', school: 'UConn' },
              { name: 'Alex Soccer Star', sport: 'Soccer', school: 'Stanford' },
              { name: 'Sarah Gymnast', sport: 'Gymnastics', school: 'Oklahoma' },
            ].map((athlete, i) => (
              <Link
                key={i}
                to="/rosters"
                className="group bg-gray-800 rounded-xl p-6 border border-gray-700 hover:border-amber-500/50 transition-all"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full mb-4 flex items-center justify-center text-2xl">
                  {athlete.name.charAt(0)}
                </div>
                <h3 className="font-semibold text-lg mb-1 group-hover:text-amber-400 transition-colors">
                  {athlete.name}
                </h3>
                <p className="text-gray-400 text-sm">{athlete.sport}</p>
                <p className="text-amber-400 text-sm">{athlete.school}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Deals Section */}
      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold">Popular Deals</h2>
            <Link
              to="/deals"
              className="text-amber-400 hover:text-amber-300 transition-colors"
            >
              View All →
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { type: 'Video Shoutout', athlete: 'John Track Star', price: 50, tier: 'Bronze' },
              { type: 'Personal Message', athlete: 'Jane Basketball Pro', price: 25, tier: 'Free' },
              { type: 'Custom Photo', athlete: 'Sarah Gymnast', price: 35, tier: 'Silver' },
            ].map((deal, i) => (
              <Link
                key={i}
                to="/deals"
                className="group bg-gray-900 rounded-xl p-6 border border-gray-800 hover:border-amber-500/50 transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <span className="bg-amber-500/20 text-amber-400 text-xs font-semibold px-2 py-1 rounded">
                    {deal.tier}
                  </span>
                  <span className="text-2xl font-bold text-amber-400">${deal.price}</span>
                </div>
                <h3 className="font-semibold text-lg mb-1">{deal.type}</h3>
                <p className="text-gray-400 text-sm">by {deal.athlete}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800 py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-amber-400 font-bold text-xl font-script">Athletes Only</div>
            <p className="text-gray-500 text-sm">
              © 2024 Athletes Only. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

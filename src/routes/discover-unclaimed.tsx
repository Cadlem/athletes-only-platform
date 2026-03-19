import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useState, useMemo } from 'react'
import { LoadingCard } from '~/components/ui/loading'

export const Route = createFileRoute('/discover-unclaimed')({
  component: DiscoverUnclaimedPage,
})

type UnclaimedAthlete = {
  id: string
  displayName: string
  sport: string
  schoolId: string | null
  position: string | null
  jerseyNumber: string | null
  year: string | null
  hometown: string | null
  avatarUrl: string | null
  preSubscriberCount: number
  claimStatus: string
}

const sportIcons: Record<string, string> = {
  'Track & Field': '🏃',
  'Basketball': '🏀',
  'Soccer': '⚽',
  'Gymnastics': '🤸',
  'Swimming': '🏊',
  'Tennis': '🎾',
  'Football': '🏈',
  'Volleyball': '🏐',
  'Baseball': '⚾',
  'Softball': '🥎',
  'Wrestling': '🤼',
  'Golf': '⛳',
  'Lacrosse': '🥍',
  'Hockey': '🏒',
  'Cross Country': '🏃',
}

function AthleteCard({ athlete }: { athlete: UnclaimedAthlete }) {
  const initial = athlete.displayName.charAt(0).toUpperCase()
  const sportIcon = sportIcons[athlete.sport] ?? '🏅'

  return (
    <Link
      to="/unclaimed-profile/$id"
      params={{ id: athlete.id }}
      className="group bg-gray-900 rounded-xl border border-gray-800 hover:border-amber-500/50 transition-all overflow-hidden flex flex-col"
    >
      {/* Avatar area */}
      <div className="relative p-6 pb-4 flex items-start gap-4">
        <div className="flex-shrink-0">
          {athlete.avatarUrl ? (
            <img
              src={athlete.avatarUrl}
              alt={athlete.displayName}
              className="w-16 h-16 rounded-full object-cover"
            />
          ) : (
            <div className="w-16 h-16 bg-gradient-to-br from-gray-700 to-gray-600 rounded-full flex items-center justify-center text-2xl font-bold text-gray-300">
              {initial}
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-white text-lg leading-tight group-hover:text-amber-400 transition-colors truncate">
              {athlete.displayName}
            </h3>
            <span className="flex-shrink-0 bg-amber-500/20 text-amber-400 text-xs font-bold px-2 py-0.5 rounded border border-amber-500/30 uppercase tracking-wide">
              Unclaimed
            </span>
          </div>
          <div className="flex items-center gap-1 mt-1 text-sm text-gray-400">
            <span>{sportIcon}</span>
            <span>{athlete.sport}</span>
          </div>
        </div>
      </div>

      {/* Details */}
      <div className="px-6 pb-4 flex-1 space-y-2">
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
          <div>
            <span className="text-gray-500">School</span>
            <p className="text-gray-300 truncate">{athlete.schoolId ?? '—'}</p>
          </div>
          <div>
            <span className="text-gray-500">Position</span>
            <p className="text-gray-300">{athlete.position ?? '—'}</p>
          </div>
          <div>
            <span className="text-gray-500">Jersey</span>
            <p className="text-gray-300">{athlete.jerseyNumber ? `#${athlete.jerseyNumber}` : '—'}</p>
          </div>
          <div>
            <span className="text-gray-500">Year</span>
            <p className="text-gray-300">{athlete.year ?? '—'}</p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 py-3 bg-gray-800/50 border-t border-gray-800 flex items-center justify-between">
        <span className="text-xs text-gray-500">
          {athlete.preSubscriberCount} fan{athlete.preSubscriberCount !== 1 ? 's' : ''} waiting
        </span>
        <span className="text-xs text-amber-400 font-medium group-hover:underline">
          View Profile →
        </span>
      </div>
    </Link>
  )
}

export function DiscoverUnclaimedPage() {
  const [nameFilter, setNameFilter] = useState('')
  const [sportFilter, setSportFilter] = useState('all')

  const { data, isLoading, isError } = useQuery({
    queryKey: ['unclaimed-athletes'],
    queryFn: async () => {
      const res = await fetch('/api/v1/athletes/unclaimed')
      if (!res.ok) throw new Error('Failed to fetch unclaimed athletes')
      return res.json() as Promise<{ athletes: UnclaimedAthlete[] }>
    },
  })

  const athletes = data?.athletes ?? []

  const sports = useMemo(
    () => [...new Set(athletes.map(a => a.sport))].sort(),
    [athletes],
  )

  const filtered = useMemo(() => {
    return athletes.filter(a => {
      const matchesSport = sportFilter === 'all' || a.sport === sportFilter
      const matchesName = nameFilter === '' || a.displayName.toLowerCase().includes(nameFilter.toLowerCase())
      return matchesSport && matchesName
    })
  }, [athletes, sportFilter, nameFilter])

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
              <Link to="/discover-unclaimed" className="text-amber-400 font-medium">
                Discover
              </Link>
              <Link to="/live-feed" className="text-gray-300 hover:text-white transition-colors">
                Live
              </Link>
              <Link to="/deals" className="text-gray-300 hover:text-white transition-colors">
                Deals
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Page header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold">Discover Athletes</h1>
            <span className="bg-amber-500/20 text-amber-400 text-sm font-bold px-2 py-0.5 rounded border border-amber-500/30 uppercase tracking-wide">
              Unclaimed
            </span>
          </div>
          <p className="text-gray-400">
            These athletes haven't joined yet. Pre-subscribe to be notified when they claim their profile.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <input
            type="text"
            value={nameFilter}
            onChange={e => setNameFilter(e.target.value)}
            placeholder="Search by name..."
            className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-amber-500"
          />
          <select
            value={sportFilter}
            onChange={e => setSportFilter(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-amber-500"
          >
            <option value="all">All Sports</option>
            {sports.map(sport => (
              <option key={sport} value={sport}>{sport}</option>
            ))}
          </select>
        </div>

        {/* Results count */}
        {!isLoading && !isError && (
          <p className="text-sm text-gray-500 mb-4">
            Showing {filtered.length} of {athletes.length} unclaimed athletes
          </p>
        )}

        {/* Grid */}
        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => <LoadingCard key={i} />)}
          </div>
        )}

        {isError && (
          <div className="bg-red-900/20 border border-red-800 rounded-xl p-8 text-center">
            <p className="text-red-400">Failed to load unclaimed athletes. Please try again.</p>
          </div>
        )}

        {!isLoading && !isError && filtered.length === 0 && (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-12 text-center">
            <p className="text-gray-400 text-lg">No unclaimed athletes match your filters.</p>
          </div>
        )}

        {!isLoading && !isError && filtered.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map(athlete => (
              <AthleteCard key={athlete.id} athlete={athlete} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

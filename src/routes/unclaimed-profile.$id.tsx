import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { LoadingPage } from '~/components/ui/loading'

export const Route = createFileRoute('/unclaimed-profile/$id')({
  component: UnclaimedProfilePage,
  pendingComponent: LoadingPage,
})

type UnclaimedAthlete = {
  id: string
  displayName: string
  sport: string
  bio: string | null
  schoolId: string | null
  position: string | null
  jerseyNumber: string | null
  year: string | null
  hometown: string | null
  avatarUrl: string | null
  coverUrl: string | null
  preSubscriberCount: number
  claimStatus: string
  tierPricing: { bronze: number; silver: number; gold: number }
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

type TierKey = 'bronze' | 'silver' | 'gold'

const tierColors: Record<TierKey, string> = {
  bronze: 'border-amber-700/50 bg-amber-900/10 hover:bg-amber-900/20 text-amber-300',
  silver: 'border-gray-500/50 bg-gray-800/50 hover:bg-gray-700/50 text-gray-200',
  gold: 'border-yellow-500/50 bg-yellow-900/10 hover:bg-yellow-900/20 text-yellow-300',
}

function TierButton({
  tier,
  priceCents,
  color,
  onClick,
  disabled,
}: {
  tier: string
  priceCents: number
  color: string
  onClick: () => void
  disabled?: boolean
}) {
  const price = (priceCents / 100).toFixed(2)
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className={`w-full rounded-xl border-2 p-5 text-left transition-colors ${color} ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <div className="flex items-center justify-between mb-1">
        <span className="font-bold text-lg capitalize">{tier}</span>
        <span className="text-xl font-bold">${price}<span className="text-sm font-normal text-current opacity-70">/mo</span></span>
      </div>
      <p className="text-sm opacity-70">Be notified when this athlete joins Athletes Only</p>
    </button>
  )
}

function ProfileField({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <dt className="text-xs text-gray-500 uppercase tracking-wide mb-0.5">{label}</dt>
      <dd className="text-white">{value ?? '—'}</dd>
    </div>
  )
}

function ConfirmationModal({
  tier,
  priceCents,
  athleteName,
  onConfirm,
  onCancel,
  isLoading,
}: {
  tier: TierKey
  priceCents: number
  athleteName: string
  onConfirm: () => void
  onCancel: () => void
  isLoading: boolean
}) {
  const price = (priceCents / 100).toFixed(2)
  const color = tierColors[tier]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl">
        <h3 className="text-xl font-bold mb-2">Confirm Pre-Subscription</h3>
        <p className="text-gray-400 text-sm mb-6">
          Lock in your <span className={`font-bold capitalize ${tier === 'gold' ? 'text-yellow-300' : tier === 'silver' ? 'text-gray-200' : 'text-amber-300'}`}>{tier}</span> spot for <span className="text-white font-semibold">{athleteName}</span>. You'll be charged automatically when they claim their profile.
        </p>

        <div className={`rounded-xl border-2 p-4 mb-6 ${color}`}>
          <div className="flex items-center justify-between">
            <span className="font-bold capitalize text-lg">{tier}</span>
            <span className="text-2xl font-bold">${price}<span className="text-sm font-normal text-current opacity-70">/mo</span></span>
          </div>
        </div>

        <p className="text-xs text-gray-500 mb-6">
          No charge today — this is a pre-commitment. You'll be billed when {athleteName} officially joins Athletes Only.
        </p>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1 px-4 py-2.5 rounded-xl border border-gray-600 text-gray-300 font-semibold hover:bg-gray-800 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-1 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-gray-900 font-bold transition-colors disabled:opacity-50"
          >
            {isLoading ? 'Processing...' : `Lock In ${tier.charAt(0).toUpperCase() + tier.slice(1)}`}
          </button>
        </div>
      </div>
    </div>
  )
}

export function UnclaimedProfilePage() {
  const { id } = Route.useParams()
  const queryClient = useQueryClient()
  const [selectedTier, setSelectedTier] = useState<TierKey | null>(null)
  const [showSuccess, setShowSuccess] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const { data, isLoading, isError } = useQuery({
    queryKey: ['unclaimed-athlete', id],
    queryFn: async () => {
      const res = await fetch(`/api/v1/athletes/unclaimed/${id}`)
      if (!res.ok) throw new Error('Athlete not found')
      return res.json() as Promise<{ athlete: UnclaimedAthlete }>
    },
  })

  const subscribeMutation = useMutation({
    mutationFn: async (tier: TierKey) => {
      const res = await fetch(`/api/v1/athletes/unclaimed/${id}/pre-subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(body.error ?? `HTTP ${res.status}`)
      }
      return res.json()
    },
    onSuccess: () => {
      setShowSuccess(true)
      setSelectedTier(null)
      // Refresh both the individual profile and the list view
      queryClient.invalidateQueries({ queryKey: ['unclaimed-athlete', id] })
      queryClient.invalidateQueries({ queryKey: ['unclaimed-athletes'] })
    },
    onError: (err: Error) => {
      setErrorMessage(err.message)
      setSelectedTier(null)
    },
  })

  const athlete = data?.athlete
  const tierPricing = athlete?.tierPricing ?? { bronze: 499, silver: 999, gold: 2499 }

  if (isLoading) return <LoadingPage />

  if (isError || !athlete) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-2xl font-bold mb-2">Profile not found</p>
          <p className="text-gray-400 mb-6">This athlete profile doesn't exist or is no longer unclaimed.</p>
          <Link
            to="/discover-unclaimed"
            className="bg-amber-500 hover:bg-amber-600 text-gray-900 font-semibold px-6 py-2 rounded-lg transition-colors"
          >
            Back to Discover
          </Link>
        </div>
      </div>
    )
  }

  const initial = athlete.displayName.charAt(0).toUpperCase()
  const sportIcon = sportIcons[athlete.sport] ?? '🏅'

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Confirmation Modal */}
      {selectedTier && (
        <ConfirmationModal
          tier={selectedTier}
          priceCents={tierPricing[selectedTier]}
          athleteName={athlete.displayName}
          onConfirm={() => subscribeMutation.mutate(selectedTier)}
          onCancel={() => {
            setSelectedTier(null)
            setErrorMessage(null)
          }}
          isLoading={subscribeMutation.isPending}
        />
      )}

      {/* Success State */}
      {showSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-gray-900 border border-amber-500/30 rounded-2xl p-8 max-w-sm w-full mx-4 shadow-2xl text-center">
            <div className="text-6xl mb-4">🔥</div>
            <h2 className="text-2xl font-bold text-amber-400 mb-2">You're in!</h2>
            <p className="text-gray-300 text-sm mb-2">
              You've pre-subscribed to <span className="text-white font-semibold">{athlete.displayName}</span>.
            </p>
            <p className="text-gray-500 text-xs mb-8">
              You'll be charged when they claim their profile. We'll notify you at that time.
            </p>
            <button
              onClick={() => setShowSuccess(false)}
              className="w-full px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-gray-900 font-bold transition-colors"
            >
              Got it!
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm sticky top-0 z-40">
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

      {/* Cover / hero */}
      <div className="relative">
        <div className="h-40 bg-gradient-to-r from-gray-800 to-gray-900" />
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-end gap-6 -mt-12 pb-6">
            {athlete.avatarUrl ? (
              <img
                src={athlete.avatarUrl}
                alt={athlete.displayName}
                className="w-24 h-24 rounded-full object-cover border-4 border-gray-950 flex-shrink-0"
              />
            ) : (
              <div className="w-24 h-24 bg-gradient-to-br from-gray-700 to-gray-600 rounded-full border-4 border-gray-950 flex items-center justify-center text-4xl font-bold text-gray-300 flex-shrink-0">
                {initial}
              </div>
            )}
            <div className="pb-2">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-3xl font-bold">{athlete.displayName}</h1>
                <span className="bg-amber-500/20 text-amber-400 text-sm font-bold px-2.5 py-1 rounded border border-amber-500/30 uppercase tracking-wide">
                  Unclaimed
                </span>
              </div>
              <div className="flex items-center gap-2 mt-1 text-gray-400">
                <span>{sportIcon}</span>
                <span>{athlete.sport}</span>
                {athlete.jerseyNumber && (
                  <>
                    <span className="text-gray-600">·</span>
                    <span>#{athlete.jerseyNumber}</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="max-w-4xl mx-auto px-4 pb-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left: profile info */}
          <div className="md:col-span-2 space-y-6">
            {/* Bio */}
            <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
              <h2 className="text-lg font-semibold mb-4">About</h2>
              {athlete.bio ? (
                <p className="text-gray-300">{athlete.bio}</p>
              ) : (
                <p className="text-gray-500 italic">No bio yet — this athlete hasn't claimed their profile.</p>
              )}
            </div>

            {/* Details */}
            <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
              <h2 className="text-lg font-semibold mb-4">Details</h2>
              <dl className="grid grid-cols-2 gap-x-8 gap-y-4">
                <ProfileField label="Sport" value={`${sportIcon} ${athlete.sport}`} />
                <ProfileField label="School" value={athlete.schoolId} />
                <ProfileField label="Position" value={athlete.position} />
                <ProfileField label="Jersey Number" value={athlete.jerseyNumber ? `#${athlete.jerseyNumber}` : null} />
                <ProfileField label="Year" value={athlete.year} />
                <ProfileField label="Hometown" value={athlete.hometown} />
              </dl>
            </div>
          </div>

          {/* Right: pre-subscribe + fan count */}
          <div className="space-y-4">
            {/* Fan waiting count */}
            <div className="bg-gray-900 rounded-xl border border-gray-800 p-5 text-center">
              <p className="text-4xl font-bold text-amber-400">{athlete.preSubscriberCount}</p>
              <p className="text-gray-400 mt-1 text-sm">
                fan{athlete.preSubscriberCount !== 1 ? 's' : ''} waiting for this athlete
              </p>
            </div>

            {/* Claim this profile */}
            <div className="bg-gray-900 rounded-xl border border-amber-500/30 p-5">
              <h2 className="text-lg font-semibold mb-1">Are you {athlete.displayName}?</h2>
              <p className="text-gray-400 text-sm mb-4">
                Claim this athlete profile and start sharing content with fans.
              </p>
              <Link
                to="/claim/$id"
                params={{ id: athlete.id }}
                className="block w-full text-center px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-gray-900 font-bold transition-colors"
              >
                Claim This Profile
              </Link>
            </div>

            {/* Pre-subscribe */}
            <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
              <h2 className="text-lg font-semibold mb-1">Pre-Subscribe</h2>
              <p className="text-gray-400 text-sm mb-4">
                Lock in your spot. You'll be charged only when {athlete.displayName} claims their profile.
              </p>

              {/* Error message */}
              {errorMessage && (
                <div className="mb-4 p-3 rounded-lg bg-red-900/30 border border-red-700/50 text-red-300 text-sm">
                  {errorMessage}
                </div>
              )}

              <div className="space-y-3">
                <TierButton
                  tier="Bronze"
                  priceCents={tierPricing.bronze}
                  color={tierColors.bronze}
                  onClick={() => {
                    setErrorMessage(null)
                    setSelectedTier('bronze')
                  }}
                />
                <TierButton
                  tier="Silver"
                  priceCents={tierPricing.silver}
                  color={tierColors.silver}
                  onClick={() => {
                    setErrorMessage(null)
                    setSelectedTier('silver')
                  }}
                />
                <TierButton
                  tier="Gold"
                  priceCents={tierPricing.gold}
                  color={tierColors.gold}
                  onClick={() => {
                    setErrorMessage(null)
                    setSelectedTier('gold')
                  }}
                />
              </div>
            </div>

            {/* Back link */}
            <Link
              to="/discover-unclaimed"
              className="block text-center text-sm text-gray-500 hover:text-gray-300 transition-colors"
            >
              ← Back to Discover
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

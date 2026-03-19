import { createFileRoute, Link } from '@tanstack/react-router'

export const Route = createFileRoute('/claim-success')({
  component: ClaimSuccessPage,
})

type ClaimState = {
  athlete?: { id: string; displayName: string; sport: string }
  preSubscriberCount?: number
}

function ClaimSuccessPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const state = (window.history.state as any)?.usr as ClaimState | undefined
  const athlete = state?.athlete
  const preSubscriberCount = state?.preSubscriberCount ?? 0

  return (
    <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center px-4">
      <div className="w-full max-w-md text-center">
        <div className="text-6xl mb-6">🎉</div>
        <h1 className="text-3xl font-bold text-amber-400 mb-2">
          {athlete?.displayName ?? 'Profile'} Claimed!
        </h1>
        <p className="text-gray-400 mb-8">
          Your athlete profile is now live on Athletes Only.
        </p>

        {preSubscriberCount > 0 ? (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-6 mb-8">
            <div className="text-4xl font-bold text-amber-400 mb-1">
              {preSubscriberCount}
            </div>
            <div className="text-gray-300">
              {preSubscriberCount === 1 ? 'fan is' : 'fans are'} waiting for you!
            </div>
            <p className="text-gray-500 text-sm mt-2">
              Your pre-subscribers have been activated and notified.
            </p>
          </div>
        ) : (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-8">
            <p className="text-gray-400">
              No pre-subscribers yet — share your profile to start building your fanbase!
            </p>
          </div>
        )}

        <div className="space-y-3">
          <Link
            to="/dashboard"
            className="block w-full bg-amber-500 hover:bg-amber-600 text-gray-900 font-semibold py-3 rounded-lg transition-colors"
          >
            Go to Dashboard
          </Link>
          <Link
            to="/"
            className="block w-full bg-gray-800 hover:bg-gray-700 text-gray-300 font-medium py-3 rounded-lg transition-colors"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}

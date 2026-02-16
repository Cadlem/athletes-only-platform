import { createFileRoute, Link, useSearch } from '@tanstack/react-router'
import { useState, useMemo, Suspense } from 'react'
import { sampleVideos } from '~/lib/videos'
import { LoadingSpinner, LoadingPage } from '~/components/ui/loading'

export const Route = createFileRoute('/live-feed')({
  component: LiveFeedPage,
  pendingComponent: LoadingPage,
})

export function LiveFeedPage() {
  const search = useSearch({ from: '/live-feed' })
  const [selectedVideo, setSelectedVideo] = useState<string | null>(search.video || null)

  const liveVideos = useMemo(() => sampleVideos.filter(v => v.status === 'live'), [])
  const scheduledVideos = useMemo(() => sampleVideos.filter(v => v.status === 'scheduled'), [])
  const endedVideos = useMemo(() => sampleVideos.filter(v => v.status === 'ended'), [])

  const currentVideo = useMemo(() => {
    if (!selectedVideo) return liveVideos[0] || sampleVideos[0]
    return sampleVideos.find(v => v.id === selectedVideo) || sampleVideos[0]
  }, [selectedVideo])

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
              <Link to="/live-feed" className="text-amber-400 font-medium">
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Video Player */}
          <div className="lg:col-span-2">
            <div className="aspect-video bg-gray-900 rounded-xl overflow-hidden relative">
              {/* Simulated Video Player */}
              <video
                className="w-full h-full object-cover"
                controls
                autoPlay={currentVideo.status === 'live'}
                poster={currentVideo.thumbnail}
              >
                <source src={currentVideo.streamUrl} type="application/x-mpegURL" />
                Your browser does not support video playback.
              </video>
              
              {/* Live Badge */}
              {currentVideo.status === 'live' && (
                <div className="absolute top-4 left-4 bg-red-500 text-white text-sm font-semibold px-3 py-1 rounded flex items-center gap-2">
                  <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
                  LIVE
                </div>
              )}
              
              {/* Viewer Count */}
              {currentVideo.status === 'live' && (
                <div className="absolute top-4 right-4 bg-black/70 text-white text-sm px-3 py-1 rounded flex items-center gap-2">
                  <span>👁</span>
                  {currentVideo.viewerCount.toLocaleString()} watching
                </div>
              )}
            </div>

            {/* Video Info */}
            <div className="mt-4">
              <h1 className="text-2xl font-bold mb-2">{currentVideo.title}</h1>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center font-bold text-gray-900">
                    {currentVideo.athlete.charAt(0)}
                  </div>
                  <div>
                    <div className="font-medium">{currentVideo.athlete}</div>
                    <div className="text-sm text-gray-400">
                      {currentVideo.status === 'live' ? 'Streaming now' : 
                       currentVideo.status === 'scheduled' ? 'Scheduled' : 'Ended'}
                    </div>
                  </div>
                </div>
                <button className="ml-auto px-4 py-2 bg-amber-500 hover:bg-amber-600 text-gray-900 font-semibold rounded-lg transition-colors">
                  Follow
                </button>
              </div>
            </div>
          </div>

          {/* Sidebar - Video List */}
          <div className="space-y-6">
            {/* Live Now */}
            <div>
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                Live Now
              </h2>
              <div className="space-y-3">
                {liveVideos.map(video => (
                  <button
                    key={video.id}
                    onClick={() => setSelectedVideo(video.id)}
                    className={`w-full text-left p-3 rounded-lg border transition-all ${
                      selectedVideo === video.id || (!selectedVideo && video.status === 'live')
                        ? 'border-amber-500 bg-amber-500/10'
                        : 'border-gray-800 bg-gray-900 hover:border-gray-700'
                    }`}
                  >
                    <div className="flex gap-3">
                      <div className="w-20 h-14 bg-gray-800 rounded overflow-hidden flex-shrink-0">
                        <div className="w-full h-full flex items-center justify-center text-2xl">
                          🎬
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">{video.title}</div>
                        <div className="text-xs text-gray-400">{video.athlete}</div>
                        <div className="text-xs text-red-400 mt-1">
                          {video.viewerCount.toLocaleString()} watching
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
                {liveVideos.length === 0 && (
                  <div className="text-gray-500 text-sm py-4 text-center">
                    No live streams right now
                  </div>
                )}
              </div>
            </div>

            {/* Upcoming */}
            <div>
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <span>📅</span>
                Upcoming
              </h2>
              <div className="space-y-3">
                {scheduledVideos.map(video => (
                  <button
                    key={video.id}
                    onClick={() => setSelectedVideo(video.id)}
                    className={`w-full text-left p-3 rounded-lg border transition-all ${
                      selectedVideo === video.id
                        ? 'border-amber-500 bg-amber-500/10'
                        : 'border-gray-800 bg-gray-900 hover:border-gray-700'
                    }`}
                  >
                    <div className="flex gap-3">
                      <div className="w-20 h-14 bg-gray-800 rounded overflow-hidden flex-shrink-0 flex items-center justify-center text-2xl">
                        📺
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">{video.title}</div>
                        <div className="text-xs text-gray-400">{video.athlete}</div>
                        <div className="text-xs text-amber-400 mt-1">Starting soon</div>
                      </div>
                    </div>
                  </button>
                ))}
                {scheduledVideos.length === 0 && (
                  <div className="text-gray-500 text-sm py-4 text-center">
                    No upcoming streams
                  </div>
                )}
              </div>
            </div>

            {/* Past Streams */}
            <div>
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <span>📹</span>
                Past Streams
              </h2>
              <div className="space-y-3">
                {endedVideos.map(video => (
                  <button
                    key={video.id}
                    onClick={() => setSelectedVideo(video.id)}
                    className={`w-full text-left p-3 rounded-lg border transition-all ${
                      selectedVideo === video.id
                        ? 'border-amber-500 bg-amber-500/10'
                        : 'border-gray-800 bg-gray-900 hover:border-gray-700'
                    }`}
                  >
                    <div className="flex gap-3">
                      <div className="w-20 h-14 bg-gray-800 rounded overflow-hidden flex-shrink-0 flex items-center justify-center text-2xl">
                        ▶️
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">{video.title}</div>
                        <div className="text-xs text-gray-400">{video.athlete}</div>
                        <div className="text-xs text-gray-500 mt-1">Watch replay</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

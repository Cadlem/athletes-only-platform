// Placeholder videos for live simulation
// In production, these would be actual video files or HLS streams

export const sampleVideos = [
  {
    id: 'live-1',
    title: 'Morning Workout Session',
    athlete: 'John Track Star',
    thumbnail: '/media/thumbnail-1.jpg',
    streamUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
    status: 'live' as const,
    viewerCount: 1247,
  },
  {
    id: 'live-2',
    title: 'Basketball Drills',
    athlete: 'Jane Basketball Pro',
    thumbnail: '/media/thumbnail-2.jpg',
    streamUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
    status: 'live' as const,
    viewerCount: 892,
  },
  {
    id: 'live-3',
    title: 'Soccer Training',
    athlete: 'Alex Soccer Star',
    thumbnail: '/media/thumbnail-3.jpg',
    streamUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
    status: 'scheduled' as const,
    viewerCount: 0,
  },
  {
    id: 'live-4',
    title: 'Gymnastics Routine',
    athlete: 'Sarah Gymnast',
    thumbnail: '/media/thumbnail-4.jpg',
    streamUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
    status: 'live' as const,
    viewerCount: 2156,
  },
  {
    id: 'live-5',
    title: 'Swimming Practice',
    athlete: 'Mike Swimmer',
    thumbnail: '/media/thumbnail-5.jpg',
    streamUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
    status: 'ended' as const,
    viewerCount: 0,
  },
];

export const getVideoUrl = (id: string) => {
  const video = sampleVideos.find(v => v.id === id);
  return video?.streamUrl || sampleVideos[0].streamUrl;
};

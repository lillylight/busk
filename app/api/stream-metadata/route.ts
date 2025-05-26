import { NextResponse } from "next/server"

// This would normally fetch real metadata from the stream
// For now, we'll simulate with rotating metadata
const tracks = [
  { artist: "Synthetic FM", title: "Electronic Dreams", coverUrl: null },
  { artist: "BUSK Collective", title: "Urban Rhythms", coverUrl: null },
  { artist: "Digital Nomads", title: "Wanderlust", coverUrl: null },
  { artist: "Ambient Architects", title: "Skyline", coverUrl: null },
  { artist: "Neural Beats", title: "Synaptic", coverUrl: null },
]

let currentTrackIndex = 0

export async function GET() {
  // Rotate through tracks to simulate changing metadata
  const track = tracks[currentTrackIndex]
  currentTrackIndex = (currentTrackIndex + 1) % tracks.length

  return NextResponse.json(track)
}

/**
 * A service to manage audio playback and streaming
 */
class AudioService {
  private audio: HTMLAudioElement | null = null
  private isInitialized = false
  private songCount = 0
  private streamUrl = "http://stream.syntheticfm.com:8040/live"
  private metadataInterval: NodeJS.Timeout | null = null
  private currentMetadata: {
    artist: string
    title: string
    coverUrl: string | null
  } = {
    artist: "",
    title: "",
    coverUrl: null,
  }

  private metadataListeners: Array<(metadata: any) => void> = []

  initialize() {
    if (this.isInitialized) return

    this.audio = new Audio()
    this.audio.crossOrigin = "anonymous"
    this.setStreamSource()
    this.isInitialized = true
    this.startMetadataPolling()
  }

  setStreamSource() {
    if (!this.audio) return
    this.audio.src = this.streamUrl
    this.audio.preload = "auto"
  }

  setDefaultSource() {
    if (!this.audio) return
    this.audio.src = this.streamUrl
  }

  setSource(src: string) {
    if (!this.audio) return
    this.audio.src = src
  }

  play() {
    if (!this.audio) return Promise.reject(new Error("Audio not initialized"))
    this.songCount++
    return this.audio.play()
  }

  pause() {
    if (!this.audio) return
    this.audio.pause()
  }

  isPlaying() {
    if (!this.audio) return false
    return !this.audio.paused
  }

  getSongCount() {
    return this.songCount
  }

  resetSongCount() {
    this.songCount = 0
  }

  getCurrentMetadata() {
    return this.currentMetadata
  }

  onMetadataUpdate(callback: (metadata: any) => void) {
    this.metadataListeners.push(callback)
  }

  private async fetchMetadata() {
    try {
      // In a real implementation, this would fetch metadata from an API
      // For now, we'll simulate metadata updates
      const response = await fetch("/api/stream-metadata")
      if (response.ok) {
        const data = await response.json()
        this.currentMetadata = {
          artist: data.artist || "Unknown Artist",
          title: data.title || "Unknown Track",
          coverUrl: data.coverUrl || null,
        }

        // Notify listeners
        this.metadataListeners.forEach((listener) => listener(this.currentMetadata))
      }
    } catch (error) {
      console.error("Error fetching metadata:", error)
    }
  }

  private startMetadataPolling() {
    this.metadataInterval = setInterval(() => {
      this.fetchMetadata()
    }, 10000) // Poll every 10 seconds
  }

  cleanup() {
    if (!this.audio) return
    this.audio.pause()
    this.audio.src = ""
    this.isInitialized = false

    if (this.metadataInterval) {
      clearInterval(this.metadataInterval)
    }
  }
}

// Create a singleton instance
const audioService = new AudioService()

export default audioService

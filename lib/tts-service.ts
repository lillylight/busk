import { OpenAI } from 'openai'
import fs from 'fs'
import path from 'path'
import os from 'os'

interface TTSOptions {
  voice: string
  model: string
  instructions?: string
}

export class TTSService {
  private client: OpenAI
  private tempDir: string

  constructor() {
    // Initialize OpenAI client with API key from environment variables
    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
    
    // Create a temporary directory for storing audio files
    this.tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'tts-'))
  }

  /**
   * Converts text to speech using OpenAI's TTS API
   * @param text The text to convert to speech
   * @param options Configuration options for the TTS request
   * @returns Path to the generated audio file
   */
  async textToSpeech(text: string, options: Partial<TTSOptions> = {}): Promise<string> {
    const {
      voice = 'coral',
      model = 'gpt-4o-mini-tts',
      instructions = 'Speak in a cheerful and positive tone.'
    } = options

    // Generate a unique filename for this request
    const filename = `speech-${Date.now()}.mp3`
    const outputPath = path.join(this.tempDir, filename)

    try {
      // Create a write stream to save the audio file
      const writeStream = fs.createWriteStream(outputPath)

      // Make the TTS request to OpenAI
      const response = await this.client.audio.speech.create({
        model,
        voice,
        input: text,
        instructions,
      })

      // Convert the response to a buffer and write to file
      const buffer = Buffer.from(await response.arrayBuffer())
      fs.writeFileSync(outputPath, buffer)

      return outputPath
    } catch (error) {
      console.error('Error generating speech:', error)
      throw error
    }
  }

  /**
   * Cleans up temporary files created by the service
   */
  cleanup(): void {
    try {
      // Remove all files in the temporary directory
      const files = fs.readdirSync(this.tempDir)
      for (const file of files) {
        fs.unlinkSync(path.join(this.tempDir, file))
      }
      
      // Remove the temporary directory
      fs.rmdirSync(this.tempDir)
    } catch (error) {
      console.error('Error cleaning up TTS service:', error)
    }
  }

  /**
   * Gets the audio data as a buffer
   * @param filePath Path to the audio file
   * @returns Buffer containing the audio data
   */
  getAudioBuffer(filePath: string): Buffer {
    return fs.readFileSync(filePath)
  }

  /**
   * Creates an audio element from a file path
   * @param filePath Path to the audio file
   * @returns HTMLAudioElement with the audio source set
   */
  createAudioElement(filePath: string): HTMLAudioElement {
    const audio = new Audio()
    audio.src = `data:audio/mp3;base64,${this.getAudioBuffer(filePath).toString('base64')}`
    return audio
  }
}

// Create a singleton instance
const ttsService = new TTSService()
export default ttsService
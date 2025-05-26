import { NextRequest, NextResponse } from 'next/server'
import { OpenAI } from 'openai'
import fs from 'fs'
import path from 'path'
import os from 'os'
import { Readable } from 'stream'

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Create a temporary directory for storing audio files if needed
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'tts-'))

export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const { text, voice = 'coral', instructions = 'Speak in a cheerful and positive tone.' } = await request.json()

    if (!text) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 })
    }

    // Generate a unique filename
    const filename = `speech-${Date.now()}.mp3`
    const outputPath = path.join(tempDir, filename)

    // Make the TTS request to OpenAI with streaming response
    const response = await openai.audio.speech.create({
      model: 'gpt-4o-mini-tts',
      voice,
      input: text,
      instructions,
    })

    // Convert the response to a buffer
    const buffer = Buffer.from(await response.arrayBuffer())
    
    // Save the file temporarily (optional, for debugging)
    fs.writeFileSync(outputPath, buffer)

    // Return the audio as a response
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': buffer.length.toString(),
      },
    })
  } catch (error: any) {
    console.error('Error generating speech:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to generate speech' },
      { status: 500 }
    )
  }
}

// Clean up temporary files periodically
setInterval(() => {
  try {
    const files = fs.readdirSync(tempDir)
    const now = Date.now()
    
    for (const file of files) {
      const filePath = path.join(tempDir, file)
      const stats = fs.statSync(filePath)
      
      // Remove files older than 1 hour
      if (now - stats.mtimeMs > 60 * 60 * 1000) {
        fs.unlinkSync(filePath)
      }
    }
  } catch (error) {
    console.error('Error cleaning up TTS files:', error)
  }
}, 30 * 60 * 1000) // Run every 30 minutes
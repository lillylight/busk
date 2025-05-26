import { NextRequest, NextResponse } from 'next/server'
import { OpenAI } from 'openai'

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const { 
      text, 
      voice = 'echo', 
      model = 'tts-1',
      speed = 1.0 
    } = await request.json()

    if (!text) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 })
    }

    // Make the TTS request to OpenAI
    const response = await openai.audio.speech.create({
      model: model,
      voice: voice as any, // OpenAI voice options: alloy, echo, fable, onyx, nova, shimmer
      input: text,
      speed: speed,
    })

    // Convert the response to a buffer
    const buffer = Buffer.from(await response.arrayBuffer())
    
    // Return the audio as a response
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': buffer.length.toString(),
        'Cache-Control': 'no-cache',
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

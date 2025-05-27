import { NextRequest, NextResponse } from 'next/server'
import { OpenAI } from 'openai'

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Voice instruction presets for different DJ personalities
const voiceInstructions: Record<string, string> = {
  'echo': `Voice: Deep, velvety, and effortlessly cool, like a late-night jazz radio host.
Tone: Smooth, laid-back, and inviting, creating a relaxed and easygoing atmosphere.
Personality: Confident, charming, and a touch of playful sophistication.
Pronunciation: Words drawn out slightly with a rhythmic, melodic quality.
Phrasing: Fluid, conversational, and slightly poetic with strategic pauses.`,
  
  'nova': `Voice: Warm, energetic, and uplifting with a bright morning radio personality.
Tone: Enthusiastic, positive, and engaging without being overwhelming.
Personality: Friendly, approachable, and genuinely excited about the music.
Pronunciation: Clear and articulate with natural enthusiasm.
Phrasing: Dynamic and expressive with good pacing.`,
  
  'shimmer': `Voice: Professional, intelligent, and articulate like an NPR host.
Tone: Thoughtful, measured, and intellectually engaging.
Personality: Knowledgeable, curious, and respectful.
Pronunciation: Precise and clear with excellent diction.
Phrasing: Well-structured sentences with thoughtful pauses.`,
  
  'alloy': `Voice: Contemporary, versatile, and relatable like a modern podcast host.
Tone: Conversational, authentic, and engaging.
Personality: Down-to-earth, genuine, and personable.
Pronunciation: Natural and contemporary speech patterns.
Phrasing: Casual yet professional with good flow.`,
  
  'onyx': `Voice: Deep, authoritative, and commanding like a classic radio announcer.
Tone: Rich, resonant, and powerful.
Personality: Confident, experienced, and trustworthy.
Pronunciation: Strong and clear with excellent projection.
Phrasing: Deliberate and impactful with dramatic effect.`,
  
  'sage': `Voice: Wise, calming, and contemplative like a meditation guide.
Tone: Peaceful, soothing, and reassuring.
Personality: Thoughtful, patient, and understanding.
Pronunciation: Gentle and measured with soft delivery.
Phrasing: Slow and deliberate with calming pauses.`
}

export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const { 
      text, 
      voice = 'echo', 
      model = 'gpt-4o-mini-tts',
      speed = 1.0,
      customInstructions 
    } = await request.json()

    if (!text) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 })
    }

    // Use custom instructions if provided, otherwise use preset for the voice
    const instructions = customInstructions || voiceInstructions[voice] || voiceInstructions['echo']

    // Check if we should use the new model with instructions
    if (model === 'gpt-4o-mini-tts') {
      // Use the new model with instructions
      const response = await openai.audio.speech.create({
        model: 'gpt-4o-mini-tts',
        voice: voice as any,
        input: text,
        instructions: instructions,
        response_format: 'mp3',
        speed: speed,
      } as any)

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
    } else {
      // Fallback to standard TTS models
      const response = await openai.audio.speech.create({
        model: model || 'tts-1',
        voice: voice as any,
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
    }
  } catch (error: any) {
    console.error('Error generating speech:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to generate speech' },
      { status: 500 }
    )
  }
}

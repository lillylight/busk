import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const { sdp, voiceProfile } = await req.json()

    if (!sdp) {
      return NextResponse.json({ error: 'SDP is required' }, { status: 400 })
    }

    const response = await fetch('https://api.openai.com/v1/realtime', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/sdp',
      },
      body: sdp,
    })

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`)
    }

    const answer = await response.text()
    return NextResponse.json({ answer })
  } catch (error) {
    console.error('WebRTC connection error:', error)
    return NextResponse.json(
      { error: 'Failed to establish WebRTC connection' },
      { status: 500 }
    )
  }
}
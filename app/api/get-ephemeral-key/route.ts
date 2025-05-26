import { NextRequest, NextResponse } from 'next/server'

/**
 * API endpoint to generate ephemeral session tokens for use in client-side applications
 * These tokens are short-lived and provide more security than using the main API key directly
 */
export async function POST(request: NextRequest) {
  try {
    // Get session configuration from request or use defaults
    const {
      model = "gpt-4o-mini-realtime-preview",
      voice = "verse",
      instructions,
      modalities = ["audio", "text"],
      input_audio_format = "pcm16",
      output_audio_format = "pcm16",
      temperature,
      max_response_output_tokens,
      turn_detection,
      tools,
      tool_choice
    } = await request.json().catch(() => ({}));

    // Build the session configuration object
    const sessionConfig: any = {
      model,
      voice,
      modalities
    };

    // Add optional parameters if provided
    if (instructions) sessionConfig.instructions = instructions;
    if (input_audio_format) sessionConfig.input_audio_format = input_audio_format;
    if (output_audio_format) sessionConfig.output_audio_format = output_audio_format;
    if (temperature !== undefined) sessionConfig.temperature = temperature;
    if (max_response_output_tokens !== undefined) sessionConfig.max_response_output_tokens = max_response_output_tokens;
    if (turn_detection !== undefined) sessionConfig.turn_detection = turn_detection;
    if (tools) sessionConfig.tools = tools;
    if (tool_choice) sessionConfig.tool_choice = tool_choice;

    // Request ephemeral token from OpenAI
    const response = await fetch("https://api.openai.com/v1/realtime/sessions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(sessionConfig),
    })

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Failed to get ephemeral key: ${response.status}`, errorText);
      throw new Error(`Failed to get ephemeral key: ${response.status}`);
    }

    const data = await response.json();
    
    // Add token expiration time to the response for client-side handling
    return NextResponse.json({
      ...data,
      expires_at: data.client_secret?.expires_at,
      created_at: Date.now()
    });
  } catch (error: any) {
    console.error('Error getting ephemeral key:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get ephemeral key' },
      { status: 500 }
    );
  }
}

// Keep GET method for backward compatibility
export async function GET() {
  try {
    const response = await fetch("https://api.openai.com/v1/realtime/sessions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini-realtime-preview",
        voice: "verse",
        modalities: ["audio", "text"]
      }),
    })

    if (!response.ok) {
      throw new Error(`Failed to get ephemeral key: ${response.status}`)
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error getting ephemeral key:', error)
    return NextResponse.json(
      { error: 'Failed to get ephemeral key' },
      { status: 500 }
    )
  }
}
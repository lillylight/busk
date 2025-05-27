import { NextRequest, NextResponse } from 'next/server';
import { getMultiHostDialogueService } from '@/lib/multi-host-dialogue';

export async function POST(req: NextRequest) {
  try {
    const { action, ...params } = await req.json();
    const service = getMultiHostDialogueService();

    switch (action) {
      case 'start': {
        const { hostIds, topic } = params;
        if (!hostIds || !topic) {
          return NextResponse.json(
            { error: 'Missing hostIds or topic' },
            { status: 400 }
          );
        }
        const result = await service.startLiveConversation(hostIds, topic);
        return NextResponse.json(result);
      }

      case 'nextTurn': {
        const { hostId } = params;
        if (!hostId) {
          return NextResponse.json(
            { error: 'Missing hostId' },
            { status: 400 }
          );
        }
        const result = await service.generateNextTurn(hostId);
        return NextResponse.json(result);
      }

      case 'userJoin': {
        const { userName, message } = params;
        if (!userName || !message) {
          return NextResponse.json(
            { error: 'Missing userName or message' },
            { status: 400 }
          );
        }
        const result = await service.userJoinDebate(userName, message);
        return NextResponse.json(result);
      }

      case 'getState': {
        const state = service.getConversationState();
        return NextResponse.json(state);
      }

      case 'stop': {
        service.stopConversation();
        return NextResponse.json({ success: true });
      }

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Multi-host dialogue error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  const service = getMultiHostDialogueService();
  const state = service.getConversationState();
  return NextResponse.json(state);
}

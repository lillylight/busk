import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth } from '@/lib/admin-auth';

// In-memory storage for demo - replace with database
let shows = [
  {
    id: '1',
    name: 'Morning Vibes',
    type: 'music',
    schedule: 'Daily 6:00 AM - 10:00 AM',
    status: 'active',
    hosts: ['DJ Echo'],
    description: 'Start your day with energetic music and positive vibes',
    streamUrl: '',
    useAIHost: true,
  },
  {
    id: '2',
    name: 'Tech Talk Today',
    type: 'talk',
    schedule: 'Mon-Fri 2:00 PM - 3:00 PM',
    status: 'active',
    hosts: ['Alex Chen', 'Maya Rodriguez'],
    description: 'Deep dive into technology trends and innovations',
    streamUrl: '',
    useAIHost: true,
  },
  {
    id: '3',
    name: 'Late Night Jazz',
    type: 'music',
    schedule: 'Daily 10:00 PM - 2:00 AM',
    status: 'scheduled',
    hosts: ['DJ Smooth'],
    description: 'Smooth jazz to end your day',
    streamUrl: '',
    useAIHost: true,
  },
];

// GET all shows
export const GET = withAdminAuth(async (req: NextRequest) => {
  return NextResponse.json({ shows });
});

// POST create new show
export const POST = withAdminAuth(async (req: NextRequest) => {
  try {
    const body = await req.json();
    
    const newShow = {
      id: Date.now().toString(),
      ...body,
      status: 'scheduled',
      createdAt: new Date().toISOString(),
    };
    
    shows.push(newShow);
    
    return NextResponse.json({ 
      success: true, 
      show: newShow 
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create show' },
      { status: 400 }
    );
  }
});

// PUT update show
export const PUT = withAdminAuth(async (req: NextRequest) => {
  try {
    const body = await req.json();
    const { id, ...updates } = body;
    
    const showIndex = shows.findIndex(s => s.id === id);
    if (showIndex === -1) {
      return NextResponse.json(
        { error: 'Show not found' },
        { status: 404 }
      );
    }
    
    shows[showIndex] = { ...shows[showIndex], ...updates };
    
    return NextResponse.json({ 
      success: true, 
      show: shows[showIndex] 
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update show' },
      { status: 400 }
    );
  }
});

// DELETE remove show
export const DELETE = withAdminAuth(async (req: NextRequest) => {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'Show ID required' },
        { status: 400 }
      );
    }
    
    const showIndex = shows.findIndex(s => s.id === id);
    if (showIndex === -1) {
      return NextResponse.json(
        { error: 'Show not found' },
        { status: 404 }
      );
    }
    
    shows.splice(showIndex, 1);
    
    return NextResponse.json({ 
      success: true,
      message: 'Show deleted successfully' 
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete show' },
      { status: 400 }
    );
  }
});

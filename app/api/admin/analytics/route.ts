import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth } from '@/lib/admin-auth';

// GET analytics data
export const GET = withAdminAuth(async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  const period = searchParams.get('period') || '7d'; // 7d, 30d, 90d

  // Simulated analytics data - replace with real data from your analytics service
  const analytics = {
    overview: {
      totalListeners: 12456,
      uniqueListeners: 8234,
      totalListeningHours: 45678,
      averageSessionDuration: 28, // minutes
      peakConcurrentListeners: 567,
      growth: {
        listeners: 12.5,
        hours: 23.8,
        revenue: 15.2,
      }
    },
    
    listenersByLocation: [
      { country: 'Nigeria', city: 'Lagos', count: 3456, percentage: 27.8 },
      { country: 'Kenya', city: 'Nairobi', count: 2345, percentage: 18.9 },
      { country: 'South Africa', city: 'Johannesburg', count: 1890, percentage: 15.2 },
      { country: 'Ghana', city: 'Accra', count: 1567, percentage: 12.6 },
      { country: 'USA', city: 'New York', count: 1234, percentage: 9.9 },
      { country: 'UK', city: 'London', count: 987, percentage: 7.9 },
      { country: 'Others', city: 'Various', count: 977, percentage: 7.7 },
    ],
    
    showPerformance: [
      {
        showId: '1',
        showName: 'Morning Vibes',
        averageListeners: 456,
        peakListeners: 789,
        totalHours: 1234,
        engagement: 87.5,
        revenue: 567.89,
      },
      {
        showId: '2',
        showName: 'Tech Talk Today',
        averageListeners: 234,
        peakListeners: 456,
        totalHours: 567,
        engagement: 92.3,
        revenue: 345.67,
      },
      {
        showId: '3',
        showName: 'Late Night Jazz',
        averageListeners: 123,
        peakListeners: 234,
        totalHours: 345,
        engagement: 78.9,
        revenue: 123.45,
      },
    ],
    
    revenue: {
      total: 4567.89,
      breakdown: {
        tips: 1234.56,
        callIns: 890.12,
        ads: 2345.67,
        subscriptions: 97.54,
      },
      topContributors: [
        { wallet: '0x1234...5678', amount: 234.56, count: 12 },
        { wallet: '0x8765...4321', amount: 123.45, count: 8 },
        { wallet: '0x2468...1357', amount: 89.12, count: 5 },
      ],
    },
    
    engagement: {
      totalRequests: 3456,
      requestTypes: {
        shoutouts: 1234,
        dedications: 890,
        songRequests: 678,
        callIns: 456,
        tips: 198,
      },
      peakHours: [
        { hour: 8, listeners: 567 },
        { hour: 9, listeners: 789 },
        { hour: 14, listeners: 456 },
        { hour: 20, listeners: 678 },
        { hour: 21, listeners: 890 },
      ],
    },
    
    // Time series data for charts
    timeSeries: generateTimeSeriesData(period),
  };

  return NextResponse.json(analytics);
});

// Helper function to generate time series data
function generateTimeSeriesData(period: string) {
  const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
  const data = [];
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    
    data.push({
      date: date.toISOString().split('T')[0],
      listeners: Math.floor(Math.random() * 500) + 200,
      revenue: Math.random() * 200 + 50,
      requests: Math.floor(Math.random() * 100) + 20,
    });
  }
  
  return data;
}

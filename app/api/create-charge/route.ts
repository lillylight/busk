import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { amount, description, metadata } = await req.json();

    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-CC-Api-Key': process.env.COINBASE_COMMERCE_API_KEY!
      },
      body: JSON.stringify({
        local_price: { 
          amount: amount.toString(), 
          currency: 'USD' 
        },
        pricing_type: 'fixed_price',
        name: 'BUSK Radio Payment',
        description: description || 'Payment to BUSK Radio',
        metadata: metadata || {}
      }),
    };

    const response = await fetch('https://api.commerce.coinbase.com/charges', options);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || 'Failed to create charge');
    }

    return NextResponse.json({ id: data.data.id });
  } catch (error) {
    console.error('Error creating charge:', error);
    return NextResponse.json(
      { error: 'Failed to create charge' },
      { status: 500 }
    );
  }
}

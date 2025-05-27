'use client';

import { Checkout, CheckoutButton, CheckoutStatus } from '@coinbase/onchainkit/checkout';
import type { LifecycleStatus } from '@coinbase/onchainkit/checkout';
import { useToast } from '@/hooks/use-toast';

interface OnchainCheckoutProps {
  productId?: string;
  chargeHandler?: () => Promise<string>;
  amount: number;
  description: string;
  onSuccess?: (chargeId: string) => void;
  buttonText?: string;
  className?: string;
}

export function OnchainCheckout({ 
  productId, 
  chargeHandler, 
  amount, 
  description, 
  onSuccess,
  buttonText = 'Pay',
  className = ''
}: OnchainCheckoutProps) {
  const { toast } = useToast();

  // Create a charge handler if not provided
  const createCharge = async () => {
    const response = await fetch('/api/create-charge', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount,
        description,
        metadata: {
          type: 'tip',
          description
        }
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to create charge');
    }

    const { id } = await response.json();
    return id;
  };

  const handleStatus = (status: LifecycleStatus) => {
    const { statusName, statusData } = status;
    
    switch (statusName) {
      case 'success':
        toast({
          title: "Payment Successful!",
          description: `Your payment of $${amount} has been processed.`,
          duration: 5000,
        });
        if (onSuccess && statusData.chargeId) {
          onSuccess(statusData.chargeId);
        }
        break;
      case 'error':
        toast({
          title: "Payment Failed",
          description: "There was an error processing your payment. Please try again.",
          variant: "destructive",
          duration: 5000,
        });
        break;
    }
  };

  return (
    <Checkout 
      productId={productId}
      chargeHandler={chargeHandler || (!productId ? createCharge : undefined)}
      onStatus={handleStatus}
    >
      <CheckoutButton 
        className="bg-[#ff5722] hover:bg-[#f4511e] text-white px-4 py-1.5 text-sm"
        text={buttonText}
      />
      <CheckoutStatus />
    </Checkout>
  );
}

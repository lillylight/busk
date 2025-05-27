import { NextRequest } from 'next/server';
import { createPublicClient, http, isAddress } from 'viem';
import { base } from 'viem/chains';

const ADMIN_ENS = 'aiancestry.base.eth';
const ADMIN_ADDRESS_CACHE_KEY = 'admin_wallet_address';

// Cache the resolved address to avoid repeated ENS lookups
let cachedAdminAddress: string | null = null;

export async function resolveAdminAddress(): Promise<string> {
  if (cachedAdminAddress) {
    return cachedAdminAddress;
  }

  try {
    const client = createPublicClient({
      chain: base,
      transport: http(),
    });

    // Resolve ENS to address
    const address = await client.getEnsAddress({
      name: ADMIN_ENS,
    });

    if (address) {
      cachedAdminAddress = address;
      return address;
    }
  } catch (error) {
    console.error('Error resolving ENS:', error);
  }

  // Fallback: If ENS resolution fails, you can hardcode your address here
  // cachedAdminAddress = '0xYourWalletAddress';
  
  throw new Error('Failed to resolve admin ENS address');
}

export async function verifyAdminAuth(request: NextRequest): Promise<{
  isAuthenticated: boolean;
  walletAddress?: string;
  error?: string;
}> {
  try {
    // Get wallet address from headers (set by wallet connection)
    const walletAddress = request.headers.get('x-wallet-address');
    
    if (!walletAddress) {
      return {
        isAuthenticated: false,
        error: 'No wallet connected',
      };
    }

    if (!isAddress(walletAddress)) {
      return {
        isAuthenticated: false,
        error: 'Invalid wallet address',
      };
    }

    // Get admin address
    const adminAddress = await resolveAdminAddress();

    // Check if the connected wallet matches admin wallet
    const isAdmin = walletAddress.toLowerCase() === adminAddress.toLowerCase();

    return {
      isAuthenticated: isAdmin,
      walletAddress: isAdmin ? walletAddress : undefined,
      error: isAdmin ? undefined : 'Unauthorized wallet',
    };
  } catch (error) {
    console.error('Auth verification error:', error);
    return {
      isAuthenticated: false,
      error: 'Authentication error',
    };
  }
}

// Middleware helper for API routes
export function withAdminAuth(
  handler: (req: NextRequest) => Promise<Response>
) {
  return async (req: NextRequest) => {
    const auth = await verifyAdminAuth(req);
    
    if (!auth.isAuthenticated) {
      return new Response(
        JSON.stringify({ error: auth.error || 'Unauthorized' }),
        { 
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Add admin wallet to request for use in handler
    (req as any).adminWallet = auth.walletAddress;
    
    return handler(req);
  };
}

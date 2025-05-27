# AI Radio Station

An innovative AI-powered radio station featuring multiple AI hosts, live talk shows, music generation, and interactive user participation.

## Features

- **AI-Powered Radio Shows**: Multiple AI hosts with distinct personalities
- **Live Talk Shows**: Real-time AI conversations with multi-host debates
- **User Interaction**: Join debates, request songs, call in, and more
- **Music Generation**: AI-generated music based on user requests
- **Blockchain Integration**: Payments and tipping via Base network
- **Real-time Streaming**: WebRTC-based audio streaming

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **AI**: OpenAI GPT-4, Text-to-Speech, Real-time API
- **Blockchain**: Wagmi, Viem, OnchainKit, Coinbase Commerce
- **Streaming**: WebRTC, Web Audio API
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- OpenAI API key
- Coinbase Commerce account
- WalletConnect project

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/ai-radio-station.git
cd ai-radio-station
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

4. Fill in your API keys in `.env`

5. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Deployment

### Vercel Deployment

1. Push your code to GitHub
2. Import the project in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

The project is configured with `vercel.json` for optimal performance.

## Environment Variables

- `OPENAI_API_KEY`: Your OpenAI API key
- `NEXT_PUBLIC_ONCHAINKIT_API_KEY`: OnchainKit API key
- `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`: WalletConnect project ID
- `COINBASE_COMMERCE_API_KEY`: Coinbase Commerce API key
- `NEXT_PUBLIC_PRODUCT_ID`: Coinbase product ID
- `COINBASE_DEVELOPER_PLATFORM_PRODUCT_KEY`: Developer platform key

## Admin Dashboard

The admin dashboard (coming soon) will be accessible only to the wallet address: `aiancestry.base.eth`

Features will include:
- Show management
- Live streaming controls
- Playlist creation
- Analytics dashboard
- Payment tracking
- Ad space management

## Contributing

This is a private project. Access is restricted.

## License

All rights reserved. This project is proprietary and confidential.

import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Admin Dashboard - AI Radio Station',
  description: 'Manage your AI Radio Station',
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      {children}
    </div>
  )
}

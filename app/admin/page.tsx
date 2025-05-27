'use client'

import { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  Radio,
  Calendar,
  Music,
  DollarSign,
  BarChart3,
  Settings,
  Users,
  Megaphone,
  Shield,
  LogOut,
  Plus,
  Edit,
  Trash2,
  Play,
  Pause,
  SkipForward,
  Mic,
  Headphones,
  TrendingUp,
  Clock,
  Eye,
  Loader2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'

const ADMIN_ENS = 'aiancestry.base.eth'

export default function AdminDashboard() {
  const { address, isConnected } = useAccount()
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')

  // Stats state
  const [stats, setStats] = useState({
    totalListeners: 0,
    activeShows: 0,
    revenue: 0,
    adImpressions: 0,
  })

  // Check authorization
  useEffect(() => {
    const checkAuth = async () => {
      if (!isConnected || !address) {
        router.push('/')
        return
      }

      try {
        // For now, we'll do a simple address check
        // In production, this should verify against ENS
        const isAdmin = address.toLowerCase() === ADMIN_ENS.toLowerCase() || 
                       address.toLowerCase() === '0x' + ADMIN_ENS.toLowerCase() // Fallback for testing
        
        if (!isAdmin) {
          toast({
            title: 'Unauthorized',
            description: 'This dashboard is restricted to admin only.',
            variant: 'destructive',
          })
          router.push('/')
          return
        }

        setIsAuthorized(true)
        setIsLoading(false)
        
        // Load initial data
        loadDashboardData()
      } catch (error) {
        console.error('Auth error:', error)
        router.push('/')
      }
    }

    checkAuth()
  }, [address, isConnected, router, toast])

  // Load dashboard data
  const loadDashboardData = async () => {
    // Simulate loading data - replace with actual API calls
    setStats({
      totalListeners: 1234,
      activeShows: 3,
      revenue: 4567.89,
      adImpressions: 98765,
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    )
  }

  if (!isAuthorized) {
    return null
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <motion.aside
        initial={{ x: -300 }}
        animate={{ x: 0 }}
        className="w-64 bg-white border-r border-gray-200 p-6"
      >
        <div className="flex items-center gap-3 mb-8">
          <div className="p-2 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg">
            <Radio className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="font-bold text-lg">AI Radio Admin</h2>
            <p className="text-xs text-gray-500">Dashboard</p>
          </div>
        </div>

        <nav className="space-y-2">
          {[
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'shows', label: 'Show Management', icon: Calendar },
            { id: 'streaming', label: 'Live Streaming', icon: Radio },
            { id: 'playlists', label: 'Playlists', icon: Music },
            { id: 'analytics', label: 'Analytics', icon: TrendingUp },
            { id: 'payments', label: 'Payments', icon: DollarSign },
            { id: 'ads', label: 'Ad Space', icon: Megaphone },
            { id: 'settings', label: 'Settings', icon: Settings },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                activeTab === item.id
                  ? 'bg-purple-50 text-purple-600'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <item.icon className="h-5 w-5" />
              <span className="text-sm font-medium">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="mt-auto pt-8">
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg mb-4">
            <Shield className="h-5 w-5 text-green-600" />
            <div className="flex-1">
              <p className="text-xs font-medium text-gray-900">Secure Access</p>
              <p className="text-xs text-gray-500 truncate">{address}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            className="w-full justify-start gap-2"
            onClick={() => router.push('/')}
          >
            <LogOut className="h-4 w-4" />
            Exit Dashboard
          </Button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-7xl mx-auto"
        >
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-500 mt-1">Manage your AI Radio Station</p>
          </div>

          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Listeners</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.totalListeners.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">+12% from last month</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Active Shows</CardTitle>
                    <Radio className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.activeShows}</div>
                    <p className="text-xs text-muted-foreground">2 music, 1 talk show</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Revenue</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">${stats.revenue.toFixed(2)}</div>
                    <p className="text-xs text-muted-foreground">+23% from last month</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Ad Impressions</CardTitle>
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.adImpressions.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">+8% from last week</p>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>Latest events in your radio station</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { time: '2 hours ago', event: 'New listener joined from Lagos', icon: Users },
                      { time: '3 hours ago', event: 'Morning Show reached 500 listeners', icon: TrendingUp },
                      { time: '5 hours ago', event: 'Ad campaign "Summer Vibes" started', icon: Megaphone },
                      { time: '1 day ago', event: 'Payment received: $125.00', icon: DollarSign },
                    ].map((activity, index) => (
                      <div key={index} className="flex items-center gap-4">
                        <div className="p-2 bg-gray-100 rounded-full">
                          <activity.icon className="h-4 w-4 text-gray-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{activity.event}</p>
                          <p className="text-xs text-gray-500">{activity.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Shows Management Tab */}
          {activeTab === 'shows' && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Show Management</CardTitle>
                    <CardDescription>Create and manage your radio shows</CardDescription>
                  </div>
                  <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    Add New Show
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    {
                      name: 'Morning Vibes',
                      type: 'Music',
                      schedule: 'Daily 6:00 AM - 10:00 AM',
                      status: 'active',
                      hosts: ['DJ Echo'],
                    },
                    {
                      name: 'Tech Talk Today',
                      type: 'Talk Show',
                      schedule: 'Mon-Fri 2:00 PM - 3:00 PM',
                      status: 'active',
                      hosts: ['Alex Chen', 'Maya Rodriguez'],
                    },
                    {
                      name: 'Late Night Jazz',
                      type: 'Music',
                      schedule: 'Daily 10:00 PM - 2:00 AM',
                      status: 'scheduled',
                      hosts: ['DJ Smooth'],
                    },
                  ].map((show, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-lg ${
                          show.type === 'Music' ? 'bg-purple-100' : 'bg-blue-100'
                        }`}>
                          {show.type === 'Music' ? (
                            <Headphones className="h-5 w-5 text-purple-600" />
                          ) : (
                            <Mic className="h-5 w-5 text-blue-600" />
                          )}
                        </div>
                        <div>
                          <h4 className="font-semibold">{show.name}</h4>
                          <p className="text-sm text-gray-500">{show.schedule}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant={show.status === 'active' ? 'default' : 'secondary'}>
                              {show.status}
                            </Badge>
                            <span className="text-xs text-gray-500">
                              Hosts: {show.hosts.join(', ')}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Live Streaming Tab */}
          {activeTab === 'streaming' && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Live Streaming Control</CardTitle>
                  <CardDescription>Manage live broadcasts and streaming</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <div className="h-3 w-3 bg-green-500 rounded-full animate-pulse" />
                          <div className="absolute inset-0 h-3 w-3 bg-green-500 rounded-full animate-ping" />
                        </div>
                        <div>
                          <h4 className="font-semibold">Currently Live: Morning Vibes</h4>
                          <p className="text-sm text-gray-600">234 listeners • Started 2 hours ago</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm">
                          <SkipForward className="h-4 w-4 mr-1" />
                          Next Track
                        </Button>
                        <Button variant="destructive" size="sm">
                          <Pause className="h-4 w-4 mr-1" />
                          End Stream
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base">Stream Settings</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm">Audio Quality</span>
                            <Badge>320 kbps</Badge>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm">Stream URL</span>
                            <Button variant="link" size="sm">Copy</Button>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm">Recording</span>
                            <Badge variant="secondary">Enabled</Badge>
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base">External Stream</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <p className="text-sm text-gray-600">
                            Connect your own streaming source
                          </p>
                          <input
                            type="text"
                            placeholder="rtmp://your-stream-url"
                            className="w-full px-3 py-2 text-sm border rounded-md"
                          />
                          <Button className="w-full" size="sm">
                            Connect Stream
                          </Button>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Playlists Tab */}
          {activeTab === 'playlists' && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Playlist Management</CardTitle>
                    <CardDescription>Create and manage music playlists</CardDescription>
                  </div>
                  <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    Create Playlist
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[
                    { name: 'Morning Energy', tracks: 45, duration: '3h 12m', mood: 'Upbeat' },
                    { name: 'Chill Afternoon', tracks: 32, duration: '2h 28m', mood: 'Relaxed' },
                    { name: 'Late Night Vibes', tracks: 28, duration: '2h 05m', mood: 'Smooth' },
                    { name: 'Weekend Party', tracks: 60, duration: '4h 15m', mood: 'Energetic' },
                    { name: 'Focus Flow', tracks: 25, duration: '1h 45m', mood: 'Ambient' },
                    { name: 'AI Generated Mix', tracks: 50, duration: '3h 30m', mood: 'Dynamic' },
                  ].map((playlist, index) => (
                    <Card key={index} className="cursor-pointer hover:shadow-lg transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <Music className="h-8 w-8 text-purple-600" />
                          <Badge variant="secondary">{playlist.mood}</Badge>
                        </div>
                        <h4 className="font-semibold mb-1">{playlist.name}</h4>
                        <p className="text-sm text-gray-500">
                          {playlist.tracks} tracks • {playlist.duration}
                        </p>
                        <div className="flex items-center gap-2 mt-3">
                          <Button variant="ghost" size="sm" className="h-8 px-2">
                            <Play className="h-3 w-3 mr-1" />
                            Play
                          </Button>
                          <Button variant="ghost" size="sm" className="h-8 px-2">
                            <Edit className="h-3 w-3" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Other tabs would be implemented similarly */}
          {['analytics', 'payments', 'ads', 'settings'].includes(activeTab) && (
            <Card>
              <CardContent className="p-12 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                  <Settings className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold mb-2">
                  {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Section
                </h3>
                <p className="text-gray-500">
                  This section is under development and will be available soon.
                </p>
              </CardContent>
            </Card>
          )}
        </motion.div>
      </main>
    </div>
  )
}

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { analyticsApi } from '@/api/analytics'
import { DashboardStats } from '@/types'
import { Users, Shield, GraduationCap, Calendar, TrendingUp, Clock, BookOpen, BarChart3, UserPlus, Upload, Search, Settings, Bell, Eye, UserCheck, Activity, Award, Target } from 'lucide-react'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area, XAxis, YAxis } from 'recharts'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    fetchDashboardStats()
  }, [])

  const fetchDashboardStats = async () => {
    try {
      const data = await analyticsApi.getDashboardStats()
      setStats(data)
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 fade-in">
        <div className="text-center space-y-4">
          <LoadingSpinner size="lg" />
          <p className="text-gray-500 dark:text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  const adminStats = stats?.admin

  const statCards = [
    {
      title: 'Total Students',
      value: adminStats?.totalStudents || 0,
      icon: GraduationCap,
      trend: '+12%',
      description: 'Registered students',
      gradient: 'stat-card-info'
    },
    {
      title: 'Active Brigades',
      value: adminStats?.totalBrigades || 0,
      icon: Shield,
      trend: '+3%',
      description: 'Organization units',
      gradient: 'stat-card-success'
    },
    {
      title: 'Brigade Leaders',
      value: adminStats?.totalBrigadeLeads || 0,
      icon: Users,
      trend: '+8%',
      description: 'Leadership team',
      gradient: 'stat-card-warning'
    },
    {
      title: 'Today\'s Attendance',
      value: adminStats?.todayAttendance || 0,
      icon: Activity,
      trend: `${adminStats?.overallAttendancePercentage || 0}%`,
      description: 'Present today',
      gradient: 'stat-card-error'
    }
  ]

  const attendanceData = adminStats ? [
    { name: 'Present', value: parseFloat(adminStats.overallAttendancePercentage || '0'), color: '#10B981' },
    { name: 'Absent', value: 100 - parseFloat(adminStats.overallAttendancePercentage || '0'), color: '#EF4444' }
  ] : []

  const renderOverview = () => (
    <div className="space-y-8 fade-in">
      {/* Welcome Section */}
      <div className="text-center space-y-4 mb-12">
        <div className="relative">
          <h1 className="text-4xl font-bold text-gradient mb-4">
            Admin Dashboard
          </h1>
          <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-purple-500/20 blur-3xl opacity-30 -z-10" />
        </div>
        <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Comprehensive overview and management center for the Ignite Attendance System
        </p>
      </div>

      {/* Enhanced Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat, index) => (
          <Card key={index} className={`${stat.gradient} scale-in delay-${index + 1} group cursor-pointer`}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-white/80">{stat.title}</p>
                  <div className="flex items-baseline space-x-2">
                    <p className="text-3xl font-bold text-white">{stat.value.toLocaleString()}</p>
                    <span className="text-xs bg-white/20 px-2 py-1 rounded-full text-white/90">
                      {stat.trend}
                    </span>
                  </div>
                  <p className="text-xs text-white/70">{stat.description}</p>
                </div>
                <div className="p-3 bg-white/20 rounded-2xl group-hover:scale-110 transition-transform duration-300">
                  <stat.icon className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts and Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Overall Attendance Chart */}
        <Card className="dashboard-card">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-bold text-gray-900 dark:text-white">
                  Attendance Overview
                </CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-400">
                  System-wide attendance metrics
                </CardDescription>
              </div>
              <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl">
                <Target className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {adminStats && (
              <div className="space-y-6">
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={attendanceData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={8}
                        dataKey="value"
                      >
                        {attendanceData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value) => [`${value}%`, '']}
                        contentStyle={{
                          backgroundColor: 'rgba(255, 255, 255, 0.9)',
                          border: 'none',
                          borderRadius: '12px',
                          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="text-center space-y-2">
                  <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                    {adminStats.overallAttendancePercentage}%
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Overall Attendance Rate</p>
                  <div className="flex justify-center space-x-4 text-xs">
                    <div className="flex items-center space-x-1">
                      <div className="w-3 h-3 bg-green-500 rounded-full" />
                      <span>Present</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <div className="w-3 h-3 bg-red-500 rounded-full" />
                      <span>Absent</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Current Event Info */}
        <Card className="dashboard-card">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-bold text-gray-900 dark:text-white">
                  Current Event
                </CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-400">
                  Active event information
                </CardDescription>
              </div>
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                <Calendar className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {adminStats?.currentEvent ? (
              <div className="space-y-6">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-primary to-purple-500 rounded-xl flex items-center justify-center">
                    <Calendar className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                      {adminStats.currentEvent.name}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {adminStats.currentEvent.totalDays} days • Multi-session event
                    </p>
                  </div>
                </div>
                
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                      Event Progress
                    </span>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                      <span className="text-sm text-blue-700 dark:text-blue-300 font-medium">
                        Active
                      </span>
                    </div>
                  </div>
                  <div className="bg-blue-200 dark:bg-blue-700 rounded-full h-3 overflow-hidden">
                    <div className="bg-gradient-to-r from-blue-500 to-indigo-500 h-3 rounded-full w-2/3 transition-all duration-700" />
                  </div>
                  <p className="text-xs text-blue-600 dark:text-blue-300 mt-2">67% Complete</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-white/50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700">
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {adminStats.todayAttendance}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Today's Present</p>
                  </div>
                  <div className="text-center p-4 bg-white/50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700">
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {adminStats.currentEvent.totalDays}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Total Days</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 space-y-4">
                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto">
                  <Calendar className="h-8 w-8 text-gray-400" />
                </div>
                <div>
                  <p className="text-gray-500 dark:text-gray-400 mb-2">No active event</p>
                  <Button size="sm" className="btn-primary">
                    Create Event
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="dashboard-card">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-gray-900 dark:text-white flex items-center space-x-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <Settings className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <span>Quick Actions</span>
          </CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400">
            Common administrative tasks and shortcuts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Add Student', icon: UserPlus, color: 'bg-blue-500 hover:bg-blue-600' },
              { label: 'Create Brigade', icon: Shield, color: 'bg-green-500 hover:bg-green-600' },
              { label: 'New Event', icon: Calendar, color: 'bg-purple-500 hover:bg-purple-600' },
              { label: 'View Analytics', icon: BarChart3, color: 'bg-orange-500 hover:bg-orange-600' }
            ].map((action, index) => (
              <Button
                key={index}
                variant="outline"
                className={`h-20 flex-col space-y-2 border-2 border-dashed border-gray-200 dark:border-gray-700 hover:border-primary hover:bg-primary/5 transition-all duration-300 hover:scale-105 group`}
              >
                <action.icon className="h-6 w-6 text-gray-500 dark:text-gray-400 group-hover:text-primary transition-colors" />
                <span className="text-sm font-medium text-gray-600 dark:text-gray-300 group-hover:text-primary transition-colors">
                  {action.label}
                </span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const renderInstructions = () => (
    <div className="space-y-8 fade-in">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gradient mb-4">Admin Operations Guide</h2>
        <p className="text-lg text-gray-600 dark:text-gray-400">Complete guide for all administrative functions in the Ignite Attendance System</p>
      </div>

      {/* Enhanced Instruction Cards */}
      {[
        {
          title: 'Dashboard Overview',
          icon: BarChart3,
          color: 'blue',
          content: (
            <div className="space-y-4">
              <p className="text-gray-700 dark:text-gray-300">The admin dashboard provides a comprehensive overview of the system:</p>
              <ul className="space-y-2 text-gray-600 dark:text-gray-400">
                <li className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2" />
                  <span>Total students, brigades, and brigade leads count</span>
                </li>
                <li className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2" />
                  <span>Today's attendance statistics and trends</span>
                </li>
                <li className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2" />
                  <span>Overall attendance percentage across the system</span>
                </li>
                <li className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2" />
                  <span>Current event information and progress tracking</span>
                </li>
              </ul>
            </div>
          )
        },
        {
          title: 'Managing Students',
          icon: GraduationCap,
          color: 'green',
          content: (
            <div className="space-y-6">
              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-xl border border-green-200 dark:border-green-800">
                <h4 className="font-semibold text-green-800 dark:text-green-200 mb-3 flex items-center space-x-2">
                  <Eye className="h-4 w-4" />
                  <span>Viewing Students</span>
                </h4>
                <ol className="list-decimal list-inside space-y-1 text-green-700 dark:text-green-300 text-sm">
                  <li>Navigate to "Students" from the sidebar</li>
                  <li>Use the search bar to find specific students</li>
                  <li>Filter by brigade using the dropdown</li>
                  <li>View student details including roll number, name, email, and brigade</li>
                </ol>
              </div>
              
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-200 dark:border-blue-800">
                <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-3 flex items-center space-x-2">
                  <UserPlus className="h-4 w-4" />
                  <span>Adding Individual Students</span>
                </h4>
                <ol className="list-decimal list-inside space-y-1 text-blue-700 dark:text-blue-300 text-sm">
                  <li>Click "Add Student" button</li>
                  <li>Fill in required information (Roll Number, Name, Email, Brigade)</li>
                  <li>Check "Create user account" to enable login</li>
                  <li>Click "Create" to add the student</li>
                </ol>
              </div>
            </div>
          )
        }
      ].map((section, index) => (
        <Card key={index} className={`dashboard-card delay-${index + 1}`}>
          <CardHeader>
            <CardTitle className={`flex items-center space-x-3 text-xl text-${section.color}-600 dark:text-${section.color}-400`}>
              <div className={`p-2 bg-${section.color}-100 dark:bg-${section.color}-900/30 rounded-lg`}>
                <section.icon className="h-5 w-5" />
              </div>
              <span>{section.title}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {section.content}
          </CardContent>
        </Card>
      ))}
    </div>
  )

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-white/20 dark:border-gray-700/20 rounded-xl p-1">
          <TabsTrigger 
            value="overview" 
            className="rounded-lg font-medium transition-all duration-300 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:shadow-lg"
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger 
            value="guide"
            className="rounded-lg font-medium transition-all duration-300 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:shadow-lg"
          >
            <BookOpen className="h-4 w-4 mr-2" />
            User Guide
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          {renderOverview()}
        </TabsContent>

        <TabsContent value="guide" className="mt-6">
          {renderInstructions()}
        </TabsContent>
      </Tabs>
    </div>
  )
}
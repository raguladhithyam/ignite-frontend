import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { analyticsApi } from '@/api/analytics'
import { DashboardStats } from '@/types'
import { User, BookOpen, Calendar, TrendingUp, FileText, BarChart3, Bell, Settings, History, Lock } from 'lucide-react'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

export default function StudentDashboard() {
  const [activeTab, setActiveTab] = useState('instructions')
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [showFirstLoginModal, setShowFirstLoginModal] = useState(false)

  useEffect(() => {
  // Show the popup when component mounts (first visit to profile page)
    setShowFirstLoginModal(true)
  }, [])

  const fetchDashboardStats = async () => {
    setLoading(true)
    try {
      const data = await analyticsApi.getDashboardStats()
      setStats(data)
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error)
    } finally {
      setLoading(false)
    }
  }

  interface TabChangeHandler {
    (tab: 'instructions' | 'analytics'): void
  }

  const handleTabChange: TabChangeHandler = (tab) => {
    setActiveTab(tab)
    if (tab === 'analytics' && !stats) {
      fetchDashboardStats()
    }
  }

  const renderInstructions = () => (
    <div className="space-y-8">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h2 className="text-2xl font-bold text-blue-900 mb-4 flex items-center gap-2">
          <FileText className="h-6 w-6" />
          Student Guide - Instructions
        </h2>
        <p className="text-blue-700">
          Welcome to the Ignite Attendance Management System. This guide will help you understand all the features available to you as a student.
        </p>
      </div>

      {/* Dashboard Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-blue-600" />
            Dashboard Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-700">Your personalized dashboard displays:</p>
          <ul className="list-disc pl-6 space-y-2 text-gray-600">
            <li><strong>Personal Information:</strong> Name, roll number, and brigade assignment</li>
            <li><strong>Total Sessions:</strong> Complete count of all attendance sessions</li>
            <li><strong>Attendance Count:</strong> Number of sessions you've attended</li>
            <li><strong>Today's Session Information:</strong> Current day's session details</li>
            <li><strong>Overall Attendance Percentage:</strong> Your performance metrics</li>
          </ul>
        </CardContent>
      </Card>

      {/* Profile Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-green-600" />
            Viewing Profile Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="font-semibold text-green-800 mb-2">Personal Details</h3>
            <ol className="list-decimal pl-6 space-y-1 text-green-700">
              <li>Navigate to "Profile" from the sidebar menu</li>
              <li>View your complete information including:
                <ul className="list-disc pl-6 mt-2 space-y-1">
                  <li>Name and temporary roll number</li>
                  <li>Email and phone number (if provided)</li>
                  <li>Brigade assignment</li>
                  <li>Account status</li>
                </ul>
              </li>
            </ol>
          </div>
        </CardContent>
      </Card>

      {/* Password Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-orange-600" />
            Changing Your Password
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-orange-50 p-4 rounded-lg">
            <h3 className="font-semibold text-orange-800 mb-2">Password Change Process</h3>
            <ol className="list-decimal pl-6 space-y-1 text-orange-700">
              <li>Go to "Profile" section</li>
              <li>Click "Change Password" button</li>
              <li>Enter your current password</li>
              <li>Enter new password (minimum 6 characters)</li>
              <li>Confirm your new password</li>
              <li>Click "Change Password" to save</li>
            </ol>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 p-3 rounded">
            <p className="text-yellow-800 text-sm">
              <strong>Security Tip:</strong> Choose a strong password and keep it secure. Students can only change their own passwords.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Attendance History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5 text-purple-600" />
            Attendance History
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-purple-50 p-4 rounded-lg">
            <h3 className="font-semibold text-purple-800 mb-2">Viewing Your Attendance</h3>
            <ol className="list-decimal pl-6 space-y-1 text-purple-700">
              <li>Navigate to "Attendance" from the sidebar</li>
              <li>View your complete attendance history</li>
              <li>See session-wise breakdown (FN/AN):
                <ul className="list-disc pl-6 mt-2 space-y-1">
                  <li><strong>FN (Forenoon):</strong> Typically 9:00 AM - 9:30 AM</li>
                  <li><strong>AN (Afternoon):</strong> Typically 2:00 PM - 2:30 PM</li>
                </ul>
              </li>
              <li>Monitor your attendance percentage</li>
              <li>Track your performance over time</li>
            </ol>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div className="bg-green-100 p-3 rounded-lg text-center">
              <div className="text-green-600 font-semibold">Present</div>
              <div className="text-sm text-green-700">Attended session on time</div>
            </div>
            <div className="bg-red-100 p-3 rounded-lg text-center">
              <div className="text-red-600 font-semibold">Absent</div>
              <div className="text-sm text-red-700">Did not attend session</div>
            </div>
            <div className="bg-yellow-100 p-3 rounded-lg text-center">
              <div className="text-yellow-600 font-semibold">Late</div>
              <div className="text-sm text-yellow-700">Arrived after designated time</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-indigo-600" />
            Notifications
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-indigo-50 p-4 rounded-lg">
            <h3 className="font-semibold text-indigo-800 mb-2">Managing Notifications</h3>
            <ol className="list-decimal pl-6 space-y-1 text-indigo-700">
              <li>Navigate to "Notifications" from the sidebar</li>
              <li>View important announcements and updates</li>
              <li>Mark notifications as read after reviewing</li>
              <li>Filter between read and unread messages</li>
            </ol>
          </div>
        </CardContent>
      </Card>

      {/* Navigation Tips */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-gray-600" />
            Navigation & Common Features
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-800 mb-2">Navigation</h3>
              <ul className="list-disc pl-4 space-y-1 text-gray-600 text-sm">
                <li>Use sidebar menu to navigate between sections</li>
                <li>Click menu icon on mobile devices</li>
                <li>Current page is highlighted in sidebar</li>
                <li>Touch-friendly interface on mobile</li>
              </ul>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-800 mb-2">Search & Filters</h3>
              <ul className="list-disc pl-4 space-y-1 text-gray-600 text-sm">
                <li>Most lists include search functionality</li>
                <li>Use filters to narrow down results</li>
                <li>Clear filters to see all items</li>
                <li>Real-time updates for attendance</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Best Practices */}
      <Card>
        <CardHeader>
          <CardTitle className="text-green-600">Best Practices for Students</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-green-50 p-4 rounded-lg">
            <ul className="list-disc pl-6 space-y-2 text-green-700">
              <li><strong>Check your attendance regularly</strong> to stay informed about your performance</li>
              <li><strong>Keep your contact information updated</strong> through your profile</li>
              <li><strong>Attend sessions on time</strong> to avoid being marked as late</li>
              <li><strong>Contact your brigade lead</strong> if you have attendance concerns</li>
              <li><strong>Log out when finished</strong> using the system</li>
              <li><strong>Keep your password secure</strong> and don't share it with others</li>
              <li><strong>Report any suspicious activity</strong> to administrators</li>
              <li><strong>Use the system only for its intended purpose</strong></li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Support Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-blue-600">Getting Help</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold text-blue-800 mb-2">Contact Information</h3>
            <p className="text-blue-700 mb-2">
              <strong>Technical & Emergency Support:</strong> Contact your Brigade Lead
            </p>
            <div className="mt-4">
              <h4 className="font-semibold text-blue-800 mb-2">When Reporting Issues, Please Provide:</h4>
              <ul className="list-disc pl-6 space-y-1 text-blue-600 text-sm">
                <li>Your role (Student)</li>
                <li>Browser and version</li>
                <li>Steps to reproduce the issue</li>
                <li>Error messages (if any)</li>
                <li>Screenshots (if helpful)</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const renderAnalytics = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner />
        </div>
      )
    }

    const studentStats = stats?.student

    if (!studentStats) {
      return (
        <div className="text-center py-8">
          <p className="text-gray-500">No analytics data available</p>
        </div>
      )
    }

    const statCards = [
      {
        title: 'Total Sessions',
        value: studentStats.totalSessions,
        icon: BookOpen,
        color: 'bg-blue-500',
        description: 'Sessions attended'
      },
      {
        title: 'Present Sessions',
        value: studentStats.presentSessions,
        icon: Calendar,
        color: 'bg-green-500',
        description: 'Successfully attended'
      },
      {
        title: 'Today\'s Sessions',
        value: studentStats.todaySessions,
        icon: Calendar,
        color: 'bg-purple-500',
        description: 'Sessions today'
      },
      {
        title: 'Attendance Rate',
        value: `${studentStats.attendancePercentage}%`,
        icon: TrendingUp,
        color: 'bg-orange-500',
        description: 'Overall performance'
      }
    ]

    const attendanceData = [
      { name: 'Present', value: studentStats.presentSessions, color: '#10B981' },
      { name: 'Absent', value: studentStats.totalSessions - studentStats.presentSessions, color: '#EF4444' }
    ]

    const todayData = [
      { name: 'Present', value: studentStats.todayPresent },
      { name: 'Total', value: studentStats.todaySessions }
    ]

    return (
      <div className="space-y-6">
        {/* Student Info Card */}
        <Card>
          <CardHeader>
            <CardTitle>Student Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-3">
                <User className="h-8 w-8 text-blue-500" />
                <div>
                  <p className="text-sm text-gray-600">Name</p>
                  <p className="font-medium">{studentStats.studentInfo.name}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <BookOpen className="h-8 w-8 text-green-500" />
                <div>
                  <p className="text-sm text-gray-600">Roll Number</p>
                  <p className="font-medium font-mono">{studentStats.studentInfo.tempRollNumber}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="h-8 w-8 text-purple-500" />
                <div>
                  <p className="text-sm text-gray-600">Brigade</p>
                  <p className="font-medium">{studentStats.studentInfo.brigade}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((stat, index) => (
            <Card key={index} className="card-hover">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                    <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                    <p className="text-xs text-gray-500 mt-1">{stat.description}</p>
                  </div>
                  <div className={`p-3 rounded-full ${stat.color}`}>
                    <stat.icon className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Overall Attendance */}
          <Card>
            <CardHeader>
              <CardTitle>Overall Attendance</CardTitle>
              <CardDescription>
                Your attendance performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={attendanceData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {attendanceData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="text-center mt-4">
                <p className="text-2xl font-bold text-green-600">
                  {studentStats.attendancePercentage}%
                </p>
                <p className="text-sm text-gray-500">Attendance Rate</p>
              </div>
            </CardContent>
          </Card>

          {/* Today's Performance */}
          <Card>
            <CardHeader>
              <CardTitle>Today's Performance</CardTitle>
              <CardDescription>
                Sessions attended today
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={todayData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#3B82F6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="text-center mt-4">
                <p className="text-lg">
                  <span className="text-2xl font-bold text-blue-600">
                    {studentStats.todayPresent}
                  </span>
                  <span className="text-gray-500"> / {studentStats.todaySessions}</span>
                </p>
                <p className="text-sm text-gray-500">Sessions Today</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Performance Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Performance Summary</CardTitle>
            <CardDescription>
              Your attendance statistics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                  <span className="font-medium text-green-900">Sessions Attended</span>
                  <span className="text-green-600 font-bold">{studentStats.presentSessions}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                  <span className="font-medium text-red-900">Sessions Missed</span>
                  <span className="text-red-600 font-bold">
                    {studentStats.totalSessions - studentStats.presentSessions}
                  </span>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="p-4 border rounded-lg">
                  <h3 className="font-medium mb-2">Attendance Goal</h3>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Target: 90%</span>
                    <span className="text-sm font-medium">
                      Current: {studentStats.attendancePercentage}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${
                        parseFloat(studentStats.attendancePercentage) >= 90 
                          ? 'bg-green-500' 
                          : parseFloat(studentStats.attendancePercentage) >= 75 
                          ? 'bg-yellow-500' 
                          : 'bg-red-500'
                      }`}
                      style={{ width: `${Math.min(parseFloat(studentStats.attendancePercentage), 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Student Dashboard</h1>
        <p className="text-gray-600 mt-2">
          Welcome to your student portal
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => handleTabChange('instructions')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'instructions'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <FileText className="inline-block w-4 h-4 mr-2" />
            Instructions
          </button>
          <button
            onClick={() => handleTabChange('analytics')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'analytics'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <BarChart3 className="inline-block w-4 h-4 mr-2" />
            Analytics
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'instructions' && renderInstructions()}
      {activeTab === 'analytics' && renderAnalytics()}
      {/* First Login Password Change Popup */}
<Dialog open={showFirstLoginModal} onOpenChange={setShowFirstLoginModal}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Welcome! Change Your Password</DialogTitle>
      <DialogDescription>
        For security reasons, please change your password after your first login.
      </DialogDescription>
    </DialogHeader>
    
    <div className="space-y-4">
      <p className="text-sm text-gray-600">
        It's recommended to change your default password to keep your account secure.
      </p>
      
      <div className="flex justify-end space-x-2 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => setShowFirstLoginModal(false)}
        >
          Got it
        </Button>
      </div>
    </div>
  </DialogContent>
</Dialog>
    </div>
  )
}
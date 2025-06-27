import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { analyticsApi } from '@/api/analytics'
import { DashboardStats } from '@/types'
import { Users, Shield, GraduationCap, Calendar, TrendingUp, Clock, BookOpen, BarChart3, UserPlus, Upload, Search, Settings, Bell, Eye, UserCheck } from 'lucide-react'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'


export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('instructions')

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
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    )
  }

  const adminStats = stats?.admin

  const statCards = [
    {
      title: 'Total Students',
      value: adminStats?.totalStudents || 0,
      icon: GraduationCap,
      color: 'bg-blue-500',
      description: 'Registered students'
    },
    {
      title: 'Total Brigades',
      value: adminStats?.totalBrigades || 0,
      icon: Shield,
      color: 'bg-green-500',
      description: 'Active brigades'
    },
    {
      title: 'Brigade Leads',
      value: adminStats?.totalBrigadeLeads || 0,
      icon: Users,
      color: 'bg-purple-500',
      description: 'Active leaders'
    },
    {
      title: 'Today\'s Attendance',
      value: adminStats?.todayAttendance || 0,
      icon: Clock,
      color: 'bg-orange-500',
      description: 'Present today'
    }
  ]

  const attendanceData = adminStats ? [
    { name: 'Present', value: parseFloat(adminStats.overallAttendancePercentage || '0'), color: '#10B981' },
    { name: 'Absent', value: 100 - parseFloat(adminStats.overallAttendancePercentage || '0'), color: '#EF4444' }
  ] : []

  const renderInstructions = () => (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Admin Operations Guide</h2>
        <p className="text-gray-600">Complete guide for all administrative functions in the Ignite Attendance System</p>
      </div>

      {/* Dashboard Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-blue-500" />
            Dashboard Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-700 mb-4">The admin dashboard provides a comprehensive overview of the system:</p>
          <ul className="space-y-2 text-gray-600">
            <li>• Total students, brigades, and brigade leads count</li>
            <li>• Today's attendance statistics</li>
            <li>• Overall attendance percentage across the system</li>
            <li>• Current event information and progress</li>
            <li>• Quick action buttons for common tasks</li>
          </ul>
        </CardContent>
      </Card>

      {/* Managing Students */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-blue-500" />
            Managing Students
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Viewing Students
            </h4>
            <ol className="list-decimal list-inside space-y-1 text-gray-600 ml-6">
              <li>Navigate to "Students" from the sidebar</li>
              <li>Use the search bar to find specific students</li>
              <li>Filter by brigade using the dropdown</li>
              <li>View student details including roll number, name, email, and brigade</li>
            </ol>
          </div>

          <div>
            <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              Adding Individual Students
            </h4>
            <ol className="list-decimal list-inside space-y-1 text-gray-600 ml-6">
              <li>Click "Add Student" button</li>
              <li>Fill in required information:
                <ul className="list-disc list-inside ml-4 mt-1">
                  <li>Temporary Roll Number (unique)</li>
                  <li>First Name and Last Name</li>
                  <li>Email (optional)</li>
                  <li>Phone (optional)</li>
                  <li>Brigade assignment</li>
                </ul>
              </li>
              <li>Check "Create user account" to enable login</li>
              <li>Click "Create"</li>
            </ol>
          </div>

          <div>
            <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Bulk Student Upload
            </h4>
            <ol className="list-decimal list-inside space-y-1 text-gray-600 ml-6">
              <li>Click "Upload" button</li>
              <li>Download the template file first</li>
              <li>Fill the template with student data</li>
              <li>Upload the completed file</li>
              <li>Select brigade assignment (optional)</li>
              <li>Choose whether to create user accounts</li>
              <li>Review any errors and fix them</li>
              <li>Confirm the upload</li>
            </ol>
          </div>

          <div>
            <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
              <Search className="h-4 w-4" />
              Student Summary
            </h4>
            <ol className="list-decimal list-inside space-y-1 text-gray-600 ml-6">
              <li>Navigate to "Student Summary"</li>
              <li>Enter a student's roll number</li>
              <li>Click "Search"</li>
              <li>View complete student information and attendance history</li>
            </ol>
          </div>
        </CardContent>
      </Card>

      {/* Managing Brigades */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-green-500" />
            Managing Brigades
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Creating Brigades</h4>
            <ol className="list-decimal list-inside space-y-1 text-gray-600 ml-6">
              <li>Navigate to "Brigades"</li>
              <li>Click "Add Brigade"</li>
              <li>Enter brigade name</li>
              <li>Assign a brigade leader (optional)</li>
              <li>Click "Create"</li>
            </ol>
          </div>

          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Managing Brigade Members</h4>
            <ol className="list-decimal list-inside space-y-1 text-gray-600 ml-6">
              <li>Select a brigade from the list</li>
              <li>View current members</li>
              <li>Add or remove students as needed</li>
              <li>Monitor brigade performance</li>
            </ol>
          </div>
        </CardContent>
      </Card>

      {/* Managing Users */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-purple-500" />
            Managing Users
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Creating User Accounts</h4>
            <ol className="list-decimal list-inside space-y-1 text-gray-600 ml-6">
              <li>Navigate to "Users"</li>
              <li>Click "Add User"</li>
              <li>Fill in user details:
                <ul className="list-disc list-inside ml-4 mt-1">
                  <li>Email address</li>
                  <li>Password</li>
                  <li>First and Last Name</li>
                  <li>Role (Admin, Brigade Lead, Student)</li>
                </ul>
              </li>
              <li>Click "Create"</li>
            </ol>
          </div>

          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Managing Existing Users</h4>
            <ul className="space-y-1 text-gray-600 ml-6">
              <li>• Search for users by name or email</li>
              <li>• Filter by role</li>
              <li>• Edit user information</li>
              <li>• Reset passwords when needed</li>
              <li>• Deactivate users if necessary</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Event Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-orange-500" />
            Event Management
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Creating Events</h4>
            <ol className="list-decimal list-inside space-y-1 text-gray-600 ml-6">
              <li>Navigate to "Events"</li>
              <li>Click "Add Event"</li>
              <li>Enter event details:
                <ul className="list-disc list-inside ml-4 mt-1">
                  <li>Event name</li>
                  <li>Description</li>
                  <li>Start and end dates</li>
                </ul>
              </li>
              <li>Generate event days automatically</li>
              <li>Configure session times for each day</li>
              <li>Click "Create"</li>
            </ol>
          </div>

          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Managing Event Days</h4>
            <ul className="space-y-1 text-gray-600 ml-6">
              <li>• Select an event to view its days</li>
              <li>• Enable/disable FN (Forenoon) or AN (Afternoon) sessions</li>
              <li>• Adjust session timings</li>
              <li>• Monitor attendance for each day</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Attendance Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-red-500" />
            Attendance Management
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Viewing Attendance Records</h4>
            <ol className="list-decimal list-inside space-y-1 text-gray-600 ml-6">
              <li>Navigate to "Attendance"</li>
              <li>Select an event and specific day</li>
              <li>Filter by brigade or session</li>
              <li>View detailed attendance records</li>
              <li>Export data if needed</li>
            </ol>
          </div>

          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Attendance Analytics</h4>
            <ol className="list-decimal list-inside space-y-1 text-gray-600 ml-6">
              <li>Navigate to "Analytics"</li>
              <li>View overall system statistics</li>
              <li>Compare brigade performance</li>
              <li>Analyze session-wise attendance</li>
              <li>Review attendance trends over time</li>
            </ol>
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-yellow-500" />
            Notifications
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Creating Notifications</h4>
            <ol className="list-decimal list-inside space-y-1 text-gray-600 ml-6">
              <li>Navigate to "Notifications"</li>
              <li>Click "Create Notification"</li>
              <li>Enter title and message</li>
              <li>Select notification type (Info, Warning, Error, Success)</li>
              <li>Choose target audience:
                <ul className="list-disc list-inside ml-4 mt-1">
                  <li>Global (all users)</li>
                  <li>Specific role (Admin, Brigade Lead, Student)</li>
                </ul>
              </li>
              <li>Set expiration date (optional)</li>
              <li>Click "Create Notification"</li>
            </ol>
          </div>
        </CardContent>
      </Card>

      {/* System Maintenance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-gray-500" />
            System Maintenance & Best Practices
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Best Practices for Admins</h4>
            <ul className="space-y-1 text-gray-600 ml-6">
              <li>• Regularly backup data</li>
              <li>• Monitor system performance</li>
              <li>• Keep user accounts up to date</li>
              <li>• Review attendance reports regularly</li>
              <li>• Log out when finished using the system</li>
              <li>• Keep passwords secure and report suspicious activity</li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Data Management</h4>
            <ul className="space-y-1 text-gray-600 ml-6">
              <li>• Student data is backed up regularly</li>
              <li>• Attendance records are preserved</li>
              <li>• Contact administrators for data recovery needs</li>
              <li>• System updates are deployed regularly</li>
            </ul>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg mt-4">
            <h4 className="font-semibold text-blue-900 mb-2">Support Contact</h4>
            <p className="text-blue-700">
              <strong>Technical & Emergency Support:</strong> 8668113739<br/>
              <strong>Additional Support:</strong> raguladhithya03@gmail.com
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const renderAnalytics = () => (
    <div className="space-y-6">
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
              System-wide attendance percentage
            </CardDescription>
          </CardHeader>
          <CardContent>
            {adminStats && (
              <>
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
                      <Tooltip formatter={(value) => `${value}%`} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="text-center mt-4">
                  <p className="text-2xl font-bold text-green-600">
                    {adminStats.overallAttendancePercentage}%
                  </p>
                  <p className="text-sm text-gray-500">Overall Attendance Rate</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Current Event Info */}
        <Card>
          <CardHeader>
            <CardTitle>Current Event</CardTitle>
            <CardDescription>
              Active event information
            </CardDescription>
          </CardHeader>
          <CardContent>
            {adminStats?.currentEvent ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Calendar className="h-8 w-8 text-primary" />
                  <div>
                    <h3 className="font-semibold text-lg">
                      {adminStats.currentEvent.name}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {adminStats.currentEvent.totalDays} days event
                    </p>
                  </div>
                </div>
                
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-blue-900">
                      Event Progress
                    </span>
                    <span className="text-sm text-blue-700">
                      Active
                    </span>
                  </div>
                  <div className="mt-2 bg-blue-200 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full w-1/3"></div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900">
                      {adminStats.todayAttendance}
                    </p>
                    <p className="text-sm text-gray-500">Today's Present</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900">
                      {adminStats.totalStudents}
                    </p>
                    <p className="text-sm text-gray-500">Total Students</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No active event</p>
                <p className="text-sm text-gray-400 mt-1">
                  Create an event to start tracking attendance
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Common administrative tasks
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors" onClick={() => console.log('Navigate to students')}>
              <GraduationCap className="h-8 w-8 text-blue-500 mb-2" />
              <h3 className="font-medium">Manage Students</h3>
              <p className="text-sm text-gray-500">Add, edit, or view student records</p>
            </div>
            <div className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors" onClick={() => console.log('Navigate to brigades')}>
              <Shield className="h-8 w-8 text-green-500 mb-2" />
              <h3 className="font-medium">Manage Brigades</h3>
              <p className="text-sm text-gray-500">Create and organize brigades</p>
            </div>
            <div className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors" onClick={() => console.log('Navigate to analytics')}>
              <TrendingUp className="h-8 w-8 text-purple-500 mb-2" />
              <h3 className="font-medium">View Analytics</h3>
              <p className="text-sm text-gray-500">Detailed attendance reports</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600 mt-2">
          Welcome back! Here's an overview of the attendance system.
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('instructions')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'instructions'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <BookOpen className="h-4 w-4 inline-block mr-2" />
            Instructions
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'analytics'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <BarChart3 className="h-4 w-4 inline-block mr-2" />
            Analytics
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'instructions' ? renderInstructions() : renderAnalytics()}
    </div>
  )
}
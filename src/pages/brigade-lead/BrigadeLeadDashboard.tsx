import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { analyticsApi } from '@/api/analytics'
import { DashboardStats } from '@/types'
import { Users, Shield, UserCheck, TrendingUp, BookOpen, BarChart3, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'
// Navigation would be handled by your routing system

export default function BrigadeLeadDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('instructions')
  // Navigation would be handled by your routing system
  const handleNavigation = (path: string) => {
    console.log('Navigate to:', path)
    // Your navigation logic here
  }

  useEffect(() => {
    // Only fetch data when analytics tab is selected
    if (activeTab === 'analytics') {
      fetchDashboardStats()
    }
  }, [activeTab])

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

  const renderInstructions = () => (
    <div className="space-y-6">
      {/* Overview Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-blue-500" />
            Brigade Lead Operations Guide
          </CardTitle>
          <CardDescription>
            Complete guide for all Brigade Lead operations and responsibilities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-gray-600 leading-relaxed">
            <p className="mb-4">
              As a Brigade Lead, you have focused access to manage your brigades and students. 
              Your dashboard shows the number of brigades under your leadership, total students 
              in your brigades, today's attendance, and brigade-specific attendance rates.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Managing Brigade Students */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-green-500" />
            Managing Brigade Students
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Viewing Your Students</h4>
            <ul className="list-disc list-inside text-sm text-gray-600 space-y-1 ml-4">
              <li>Navigate to "Students" to view all students in your brigades</li>
              <li>Use the search bar to find specific students quickly</li>
              <li>Filter by your brigades using the dropdown menu</li>
              <li>View student details including roll number, name, email, and brigade assignment</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Marking Attendance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-purple-500" />
            Attendance Management
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Daily Attendance Process</h4>
            <ol className="list-decimal list-inside text-sm text-gray-600 space-y-1 ml-4">
              <li>Navigate to "Attendance" from the sidebar menu</li>
              <li>Verify the current event and session are correct</li>
              <li>Check session timing and status before marking</li>
              <li>Mark attendance for each student with appropriate status</li>
            </ol>
          </div>

          <div>
            <h4 className="font-medium text-gray-900 mb-2">Attendance Status Options</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <div>
                  <p className="font-medium text-green-900">Present</p>
                  <p className="text-xs text-green-600">Student attended on time</p>
                </div>
              </div>
              <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg">
                <XCircle className="h-4 w-4 text-red-500" />
                <div>
                  <p className="font-medium text-red-900">Absent</p>
                  <p className="text-xs text-red-600">Student did not attend</p>
                </div>
              </div>
              <div className="flex items-center gap-2 p-3 bg-yellow-50 rounded-lg">
                <AlertCircle className="h-4 w-4 text-yellow-500" />
                <div>
                  <p className="font-medium text-yellow-900">Late</p>
                  <p className="text-xs text-yellow-600">Student arrived late</p>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-medium text-gray-900 mb-2">Bulk Attendance Marking</h4>
            <ul className="list-disc list-inside text-sm text-gray-600 space-y-1 ml-4">
              <li>Select multiple students using checkboxes for efficient marking</li>
              <li>Use "Select All Unmarked" option for quick bulk selection</li>
              <li>Click "Mark Present" to mark all selected students as present</li>
              <li>Individual students can still be marked differently after bulk operations</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Session Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-orange-500" />
            Session Management
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Forenoon Session (FN)</h4>
              <p className="text-sm text-blue-700">Typically: 9:00 AM - 9:30 AM</p>
              <p className="text-xs text-blue-600 mt-1">Morning attendance marking window</p>
            </div>
            <div className="p-4 bg-indigo-50 rounded-lg">
              <h4 className="font-medium text-indigo-900 mb-2">Afternoon Session (AN)</h4>
              <p className="text-sm text-indigo-700">Typically: 2:00 PM - 2:30 PM</p>
              <p className="text-xs text-indigo-600 mt-1">Afternoon attendance marking window</p>
            </div>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Important Session Notes</h4>
            <ul className="list-disc list-inside text-sm text-gray-600 space-y-1 ml-4">
              <li>Sessions are time-restricted for accuracy and consistency</li>
              <li>Switch between sessions using the session buttons in the interface</li>
              <li>Ensure you're marking attendance within the designated time window</li>
              <li>Verify the session is enabled for the current day before marking</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Analytics and Reports */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-cyan-500" />
            Analytics and Reporting
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Brigade Performance Monitoring</h4>
            <ul className="list-disc list-inside text-sm text-gray-600 space-y-1 ml-4">
              <li>Navigate to "Analytics" tab to view your brigade's performance metrics</li>
              <li>Compare Forenoon (FN) vs Afternoon (AN) session attendance rates</li>
              <li>Monitor attendance trends over time to identify patterns</li>
              <li>Identify students who may need additional attention or support</li>
              <li>Track overall brigade performance and improvement areas</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Troubleshooting */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-red-500" />
            Common Issues & Troubleshooting
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Attendance Marking Issues</h4>
            <ul className="list-disc list-inside text-sm text-gray-600 space-y-1 ml-4">
              <li><strong>Cannot Mark Attendance:</strong> Check if you're within the session time window</li>
              <li><strong>Session Not Available:</strong> Verify the session is enabled for the current day</li>
              <li><strong>Permission Issues:</strong> Ensure you have permission to mark attendance for the student</li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Missing Students</h4>
            <ul className="list-disc list-inside text-sm text-gray-600 space-y-1 ml-4">
              <li>Verify the student is properly assigned to your brigade</li>
              <li>Check if the student account is active and not suspended</li>
              <li>Contact the system administrator if students are missing from your list</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Best Practices */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-emerald-500" />
            Best Practices for Brigade Leads
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-disc list-inside text-sm text-gray-600 space-y-2 ml-4">
            <li><strong>Timely Attendance:</strong> Mark attendance promptly during session times</li>
            <li><strong>Data Verification:</strong> Regularly verify student information for accuracy</li>
            <li><strong>Clear Communication:</strong> Communicate attendance requirements clearly to students</li>
            <li><strong>Quick Reporting:</strong> Report technical issues to administrators immediately</li>
            <li><strong>Regular Monitoring:</strong> Check attendance analytics regularly to identify trends</li>
            <li><strong>Student Support:</strong> Follow up with students who have poor attendance patterns</li>
          </ul>
        </CardContent>
      </Card>

      {/* Emergency Contact */}
      <Card>
        <CardHeader>
          <CardTitle>Emergency Support</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
            <p className="text-sm text-red-800">
              <strong>Technical & Emergency Support:</strong> Coordination Team
            </p>
            <p className="text-sm text-red-600 mt-2">
              For additional support: Ragul Adhithya (raguladhithya03@gmail.com)
            </p>
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

    const brigadeStats = stats?.brigadeLead

    if (!brigadeStats) {
      return (
        <div className="text-center py-8">
          <p className="text-gray-500">No analytics data available</p>
        </div>
      )
    }

    const statCards = [
      {
        title: 'My Brigades',
        value: brigadeStats.totalBrigades,
        icon: Shield,
        color: 'bg-blue-500',
        description: 'Brigades under leadership'
      },
      {
        title: 'Total Students',
        value: brigadeStats.totalStudents,
        icon: Users,
        color: 'bg-green-500',
        description: 'Students in my brigades'
      },
      {
        title: 'Today\'s Attendance',
        value: brigadeStats.todayAttendance,
        icon: UserCheck,
        color: 'bg-purple-500',
        description: 'Present today'
      },
      {
        title: 'Attendance Rate',
        value: `${brigadeStats.brigadeAttendancePercentage}%`,
        icon: TrendingUp,
        color: 'bg-orange-500',
        description: 'Overall performance'
      }
    ]

    const attendanceData = [
      { name: 'Present', value: parseFloat(brigadeStats.brigadeAttendancePercentage), color: '#10B981' },
      { name: 'Absent', value: 100 - parseFloat(brigadeStats.brigadeAttendancePercentage), color: '#EF4444' }
    ]

    return (
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
          {/* Attendance Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Brigade Attendance</CardTitle>
              <CardDescription>
                Overall attendance rate for your brigades
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
                    <Tooltip formatter={(value) => `${value}%`} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="text-center mt-4">
                <p className="text-2xl font-bold text-green-600">
                  {brigadeStats.brigadeAttendancePercentage}%
                </p>
                <p className="text-sm text-gray-500">Overall Attendance Rate</p>
              </div>
            </CardContent>
          </Card>

          {/* Brigade Performance */}
          <Card>
            <CardHeader>
              <CardTitle>Brigade Performance</CardTitle>
              <CardDescription>
                Student count by brigade
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={brigadeStats.brigades}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="studentCount" fill="#3B82F6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Brigade Details */}
        <Card>
          <CardHeader>
            <CardTitle>My Brigades</CardTitle>
            <CardDescription>
              Detailed view of brigades under your leadership
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {brigadeStats.brigades.map((brigade) => (
                <div key={brigade.id} className="p-4 border rounded-lg hover:bg-gray-50">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium">{brigade.name}</h3>
                    <Shield className="h-5 w-5 text-blue-500" />
                  </div>
                  <div className="text-sm text-gray-600">
                    <p>{brigade.studentCount} students</p>
                  </div>
                  <div className="mt-3 pt-3 border-t">
                    <div className="flex items-center justify-between text-sm">
                      <span>Performance</span>
                      <span className="font-medium text-green-600">Good</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Common tasks for brigade management
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors" onClick={() => handleNavigation('/brigade/students')}>
                <Users className="h-8 w-8 text-blue-500 mb-2" />
                <h3 className="font-medium">Manage Students</h3>
                <p className="text-sm text-gray-500">View and manage brigade students</p>
              </div>
              <div className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors" onClick={() => handleNavigation('/brigade/attendance')}>
                <UserCheck className="h-8 w-8 text-green-500 mb-2" />
                <h3 className="font-medium">Mark Attendance</h3>
                <p className="text-sm text-gray-500">Record student attendance</p>
              </div>
              <div className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors" onClick={() => handleNavigation('/brigade/analytics')}>
                <TrendingUp className="h-8 w-8 text-purple-500 mb-2" />
                <h3 className="font-medium">View Reports</h3>
                <p className="text-sm text-gray-500">Attendance analytics and reports</p>
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
        <h1 className="text-3xl font-bold text-gray-900">Brigade Lead Dashboard</h1>
        <p className="text-gray-600 mt-2">
          Manage your brigades and monitor attendance performance.
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
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Instructions
            </div>
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'analytics'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Analytics
            </div>
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'instructions' && renderInstructions()}
      {activeTab === 'analytics' && renderAnalytics()}
    </div>
  )
}
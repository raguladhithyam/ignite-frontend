import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { studentsApi } from '@/api/students'
import { Student, AttendanceRecord } from '@/types'
import { Search, User, Calendar, CheckCircle, XCircle, AlertCircle, BookOpen } from 'lucide-react'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { toast } from 'sonner'
import { formatDateTime, formatDate } from '@/lib/utils'

export default function AdminStudentSummary() {
  const [rollNumber, setRollNumber] = useState('')
  const [student, setStudent] = useState<Student | null>(null)
  const [attendanceData, setAttendanceData] = useState<{
    records: AttendanceRecord[]
    statistics: {
      totalSessions: number
      presentSessions: number
      absentSessions: number
      lateSessions: number
      attendancePercentage: number
    }
  } | null>(null)
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)

  const handleSearch = async () => {
    if (!rollNumber.trim()) {
      toast.error('Please enter a roll number')
      return
    }

    try {
      setLoading(true)
      setSearched(true)
      
      // First, find the student by roll number
      const studentsResponse = await studentsApi.getStudents({ 
        search: rollNumber.trim(),
        limit: 1000 
      })
      
      const foundStudent = studentsResponse.data.find(
        s => s.tempRollNumber.toLowerCase() === rollNumber.trim().toLowerCase()
      )

      if (!foundStudent) {
        setStudent(null)
        setAttendanceData(null)
        toast.error('Student not found')
        return
      }

      // Get detailed student info
      const studentDetails = await studentsApi.getStudent(foundStudent.id)
      setStudent(studentDetails)

      // Get attendance data
      const attendance = await studentsApi.getStudentAttendance(foundStudent.id)
      setAttendanceData(attendance as {
        records: AttendanceRecord[]
        statistics: {
          totalSessions: number
          presentSessions: number
          absentSessions: number
          lateSessions: number
          attendancePercentage: number
        }
      })

      toast.success('Student found successfully', { duration: 2000 })
    } catch (error) {
      console.error('Search error:', error)
      toast.error('Failed to search student')
      setStudent(null)
      setAttendanceData(null)
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PRESENT':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'ABSENT':
        return <XCircle className="h-5 w-5 text-red-500" />
      case 'LATE':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />
      default:
        return <Calendar className="h-5 w-5 text-gray-500" />
    }
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'PRESENT': return 'default'
      case 'ABSENT': return 'destructive'
      case 'LATE': return 'secondary'
      default: return 'outline'
    }
  }

  const getSessionBadgeVariant = (session: string) => {
    return session === 'FN' ? 'default' : 'secondary'
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Student Summary</h1>
        <p className="text-gray-600 mt-2">Search for a student by roll number to view their complete attendance summary</p>
      </div>

      {/* Search Section */}
      <Card>
        <CardHeader>
          <CardTitle>Search Student</CardTitle>
          <CardDescription>
            Enter the student's temporary roll number to view their attendance summary
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Enter roll number (e.g., IG2026001)"
                  value={rollNumber}
                  onChange={(e) => setRollNumber(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="pl-10"
                />
              </div>
            </div>
            <Button onClick={handleSearch} disabled={loading}>
              {loading ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Searching...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4 mr-2" />
                  Search
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results Section */}
      {searched && !loading && (
        <>
          {!student ? (
            <Card>
              <CardContent className="p-8 text-center">
                <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Student Not Found</h3>
                <p className="text-gray-500">
                  No student found with roll number "{rollNumber}". Please check the roll number and try again.
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Student Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Student Information</CardTitle>
                  <CardDescription>
                    Personal and academic details
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="flex items-center gap-3">
                      <User className="h-8 w-8 text-blue-500" />
                      <div>
                        <p className="text-sm text-gray-600">Name</p>
                        <p className="font-medium">{student.firstName} {student.lastName}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <BookOpen className="h-8 w-8 text-green-500" />
                      <div>
                        <p className="text-sm text-gray-600">Roll Number</p>
                        <p className="font-medium font-mono">{student.tempRollNumber}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Calendar className="h-8 w-8 text-purple-500" />
                      <div>
                        <p className="text-sm text-gray-600">Brigade</p>
                        <p className="font-medium">{student.brigade?.name || 'No Brigade'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-8 w-8 text-orange-500" />
                      <div>
                        <p className="text-sm text-gray-600">Status</p>
                        <Badge variant={student.isActive ? "default" : "secondary"}>
                          {student.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  {(student.email || student.phone) && (
                    <div className="mt-6 pt-6 border-t">
                      <h4 className="font-medium mb-3">Contact Information</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {student.email && (
                          <div>
                            <p className="text-sm text-gray-600">Email</p>
                            <p className="font-medium">{student.email}</p>
                          </div>
                        )}
                        {student.phone && (
                          <div>
                            <p className="text-sm text-gray-600">Phone</p>
                            <p className="font-medium">{student.phone}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Attendance Statistics */}
              {attendanceData && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-600">Total Sessions</p>
                            <p className="text-3xl font-bold text-gray-900">{attendanceData.statistics.totalSessions}</p>
                          </div>
                          <Calendar className="h-8 w-8 text-blue-500" />
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-600">Present</p>
                            <p className="text-3xl font-bold text-green-600">{attendanceData.statistics.presentSessions}</p>
                          </div>
                          <CheckCircle className="h-8 w-8 text-green-500" />
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-600">Absent</p>
                            <p className="text-3xl font-bold text-red-600">{attendanceData.statistics.absentSessions}</p>
                          </div>
                          <XCircle className="h-8 w-8 text-red-500" />
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-600">Attendance %</p>
                            <p className="text-3xl font-bold text-blue-600">{attendanceData.statistics.attendancePercentage}%</p>
                          </div>
                          <Calendar className="h-8 w-8 text-blue-500" />
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Attendance Records */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Attendance History</CardTitle>
                      <CardDescription>
                        Complete attendance record for {student.firstName} {student.lastName}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {attendanceData.records.length === 0 ? (
                        <div className="text-center py-8">
                          <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                          <p className="text-gray-500">No attendance records found</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {attendanceData.records.map((record) => (
                            <div key={record.id} className="p-4 border rounded-lg hover:bg-gray-50">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                  {getStatusIcon(record.status)}
                                  <div>
                                    <div className="flex items-center gap-2 mb-1">
                                      <h3 className="font-medium">
                                        {record.eventDay?.event?.name || 'Event'}
                                      </h3>
                                      <Badge variant={getSessionBadgeVariant(record.session)}>
                                        {record.session}
                                      </Badge>
                                    </div>
                                    <p className="text-sm text-gray-600">
                                      {formatDate(record.eventDay?.date || record.createdAt)}
                                    </p>
                                  </div>
                                </div>
                                
                                <div className="flex items-center gap-4">
                                  <div className="text-right">
                                    <Badge variant={getStatusBadgeVariant(record.status)}>
                                      {record.status}
                                    </Badge>
                                    <p className="text-xs text-gray-500 mt-1">
                                      {formatDateTime(record.markedAt)}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Performance Summary */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Performance Summary</CardTitle>
                      <CardDescription>
                        Attendance performance breakdown
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="text-center p-4 bg-green-50 rounded-lg">
                          <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                          <p className="text-2xl font-bold text-green-600">{attendanceData.statistics.presentSessions}</p>
                          <p className="text-sm text-green-700">Sessions Present</p>
                        </div>
                        
                        <div className="text-center p-4 bg-red-50 rounded-lg">
                          <XCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
                          <p className="text-2xl font-bold text-red-600">{attendanceData.statistics.absentSessions}</p>
                          <p className="text-sm text-red-700">Sessions Absent</p>
                        </div>
                        
                        <div className="text-center p-4 bg-yellow-50 rounded-lg">
                          <AlertCircle className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
                          <p className="text-2xl font-bold text-yellow-600">{attendanceData.statistics.lateSessions}</p>
                          <p className="text-sm text-yellow-700">Late Arrivals</p>
                        </div>
                      </div>

                      <div className="mt-6 p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">Overall Attendance Rate</span>
                          <span className="text-sm font-bold">{attendanceData.statistics.attendancePercentage}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${
                              attendanceData.statistics.attendancePercentage >= 90 
                                ? 'bg-green-500' 
                                : attendanceData.statistics.attendancePercentage >= 75 
                                ? 'bg-yellow-500' 
                                : 'bg-red-500'
                            }`}
                            style={{ width: `${attendanceData.statistics.attendancePercentage}%` }}
                          />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {attendanceData.statistics.attendancePercentage >= 90 
                            ? 'Excellent attendance!' 
                            : attendanceData.statistics.attendancePercentage >= 75 
                            ? 'Good attendance, keep it up!' 
                            : 'Attendance needs improvement'}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}
            </>
          )}
        </>
      )}
    </div>
  )
}
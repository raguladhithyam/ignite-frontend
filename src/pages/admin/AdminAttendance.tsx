import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { attendanceApi } from '@/api/attendance'
import { eventsApi } from '@/api/events'
import { brigadesApi } from '@/api/brigades'
import { studentsApi } from '@/api/students'
import { AttendanceRecord, Event, Brigade, Student } from '@/types'
import { UserCheck, Clock, Users, Calendar, Download } from 'lucide-react'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { toast } from 'sonner'
import { formatDateTime } from '@/lib/utils'
import * as XLSX from 'xlsx'

export default function AdminAttendance() {
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([])
  const [allStudents, setAllStudents] = useState<Student[]>([])
  const [events, setEvents] = useState<Event[]>([])
  const [brigades, setBrigades] = useState<Brigade[]>([])
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState('')
  const [selectedEventDay, setSelectedEventDay] = useState('')
  const [selectedBrigade, setSelectedBrigade] = useState('')
  const [selectedSession, setSelectedSession] = useState<'FN' | 'AN' | ''>('')
  const [summary, setSummary] = useState<any>(null)
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 20
  })

  useEffect(() => {
    fetchEvents()
    fetchBrigades()
    fetchAllStudents()
  }, [])

  useEffect(() => {
    if (selectedEventDay) {
      fetchAttendanceRecords()
      fetchAttendanceSummary()
    }
  }, [selectedEventDay, selectedBrigade, selectedSession, pagination.currentPage])

  const fetchEvents = async () => {
    try {
      const data = await eventsApi.getEvents()
      setEvents(data)
      if (data.length > 0) {
        setSelectedEvent(data[0].id)
      }
    } catch (error) {
      console.error('Failed to fetch events:', error)
    }
  }

  const fetchBrigades = async () => {
    try {
      const data = await brigadesApi.getBrigades()
      setBrigades(data)
    } catch (error) {
      console.error('Failed to fetch brigades:', error)
    }
  }

  const fetchAllStudents = async () => {
    try {
      const response = await studentsApi.getStudents({ limit: 10000 }) // Get all students
      setAllStudents(response.data)
    } catch (error) {
      console.error('Failed to fetch students:', error)
    }
  }

  const fetchAttendanceRecords = async () => {
    try {
      setLoading(true)
      const response = await attendanceApi.getAttendanceRecords({
        eventDayId: selectedEventDay,
        brigadeId: selectedBrigade || undefined,
        session: selectedSession || undefined,
        page: 1,
        limit: 10000 // Get all attendance records
      })
      setAttendanceRecords(response.data)
    } catch (error) {
      toast.error('Failed to fetch attendance records')
    } finally {
      setLoading(false)
    }
  }

  const fetchAttendanceSummary = async () => {
    if (!selectedEventDay) return

    try {
      const data = await attendanceApi.getAttendanceSummary(
        selectedEventDay,
        selectedSession || undefined
      )
      setSummary(data)
    } catch (error) {
      console.error('Failed to fetch attendance summary:', error)
    }
  }

  // Get filtered students based on selected brigade
  const getFilteredStudents = () => {
    let filteredStudents = allStudents
    if (selectedBrigade) {
      filteredStudents = allStudents.filter(student => student.brigadeId === selectedBrigade)
    }
    return filteredStudents
  }

  // Get paginated students for display
  const getPaginatedStudents = () => {
    const filteredStudents = getFilteredStudents()
    const startIndex = (pagination.currentPage - 1) * pagination.itemsPerPage
    const endIndex = startIndex + pagination.itemsPerPage
    
    // Update pagination info
    const totalItems = filteredStudents.length
    const totalPages = Math.ceil(totalItems / pagination.itemsPerPage)
    
    if (pagination.totalItems !== totalItems || pagination.totalPages !== totalPages) {
      setPagination(prev => ({
        ...prev,
        totalItems,
        totalPages
      }))
    }
    
    return filteredStudents.slice(startIndex, endIndex)
  }

  // Get attendance record for a specific student
  const getStudentAttendanceRecord = (studentId: string) => {
    return attendanceRecords.find(record => record.studentId === studentId)
  }

  // Calculate enhanced summary statistics
  const getEnhancedSummary = () => {
    const filteredStudents = getFilteredStudents()
    const totalStudents = filteredStudents.length
    const studentsWithAttendance = attendanceRecords.length
    const attendanceNotMarked = totalStudents - studentsWithAttendance
    const presentCount = attendanceRecords.filter(r => r.status === 'PRESENT').length
    const absentCount = attendanceRecords.filter(r => r.status === 'ABSENT').length
    const lateCount = attendanceRecords.filter(r => r.status === 'LATE').length
    const presentPercentage = totalStudents > 0 ? ((presentCount / totalStudents) * 100).toFixed(1) : '0'

    return {
      totalStudents,
      studentsWithAttendance,
      attendanceNotMarked,
      presentCount,
      absentCount,
      lateCount,
      presentPercentage
    }
  }

  const exportToExcel = async () => {
    if (!selectedEventDay) {
      toast.error('Please select an event day to export')
      return
    }

    try {
      setExporting(true)
      
      const filteredStudents = getFilteredStudents()
      
      if (filteredStudents.length === 0) {
        toast.error('No students to export')
        return
      }

      // Prepare data for Excel with all students
      const excelData = filteredStudents.map(student => {
        const attendanceRecord = getStudentAttendanceRecord(student.id)
        return {
          'Student Name': `${student.firstName} ${student.lastName}`,
          'Roll Number': student.tempRollNumber,
          'Brigade': student.brigade?.name || 'No Brigade',
          'Session': selectedSession || 'All Sessions',
          'Status': attendanceRecord ? attendanceRecord.status : 'Attendance Not Marked',
          'Marked At': attendanceRecord ? formatDateTime(attendanceRecord.markedAt) : 'Not Marked'
        }
      })

      // Create workbook and worksheet
      const workbook = XLSX.utils.book_new()
      const worksheet = XLSX.utils.json_to_sheet(excelData)

      // Auto-size columns
      const columnWidths = [
        { wch: 25 }, // Student Name
        { wch: 15 }, // Roll Number
        { wch: 20 }, // Brigade
        { wch: 12 }, // Session
        { wch: 20 }, // Status
        { wch: 20 }  // Marked At
      ]
      worksheet['!cols'] = columnWidths

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Attendance Records')

      // Generate filename
      const selectedEventData = getSelectedEvent()
      const selectedEventDayData = getEventDays().find(day => day.id === selectedEventDay)
      const selectedBrigadeData = brigades.find(brigade => brigade.id === selectedBrigade)
      
      const eventName = selectedEventData?.name || 'Event'
      const eventDate = selectedEventDayData ? new Date(selectedEventDayData.date).toISOString().split('T')[0] : 'Date'
      const brigadeName = selectedBrigadeData?.name || 'AllBrigades'
      const sessionName = selectedSession || 'AllSessions'
      
      const filename = `${eventName}_${eventDate}_${brigadeName}_${sessionName}_Complete.xlsx`
        .replace(/[^a-zA-Z0-9_.-]/g, '_') // Replace invalid filename characters

      // Save file
      XLSX.writeFile(workbook, filename)
      
      toast.success(`Exported ${filteredStudents.length} student records to ${filename}`)
    } catch (error) {
      console.error('Export failed:', error)
      toast.error('Failed to export data')
    } finally {
      setExporting(false)
    }
  }

  const getSelectedEvent = () => {
    return events.find(e => e.id === selectedEvent)
  }

  const getEventDays = () => {
    const event = getSelectedEvent()
    return event ? event.eventDays : []
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

  const enhancedSummary = getEnhancedSummary()

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Attendance Records</h1>
          <p className="text-gray-600 mt-2">View and manage attendance records for all students</p>
        </div>
        <Button 
          onClick={exportToExcel}
          disabled={!selectedEventDay || loading || exporting}
          className="flex items-center gap-2"
        >
          <Download className="h-4 w-4" />
          {exporting ? 'Exporting...' : 'Export Complete Data'}
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Event</label>
              <select
                value={selectedEvent}
                onChange={(e) => {
                  setSelectedEvent(e.target.value)
                  setSelectedEventDay('')
                }}
                className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
              >
                <option value="">Select Event</option>
                {events.map((event) => (
                  <option key={event.id} value={event.id}>
                    {event.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Event Day</label>
              <select
                value={selectedEventDay}
                onChange={(e) => setSelectedEventDay(e.target.value)}
                className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                disabled={!selectedEvent}
              >
                <option value="">Select Day</option>
                {getEventDays().map((day) => (
                  <option key={day.id} value={day.id}>
                    {new Date(day.date).toLocaleDateString()}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Brigade</label>
              <select
                value={selectedBrigade}
                onChange={(e) => setSelectedBrigade(e.target.value)}
                className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
              >
                <option value="">All Brigades</option>
                {brigades.map((brigade) => (
                  <option key={brigade.id} value={brigade.id}>
                    {brigade.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Session</label>
              <select
                value={selectedSession}
                onChange={(e) => setSelectedSession(e.target.value as any)}
                className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
              >
                <option value="">All Sessions</option>
                <option value="FN">Forenoon</option>
                <option value="AN">Afternoon</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Summary Cards */}
      {selectedEventDay && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Students</p>
                  <p className="text-3xl font-bold text-gray-900">{enhancedSummary.totalStudents}</p>
                </div>
                <Users className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Present</p>
                  <p className="text-3xl font-bold text-green-600">{enhancedSummary.presentCount}</p>
                </div>
                <UserCheck className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Absent</p>
                  <p className="text-3xl font-bold text-red-600">{enhancedSummary.absentCount}</p>
                </div>
                <Clock className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Not Marked</p>
                  <p className="text-3xl font-bold text-orange-600">{enhancedSummary.attendanceNotMarked}</p>
                </div>
                <Calendar className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Attendance %</p>
                  <p className="text-3xl font-bold text-blue-600">{enhancedSummary.presentPercentage}%</p>
                </div>
                <Calendar className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Students with Attendance Records */}
      <Card>
        <CardHeader>
          <CardTitle>All Students - Attendance Status</CardTitle>
          <CardDescription>
            {selectedEventDay ? `${enhancedSummary.totalStudents} total students (${enhancedSummary.studentsWithAttendance} marked, ${enhancedSummary.attendanceNotMarked} not marked)` : 'Select an event day to view records'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!selectedEventDay ? (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Please select an event and day to view attendance records</p>
            </div>
          ) : loading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium">Student</th>
                    <th className="text-left py-3 px-4 font-medium">Roll Number</th>
                    <th className="text-left py-3 px-4 font-medium">Brigade</th>
                    <th className="text-left py-3 px-4 font-medium">Session</th>
                    <th className="text-left py-3 px-4 font-medium">Status</th>
                    <th className="text-left py-3 px-4 font-medium">Marked At</th>
                  </tr>
                </thead>
                <tbody>
                  {getPaginatedStudents().map((student) => {
                    const attendanceRecord = getStudentAttendanceRecord(student.id)
                    return (
                      <tr key={student.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div>
                            <p className="font-medium">
                              {student.firstName} {student.lastName}
                            </p>
                          </div>
                        </td>
                        <td className="py-3 px-4 font-mono text-sm">
                          {student.tempRollNumber}
                        </td>
                        <td className="py-3 px-4">
                          {student.brigade ? (
                            <Badge variant="secondary">
                              {student.brigade.name}
                            </Badge>
                          ) : (
                            <span className="text-gray-500">No Brigade</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          {attendanceRecord ? (
                            <Badge variant={getSessionBadgeVariant(attendanceRecord.session)}>
                              {attendanceRecord.session}
                            </Badge>
                          ) : (
                            <span className="text-gray-500">-</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          {attendanceRecord ? (
                            <Badge variant={getStatusBadgeVariant(attendanceRecord.status)}>
                              {attendanceRecord.status}
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-orange-600 border-orange-300">
                              Attendance Not Marked
                            </Badge>
                          )}
                        </td>
                        <td className="py-3 px-4 text-sm">
                          {attendanceRecord ? formatDateTime(attendanceRecord.markedAt) : 'Not Marked'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <p className="text-sm text-gray-500">
                Showing {((pagination.currentPage - 1) * pagination.itemsPerPage) + 1} to{' '}
                {Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)} of{' '}
                {pagination.totalItems} results
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage - 1 }))}
                  disabled={pagination.currentPage === 1}
                >
                  Previous
                </Button>
                <span className="text-sm">
                  Page {pagination.currentPage} of {pagination.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage + 1 }))}
                  disabled={pagination.currentPage === pagination.totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
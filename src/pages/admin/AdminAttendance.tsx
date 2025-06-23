import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { attendanceApi } from '@/api/attendance'
import { eventsApi } from '@/api/events'
import { brigadesApi } from '@/api/brigades'
import { AttendanceRecord, Event, Brigade } from '@/types'
import { UserCheck, Clock, Users, Calendar, Download } from 'lucide-react'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { toast } from 'sonner'
import { formatDateTime } from '@/lib/utils'
import * as XLSX from 'xlsx'

export default function AdminAttendance() {
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([])
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

  const fetchAttendanceRecords = async () => {
    try {
      setLoading(true)
      const response = await attendanceApi.getAttendanceRecords({
        eventDayId: selectedEventDay,
        brigadeId: selectedBrigade || undefined,
        session: selectedSession || undefined,
        page: pagination.currentPage,
        limit: pagination.itemsPerPage
      })
      setAttendanceRecords(response.data)
      setPagination(response.pagination)
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

  const fetchAllAttendanceForExport = async () => {
    try {
      const response = await attendanceApi.getAttendanceRecords({
        eventDayId: selectedEventDay,
        brigadeId: selectedBrigade || undefined,
        session: selectedSession || undefined,
        page: 1,
        limit: 999999 // Get all records for export
      })
      return response.data
    } catch (error) {
      throw error
    }
  }

  const exportToExcel = async () => {
    if (!selectedEventDay) {
      toast.error('Please select an event day to export')
      return
    }

    try {
      setExporting(true)
      
      // Fetch all records for export (not just current page)
      const allRecords = await fetchAllAttendanceForExport()
      
      if (allRecords.length === 0) {
        toast.error('No records to export')
        return
      }

      // Prepare data for Excel
      const excelData = allRecords.map(record => ({
        'Student Name': `${record.student?.firstName || ''} ${record.student?.lastName || ''}`.trim(),
        'Roll Number': record.student?.tempRollNumber || '',
        'Brigade': record.student?.brigade?.name || 'No Brigade',
        'Session': record.session,
        'Status': record.status,
        'Marked At': formatDateTime(record.markedAt)
      }))

      // Create workbook and worksheet
      const workbook = XLSX.utils.book_new()
      const worksheet = XLSX.utils.json_to_sheet(excelData)

      // Auto-size columns
      const columnWidths = [
        { wch: 25 }, // Student Name
        { wch: 15 }, // Roll Number
        { wch: 20 }, // Brigade
        { wch: 12 }, // Session
        { wch: 12 }, // Status
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
      
      const filename = `${eventName}_${eventDate}_${brigadeName}_${sessionName}.xlsx`
        .replace(/[^a-zA-Z0-9_.-]/g, '_') // Replace invalid filename characters

      // Save file
      XLSX.writeFile(workbook, filename)
      
      toast.success(`Exported ${allRecords.length} records to ${filename}`)
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
      default: return 'secondary'
    }
  }

  const getSessionBadgeVariant = (session: string) => {
    return session === 'FN' ? 'default' : 'secondary'
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Attendance Records</h1>
          <p className="text-gray-600 mt-2">View and manage attendance records</p>
        </div>
        <Button 
          onClick={exportToExcel}
          disabled={!selectedEventDay || loading || exporting}
          className="flex items-center gap-2"
        >
          <Download className="h-4 w-4" />
          {exporting ? 'Exporting...' : 'Export Data'}
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

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Records</p>
                  <p className="text-3xl font-bold text-gray-900">{summary.summary.totalRecords}</p>
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
                  <p className="text-3xl font-bold text-green-600">{summary.summary.presentCount}</p>
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
                  <p className="text-3xl font-bold text-red-600">{summary.summary.absentCount}</p>
                </div>
                <Clock className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Attendance %</p>
                  <p className="text-3xl font-bold text-blue-600">{summary.summary.presentPercentage}%</p>
                </div>
                <Calendar className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Attendance Records */}
      <Card>
        <CardHeader>
          <CardTitle>Attendance Records</CardTitle>
          <CardDescription>
            {selectedEventDay ? `${pagination.totalItems} records found` : 'Select an event day to view records'}
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
          ) : attendanceRecords.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No attendance records found</p>
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
                  {attendanceRecords.map((record) => (
                    <tr key={record.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium">
                            {record.student?.firstName} {record.student?.lastName}
                          </p>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono text-sm">
                        {record.student?.tempRollNumber}
                      </td>
                      <td className="py-3 px-4">
                        {record.student?.brigade ? (
                          <Badge variant="secondary">
                            {record.student.brigade.name}
                          </Badge>
                        ) : (
                          <span className="text-gray-500">No Brigade</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant={getSessionBadgeVariant(record.session)}>
                          {record.session}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant={getStatusBadgeVariant(record.status)}>
                          {record.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-sm">
                        {formatDateTime(record.markedAt)}
                      </td>
                    </tr>
                  ))}
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
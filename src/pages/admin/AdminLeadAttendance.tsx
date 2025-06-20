import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { leadAttendanceApi, LeadAttendanceRecord } from '@/api/leadAttendance'
import { eventsApi } from '@/api/events'
import { usersApi } from '@/api/users'
import { Event, User } from '@/types'
import { UserCheck, Clock, Users, Calendar, CheckCircle, Shield, Filter, Download, AlertCircle } from 'lucide-react'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { toast } from 'sonner'
import { formatDateTime } from '@/lib/utils'

export default function AdminLeadAttendance() {
  const [leadAttendanceRecords, setLeadAttendanceRecords] = useState<LeadAttendanceRecord[]>([])
  const [events, setEvents] = useState<Event[]>([])
  const [brigadeLeads, setBrigadeLeads] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [markingAttendance, setMarkingAttendance] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState('')
  const [selectedEventDay, setSelectedEventDay] = useState('')
  const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set())
  const [summary, setSummary] = useState<any>(null)
  const [analytics, setAnalytics] = useState<any>(null)
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 20
  })

  useEffect(() => {
    fetchEvents()
    fetchBrigadeLeads()
    fetchAnalytics()
  }, [])

  useEffect(() => {
    if (selectedEventDay) {
      fetchLeadAttendanceRecords()
      fetchLeadAttendanceSummary()
    }
  }, [selectedEventDay, pagination.currentPage])

  const fetchEvents = async () => {
    try {
      const data = await eventsApi.getEvents()
      setEvents(data)
      if (data.length > 0) {
        setSelectedEvent(data[0].id)
        if (data[0].eventDays && data[0].eventDays.length > 0) {
          setSelectedEventDay(data[0].eventDays[0].id)
        }
      }
    } catch (error) {
      console.error('Failed to fetch events:', error)
      toast.error('Failed to fetch events')
    }
  }

  const fetchBrigadeLeads = async () => {
    try {
      const response = await usersApi.getUsers({ role: 'BRIGADE_LEAD' })
      setBrigadeLeads(response.data)
    } catch (error) {
      console.error('Failed to fetch brigade leads:', error)
      toast.error('Failed to fetch brigade leads')
    }
  }

  const fetchLeadAttendanceRecords = async () => {
    try {
      setLoading(true)
      const response = await leadAttendanceApi.getLeadAttendanceRecords({
        eventDayId: selectedEventDay,
        page: pagination.currentPage,
        limit: pagination.itemsPerPage
      })
      setLeadAttendanceRecords(response.records)
      setPagination(response.pagination)
    } catch (error) {
      toast.error('Failed to fetch lead attendance records')
    } finally {
      setLoading(false)
    }
  }

  const fetchLeadAttendanceSummary = async () => {
    if (!selectedEventDay) return

    try {
      const data = await leadAttendanceApi.getLeadAttendanceSummary(selectedEventDay)
      setSummary(data)
    } catch (error) {
      console.error('Failed to fetch lead attendance summary:', error)
      toast.error('Failed to fetch attendance summary')
    }
  }

  const fetchAnalytics = async (days = 7) => {
    try {
      const data = await leadAttendanceApi.getLeadAttendanceAnalytics(days)
      setAnalytics(data)
    } catch (error) {
      console.error('Failed to fetch analytics:', error)
    }
  }

  const handleMarkAttendance = async (leadId: string, status: 'PRESENT' | 'ABSENT' | 'LATE' = 'PRESENT') => {
    if (!selectedEventDay) {
      toast.error('No event day selected')
      return
    }

    try {
      await leadAttendanceApi.markLeadAttendance({
        leadId,
        eventDayId: selectedEventDay,
        status
      })
      
      toast.success('Lead attendance marked successfully', { duration: 2000 })
      fetchLeadAttendanceRecords()
      fetchLeadAttendanceSummary()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to mark lead attendance')
    }
  }

  const handleBulkMarkAttendance = async (status: 'PRESENT' | 'ABSENT' | 'LATE' = 'PRESENT') => {
    if (!selectedEventDay || selectedLeads.size === 0) {
      toast.error('Please select leads first')
      return
    }

    try {
      setMarkingAttendance(true)
      await leadAttendanceApi.bulkMarkLeadAttendance({
        leadIds: Array.from(selectedLeads),
        eventDayId: selectedEventDay,
        status
      })
      
      toast.success(`Bulk attendance marked as ${status.toLowerCase()} for ${selectedLeads.size} leads`)
      setSelectedLeads(new Set())
      fetchLeadAttendanceRecords()
      fetchLeadAttendanceSummary()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to mark bulk attendance')
    } finally {
      setMarkingAttendance(false)
    }
  }

  const handleSelectLead = (leadId: string) => {
    const newSelected = new Set(selectedLeads)
    if (newSelected.has(leadId)) {
      newSelected.delete(leadId)
    } else {
      newSelected.add(leadId)
    }
    setSelectedLeads(newSelected)
  }

  const handleSelectAll = () => {
    if (selectedLeads.size === brigadeLeads.length) {
      setSelectedLeads(new Set())
    } else {
      setSelectedLeads(new Set(brigadeLeads.map(lead => lead.id)))
    }
  }

  type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE';

  const getStatusBadge = (status: AttendanceStatus) => {
    const statusConfig: Record<
      AttendanceStatus,
      { variant: 'default' | 'destructive' | 'secondary' | 'outline' | null | undefined; icon: typeof CheckCircle; color: string }
    > = {
      PRESENT: { variant: 'default', icon: CheckCircle, color: 'bg-green-500' },
      ABSENT: { variant: 'destructive', icon: AlertCircle, color: 'bg-red-500' },
      LATE: { variant: 'secondary', icon: Clock, color: 'bg-yellow-500' }
    }
    
    const config = statusConfig[status] || statusConfig.PRESENT
    const Icon = config.icon
    
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="w-3 h-3" />
        {status}
      </Badge>
    )
  }

  const selectedEventData = events.find(e => e.id === selectedEvent)
  const selectedEventDayData = selectedEventData?.eventDays?.find(ed => ed.id === selectedEventDay)

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
          <Shield className="w-8 h-8 text-blue-600" />
          Lead Attendance Management
        </h1>
        <Button 
          variant="outline" 
          onClick={() => fetchAnalytics()}
          className="flex items-center gap-2"
        >
          <Download className="w-4 h-4" />
          Refresh Analytics
        </Button>
      </div>

      {/* Analytics Cards */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Records</p>
                  <p className="text-2xl font-bold">{analytics.overall.totalRecords}</p>
                </div>
                <Users className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Present Records</p>
                  <p className="text-2xl font-bold text-green-600">{analytics.overall.presentRecords}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Attendance Rate</p>
                  <p className="text-2xl font-bold text-blue-600">{analytics.overall.percentage}%</p>
                </div>
                <UserCheck className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Recent Trends</p>
                  <p className="text-2xl font-bold">{analytics.trends.length} Days</p>
                </div>
                <Calendar className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Event Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Event & Date Selection
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Select Event</label>
              <select
                value={selectedEvent}
                onChange={(e) => {
                  setSelectedEvent(e.target.value)
                  const event = events.find(ev => ev.id === e.target.value)
                  if (event?.eventDays && event.eventDays.length > 0) {
                    setSelectedEventDay(event.eventDays[0].id)
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select an event</option>
                {events.map(event => (
                  <option key={event.id} value={event.id}>{event.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Select Event Day</label>
              <select
                value={selectedEventDay}
                onChange={(e) => setSelectedEventDay(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={!selectedEvent}
              >
                <option value="">Select an event day</option>
                {selectedEventData?.eventDays?.map(eventDay => (
                  <option key={eventDay.id} value={eventDay.id}>
                    {formatDateTime(eventDay.date)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Statistics */}
      {summary && (
        <Card>
          <CardHeader>
            <CardTitle>Attendance Summary</CardTitle>
            <CardDescription>
              Summary for {selectedEventDayData ? formatDateTime(selectedEventDayData.date) : 'Selected Date'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{summary.summary.totalBrigadeLeads}</div>
                <div className="text-sm text-gray-600">Total Leads</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{summary.summary.presentCount}</div>
                <div className="text-sm text-gray-600">Present</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{summary.summary.absentCount}</div>
                <div className="text-sm text-gray-600">Absent</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">{summary.summary.lateCount}</div>
                <div className="text-sm text-gray-600">Late</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{summary.summary.presentPercentage}%</div>
                <div className="text-sm text-gray-600">Attendance Rate</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bulk Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Bulk Actions</CardTitle>
          <CardDescription>Select brigade leads and mark attendance in bulk</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={selectedLeads.size === brigadeLeads.length && brigadeLeads.length > 0}
                  onChange={handleSelectAll}
                  className="rounded border-gray-300"
                />
                <span className="text-sm font-medium">
                  Select All ({selectedLeads.size}/{brigadeLeads.length})
                </span>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => handleBulkMarkAttendance('PRESENT')}
                  disabled={selectedLeads.size === 0 || markingAttendance || !selectedEventDay}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {markingAttendance ? <LoadingSpinner size="sm" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                  Mark Present
                </Button>
                <Button
                  onClick={() => handleBulkMarkAttendance('ABSENT')}
                  disabled={selectedLeads.size === 0 || markingAttendance || !selectedEventDay}
                  variant="destructive"
                >
                  {markingAttendance ? <LoadingSpinner size="sm" /> : <AlertCircle className="w-4 h-4 mr-2" />}
                  Mark Absent
                </Button>
                <Button
                  onClick={() => handleBulkMarkAttendance('LATE')}
                  disabled={selectedLeads.size === 0 || markingAttendance || !selectedEventDay}
                  variant="secondary"
                >
                  {markingAttendance ? <LoadingSpinner size="sm" /> : <Clock className="w-4 h-4 mr-2" />}
                  Mark Late
                </Button>
              </div>
            </div>

            {/* Brigade Leads List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
              {brigadeLeads.map(lead => {
                const attendanceRecord = leadAttendanceRecords.find(record => record.leadId === lead.id)
                return (
                  <div
                    key={lead.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedLeads.has(lead.id)
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => handleSelectLead(lead.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{lead.firstName} {lead.lastName}</div>
                        <div className="text-sm text-gray-600">{lead.email}</div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <input
                          type="checkbox"
                          checked={selectedLeads.has(lead.id)}
                          onChange={() => handleSelectLead(lead.id)}
                          className="rounded border-gray-300"
                        />
                        {attendanceRecord && getStatusBadge(attendanceRecord.status)}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Individual Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Individual Attendance Actions</CardTitle>
          <CardDescription>Mark attendance for individual brigade leads</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {brigadeLeads.map(lead => {
              const attendanceRecord = leadAttendanceRecords.find(record => record.leadId === lead.id)
              return (
                <div key={lead.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div>
                      <div className="font-medium">{lead.firstName} {lead.lastName}</div>
                      <div className="text-sm text-gray-600">{lead.email}</div>
                    </div>
                    {attendanceRecord && (
                      <div className="flex items-center gap-2">
                        {getStatusBadge(attendanceRecord.status)}
                        <span className="text-xs text-gray-500">
                          {formatDateTime(attendanceRecord.markedAt)}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleMarkAttendance(lead.id, 'PRESENT')}
                      disabled={!selectedEventDay}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      Present
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleMarkAttendance(lead.id, 'ABSENT')}
                      disabled={!selectedEventDay}
                    >
                      Absent
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleMarkAttendance(lead.id, 'LATE')}
                      disabled={!selectedEventDay}
                    >
                      Late
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Attendance Records */}
      {selectedEventDay && (
        <Card>
          <CardHeader>
            <CardTitle>Attendance Records</CardTitle>
            <CardDescription>
              Records for {selectedEventDayData ? formatDateTime(selectedEventDayData.date) : 'Selected Date'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <LoadingSpinner />
              </div>
            ) : leadAttendanceRecords.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No attendance records found for this event day
              </div>
            ) : (
              <div className="space-y-4">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-gray-200">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="border border-gray-200 px-4 py-2 text-left">Lead</th>
                        <th className="border border-gray-200 px-4 py-2 text-left">Status</th>
                        <th className="border border-gray-200 px-4 py-2 text-left">Marked At</th>
                        <th className="border border-gray-200 px-4 py-2 text-left">Marked By</th>
                      </tr>
                    </thead>
                    <tbody>
                      {leadAttendanceRecords.map(record => (
                        <tr key={record.id} className="hover:bg-gray-50">
                          <td className="border border-gray-200 px-4 py-2">
                            <div>
                              <div className="font-medium">
                                {record.lead.firstName} {record.lead.lastName}
                              </div>
                              <div className="text-sm text-gray-600">{record.lead.email}</div>
                            </div>
                          </td>
                          <td className="border border-gray-200 px-4 py-2">
                            {getStatusBadge(record.status)}
                          </td>
                          <td className="border border-gray-200 px-4 py-2">
                            {formatDateTime(record.markedAt)}
                          </td>
                          <td className="border border-gray-200 px-4 py-2">
                            {record.marker ? (
                              <div>
                                <div className="font-medium">
                                  {record.marker.firstName} {record.marker.lastName}
                                </div>
                              </div>
                            ) : (
                              <span className="text-gray-500">System</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                  <div className="flex justify-between items-center">
                    <div className="text-sm text-gray-600">
                      Showing {((pagination.currentPage - 1) * pagination.itemsPerPage) + 1} to{' '}
                      {Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)} of{' '}
                      {pagination.totalItems} records
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage - 1 }))}
                        disabled={pagination.currentPage === 1}
                      >
                        Previous
                      </Button>
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
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
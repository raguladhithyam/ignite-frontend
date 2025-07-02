import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { attendanceApi } from '@/api/attendance'
import { eventsApi } from '@/api/events'
import { studentsApi } from '@/api/students'
import { brigadesApi } from '@/api/brigades'
import { AttendanceRecord, Event, EventDay, Student, Brigade } from '@/types'
import { Calendar, CheckCircle, Loader2, Users, Clock, UserCheck, XCircle, AlertCircle, Search, Edit } from 'lucide-react'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { toast } from 'sonner'
import { formatDateTime } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'

interface BrigadeNotMarkedStats {
  brigadeId: string
  brigadeName: string
  totalStudents: number
  markedStudents: number
  notMarkedStudents: number
  notMarkedPercentage: string
}

export default function AdminStudentAttendance() {
  const [currentEvent, setCurrentEvent] = useState<{ event: Event; currentDay: EventDay | null } | null>(null)
  const [students, setStudents] = useState<Student[]>([])
  const [brigades, setBrigades] = useState<Brigade[]>([])
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([])
  const [brigadeNotMarkedStats, setBrigadeNotMarkedStats] = useState<BrigadeNotMarkedStats[]>([])
  const [loading, setLoading] = useState(true)
  const [markingAttendance, setMarkingAttendance] = useState(false)
  const [selectedSession, setSelectedSession] = useState<'FN' | 'AN'>('FN')
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set())
  const [markingIndividual, setMarkingIndividual] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedBrigade, setSelectedBrigade] = useState('')
  const [showChangeAttendanceModal, setShowChangeAttendanceModal] = useState(false)
  const [selectedAttendanceRecord, setSelectedAttendanceRecord] = useState<AttendanceRecord | null>(null)
  const [newAttendanceStatus, setNewAttendanceStatus] = useState<'PRESENT' | 'ABSENT' | 'LATE'>('PRESENT')
  const [updatingAttendance, setUpdatingAttendance] = useState(false)
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 500 //keep the totalstudent count + 100 for better visiblity and marking of data
  })

  useEffect(() => {
    fetchCurrentEvent()
    fetchBrigades()
  }, [])

  useEffect(() => {
    fetchStudents()
  }, [pagination.currentPage, searchTerm, selectedBrigade])

  useEffect(() => {
    if (currentEvent?.currentDay) {
      fetchAttendanceRecords()
      fetchBrigadeNotMarkedStats()
    }
  }, [currentEvent, selectedSession])

  const fetchCurrentEvent = async () => {
    try {
      const data = await eventsApi.getCurrentEvent()
      setCurrentEvent(data)
    } catch (error) {
      console.error('Failed to fetch current event:', error)
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

  const fetchStudents = async () => {
    try {
      setLoading(true)
      const response = await studentsApi.getStudents({
        page: pagination.currentPage,
        limit: pagination.itemsPerPage,
        search: searchTerm || undefined,
        brigadeId: selectedBrigade || undefined
      })
      setStudents(response.data)
      setPagination(response.pagination)
    } catch (error) {
      toast.error('Failed to fetch students')
    } finally {
      setLoading(false)
    }
  }

  const fetchAttendanceRecords = async () => {
    if (!currentEvent?.currentDay) return

    try {
      const response = await attendanceApi.getAttendanceRecords({
        eventDayId: currentEvent.currentDay.id,
        session: selectedSession,
        limit: 10000
      })
      setAttendanceRecords(response.data)
    } catch (error) {
      console.error('Failed to fetch attendance records:', error)
    }
  }

  const fetchBrigadeNotMarkedStats = async () => {
    if (!currentEvent?.currentDay) return

    try {
      const stats = await attendanceApi.getBrigadeNotMarkedStats(
        currentEvent.currentDay.id,
        selectedSession
      )
      setBrigadeNotMarkedStats(stats)
    } catch (error) {
      console.error('Failed to fetch brigade not marked stats:', error)
      // Create fallback stats if API doesn't exist yet
      setBrigadeNotMarkedStats([])
    }
  }

  const handleMarkAttendance = async (studentId: string, status: 'PRESENT' | 'ABSENT' | 'LATE' = 'PRESENT') => {
    if (!currentEvent?.currentDay) {
      toast.error('No active event day')
      return
    }

    try {
      setMarkingIndividual(studentId)
      await attendanceApi.markAttendance({
        studentId,
        eventDayId: currentEvent.currentDay.id,
        session: selectedSession,
        status
      })
      
      toast.success('Attendance marked successfully', { duration: 2000 })
      fetchAttendanceRecords()
      fetchBrigadeNotMarkedStats()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to mark attendance')
    } finally {
      setMarkingIndividual(null)
    }
  }

  const handleBulkMarkAttendance = async (status: 'PRESENT' | 'ABSENT' | 'LATE' = 'PRESENT') => {
    if (!currentEvent?.currentDay || selectedStudents.size === 0) {
      toast.error('Please select students first')
      return
    }

    try {
      setMarkingAttendance(true)
      await attendanceApi.bulkMarkAttendance({
        studentIds: Array.from(selectedStudents),
        eventDayId: currentEvent.currentDay.id,
        session: selectedSession,
        status
      })
      
      toast.success(`Attendance marked for ${selectedStudents.size} students`, { duration: 2000 })
      setSelectedStudents(new Set())
      fetchAttendanceRecords()
      fetchBrigadeNotMarkedStats()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to mark bulk attendance')
    } finally {
      setMarkingAttendance(false)
    }
  }

  const handleChangeAttendance = (record: AttendanceRecord) => {
    setSelectedAttendanceRecord(record)
    setNewAttendanceStatus(record.status)
    setShowChangeAttendanceModal(true)
  }

  const handleUpdateAttendance = async () => {
    if (!selectedAttendanceRecord) return

    try {
      setUpdatingAttendance(true)
      await attendanceApi.updateAttendance(selectedAttendanceRecord.id, {
        status: newAttendanceStatus
      })
      
      toast.success('Attendance updated successfully', { duration: 2000 })
      setShowChangeAttendanceModal(false)
      setSelectedAttendanceRecord(null)
      fetchAttendanceRecords()
      fetchBrigadeNotMarkedStats()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update attendance')
    } finally {
      setUpdatingAttendance(false)
    }
  }

  const toggleStudentSelection = (studentId: string) => {
    const newSelection = new Set(selectedStudents)
    if (newSelection.has(studentId)) {
      newSelection.delete(studentId)
    } else {
      newSelection.add(studentId)
    }
    setSelectedStudents(newSelection)
  }

  const selectAllStudents = () => {
    const unmarkedStudents = students.filter(student => 
      !attendanceRecords.some(record => record.studentId === student.id)
    )
    setSelectedStudents(new Set(unmarkedStudents.map(s => s.id)))
  }

  const clearSelection = () => {
    setSelectedStudents(new Set())
  }

  const getStudentAttendanceStatus = (studentId: string) => {
    return attendanceRecords.find(record => record.studentId === studentId)
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'PRESENT': return 'default'
      case 'ABSENT': return 'destructive'
      case 'LATE': return 'secondary'
      default: return 'outline'
    }
  }

  // Calculate enhanced summary statistics for ALL brigades (not filtered)
  const getEnhancedSummary = () => {
    // Always use total items from pagination for all students count
    const totalStudents = pagination.totalItems || 0
    
    // For attendance records, we need to get all records regardless of current filter
    // This ensures analytics show data for all brigades
    const sessionAttendanceRecords = attendanceRecords.filter(record => 
      record.session === selectedSession
    )
    
    const studentsWithAttendance = sessionAttendanceRecords.length
    const attendanceNotMarked = totalStudents - studentsWithAttendance
    const presentCount = sessionAttendanceRecords.filter(r => r.status === 'PRESENT').length
    const absentCount = sessionAttendanceRecords.filter(r => r.status === 'ABSENT').length
    const lateCount = sessionAttendanceRecords.filter(r => r.status === 'LATE').length
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

  if (loading && students.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    )
  }

  if (!currentEvent) {
    return (
      <div className="text-center py-8">
        <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500">No active event found</p>
      </div>
    )
  }

  const enhancedSummary = getEnhancedSummary()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Mark Student Attendance</h1>
        <p className="text-gray-600 mt-2">Record attendance for all students across brigades</p>
      </div>

      {/* Event Info */}
      <Card>
        <CardHeader>
          <CardTitle>{currentEvent.event.name}</CardTitle>
          <CardDescription>
            {currentEvent.currentDay ? (
              <>
                Today: {new Date(currentEvent.currentDay.date).toLocaleDateString()}
              </>
            ) : (
              'No active day'
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex gap-2">
              <Button
                variant={selectedSession === 'FN' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedSession('FN')}
                disabled={!currentEvent.currentDay?.fnEnabled}
              >
                Forenoon ({currentEvent.currentDay?.fnStartTime} - {currentEvent.currentDay?.fnEndTime})
              </Button>
              <Button
                variant={selectedSession === 'AN' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedSession('AN')}
                disabled={!currentEvent.currentDay?.anEnabled}
              >
                Afternoon ({currentEvent.currentDay?.anStartTime} - {currentEvent.currentDay?.anEndTime})
              </Button>
            </div>
            <Badge variant="default" className="bg-green-600">
              Admin Access - No Time Restrictions
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Summary Cards - Shows ALL brigades data */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Students (All Brigades)</p>
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
              <CheckCircle className="h-8 w-8 text-green-500" />
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
              <XCircle className="h-8 w-8 text-red-500" />
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
              <Clock className="h-8 w-8 text-orange-500" />
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
              <UserCheck className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Brigade-wise Not Marked Stats */}
      {brigadeNotMarkedStats.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Brigade-wise Not Marked Count</CardTitle>
            <CardDescription>
              Students who haven't been marked for attendance in each brigade
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {brigadeNotMarkedStats.map((stat) => (
                <div key={stat.brigadeId} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-gray-900">{stat.brigadeName}</h3>
                    <Badge variant="outline" className="text-orange-600 border-orange-300">
                      {stat.notMarkedPercentage}% not marked
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Total Students:</span>
                      <span className="font-medium">{stat.totalStudents}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Marked:</span>
                      <span className="font-medium text-green-600">{stat.markedStudents}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Not Marked:</span>
                      <span className="font-medium text-orange-600">{stat.notMarkedStudents}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full" 
                        style={{ width: `${((stat.markedStudents / stat.totalStudents) * 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search students..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-full md:w-48">
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
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {selectedStudents.size > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                {selectedStudents.size} students selected
              </span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => handleBulkMarkAttendance('PRESENT')}
                  disabled={markingAttendance}
                >
                  {markingAttendance ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Marking...
                    </>
                  ) : (
                    'Mark Present'
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleBulkMarkAttendance('ABSENT')}
                  disabled={markingAttendance}
                >
                  Mark Absent
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleBulkMarkAttendance('LATE')}
                  disabled={markingAttendance}
                >
                  Mark Late
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={clearSelection}
                  disabled={markingAttendance}
                >
                  Clear
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Students List */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Students - {selectedSession} Session</CardTitle>
              <CardDescription>
                {enhancedSummary.totalStudents} total students ({enhancedSummary.studentsWithAttendance} marked, {enhancedSummary.attendanceNotMarked} not marked)
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={selectAllStudents}
            >
              Select All Unmarked
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner />
            </div>
          ) : (
            <div className="space-y-2">
              {students.map((student) => {
                const attendanceStatus = getStudentAttendanceStatus(student.id)
                const isSelected = selectedStudents.has(student.id)
                const isMarkingThisStudent = markingIndividual === student.id
                
                return (
                  <div
                    key={student.id}
                    className={`p-4 border rounded-lg hover:bg-gray-50 transition-colors ${
                      isSelected ? 'border-blue-500 bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleStudentSelection(student.id)}
                          disabled={!!attendanceStatus || isMarkingThisStudent}
                          className="rounded border-gray-300"
                        />
                        <div>
                          <p className="font-medium">
                            {student.firstName} {student.lastName}
                          </p>
                          <p className="text-sm text-gray-500">
                            {student.tempRollNumber} • {student.brigade?.name || 'No Brigade'}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {attendanceStatus ? (
                          <div className="flex items-center gap-2">
                            <Badge variant={getStatusBadgeVariant(attendanceStatus.status)}>
                              {attendanceStatus.status}
                            </Badge>
                            <span className="text-xs text-gray-500">
                              {formatDateTime(attendanceStatus.markedAt)}
                            </span>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleChangeAttendance(attendanceStatus)}
                              className="ml-2"
                            >
                              <Edit className="h-4 w-4 mr-1" />
                              Change
                            </Button>
                          </div>
                        ) : (
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              onClick={() => handleMarkAttendance(student.id, 'PRESENT')}
                              disabled={isMarkingThisStudent}
                            >
                              {isMarkingThisStudent ? (
                                <>
                                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                                  Marking...
                                </>
                              ) : (
                                <>
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  Present
                                </>
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleMarkAttendance(student.id, 'ABSENT')}
                              disabled={isMarkingThisStudent}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Absent
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleMarkAttendance(student.id, 'LATE')}
                              disabled={isMarkingThisStudent}
                            >
                              <AlertCircle className="h-4 w-4 mr-1" />
                              Late
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
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

      {/* Change Attendance Modal */}
      <Dialog open={showChangeAttendanceModal} onOpenChange={setShowChangeAttendanceModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Attendance Status</DialogTitle>
            <DialogDescription>
              Update attendance for {selectedAttendanceRecord?.student?.firstName} {selectedAttendanceRecord?.student?.lastName}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Current Status</Label>
              <div className="p-2 bg-gray-50 rounded">
                <Badge variant={getStatusBadgeVariant(selectedAttendanceRecord?.status || '')}>
                  {selectedAttendanceRecord?.status}
                </Badge>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="newStatus">New Status</Label>
              <select
                id="newStatus"
                value={newAttendanceStatus}
                onChange={(e) => setNewAttendanceStatus(e.target.value as 'PRESENT' | 'ABSENT' | 'LATE')}
                className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
              >
                <option value="PRESENT">Present</option>
                <option value="ABSENT">Absent</option>
                <option value="LATE">Late</option>
              </select>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowChangeAttendanceModal(false)}
                disabled={updatingAttendance}
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpdateAttendance}
                disabled={updatingAttendance || newAttendanceStatus === selectedAttendanceRecord?.status}
              >
                {updatingAttendance ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  'Update Attendance'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
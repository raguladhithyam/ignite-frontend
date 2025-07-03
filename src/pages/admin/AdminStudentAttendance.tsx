import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { attendanceApi } from '@/api/attendance'
import { eventsApi } from '@/api/events'
import { studentsApi } from '@/api/students'
import { brigadesApi } from '@/api/brigades'
import { AttendanceRecord, Event, EventDay, Student, Brigade } from '@/types'
import { Calendar, CheckCircle, Loader2, Users, Clock, UserCheck, XCircle, Search } from 'lucide-react'
// import { AlertCircle } from 'lucide-react'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { toast } from 'sonner'
import { formatDateTime } from '@/lib/utils'
import { Input } from '@/components/ui/input'

export default function AdminStudentAttendance() {
  const [currentEvent, setCurrentEvent] = useState<{ event: Event; currentDay: EventDay | null } | null>(null)
  const [students, setStudents] = useState<Student[]>([])
  const [brigades, setBrigades] = useState<Brigade[]>([])
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([])
  const [brigadeStats, setBrigadeStats] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingBrigadeStats, setLoadingBrigadeStats] = useState(false)
  const [markingAttendance, setMarkingAttendance] = useState(false)
  const [selectedSession, setSelectedSession] = useState<'FN' | 'AN'>('FN')
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set())
  const [markingIndividual, setMarkingIndividual] = useState<string | null>(null)
  const [updatingAttendance, setUpdatingAttendance] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedBrigade, setSelectedBrigade] = useState('')
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 500 //keep the totalstudent count + 100 for better visiblity and marking of data
  })
  const [totalStats, setTotalStats] = useState<{
    totalStudents: number;
    totalAttendanceRecords: AttendanceRecord[];
  }>({
    totalStudents: 0,
    totalAttendanceRecords: []
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
      fetchBrigadeStats()
      fetchTotalStats() // Add this line
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

  const fetchTotalStats = async () => {
    if (!currentEvent?.currentDay) return

    try {
      // Fetch total students count without filters
      const studentsResponse = await studentsApi.getStudents({
        page: 1,
        limit: 1, // We only need the pagination info
      })
      
      // Fetch all attendance records for the session
      const attendanceResponse = await attendanceApi.getAttendanceRecords({
        eventDayId: currentEvent.currentDay.id,
        session: selectedSession,
        limit: 10000
      })
      
      setTotalStats({
        totalStudents: studentsResponse.pagination.totalItems,
        totalAttendanceRecords: attendanceResponse.data
      })
    } catch (error) {
      console.error('Failed to fetch total stats:', error)
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

  const fetchBrigadeStats = async () => {
    if (!currentEvent?.currentDay) return

    try {
      setLoadingBrigadeStats(true)
        const response = await attendanceApi.getBrigadeSummary(
          currentEvent.currentDay.id,
          selectedSession
        )
        setBrigadeStats((response as any)?.brigadeStats || [])
    } catch (error) {
      console.error('Failed to fetch brigade stats:', error)
    } finally {
      setLoadingBrigadeStats(false)
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
      fetchBrigadeStats() // Refresh brigade stats
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to mark attendance')
    } finally {
      setMarkingIndividual(null)
    }
  }

  const handleUpdateAttendance = async (recordId: string, status: 'PRESENT' | 'ABSENT' | 'LATE') => {
    try {
      setUpdatingAttendance(recordId)
      await attendanceApi.updateAttendance({
        recordId,
        status
      })
      
      toast.success('Attendance updated successfully', { duration: 2000 })
      fetchAttendanceRecords()
      fetchBrigadeStats() // Refresh brigade stats
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update attendance')
    } finally {
      setUpdatingAttendance(null)
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
      fetchBrigadeStats() // Refresh brigade stats
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to mark bulk attendance')
    } finally {
      setMarkingAttendance(false)
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

  // Calculate enhanced summary statistics (session-specific) - SAME AS AdminAttendance
  const getEnhancedSummary = () => {
    const totalStudents = totalStats.totalStudents
    const sessionAttendanceRecords = totalStats.totalAttendanceRecords.filter(record => 
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

      {/* Enhanced Summary Cards - SAME AS AdminAttendance */}
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

      {/* Brigade-wise Not Marked Count */}
      <Card>
        <CardHeader>
          <CardTitle>Brigade-wise Not Marked Count - {selectedSession} Session</CardTitle>
          <CardDescription>
            Overview of attendance marking progress across all brigades
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingBrigadeStats ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {brigadeStats.map((brigade) => (
                <div
                  key={brigade.brigadeId}
                  className="p-4 border rounded-lg hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-sm truncate" title={brigade.brigadeName}>
                      {brigade.brigadeName}
                    </h3>
                    <Badge 
                      variant={brigade.notMarkedCount === 0 ? "default" : "secondary"}
                      className={brigade.notMarkedCount === 0 ? "bg-green-600" : ""}
                    >
                      {brigade.notMarkedCount === 0 ? "Complete" : "Pending"}
                    </Badge>
                  </div>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Students:</span>
                      <span className="font-medium">{brigade.totalStudents}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Marked:</span>
                      <span className="font-medium text-green-600">{brigade.markedStudents}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Not Marked:</span>
                      <span className="font-medium text-orange-600">{brigade.notMarkedCount}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                      <div 
                        className="bg-green-600 h-2 rounded-full transition-all" 
                        style={{ 
                          width: `${brigade.totalStudents > 0 ? (brigade.markedStudents / brigade.totalStudents) * 100 : 0}%` 
                        }}
                      ></div>
                    </div>
                    <div className="text-xs text-gray-500 text-center">
                      {brigade.totalStudents > 0 ? 
                        Math.round((brigade.markedStudents / brigade.totalStudents) * 100) : 0}% Complete
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {!loadingBrigadeStats && brigadeStats.length === 0 && (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No brigade data available</p>
            </div>
          )}
        </CardContent>
      </Card>

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
                {/* <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleBulkMarkAttendance('LATE')}
                  disabled={markingAttendance}
                >
                  Mark Late
                </Button> */}
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
                const isUpdatingThisStudent = updatingAttendance === attendanceStatus?.id
                
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
                            <div className="flex gap-1 ml-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleUpdateAttendance(attendanceStatus.id, 'PRESENT')}
                                disabled={isUpdatingThisStudent || attendanceStatus.status === 'PRESENT'}
                                className="h-8 px-2"
                              >
                                {isUpdatingThisStudent ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <CheckCircle className="h-3 w-3" />
                                )}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleUpdateAttendance(attendanceStatus.id, 'ABSENT')}
                                disabled={isUpdatingThisStudent || attendanceStatus.status === 'ABSENT'}
                                className="h-8 px-2"
                              >
                                {isUpdatingThisStudent ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <XCircle className="h-3 w-3" />
                                )}
                              </Button>
                              {/* <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleUpdateAttendance(attendanceStatus.id, 'LATE')}
                                disabled={isUpdatingThisStudent || attendanceStatus.status === 'LATE'}
                                className="h-8 px-2"
                              >
                                {isUpdatingThisStudent ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <AlertCircle className="h-3 w-3" />
                                )}
                              </Button> */}
                            </div>
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
                            {/* <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleMarkAttendance(student.id, 'LATE')}
                              disabled={isMarkingThisStudent}
                            >
                              <AlertCircle className="h-4 w-4 mr-1" />
                              Late
                            </Button> */}
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
    </div>
  )
}
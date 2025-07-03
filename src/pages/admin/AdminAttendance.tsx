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
  const [brigadeStats, setBrigadeStats] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingBrigadeStats, setLoadingBrigadeStats] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState('')
  const [selectedEventDay, setSelectedEventDay] = useState('')
  const [selectedBrigade, setSelectedBrigade] = useState('')
  const [selectedSession, setSelectedSession] = useState<'FN' | 'AN'>('FN') // Default to FN
  const [attendanceStatusFilter, setAttendanceStatusFilter] = useState<'ALL' | 'PRESENT' | 'ABSENT'>('ALL')
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 20
  })
    const [totalStats, setTotalStats] = useState<{
    totalStudents: number;
    totalAttendanceRecords: AttendanceRecord[];
  }>({
    totalStudents: 0,
    totalAttendanceRecords: []
  })

  useEffect(() => {
    fetchEvents()
    fetchBrigades()
    fetchAllStudents()
  }, [])

  useEffect(() => {
    if (selectedEventDay) {
      fetchAttendanceRecords()
      fetchBrigadeStats()
      fetchTotalStats() // Add this line
    }
  }, [selectedEventDay, selectedBrigade, selectedSession, pagination.currentPage])

  const fetchTotalStats = async () => {
    if (!selectedEventDay) return

    try {
      // Fetch total students count WITHOUT any brigade filter - always show all students
      const studentsResponse = await studentsApi.getStudents({
        page: 1,
        limit: 1, // We only need the pagination info
      })
      
      // Fetch all attendance records for the session WITHOUT brigade filter - always show all data
      const attendanceResponse = await attendanceApi.getAttendanceRecords({
        eventDayId: selectedEventDay,
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
        session: selectedSession, // Filter by selected session only
        page: 1,
        limit: 10000 // Get all attendance records for the specific session
      })
      // Additional client-side filtering to ensure only the selected session records are shown
      const filteredRecords = response.data.filter((record: AttendanceRecord) => 
        record.session === selectedSession
      )
      setAttendanceRecords(filteredRecords)
    } catch (error) {
      toast.error('Failed to fetch attendance records')
    } finally {
      setLoading(false)
    }
  }
  
  const fetchBrigadeStats = async () => {
    if (!selectedEventDay) return

    try {
      setLoadingBrigadeStats(true)
      const response = await attendanceApi.getBrigadeSummary(
        selectedEventDay,
        selectedSession
      )
      setBrigadeStats((response as any)?.brigadeStats || [])
    } catch (error) {
      console.error('Failed to fetch brigade stats:', error)
    } finally {
      setLoadingBrigadeStats(false)
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

  // Get filtered students based on selected brigade and attendance status
  const getFilteredStudentsByAttendanceStatus = () => {
    let filteredStudents = getFilteredStudents()
    
    if (attendanceStatusFilter === 'ALL') {
      return filteredStudents
    }
    
    return filteredStudents.filter(student => {
      const attendanceRecord = getStudentAttendanceRecord(student.id)
      
      if (attendanceStatusFilter === 'PRESENT') {
        return attendanceRecord && attendanceRecord.status === 'PRESENT'
      } else if (attendanceStatusFilter === 'ABSENT') {
        return !attendanceRecord || attendanceRecord.status === 'ABSENT' || attendanceRecord.status === 'LATE'
      }
      
      return true
    })
  }

  // Get paginated students for display
  const getPaginatedStudents = () => {
    const filteredStudents = getFilteredStudentsByAttendanceStatus()
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

  // Get attendance record for a specific student (only for the selected session)
  const getStudentAttendanceRecord = (studentId: string) => {
    return attendanceRecords.find(record => 
      record.studentId === studentId && record.session === selectedSession
    )
  }

  // Calculate enhanced summary statistics (session-specific)
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

  // Helper function to convert status for Excel export
  const getExcelStatus = (attendanceRecord: AttendanceRecord | undefined) => {
    if (!attendanceRecord) return 'ABSENT'
    if (attendanceRecord.status === 'LATE') return 'ABSENT'
    return attendanceRecord.status
  }

  // Extract department code from roll number
  const getDepartmentCode = (rollNumber: string) => {
    if (!rollNumber || rollNumber.length < 5) return 'OTHERS'
    
    // Extract characters 3-5 (0-indexed: 2-4) for department code
    const deptCode = rollNumber.substring(2, 5)
    
    // Group BCW and TCW under CW first (before other checks)
    if (deptCode === 'BCW' || deptCode === 'TCW') {
      return 'CW'
    }
    
    // Check if third character (index 2) starts with 'B' for other departments
    if (rollNumber.charAt(2) !== 'B') {
      return 'OTHERS'
    }
    
    return deptCode
  }

  // Group students by department
  const groupStudentsByDepartment = (students: any[]) => {
    const grouped: Record<string, any[]> = {}
    
    students.forEach((student) => {
      const deptCode = getDepartmentCode(student['Roll Number'])
      if (!grouped[deptCode]) {
        grouped[deptCode] = []
      }
      grouped[deptCode].push(student)
    })
    
    // Sort students within each department by roll number in ascending order
    Object.keys(grouped).forEach(deptCode => {
      grouped[deptCode].sort((a, b) => {
        const rollA = a['Roll Number'] || ''
        const rollB = b['Roll Number'] || ''
        return rollA.localeCompare(rollB)
      })
    })
    
    return grouped
  }

  // Create statistics data
  const createStatsData = (groupedStudents: Record<string, any[]>) => {
    const statsData = Object.entries(groupedStudents).map(([deptCode, students]) => {
      const totalStudents = students.length
      const presentCount = students.filter(s => s.Status === 'PRESENT').length
      const absentCount = students.filter(s => s.Status === 'ABSENT').length
      const notMarkedCount = 0 // Since we're now converting all non-present to absent
      const attendancePercentage = totalStudents > 0 ? ((presentCount / totalStudents) * 100).toFixed(1) : '0'
      
      return {
        'Department Code': deptCode,
        'Total Students': totalStudents,
        'Present': presentCount,
        'Absent': absentCount,
        'Late': 0, // No late status in Excel
        'Not Marked': notMarkedCount, // Always 0 now
        'Attendance %': attendancePercentage + '%'
      }
    })
    
    // Sort by department code, with OTHERS at the end
    return statsData.sort((a, b) => {
      if (a['Department Code'] === 'OTHERS') return 1
      if (b['Department Code'] === 'OTHERS') return -1
      return a['Department Code'].localeCompare(b['Department Code'])
    })
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

      // Prepare data for Excel with all students (session-specific) with serial numbers
      const excelData = filteredStudents.map((student, index) => {
        const attendanceRecord = getStudentAttendanceRecord(student.id)
        const excelStatus = getExcelStatus(attendanceRecord)
        
        return {
          'S.No': index + 1,
          'Student Name': `${student.firstName} ${student.lastName}`,
          'Roll Number': student.tempRollNumber,
          'Brigade': student.brigade?.name || 'No Brigade',
          'Session': selectedSession,
          'Status': excelStatus,
          'Marked At': attendanceRecord ? formatDateTime(attendanceRecord.markedAt) : 'Not Marked'
        }
      })

      // Group students by department
      const groupedStudents = groupStudentsByDepartment(excelData)
      
      // Create statistics data
      const statsData = createStatsData(groupedStudents)

      // Create workbook
      const workbook = XLSX.utils.book_new()

      // Column widths configuration
      const columnWidths = [
        { wch: 8 },  // S.No
        { wch: 25 }, // Student Name
        { wch: 15 }, // Roll Number
        { wch: 20 }, // Brigade
        { wch: 12 }, // Session
        { wch: 20 }, // Status
        { wch: 20 }  // Marked At
      ]

      // 1. Overall Data Sheet
      const overallWorksheet = XLSX.utils.json_to_sheet(excelData)
      overallWorksheet['!cols'] = columnWidths
      XLSX.utils.book_append_sheet(workbook, overallWorksheet, 'Overall Data')

      // 2. Stats Sheet
      const statsWorksheet = XLSX.utils.json_to_sheet(statsData)
      const statsColumnWidths = [
        { wch: 18 }, // Department Code
        { wch: 15 }, // Total Students
        { wch: 12 }, // Present
        { wch: 12 }, // Absent
        { wch: 12 }, // Late
        { wch: 15 }, // Not Marked
        { wch: 15 }  // Attendance %
      ]
      statsWorksheet['!cols'] = statsColumnWidths
      XLSX.utils.book_append_sheet(workbook, statsWorksheet, 'Stats')

      // 3. Department-wise sheets
      // Sort department codes for consistent ordering, with OTHERS at the end
      const sortedDeptCodes = Object.keys(groupedStudents).sort((a, b) => {
        if (a === 'OTHERS') return 1
        if (b === 'OTHERS') return -1
        return a.localeCompare(b)
      })

      sortedDeptCodes.forEach(deptCode => {
        const deptStudents = groupedStudents[deptCode]
        
        // Add serial numbers for department sheets AFTER sorting by roll number
        const deptStudentsWithSerial = deptStudents.map((student, index) => ({
          ...student,
          'S.No': index + 1
        }))
        
        const deptWorksheet = XLSX.utils.json_to_sheet(deptStudentsWithSerial)
        deptWorksheet['!cols'] = columnWidths
        
        // Use department code as sheet name, with fallback for invalid characters
        const sheetName = deptCode.replace(/[^a-zA-Z0-9_]/g, '_').substring(0, 31) // Excel sheet name limit
        XLSX.utils.book_append_sheet(workbook, deptWorksheet, sheetName)
      })

      // Generate filename
      const selectedEventData = getSelectedEvent()
      const selectedEventDayData = getEventDays().find(day => day.id === selectedEventDay)
      const selectedBrigadeData = brigades.find(brigade => brigade.id === selectedBrigade)
      
      const eventName = selectedEventData?.name || 'Event'
      const eventDate = selectedEventDayData ? new Date(selectedEventDayData.date).toISOString().split('T')[0] : 'Date'
      const brigadeName = selectedBrigadeData?.name || 'AllBrigades'
      const sessionName = selectedSession
      
      const filename = `${eventName}_${eventDate}_${brigadeName}_${sessionName}_Complete.xlsx`
        .replace(/[^a-zA-Z0-9_.-]/g, '_') // Replace invalid filename characters

      // Save file
      XLSX.writeFile(workbook, filename)
      
      const totalSheets = 2 + Object.keys(groupedStudents).length // Overall + Stats + Department sheets
      toast.success(`Exported ${filteredStudents.length} student records across ${totalSheets} sheets to ${filename}`)
    } catch (error) {
      console.error('Export failed:', error)
      toast.error('Failed to export data')
    } finally {
      setExporting(false)
    }
  }

  const downloadFullData = async () => {
    if (!selectedEvent) {
      toast.error('Please select an event to download full data')
      return
    }

    try {
      setExporting(true)
      
      // Get all students
      const allStudentsResponse = await studentsApi.getStudents({ limit: 10000 })
      const allStudents: Student[] = allStudentsResponse.data
      
      if (allStudents.length === 0) {
        toast.error('No students found')
        return
      }

      // Get selected event details
      const selectedEventData = getSelectedEvent()
      if (!selectedEventData) {
        toast.error('Selected event not found')
        return
      }

      // Get all event days for the selected event
      const eventDays = selectedEventData.eventDays || []
      
      // Sort event days by date
      const sortedEventDays = eventDays.sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())
      
      // Get all attendance records for all days and sessions
      const allAttendanceRecords: AttendanceRecord[] = []
      for (const eventDay of sortedEventDays) {
        try {
          const fnResponse = await attendanceApi.getAttendanceRecords({
            eventDayId: eventDay.id,
            session: 'FN',
            limit: 10000
          })
          const anResponse = await attendanceApi.getAttendanceRecords({
            eventDayId: eventDay.id,
            session: 'AN',
            limit: 10000
          })
          allAttendanceRecords.push(...fnResponse.data, ...anResponse.data)
        } catch (error) {
          console.error(`Failed to fetch attendance for day ${eventDay.date}:`, error)
        }
      }

      // Create column headers dynamically
      const dateColumns: string[] = []
      sortedEventDays.forEach((eventDay: any) => {
        const dateStr = new Date(eventDay.date).toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'short'
        })
        dateColumns.push(`${dateStr} FN`)
        dateColumns.push(`${dateStr} AN`)
      })

      // Define type for Excel row
      type ExcelRow = {
        'S.No': number
        'Name': string
        'Roll No': string
        'Brigade': string
        [key: string]: any // This allows dynamic date columns
      }

      // Prepare data for Excel
      const excelData: ExcelRow[] = allStudents
        .sort((a, b) => (a.tempRollNumber || '').localeCompare(b.tempRollNumber || ''))
        .map((student, index) => {
          const row: ExcelRow = {
            'S.No': index + 1,
            'Name': `${student.firstName} ${student.lastName}`,
            'Roll No': student.tempRollNumber,
            'Brigade': student.brigade?.name || 'No Brigade'
          }

          // Add attendance status for each date and session
          sortedEventDays.forEach((eventDay: any) => {
            const dateStr = new Date(eventDay.date).toLocaleDateString('en-GB', {
              day: '2-digit',
              month: 'short'
            })
            
            // FN Session
            const fnRecord = allAttendanceRecords.find(record => 
              record.studentId === student.id && 
              record.eventDayId === eventDay.id && 
              record.session === 'FN'
            )
            row[`${dateStr} FN`] = fnRecord ? 
              (fnRecord.status === 'LATE' ? 'ABSENT' : fnRecord.status) : 'ABSENT'

            // AN Session
            const anRecord = allAttendanceRecords.find(record => 
              record.studentId === student.id && 
              record.eventDayId === eventDay.id && 
              record.session === 'AN'
            )
            row[`${dateStr} AN`] = anRecord ? 
              (anRecord.status === 'LATE' ? 'ABSENT' : anRecord.status) : 'ABSENT'
          })

          return row
        })

      // Group students by department for department-wise sheets
      const groupedByDepartment: Record<string, ExcelRow[]> = {}
      excelData.forEach(student => {
        const deptCode = getDepartmentCode(student['Roll No'])
        if (!groupedByDepartment[deptCode]) {
          groupedByDepartment[deptCode] = []
        }
        groupedByDepartment[deptCode].push(student)
      })

      // Create statistics data
      const statsData = Object.entries(groupedByDepartment).map(([deptCode, students]) => {
        const totalStudents = students.length
        
        // Calculate overall statistics across all sessions
        let totalPresent = 0
        let totalSessions = 0
        
        students.forEach((student: ExcelRow) => {
          dateColumns.forEach((dateCol: string) => {
            if (student[dateCol] === 'PRESENT') totalPresent++
            totalSessions++
          })
        })
        
        const attendancePercentage = totalSessions > 0 ? ((totalPresent / totalSessions) * 100).toFixed(1) : '0'
        
        return {
          'Department Code': deptCode,
          'Total Students': totalStudents,
          'Total Sessions': dateColumns.length,
          'Total Present': totalPresent,
          'Total Absent': totalSessions - totalPresent,
          'Overall Attendance %': attendancePercentage + '%'
        }
      })

      // Sort stats by department code
      const sortedStatsData = statsData.sort((a, b) => {
        if (a['Department Code'] === 'OTHERS') return 1
        if (b['Department Code'] === 'OTHERS') return -1
        return a['Department Code'].localeCompare(b['Department Code'])
      })

      // Create workbook
      const workbook = XLSX.utils.book_new()

      // Column widths for overall data
      const overallColumnWidths = [
        { wch: 8 },  // S.No
        { wch: 25 }, // Name
        { wch: 15 }, // Roll No
        { wch: 20 }, // Brigade
        ...dateColumns.map(() => ({ wch: 12 })) // Date columns
      ]

      // 1. Overall Data Sheet
      const overallWorksheet = XLSX.utils.json_to_sheet(excelData)
      overallWorksheet['!cols'] = overallColumnWidths
      XLSX.utils.book_append_sheet(workbook, overallWorksheet, 'Overall Data')

      // 2. Stats Sheet
      const statsWorksheet = XLSX.utils.json_to_sheet(sortedStatsData)
      const statsColumnWidths = [
        { wch: 18 }, // Department Code
        { wch: 15 }, // Total Students
        { wch: 15 }, // Total Sessions
        { wch: 15 }, // Total Present
        { wch: 15 }, // Total Absent
        { wch: 20 }  // Overall Attendance %
      ]
      statsWorksheet['!cols'] = statsColumnWidths
      XLSX.utils.book_append_sheet(workbook, statsWorksheet, 'Stats')

      // 3. Department-wise sheets (merge BCW and TCW into CW)
      const mergedGroupedByDepartment: Record<string, ExcelRow[]> = {}
      Object.entries(groupedByDepartment).forEach(([deptCode, students]) => {
        const finalDeptCode = (deptCode === 'BCW' || deptCode === 'TCW') ? 'CW' : deptCode
        if (!mergedGroupedByDepartment[finalDeptCode]) {
          mergedGroupedByDepartment[finalDeptCode] = []
        }
        mergedGroupedByDepartment[finalDeptCode].push(...students)
      })

      // Sort department codes
      const sortedDeptCodes = Object.keys(mergedGroupedByDepartment).sort((a, b) => {
        if (a === 'OTHERS') return 1
        if (b === 'OTHERS') return -1
        return a.localeCompare(b)
      })

      sortedDeptCodes.forEach(deptCode => {
        const deptStudents = mergedGroupedByDepartment[deptCode]
          .sort((a: ExcelRow, b: ExcelRow) => (a['Roll No'] || '').localeCompare(b['Roll No'] || ''))
          .map((student: ExcelRow, index: number) => ({
            ...student,
            'S.No': index + 1
          }))
        
        const deptWorksheet = XLSX.utils.json_to_sheet(deptStudents)
        deptWorksheet['!cols'] = overallColumnWidths
        
        const sheetName = deptCode.replace(/[^a-zA-Z0-9_]/g, '_').substring(0, 31)
        XLSX.utils.book_append_sheet(workbook, deptWorksheet, sheetName)
      })

      // Generate filename
      const eventName = selectedEventData.name || 'Event'
      const currentDate = new Date().toISOString().split('T')[0]
      const filename = `${eventName}_FullData_${currentDate}.xlsx`
        .replace(/[^a-zA-Z0-9_.-]/g, '_')

      // Save file
      XLSX.writeFile(workbook, filename)
      
      const totalSheets = 2 + Object.keys(mergedGroupedByDepartment).length
      toast.success(`Downloaded full attendance data with ${totalSheets} sheets: ${filename}`)
      
    } catch (error) {
      console.error('Download failed:', error)
      toast.error('Failed to download full data')
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

  // Handle event day selection and automatically set to FN session
  const handleEventDayChange = (eventDayId: string) => {
    setSelectedEventDay(eventDayId)
    setSelectedSession('FN') // Always default to FN when selecting a new event day
    setPagination(prev => ({ ...prev, currentPage: 1 })) // Reset to first page
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
          {exporting ? 'Exporting...' : 'Export Data'}
        </Button>
        <Button 
          onClick={downloadFullData}
          disabled={!selectedEvent || loading || exporting}
          className="flex items-center gap-2"
          variant="outline"
        >
          <Download className="h-4 w-4" />
          {exporting ? 'Downloading...' : 'Download Full Data'}
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
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
                onChange={(e) => handleEventDayChange(e.target.value)}
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
              <label className="text-sm font-medium">Attendance Status</label>
              <select
                value={attendanceStatusFilter}
                onChange={(e) => {
                  setAttendanceStatusFilter(e.target.value as 'ALL' | 'PRESENT' | 'ABSENT')
                  setPagination(prev => ({ ...prev, currentPage: 1 }))
                }}
                className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
              >
                <option value="ALL">All Status</option>
                <option value="PRESENT">Present Only</option>
                <option value="ABSENT">Absent Only</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Session</label>
              <select
                value={selectedSession}
                onChange={(e) => setSelectedSession(e.target.value as 'FN' | 'AN')}
                className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
              >
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

      {/* Brigade-wise Not Marked Count */}
      {selectedEventDay && (
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
      )}

      {/* Students with Attendance Records */}
      <Card>
        <CardHeader>
          <CardTitle>All Students - Attendance Status ({selectedSession} Session)</CardTitle>
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
                          <Badge variant={getSessionBadgeVariant(selectedSession)}>
                            {selectedSession}
                          </Badge>
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
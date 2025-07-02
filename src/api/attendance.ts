import { apiClient } from './client'
import { AttendanceRecord, PaginatedResponse } from '@/types'

export interface AttendanceQuery {
  eventDayId?: string
  brigadeId?: string
  session?: 'FN' | 'AN'
  rollNumber?: string
  page?: number
  limit?: number
}

export interface MarkAttendanceData {
  studentId: string
  eventDayId: string
  session: 'FN' | 'AN'
  status?: 'PRESENT' | 'ABSENT' | 'LATE'
}

export interface BulkMarkAttendanceData {
  studentIds: string[]
  eventDayId: string
  session: 'FN' | 'AN'
  status?: 'PRESENT' | 'ABSENT' | 'LATE'
}

export interface UpdateAttendanceData {
  status: 'PRESENT' | 'ABSENT' | 'LATE'
}

export interface BrigadeNotMarkedStats {
  brigadeId: string
  brigadeName: string
  totalStudents: number
  markedStudents: number
  notMarkedStudents: number
  notMarkedPercentage: string
}

export const attendanceApi = {
  getAttendanceRecords: async (params: AttendanceQuery = {}): Promise<PaginatedResponse<AttendanceRecord>> => {
    const searchParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, value.toString())
      }
    })
    
    const response = await apiClient.get<{ records: AttendanceRecord[]; pagination: any }>(`/attendance?${searchParams}`)
    return {
      data: response.records,
      pagination: response.pagination
    }
  },

  markAttendance: async (data: MarkAttendanceData): Promise<AttendanceRecord> => {
    return apiClient.post('/attendance/mark', data)
  },

  updateAttendance: async (recordId: string, data: UpdateAttendanceData): Promise<AttendanceRecord> => {
    return apiClient.put(`/attendance/${recordId}`, data)
  },

  bulkMarkAttendance: async (data: BulkMarkAttendanceData): Promise<{ message: string; records: AttendanceRecord[] }> => {
    return apiClient.post('/attendance/bulk-mark', data)
  },

  getAttendanceSummary: async (eventDayId: string, session?: 'FN' | 'AN') => {
    const params = session ? `?session=${session}` : ''
    return apiClient.get(`/attendance/summary/${eventDayId}${params}`)
  },

  getBrigadeNotMarkedStats: async (eventDayId: string, session: 'FN' | 'AN'): Promise<BrigadeNotMarkedStats[]> => {
    return apiClient.get(`/attendance/brigade-not-marked-stats/${eventDayId}?session=${session}`)
  },
}
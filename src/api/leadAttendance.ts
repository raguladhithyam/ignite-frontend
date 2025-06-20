import { apiClient } from './client'

export interface LeadAttendanceRecord {
  id: string
  leadId: string
  eventDayId: string
  status: 'PRESENT' | 'ABSENT' | 'LATE'
  markedAt: string
  markedBy?: string
  createdAt: string
  updatedAt: string
  lead: {
    id: string
    firstName: string
    lastName: string
    email: string
  }
  eventDay: {
    id: string
    date: string
    event: {
      id: string
      name: string
    }
  }
  marker?: {
    id: string
    firstName: string
    lastName: string
  }
}

export interface LeadAttendanceQuery {
  eventDayId?: string
  page?: number
  limit?: number
}

export interface MarkLeadAttendanceData {
  leadId: string
  eventDayId: string
  status?: 'PRESENT' | 'ABSENT' | 'LATE'
}

export interface BulkMarkLeadAttendanceData {
  leadIds: string[]
  eventDayId: string
  status?: 'PRESENT' | 'ABSENT' | 'LATE'
}

export interface LeadAttendanceSummary {
  summary: {
    totalRecords: number
    totalBrigadeLeads: number
    presentCount: number
    absentCount: number
    lateCount: number
    presentPercentage: string
  }
  records: LeadAttendanceRecord[]
}

export interface LeadAttendanceAnalytics {
  trends: Array<{
    date: string
    total: number
    present: number
    absent: number
    late: number
  }>
  overall: {
    totalRecords: number
    presentRecords: number
    percentage: string
  }
}

export const leadAttendanceApi = {
  getLeadAttendanceRecords: async (params: LeadAttendanceQuery = {}) => {
    const searchParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, value.toString())
      }
    })
    
    return apiClient.get<{
      records: LeadAttendanceRecord[]
      pagination: {
        currentPage: number
        totalPages: number
        totalItems: number
        itemsPerPage: number
      }
    }>(`/lead-attendance?${searchParams}`)
  },

  markLeadAttendance: async (data: MarkLeadAttendanceData): Promise<LeadAttendanceRecord> => {
    return apiClient.post('/lead-attendance/mark', data)
  },

  bulkMarkLeadAttendance: async (data: BulkMarkLeadAttendanceData) => {
    return apiClient.post('/lead-attendance/bulk-mark', data)
  },

  getLeadAttendanceSummary: async (eventDayId: string): Promise<LeadAttendanceSummary> => {
    return apiClient.get(`/lead-attendance/summary/${eventDayId}`)
  },

  getLeadAttendanceAnalytics: async (days: number = 7): Promise<LeadAttendanceAnalytics> => {
    return apiClient.get(`/lead-attendance/analytics?days=${days}`)
  }
}
import { apiClient } from './client'

export interface LeadAttendanceRecord {
  id: string
  userId: string
  date: string
  status: 'PRESENT' | 'ABSENT' | 'LATE'
  markedAt: string
  markedBy: string
  notes?: string
  createdAt: string
  updatedAt: string
  user: {
    id: string
    firstName: string
    lastName: string
    email: string
    brigadeLeadBrigades: Array<{
      id: string
      name: string
    }>
  }
  marker: {
    id: string
    firstName: string
    lastName: string
  }
}

export interface BrigadeLead {
  id: string
  firstName: string
  lastName: string
  email: string
  brigadeLeadBrigades: Array<{
    id: string
    name: string
  }>
}

export interface LeadAttendanceQuery {
  page?: number
  limit?: number
  userId?: string
  startDate?: string
  endDate?: string
  status?: 'PRESENT' | 'ABSENT' | 'LATE'
}

export interface MarkLeadAttendanceData {
  userId: string
  date: string
  status: 'PRESENT' | 'ABSENT' | 'LATE'
  notes?: string
}

export interface BulkMarkLeadAttendanceData {
  userIds: string[]
  date: string
  status: 'PRESENT' | 'ABSENT' | 'LATE'
  notes?: string
}

export const leadAttendanceApi = {
  getBrigadeLeads: async (): Promise<BrigadeLead[]> => {
    return apiClient.get('/lead-attendance/leads')
  },

  getLeadAttendanceRecords: async (params: LeadAttendanceQuery = {}) => {
    const searchParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, value.toString())
      }
    })
    
    const response = await apiClient.get<{ records: LeadAttendanceRecord[]; pagination: any }>(`/lead-attendance?${searchParams}`)
    return {
      data: response.records,
      pagination: response.pagination
    }
  },

  markLeadAttendance: async (data: MarkLeadAttendanceData): Promise<LeadAttendanceRecord> => {
    return apiClient.post('/lead-attendance/mark', data)
  },

  bulkMarkLeadAttendance: async (data: BulkMarkLeadAttendanceData): Promise<{ message: string; records: LeadAttendanceRecord[] }> => {
    return apiClient.post('/lead-attendance/bulk-mark', data)
  },

  getLeadAttendanceSummary: async (params: { startDate?: string; endDate?: string; userId?: string } = {}) => {
    const searchParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, value.toString())
      }
    })
    
    return apiClient.get(`/lead-attendance/summary?${searchParams}`)
  },

  deleteLeadAttendanceRecord: async (id: string): Promise<{ message: string }> => {
    return apiClient.delete(`/lead-attendance/${id}`)
  }
}
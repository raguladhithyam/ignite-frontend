import { apiClient } from './client'

export interface LogEntry {
  timestamp: string
  level: string
  message: string
  service: string
  stack?: string
  [key: string]: any
}

export interface LogsResponse {
  logs: LogEntry[]
  pagination: {
    currentPage: number
    totalPages: number
    totalLogs: number
    hasNext: boolean
    hasPrev: boolean
  }
  filters: {
    level?: string
    startDate?: string
    endDate?: string
    search?: string
  }
}

export interface LogStats {
  total: number
  byLevel: Record<string, number>
  recent: {
    last24h: number
    last7days: number
    last30days: number
  }
}

export interface LogFilters {
  level?: string
  startDate?: string
  endDate?: string
  search?: string
  page?: number
  limit?: number
}

class LogsApi {
  // Get logs with optional filters and pagination
  async getLogs(filters?: LogFilters): Promise<LogsResponse> {
    const params = new URLSearchParams()
    
    if (filters?.level) params.append('level', filters.level)
    if (filters?.startDate) params.append('startDate', filters.startDate)
    if (filters?.endDate) params.append('endDate', filters.endDate)
    if (filters?.search) params.append('search', filters.search)
    if (filters?.page) params.append('page', filters.page.toString())
    if (filters?.limit) params.append('limit', filters.limit.toString())

    const queryString = params.toString()
    const endpoint = queryString ? `/logs?${queryString}` : '/logs'
    
    return apiClient.get<LogsResponse>(endpoint)
  }

  // Get available log levels
  async getLogLevels(): Promise<{ levels: string[] }> {
    return apiClient.get<{ levels: string[] }>('/logs/levels')
  }

  // Get log statistics
  async getLogStats(): Promise<LogStats> {
    return apiClient.get<LogStats>('/logs/stats')
  }

  // Clear logs (admin only - be careful)
  async clearLogs(type: 'error' | 'combined' | 'all' = 'all'): Promise<{ message: string }> {
    return apiClient.delete<{ message: string }>(`/logs?type=${type}`)
  }

  // Export logs as JSON
  async exportLogs(filters?: LogFilters): Promise<Blob> {
    const params = new URLSearchParams()
    
    if (filters?.level) params.append('level', filters.level)
    if (filters?.startDate) params.append('startDate', filters.startDate)
    if (filters?.endDate) params.append('endDate', filters.endDate)
    if (filters?.search) params.append('search', filters.search)
    // Don't limit for export
    params.append('limit', '10000')

    const queryString = params.toString()
    const endpoint = queryString ? `/logs?${queryString}` : '/logs'
    
    try {
      const response = await apiClient.get<LogsResponse>(endpoint)
      const blob = new Blob([JSON.stringify(response.logs, null, 2)], {
        type: 'application/json'
      })
      return blob
    } catch (error) {
      throw new Error('Failed to export logs')
    }
  }

  // Download logs as file
  downloadLogsAsFile(blob: Blob, filename: string = 'logs.json'): void {
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  }
}

export const logsApi = new LogsApi()
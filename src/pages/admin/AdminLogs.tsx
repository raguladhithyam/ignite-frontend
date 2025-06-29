import React, { useState, useEffect } from 'react'
import { logsApi, LogEntry, LogStats, LogFilters } from '../../api/logs'

const AdminLogs: React.FC = () => {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [stats, setStats] = useState<LogStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [availableLevels, setAvailableLevels] = useState<string[]>([])
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalLogs, setTotalLogs] = useState(0)
  
  // Filter state
  const [filters, setFilters] = useState<LogFilters>({
    level: '',
    startDate: '',
    endDate: '',
    search: '',
    limit: 50
  })

  // Refresh state
  const [autoRefresh, setAutoRefresh] = useState(false)
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null)

  useEffect(() => {
    loadInitialData()
    return () => {
      if (refreshInterval) clearInterval(refreshInterval)
    }
  }, [])

  useEffect(() => {
    loadLogs()
  }, [currentPage, filters])

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(loadLogs, 10000) // Refresh every 10 seconds
      setRefreshInterval(interval)
    } else {
      if (refreshInterval) {
        clearInterval(refreshInterval)
        setRefreshInterval(null)
      }
    }
    return () => {
      if (refreshInterval) clearInterval(refreshInterval)
    }
  }, [autoRefresh])

  const loadInitialData = async () => {
    try {
      const [levelsResponse, statsResponse] = await Promise.all([
        logsApi.getLogLevels(),
        logsApi.getLogStats()
      ])
      setAvailableLevels(levelsResponse.levels)
      setStats(statsResponse)
    } catch (err) {
      console.error('Error loading initial data:', err)
    }
  }

  const loadLogs = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await logsApi.getLogs({
        ...filters,
        page: currentPage
      })
      
      setLogs(response.logs)
      setCurrentPage(response.pagination.currentPage)
      setTotalPages(response.pagination.totalPages)
      setTotalLogs(response.pagination.totalLogs)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load logs')
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (key: keyof LogFilters, value: string | number) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    setCurrentPage(1) // Reset to first page when filters change
  }

  const clearFilters = () => {
    setFilters({
      level: '',
      startDate: '',
      endDate: '',
      search: '',
      limit: 50
    })
    setCurrentPage(1)
  }

  const exportLogs = async () => {
    try {
      const blob = await logsApi.exportLogs(filters)
      const timestamp = new Date().toISOString().split('T')[0]
      logsApi.downloadLogsAsFile(blob, `logs-${timestamp}.json`)
    } catch (err) {
      setError('Failed to export logs')
    }
  }

  const clearLogs = async () => {
    if (window.confirm('Are you sure you want to clear all logs? This action cannot be undone.')) {
      try {
        await logsApi.clearLogs('all')
        loadLogs()
        loadInitialData()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to clear logs')
      }
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  const getLevelColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'error': return 'text-red-600 bg-red-50'
      case 'warn': return 'text-yellow-600 bg-yellow-50'
      case 'warning': return 'text-yellow-600 bg-yellow-50'
      case 'info': return 'text-blue-600 bg-blue-50'
      case 'debug': return 'text-gray-600 bg-gray-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">System Logs</h1>
        <p className="text-gray-600">Monitor and analyze system activities</p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow border">
            <h3 className="text-sm font-medium text-gray-500">Total Logs</h3>
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border">
            <h3 className="text-sm font-medium text-gray-500">Last 24h</h3>
            <p className="text-2xl font-bold text-blue-600">{stats.recent.last24h}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border">
            <h3 className="text-sm font-medium text-gray-500">Errors</h3>
            <p className="text-2xl font-bold text-red-600">{stats.byLevel.error || 0}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border">
            <h3 className="text-sm font-medium text-gray-500">Warnings</h3>
            <p className="text-2xl font-bold text-yellow-600">{stats.byLevel.warn || stats.byLevel.warning || 0}</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow border mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Level</label>
            <select
              value={filters.level}
              onChange={(e) => handleFilterChange('level', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Levels</option>
              {availableLevels.map(level => (
                <option key={level} value={level}>{level.toUpperCase()}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input
              type="datetime-local"
              value={filters.startDate}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input
              type="datetime-local"
              value={filters.endDate}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <input
              type="text"
              placeholder="Search logs..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        
        <div className="flex justify-between items-center">
          <div className="flex gap-2">
            <button
              onClick={clearFilters}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Clear Filters
            </button>
            <button
              onClick={loadLogs}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Refresh
            </button>
          </div>
          
          <div className="flex gap-2 items-center">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="mr-2"
              />
              Auto Refresh
            </label>
            <button
              onClick={exportLogs}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              Export
            </button>
            <button
              onClick={clearLogs}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              Clear Logs
            </button>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Logs Table */}
      <div className="bg-white rounded-lg shadow border overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-medium text-gray-800">
              Logs ({totalLogs} total)
            </h2>
            <div className="text-sm text-gray-600">
              Page {currentPage} of {totalPages}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading logs...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No logs found matching your criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Timestamp
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Level
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Message
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Service
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {logs.map((log, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(log.timestamp)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getLevelColor(log.level)}`}>
                        {log.level.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 max-w-md">
                      <div className="truncate" title={log.message}>
                        {log.message}
                      </div>
                      {log.stack && (
                        <details className="mt-2">
                          <summary className="cursor-pointer text-blue-600 text-xs">
                            Stack Trace
                          </summary>
                          <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-x-auto">
                            {log.stack}
                          </pre>
                        </details>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {log.service}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-3 border-t border-gray-200 flex justify-between items-center">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Previous
            </button>
            
            <div className="flex gap-2">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const page = Math.max(1, Math.min(currentPage - 2 + i, totalPages - 4 + i))
                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-1 text-sm rounded-md ${
                      currentPage === page
                        ? 'bg-blue-600 text-white'
                        : 'border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {page}
                  </button>
                )
              })}
            </div>
            
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminLogs
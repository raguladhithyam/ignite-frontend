import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Play, Pause, Trash2, Download, RefreshCw, Wifi, WifiOff } from 'lucide-react'
import { logsApi } from '@/api/logs'

interface LogEntry {
  id: string
  timestamp: string
  level: string
  message: string
  raw: string
}

export default function AdminLogs() {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [connectionError, setConnectionError] = useState(false)
  const [autoScroll, setAutoScroll] = useState(true)
  
  const eventSourceRef = useRef<EventSource | null>(null)
  const logsContainerRef = useRef<HTMLDivElement>(null)
  const pausedLogsRef = useRef<LogEntry[]>([])

  useEffect(() => {
    connectToLogs()
    return () => {
      disconnectFromLogs()
    }
  }, [])

  useEffect(() => {
    if (autoScroll && logsContainerRef.current) {
      logsContainerRef.current.scrollTop = logsContainerRef.current.scrollHeight
    }
  }, [logs, autoScroll])

  const connectToLogs = () => {
    try {
      setConnectionError(false)
      eventSourceRef.current = logsApi.connect(
        (data: string) => {
          const logEntry = parseLogEntry(data)
          
          if (isPaused) {
            pausedLogsRef.current.push(logEntry)
          } else {
            setLogs(prev => [...prev.slice(-999), logEntry]) // Keep last 1000 logs
          }
        },
        () => {
          setIsConnected(false)
          setConnectionError(true)
        }
      )
      
      eventSourceRef.current.onopen = () => {
        setIsConnected(true)
        setConnectionError(false)
      }
    } catch (error) {
      setConnectionError(true)
      setIsConnected(false)
    }
  }

  const disconnectFromLogs = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
      eventSourceRef.current = null
    }
    setIsConnected(false)
  }

  const parseLogEntry = (rawLog: string): LogEntry => {
    // Basic log parsing - adjust based on your log format
    const timestamp = new Date().toISOString()
    let level = 'INFO'
    let message = rawLog

    // Try to extract log level
    const levelMatch = rawLog.match(/\[(ERROR|WARN|INFO|DEBUG)\]/i)
    if (levelMatch) {
      level = levelMatch[1].toUpperCase()
    }

    // Try to extract timestamp if present
    const timestampMatch = rawLog.match(/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z)/)
    const extractedTimestamp = timestampMatch ? timestampMatch[1] : timestamp

    return {
      id: `${Date.now()}-${Math.random()}`,
      timestamp: extractedTimestamp,
      level,
      message: rawLog.trim(),
      raw: rawLog
    }
  }

  const handlePauseToggle = () => {
    if (isPaused) {
      // Resume: add paused logs to main logs
      setLogs(prev => [...prev, ...pausedLogsRef.current].slice(-1000))
      pausedLogsRef.current = []
    }
    setIsPaused(!isPaused)
  }

  const clearLogs = () => {
    setLogs([])
    pausedLogsRef.current = []
  }

  const downloadLogs = () => {
    const allLogs = [...logs, ...pausedLogsRef.current]
    const logContent = allLogs.map(log => log.raw).join('\n')
    const blob = new Blob([logContent], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `logs-${new Date().toISOString().split('T')[0]}.log`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const reconnect = () => {
    disconnectFromLogs()
    setTimeout(connectToLogs, 1000)
  }

  const getLogLevelVariant = (level: string) => {
    switch (level.toUpperCase()) {
      case 'ERROR': return 'destructive'
      case 'WARN': return 'default'
      case 'INFO': return 'secondary'
      case 'DEBUG': return 'outline'
      default: return 'secondary'
    }
  }

  const formatTimestamp = (timestamp: string) => {
    try {
      return new Date(timestamp).toLocaleString()
    } catch {
      return timestamp
    }
  }

  const totalLogs = logs.length + pausedLogsRef.current.length

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">System Logs</h1>
          <p className="text-gray-600 mt-2">Real-time monitoring of application logs</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            {isConnected ? (
              <Wifi className="h-4 w-4 text-green-600" />
            ) : (
              <WifiOff className="h-4 w-4 text-red-600" />
            )}
            <Badge variant={isConnected ? 'default' : 'destructive'}>
              {isConnected ? 'Connected' : 'Disconnected'}
            </Badge>
          </div>
          
          {connectionError && (
            <Button
              variant="outline"
              onClick={reconnect}
              size="sm"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Reconnect
            </Button>
          )}

          <Button
            variant="outline"
            onClick={handlePauseToggle}
            size="sm"
          >
            {isPaused ? (
              <>
                <Play className="h-4 w-4 mr-2" />
                Resume
              </>
            ) : (
              <>
                <Pause className="h-4 w-4 mr-2" />
                Pause
              </>
            )}
          </Button>

          <Button
            variant="outline"
            onClick={downloadLogs}
            size="sm"
            disabled={totalLogs === 0}
          >
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>

          <Button
            variant="outline"
            onClick={clearLogs}
            size="sm"
            disabled={totalLogs === 0}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Clear
          </Button>
        </div>
      </div>

      {/* Controls */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="autoScroll"
                  checked={autoScroll}
                  onChange={(e) => setAutoScroll(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="autoScroll" className="text-sm font-medium text-gray-700">
                  Auto-scroll
                </label>
              </div>
              
              {isPaused && pausedLogsRef.current.length > 0 && (
                <Badge variant="outline" className="text-orange-600 border-orange-300">
                  {pausedLogsRef.current.length} logs paused
                </Badge>
              )}
            </div>

            <div className="text-sm text-gray-500">
              Total logs: {totalLogs.toLocaleString()}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Logs Display */}
      <Card>
        <CardHeader>
          <CardTitle>Live Logs</CardTitle>
          <CardDescription>
            {isConnected ? 'Streaming live logs from the server' : 'Not connected to log stream'}
            {isPaused && ' (Paused)'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            ref={logsContainerRef}
            className="bg-gray-900 text-gray-100 p-4 rounded-lg h-96 overflow-y-auto font-mono text-sm"
            style={{ scrollBehavior: autoScroll ? 'smooth' : 'auto' }}
          >
            {logs.length === 0 && pausedLogsRef.current.length === 0 ? (
              <div className="text-center text-gray-400 mt-8">
                {isConnected ? 'Waiting for logs...' : 'Connect to view logs'}
              </div>
            ) : (
              <div className="space-y-1">
                {logs.map((log) => (
                  <div key={log.id} className="flex items-start gap-3 py-1 hover:bg-gray-800 px-2 rounded">
                    <span className="text-gray-400 text-xs whitespace-nowrap">
                      {formatTimestamp(log.timestamp).split(' ')[1]}
                    </span>
                    <Badge 
                      variant={getLogLevelVariant(log.level)} 
                      className="text-xs min-w-16 text-center"
                    >
                      {log.level}
                    </Badge>
                    <span className="flex-1 break-all">{log.message}</span>
                  </div>
                ))}
                
                {isPaused && pausedLogsRef.current.length > 0 && (
                  <div className="border-t border-gray-700 pt-2 mt-2">
                    <div className="text-orange-400 text-xs mb-2">
                      --- {pausedLogsRef.current.length} paused logs (resume to view) ---
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Connection Status */}
      {connectionError && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <WifiOff className="h-5 w-5 text-red-600" />
                <div>
                  <p className="text-red-800 font-medium">Connection Lost</p>
                  <p className="text-red-600 text-sm">Unable to connect to log stream</p>
                </div>
              </div>
              <Button
                variant="outline"
                onClick={reconnect}
                size="sm"
                className="border-red-300 text-red-700 hover:bg-red-50"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry Connection
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
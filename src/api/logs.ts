const API_BASE_URL = import.meta.env.VITE_API_URL

export const logsApi = {
  connect: (onMessage: (data: string) => void, onError?: () => void): EventSource => {
    const eventSource = new EventSource(`${API_BASE_URL}/logs/stream`)

    eventSource.onmessage = (e) => onMessage(e.data)

    eventSource.onerror = () => {
      eventSource.close()
      if (onError) onError()
    }

    return eventSource
  }
}
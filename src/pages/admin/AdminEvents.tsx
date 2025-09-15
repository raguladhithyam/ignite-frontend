import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { eventsApi } from '@/api/events'
import { Event } from '@/types'
import { Search, Plus, Edit, Trash2, Calendar, Clock, X, Settings } from 'lucide-react'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { toast } from 'sonner'
import { formatDate, formatTime } from '@/lib/utils'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Label } from '@/components/ui/label'

interface EventDayForm {
  id?: string
  date: string
  fnEnabled: boolean
  anEnabled: boolean
  fnStartTime: string
  fnEndTime: string
  anStartTime: string
  anEndTime: string
}

export default function AdminEvents() {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showEventDaysModal, setShowEventDaysModal] = useState(false)
  const [eventToDelete, setEventToDelete] = useState<string | null>(null)
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [selectedEventForDays, setSelectedEventForDays] = useState<Event | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    startDate: '',
    endDate: '',
    eventDays: [] as EventDayForm[]
  })

  useEffect(() => {
    fetchEvents()
  }, [])

  const fetchEvents = async () => {
    try {
      setLoading(true)
      const data = await eventsApi.getEvents()
      setEvents(data)
    } catch (error) {
      toast.error('Failed to fetch events')
    } finally {
      setLoading(false)
    }
  }

  const generateEventDays = () => {
    if (!formData.startDate || !formData.endDate) return

    const start = new Date(formData.startDate)
    const end = new Date(formData.endDate)
    const days: EventDayForm[] = []

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      days.push({
        date: d.toISOString().split('T')[0],
        fnEnabled: true,
        anEnabled: true,
        fnStartTime: '08:45',
        fnEndTime: '09:15',
        anStartTime: '14:00',
        anEndTime: '14:30'
      })
    }

    setFormData(prev => ({ ...prev, eventDays: days }))
  }

  const removeEventDay = (index: number) => {
    setFormData(prev => ({
      ...prev,
      eventDays: prev.eventDays.filter((_, i) => i !== index)
    }))
  }

  const updateEventDay = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      eventDays: prev.eventDays.map((day, i) => 
        i === index ? { ...day, [field]: value } : day
      )
    }))
  }

  const handleSubmit = async () => {
    
    if (!formData.name || !formData.startDate || !formData.endDate) {
      toast.error('Please fill in all required fields')
      return
    }

    if (formData.eventDays.length === 0) {
      toast.error('Please generate event days')
      return
    }

    try {
      setSubmitting(true)
      if (selectedEvent) {
        await eventsApi.updateEvent(selectedEvent.id, {
          name: formData.name,
          description: formData.description,
          startDate: formData.startDate,
          endDate: formData.endDate
        })
        toast.success('Event updated successfully', { duration: 2000 })
      } else {
        await eventsApi.createEvent(formData)
        toast.success('Event created successfully', { duration: 2000 })
      }
      
      fetchEvents()
      setShowModal(false)
      resetForm()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save event')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteClick = (id: string) => {
    setEventToDelete(id)
    setShowDeleteDialog(true)
  }

  const handleDeleteConfirm = async () => {
    if (!eventToDelete) return

    try {
      setDeleting(true)
      await eventsApi.deleteEvent(eventToDelete)
      toast.success('Event deleted successfully', { duration: 2000 })
      fetchEvents()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete event')
    } finally {
      setDeleting(false)
      setShowDeleteDialog(false)
      setEventToDelete(null)
    }
  }

  const handleDeleteCancel = () => {
    setShowDeleteDialog(false)
    setEventToDelete(null)
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      startDate: '',
      endDate: '',
      eventDays: []
    })
    setSelectedEvent(null)
  }

  const openModal = (event?: Event) => {
    if (event) {
      setSelectedEvent(event)
      setFormData({
        name: event.name,
        description: event.description || '',
        startDate: event.startDate.split('T')[0],
        endDate: event.endDate.split('T')[0],
        eventDays: event.eventDays.map(day => ({
          id: day.id,
          date: day.date.split('T')[0],
          fnEnabled: day.fnEnabled,
          anEnabled: day.anEnabled,
          fnStartTime: day.fnStartTime,
          fnEndTime: day.fnEndTime,
          anStartTime: day.anStartTime,
          anEndTime: day.anEndTime
        }))
      })
    } else {
      resetForm()
    }
    setShowModal(true)
  }

  const openEventDaysModal = async (event: Event) => {
    try {
      const eventWithDays = await eventsApi.getEvent(event.id)
      setSelectedEventForDays(eventWithDays)
      setShowEventDaysModal(true)
    } catch (error) {
      toast.error('Failed to load event details')
    }
  }

  const updateEventDayInModal = async (dayId: string, updates: Partial<EventDayForm>) => {
    try {
      await eventsApi.updateEventDay(dayId, updates)
      toast.success('Event day updated successfully')
      
      // Refresh the event data
      const updatedEvent = await eventsApi.getEvent(selectedEventForDays!.id)
      setSelectedEventForDays(updatedEvent)
      fetchEvents()
    } catch (error) {
      toast.error('Failed to update event day')
    }
  }

  const filteredEvents = events.filter(event =>
    event.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Events</h1>
          <p className="text-gray-600 mt-2">Manage events and attendance sessions</p>
        </div>
        <Button onClick={() => openModal()}>
          <Plus className="h-4 w-4 mr-2" />
          Add Event
        </Button>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search events..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Events List */}
      {loading ? (
        <div className="flex justify-center py-8">
          <LoadingSpinner />
        </div>
      ) : filteredEvents.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="flex flex-col items-center space-y-4">
              <Calendar className="h-12 w-12 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-900">No events found</h3>
              <p className="text-gray-600">
                {searchTerm ? 'No events match your search criteria.' : 'Get started by creating your first event.'}
              </p>
              {!searchTerm && (
                <Button onClick={() => openModal()}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create New Event
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredEvents.map((event) => (
            <Card key={event.id} className="card-hover">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl">{event.name}</CardTitle>
                    <CardDescription className="mt-2">
                      {event.description}
                    </CardDescription>
                    <div className="flex items-center gap-4 mt-3 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {formatDate(event.startDate)} - {formatDate(event.endDate)}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {event.eventDays.length} days
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={event.isActive ? "default" : "secondary"}>
                      {event.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEventDaysModal(event)}
                        title="Manage Event Days"
                      >
                        <Settings className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openModal(event)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteClick(event.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Event Days:</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                    {event.eventDays.map((day) => (
                      <div key={day.id} className="p-3 bg-gray-50 rounded-lg text-sm">
                        <div className="font-medium">{formatDate(day.date)}</div>
                        <div className="text-gray-600 mt-1">
                          {day.fnEnabled && (
                            <div>FN: {formatTime(day.fnStartTime)} - {formatTime(day.fnEndTime)}</div>
                          )}
                          {day.anEnabled && (
                            <div>AN: {formatTime(day.anStartTime)} - {formatTime(day.anEndTime)}</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Event Form Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedEvent ? 'Edit Event' : 'Add New Event'}
            </DialogTitle>
            <DialogDescription>
              {selectedEvent ? 'Update event information' : 'Create a new event'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Event Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Ignite"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Event description..."
                className="w-full h-20 px-3 py-2 rounded-md border border-input bg-background text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date *</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">End Date *</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                  required
                />
              </div>
            </div>

            {!selectedEvent && (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={generateEventDays}
                    disabled={!formData.startDate || !formData.endDate}
                  >
                    Generate Event Days
                  </Button>
                  {formData.eventDays.length > 0 && (
                    <p className="text-sm text-gray-600">
                      {formData.eventDays.length} days generated
                    </p>
                  )}
                </div>

                {/* Generated Event Days List */}
                {formData.eventDays.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-medium text-sm">Event Days:</h4>
                    <div className="max-h-64 overflow-y-auto space-y-2">
                      {formData.eventDays.map((day, index) => (
                        <div key={index} className="border rounded-lg p-4 bg-gray-50">
                          <div className="flex items-center justify-between mb-3">
                            <span className="font-medium">{formatDate(day.date)}</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeEventDay(index)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                            {/* FN Session */}
                            <div className="space-y-2">
                              <div className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  id={`fn-${index}`}
                                  checked={day.fnEnabled}
                                  onChange={(e) => updateEventDay(index, 'fnEnabled', e.target.checked)}
                                />
                                <Label htmlFor={`fn-${index}`} className="text-sm font-medium">FN Session</Label>
                              </div>
                              {day.fnEnabled && (
                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <Label className="text-xs">Start</Label>
                                    <Input
                                      type="time"
                                      value={day.fnStartTime}
                                      onChange={(e) => updateEventDay(index, 'fnStartTime', e.target.value)}
                                      className="text-sm"
                                    />
                                  </div>
                                  <div>
                                    <Label className="text-xs">End</Label>
                                    <Input
                                      type="time"
                                      value={day.fnEndTime}
                                      onChange={(e) => updateEventDay(index, 'fnEndTime', e.target.value)}
                                      className="text-sm"
                                    />
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* AN Session */}
                            <div className="space-y-2">
                              <div className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  id={`an-${index}`}
                                  checked={day.anEnabled}
                                  onChange={(e) => updateEventDay(index, 'anEnabled', e.target.checked)}
                                />
                                <Label htmlFor={`an-${index}`} className="text-sm font-medium">AN Session</Label>
                              </div>
                              {day.anEnabled && (
                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <Label className="text-xs">Start</Label>
                                    <Input
                                      type="time"
                                      value={day.anStartTime}
                                      onChange={(e) => updateEventDay(index, 'anStartTime', e.target.value)}
                                      className="text-sm"
                                    />
                                  </div>
                                  <div>
                                    <Label className="text-xs">End</Label>
                                    <Input
                                      type="time"
                                      value={day.anEndTime}
                                      onChange={(e) => updateEventDay(index, 'anEndTime', e.target.value)}
                                      className="text-sm"
                                    />
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowModal(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button type="button" disabled={submitting} onClick={handleSubmit}>
                {submitting ? (
                  <>
                    <LoadingSpinner />
                    {selectedEvent ? 'Updating...' : 'Creating...'}
                  </>
                ) : (
                  selectedEvent ? 'Update' : 'Create'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Event Days Management Modal */}
      <Dialog open={showEventDaysModal} onOpenChange={setShowEventDaysModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Manage Event Days - {selectedEventForDays?.name}</DialogTitle>
            <DialogDescription>
              Edit session timings and availability for each day
            </DialogDescription>
          </DialogHeader>

          {selectedEventForDays && (
            <div className="space-y-4">
              {selectedEventForDays.eventDays.map((day) => (
                <div key={day.id} className="border rounded-lg p-4 bg-gray-50">
                  <h4 className="font-medium mb-3">{formatDate(day.date)}</h4>
                  
                  <div className="grid grid-cols-2 gap-6">
                    {/* FN Session */}
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`fn-${day.id}`}
                          checked={day.fnEnabled}
                          onChange={(e) => updateEventDayInModal(day.id, { fnEnabled: e.target.checked })}
                        />
                        <Label htmlFor={`fn-${day.id}`} className="font-medium">FN Session</Label>
                      </div>
                      {day.fnEnabled && (
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label className="text-sm">Start Time</Label>
                            <Input
                              type="time"
                              value={day.fnStartTime}
                              onChange={(e) => updateEventDayInModal(day.id, { fnStartTime: e.target.value })}
                            />
                          </div>
                          <div>
                            <Label className="text-sm">End Time</Label>
                            <Input
                              type="time"
                              value={day.fnEndTime}
                              onChange={(e) => updateEventDayInModal(day.id, { fnEndTime: e.target.value })}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* AN Session */}
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`an-${day.id}`}
                          checked={day.anEnabled}
                          onChange={(e) => updateEventDayInModal(day.id, { anEnabled: e.target.checked })}
                        />
                        <Label htmlFor={`an-${day.id}`} className="font-medium">AN Session</Label>
                      </div>
                      {day.anEnabled && (
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label className="text-sm">Start Time</Label>
                            <Input
                              type="time"
                              value={day.anStartTime}
                              onChange={(e) => updateEventDayInModal(day.id, { anStartTime: e.target.value })}
                            />
                          </div>
                          <div>
                            <Label className="text-sm">End Time</Label>
                            <Input
                              type="time"
                              value={day.anEndTime}
                              onChange={(e) => updateEventDayInModal(day.id, { anEndTime: e.target.value })}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              
              <div className="flex justify-end pt-4">
                <Button onClick={() => setShowEventDaysModal(false)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Alert Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the event
              and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleDeleteCancel} disabled={deleting}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} disabled={deleting}>
              {deleting ? (
                <>
                  <LoadingSpinner />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
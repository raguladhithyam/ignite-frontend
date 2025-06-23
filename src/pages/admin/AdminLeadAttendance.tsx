import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { leadAttendanceApi, LeadAttendanceRecord, BrigadeLead } from '@/api/leadAttendance'
import { UserCheck, Clock, Users, Calendar, Plus, Trash2, Download } from 'lucide-react'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { toast } from 'sonner'
import { formatDate } from '@/lib/utils'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import * as XLSX from 'xlsx'

export default function AdminLeadAttendance() {
  const [attendanceRecords, setAttendanceRecords] = useState<LeadAttendanceRecord[]>([])
  const [brigadeLeads, setBrigadeLeads] = useState<BrigadeLead[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedLead, setSelectedLead] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 20
  })
  const [summary, setSummary] = useState<any>(null)
  const [showMarkModal, setShowMarkModal] = useState(false)
  const [showBulkModal, setShowBulkModal] = useState(false)
  const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set())
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [recordToDelete, setRecordToDelete] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const [markFormData, setMarkFormData] = useState({
    userId: '',
    date: new Date().toISOString().split('T')[0],
    status: 'PRESENT' as 'PRESENT' | 'ABSENT' | 'LATE',
    notes: ''
  })

  const [bulkFormData, setBulkFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    status: 'PRESENT' as 'PRESENT' | 'ABSENT' | 'LATE',
    notes: ''
  })

  useEffect(() => {
    fetchBrigadeLeads()
  }, [])

  useEffect(() => {
    fetchAttendanceRecords()
    fetchSummary()
  }, [pagination.currentPage, selectedLead, selectedStatus, startDate, endDate])

  const fetchBrigadeLeads = async () => {
    try {
      const data = await leadAttendanceApi.getBrigadeLeads()
      setBrigadeLeads(data)
    } catch (error) {
      console.error('Failed to fetch brigade leads:', error)
    }
  }

  const fetchAttendanceRecords = async () => {
    try {
      setLoading(true)
      const response = await leadAttendanceApi.getLeadAttendanceRecords({
        page: pagination.currentPage,
        limit: pagination.itemsPerPage,
        userId: selectedLead || undefined,
        status: selectedStatus as any || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined
      })
      
      setAttendanceRecords(response.data)
      setPagination(response.pagination)
    } catch (error) {
      toast.error('Failed to fetch attendance records')
    } finally {
      setLoading(false)
    }
  }

  const fetchSummary = async () => {
    try {
      const data = await leadAttendanceApi.getLeadAttendanceSummary({
        userId: selectedLead || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined
      })
      setSummary(data)
    } catch (error) {
      console.error('Failed to fetch summary:', error)
    }
  }

  const handleExportData = () => {
    if (attendanceRecords.length === 0) {
      toast.error('No data to export')
      return
    }

    try {
      // Prepare data for export
      const exportData = attendanceRecords.map(record => ({
        'Lead Name': `${record.user.firstName} ${record.user.lastName}`,
        'Brigade Name': record.user.brigadeLeadBrigades.map(b => b.name).join(', '),
        'Date': formatDate(record.date),
        'Attendance': record.status,
        'Notes': record.notes || '',
        'Marked By': `${record.marker.firstName} ${record.marker.lastName}`
      }))

      // Create workbook and worksheet
      const wb = XLSX.utils.book_new()
      const ws = XLSX.utils.json_to_sheet(exportData)

      // Auto-size columns
      const colWidths = [
        { wch: 20 }, // Lead Name
        { wch: 20 }, // Brigades
        { wch: 12 }, // Date
        { wch: 10 }, // Status
        { wch: 15 }, // Notes
        { wch: 20 }  // Marked By
      ]
      ws['!cols'] = colWidths

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(wb, ws, 'Lead Attendance')

      // Generate and download file
      XLSX.writeFile(wb, 'Lead Attendance.xlsx')
      
      toast.success('Data exported successfully')
    } catch (error) {
      console.error('Export failed:', error)
      toast.error('Failed to export data')
    }
  }

  const handleMarkAttendance = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!markFormData.userId || !markFormData.date) {
      toast.error('Please fill in all required fields')
      return
    }

    try {
      await leadAttendanceApi.markLeadAttendance(markFormData)
      toast.success('Attendance marked successfully', { duration: 2000 })
      setShowMarkModal(false)
      setMarkFormData({
        userId: '',
        date: new Date().toISOString().split('T')[0],
        status: 'PRESENT',
        notes: ''
      })
      fetchAttendanceRecords()
      fetchSummary()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to mark attendance')
    }
  }

  const handleBulkMarkAttendance = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (selectedLeads.size === 0 || !bulkFormData.date) {
      toast.error('Please select leads and date')
      return
    }

    try {
      await leadAttendanceApi.bulkMarkLeadAttendance({
        userIds: Array.from(selectedLeads),
        date: bulkFormData.date,
        status: bulkFormData.status,
        notes: bulkFormData.notes
      })
      toast.success(`Attendance marked for ${selectedLeads.size} leads`, { duration: 2000 })
      setShowBulkModal(false)
      setSelectedLeads(new Set())
      setBulkFormData({
        date: new Date().toISOString().split('T')[0],
        status: 'PRESENT',
        notes: ''
      })
      fetchAttendanceRecords()
      fetchSummary()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to mark bulk attendance')
    }
  }

  const handleDeleteClick = (id: string) => {
    setRecordToDelete(id)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!recordToDelete) return

    try {
      setIsDeleting(true)
      await leadAttendanceApi.deleteLeadAttendanceRecord(recordToDelete)
      toast.success('Attendance record deleted successfully', { duration: 2000 })
      fetchAttendanceRecords()
      fetchSummary()
      setDeleteDialogOpen(false)
      setRecordToDelete(null)
    } catch (error) {
      toast.error('Failed to delete attendance record')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false)
    setRecordToDelete(null)
  }

  const toggleLeadSelection = (leadId: string) => {
    const newSelection = new Set(selectedLeads)
    if (newSelection.has(leadId)) {
      newSelection.delete(leadId)
    } else {
      newSelection.add(leadId)
    }
    setSelectedLeads(newSelection)
  }

  const selectAllLeads = () => {
    setSelectedLeads(new Set(brigadeLeads.map(lead => lead.id)))
  }

  const clearSelection = () => {
    setSelectedLeads(new Set())
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'PRESENT': return 'default'
      case 'ABSENT': return 'destructive'
      case 'LATE': return 'secondary'
      default: return 'secondary'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Lead Attendance</h1>
          <p className="text-gray-600 mt-2">Manage brigade lead attendance records</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleExportData} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Data
          </Button>
          <Button onClick={() => setShowBulkModal(true)} variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Bulk Mark
          </Button>
          <Button onClick={() => setShowMarkModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Mark Attendance
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Brigade Lead</label>
              <select
                value={selectedLead}
                onChange={(e) => setSelectedLead(e.target.value)}
                className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
              >
                <option value="">All Leads</option>
                {brigadeLeads.map((lead) => (
                  <option key={lead.id} value={lead.id}>
                    {lead.firstName} {lead.lastName}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
              >
                <option value="PRESENT">Present</option>
                <option value="ABSENT">Absent</option>
                <option value="LATE">Late</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Start Date</label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">End Date</label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Records</p>
                  <p className="text-3xl font-bold text-gray-900">{summary.summary.totalRecords}</p>
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
                  <p className="text-3xl font-bold text-green-600">{summary.summary.presentCount}</p>
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
                  <p className="text-3xl font-bold text-red-600">{summary.summary.absentCount}</p>
                </div>
                <Clock className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Attendance %</p>
                  <p className="text-3xl font-bold text-blue-600">{summary.summary.presentPercentage}%</p>
                </div>
                <Calendar className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Attendance Records */}
      <Card>
        <CardHeader>
          <CardTitle>Lead Attendance Records</CardTitle>
          <CardDescription>
            {pagination.totalItems} total records found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner />
            </div>
          ) : attendanceRecords.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No attendance records found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium">Lead Name</th>
                    <th className="text-left py-3 px-4 font-medium">Email</th>
                    <th className="text-left py-3 px-4 font-medium">Brigades</th>
                    <th className="text-left py-3 px-4 font-medium">Date</th>
                    <th className="text-left py-3 px-4 font-medium">Status</th>
                    <th className="text-left py-3 px-4 font-medium">Notes</th>
                    <th className="text-left py-3 px-4 font-medium">Marked By</th>
                    <th className="text-left py-3 px-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {attendanceRecords.map((record) => (
                    <tr key={record.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium">
                            {record.user.firstName} {record.user.lastName}
                          </p>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm">
                        {record.user.email}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1">
                          {record.user.brigadeLeadBrigades.map((brigade) => (
                            <Badge key={brigade.id} variant="secondary" className="text-xs">
                              {brigade.name}
                            </Badge>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm">
                        {formatDate(record.date)}
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant={getStatusBadgeVariant(record.status)}>
                          {record.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-sm">
                        {record.notes || '-'}
                      </td>
                      <td className="py-3 px-4 text-sm">
                        {record.marker.firstName} {record.marker.lastName}
                      </td>
                      <td className="py-3 px-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteClick(record.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
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

      {/* Mark Attendance Modal */}
      <Dialog open={showMarkModal} onOpenChange={setShowMarkModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark Lead Attendance</DialogTitle>
            <DialogDescription>
              Mark attendance for a brigade lead
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleMarkAttendance} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="userId">Brigade Lead *</Label>
              <select
                id="userId"
                value={markFormData.userId}
                onChange={(e) => setMarkFormData(prev => ({ ...prev, userId: e.target.value }))}
                className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                required
              >
                <option value="">Select Brigade Lead</option>
                {brigadeLeads.map((lead) => (
                  <option key={lead.id} value={lead.id}>
                    {lead.firstName} {lead.lastName} - {lead.brigadeLeadBrigades.map(b => b.name).join(', ')}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">Date *</Label>
              <Input
                id="date"
                type="date"
                value={markFormData.date}
                onChange={(e) => setMarkFormData(prev => ({ ...prev, date: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status *</Label>
              <select
                id="status"
                value={markFormData.status}
                onChange={(e) => setMarkFormData(prev => ({ ...prev, status: e.target.value as any }))}
                className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                required
              >
                <option value="PRESENT">Present</option>
                <option value="ABSENT">Absent</option>
                <option value="LATE">Late</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <textarea
                id="notes"
                value={markFormData.notes}
                onChange={(e) => setMarkFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Optional notes..."
                className="w-full h-20 px-3 py-2 rounded-md border border-input bg-background text-sm"
              />
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowMarkModal(false)}
              >
                Cancel
              </Button>
              <Button type="submit">
                Mark Attendance
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Bulk Mark Modal */}
      <Dialog open={showBulkModal} onOpenChange={setShowBulkModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Bulk Mark Lead Attendance</DialogTitle>
            <DialogDescription>
              Mark attendance for multiple brigade leads
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Lead Selection */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label>Select Brigade Leads</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={selectAllLeads}
                  >
                    Select All
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={clearSelection}
                  >
                    Clear
                  </Button>
                </div>
              </div>
              <div className="max-h-48 overflow-y-auto border rounded-lg p-3 space-y-2">
                {brigadeLeads.map((lead) => (
                  <div key={lead.id} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={`lead-${lead.id}`}
                      checked={selectedLeads.has(lead.id)}
                      onChange={() => toggleLeadSelection(lead.id)}
                      className="rounded border-gray-300"
                    />
                    <label htmlFor={`lead-${lead.id}`} className="text-sm flex-1">
                      {lead.firstName} {lead.lastName} - {lead.brigadeLeadBrigades.map(b => b.name).join(', ')}
                    </label>
                  </div>
                ))}
              </div>
              {selectedLeads.size > 0 && (
                <p className="text-sm text-gray-600">
                  {selectedLeads.size} lead(s) selected
                </p>
              )}
            </div>

            <form onSubmit={handleBulkMarkAttendance} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="bulkDate">Date *</Label>
                <Input
                  id="bulkDate"
                  type="date"
                  value={bulkFormData.date}
                  onChange={(e) => setBulkFormData(prev => ({ ...prev, date: e.target.value }))}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bulkStatus">Status *</Label>
                <select
                  id="bulkStatus"
                  value={bulkFormData.status}
                  onChange={(e) => setBulkFormData(prev => ({ ...prev, status: e.target.value as any }))}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                  required
                >
                  <option value="PRESENT">Present</option>
                  <option value="ABSENT">Absent</option>
                  <option value="LATE">Late</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bulkNotes">Notes</Label>
                <textarea
                  id="bulkNotes"
                  value={bulkFormData.notes}
                  onChange={(e) => setBulkFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Optional notes..."
                  className="w-full h-20 px-3 py-2 rounded-md border border-input bg-background text-sm"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowBulkModal(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={selectedLeads.size === 0}>
                  Mark Attendance ({selectedLeads.size})
                </Button>
              </div>
            </form>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Attendance Record</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this attendance record? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleDeleteCancel} disabled={isDeleting}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
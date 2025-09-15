import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { studentsApi } from '@/api/students'
import { brigadesApi } from '@/api/brigades'
import { uploadsApi } from '@/api/uploads'
import { Student, Brigade } from '@/types'
import { Search, Plus, Upload, Download, Edit, Trash2, Loader2, MoreHorizontal } from 'lucide-react'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { toast } from 'sonner'
import StudentModal from '@/components/modals/StudentModal'
import UploadStudentsModal from '@/components/modals/UploadStudentsModal'
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export default function AdminStudents() {
  const [students, setStudents] = useState<Student[]>([])
  const [brigades, setBrigades] = useState<Brigade[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedBrigade, setSelectedBrigade] = useState('')
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 100000
  })
  const [showStudentModal, setShowStudentModal] = useState(false)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [studentToDelete, setStudentToDelete] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Brigade-based delete state
  const [brigadeDeleteDialogOpen, setBrigadeDeleteDialogOpen] = useState(false)
  const [brigadeToDelete, setBrigadeToDelete] = useState<string>('')
  const [isBrigadeDeleting, setIsBrigadeDeleting] = useState(false)
  const [allStudentsDeleteDialogOpen, setAllStudentsDeleteDialogOpen] = useState(false)
  const [isAllStudentsDeleting, setIsAllStudentsDeleting] = useState(false)

  const handleDeleteClick = (id: string) => {
    setStudentToDelete(id)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!studentToDelete) return

    try {
      setIsDeleting(true)
      await studentsApi.deleteStudent(studentToDelete)
      toast.success('Student deleted successfully', { duration: 2000 })
      fetchStudents() // Your existing function
      setDeleteDialogOpen(false)
      setStudentToDelete(null)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete student')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false)
    setStudentToDelete(null)
  }

  // Brigade-based delete functions
  const handleBrigadeDeleteClick = (brigadeId: string) => {
    setBrigadeToDelete(brigadeId)
    setBrigadeDeleteDialogOpen(true)
  }

  const handleBrigadeDeleteConfirm = async () => {
    try {
      setIsBrigadeDeleting(true)
      const studentsToDelete = students.filter(student => student.brigadeId === brigadeToDelete)
      
      await Promise.all(studentsToDelete.map(student => studentsApi.deleteStudent(student.id)))
      
      const brigadeName = brigades.find(b => b.id === brigadeToDelete)?.name || 'Unknown Brigade'
      toast.success(`All students from ${brigadeName} deleted successfully`, { duration: 2000 })
      fetchStudents()
      setBrigadeDeleteDialogOpen(false)
      setBrigadeToDelete('')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete students')
    } finally {
      setIsBrigadeDeleting(false)
    }
  }

  const handleBrigadeDeleteCancel = () => {
    setBrigadeDeleteDialogOpen(false)
    setBrigadeToDelete('')
  }

  const handleAllStudentsDeleteClick = () => {
    setAllStudentsDeleteDialogOpen(true)
  }

  const handleAllStudentsDeleteConfirm = async () => {
    try {
      setIsAllStudentsDeleting(true)
      
      await Promise.all(students.map(student => studentsApi.deleteStudent(student.id)))
      
      toast.success(`All ${students.length} students deleted successfully`, { duration: 2000 })
      fetchStudents()
      setAllStudentsDeleteDialogOpen(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete all students')
    } finally {
      setIsAllStudentsDeleting(false)
    }
  }

  const handleAllStudentsDeleteCancel = () => {
    setAllStudentsDeleteDialogOpen(false)
  }

  // Helper function to get student count for a brigade
  const getBrigadeStudentCount = (brigadeId: string) => {
    return students.filter(student => student.brigadeId === brigadeId).length
  }

  useEffect(() => {
    fetchStudents()
    fetchBrigades()
  }, [pagination.currentPage, searchTerm, selectedBrigade])

  const fetchStudents = async () => {
    try {
      setLoading(true)
      const response = await studentsApi.getStudents({
        page: pagination.currentPage,
        limit: pagination.itemsPerPage,
        search: searchTerm || undefined,
        brigadeId: selectedBrigade || undefined
      })
      setStudents(response.data)
      setPagination(response.pagination)
    } catch (error) {
      toast.error('Failed to fetch students')
    } finally {
      setLoading(false)
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

  const handleDownloadTemplate = async () => {
    try {
      const blob = await uploadsApi.downloadStudentsTemplate()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'students_template.xlsx'
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      toast.success('Template downloaded successfully', { duration: 2000 })
    } catch (error) {
      toast.error('Failed to download template')
    }
  }

  const handleStudentSaved = () => {
    fetchStudents()
    setShowStudentModal(false)
    setSelectedStudent(null)
  }

  const handleUploadSuccess = () => {
    fetchStudents()
    setShowUploadModal(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Students</h1>
          <p className="text-gray-600 mt-2">Manage student records and information</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleDownloadTemplate}>
            <Download className="h-4 w-4 mr-2" />
            Template
          </Button>
          <Button variant="outline" onClick={() => setShowUploadModal(true)}>
            <Upload className="h-4 w-4 mr-2" />
            Upload
          </Button>
          <Button onClick={() => setShowStudentModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Student
          </Button>
          
          {/* Actions Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <MoreHorizontal className="h-4 w-4 mr-2" />
                Actions
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Delete by Brigade</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {brigades.map((brigade) => (
                <DropdownMenuItem 
                  key={brigade.id}
                  onClick={() => handleBrigadeDeleteClick(brigade.id)}
                  className="text-red-600"
                  disabled={getBrigadeStudentCount(brigade.id) === 0}
                >
                  Delete All from {brigade.name} ({getBrigadeStudentCount(brigade.id)})
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={handleAllStudentsDeleteClick}
                className="text-red-600"
                disabled={students.length === 0}
              >
                Delete All Students ({students.length})
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search students..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-full md:w-48">
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
          </div>
        </CardContent>
      </Card>

      {/* Students Table */}
      <Card>
        <CardHeader>
          <CardTitle>Students List</CardTitle>
          <CardDescription>
            {pagination.totalItems} total students
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner />
            </div>
          ) : students.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No students found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium">Roll Number</th>
                    <th className="text-left py-3 px-4 font-medium">Name</th>
                    <th className="text-left py-3 px-4 font-medium">Email</th>
                    <th className="text-left py-3 px-4 font-medium">Brigade</th>
                    <th className="text-left py-3 px-4 font-medium">Status</th>
                    <th className="text-left py-3 px-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student) => (
                    <tr key={student.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4 font-mono text-sm">
                        {student.tempRollNumber}
                      </td>
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium">
                            {student.firstName} {student.lastName}
                          </p>
                          {student.phone && (
                            <p className="text-sm text-gray-500">{student.phone}</p>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm">
                        {student.email || '-'}
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
                        <Badge variant={student.isActive ? "default" : "secondary"}>
                          {student.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedStudent(student)
                              setShowStudentModal(true)
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteClick(student.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
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

      {/* Modals */}
      <StudentModal
        open={showStudentModal}
        onOpenChange={setShowStudentModal}
        student={selectedStudent}
        brigades={brigades}
        onSaved={handleStudentSaved}
      />

      <UploadStudentsModal
        open={showUploadModal}
        onOpenChange={setShowUploadModal}
        brigades={brigades}
        onSuccess={handleUploadSuccess}
      />
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Student</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this student? This action cannot be undone.
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
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Brigade Delete Confirmation Dialog */}
      <AlertDialog open={brigadeDeleteDialogOpen} onOpenChange={setBrigadeDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete All Students from Brigade</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete all students from "{brigades.find(b => b.id === brigadeToDelete)?.name || 'Unknown Brigade'}"? 
              This will delete {getBrigadeStudentCount(brigadeToDelete)} students. This action cannot be undone and will permanently 
              delete all their data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleBrigadeDeleteCancel} disabled={isBrigadeDeleting}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBrigadeDeleteConfirm}
              disabled={isBrigadeDeleting}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {isBrigadeDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                `Delete All ${getBrigadeStudentCount(brigadeToDelete)} Students`
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* All Students Delete Confirmation Dialog */}
      <AlertDialog open={allStudentsDeleteDialogOpen} onOpenChange={setAllStudentsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete All Students</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete ALL students? This will delete {students.length} students. 
              This action cannot be undone and will permanently delete all student data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleAllStudentsDeleteCancel} disabled={isAllStudentsDeleting}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleAllStudentsDeleteConfirm}
              disabled={isAllStudentsDeleting}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {isAllStudentsDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                `Delete All ${students.length} Students`
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
// Custom Checkbox component since @radix-ui/react-checkbox is not available
const Checkbox = ({ checked, indeterminate, onCheckedChange, ...props }: {
  checked?: boolean
  indeterminate?: boolean
  onCheckedChange?: (checked: boolean) => void
}) => {
  return (
    <input
      type="checkbox"
      checked={checked}
      ref={(el) => {
        if (el) el.indeterminate = indeterminate || false
      }}
      onChange={(e) => onCheckedChange?.(e.target.checked)}
      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
      {...props}
    />
  )
}
import { usersApi } from '@/api/users'
import { User } from '@/types'
import { Search, Plus, Edit, Trash2, Key, Loader2, UserX, Upload } from 'lucide-react'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import FileUpload from '@/components/ui/FileUpload'
import { toast } from 'sonner'
import { formatDateTime } from '@/lib/utils'
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { BulkUploadResult, uploadsApi } from '@/api/uploads'

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedRole, setSelectedRole] = useState('')
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10
  })
  const [showModal, setShowModal] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [showBulkUploadModal, setShowBulkUploadModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    role: 'STUDENT' as 'ADMIN' | 'BRIGADE_LEAD' | 'STUDENT'
  })
  const [passwordData, setPasswordData] = useState({
    newPassword: ''
  })
  
  // Delete confirmation dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [userToDelete, setUserToDelete] = useState<User | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Bulk delete state
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set())
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false)
  const [isBulkDeleting, setIsBulkDeleting] = useState(false)

  // Role-wise delete state
  const [roleDeleteDialogOpen, setRoleDeleteDialogOpen] = useState(false)
  const [roleToDelete, setRoleToDelete] = useState<string>('')
  const [isRoleDeleting, setIsRoleDeleting] = useState(false)

  // Button loading states
  const [isCreatingUser, setIsCreatingUser] = useState(false)
  const [isUpdatingUser, setIsUpdatingUser] = useState(false)
  const [isResettingPassword, setIsResettingPassword] = useState(false)

  // Bulk upload states
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadResult, setUploadResult] = useState<BulkUploadResult | null>(null)

  useEffect(() => {
    fetchUsers()
  }, [pagination.currentPage, searchTerm, selectedRole])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const response = await usersApi.getUsers({
        page: pagination.currentPage,
        limit: pagination.itemsPerPage,
        search: searchTerm || undefined,
        role: selectedRole as any || undefined
      })
      setUsers(response.data)
      setPagination(response.pagination)
      // Clear selected users when data changes
      setSelectedUsers(new Set())
    } catch (error) {
      toast.error('Failed to fetch users')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.email || !formData.firstName || !formData.lastName) {
      toast.error('Please fill in all required fields')
      return
    }

    try {
      if (selectedUser) {
        setIsUpdatingUser(true)
        await usersApi.updateUser(selectedUser.id, {
          email: formData.email,
          firstName: formData.firstName,
          lastName: formData.lastName,
          role: formData.role
        })
        toast.success('User updated successfully', { duration: 2000 })
      } else {
        setIsCreatingUser(true)
        await usersApi.createUser(formData)
        toast.success('User created successfully and welcome email sent', { duration: 3000 })
      }
      
      fetchUsers()
      setShowModal(false)
      resetForm()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save user')
    } finally {
      setIsCreatingUser(false)
      setIsUpdatingUser(false)
    }
  }

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!passwordData.newPassword || !selectedUser) {
      toast.error('Please enter a new password')
      return
    }

    try {
      setIsResettingPassword(true)
      await usersApi.resetPassword(selectedUser.id, passwordData.newPassword)
      toast.success('Password reset successfully', { duration: 2000 })
      setShowPasswordModal(false)
      setPasswordData({ newPassword: '' })
      setSelectedUser(null)
    } catch (error) {
      toast.error('Failed to reset password')
    } finally {
      setIsResettingPassword(false)
    }
  }

  // Bulk upload functions
  const handleFileSelect = (file: File) => {
    setSelectedFile(file)
    setUploadResult(null)
  }

  const handleBulkUpload = async () => {
    if (!selectedFile) {
      toast.error('Please select a file first')
      return
    }

    try {
      setIsUploading(true)
      const result = await uploadsApi.bulkUploadUsers(selectedFile)
      setUploadResult(result)
      
      if (result.emailResults.failed > 0) {
        toast.warning(
          `${result.users.length} users created, but ${result.emailResults.failed} emails failed to send`,
          { duration: 5000 }
        )
      } else {
        toast.success(
          `${result.users.length} users created successfully and welcome emails sent`,
          { duration: 3000 }
        )
      }
      
      fetchUsers()
      setSelectedFile(null)
    } catch (error: any) {
      toast.error(error.message || 'Failed to upload users')
      setUploadResult(null)
    } finally {
      setIsUploading(false)
    }
  }

  const closeBulkUploadModal = () => {
    setShowBulkUploadModal(false)
    setSelectedFile(null)
    setUploadResult(null)
  }

  // Single user delete functions
  const handleDeleteClick = (user: User) => {
    setUserToDelete(user)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!userToDelete) return

    try {
      setIsDeleting(true)
      await usersApi.deleteUser(userToDelete.id)
      toast.success('User deleted successfully', { duration: 2000 })
      fetchUsers()
      setDeleteDialogOpen(false)
      setUserToDelete(null)
    } catch (error) {
      toast.error('Failed to delete user')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false)
    setUserToDelete(null)
  }

  // Bulk selection functions
  const handleSelectUser = (userId: string, checked: boolean) => {
    const newSelected = new Set(selectedUsers)
    if (checked) {
      newSelected.add(userId)
    } else {
      newSelected.delete(userId)
    }
    setSelectedUsers(newSelected)
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedUsers(new Set(users.map(user => user.id)))
    } else {
      setSelectedUsers(new Set())
    }
  }

  const isAllSelected = users.length > 0 && selectedUsers.size === users.length
  const isIndeterminate = selectedUsers.size > 0 && selectedUsers.size < users.length

  // Bulk delete functions
  const handleBulkDeleteClick = () => {
    if (selectedUsers.size === 0) {
      toast.error('Please select users to delete')
      return
    }
    setBulkDeleteDialogOpen(true)
  }

  const handleBulkDeleteConfirm = async () => {
    try {
      setIsBulkDeleting(true)
      const userIds = Array.from(selectedUsers)
      
      // Assuming you have a bulk delete API endpoint
      await Promise.all(userIds.map(id => usersApi.deleteUser(id)))
      
      toast.success(`${userIds.length} users deleted successfully`, { duration: 2000 })
      fetchUsers()
      setBulkDeleteDialogOpen(false)
      setSelectedUsers(new Set())
    } catch (error) {
      toast.error('Failed to delete users')
    } finally {
      setIsBulkDeleting(false)
    }
  }

  const handleBulkDeleteCancel = () => {
    setBulkDeleteDialogOpen(false)
  }

  // Role-wise delete functions
  const handleRoleDeleteClick = (role: string) => {
    setRoleToDelete(role)
    setRoleDeleteDialogOpen(true)
  }

  const handleRoleDeleteConfirm = async () => {
    try {
      setIsRoleDeleting(true)
      const usersToDelete = users.filter(user => user.role === roleToDelete)
      
      await Promise.all(usersToDelete.map(user => usersApi.deleteUser(user.id)))
      
      toast.success(`All ${roleToDelete.toLowerCase().replace('_', ' ')} users deleted successfully`, { duration: 2000 })
      fetchUsers()
      setRoleDeleteDialogOpen(false)
      setRoleToDelete('')
    } catch (error) {
      toast.error('Failed to delete users')
    } finally {
      setIsRoleDeleting(false)
    }
  }

  const handleRoleDeleteCancel = () => {
    setRoleDeleteDialogOpen(false)
    setRoleToDelete('')
  }

  const resetForm = () => {
    setFormData({
      email: '',
      firstName: '',
      lastName: '',
      role: 'STUDENT'
    })
    setSelectedUser(null)
  }

  const openModal = (user?: User) => {
    if (user) {
      setSelectedUser(user)
      setFormData({
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      })
    } else {
      resetForm()
    }
    setShowModal(true)
  }

  const openPasswordModal = (user: User) => {
    setSelectedUser(user)
    setPasswordData({ newPassword: '' })
    setShowPasswordModal(true)
  }

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'destructive'
      case 'BRIGADE_LEAD': return 'default'
      case 'STUDENT': return 'secondary'
      default: return 'secondary'
    }
  }

  const getRoleCount = (role: string) => {
    return users.filter(user => user.role === role).length
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Users</h1>
          <p className="text-gray-600 mt-2">Manage user accounts and permissions</p>
        </div>
        <div className="flex items-center gap-3">
          {selectedUsers.size > 0 && (
            <Button
              variant="destructive"
              onClick={handleBulkDeleteClick}
              disabled={isBulkDeleting}
            >
              {isBulkDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Selected ({selectedUsers.size})
                </>
              )}
            </Button>
          )}
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <UserX className="h-4 w-4 mr-2" />
                Role Actions
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Delete by Role</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => handleRoleDeleteClick('STUDENT')}
                className="text-red-600"
                disabled={getRoleCount('STUDENT') === 0}
              >
                Delete All Students ({getRoleCount('STUDENT')})
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => handleRoleDeleteClick('BRIGADE_LEAD')}
                className="text-red-600"
                disabled={getRoleCount('BRIGADE_LEAD') === 0}
              >
                Delete All Brigade Leads ({getRoleCount('BRIGADE_LEAD')})
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => handleRoleDeleteClick('ADMIN')}
                className="text-red-600"
                disabled={getRoleCount('ADMIN') === 0}
              >
                Delete All Admins ({getRoleCount('ADMIN')})
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button 
            variant="outline" 
            onClick={() => setShowBulkUploadModal(true)}
          >
            <Upload className="h-4 w-4 mr-2" />
            Bulk Upload
          </Button>

          <Button onClick={() => openModal()}>
            <Plus className="h-4 w-4 mr-2" />
            Add User
          </Button>
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
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-full md:w-48">
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
              >
                <option value="">All Roles</option>
                <option value="ADMIN">Admin</option>
                <option value="BRIGADE_LEAD">Brigade Lead</option>
                <option value="STUDENT">Student</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Users List</CardTitle>
          <CardDescription>
            {pagination.totalItems} total users
            {selectedUsers.size > 0 && (
              <span className="ml-2 text-blue-600">
                • {selectedUsers.size} selected
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner />
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No users found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium w-12">
                      <Checkbox
                        checked={isAllSelected}
                        indeterminate={isIndeterminate}
                        onCheckedChange={handleSelectAll}
                      />
                    </th>
                    <th className="text-left py-3 px-4 font-medium">Name</th>
                    <th className="text-left py-3 px-4 font-medium">Email</th>
                    <th className="text-left py-3 px-4 font-medium">Role</th>
                    <th className="text-left py-3 px-4 font-medium">Status</th>
                    <th className="text-left py-3 px-4 font-medium">Last Login</th>
                    <th className="text-left py-3 px-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <Checkbox
                          checked={selectedUsers.has(user.id)}
                          onCheckedChange={(checked) => handleSelectUser(user.id, checked as boolean)}
                        />
                      </td>
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium">
                            {user.firstName} {user.lastName}
                          </p>
                          {user.student && (
                            <p className="text-sm text-gray-500">
                              Roll: {user.student.tempRollNumber}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm">
                        {user.email}
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant={getRoleBadgeVariant(user.role)}>
                          {user.role.replace('_', ' ')}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant={user.isActive ? "default" : "secondary"}>
                          {user.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-sm">
                        {user.lastLogin ? formatDateTime(user.lastLogin) : 'Never'}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openModal(user)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openPasswordModal(user)}
                          >
                            <Key className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteClick(user)}
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

      {/* User Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedUser ? 'Edit User' : 'Add New User'}
            </DialogTitle>
            <DialogDescription>
              {selectedUser ? 'Update user information' : 'Create a new user account. Password will be auto-generated and sent via email.'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name *</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Role *</Label>
              <select
                id="role"
                value={formData.role}
                onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value as any }))}
                className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                required
              >
                <option value="STUDENT">Student</option>
                <option value="BRIGADE_LEAD">Brigade Lead</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>

            {!selectedUser && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>Password:</strong> Will be auto-generated as "Iam{formData.firstName || '[FirstName]'}123!@#" and sent to the user's email.
                </p>
              </div>
            )}

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowModal(false)}
                disabled={isCreatingUser || isUpdatingUser}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={isCreatingUser || isUpdatingUser}
              >
                {isCreatingUser || isUpdatingUser ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {selectedUser ? 'Updating...' : 'Creating...'}
                  </>
                ) : (
                  selectedUser ? 'Update' : 'Create'
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Bulk Upload Modal */}
      <Dialog open={showBulkUploadModal} onOpenChange={closeBulkUploadModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Bulk Upload Users</DialogTitle>
            <DialogDescription>
              Upload multiple users at once using an Excel file. Passwords will be auto-generated and sent via email.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* File Format Section */}
            <div className="bg-gray-50 rounded-lg p-6">             
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg text-center font-semibold text-gray-900 mb-2">File Format</h3>
                  <h4 className="font-medium text-gray-900 mb-3">Required Columns (in order):</h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Column A:</span>
                      <span className="font-medium text-gray-900">First Name</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Column B:</span>
                      <span className="font-medium text-gray-900">Last Name</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Column C:</span>
                      <span className="font-medium text-gray-900">Email</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Column D:</span>
                      <span className="font-medium text-gray-900">Role</span>
                    </div>
                  </div>
                </div>

                <div className="bg-orange-50 rounded-lg p-4">
                  <h4 className="font-medium text-orange-800 mb-2">Important Notes:</h4>
                  <ul className="text-sm text-orange-700 space-y-1">
                    <li>• First row should contain headers</li>
                    <li>• All fields are required</li>
                    <li>• File must be in .xlsx format</li>
                    <li>• Use the template for best results</li>
                  </ul>
                </div>
              </div>
            </div>


            {/* File Upload Section */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Upload Excel File</h4>
              <FileUpload
                onFileSelect={handleFileSelect}
                accept=".xlsx,.xls"
                maxSize={5}
                disabled={isUploading}
              />
              
              {selectedFile && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    <strong>Password Format:</strong> Passwords will be auto-generated as "Iam[FirstName]123!@#" for each user and sent via email.
                  </p>
                </div>
              )}
            </div>

            {/* Upload Result */}
            {uploadResult && (
              <div className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h4 className="font-medium text-green-800">Upload Successful!</h4>
                  <p className="text-sm text-green-700 mt-1">
                    {uploadResult.message}
                  </p>
                  <div className="mt-2 text-sm text-green-700">
                    <p>• Users created: {uploadResult.users.length}</p>
                    <p>• Emails sent: {uploadResult.emailResults.successful}</p>
                    {uploadResult.emailResults.failed > 0 && (
                      <p className="text-orange-700">• Email failures: {uploadResult.emailResults.failed}</p>
                    )}
                  </div>
                </div>

                {uploadResult.emailResults.failedEmails.length > 0 && (
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                    <h4 className="font-medium text-orange-800">Email Delivery Issues</h4>
                    <div className="mt-2 space-y-1">
                      {uploadResult.emailResults.failedEmails.map((failure, index) => (
                        <p key={index} className="text-sm text-orange-700">
                          • {failure.email}: {failure.error}
                        </p>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end space-x-2 pt-4">
              <Button
                variant="outline"
                onClick={closeBulkUploadModal}
                disabled={isUploading}
              >
                {uploadResult ? 'Close' : 'Cancel'}
              </Button>
              {!uploadResult && (
                <Button
                  onClick={handleBulkUpload}
                  disabled={!selectedFile || isUploading}
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Users
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Password Reset Modal */}
      <Dialog open={showPasswordModal} onOpenChange={setShowPasswordModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription>
              Reset password for {selectedUser?.firstName} {selectedUser?.lastName}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handlePasswordReset} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password *</Label>
              <Input
                id="newPassword"
                type="password"
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                placeholder="Enter new password"
                required
              />
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowPasswordModal(false)}
                disabled={isResettingPassword}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={isResettingPassword}
              >
                {isResettingPassword ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Resetting...
                  </>
                ) : (
                  'Reset Password'
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Single Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{' '}
              <span className="font-medium">
                {userToDelete?.firstName} {userToDelete?.lastName}
              </span>
              ? This action cannot be undone and will permanently delete their account and all associated data.
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
                'Delete User'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Delete Confirmation Dialog */}
      <AlertDialog open={bulkDeleteDialogOpen} onOpenChange={setBulkDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Multiple Users</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedUsers.size} selected users? 
              This action cannot be undone and will permanently delete all their accounts and associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleBulkDeleteCancel} disabled={isBulkDeleting}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDeleteConfirm}
              disabled={isBulkDeleting}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {isBulkDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                `Delete ${selectedUsers.size} Users`
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Role-wise Delete Confirmation Dialog */}
      <AlertDialog open={roleDeleteDialogOpen} onOpenChange={setRoleDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete All {roleToDelete.replace('_', ' ')} Users</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete all users with the role "{roleToDelete.toLowerCase().replace('_', ' ')}"? 
              This will delete {getRoleCount(roleToDelete)} users. This action cannot be undone and will permanently 
              delete all their accounts and associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleRoleDeleteCancel} disabled={isRoleDeleting}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRoleDeleteConfirm}
              disabled={isRoleDeleting}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {isRoleDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                `Delete All ${roleToDelete.replace('_', ' ')} Users`
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
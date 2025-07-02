import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/contexts/AuthContext'
import { usersApi } from '@/api/users'
import { User, Mail, Shield, Calendar, Key, Users, Award, Phone } from 'lucide-react'
import { toast } from 'sonner'
import { formatDateTime } from '@/lib/utils'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'

export default function BrigadeProfile() {
  const { user } = useAuth()
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match')
      return
    }

    if (passwordData.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters long')
      return
    }

    try {
      await usersApi.changePassword(passwordData.currentPassword, passwordData.newPassword)
      toast.success('Password changed successfully', { duration: 2000 })
      setShowPasswordModal(false)
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to change password')
    }
  }

  if (!user) return null

  // Get the first brigade for display purposes
  const primaryBrigade = user.brigades && user.brigades.length > 0 ? user.brigades[0] : null

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Brigade Leader Profile</h1>
        <p className="text-gray-600 mt-2">View and manage your brigade leadership profile</p>
      </div>

      {/* Profile Information */}
      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>
            Your personal and leadership details
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <User className="h-5 w-5 text-gray-500" />
                <div>
                  <Label className="text-sm text-gray-600">Full Name</Label>
                  <p className="font-medium">{user.firstName} {user.lastName}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-gray-500" />
                <div>
                  <Label className="text-sm text-gray-600">Email</Label>
                  <p className="font-medium">{user.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Shield className="h-5 w-5 text-gray-500" />
                <div>
                  <Label className="text-sm text-gray-600">Role</Label>
                  <p className="font-medium capitalize">{user.role.toLowerCase().replace('_', ' ')}</p>
                </div>
              </div>

              {user.student?.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-gray-500" />
                  <div>
                    <Label className="text-sm text-gray-600">Phone</Label>
                    <p className="font-medium">{user.student.phone}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-4">
              {primaryBrigade && (
                <div className="flex items-center gap-3">
                  <Users className="h-5 w-5 text-gray-500" />
                  <div>
                    <Label className="text-sm text-gray-600">Brigade</Label>
                    <p className="font-medium">{primaryBrigade.name}</p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3">
                <Award className="h-5 w-5 text-gray-500" />
                <div>
                  <Label className="text-sm text-gray-600">Leadership Level</Label>
                  <p className="font-medium">Brigade Leader</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-gray-500" />
                <div>
                  <Label className="text-sm text-gray-600">Last Login</Label>
                  <p className="font-medium">
                    {user.lastLogin ? formatDateTime(user.lastLogin) : 'Never'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-gray-500" />
                <div>
                  <Label className="text-sm text-gray-600">Account Created</Label>
                  <p className="font-medium">
                    {user.createdAt ? formatDateTime(user.createdAt) : 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Account Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Account Settings</CardTitle>
          <CardDescription>
            Manage your brigade leader account security and preferences
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <Key className="h-5 w-5 text-gray-500" />
                <div>
                  <h3 className="font-medium">Password</h3>
                  <p className="text-sm text-gray-600">Change your brigade leader account password</p>
                </div>
              </div>
              <Button
                variant="outline"
                onClick={() => setShowPasswordModal(true)}
              >
                Change Password
              </Button>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <Shield className="h-5 w-5 text-gray-500" />
                <div>
                  <h3 className="font-medium">Account Status</h3>
                  <p className="text-sm text-gray-600">Your brigade leader account is active and verified</p>
                </div>
              </div>
              <div className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                Active
              </div>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <Award className="h-5 w-5 text-gray-500" />
                <div>
                  <h3 className="font-medium">Leadership Privileges</h3>
                  <p className="text-sm text-gray-600">Brigade management and student oversight access</p>
                </div>
              </div>
              <div className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                Leader Access
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Brigade Leadership Information */}
      <Card>
        <CardHeader>
          <CardTitle>Leadership Information</CardTitle>
          <CardDescription>
            Your brigade leadership details and responsibilities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div>
                <Label className="text-sm text-gray-600">User ID</Label>
                <p className="font-medium font-mono">{user.id}</p>
              </div>
              <div>
                <Label className="text-sm text-gray-600">Leadership Status</Label>
                <p className="font-medium">Active Leader</p>
              </div>
              {primaryBrigade && (
                <div>
                  <Label className="text-sm text-gray-600">Brigade Code</Label>
                  <p className="font-medium font-mono">{primaryBrigade.id || 'N/A'}</p>
                </div>
              )}
            </div>
            <div className="space-y-3">
              <div>
                <Label className="text-sm text-gray-600">Account Created</Label>
                <p className="font-medium">{formatDateTime(user.createdAt)}</p>
              </div>
              <div>
                <Label className="text-sm text-gray-600">Last Updated</Label>
                <p className="font-medium">{formatDateTime(user.createdAt)}</p>
              </div>
              {primaryBrigade && (
                <div>
                  <Label className="text-sm text-gray-600">Brigade Status</Label>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${primaryBrigade.isActive ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <p className="font-medium">
                      {primaryBrigade.isActive ? 'Active' : 'Inactive'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Change Password Modal */}
      <Dialog open={showPasswordModal} onOpenChange={setShowPasswordModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
            <DialogDescription>
              Enter your current password and choose a new one
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current Password *</Label>
              <Input
                id="currentPassword"
                type="password"
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password *</Label>
              <Input
                id="newPassword"
                type="password"
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                placeholder="At least 6 characters"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password *</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                required
              />
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowPasswordModal(false)}
              >
                Cancel
              </Button>
              <Button type="submit">
                Change Password
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
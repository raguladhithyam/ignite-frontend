import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { GraduationCap, Shield, Smartphone } from 'lucide-react'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

export default function LoginPage() {
  const { login, studentLogin } = useAuth()
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('admin')
  const [showMobileWarning, setShowMobileWarning] = useState(false)

  const [adminForm, setAdminForm] = useState({
    email: '',
    password: ''
  })

  const [studentForm, setStudentForm] = useState({
    tempRollNumber: '',
    password: ''
  })

  // Enhanced mobile detection function - Multiple layers of detection
  const isMobileDevice = () => {
  const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera
  
  // More specific mobile/tablet regex
  const mobileRegex = /Android.*Mobile|iPhone|iPod|BlackBerry|IEMobile|Opera Mini|Mobile Safari/i
  const tabletRegex = /iPad|Android(?!.*Mobile)|Tablet/i
  
  // Check screen size - be more conservative with breakpoints
  const isSmallScreen = window.innerWidth < 768 && window.innerHeight < 1024
  
  // Check if it's specifically a mobile device (not just touch-enabled)
  const isMobile = mobileRegex.test(userAgent)
  const isTablet = tabletRegex.test(userAgent)
  
  // Only consider it mobile if it matches mobile patterns AND has small screen
  return (isMobile || isTablet) && isSmallScreen
  }

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // ALWAYS check if user is on mobile device - BLOCK LOGIN COMPLETELY
    if (isMobileDevice()) {
      setShowMobileWarning(true)
      return // STOP EXECUTION - NO LOGIN ALLOWED
    }

    if (!adminForm.email || !adminForm.password) return

    try {
      setLoading(true)
      await login(adminForm.email, adminForm.password)
    } catch (error) {
      // Error is handled in the context
    } finally {
      setLoading(false)
    }
  }

  const handleStudentLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!studentForm.tempRollNumber || !studentForm.password) return

    try {
      setLoading(true)
      await studentLogin(studentForm.tempRollNumber, studentForm.password)
    } catch (error) {
      // Error is handled in the context
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-32 h-32 flex items-center justify-center mx-auto mb-4">
              <img 
                src="/Ignite.png" 
                alt="Ignite Logo" 
                className="w-32 h-32 object-contain"
              />
            </div>
            <p className="text-gray-600 mt-2">Student Attendance Management System</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Welcome Back</CardTitle>
              <CardDescription>
                Sign in to your account to continue
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger 
                    value="admin" 
                    className="flex items-center gap-2"
                    onClick={() => {
                      if (isMobileDevice()) {
                        setShowMobileWarning(true)
                      }
                    }}
                  >
                    <Shield className="h-4 w-4" />
                    Admin/Brigade Lead
                  </TabsTrigger>
                  <TabsTrigger value="student" className="flex items-center gap-2">
                    <GraduationCap className="h-4 w-4" />
                    Student
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="admin" className="space-y-4">
                  <div onSubmit={handleAdminLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="Enter your email"
                        value={adminForm.email}
                        onChange={(e) => setAdminForm(prev => ({ ...prev, email: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <Input
                        id="password"
                        type="password"
                        placeholder="Enter your password"
                        value={adminForm.password}
                        onChange={(e) => setAdminForm(prev => ({ ...prev, password: e.target.value }))}
                        required
                      />
                    </div>
                    <Button 
                      onClick={handleAdminLogin} 
                      className="w-full" 
                      disabled={loading || isMobileDevice()}
                    >
                      {loading ? (
                        <>
                          <LoadingSpinner size="sm" className="mr-2" />
                          Signing in...
                        </>
                      ) : isMobileDevice() ? (
                        'Mobile Login Restricted'
                      ) : (
                        'Sign In'
                      )}
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="student" className="space-y-4">
                  <div onSubmit={handleStudentLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="rollNumber">Temporary Roll Number</Label>
                      <Input
                        id="rollNumber"
                        type="text"
                        placeholder="Enter your roll number"
                        value={studentForm.tempRollNumber}
                        onChange={(e) => setStudentForm(prev => ({ ...prev, tempRollNumber: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="studentPassword">Password</Label>
                      <Input
                        id="studentPassword"
                        type="password"
                        placeholder="Enter your password"
                        value={studentForm.password}
                        onChange={(e) => setStudentForm(prev => ({ ...prev, password: e.target.value }))}
                        required
                      />
                    </div>
                    <Button onClick={handleStudentLogin} className="w-full" disabled={loading}>
                      {loading ? (
                        <>
                          <LoadingSpinner size="sm" className="mr-2" />
                          Signing in...
                        </>
                      ) : (
                        'Sign In'
                      )}
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Mobile Device Warning Popup */}
      <Dialog open={showMobileWarning} onOpenChange={setShowMobileWarning}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5 text-orange-500" />
              Admin Login Restricted
            </DialogTitle>
            <DialogDescription className="text-left pt-2">
              <div className="space-y-3">
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                  <p className="text-sm text-orange-800">
                    <strong>Admin login is restricted on mobile devices.</strong>
                  </p>
                  <p className="text-sm text-orange-700 mt-2">
                    Please use a laptop or desktop computer to access the admin panel for the best experience and security.
                  </p>
                </div>
              </div>
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end pt-4">
            <Button 
              onClick={() => setShowMobileWarning(false)}
              className="flex items-center gap-2"
            >
              Got it
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { GraduationCap, Shield, Smartphone, Eye, EyeOff } from 'lucide-react'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

export default function LoginPage() {
  const { login, studentLogin } = useAuth()
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('admin')
  const [showMobileWarning, setShowMobileWarning] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showStudentPassword, setShowStudentPassword] = useState(false)

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
      <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-teal-100 dark:from-gray-900 dark:via-indigo-900 dark:to-purple-900 flex items-center justify-center p-4 relative overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full opacity-20 animate-pulse" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-blue-400 to-cyan-400 rounded-full opacity-20 animate-pulse delay-1000" />
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-60 h-60 bg-gradient-to-br from-indigo-400 to-purple-400 rounded-full opacity-10 animate-spin" style={{ animationDuration: '20s' }} />
        </div>

        <div className="w-full max-w-md relative z-10">
          {/* Logo and Title */}
          <div className="text-center mb-8 fade-in">
            <div className="relative group mb-6">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-purple-500/20 rounded-full blur-2xl group-hover:blur-3xl transition-all duration-500" />
              <div className="relative w-32 h-32 mx-auto bg-white/20 dark:bg-gray-800/20 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/30 dark:border-gray-700/30 shadow-2xl">
                <img 
                  src="/Ignite.png" 
                  alt="Ignite Logo" 
                  className="w-24 h-24 object-contain"
                />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gradient mb-2">
              Welcome to Ignite
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-lg">
              Student Attendance Management System
            </p>
          </div>

          {/* Login Card */}
          <Card className="modern-card backdrop-blur-xl bg-white/20 dark:bg-gray-900/20 border-white/30 dark:border-gray-800/30 shadow-2xl fade-in delay-2">
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
                Sign In
              </CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400 text-base">
                Access your account to continue
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2 bg-white/30 dark:bg-gray-800/30 backdrop-blur-sm border border-white/20 dark:border-gray-700/20 rounded-xl p-1">
                  <TabsTrigger 
                    value="admin" 
                    className="flex items-center gap-2 rounded-lg font-medium transition-all duration-300 data-[state=active]:bg-white/80 dark:data-[state=active]:bg-gray-800/80 data-[state=active]:shadow-lg"
                    onClick={() => {
                      if (isMobileDevice()) {
                        setShowMobileWarning(true)
                      }
                    }}
                  >
                    <Shield className="h-4 w-4" />
                    Admin/Lead
                  </TabsTrigger>
                  <TabsTrigger 
                    value="student" 
                    className="flex items-center gap-2 rounded-lg font-medium transition-all duration-300 data-[state=active]:bg-white/80 dark:data-[state=active]:bg-gray-800/80 data-[state=active]:shadow-lg"
                  >
                    <GraduationCap className="h-4 w-4" />
                    Student
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="admin" className="space-y-6 mt-6">
                  <form onSubmit={handleAdminLogin} className="space-y-5">
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                        Email Address
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="Enter your email"
                        value={adminForm.email}
                        onChange={(e) => setAdminForm(prev => ({ ...prev, email: e.target.value }))}
                        className="form-input h-12 text-base"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                        Password
                      </Label>
                      <div className="relative">
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          placeholder="Enter your password"
                          value={adminForm.password}
                          onChange={(e) => setAdminForm(prev => ({ ...prev, password: e.target.value }))}
                          className="form-input h-12 text-base pr-12"
                          required
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 hover:bg-gray-100 dark:hover:bg-gray-800"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                    <Button 
                      type="submit"
                      className="w-full h-12 text-base font-semibold btn-primary rounded-xl" 
                      disabled={loading || isMobileDevice()}
                    >
                      {loading ? (
                        <>
                          <LoadingSpinner size="sm" className="mr-3" />
                          Signing in...
                        </>
                      ) : isMobileDevice() ? (
                        'Mobile Login Restricted'
                      ) : (
                        'Sign In'
                      )}
                    </Button>
                  </form>
                </TabsContent>

                <TabsContent value="student" className="space-y-6 mt-6">
                  <form onSubmit={handleStudentLogin} className="space-y-5">
                    <div className="space-y-2">
                      <Label htmlFor="rollNumber" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                        Roll Number
                      </Label>
                      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-3 mb-3">
                        <p className="text-sm text-blue-800 dark:text-blue-200 font-medium">
                          💡 Enter your roll number in CAPITAL LETTERS
                        </p>
                      </div>
                      <Input
                        id="rollNumber"
                        type="text"
                        placeholder="e.g., 22BCS123"
                        value={studentForm.tempRollNumber}
                        onChange={(e) => setStudentForm(prev => ({ ...prev, tempRollNumber: e.target.value.toUpperCase() }))}
                        className="form-input h-12 text-base"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="studentPassword" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                        Password
                      </Label>
                      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-3 mb-3">
                        <p className="text-sm text-green-800 dark:text-green-200 font-medium">
                          🔑 Default password: <code className="bg-green-100 dark:bg-green-800 px-2 py-1 rounded text-xs">student123</code>
                        </p>
                      </div>
                      <div className="relative">
                        <Input
                          id="studentPassword"
                          type={showStudentPassword ? "text" : "password"}
                          placeholder="Enter your password"
                          value={studentForm.password}
                          onChange={(e) => setStudentForm(prev => ({ ...prev, password: e.target.value }))}
                          className="form-input h-12 text-base pr-12"
                          required
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowStudentPassword(!showStudentPassword)}
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 hover:bg-gray-100 dark:hover:bg-gray-800"
                        >
                          {showStudentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                    <Button 
                      type="submit"
                      className="w-full h-12 text-base font-semibold btn-primary rounded-xl" 
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <LoadingSpinner size="sm" className="mr-3" />
                          Signing in...
                        </>
                      ) : (
                        'Sign In'
                      )}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Mobile Device Warning Popup - Enhanced */}
      <Dialog open={showMobileWarning} onOpenChange={setShowMobileWarning}>
        <DialogContent className="sm:max-w-md modern-card bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border-white/30 dark:border-gray-800/30">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-xl">
              <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-full">
                <Smartphone className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
              Access Restricted
            </DialogTitle>
            <DialogDescription className="text-left pt-4">
              <div className="space-y-4">
                <div className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 border border-orange-200 dark:border-orange-800 rounded-xl p-4">
                  <h4 className="font-semibold text-orange-800 dark:text-orange-200 mb-2">
                    Admin / Brigade Lead Login Restricted
                  </h4>
                  <p className="text-sm text-orange-700 dark:text-orange-300 mb-3">
                    For security and optimal experience, admin access is only available on desktop computers.
                  </p>
                  <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-3">
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      💻 Please use a laptop or desktop computer to access administrative features.
                    </p>
                  </div>
                </div>
              </div>
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end pt-4">
            <Button 
              onClick={() => setShowMobileWarning(false)}
              className="btn-primary"
            >
              Understood
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { GraduationCap, Shield, Smartphone, Sparkles } from 'lucide-react'
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

  const isMobileDevice = () => {
    const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera
    const mobileRegex = /Android.*Mobile|iPhone|iPod|BlackBerry|IEMobile|Opera Mini|Mobile Safari/i
    const tabletRegex = /iPad|Android(?!.*Mobile)|Tablet/i
    const isSmallScreen = window.innerWidth < 768 && window.innerHeight < 1024
    const isMobile = mobileRegex.test(userAgent)
    const isTablet = tabletRegex.test(userAgent)
    
    return (isMobile || isTablet) && isSmallScreen
  }

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (isMobileDevice()) {
      setShowMobileWarning(true)
      return
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4 relative overflow-hidden">
        {/* Background decorations */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-200/30 to-purple-200/30 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-green-200/30 to-blue-200/30 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-purple-100/20 to-pink-100/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        </div>

        <div className="w-full max-w-md relative z-10">
          <div className="text-center mb-8 animate-fade-in">
            <div className="w-24 h-24 flex items-center justify-center mx-auto mb-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl shadow-2xl">
              <img 
                src="/Ignite.png" 
                alt="Ignite Logo" 
                className="w-16 h-16 object-contain filter brightness-0 invert"
              />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
              Welcome to Ignite
            </h1>
            <p className="text-slate-600 font-medium">Student Attendance Management System</p>
          </div>

          <Card className="animate-scale-in shadow-2xl border-0 bg-white/90 backdrop-blur-xl">
            <CardHeader className="text-center pb-4">
              <CardTitle className="flex items-center justify-center gap-2 text-xl">
                <Sparkles className="h-5 w-5 text-yellow-500" />
                Sign In
              </CardTitle>
              <CardDescription className="text-slate-600">
                Choose your account type to continue
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2 bg-slate-100/80 rounded-xl p-1">
                  <TabsTrigger 
                    value="admin" 
                    className="flex items-center gap-2 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-md transition-all duration-200"
                    onClick={() => {
                      if (isMobileDevice()) {
                        setShowMobileWarning(true)
                      }
                    }}
                  >
                    <Shield className="h-4 w-4" />
                    <span className="hidden sm:inline">Admin/Brigade Lead</span>
                    <span className="sm:hidden">Admin</span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="student" 
                    className="flex items-center gap-2 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-md transition-all duration-200"
                  >
                    <GraduationCap className="h-4 w-4" />
                    Student
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="admin" className="space-y-4 mt-6">
                  <form onSubmit={handleAdminLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-sm font-semibold text-slate-700">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="Enter your email"
                        value={adminForm.email}
                        onChange={(e) => setAdminForm(prev => ({ ...prev, email: e.target.value }))}
                        required
                        className="h-12"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password" className="text-sm font-semibold text-slate-700">Password</Label>
                      <Input
                        id="password"
                        type="password"
                        placeholder="Enter your password"
                        value={adminForm.password}
                        onChange={(e) => setAdminForm(prev => ({ ...prev, password: e.target.value }))}
                        required
                        className="h-12"
                      />
                    </div>
                    <Button 
                      type="submit"
                      className="w-full h-12 text-base font-semibold" 
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
                  </form>
                </TabsContent>

                <TabsContent value="student" className="space-y-4 mt-6">
                  <form onSubmit={handleStudentLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="rollNumber" className="text-sm font-semibold text-slate-700">Roll Number</Label>
                      <div className="space-y-1">
                        <Input
                          id="rollNumber"
                          type="text"
                          placeholder="Enter your roll number"
                          value={studentForm.tempRollNumber}
                          onChange={(e) => setStudentForm(prev => ({ ...prev, tempRollNumber: e.target.value }))}
                          required
                          className="h-12"
                        />
                        <p className="text-xs text-slate-500 bg-blue-50 p-2 rounded-lg border border-blue-100">
                          💡 Enter your roll number in CAPITAL LETTERS
                        </p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="studentPassword" className="text-sm font-semibold text-slate-700">Password</Label>
                      <div className="space-y-1">
                        <Input
                          id="studentPassword"
                          type="password"
                          placeholder="Enter your password"
                          value={studentForm.password}
                          onChange={(e) => setStudentForm(prev => ({ ...prev, password: e.target.value }))}
                          required
                          className="h-12"
                        />
                        <p className="text-xs text-slate-500 bg-green-50 p-2 rounded-lg border border-green-100">
                          🔑 Default password is <code className="bg-white px-1 rounded">student123</code>
                        </p>
                      </div>
                    </div>
                    <Button 
                      type="submit"
                      className="w-full h-12 text-base font-semibold" 
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <LoadingSpinner size="sm" className="mr-2" />
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

      {/* Enhanced Mobile Device Warning Popup */}
      <Dialog open={showMobileWarning} onOpenChange={setShowMobileWarning}>
        <DialogContent className="sm:max-w-md bg-white/95 backdrop-blur-xl border-0 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-xl">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-red-500 rounded-xl flex items-center justify-center">
                <Smartphone className="h-6 w-6 text-white" />
              </div>
              <span className="bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                Admin Access Restricted
              </span>
            </DialogTitle>
            <DialogDescription className="text-left pt-4">
              <div className="space-y-4">
                <div className="bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-xl p-4">
                  <p className="text-sm text-orange-800 font-semibold mb-2">
                    🚫 Admin & Brigade Lead login is restricted on mobile devices
                  </p>
                  <p className="text-sm text-orange-700">
                    Please use a laptop or desktop computer to access the admin panel for the best experience and enhanced security.
                  </p>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <p className="text-sm text-blue-800 font-semibold mb-1">
                    💡 Students can still log in on mobile devices
                  </p>
                  <p className="text-sm text-blue-700">
                    Switch to the Student tab to access your student account.
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
import { useAuth } from '@/contexts/AuthContext'
import { useLocation, Link } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { Button } from './ui/button'
import {
  LayoutDashboard,
  Users,
  UserCheck,
  Calendar,
  BarChart3,
  Bell,
  X,
  GraduationCap,
  Shield,
  BookOpen,
  FileText,
  ClipboardCheck,
  ScrollText,
  UserPlus,
  LogOut
} from 'lucide-react'

interface SidebarProps {
  open: boolean
  setOpen: (open: boolean) => void
}

const adminNavItems = [
  { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
  { name: 'Profile', href: '/admin/profile', icon: Users },
  { name: 'Students', href: '/admin/students', icon: GraduationCap },
  { name: 'Student Summary', href: '/admin/student-summary', icon: FileText },
  { name: 'Brigades', href: '/admin/brigades', icon: Shield },
  { name: 'Users', href: '/admin/users', icon: Users },
  { name: 'Events', href: '/admin/events', icon: Calendar },
  { name: 'Attendance', href: '/admin/attendance', icon: UserCheck },
  { name: 'Student Attendance', href: '/admin/student-attendance', icon: UserPlus },
  { name: 'Lead Attendance', href: '/admin/lead-attendance', icon: ClipboardCheck },
  { name: 'Admin Logs', href: '/admin/logs', icon: ScrollText },
  { name: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
  { name: 'Notifications', href: '/admin/notifications', icon: Bell }
]

const brigadeLeadNavItems = [
  { name: 'Dashboard', href: '/brigade/dashboard', icon: LayoutDashboard },
  { name: 'Profile', href: '/brigade/profile', icon: Users },
  { name: 'Students', href: '/brigade/students', icon: GraduationCap },
  { name: 'Attendance', href: '/brigade/attendance', icon: UserCheck },
  { name: 'Analytics', href: '/brigade/analytics', icon: BarChart3 },
]

const studentNavItems = [
  { name: 'Dashboard', href: '/student/dashboard', icon: LayoutDashboard },
  { name: 'Profile', href: '/student/profile', icon: Users },
  { name: 'Attendance', href: '/student/attendance', icon: BookOpen },
  { name: 'Notifications', href: '/student/notifications', icon: Bell }
]

export default function Sidebar({ open, setOpen }: SidebarProps) {
  const { user, logout } = useAuth()
  const location = useLocation()

  if (!user) return null

  const getNavItems = () => {
    switch (user.role) {
      case 'ADMIN':
        return adminNavItems
      case 'BRIGADE_LEAD':
        return brigadeLeadNavItems
      case 'STUDENT':
        return studentNavItems
      default:
        return []
    }
  }

  const navItems = getNavItems()

  return (
    <>
      {/* Mobile overlay with blur effect */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm lg:hidden transition-all duration-300"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar with glassmorphism */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-72 transform transition-all duration-500 ease-out lg:translate-x-0 flex flex-col",
          "bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl border-r border-white/20 dark:border-gray-800/50",
          "shadow-2xl shadow-indigo-500/10",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Header - Enhanced */}
        <div className="flex items-center justify-between p-6 border-b border-white/10 dark:border-gray-800/50 flex-shrink-0">
          <div className="flex items-center justify-center flex-1">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-purple-500/20 rounded-full blur-lg group-hover:blur-xl transition-all duration-300" />
              <div className="relative w-20 h-20 flex items-center justify-center bg-white/50 dark:bg-gray-800/50 rounded-full backdrop-blur-sm border border-white/20">
                <img 
                  src="/Ignite.png" 
                  alt="Ignite Logo" 
                  className="w-16 h-16 object-contain"
                />
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden hover:bg-white/20 dark:hover:bg-gray-800/40 transition-colors duration-300"
            onClick={() => setOpen(false)}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Brand Name */}
        <div className="px-6 py-4 border-b border-white/10 dark:border-gray-800/50">
          <h1 className="text-2xl font-bold text-gradient text-center">
            Ignite
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 text-center mt-1">
            Attendance System
          </p>
        </div>

        {/* Navigation - Enhanced */}
        <div className="flex-1 overflow-y-auto p-4">
          <nav className="space-y-2">
            {navItems.map((item, index) => {
              const isActive = location.pathname === item.href
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "nav-link",
                    isActive ? "active" : "text-gray-700 dark:text-gray-300 hover:text-primary dark:hover:text-primary",
                    `delay-${Math.min(index + 1, 5)} fade-in`
                  )}
                >
                  <div className="relative">
                    <item.icon className={cn(
                      "h-5 w-5 transition-all duration-300",
                      isActive ? "text-primary scale-110" : "group-hover:scale-110"
                    )} />
                    {isActive && (
                      <div className="absolute inset-0 bg-primary/20 rounded-lg blur-md" />
                    )}
                  </div>
                  <span className="font-medium">{item.name}</span>
                  {isActive && (
                    <div className="ml-auto w-2 h-2 bg-primary rounded-full animate-pulse" />
                  )}
                </Link>
              )
            })}
          </nav>
        </div>

        {/* User Info - Enhanced */}
        <div className="p-4 border-t border-white/10 dark:border-gray-800/50 flex-shrink-0">
          <div className="modern-card p-4 mb-4">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-purple-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                {user.firstName.charAt(0)}{user.lastName.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                  {user.firstName} {user.lastName}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                  {user.role.toLowerCase().replace('_', ' ')}
                </p>
              </div>
            </div>
            <Button
              onClick={logout}
              variant="outline"
              size="sm"
              className="w-full bg-white/50 dark:bg-gray-800/50 border-white/20 hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-all duration-300"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}
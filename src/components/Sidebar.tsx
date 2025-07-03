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
  UserPlus
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
  const { user } = useAuth()
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
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-white/90 backdrop-blur-xl border-r border-white/20 shadow-xl transform transition-transform duration-300 ease-in-out lg:translate-x-0 flex flex-col",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/20 flex-shrink-0">
          <div className="flex items-center justify-center flex-1">
            <div className="w-16 h-16 flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl shadow-lg">
              <img 
                src="/Ignite.png" 
                alt="Ignite Logo" 
                className="w-12 h-12 object-contain filter brightness-0 invert"
              />
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden hover:bg-white/50 rounded-xl"
            onClick={() => setOpen(false)}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto py-6">
          <nav className="px-4 space-y-2">
            {navItems.map((item, index) => {
              const isActive = location.pathname === item.href
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "group flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 animate-slide-in-right",
                    isActive
                      ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/25"
                      : "text-slate-700 hover:bg-white/60 hover:text-slate-900 hover:shadow-md"
                  )}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <item.icon className={cn(
                    "h-5 w-5 transition-transform duration-200 group-hover:scale-110",
                    isActive ? "text-white" : "text-slate-500"
                  )} />
                  <span className="truncate">{item.name}</span>
                  {isActive && (
                    <div className="ml-auto w-2 h-2 bg-white rounded-full animate-pulse" />
                  )}
                </Link>
              )
            })}
          </nav>
        </div>

        {/* User Info */}
        <div className="p-4 border-t border-white/20 flex-shrink-0">
          <div className="bg-gradient-to-r from-slate-50 to-blue-50 rounded-xl p-4 border border-slate-200/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-md">
                <span className="text-white font-semibold text-sm">
                  {getInitials(user.firstName, user.lastName)}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-slate-500 font-medium mb-1">Logged in as</p>
                <p className="text-sm font-semibold text-slate-900 truncate">
                  {user.firstName} {user.lastName}
                </p>
                <div className="inline-flex mt-1">
                  <span className="px-2 py-0.5 bg-white/80 text-slate-600 text-xs font-medium rounded-full border border-slate-200">
                    {user.role.toLowerCase().replace('_', ' ')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

function getInitials(firstName: string, lastName: string) {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
}
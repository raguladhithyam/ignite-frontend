import { Menu, User, LogOut, Settings, Clock } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { Button } from './ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu'
import { Avatar, AvatarFallback } from './ui/avatar'
import { getInitials } from '@/lib/utils'
import NotificationDropdown from './NotificationDropdown'
import { useState, useEffect } from 'react'

interface HeaderProps {
  onMenuClick: () => void
}

export default function Header({ onMenuClick }: HeaderProps) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [currentTime, setCurrentTime] = useState('')

  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      const istTime = new Intl.DateTimeFormat('en-IN', {
        timeZone: 'Asia/Kolkata',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      }).format(now)
      
      setCurrentTime(istTime + ' IST')
    }

    updateTime()
    const interval = setInterval(updateTime, 1000)

    return () => clearInterval(interval)
  }, [])

  const handleProfileClick = () => {
    if (user?.role === 'ADMIN') {
      navigate('/admin/profile')
    } else if (user?.role === 'STUDENT') {
      navigate('/student/profile')
    } else {
      navigate('/brigade/profile')
    }
  }

  if (!user) return null

  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-white/20 shadow-sm">
      <div className="px-4 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden hover:bg-white/50 rounded-xl"
              onClick={onMenuClick}
            >
              <Menu className="h-5 w-5" />
            </Button>
            
            <div className="animate-slide-in-left">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Ignite
              </h1>
              <p className="text-sm text-slate-500 font-medium">
                Attendance Management System
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Enhanced Time Display */}
            <div className="hidden sm:flex items-center gap-3 px-4 py-2.5 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100 shadow-sm">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <Clock className="h-4 w-4 text-blue-600" />
              <span className="font-mono text-sm font-semibold text-blue-700">
                {currentTime}
              </span>
            </div>
            
            <NotificationDropdown />
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-11 w-11 rounded-xl hover:bg-white/50 transition-all duration-200">
                  <Avatar className="h-10 w-10 ring-2 ring-white shadow-md">
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold text-sm">
                      {getInitials(user.firstName, user.lastName)}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-64 bg-white/95 backdrop-blur-xl border border-white/20 shadow-xl rounded-xl" align="end" forceMount>
                <DropdownMenuLabel className="font-normal p-4">
                  <div className="flex flex-col space-y-2">
                    <p className="text-sm font-semibold leading-none text-slate-900">
                      {user.firstName} {user.lastName}
                    </p>
                    <p className="text-xs leading-none text-slate-500">
                      {user.email}
                    </p>
                    <div className="inline-flex">
                      <span className="px-2 py-1 bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 text-xs font-medium rounded-full border border-blue-200">
                        {user.role.toLowerCase().replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-slate-200/50" />
                <DropdownMenuItem onClick={handleProfileClick} className="hover:bg-slate-50 rounded-lg mx-2 my-1">
                  <User className="mr-3 h-4 w-4 text-slate-600" />
                  <span className="font-medium">Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="hover:bg-slate-50 rounded-lg mx-2 my-1">
                  <Settings className="mr-3 h-4 w-4 text-slate-600" />
                  <span className="font-medium">Settings</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-slate-200/50" />
                <DropdownMenuItem onClick={logout} className="hover:bg-red-50 text-red-600 rounded-lg mx-2 my-1">
                  <LogOut className="mr-3 h-4 w-4" />
                  <span className="font-medium">Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  )
}
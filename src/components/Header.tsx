import { Menu, User, LogOut, Settings, Clock, Moon, Sun } from 'lucide-react'
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
  const [isDark, setIsDark] = useState(false)

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

    updateTime() // Initial call
    const interval = setInterval(updateTime, 1000) // Update every second

    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    // Check for saved theme preference or default to light mode
    const savedTheme = localStorage.getItem('theme')
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    
    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
      setIsDark(true)
      document.documentElement.classList.add('dark')
    } else {
      setIsDark(false)
      document.documentElement.classList.remove('dark')
    }
  }, [])

  const toggleTheme = () => {
    const newTheme = !isDark
    setIsDark(newTheme)
    
    if (newTheme) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
  }

  const handleProfileClick = () => {
    if (user?.role === 'ADMIN') {
      navigate('/admin/profile')
    } else if (user?.role === 'STUDENT') {
      navigate('/student/profile')
    } else {
      // Fallback for other roles
      navigate('/brigade/profile')
    }
  }

  if (!user) return null

  return (
    <header className="sticky top-0 z-30 bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl border-b border-white/20 dark:border-gray-800/50 px-4 lg:px-8 py-4 shadow-lg shadow-black/5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden hover:bg-white/20 dark:hover:bg-gray-800/40 transition-all duration-300 hover:scale-105"
            onClick={onMenuClick}
          >
            <Menu className="h-5 w-5" />
          </Button>
          
          <div className="hidden lg:block">
            <h1 className="text-2xl font-bold text-gradient">
              Ignite
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 -mt-1">
              Attendance Management System
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Current Time Display - Enhanced */}
          <div className="hidden sm:flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm px-4 py-2 rounded-xl border border-white/20 dark:border-gray-700/50 shadow-lg">
            <Clock className="h-4 w-4 text-primary" />
            <span className="tabular-nums">{currentTime}</span>
          </div>

          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleTheme}
            className="relative hover:bg-white/20 dark:hover:bg-gray-800/40 transition-all duration-300 hover:scale-105 rounded-xl"
          >
            <div className="relative w-5 h-5">
              <Sun className={`absolute inset-0 h-5 w-5 transition-all duration-500 ${isDark ? 'rotate-90 scale-0' : 'rotate-0 scale-100'}`} />
              <Moon className={`absolute inset-0 h-5 w-5 transition-all duration-500 ${isDark ? 'rotate-0 scale-100' : '-rotate-90 scale-0'}`} />
            </div>
          </Button>
          
          <NotificationDropdown />
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-11 w-11 rounded-xl hover:bg-white/20 dark:hover:bg-gray-800/40 transition-all duration-300 hover:scale-105">
                <Avatar className="h-10 w-10 border-2 border-primary/20">
                  <AvatarFallback className="bg-gradient-to-br from-primary to-purple-500 text-white font-semibold text-sm">
                    {getInitials(user.firstName, user.lastName)}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white dark:border-gray-900 rounded-full animate-pulse" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-64 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-white/20 dark:border-gray-800/50 shadow-2xl" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-2 p-2">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-12 w-12 border-2 border-primary/20">
                      <AvatarFallback className="bg-gradient-to-br from-primary to-purple-500 text-white font-semibold">
                        {getInitials(user.firstName, user.lastName)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        {user.firstName} {user.lastName}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {user.email}
                      </p>
                      <div className="mt-1">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          user.role === 'ADMIN' ? 'role-admin' :
                          user.role === 'BRIGADE_LEAD' ? 'role-brigade-lead' :
                          'role-student'
                        }`}>
                          {user.role.toLowerCase().replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-white/20 dark:bg-gray-800/50" />
              <DropdownMenuItem 
                onClick={handleProfileClick}
                className="cursor-pointer hover:bg-white/20 dark:hover:bg-gray-800/40 transition-colors duration-300"
              >
                <User className="mr-3 h-4 w-4 text-primary" />
                <span className="font-medium">Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer hover:bg-white/20 dark:hover:bg-gray-800/40 transition-colors duration-300">
                <Settings className="mr-3 h-4 w-4 text-primary" />
                <span className="font-medium">Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-white/20 dark:bg-gray-800/50" />
              <DropdownMenuItem 
                onClick={logout}
                className="cursor-pointer hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 transition-colors duration-300"
              >
                <LogOut className="mr-3 h-4 w-4" />
                <span className="font-medium">Sign out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
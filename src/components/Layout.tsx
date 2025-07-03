import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import Sidebar from './Sidebar'
import Header from './Header'
import { cn } from '@/lib/utils'

interface LayoutProps {
  children: React.ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { user } = useAuth()

  if (!user) return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-indigo-900 relative">
      {/* Modern Background Pattern */}
      <div 
        className="fixed inset-0 opacity-30"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgba(99, 102, 241, 0.15) 1px, transparent 0)`,
          backgroundSize: '24px 24px'
        }}
      />
      
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />
      
      <div className={cn(
        "relative transition-all duration-300 ease-in-out",
        "lg:ml-72"
      )}>
        <Header onMenuClick={() => setSidebarOpen(true)} />
        
        <main className="p-4 lg:p-8 min-h-[calc(100vh-5rem)]">
          <div className="max-w-7xl mx-auto">
            <div className="fade-in">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
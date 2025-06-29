export default function AdminLeadAttendance() {
  return (
    <div className="fixed inset-0 -m-6 lg:-m-8">
      <iframe
        src="https://leads-attendance.vercel.app"
        className="w-full h-full border-0"
        title="Lead Attendance Management"
        allow="fullscreen"
        style={{ 
          width: '100vw', 
          height: '100vh',
          position: 'absolute',
          top: 0,
          left: 0
        }}
      />
    </div>
  )
}
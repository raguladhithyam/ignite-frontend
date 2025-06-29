export default function AdminLeadAttendance() {
  return (
    <div className="h-full w-full">
      <iframe
        src="https://leads-attendance.vercel.app"
        className="w-full h-screen border-0"
        title="Lead Attendance Management"
        allow="fullscreen"
        style={{ minHeight: 'calc(100vh - 80px)' }}
      />
    </div>
  )
}
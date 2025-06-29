export default function AdminLeadAttendance() {
  return (
    <div className="w-full h-full">
      {/* Container that respects the layout structure */}
      <div className="relative w-full" style={{ 
        height: 'calc(100vh - var(--header-height, 64px))',
        marginTop: 'var(--header-height, 64px)'
      }}>
        <iframe 
          src="https://leads-attendance.vercel.app" 
          className="w-full h-full border-0 block"
          title="Lead Attendance Management" 
          allow="fullscreen"
        />
      </div>
    </div>
  );
}
export default function AdminLeadAttendance() {
  return (
    <div className="w-full h-full">
      {/* Container that starts right after header */}
      <div className="relative w-full h-screen">
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
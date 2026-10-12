import React, { useState } from 'react';
import { useMaintenance } from '../context/MaintenanceContext';
import { 
  Menu,
  Bell, 
  PhoneCall, 
  RefreshCw, 
  UserCheck, 
  LogOut, 
  LogIn, 
  Shield, 
  CheckCircle2, 
  AlertTriangle,
  X,
  Phone,
  LayoutDashboard,
  Building2,
  KanbanSquare,
  CheckSquare,
  History,
  FileBarChart,
  Mail,
  BarChart3,
  DollarSign,
  FileSpreadsheet,
  Settings,
  PlusCircle,
  Smartphone
} from 'lucide-react';
import { UserRole, Department } from '../types/maintenance';

interface NavbarProps {
  onToggleMobileMenu: () => void;
  showRoleModal: boolean;
  setShowRoleModal: (open: boolean) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ 
  onToggleMobileMenu,
  showRoleModal,
  setShowRoleModal
}) => {
  const { 
    currentUser, 
    setCurrentUserRole, 
    loginWithGoogle, 
    logout, 
    isAuthenticated,
    notifications,
    markNotificationAsRead,
    clearAllNotifications,
    syncGoogleSheets,
    isSyncing,
    syncStatus,
    settings,
    technicians,
    activeTab,
    setActiveTab
  } = useMaintenance();

  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [showQuickCallModal, setShowQuickCallModal] = useState(false);

  const unreadCount = notifications.filter(n => !n.read).length;

  const roleLabels: Record<UserRole, { label: string; bg: string; text: string }> = {
    admin: { label: 'ผู้จัดการ / Admin', bg: 'bg-indigo-100 text-indigo-700 border-indigo-200', text: 'สิทธิ์สูงสุด (จัดการทุกส่วน)' },
    technician: { label: 'ช่างอาคาร', bg: 'bg-sky-100 text-sky-700 border-sky-200', text: 'รับงาน, แก้ไขงาน, บันทึกการซ่อม' },
    gsa: { label: 'พนักงานต้อนรับ (GSA)', bg: 'bg-emerald-100 text-emerald-700 border-emerald-200', text: 'แจ้งซ่อม, ติดตามงาน, ตรวจรับ' },
    housekeeping: { label: 'แม่บ้าน', bg: 'bg-amber-100 text-amber-700 border-amber-200', text: 'แจ้งซ่อมห้องพัก, ตรวจรับงาน' },
    security: { label: 'รปภ. (Security)', bg: 'bg-slate-100 text-slate-700 border-slate-200', text: 'แจ้งซ่อมพื้นที่ส่วนกลาง' },
    accounting: { label: 'ฝ่ายบัญชี', bg: 'bg-purple-100 text-purple-700 border-purple-200', text: 'ดูสรุปค่าใช้จ่ายซ่อมแซม' },
    manager: { label: 'ผู้จัดการแผนก', bg: 'bg-blue-100 text-blue-700 border-blue-200', text: 'อนุมัติงานและตรวจรายงาน' },
    owner: { label: 'เจ้าของโรงแรม (Owner)', bg: 'bg-rose-100 text-rose-700 border-rose-200', text: 'ดูภาพรวมและรายงานสรุป' },
    staff: { label: 'พนักงานทั่วไป', bg: 'bg-gray-100 text-gray-700 border-gray-200', text: 'แจ้งซ่อมและติดตามสถานะ' }
  };

  const getActiveTabTitle = () => {
    switch (activeTab) {
      case 'dashboard':
        return { title: 'แดชบอร์ดภาพรวม', icon: LayoutDashboard, category: 'ภาพรวมระบบ' };
      case 'room_matrix':
        return { title: 'ผังสถานะห้องพัก', icon: Building2, category: 'การดำเนินงาน' };
      case 'create_ticket':
        return { title: 'แจ้งซ่อมใหม่', icon: PlusCircle, category: 'การดำเนินงาน' };
      case 'tracking':
        return { title: 'ติดตามงานซ่อม', icon: KanbanSquare, category: 'การดำเนินงาน' };
      case 'line_technician':
        return { title: 'หน้า LINE รับงานช่าง', icon: Smartphone, category: 'การดำเนินงาน' };
      case 'inspection':
        return { title: 'ตรวจรับงานซ่อม', icon: CheckSquare, category: 'การดำเนินงาน' };
      case 'rooms':
        return { title: 'ประวัติห้องพัก & อุปกรณ์', icon: History, category: 'การดำเนินงาน' };
      case 'reports':
        return { title: 'ศูนย์รวมรายงาน', icon: FileBarChart, category: 'รายงาน & การเงิน' };
      case 'report':
        return { title: 'ส่งสรุปรายงาน Gmail ประจำวัน', icon: Mail, category: 'รายงาน & การเงิน' };
      case 'analytics':
        return { title: 'สถิติ & วิเคราะห์งานซ่อม', icon: BarChart3, category: 'รายงาน & การเงิน' };
      case 'accounting_cost':
        return { title: 'บัญชีค่าใช้จ่ายซ่อมแซม', icon: DollarSign, category: 'รายงาน & การเงิน' };
      case 'excel':
        return { title: 'นำเข้า / ส่งออก Excel', icon: FileSpreadsheet, category: 'รายงาน & การเงิน' };
      case 'technicians':
        return { title: 'ช่างประจำอาคาร & สมุดโทรศัพท์', icon: PhoneCall, category: 'การจัดการ' };
      case 'settings':
        return { title: 'ตั้งค่าระบบ & สิทธิ์ผู้ใช้งาน', icon: Settings, category: 'การจัดการ' };
      default:
        return { title: 'ระบบแจ้งซ่อมโรงแรม', icon: LayoutDashboard, category: 'ระบบ' };
    }
  };

  const currentTabInfo = getActiveTabTitle();
  const TabIcon = currentTabInfo.icon;

  const handleRoleChange = (role: UserRole, dept: Department) => {
    setCurrentUserRole(role, dept);
    setShowRoleModal(false);
  };

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-2xs">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          {/* Left: Hamburger menu (Mobile) + Current Page Breadcrumb */}
          <div className="flex items-center space-x-3 min-w-0">
            <button
              onClick={onToggleMobileMenu}
              className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 lg:hidden focus:outline-hidden cursor-pointer"
              aria-label="เปิดเมนูด้านข้าง"
            >
              <Menu className="w-6 h-6" />
            </button>

            {/* Active view header info */}
            <div className="flex items-center space-x-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-700 hidden sm:flex items-center justify-center shrink-0 border border-sky-100">
                <TabIcon className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center space-x-2">
                  <span className="text-[11px] font-medium text-slate-400 hidden md:inline">
                    {currentTabInfo.category} /
                  </span>
                  <h2 className="text-sm sm:text-base font-bold text-slate-800 truncate">
                    {currentTabInfo.title}
                  </h2>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Quick actions, Sync, Notification, Role and Google Profile */}
          <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
            {/* Quick Call Technicians Button */}
            <button
              onClick={() => setShowQuickCallModal(true)}
              className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-orange-500 hover:bg-orange-600 text-white shadow-xs transition-colors cursor-pointer"
              title="ติดต่อช่างเร่งด่วน"
            >
              <PhoneCall className="w-4 h-4 animate-pulse" />
              <span className="hidden md:inline">โทรติดต่อช่าง</span>
            </button>

            {/* Quick LINE Technician Portal Button */}
            <button
              onClick={() => setActiveTab('line_technician')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                activeTab === 'line_technician'
                  ? 'bg-[#06C755] text-white shadow-xs'
                  : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200'
              }`}
              title="เปิดหน้า LINE ช่าง (กดรับงาน / Update / ส่งงาน)"
            >
              <Smartphone className={`w-3.5 h-3.5 ${activeTab === 'line_technician' ? 'text-white' : 'text-[#06C755]'}`} />
              <span className="hidden sm:inline">หน้า LINE ช่าง</span>
            </button>

            {/* Google Sheets Sync Button */}
            {settings.spreadsheetId && (
              <button
                onClick={() => syncGoogleSheets()}
                disabled={isSyncing}
                className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 transition-colors cursor-pointer"
                title="ซิงค์ข้อมูลกับ Google Sheets"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-emerald-600 ${isSyncing ? 'animate-spin' : ''}`} />
                <span className="hidden lg:inline">ซิงค์ Sheets</span>
              </button>
            )}

            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setShowNotifDropdown(!showNotifDropdown)}
                className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl relative transition-colors cursor-pointer"
                aria-label="การแจ้งเตือน"
              >
                <Bell className="w-5 h-5 text-slate-700" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-bounce">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Dropdown */}
              {showNotifDropdown && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-sm text-slate-800">การแจ้งเตือน Real-time</span>
                      {unreadCount > 0 && (
                        <span className="px-2 py-0.5 text-xs bg-sky-100 text-sky-700 rounded-full font-medium">
                          {unreadCount} ใหม่
                        </span>
                      )}
                    </div>
                    {notifications.length > 0 && (
                      <button
                        onClick={clearAllNotifications}
                        className="text-xs text-slate-400 hover:text-slate-600 underline cursor-pointer"
                      >
                        ล้างทั้งหมด
                      </button>
                    )}
                  </div>

                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-50">
                    {notifications.length === 0 ? (
                      <div className="py-8 text-center text-slate-400 text-xs">
                        ไม่มีการแจ้งเตือนใหม่
                      </div>
                    ) : (
                      notifications.map(notif => (
                        <div
                          key={notif.id}
                          onClick={() => {
                            markNotificationAsRead(notif.id);
                            if (notif.ticketId) setActiveTab('tracking');
                            setShowNotifDropdown(false);
                          }}
                          className={`p-3 text-left hover:bg-sky-50/50 cursor-pointer transition-colors ${notif.read ? 'opacity-70' : 'bg-sky-50/20'}`}
                        >
                          <div className="flex items-start justify-between">
                            <h4 className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                              {notif.type === 'urgent' && <AlertTriangle className="w-3.5 h-3.5 text-rose-500 shrink-0" />}
                              {notif.type === 'success' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />}
                              {notif.title}
                            </h4>
                            <span className="text-[10px] text-slate-400 shrink-0">
                              {new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 mt-1 leading-relaxed">{notif.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Role Switcher Badge */}
            <button
              onClick={() => setShowRoleModal(true)}
              className={`flex items-center space-x-1.5 px-2.5 py-1.5 text-xs font-medium rounded-xl border transition-all cursor-pointer ${
                currentUser ? roleLabels[currentUser.role]?.bg : 'bg-slate-100 text-slate-700'
              }`}
              title="เปลี่ยนสิทธิ์บทบาทเพื่อทดสอบระบบ"
            >
              <Shield className="w-3.5 h-3.5" />
              <span className="font-semibold hidden sm:inline">{currentUser ? roleLabels[currentUser.role]?.label : 'เลือกสิทธิ์'}</span>
            </button>

            {/* Google User Profile or Login */}
            {currentUser && isAuthenticated ? (
              <div className="flex items-center space-x-2 pl-1">
                {currentUser.photoURL ? (
                  <img
                    src={currentUser.photoURL}
                    alt={currentUser.displayName}
                    className="w-8 h-8 rounded-full border border-sky-300"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-blue-700 text-white font-bold text-xs flex items-center justify-center">
                    {currentUser.displayName.charAt(0)}
                  </div>
                )}
                <button
                  onClick={logout}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                  title="ออกจากระบบ Google"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={loginWithGoogle}
                className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 shadow-xs transition-colors cursor-pointer"
              >
                <svg className="w-4 h-4" viewBox="0 0 48 48">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                </svg>
                <span className="hidden md:inline">เข้าสู่ระบบ Google</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Role Switcher Modal */}
      {showRoleModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <Shield className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-base text-slate-800">จัดการและทดสอบระดับสิทธิ์ (Role-Based)</h3>
              </div>
              <button 
                onClick={() => setShowRoleModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-slate-500 mt-2 mb-4">
              เลือกระดับบทบาทเพื่อทดสอบสิทธิ์การเข้าถึง เช่น เมนูตรวจรับงาน, การอัปเดตงานของช่าง, หรือการส่งอีเมลรายงาน
            </p>

            <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
              {[
                { role: 'admin' as UserRole, dept: 'ผู้จัดการโรงแรม (HM)' as Department },
                { role: 'technician' as UserRole, dept: 'ช่างอาคาร' as Department },
                { role: 'gsa' as UserRole, dept: 'พนักงานต้อนรับ (GSA)' as Department },
                { role: 'housekeeping' as UserRole, dept: 'แม่บ้าน' as Department },
                { role: 'manager' as UserRole, dept: 'ผู้จัดการโรงแรม (HM)' as Department },
                { role: 'owner' as UserRole, dept: 'Owner' as Department },
                { role: 'security' as UserRole, dept: 'พนักงานรักษาความปลอดภัย' as Department },
                { role: 'accounting' as UserRole, dept: 'บัญชี' as Department }
              ].map(item => {
                const info = roleLabels[item.role];
                const isActive = currentUser?.role === item.role;
                return (
                  <button
                    key={item.role}
                    onClick={() => handleRoleChange(item.role, item.dept)}
                    className={`w-full text-left p-3 rounded-xl border transition-all flex items-center justify-between cursor-pointer ${
                      isActive 
                        ? 'border-indigo-500 bg-indigo-50/70 shadow-xs' 
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-sm text-slate-800">{info.label}</span>
                        <span className="text-[10px] px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full">{item.dept}</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{info.text}</p>
                    </div>
                    {isActive && <UserCheck className="w-5 h-5 text-indigo-600 shrink-0 ml-2" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Quick Call Speed-Dial Modal */}
      {showQuickCallModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-orange-100 text-orange-600 rounded-xl">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-800">โทรติดต่อช่างเร่งด่วน</h3>
                  <p className="text-xs text-slate-500">กดเพื่อโทรออกหาช่างประจำเวรได้ทันที</p>
                </div>
              </div>
              <button 
                onClick={() => setShowQuickCallModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 mt-4">
              {technicians.map(tech => (
                <div key={tech.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between hover:bg-orange-50/50 hover:border-orange-200 transition-colors">
                  <div className="flex items-center space-x-3">
                    <img 
                      src={tech.avatar || 'https://images.unsplash.com/photo-1540569014015-19a7be504e3a?w=100'} 
                      alt={tech.name} 
                      className="w-10 h-10 rounded-full object-cover border border-slate-300"
                    />
                    <div>
                      <h4 className="font-semibold text-xs text-slate-800">{tech.name}</h4>
                      <p className="text-[11px] text-slate-500">ความเชี่ยวชาญ: {tech.skills.join(', ')}</p>
                      <div className="flex items-center space-x-2 mt-0.5">
                        <span className={`w-2 h-2 rounded-full ${tech.status === 'available' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                        <span className="text-[10px] text-slate-500">
                          {tech.status === 'available' ? 'พร้อมรับงาน' : `ติดงาน (${tech.activeJobsCount} งาน)`}
                        </span>
                      </div>
                    </div>
                  </div>

                  <a
                    href={`tel:${tech.phone.replace(/[^0-9]/g, '')}`}
                    className="flex items-center space-x-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors shrink-0"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>โทร {tech.phone}</span>
                  </a>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => {
                  setShowQuickCallModal(false);
                  setActiveTab('technicians');
                }}
                className="text-xs text-sky-600 hover:text-sky-800 font-medium cursor-pointer"
              >
                ดูสมุดโทรศัพท์และตารางเวรช่างทั้งหมด →
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

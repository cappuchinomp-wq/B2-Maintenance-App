import React from 'react';
import { useMaintenance } from '../context/MaintenanceContext';
import { 
  LayoutDashboard, 
  Building2, 
  PlusCircle, 
  KanbanSquare, 
  CheckSquare, 
  History, 
  BarChart3, 
  Mail, 
  DollarSign, 
  FileSpreadsheet, 
  PhoneCall, 
  Settings, 
  FileBarChart,
  Shield, 
  Wrench,
  ChevronLeft,
  ChevronRight,
  X,
  Sparkles,
  Layers,
  Smartphone
} from 'lucide-react';
import { UserRole } from '../types/maintenance';

interface SidebarProps {
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  onOpenRoleModal: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  mobileOpen,
  setMobileOpen,
  collapsed,
  setCollapsed,
  onOpenRoleModal
}) => {
  const { 
    activeTab, 
    setActiveTab, 
    tickets, 
    settings, 
    currentUser, 
    isAuthenticated 
  } = useMaintenance();

  const pendingInspectionCount = tickets.filter(t => t.status === 'pending_inspection').length;
  const inProgressCount = tickets.filter(t => t.status === 'in_progress' || t.status === 'pending').length;

  const roleLabels: Record<UserRole, { label: string; color: string }> = {
    admin: { label: 'Admin / ผู้จัดการ', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
    technician: { label: 'ช่างอาคาร', color: 'bg-sky-50 text-sky-700 border-sky-200' },
    gsa: { label: 'พนักงานต้อนรับ', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    housekeeping: { label: 'แม่บ้าน', color: 'bg-amber-50 text-amber-700 border-amber-200' },
    security: { label: 'รปภ.', color: 'bg-slate-50 text-slate-700 border-slate-200' },
    accounting: { label: 'ฝ่ายบัญชี', color: 'bg-purple-50 text-purple-700 border-purple-200' },
    manager: { label: 'ผู้จัดการแผนก', color: 'bg-blue-50 text-blue-700 border-blue-200' },
    owner: { label: 'เจ้าของโรงแรม', color: 'bg-rose-50 text-rose-700 border-rose-200' },
    staff: { label: 'พนักงานทั่วไป', color: 'bg-gray-50 text-gray-700 border-gray-200' }
  };

  const navGroups = [
    {
      groupTitle: 'การดำเนินงานหลัก',
      items: [
        {
          id: 'dashboard',
          label: 'แดชบอร์ดภาพรวม',
          icon: LayoutDashboard,
          badge: null
        },
        {
          id: 'room_matrix',
          label: 'ผังสถานะห้องพัก',
          icon: Building2,
          badge: null
        },
        {
          id: 'create_ticket',
          label: 'แจ้งซ่อมใหม่',
          icon: PlusCircle,
          badge: null
        },
        {
          id: 'tracking',
          label: 'ติดตามงานซ่อม',
          icon: KanbanSquare,
          badge: inProgressCount > 0 ? (
            <span className="px-2 py-0.5 text-[11px] font-bold rounded-full bg-sky-500 text-white shadow-xs">
              {inProgressCount}
            </span>
          ) : null
        },
        {
          id: 'line_technician',
          label: 'หน้า LINE รับงานช่าง',
          icon: Smartphone,
          badge: (
            <span className="px-1.5 py-0.5 text-[10px] font-black rounded-md bg-[#06C755] text-white shadow-2xs">
              LINE ช่าง
            </span>
          )
        },
        {
          id: 'inspection',
          label: 'ตรวจรับงานซ่อม',
          icon: CheckSquare,
          badge: pendingInspectionCount > 0 ? (
            <span className="px-2 py-0.5 text-[11px] font-bold rounded-full bg-amber-500 text-white animate-pulse shadow-xs">
              {pendingInspectionCount}
            </span>
          ) : null
        },
        {
          id: 'rooms',
          label: 'ประวัติห้องพัก & อุปกรณ์',
          icon: History,
          badge: null
        }
      ]
    },
    {
      groupTitle: 'รายงาน & การเงิน',
      items: [
        {
          id: 'reports',
          label: 'ศูนย์รวมรายงาน',
          icon: FileBarChart,
          badge: null
        },
        {
          id: 'report',
          label: 'ส่งสรุป Gmail ประจำวัน',
          icon: Mail,
          badge: <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 font-medium">PDF/Excel</span>
        },
        {
          id: 'analytics',
          label: 'สถิติ & วิเคราะห์งานซ่อม',
          icon: BarChart3,
          badge: null
        },
        {
          id: 'accounting_cost',
          label: 'บัญชีค่าใช้จ่ายซ่อมแซม',
          icon: DollarSign,
          badge: null
        },
        {
          id: 'excel',
          label: 'นำเข้า / ส่งออก Excel',
          icon: FileSpreadsheet,
          badge: null
        }
      ]
    },
    {
      groupTitle: 'การจัดการ & ช่าง',
      items: [
        {
          id: 'technicians',
          label: 'ช่างประจำอาคาร & สมุดโทรศัพท์',
          icon: PhoneCall,
          badge: null
        },
        {
          id: 'settings',
          label: 'ตั้งค่าระบบ & สิทธิ์',
          icon: Settings,
          badge: null
        }
      ]
    }
  ];

  const handleItemClick = (id: string) => {
    setActiveTab(id);
    if (mobileOpen) {
      setMobileOpen(false);
    }
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white border-r border-slate-200/80 shadow-xs select-none">
      {/* 1. Header / Logo Branding */}
      <div className="h-16 px-4 flex items-center justify-between border-b border-slate-100">
        <div 
          onClick={() => handleItemClick('dashboard')}
          className={`flex items-center space-x-3 cursor-pointer ${collapsed ? 'justify-center w-full' : ''}`}
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 via-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-sky-500/20 shrink-0">
            <Wrench className="w-5 h-5" />
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <h1 className="text-sm font-bold bg-gradient-to-r from-sky-800 via-blue-900 to-indigo-950 bg-clip-text text-transparent truncate">
                {settings.hotelName || 'Hotel Maintenance'}
              </h1>
              <p className="text-[11px] text-slate-400 font-medium truncate">
                ระบบบริหารงานแจ้งซ่อม
              </p>
            </div>
          )}
        </div>

        {/* Mobile close button */}
        <button
          onClick={() => setMobileOpen(false)}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 lg:hidden"
          aria-label="ปิดเมนู"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* 2. Quick Action "+ แจ้งซ่อมใหม่" */}
      <div className={`p-3 ${collapsed ? 'px-2' : 'px-3'}`}>
        <button
          onClick={() => handleItemClick('create_ticket')}
          className={`w-full flex items-center justify-center space-x-2 py-2.5 rounded-xl font-semibold text-xs sm:text-sm text-white bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-600 hover:from-sky-700 hover:via-blue-700 hover:to-indigo-700 shadow-md shadow-sky-500/20 active:scale-[0.98] transition-all cursor-pointer ${
            collapsed ? 'px-0' : 'px-4'
          }`}
          title="แจ้งซ่อมห้องพักหรือพื้นที่ใหม่"
        >
          <PlusCircle className="w-4 h-4 shrink-0" />
          {!collapsed && <span>แจ้งซ่อมใหม่</span>}
        </button>
      </div>

      {/* 3. Navigation Menu Items */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-6 scrollbar-thin scrollbar-thumb-slate-200">
        {navGroups.map((group, gIdx) => (
          <div key={gIdx} className="space-y-1">
            {!collapsed && (
              <div className="px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                {group.groupTitle}
              </div>
            )}
            {group.items.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleItemClick(item.id)}
                  title={collapsed ? item.label : undefined}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all group cursor-pointer ${
                    isActive
                      ? 'bg-gradient-to-r from-sky-600 to-blue-700 text-white font-semibold shadow-md shadow-sky-500/20'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-sky-50/70'
                  }`}
                >
                  <div className={`flex items-center space-x-3 min-w-0 ${collapsed ? 'mx-auto' : ''}`}>
                    <Icon className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${
                      isActive ? 'text-white' : 'text-slate-500 group-hover:text-blue-600'
                    }`} />
                    {!collapsed && (
                      <span className="truncate">{item.label}</span>
                    )}
                  </div>
                  {!collapsed && item.badge && (
                    <div className="ml-2 shrink-0">{item.badge}</div>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* 4. Bottom User Profile & Collapse Toggle */}
      <div className="p-3 border-t border-slate-100 bg-slate-50/60 space-y-2">
        {/* User Role Card */}
        <div 
          onClick={onOpenRoleModal}
          className={`flex items-center space-x-2.5 p-2 rounded-xl border border-slate-200/80 bg-white hover:border-indigo-300 hover:bg-indigo-50/30 transition-all cursor-pointer ${
            collapsed ? 'justify-center' : ''
          }`}
          title="คลิกเพื่อเปลี่ยนสิทธิ์และระดับการเข้าถึง"
        >
          <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0 font-bold text-xs">
            <Shield className="w-4 h-4" />
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 truncate">
                  {currentUser ? roleLabels[currentUser.role]?.label : 'ผู้ใช้งาน'}
                </span>
                <span className="text-[10px] text-indigo-600 font-medium hover:underline">
                  เปลี่ยน
                </span>
              </div>
              <p className="text-[10px] text-slate-400 truncate">
                {currentUser?.department || 'สิทธิ์การใช้งานระบบ'}
              </p>
            </div>
          )}
        </div>

        {/* Sheets & Desktop Toggle */}
        {!collapsed && (
          <div className="px-2 py-1 flex items-center justify-between text-[11px] text-slate-400">
            <div className="flex items-center space-x-1.5">
              <span className={`w-2 h-2 rounded-full ${settings.spreadsheetId ? 'bg-emerald-500' : 'bg-amber-400'}`} />
              <span>{settings.spreadsheetId ? 'Google Sheets เชื่อมต่อ' : 'Sheets สแตนด์บาย'}</span>
            </div>
            <button
              onClick={() => setCollapsed(true)}
              className="p-1 rounded-md hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors hidden lg:block"
              title="ย่อแถบเมนูด้านข้าง"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
        )}

        {collapsed && (
          <div className="flex justify-center pt-1 hidden lg:flex">
            <button
              onClick={() => setCollapsed(false)}
              className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              title="ขยายแถบเมนูด้านข้าง"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar (Fixed Left) */}
      <aside 
        className={`hidden lg:block fixed inset-y-0 left-0 z-40 transition-all duration-300 ease-in-out ${
          collapsed ? 'w-20' : 'w-64 xl:w-72'
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Drawer (Slide-over) */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop overlay */}
          <div 
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity duration-300"
            onClick={() => setMobileOpen(false)}
          />

          {/* Drawer panel */}
          <div className="fixed inset-y-0 left-0 w-72 max-w-[80vw] z-50 transform transition-transform duration-300 ease-out shadow-2xl">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};

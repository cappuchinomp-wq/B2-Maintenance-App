import React, { useState, useRef, useEffect } from 'react';
import { useMaintenance } from '../context/MaintenanceContext';
import { 
  LayoutDashboard, 
  Building2, 
  KanbanSquare, 
  History, 
  CheckSquare, 
  FileSpreadsheet, 
  Mail, 
  PhoneCall, 
  Settings,
  ChevronDown,
  BarChart3,
  DollarSign,
  MoreHorizontal,
  Smartphone
} from 'lucide-react';

export const NavigationTabs: React.FC = () => {
  const { activeTab, setActiveTab, tickets } = useMaintenance();
  
  // Separate dropdown states for 1. รายงาน and 2. อื่น ๆ
  const [isReportsDropdownOpen, setIsReportsDropdownOpen] = useState(false);
  const [isOthersDropdownOpen, setIsOthersDropdownOpen] = useState(false);

  const reportsDropdownRef = useRef<HTMLDivElement>(null);
  const othersDropdownRef = useRef<HTMLDivElement>(null);

  const pendingInspectionCount = tickets.filter(t => t.status === 'pending_inspection').length;
  const inProgressCount = tickets.filter(t => t.status === 'in_progress' || t.status === 'pending').length;

  // 1. รายงาน Dropdown Items (with color bars as in user's image example)
  const reportItems = [
    { 
      id: 'report', 
      label: 'ส่งสรุปรายงานประจำวันผ่าน Gmail', 
      desc: 'ส่งรายงานสรุปทางอีเมล พร้อมแนบไฟล์ Excel (.xlsx) และ PDF (.pdf)', 
      icon: Mail, 
      barColor: 'bg-amber-400' 
    },
    { 
      id: 'analytics', 
      label: 'รายงานวิเคราะห์การแจ้งซ่อมและงานบำรุงรักษา', 
      desc: 'สถิติงานซ่อมบำรุงและประสิทธิภาพช่าง (Export Excel / PDF)', 
      icon: BarChart3, 
      barColor: 'bg-blue-600' 
    },
    { 
      id: 'accounting_cost', 
      label: 'บันทึก & รายงานค่าใช้จ่ายซ่อมแซมฝ่ายบัญชี', 
      desc: 'สมุดรายวันค่าใช้จ่าย อะไหล่ ค่าแรง ใบเสร็จ (Export Excel / PDF)', 
      icon: DollarSign, 
      barColor: 'bg-emerald-500' 
    },
    { 
      id: 'excel', 
      label: 'นำเข้าข้อมูลห้องพัก Excel ย้อนหลัง', 
      desc: 'อัปโหลดประวัติงานซ่อมบำรุงจากไฟล์ Excel เข้าสู่ระบบ', 
      icon: FileSpreadsheet, 
      barColor: 'bg-purple-500' 
    },
  ];

  // 2. อื่น ๆ Dropdown Items (with color bars as in user's image example)
  const otherItems = [
    { 
      id: 'line_technician', 
      label: 'หน้า LINE ให้ช่างรับงาน & ส่งงาน', 
      desc: 'ให้ช่างสามารถกดรับงาน, Update งาน, และส่งงานซ่อมเสร็จเชื่อมต่อ Webapp', 
      icon: Smartphone, 
      barColor: 'bg-[#06C755]' 
    },
    { 
      id: 'settings', 
      label: 'ตั้งค่าระบบ & สิทธิ์ผู้ใช้งาน', 
      desc: 'กำหนดค่า Google Sheets, LINE Messaging API, อีเมลผู้รับ และข้อมูลโรงแรม', 
      icon: Settings, 
      barColor: 'bg-indigo-500' 
    },
    { 
      id: 'technicians', 
      label: 'ติดต่อช่างประจำอาคาร & สมุดโทรศัพท์', 
      desc: 'ตรวจสอบรายชื่อช่างประจำเวร ความเชี่ยวชาญ และกดโทรออกทันที', 
      icon: PhoneCall, 
      barColor: 'bg-orange-500' 
    },
  ];

  const isReportsActive = reportItems.some(item => item.id === activeTab) || activeTab === 'tools';
  const isOthersActive = otherItems.some(item => item.id === activeTab);

  // Close dropdowns on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (reportsDropdownRef.current && !reportsDropdownRef.current.contains(event.target as Node)) {
        setIsReportsDropdownOpen(false);
      }
      if (othersDropdownRef.current && !othersDropdownRef.current.contains(event.target as Node)) {
        setIsOthersDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <nav className="bg-white border-b border-sky-100 shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center space-x-1 sm:space-x-2 py-2 overflow-x-auto scrollbar-none">
          {/* 1. แดชบอร์ดภาพรวม */}
          <button
            onClick={() => {
              setActiveTab('dashboard');
              setIsReportsDropdownOpen(false);
              setIsOthersDropdownOpen(false);
            }}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all shrink-0 cursor-pointer ${
              activeTab === 'dashboard'
                ? 'bg-gradient-to-r from-sky-600 to-blue-700 text-white shadow-md shadow-sky-500/20 font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-sky-50/70'
            }`}
          >
            <LayoutDashboard className={`w-4 h-4 ${activeTab === 'dashboard' ? 'text-white' : 'text-slate-500'}`} />
            <span>แดชบอร์ดภาพรวม</span>
          </button>

          {/* 2. ผังสถานะห้องพัก (ขึ้นมาเป็น Tab ใหม่ข้างหน้า "ติดตามงาน") */}
          <button
            onClick={() => {
              setActiveTab('room_matrix');
              setIsReportsDropdownOpen(false);
              setIsOthersDropdownOpen(false);
            }}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all shrink-0 cursor-pointer ${
              activeTab === 'room_matrix'
                ? 'bg-gradient-to-r from-sky-600 to-blue-700 text-white shadow-md shadow-sky-500/20 font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-sky-50/70'
            }`}
          >
            <Building2 className={`w-4 h-4 ${activeTab === 'room_matrix' ? 'text-white' : 'text-slate-500'}`} />
            <span>ผังสถานะห้องพัก</span>
          </button>

          {/* 3. ติดตามงาน */}
          <button
            onClick={() => {
              setActiveTab('tracking');
              setIsReportsDropdownOpen(false);
              setIsOthersDropdownOpen(false);
            }}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all shrink-0 cursor-pointer ${
              activeTab === 'tracking'
                ? 'bg-gradient-to-r from-sky-600 to-blue-700 text-white shadow-md shadow-sky-500/20 font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-sky-50/70'
            }`}
          >
            <KanbanSquare className={`w-4 h-4 ${activeTab === 'tracking' ? 'text-white' : 'text-slate-500'}`} />
            <span>ติดตามงาน</span>
            {inProgressCount > 0 && (
              <span className="ml-1 px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-sky-500 text-white">
                {inProgressCount}
              </span>
            )}
          </button>

          {/* 4. ตรวจรับงาน */}
          <button
            onClick={() => {
              setActiveTab('inspection');
              setIsReportsDropdownOpen(false);
              setIsOthersDropdownOpen(false);
            }}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all shrink-0 cursor-pointer ${
              activeTab === 'inspection'
                ? 'bg-gradient-to-r from-sky-600 to-blue-700 text-white shadow-md shadow-sky-500/20 font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-sky-50/70'
            }`}
          >
            <CheckSquare className={`w-4 h-4 ${activeTab === 'inspection' ? 'text-white' : 'text-slate-500'}`} />
            <span>ตรวจรับงาน</span>
            {pendingInspectionCount > 0 && (
              <span className="ml-1 px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-amber-500 text-white animate-pulse">
                {pendingInspectionCount}
              </span>
            )}
          </button>

          {/* 5. ประวัติห้องพัก */}
          <button
            onClick={() => {
              setActiveTab('rooms');
              setIsReportsDropdownOpen(false);
              setIsOthersDropdownOpen(false);
            }}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all shrink-0 cursor-pointer ${
              activeTab === 'rooms'
                ? 'bg-gradient-to-r from-sky-600 to-blue-700 text-white shadow-md shadow-sky-500/20 font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-sky-50/70'
            }`}
          >
            <History className={`w-4 h-4 ${activeTab === 'rooms' ? 'text-white' : 'text-slate-500'}`} />
            <span>ประวัติห้องพัก</span>
          </button>

          {/* 6. แท็บที่ 1: รายงาน (Dropdown Menu แบบในตัวอย่าง) */}
          <div className="relative shrink-0" ref={reportsDropdownRef}>
            <button
              type="button"
              onClick={() => {
                setActiveTab('reports');
                setIsReportsDropdownOpen(prev => !prev);
                setIsOthersDropdownOpen(false);
              }}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all cursor-pointer ${
                isReportsActive
                  ? 'bg-gradient-to-r from-sky-600 to-blue-700 text-white shadow-md shadow-sky-500/20 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-sky-50/70'
              }`}
            >
              <BarChart3 className={`w-4 h-4 ${isReportsActive ? 'text-white' : 'text-slate-500'}`} />
              <span>รายงาน</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isReportsDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu Modal styled like the example */}
            {isReportsDropdownOpen && (
              <div className="absolute left-0 sm:left-0 mt-2 w-80 sm:w-88 bg-white rounded-2xl shadow-2xl border border-slate-200/90 p-2 z-50 animate-in fade-in slide-in-from-top-2">
                <div className="space-y-1">
                  {reportItems.map(item => {
                    const ItemIcon = item.icon;
                    const isItemActive = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          setActiveTab(item.id);
                          setIsReportsDropdownOpen(false);
                        }}
                        className={`w-full text-left py-2.5 px-3 rounded-xl transition-all flex items-center space-x-3 cursor-pointer group ${
                          isItemActive
                            ? 'bg-sky-50 text-blue-900 font-semibold'
                            : 'hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        {/* Rounded color indicator pill as in example image 2 */}
                        <div className={`w-1.5 h-7 rounded-full shrink-0 ${item.barColor} transition-transform group-hover:scale-y-110`} />

                        {/* Icon */}
                        <ItemIcon className={`w-4 h-4 shrink-0 ${isItemActive ? 'text-blue-700' : 'text-slate-600 group-hover:text-slate-900'}`} />

                        {/* Label & Description */}
                        <div className="flex-1 min-w-0">
                          <div className="text-xs sm:text-sm font-medium leading-snug truncate text-slate-800 group-hover:text-slate-900">
                            {item.label}
                          </div>
                          {item.desc && (
                            <div className="text-[11px] text-slate-400 font-normal truncate mt-0.5">
                              {item.desc}
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* 7. แท็บที่ 2: อื่น ๆ (Dropdown Menu แบบในตัวอย่าง) */}
          <div className="relative shrink-0" ref={othersDropdownRef}>
            <button
              type="button"
              onClick={() => {
                setActiveTab('others');
                setIsOthersDropdownOpen(prev => !prev);
                setIsReportsDropdownOpen(false);
              }}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all cursor-pointer ${
                isOthersActive
                  ? 'bg-gradient-to-r from-sky-600 to-blue-700 text-white shadow-md shadow-sky-500/20 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-sky-50/70'
              }`}
            >
              <MoreHorizontal className={`w-4 h-4 ${isOthersActive ? 'text-white' : 'text-slate-500'}`} />
              <span>อื่น ๆ</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isOthersDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu Modal styled like the example */}
            {isOthersDropdownOpen && (
              <div className="absolute left-0 sm:left-auto sm:right-0 mt-2 w-80 sm:w-88 bg-white rounded-2xl shadow-2xl border border-slate-200/90 p-2 z-50 animate-in fade-in slide-in-from-top-2">
                <div className="space-y-1">
                  {otherItems.map(item => {
                    const ItemIcon = item.icon;
                    const isItemActive = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          setActiveTab(item.id);
                          setIsOthersDropdownOpen(false);
                        }}
                        className={`w-full text-left py-2.5 px-3 rounded-xl transition-all flex items-center space-x-3 cursor-pointer group ${
                          isItemActive
                            ? 'bg-sky-50 text-blue-900 font-semibold'
                            : 'hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        {/* Rounded color indicator pill as in example image 2 */}
                        <div className={`w-1.5 h-7 rounded-full shrink-0 ${item.barColor} transition-transform group-hover:scale-y-110`} />

                        {/* Icon */}
                        <ItemIcon className={`w-4 h-4 shrink-0 ${isItemActive ? 'text-blue-700' : 'text-slate-600 group-hover:text-slate-900'}`} />

                        {/* Label & Description */}
                        <div className="flex-1 min-w-0">
                          <div className="text-xs sm:text-sm font-medium leading-snug truncate text-slate-800 group-hover:text-slate-900">
                            {item.label}
                          </div>
                          {item.desc && (
                            <div className="text-[11px] text-slate-400 font-normal truncate mt-0.5">
                              {item.desc}
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

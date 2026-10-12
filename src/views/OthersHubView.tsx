import React from 'react';
import { useMaintenance } from '../context/MaintenanceContext';
import { 
  Settings, 
  PhoneCall, 
  ArrowRight, 
  Sparkles, 
  Shield, 
  Users, 
  Phone, 
  Layers,
  Key,
  Database
} from 'lucide-react';

export const OthersHubView: React.FC = () => {
  const { setActiveTab, settings, technicians } = useMaintenance();
  const availableTechs = technicians.filter(t => t.status === 'available').length;

  const otherCards = [
    {
      id: 'settings',
      title: 'ตั้งค่าระบบ & สิทธิ์ผู้ใช้งาน',
      subtitle: 'System Configuration & RBAC Permissions',
      description: 'จัดการการเชื่อมต่อ Google Sheets, LINE Messaging API (ระบุ Target ID ส่งที่เดียว), ระบบส่งรายงานสรุปทาง Gmail อัตโนมัติ และตารางเมทริกซ์สิทธิ์การใช้งานของแต่ละตำแหน่งงาน',
      icon: Settings,
      badge: 'Admin & Integrations',
      color: 'from-indigo-600 to-purple-700',
      iconBg: 'bg-indigo-100 text-indigo-700',
      stats: `Google Sheets • LINE Messaging API • ตั้งเวลา Gmail อัตโนมัติ • สิทธิ์ 7 ตำแหน่ง`,
      btnText: 'เปิดหน้าตั้งค่าระบบ'
    },
    {
      id: 'technicians',
      title: 'ติดต่อช่างประจำอาคาร & สมุดโทรศัพท์',
      subtitle: 'Technician Phonebook & Duty Schedule',
      description: 'ตรวจสอบรายชื่อช่างประจำเวร ทักษะความเชี่ยวชาญ สถานะพร้อมรับงานปัจจุบัน และกดปุ่มโทรออกหาช่างได้ทันทีในคลิกเดียว',
      icon: PhoneCall,
      badge: 'Quick Contact',
      color: 'from-orange-600 to-rose-700',
      iconBg: 'bg-orange-100 text-orange-700',
      stats: `ช่างประจำการ ${technicians.length} ท่าน (พร้อมรับงาน ${availableTechs} ท่าน)`,
      btnText: 'เปิดสมุดโทรศัพท์ช่าง'
    }
  ];

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-800 via-indigo-900 to-blue-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-indigo-700/30">
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center space-x-2 px-3 py-1 bg-white/15 rounded-full text-xs font-medium text-indigo-100 backdrop-blur-md mb-1 border border-white/10">
            <Settings className="w-3.5 h-3.5 text-indigo-300" />
            <span>{settings.hotelName} • ศูนย์รวมเครื่องมือและการตั้งค่าระบบ</span>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white">
            หน้าอื่น ๆ & การตั้งค่า (Others & Settings Hub)
          </h1>
          <p className="text-xs sm:text-sm text-indigo-100 max-w-2xl leading-relaxed">
            เลือกเมนูที่ต้องการ: ตั้งค่าระบบและสิทธิ์ผู้ใช้งาน (Google Sheets, LINE, อีเมลรายงานอัตโนมัติ) หรือติดต่อช่างประจำอาคาร
          </p>
        </div>
      </div>

      {/* Grid of the 2 items */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {otherCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.id}
              onClick={() => setActiveTab(card.id)}
              className="bg-white rounded-3xl p-6 border border-sky-100 shadow-2xs hover:shadow-xl hover:border-indigo-300 transition-all duration-200 flex flex-col justify-between group cursor-pointer"
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${card.iconBg} shadow-sm group-hover:scale-110 transition-transform`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="px-2.5 py-1 text-[11px] font-bold rounded-full bg-slate-100 text-slate-700 group-hover:bg-indigo-100 group-hover:text-indigo-800 transition-colors">
                    {card.badge}
                  </span>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-slate-900 group-hover:text-indigo-700 transition-colors leading-snug">
                    {card.title}
                  </h3>
                  <p className="text-[11px] font-semibold text-slate-400 mt-0.5 font-mono">{card.subtitle}</p>
                  <p className="text-xs text-slate-600 mt-2.5 leading-relaxed">
                    {card.description}
                  </p>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 space-y-3">
                <div className="text-[11px] text-slate-500 font-medium flex items-center space-x-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>{card.stats}</span>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveTab(card.id);
                  }}
                  className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-gradient-to-r ${card.color} shadow-sm group-hover:shadow-md flex items-center justify-center space-x-2 transition-all cursor-pointer`}
                >
                  <span>{card.btnText}</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

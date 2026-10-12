import React from 'react';
import { useMaintenance } from '../context/MaintenanceContext';
import { 
  Layers, 
  Mail, 
  BarChart3, 
  DollarSign, 
  FileSpreadsheet, 
  PhoneCall, 
  Settings,
  ArrowRight, 
  Sparkles, 
  ShieldCheck, 
  FileText, 
  Calendar, 
  Clock, 
  Download,
  Users,
  CheckCircle2
} from 'lucide-react';

export const ToolsHubView: React.FC = () => {
  const { setActiveTab, tickets, settings, technicians } = useMaintenance();

  const totalCost = tickets.reduce((sum, t) => sum + (t.totalCost || 0), 0);
  const completedCount = tickets.filter(t => t.status === 'completed').length;
  const availableTechs = technicians.filter(t => t.status === 'available').length;

  const toolsList = [
    {
      id: 'report',
      title: 'ส่งสรุปรายงานประจำวันผ่าน Gmail',
      subtitle: 'Daily Maintenance Summary Email Report',
      description: 'ส่งสรุปผลการซ่อมบำรุงประจำวันเข้ากล่องจดหมาย Gmail ของผู้บริหารและหัวหน้าแผนก พร้อมแนบไฟล์ Excel (.xlsx) และ PDF (.pdf) อัตโนมัติ',
      icon: Mail,
      badge: 'Email & Attachments',
      color: 'from-blue-600 to-indigo-700',
      iconBg: 'bg-blue-100 text-blue-700',
      stats: `ผู้รับ: ${settings.emailRecipients?.length || 1} อีเมล • แนบ .xlsx / .pdf`,
      btnText: 'เปิดระบบส่งรายงาน Gmail',
      popular: true
    },
    {
      id: 'analytics',
      title: 'รายงานวิเคราะห์การแจ้งซ่อมและงานบำรุงรักษา',
      subtitle: 'Executive Analytics & Insights',
      description: 'วิเคราะห์สถิติการแจ้งซ่อม ความถี่ของปัญหาแต่ละหมวดหมู่งาน ประสิทธิภาพความเร็วในการแก้ไข และ Export ข้อมูลเป็น Excel (.xlsx) / PDF (.pdf)',
      icon: BarChart3,
      badge: 'Data & Charts',
      color: 'from-indigo-600 to-purple-700',
      iconBg: 'bg-indigo-100 text-indigo-700',
      stats: `วิเคราะห์ ${tickets.length} รายการ • 7 ชั้น 126 ห้อง`,
      btnText: 'ดูรายงานวิเคราะห์ & Export',
      popular: true
    },
    {
      id: 'accounting_cost',
      title: 'บันทึก & รายงานค่าใช้จ่ายซ่อมแซม (ระบบบัญชี)',
      subtitle: 'Maintenance Cost Accounting Ledger',
      description: 'สมุดรายวันบันทึกค่าอะไหล่ ค่าแรงช่าง ค่าจ้างผู้รับเหมา เลขที่ใบเสร็จรับเงิน และสถานะทางบัญชี พร้อมส่งออกสมุดบัญชี Excel และใบสรุป PDF',
      icon: DollarSign,
      badge: 'Accounting & Ledger',
      color: 'from-amber-600 to-orange-700',
      iconBg: 'bg-amber-100 text-amber-700',
      stats: `ยอดค่าใช้จ่ายสะสม ฿${totalCost.toLocaleString()}`,
      btnText: 'เปิดสมุดบัญชีค่าใช้จ่าย',
      popular: true
    },
    {
      id: 'excel',
      title: 'นำเข้าข้อมูล Excel ย้อนหลัง',
      subtitle: 'Historical Excel Import & Data Sync',
      description: 'อัปโหลดไฟล์ประวัติการซ่อมบำรุงในอดีต (.xlsx / .csv) เพื่อรวมข้อมูลเข้าสู่ฐานข้อมูลระบบและซิงค์ขึ้น Google Sheets ทันที',
      icon: FileSpreadsheet,
      badge: 'Batch Data Import',
      color: 'from-emerald-600 to-teal-700',
      iconBg: 'bg-emerald-100 text-emerald-700',
      stats: 'รองรับไฟล์ Excel และ CSV พร้อม Preview',
      btnText: 'เปิดหน้าอัปโหลด Excel'
    },
    {
      id: 'technicians',
      title: 'ติดต่อช่างประจำอาคาร & สมุดโทรศัพท์',
      subtitle: 'Technician Phonebook & Duty Schedule',
      description: 'ตรวจสอบรายชื่อช่างประจำเวร ความเชี่ยวชาญ สถานะพร้อมรับงาน และกดโทรออกหาช่างได้ทันทีในคลิกเดียว',
      icon: PhoneCall,
      badge: 'Quick Contact',
      color: 'from-orange-600 to-rose-700',
      iconBg: 'bg-orange-100 text-orange-700',
      stats: `ช่างประจำการ ${technicians.length} ท่าน (พร้อมงาน ${availableTechs} ท่าน)`,
      btnText: 'เปิดสมุดโทรศัพท์ช่าง'
    },
    {
      id: 'settings',
      title: 'ตั้งค่าระบบ & สิทธิ์ผู้ใช้งาน',
      subtitle: 'System Configuration & Integration',
      description: 'จัดการการเชื่อมต่อ Google Sheets, LINE Messaging API (ระบุ Target ID ส่งที่เดียว), รายชื่ออีเมลผู้รับรายงานประจำวัน และข้อมูลโรงแรม B2 Suphanburi',
      icon: Settings,
      badge: 'System & Admin',
      color: 'from-purple-600 to-pink-700',
      iconBg: 'bg-purple-100 text-purple-700',
      stats: `เชื่อมต่อ Google Sheets • LINE • บัญชีผู้ใช้`,
      btnText: 'เปิดหน้าตั้งค่าระบบ'
    }
  ];

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-sky-800 via-blue-900 to-indigo-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-blue-700/30">
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center space-x-2 px-3 py-1 bg-white/15 rounded-full text-xs font-medium text-sky-100 backdrop-blur-md mb-1 border border-white/10">
            <Layers className="w-3.5 h-3.5 text-sky-300" />
            <span>{settings.hotelName} • ศูนย์รวมเครื่องมือ การออกรายงาน และการตั้งค่า</span>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white">
            เครื่องมือ & ระบบรายงาน (Tools & Reports Hub)
          </h1>
          <p className="text-xs sm:text-sm text-sky-100 max-w-2xl leading-relaxed">
            เลือกเมนูเครื่องมือที่ต้องการใช้งาน: ส่งรายงานสรุปประจำวันทาง Gmail, วิเคราะห์สถิติและประสิทธิภาพ, บันทึกค่าใช้จ่ายทำบัญชี, นำเข้าข้อมูลย้อนหลัง, ติดต่อช่าง หรือตั้งค่าระบบ
          </p>
        </div>
      </div>

      {/* Main Grid of 6 Tools */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {toolsList.map((tool) => {
          const Icon = tool.icon;
          return (
            <div
              key={tool.id}
              onClick={() => setActiveTab(tool.id)}
              className="bg-white rounded-3xl p-6 border border-sky-100 shadow-2xs hover:shadow-xl hover:border-sky-300 transition-all duration-200 flex flex-col justify-between group cursor-pointer"
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${tool.iconBg} shadow-sm group-hover:scale-110 transition-transform`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  {tool.badge && (
                    <span className="px-2.5 py-1 text-[11px] font-bold rounded-full bg-slate-100 text-slate-700 group-hover:bg-sky-100 group-hover:text-blue-800 transition-colors">
                      {tool.badge}
                    </span>
                  )}
                </div>

                <div>
                  <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-700 transition-colors leading-snug">
                    {tool.title}
                  </h3>
                  <p className="text-[11px] font-semibold text-slate-400 mt-0.5 font-mono">{tool.subtitle}</p>
                  <p className="text-xs text-slate-600 mt-2.5 leading-relaxed">
                    {tool.description}
                  </p>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 space-y-3">
                <div className="text-[11px] text-slate-500 font-medium flex items-center space-x-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>{tool.stats}</span>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveTab(tool.id);
                  }}
                  className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-gradient-to-r ${tool.color} shadow-sm group-hover:shadow-md flex items-center justify-center space-x-2 transition-all cursor-pointer`}
                >
                  <span>{tool.btnText}</span>
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

import React from 'react';
import { useMaintenance } from '../context/MaintenanceContext';
import { 
  BarChart3, 
  Mail, 
  DollarSign, 
  FileSpreadsheet, 
  ArrowRight, 
  Sparkles, 
  CheckCircle2, 
  Clock, 
  FileText, 
  Download,
  Calendar,
  Layers
} from 'lucide-react';

export const ReportsHubView: React.FC = () => {
  const { setActiveTab, tickets, settings } = useMaintenance();

  const totalCost = tickets.reduce((sum, t) => sum + (t.totalCost || 0), 0);
  const completedCount = tickets.filter(t => t.status === 'completed').length;

  const reportCards = [
    {
      id: 'report',
      title: 'ส่งสรุปรายงานประจำวันผ่าน Gmail',
      subtitle: 'Daily Maintenance Summary Email Report',
      description: 'ส่งสรุปรายงานการซ่อมบำรุงประจำวันเข้ากล่องจดหมาย Gmail ของผู้บริหารและหัวหน้าแผนก พร้อมแนบไฟล์ Excel (.xlsx) และ PDF (.pdf) อัตโนมัติ',
      icon: Mail,
      badge: 'Gmail & Attachments',
      color: 'from-amber-500 to-orange-600',
      iconBg: 'bg-amber-100 text-amber-700',
      stats: `ผู้รับ: ${settings.emailRecipients?.length || 1} อีเมล • ส่งอัตโนมัติ ${settings.dailyReportScheduleTime || '18:00'} น.`,
      btnText: 'เปิดหน้าส่งรายงาน Gmail'
    },
    {
      id: 'analytics',
      title: 'รายงานวิเคราะห์การแจ้งซ่อมและงานบำรุงรักษา',
      subtitle: 'Executive Analytics & Insights',
      description: 'วิเคราะห์สถิติความถี่ของปัญหาแต่ละหมวดหมู่งาน ประสิทธิภาพความเร็วในการแก้ไขของช่าง และ Export ข้อมูลเป็น Excel (.xlsx) / PDF (.pdf)',
      icon: BarChart3,
      badge: 'Data & Charts',
      color: 'from-blue-600 to-indigo-700',
      iconBg: 'bg-blue-100 text-blue-700',
      stats: `วิเคราะห์งานทั้งหมด ${tickets.length} รายการ • อัตราปิดงาน ${tickets.length > 0 ? Math.round((completedCount / tickets.length) * 100) : 0}%`,
      btnText: 'เปิดรายงานวิเคราะห์ & Export'
    },
    {
      id: 'accounting_cost',
      title: 'บันทึก & รายงานค่าใช้จ่ายซ่อมแซมฝ่ายบัญชี',
      subtitle: 'Maintenance Cost Accounting Ledger',
      description: 'สมุดรายวันบันทึกค่าอะไหล่ ค่าแรงช่าง ค่าจ้างผู้รับเหมา เลขที่ใบเสร็จรับเงิน และสถานะทางบัญชี พร้อมส่งออกสมุดบัญชี Excel และใบสรุป PDF',
      icon: DollarSign,
      badge: 'Accounting & Ledger',
      color: 'from-emerald-600 to-teal-700',
      iconBg: 'bg-emerald-100 text-emerald-700',
      stats: `ยอดค่าใช้จ่ายสะสม ฿${totalCost.toLocaleString()} • ตรวจสอบบิลและใบสำคัญจ่าย`,
      btnText: 'เปิดสมุดบัญชีค่าใช้จ่าย'
    },
    {
      id: 'excel',
      title: 'นำเข้าข้อมูลห้องพัก Excel ย้อนหลัง',
      subtitle: 'Historical Room Maintenance Excel Import',
      description: 'อัปโหลดไฟล์ประวัติการซ่อมบำรุงห้องพักในอดีต (.xlsx / .csv) เพื่อรวมข้อมูลเข้าสู่ฐานข้อมูลระบบและซิงค์ขึ้น Google Sheets ทันที',
      icon: FileSpreadsheet,
      badge: 'Batch Data Import',
      color: 'from-purple-600 to-indigo-700',
      iconBg: 'bg-purple-100 text-purple-700',
      stats: 'รองรับไฟล์ Excel และ CSV พร้อม Preview ก่อนนำเข้า',
      btnText: 'เปิดหน้านำเข้าข้อมูล Excel'
    }
  ];

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-sky-800 via-blue-900 to-indigo-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-blue-700/30">
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center space-x-2 px-3 py-1 bg-white/15 rounded-full text-xs font-medium text-sky-100 backdrop-blur-md mb-1 border border-white/10">
            <BarChart3 className="w-3.5 h-3.5 text-sky-300" />
            <span>{settings.hotelName} • ศูนย์รวมรายงานและการส่งออกข้อมูล</span>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white">
            หน้ารายงานและการวิเคราะห์ (Reports Hub)
          </h1>
          <p className="text-xs sm:text-sm text-sky-100 max-w-2xl leading-relaxed">
            เลือกเมนูรายงานที่ต้องการ: ส่งสรุปรายงานประจำวันผ่าน Gmail พร้อมแนบไฟล์ Excel & PDF, วิเคราะห์สถิติงานซ่อมบำรุง, สมุดบัญชีค่าใช้จ่าย, หรือนำเข้าข้อมูลห้องพักย้อนหลัง
          </p>
        </div>
      </div>

      {/* Grid of the 4 Reports */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {reportCards.map((report) => {
          const Icon = report.icon;
          return (
            <div
              key={report.id}
              onClick={() => setActiveTab(report.id)}
              className="bg-white rounded-3xl p-6 border border-sky-100 shadow-2xs hover:shadow-xl hover:border-sky-300 transition-all duration-200 flex flex-col justify-between group cursor-pointer"
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${report.iconBg} shadow-sm group-hover:scale-110 transition-transform`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="px-2.5 py-1 text-[11px] font-bold rounded-full bg-slate-100 text-slate-700 group-hover:bg-sky-100 group-hover:text-blue-800 transition-colors">
                    {report.badge}
                  </span>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-700 transition-colors leading-snug">
                    {report.title}
                  </h3>
                  <p className="text-[11px] font-semibold text-slate-400 mt-0.5 font-mono">{report.subtitle}</p>
                  <p className="text-xs text-slate-600 mt-2.5 leading-relaxed">
                    {report.description}
                  </p>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 space-y-3">
                <div className="text-[11px] text-slate-500 font-medium flex items-center space-x-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>{report.stats}</span>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveTab(report.id);
                  }}
                  className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-gradient-to-r ${report.color} shadow-sm group-hover:shadow-md flex items-center justify-center space-x-2 transition-all cursor-pointer`}
                >
                  <span>{report.btnText}</span>
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

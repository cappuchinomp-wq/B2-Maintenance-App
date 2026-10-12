import React, { useState } from 'react';
import { useMaintenance } from '../context/MaintenanceContext';
import { 
  sendDailyReportEmail, 
  generateDailyExcelFile, 
  generateDailyPdfFile, 
  buildReportHtmlEmail 
} from '../services/gmailReport';
import { 
  Mail, 
  Send, 
  FileSpreadsheet, 
  FileText, 
  Calendar, 
  CheckCircle2, 
  AlertCircle, 
  Plus, 
  Trash2, 
  Download, 
  Eye, 
  Sparkles,
  DollarSign,
  Clock,
  Bell,
  AlertTriangle,
  Check
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { LineNotifyModal } from '../components/LineNotifyModal';

export const DailyReportView: React.FC = () => {
  const { tickets, settings, updateSettings, currentUser, isAuthenticated, loginWithGoogle } = useMaintenance();
  const [isLineModalOpen, setIsLineModalOpen] = useState(false);

  const [reportDate, setReportDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [recipientEmails, setRecipientEmails] = useState<string[]>(settings.emailRecipients || ['b2suphanburi@bookingb2hotel.com']);
  const [newEmailInput, setNewEmailInput] = useState<string>('');
  const [reportNotes, setReportNotes] = useState<string>('สรุปรายงานการซ่อมบำรุงประจำวัน ตรวจสอบเรียบร้อยทุกรายการ');
  const [isSending, setIsSending] = useState<boolean>(false);
  const [sendResult, setSendResult] = useState<{ success: boolean; message: string } | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);

  // Automated Schedule Settings (Images 1 & 2)
  const [autoDailyReportEnabled, setAutoDailyReportEnabled] = useState<boolean>(settings.autoDailyReportEnabled ?? true);
  const [dailyReportScheduleTime, setDailyReportScheduleTime] = useState<string>(settings.dailyReportScheduleTime || '18:00');
  const [scheduleSaveSuccess, setScheduleSaveSuccess] = useState<boolean>(false);

  // Filter tickets for this date or all active
  const selectedDateTickets = tickets.filter(t => t.createdAt.startsWith(reportDate) || t.updatedAt.startsWith(reportDate));
  const displayTickets = selectedDateTickets.length > 0 ? selectedDateTickets : tickets.slice(0, 8);

  const completedCount = displayTickets.filter(t => t.status === 'completed').length;
  const inProgressCount = displayTickets.filter(t => t.status === 'in_progress').length;
  const pendingCount = displayTickets.filter(t => t.status === 'pending').length;
  const criticalCount = displayTickets.filter(t => t.urgency === 'Critical' || t.urgency === 'High').length;
  const totalCost = displayTickets.reduce((sum, t) => sum + (t.totalCost || 0), 0);

  const handleAddEmail = () => {
    if (!newEmailInput.trim() || !newEmailInput.includes('@')) return;
    const updated = [...recipientEmails, newEmailInput.trim()];
    setRecipientEmails(updated);
    updateSettings({ emailRecipients: updated });
    setNewEmailInput('');
  };

  const handleRemoveEmail = (idx: number) => {
    const updated = recipientEmails.filter((_, i) => i !== idx);
    setRecipientEmails(updated);
    updateSettings({ emailRecipients: updated });
  };

  // Direct Excel Download
  const handleDownloadExcel = () => {
    const { blob } = generateDailyExcelFile(displayTickets, reportDate, settings.hotelName);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Hotel_Maintenance_Report_${reportDate}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Direct PDF Download
  const handleDownloadPdf = () => {
    const { blob } = generateDailyPdfFile(displayTickets, reportDate, settings.hotelName);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Hotel_Maintenance_Report_${reportDate}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Send Email via Gmail API
  const handleSendEmail = async () => {
    setShowConfirmModal(false);
    setIsSending(true);
    setSendResult(null);

    try {
      const res = await sendDailyReportEmail({
        recipientEmails,
        reportDate,
        hotelName: settings.hotelName,
        tickets: displayTickets,
        notes: reportNotes,
        senderName: currentUser?.displayName || 'ผู้จัดการโรงแรม'
      });

      if (res.success) {
        confetti({
          particleCount: 100,
          spread: 80,
          origin: { y: 0.6 }
        });
        setSendResult({
          success: true,
          message: `ส่งรายงานสรุปประจำวันพร้อมแนบไฟล์ Excel (.xlsx) และ PDF (.pdf) ผ่าน Gmail ไปยัง ${recipientEmails.join(', ')} เรียบร้อยแล้ว!`
        });
      } else {
        setSendResult({
          success: false,
          message: res.error || 'ไม่สามารถส่งอีเมลได้ ตรวจสอบการเข้าสู่ระบบ Google'
        });
      }
    } catch (e: any) {
      setSendResult({
        success: false,
        message: e.message || 'เกิดข้อผิดพลาดในการส่งอีเมล'
      });
    } finally {
      setIsSending(false);
    }
  };

  // Save auto schedule
  const handleSaveAutoSchedule = () => {
    updateSettings({
      autoDailyReportEnabled,
      dailyReportScheduleTime,
      emailRecipients: recipientEmails
    });
    setScheduleSaveSuccess(true);
    setTimeout(() => setScheduleSaveSuccess(false), 3000);
  };

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-sky-700 rounded-3xl p-6 sm:p-8 text-white shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="px-2.5 py-1 text-xs font-semibold bg-white/20 rounded-full backdrop-blur-xs text-sky-100 uppercase tracking-wider">
              Automated Daily Reporting • Gmail API
            </span>
            <h2 className="text-2xl font-bold mt-2">ส่งสรุปรายงานการซ่อมประจำวันผ่านอีเมล</h2>
            <p className="text-xs sm:text-sm text-sky-100 mt-1 max-w-2xl">
              ส่งอีเมลสรุปสถิติผลการซ่อมแซม พร้อมแนบไฟล์รายละเอียด <strong>Excel (.xlsx)</strong> และ <strong>PDF (.pdf)</strong> อัตโนมัติ
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5">
            <button
              onClick={() => setIsLineModalOpen(true)}
              className="px-4 py-2 bg-[#06C755] hover:bg-[#05a847] text-white rounded-xl text-xs sm:text-sm font-semibold shadow-xs flex items-center space-x-1.5 transition-all cursor-pointer"
              title="ส่งรายงานสรุปงานซ่อมประจำวันเข้ากลุ่ม LINE"
            >
              <Send className="w-4 h-4" />
              <span>ส่งสรุปเข้า LINE</span>
            </button>
            <button
              onClick={handleDownloadExcel}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-xs flex items-center space-x-1.5 transition-colors cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>ดาวน์โหลด Excel</span>
            </button>
            <button
              onClick={handleDownloadPdf}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-xs flex items-center space-x-1.5 transition-colors cursor-pointer"
            >
              <FileText className="w-4 h-4" />
              <span>ดาวน์โหลด PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* AUTOMATED GMAIL SCHEDULE CARD (Matching User Images 1 & 2) */}
      <div className="bg-white rounded-3xl p-6 border border-sky-100 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-600 text-white flex items-center justify-center shadow-xs">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900">
                ตั้งเวลาส่งสรุปรายงานประจำวันทาง Gmail อัตโนมัติ (Automated Schedule)
              </h3>
              <p className="text-xs text-slate-500">
                ระบบจะสร้างไฟล์ Excel และ PDF สรุปยอดประมวลผลและส่งตรงเข้ากล่องจดหมายผู้รับทุกวันตามเวลาที่กำหนด
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={autoDailyReportEnabled}
                onChange={(e) => setAutoDailyReportEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
            </label>
            <span className="text-xs font-bold text-purple-900">
              {autoDailyReportEnabled ? 'เปิดอัตโนมัติ' : 'ปิด'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-1">
          {/* Time Picker */}
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
            <span className="font-medium text-slate-700">เวลาที่ระบบจะสร้างและส่งรายงาน:</span>
            <div className="flex items-center space-x-2">
              <input
                type="time"
                value={dailyReportScheduleTime}
                onChange={(e) => setDailyReportScheduleTime(e.target.value)}
                className="px-3 py-1.5 bg-white border border-slate-300 rounded-xl font-mono font-bold text-slate-800 shadow-2xs"
              />
              <span className="text-slate-500">น.</span>
            </div>
          </div>

          {/* Save Schedule Button */}
          <div className="flex items-center justify-end space-x-2">
            {scheduleSaveSuccess && (
              <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                <Check className="w-4 h-4" /> บันทึกเวลาแล้ว
              </span>
            )}
            <button
              type="button"
              onClick={handleSaveAutoSchedule}
              className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              บันทึกการตั้งค่าเวลาส่ง
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Modal Before Sending Email */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-sky-100 animate-in zoom-in-95">
            <div className="w-14 h-14 bg-blue-50 text-blue-700 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-blue-200">
              <Mail className="w-7 h-7" />
            </div>

            <h3 className="text-xl font-bold text-slate-900 text-center">ยืนยันการส่งอีเมลรายงานสรุป?</h3>
            <p className="text-xs text-slate-600 mt-2 text-center leading-relaxed">
              ระบบจะทำการส่งอีเมลผ่านบัญชี Gmail ของคุณ พร้อมแนบไฟล์รายงาน <strong>Excel (.xlsx)</strong> และ <strong>PDF (.pdf)</strong>
            </p>

            <div className="mt-4 p-4 bg-sky-50 rounded-2xl text-xs space-y-1.5 text-slate-700 border border-sky-100">
              <div><strong>ประจำวันที่:</strong> {reportDate}</div>
              <div><strong>จำนวนรายการ:</strong> {displayTickets.length} รายการ</div>
              <div><strong>ผู้รับ ({recipientEmails.length} ท่าน):</strong> {recipientEmails.join(', ')}</div>
              <div><strong>ไฟล์แนบ:</strong> Hotel_Maintenance_Report_{reportDate.replace(/-/g, '')}.xlsx, Hotel_Maintenance_Report_{reportDate.replace(/-/g, '')}.pdf</div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={handleSendEmail}
                className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md transition-colors cursor-pointer"
              >
                ยืนยันและส่งอีเมลทันที
              </button>
              <button
                onClick={() => setShowConfirmModal(false)}
                className="py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs sm:text-sm font-semibold rounded-xl transition-colors cursor-pointer"
              >
                ยกเลิก
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Form & Live Preview Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Form Controls */}
        <div className="bg-white rounded-3xl p-6 border border-sky-100 shadow-2xs space-y-5">
          <h3 className="font-bold text-base text-slate-900 pb-3 border-b border-slate-100">
            ตั้งค่ารายงานและผู้รับอีเมล
          </h3>

          {/* Date Picker */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              <span>เลือกวันที่ต้องการสรุปรายงาน</span>
            </label>
            <input
              type="date"
              value={reportDate}
              onChange={(e) => setReportDate(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:bg-white"
            />
          </div>

          {/* Recipient Emails */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">
              รายชื่ออีเมลผู้รับรายงาน (GM, HM, Owner, บัญชี)
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="email"
                placeholder="ระบุอีเมล เช่น gm@hotel.com"
                value={newEmailInput}
                onChange={(e) => setNewEmailInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddEmail())}
                className="flex-1 px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs"
              />
              <button
                type="button"
                onClick={handleAddEmail}
                className="px-3 py-2 bg-sky-600 text-white rounded-xl text-xs font-semibold cursor-pointer"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1.5 max-h-36 overflow-y-auto">
              {recipientEmails.map((email, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 bg-slate-50 rounded-xl text-xs text-slate-700 border border-slate-200">
                  <span className="truncate">{email}</span>
                  {recipientEmails.length > 1 && (
                    <button onClick={() => handleRemoveEmail(idx)} className="text-red-500 p-1 cursor-pointer">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">
              ข้อความบันทึกเพิ่มเติมในอีเมล
            </label>
            <textarea
              rows={3}
              value={reportNotes}
              onChange={(e) => setReportNotes(e.target.value)}
              placeholder="หมายเหตุเพิ่มเติมสำหรับผู้บริหาร..."
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:bg-white"
            />
          </div>

          {/* Send Button */}
          <div className="pt-2">
            <button
              onClick={() => setShowConfirmModal(true)}
              disabled={isSending || recipientEmails.length === 0}
              className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white text-sm font-bold shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
            >
              {isSending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>กำลังสร้างไฟล์แนบ & ส่งผ่าน Gmail...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>ส่งสรุปรายงานประจำวัน (Gmail)</span>
                </>
              )}
            </button>
          </div>

          {sendResult && (
            <div className={`p-4 rounded-2xl text-xs font-semibold flex items-start space-x-2 ${
              sendResult.success ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'
            }`}>
              {sendResult.success ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" /> : <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />}
              <span className="leading-relaxed">{sendResult.message}</span>
            </div>
          )}
        </div>

        {/* Right 2 Columns: Live Email & Report Preview */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-sky-100 shadow-2xs space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <span>ตัวอย่างรายงานในอีเมล (Live Email Preview)</span>
                <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-md font-semibold">
                  HTML + Excel + PDF
                </span>
              </h3>
              <p className="text-xs text-slate-500">หน้าตาของอีเมลที่ผู้บริหารจะได้รับทาง Gmail</p>
            </div>
            <div className="text-xs font-mono text-slate-400">
              {displayTickets.length} รายการ
            </div>
          </div>

          {/* Simulated Email Envelope */}
          <div className="border border-slate-200 rounded-2xl p-5 bg-slate-50/50 space-y-4">
            {/* Header info */}
            <div className="space-y-1 text-xs text-slate-600 pb-3 border-b border-slate-200">
              <div><strong className="text-slate-800">จาก:</strong> {currentUser?.displayName || 'Hotel System'} &lt;b2suphanburi@bookingb2hotel.com&gt;</div>
              <div><strong className="text-slate-800">ถึง:</strong> {recipientEmails.join(', ')}</div>
              <div><strong className="text-slate-800">หัวข้อ:</strong> [รายงานประจำวัน {reportDate}] สรุปงานแจ้งซ่อมและบำรุงรักษาโรงแรม - {settings.hotelName}</div>
            </div>

            {/* Email Body Preview */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4 text-xs">
              <div className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white p-4 rounded-xl">
                <h4 className="font-bold text-sm">{settings.hotelName} • สรุปรายงานการซ่อมบำรุงประจำวัน</h4>
                <p className="text-[11px] text-sky-200 mt-0.5">ประจำวันที่ {reportDate}</p>
              </div>

              {/* KPI Badges */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-400 block">งานทั้งหมด</span>
                  <span className="text-base font-bold text-slate-800">{displayTickets.length}</span>
                </div>
                <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-200">
                  <span className="text-[10px] text-emerald-600 block">เสร็จสิ้นแล้ว</span>
                  <span className="text-base font-bold text-emerald-700">{completedCount}</span>
                </div>
                <div className="p-2.5 bg-sky-50 rounded-xl border border-sky-200">
                  <span className="text-[10px] text-sky-600 block">กำลังดำเนินการ</span>
                  <span className="text-base font-bold text-sky-700">{inProgressCount}</span>
                </div>
                <div className="p-2.5 bg-red-50 rounded-xl border border-red-200">
                  <span className="text-[10px] text-red-600 block">ด่วนวิกฤต</span>
                  <span className="text-base font-bold text-red-700">{criticalCount}</span>
                </div>
              </div>

              {/* Cost summary */}
              <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl flex items-center justify-between text-xs text-emerald-900 font-semibold">
                <span>ยอดค่าใช้จ่ายซ่อมแซมวันนี้:</span>
                <span className="text-sm font-bold text-emerald-700">฿{totalCost.toLocaleString()}</span>
              </div>

              {/* Attachments Banner */}
              <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl flex items-center justify-between">
                <div className="flex items-center space-x-2 text-xs text-amber-900 font-medium">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  <span>แนบไฟล์อัตโนมัติ:</span>
                  <span className="font-mono text-[11px] bg-white px-2 py-0.5 rounded border border-amber-300">
                    .xlsx (Excel)
                  </span>
                  <span className="font-mono text-[11px] bg-white px-2 py-0.5 rounded border border-amber-300">
                    .pdf (PDF)
                  </span>
                </div>
              </div>

              {/* Table preview */}
              <div className="overflow-x-auto pt-2">
                <table className="w-full text-left text-[11px]">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500">
                      <th className="pb-1 font-semibold">รหัส</th>
                      <th className="pb-1 font-semibold">ห้อง/พื้นที่</th>
                      <th className="pb-1 font-semibold">ประเภท</th>
                      <th className="pb-1 font-semibold">ความด่วน</th>
                      <th className="pb-1 font-semibold">สถานะ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {displayTickets.slice(0, 5).map(t => (
                      <tr key={t.id}>
                        <td className="py-1.5 font-bold font-mono text-slate-800">{t.id}</td>
                        <td className="py-1.5">{t.area} ({t.roomNumber})</td>
                        <td className="py-1.5">{t.category}</td>
                        <td className="py-1.5">{t.urgency}</td>
                        <td className="py-1.5 font-medium">{t.status === 'completed' ? 'เสร็จสิ้น' : t.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Manual LINE Trigger Modal */}
      <LineNotifyModal 
        isOpen={isLineModalOpen} 
        onClose={() => setIsLineModalOpen(false)} 
        defaultType="daily_summary"
      />
    </div>
  );
};

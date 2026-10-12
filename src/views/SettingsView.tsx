import React, { useState } from 'react';
import { useMaintenance } from '../context/MaintenanceContext';
import { createHotelSpreadsheet, syncAllTicketsToGoogleSheet } from '../services/googleSheets';
import { sendLinePushMessage, sendLineNotification, formatLineMessage, formatDailySummaryLineMessage } from '../services/lineMessaging';
import { sendDailyReportEmail } from '../services/gmailReport';
import { LineNotifyModal } from '../components/LineNotifyModal';
import { FIXED_DEFAULT_LINE_TARGET_ID, FIXED_DEFAULT_LINE_TOKEN } from '../data/mockData';
import { 
  Settings, 
  FileSpreadsheet, 
  Bell, 
  Shield, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  ExternalLink, 
  Key, 
  Building, 
  Send, 
  Sparkles,
  Database,
  Lock,
  Mail,
  FileText,
  Clock,
  Trash2,
  Plus,
  Users,
  Check,
  X,
  AlertTriangle,
  UserCheck,
  Target,
  Smartphone,
  RotateCcw,
  BadgeCheck,
  Unlock
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { UserRole, Department } from '../types/maintenance';

export const SettingsView: React.FC = () => {
  const { 
    settings, 
    updateSettings, 
    syncGoogleSheets, 
    isSyncing, 
    syncStatus, 
    tickets, 
    currentUser,
    setCurrentUserRole,
    isAuthenticated, 
    loginWithGoogle,
    setActiveTab
  } = useMaintenance();

  const [hotelName, setHotelName] = useState(settings.hotelName);
  const [spreadsheetId, setSpreadsheetId] = useState(settings.spreadsheetId);
  const [sheetName, setSheetName] = useState(settings.sheetName || 'Maintenance_Tickets');
  const [lineChannelToken, setLineChannelToken] = useState(settings.lineChannelAccessToken || settings.lineNotifyToken || '');
  const [lineTargetId, setLineTargetId] = useState(settings.lineTargetId || '');
  const [isLineLocked, setIsLineLocked] = useState<boolean>(settings.isLineLocked ?? true);
  const [autoSync, setAutoSync] = useState(settings.autoSync);

  // LINE Automation Settings
  const [lineAutoNotifyNewTicket, setLineAutoNotifyNewTicket] = useState<boolean>(settings.lineAutoNotifyNewTicket ?? true);
  const [lineAutoNotifyStatusChange, setLineAutoNotifyStatusChange] = useState<boolean>(settings.lineAutoNotifyStatusChange ?? true);
  const [lineAutoNotifyInspection, setLineAutoNotifyInspection] = useState<boolean>(settings.lineAutoNotifyInspection ?? true);
  const [lineAutoNotifyDailyReport, setLineAutoNotifyDailyReport] = useState<boolean>(settings.lineAutoNotifyDailyReport ?? true);
  const [isLineModalOpen, setIsLineModalOpen] = useState<boolean>(false);

  // Email System Settings (Images 1 & 2)
  const [emailSystemEnabled, setEmailSystemEnabled] = useState<boolean>(settings.emailSystemEnabled ?? true);
  const [autoDailyReportEnabled, setAutoDailyReportEnabled] = useState<boolean>(settings.autoDailyReportEnabled ?? true);
  const [dailyReportScheduleTime, setDailyReportScheduleTime] = useState<string>(settings.dailyReportScheduleTime || '18:00');
  const [emailRecipients, setEmailRecipients] = useState<string[]>(settings.emailRecipients || ['b2suphanburi@bookingb2hotel.com']);
  const [newEmailInput, setNewEmailInput] = useState<string>('');
  const [includeExcelAttachment, setIncludeExcelAttachment] = useState<boolean>(settings.includeExcelAttachment ?? true);
  const [includePdfAttachment, setIncludePdfAttachment] = useState<boolean>(settings.includePdfAttachment ?? true);

  const [isCreatingSheet, setIsCreatingSheet] = useState(false);
  const [testLineStatus, setTestLineStatus] = useState<{ success?: boolean; message?: string } | null>(null);
  const [testEmailStatus, setTestEmailStatus] = useState<{ success?: boolean; message?: string } | null>(null);
  const [isSendingTestEmail, setIsSendingTestEmail] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [roleSwitchMessage, setRoleSwitchMessage] = useState<string | null>(null);

  // Add recipient email
  const handleAddEmail = () => {
    if (!newEmailInput.trim() || !newEmailInput.includes('@')) return;
    const updated = [...emailRecipients, newEmailInput.trim()];
    setEmailRecipients(updated);
    updateSettings({ emailRecipients: updated });
    setNewEmailInput('');
  };

  // Remove recipient email
  const handleRemoveEmail = (idx: number) => {
    const updated = emailRecipients.filter((_, i) => i !== idx);
    setEmailRecipients(updated);
    updateSettings({ emailRecipients: updated });
  };

  // Send Test Daily Report Email immediately
  const handleSendTestDailyReport = async () => {
    if (emailRecipients.length === 0) {
      setTestEmailStatus({ success: false, message: 'กรุณาระบุอีเมลผู้รับอย่างน้อย 1 อีเมล' });
      return;
    }
    setIsSendingTestEmail(true);
    setTestEmailStatus({ message: 'กำลังสร้างและส่งรายงานผ่าน Gmail API...' });

    try {
      const today = new Date().toISOString().slice(0, 10);
      const res = await sendDailyReportEmail({
        recipientEmails: emailRecipients,
        reportDate: today,
        hotelName,
        tickets,
        notes: 'ทดสอบการส่งสรุปรายงานประจำวันอัตโนมัติ พร้อมแนบไฟล์ Excel และ PDF',
        senderName: currentUser?.displayName || 'ผู้จัดการโรงแรม'
      });

      if (res.success) {
        confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
        setTestEmailStatus({ success: true, message: `ส่งสรุปรายงานประจำวันเข้าอีเมล (${emailRecipients.join(', ')}) เรียบร้อยแล้ว!` });
      } else {
        setTestEmailStatus({ success: false, message: res.error || 'ส่งอีเมลไม่สำเร็จ' });
      }
    } catch (e: any) {
      setTestEmailStatus({ success: false, message: e.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อ Gmail' });
    } finally {
      setIsSendingTestEmail(false);
    }
  };

  // Send Critical Alert test email
  const handleSendCriticalAlertTest = async () => {
    if (emailRecipients.length === 0) {
      setTestEmailStatus({ success: false, message: 'กรุณาระบุอีเมลผู้รับอย่างน้อย 1 อีเมล' });
      return;
    }
    setIsSendingTestEmail(true);
    setTestEmailStatus({ message: 'กำลังส่งอีเมลแจ้งเตือนงานด่วนวิกฤต...' });

    try {
      const criticals = tickets.filter(t => t.urgency === 'Critical' || t.urgency === 'High');
      const sample = criticals.length > 0 ? criticals : tickets.slice(0, 2);
      const today = new Date().toISOString().slice(0, 10);

      const res = await sendDailyReportEmail({
        recipientEmails: emailRecipients,
        reportDate: today,
        hotelName,
        tickets: sample,
        notes: '🚨 แจ้งเตือนด่วน: รายการงานซ่อมเร่งด่วนที่ต้องดำเนินการทันที',
        senderName: 'ระบบแจ้งเตือนฉุกเฉิน'
      });

      if (res.success) {
        setTestEmailStatus({ success: true, message: `ส่งอีเมลแจ้งเตือนงานด่วนวิกฤต (${sample.length} รายการ) สำเร็จ!` });
      } else {
        setTestEmailStatus({ success: false, message: res.error || 'ส่งอีเมลไม่สำเร็จ' });
      }
    } catch (e: any) {
      setTestEmailStatus({ success: false, message: e.message || 'เกิดข้อผิดพลาด' });
    } finally {
      setIsSendingTestEmail(false);
    }
  };

  // Save Settings
  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      hotelName: hotelName.trim(),
      spreadsheetId: spreadsheetId.trim(),
      sheetName: sheetName.trim(),
      lineChannelAccessToken: lineChannelToken.trim(),
      lineTargetId: lineTargetId.trim(),
      lineNotifyToken: lineChannelToken.trim(),
      isLineLocked,
      lineAutoNotifyNewTicket,
      lineAutoNotifyStatusChange,
      lineAutoNotifyInspection,
      lineAutoNotifyDailyReport,
      autoSync,
      emailSystemEnabled,
      autoDailyReportEnabled,
      dailyReportScheduleTime,
      emailRecipients,
      includeExcelAttachment,
      includePdfAttachment
    });

    setSaveMessage('บันทึกการตั้งค่าทั้งหมดเรียบร้อยแล้ว');
    setTimeout(() => setSaveMessage(null), 3500);
  };

  // Test LINE Messaging API Push Message
  const handleTestLineNotify = async () => {
    if (!lineChannelToken.trim()) {
      setTestLineStatus({ success: false, message: 'กรุณากรอก LINE Channel Access Token ก่อนทดสอบ' });
      return;
    }

    if (!lineTargetId.trim()) {
      setTestLineStatus({ success: false, message: 'กรุณากรอก LINE Target ID (User ID หรือ Group ID) เพื่อให้ระบบส่งข้อมูลไปแค่ที่เดียว' });
      return;
    }

    setTestLineStatus({ message: 'กำลังส่งข้อความทดสอบผ่าน LINE Messaging API...' });
    const sampleTicket = tickets[0] || {
      id: 'TK-TEST-001',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      area: 'ห้องพัก',
      roomNumber: '304',
      department: 'พนักงานต้อนรับ (GSA)',
      category: 'แอร์',
      urgency: 'Critical',
      description: 'ทดสอบระบบแจ้งเตือน Real-time ผ่าน LINE Messaging API',
      reporterName: 'ผู้ดูแลระบบ',
      reporterPhone: '0812345678',
      status: 'pending',
      images: [],
      historyLogs: []
    };

    const msg = formatLineMessage('new_ticket', sampleTicket as any);
    const res = await sendLinePushMessage(lineChannelToken.trim(), lineTargetId.trim(), msg);

    if (res.success) {
      setTestLineStatus({ success: true, message: res.message || `ส่งข้อความแจ้งเตือนทดสอบไปยัง (${lineTargetId.trim()}) เรียบร้อยแล้ว!` });
      confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
    } else {
      setTestLineStatus({ success: false, message: res.message || 'ส่งไม่สำเร็จ ตรวจสอบ Channel Access Token และ Target ID' });
    }
  };

  // Detailed RBAC Matrix Definitions (Requirement 4)
  const rolePermissionsMatrix = [
    {
      role: 'admin' as UserRole,
      title: 'ผู้จัดการโรงแรม / Admin (Hotel Manager)',
      badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      description: 'ผู้มีอำนาจตัดสินใจสูงสุด ควบคุมดูแลภาพรวมการบริหารงานและบำรุงรักษาอาคารทั้งหมด',
      capabilities: [
        { name: 'เปิดใบแจ้งซ่อมทุกพื้นที่', status: 'full' },
        { name: 'มอบหมายงาน & จัดคิวช่าง', status: 'full' },
        { name: 'ตรวจรับงาน & อนุมัติปิดจ็อบ', status: 'full' },
        { name: 'ส่งสรุปรายงาน Gmail & ตั้งเวลา', status: 'full' },
        { name: 'Export บัญชี & อนุมัติค่าใช้จ่าย', status: 'full' },
        { name: 'ตั้งค่าระบบ Google Sheets & LINE', status: 'full' },
        { name: 'จัดการสิทธิ์ผู้ใช้งานทั้งหมด', status: 'full' }
      ]
    },
    {
      role: 'technician' as UserRole,
      title: 'ช่างอาคาร / หัวหน้าช่าง (Technicians)',
      badgeColor: 'bg-sky-100 text-sky-800 border-sky-200',
      description: 'ฝ่ายวิศวกรรมและซ่อมบำรุง รับผิดชอบเข้าหน้างาน ซ่อมแซม บันทึกอะไหล่ และส่งตรวจรับงาน',
      capabilities: [
        { name: 'เปิดใบแจ้งซ่อมจุดเกิดเหตุ', status: 'full' },
        { name: 'กดรับงาน & รายงานสถานะซ่อม', status: 'full' },
        { name: 'บันทึกวิธีซ่อม & เบิกอะไหล่', status: 'full' },
        { name: 'อัปโหลดรูปผลงานหลังซ่อมเสร็จ', status: 'full' },
        { name: 'ตรวจรับงานของตนเอง', status: 'none' },
        { name: 'ดูผังสถานะห้องพัก & ประวัติซ่อม', status: 'full' },
        { name: 'เข้าถึงการตั้งค่าระบบหลัก', status: 'none' }
      ]
    },
    {
      role: 'gsa' as UserRole,
      title: 'พนักงานต้อนรับส่วนหน้า (GSA - Front Desk)',
      badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      description: 'ด่านหน้าต้อนรับแขก รับเรื่องร้องเรียนจากผู้เข้าพัก เปิดใบแจ้งซ่อมด่วน และตรวจรับความพร้อมห้องพัก',
      capabilities: [
        { name: 'เปิดใบแจ้งซ่อมด่วนห้องพัก & ลอบบี้', status: 'full' },
        { name: 'ติดตามสถานะงานซ่อมแบบเรียลไทม์', status: 'full' },
        { name: 'ตรวจรับงานซ่อมห้องก่อนปล่อยขาย', status: 'full' },
        { name: 'ดูผังสถานะห้องพักทั้ง 126 ห้อง', status: 'full' },
        { name: 'โทรติดต่อช่างประจำเวรด่วน', status: 'full' },
        { name: 'แก้ไขบันทึกค่าใช้จ่ายทางบัญชี', status: 'none' },
        { name: 'แก้ไขการเชื่อมต่อระบบคลาวด์', status: 'none' }
      ]
    },
    {
      role: 'housekeeping' as UserRole,
      title: 'แผนกแม่บ้าน (Housekeeping)',
      badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
      description: 'ดูแลความสะอาดและความสมบูรณ์ของห้องพักทั้ง 7 ชั้น ตรวจสอบสิ่งชำรุด และตรวจรับงานช่าง',
      capabilities: [
        { name: 'เปิดใบแจ้งซ่อมห้องพักระหว่างทำความสะอาด', status: 'full' },
        { name: 'ตรวจสอบผังสถานะห้องพัก 126 ห้อง', status: 'full' },
        { name: 'ตรวจรับงานช่าง & เช็คลิสต์ความสะอาด', status: 'full' },
        { name: 'ส่งกลับให้ช่างแก้ไขหากยังไม่เรียบร้อย', status: 'full' },
        { name: 'ดูประวัติการซ่อมย้อนหลังของแต่ละห้อง', status: 'full' },
        { name: 'ส่งสรุปรายงานประจำวันเข้า Gmail', status: 'none' },
        { name: 'จัดการตั้งค่าสิทธิ์ผู้ใช้งาน', status: 'none' }
      ]
    },
    {
      role: 'accounting' as UserRole,
      title: 'ฝ่ายบัญชีและการเงิน (Accounting & Finance)',
      badgeColor: 'bg-purple-100 text-purple-800 border-purple-200',
      description: 'ตรวจสอบความถูกต้องของค่าใช้จ่าย ค่าอะไหล่ ค่าแรงช่าง ใบเสร็จ และทำบัญชีปิดงบ',
      capabilities: [
        { name: 'ดูสมุดบัญชีค่าใช้จ่ายซ่อมบำรุง', status: 'full' },
        { name: 'ตรวจสอบเลขที่บิล & ออกใบสำคัญจ่าย', status: 'full' },
        { name: 'Export บัญชีเป็น Excel (.xlsx) และ PDF', status: 'full' },
        { name: 'ดูรายงานวิเคราะห์ต้นทุนการซ่อม', status: 'full' },
        { name: 'ตรวจรับงานซ่อมเชิงเทคนิคหน้างาน', status: 'limited' },
        { name: 'รับงานซ่อมบำรุงของช่าง', status: 'none' },
        { name: 'แก้ไขการตั้งค่า Token', status: 'none' }
      ]
    },
    {
      role: 'security' as UserRole,
      title: 'เจ้าหน้าที่รักษาความปลอดภัย (Security)',
      badgeColor: 'bg-slate-100 text-slate-800 border-slate-200',
      description: 'ตรวจตรารอบอาคาร ลานจอดรถ และพื้นที่ส่วนกลาง แจ้งซ่อมไฟดับ น้ำรั่ว หรือระบบเตือนภัย',
      capabilities: [
        { name: 'แจ้งซ่อมไฟทางเดิน ลานจอดรถ Fire Alarm', status: 'full' },
        { name: 'ติดตามสถานะงานแจ้งซ่อมพื้นที่ส่วนกลาง', status: 'full' },
        { name: 'โทรติดต่อช่างในกรณีฉุกเฉิน 24 ชม.', status: 'full' },
        { name: 'ดูผังสถานะห้องพักส่วนตัวของแขก', status: 'none' },
        { name: 'ดูข้อมูลค่าใช้จ่ายและบัญชี', status: 'none' },
        { name: 'อนุมัติการตรวจรับงานห้องพัก', status: 'none' },
        { name: 'เข้าถึงเมนูตั้งค่าระบบ', status: 'none' }
      ]
    },
    {
      role: 'owner' as UserRole,
      title: 'เจ้าของโรงแรม / ผู้บริหารระดับสูง (Hotel Owner)',
      badgeColor: 'bg-rose-100 text-rose-800 border-rose-200',
      description: 'ติดตามผลการดำเนินงาน คุณภาพการบริการของโรงแรม และงบประมาณค่าซ่อมบำรุงรักษาทรัพย์สิน',
      capabilities: [
        { name: 'ดูแดชบอร์ดภาพรวม & ผังห้องพัก 126 ห้อง', status: 'full' },
        { name: 'รับสรุปรายงานประจำวันทาง Gmail อัตโนมัติ', status: 'full' },
        { name: 'ดูรายงานวิเคราะห์ประสิทธิภาพ & สถิติช่าง', status: 'full' },
        { name: 'ตรวจสอบงบประมาณค่าซ่อมแซมสะสม', status: 'full' },
        { name: 'อนุมัติงานงบประมาณสูงพิเศษ', status: 'full' },
        { name: 'ลงปฏิบัติงานซ่อมหน้างาน', status: 'none' },
        { name: 'ตั้งค่าระบบเชิงลึก', status: 'full' }
      ]
    }
  ];

  return (
    <div className="max-w-6xl mx-auto py-6 px-4 sm:px-6 lg:px-8 space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-800 via-indigo-900 to-blue-950 rounded-3xl p-6 sm:p-8 text-white shadow-md">
        <div className="flex items-center justify-between">
          <div>
            <span className="px-2.5 py-1 text-xs font-semibold bg-white/20 rounded-full backdrop-blur-xs text-sky-200 uppercase tracking-wider">
              System Settings & Cloud Integrations
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold mt-2">การตั้งค่าระบบ & สิทธิ์ผู้ใช้งาน</h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
              จัดการระบบส่งรายงานอัตโนมัติผ่าน Gmail, กำหนดสิทธิ์ผู้ใช้งาน 7 ตำแหน่ง, เชื่อมต่อ Google Sheets และ LINE Notify
            </p>
          </div>
          <div className="hidden sm:flex w-14 h-14 bg-white/10 rounded-2xl items-center justify-center backdrop-blur-md">
            <Settings className="w-7 h-7 text-sky-300" />
          </div>
        </div>
      </div>

      <form onSubmit={handleSaveSettings} className="space-y-6">
        {/* ========================================================================= */}
        {/* SECTION 1: AUTOMATED GMAIL DAILY REPORT SYSTEM (Images 1 & 2) */}
        {/* ========================================================================= */}
        <div className="bg-white rounded-3xl p-6 border border-sky-100 shadow-sm space-y-5">
          {/* Header with Email System Toggle Switch (Image 1) */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-purple-600 text-white flex items-center justify-center shadow-sm">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900">
                  เปิดใช้งานระบบแจ้งเตือนทางอีเมล (Email System)
                </h3>
                <p className="text-xs text-slate-500">
                  เปิดให้ระบบส่งข้อความและสรุปรายงานประจำวันผ่านบัญชี Gmail ที่ได้รับอนุญาต
                </p>
              </div>
            </div>

            {/* Toggle switch as in user image 1 */}
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={emailSystemEnabled}
                onChange={(e) => setEmailSystemEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-14 h-8 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-purple-600 shadow-inner"></div>
            </label>
          </div>

          {/* Email Recipients List & Input (Image 1) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Mail className="w-4 h-4 text-purple-600" />
                <span>รายชื่ออีเมลผู้รับการแจ้งเตือน (ADMIN EMAIL RECIPIENTS)</span>
              </label>
              <span className="text-xs text-slate-500 font-medium">{emailRecipients.length} อีเมล</span>
            </div>

            {/* Chips of existing recipient emails */}
            <div className="flex flex-wrap gap-2">
              {emailRecipients.map((email, idx) => (
                <div
                  key={idx}
                  className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800 shadow-2xs group"
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>{email}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveEmail(idx)}
                    className="p-1 text-slate-400 hover:text-rose-600 rounded-full transition-colors cursor-pointer"
                    title="ลบอีเมล"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {/* Input field + Add button as in user image 1 */}
            <div className="flex gap-2 pt-1">
              <input
                type="email"
                placeholder="ระบุอีเมลผู้ดูแล เช่น admin@company.com"
                value={newEmailInput}
                onChange={(e) => setNewEmailInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddEmail();
                  }
                }}
                className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-2xl text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
              />
              <button
                type="button"
                onClick={handleAddEmail}
                className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-2xl shadow-xs transition-all flex items-center space-x-1.5 cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>+ เพิ่มอีเมล</span>
              </button>
            </div>
          </div>

          {/* Daily Maintenance Summary Report Card with Auto Schedule (Image 2) */}
          <div className="p-4 bg-sky-50/50 rounded-2xl border border-sky-200/80 space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900 leading-snug">
                    รายงานสรุปงานแจ้งซ่อมและงานบำรุงรักษาประจำวัน (Daily Maintenance Summary Report)
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                    สรุปรายการแจ้งซ่อมทั้งหมด, งานค้าง, งานกำลังซ่อม, อัตราปิดงาน, และยอดค่าใช้จ่ายประจำวัน
                  </p>
                </div>
              </div>

              {/* Checkbox enabled */}
              <input
                type="checkbox"
                checked={autoDailyReportEnabled}
                onChange={(e) => setAutoDailyReportEnabled(e.target.checked)}
                className="w-5 h-5 text-blue-600 rounded-md focus:ring-blue-500 cursor-pointer"
              />
            </div>

            {/* Schedule time selector as in Image 2 */}
            <div className="pt-3 border-t border-sky-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <span className="font-medium text-slate-700">
                เวลาที่ระบบจะสร้างและส่งรายงานอัตโนมัติ:
              </span>

              <div className="flex items-center space-x-2">
                <div className="relative">
                  <input
                    type="time"
                    value={dailyReportScheduleTime}
                    onChange={(e) => setDailyReportScheduleTime(e.target.value)}
                    className="px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-800 shadow-2xs focus:ring-2 focus:ring-blue-500"
                  />
                  <Clock className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
                <span className="text-slate-500 text-[11px]">น. ทุกวัน</span>
              </div>
            </div>

            {/* Attachment toggles */}
            <div className="flex flex-wrap items-center gap-4 text-xs pt-1 text-slate-700">
              <label className="flex items-center space-x-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeExcelAttachment}
                  onChange={(e) => setIncludeExcelAttachment(e.target.checked)}
                  className="rounded text-blue-600"
                />
                <span>แนบไฟล์สรุป Excel (.xlsx)</span>
              </label>

              <label className="flex items-center space-x-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includePdfAttachment}
                  onChange={(e) => setIncludePdfAttachment(e.target.checked)}
                  className="rounded text-blue-600"
                />
                <span>แนบไฟล์รายงานทางการ PDF (.pdf)</span>
              </label>
            </div>
          </div>

          {/* Test Buttons Box (Image 2) */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3">
            <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-700">
              <Send className="w-4 h-4 text-purple-600" />
              <span>ส่งอีเมลทดสอบ / ส่งรายงานด่วนทันที</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Orange Button as in Image 2 */}
              <button
                type="button"
                onClick={handleSendCriticalAlertTest}
                disabled={isSendingTestEmail}
                className="py-3 px-4 bg-amber-500 hover:bg-amber-600 active:scale-98 text-white text-xs sm:text-sm font-bold rounded-2xl shadow-sm flex items-center justify-center space-x-2 transition-all cursor-pointer"
              >
                <AlertTriangle className="w-4 h-4" />
                <span>ทดสอบส่งเตือนงานด่วนวิกฤต (Critical Alerts)</span>
              </button>

              {/* Purple Button as in Image 2 */}
              <button
                type="button"
                onClick={handleSendTestDailyReport}
                disabled={isSendingTestEmail}
                className="py-3 px-4 bg-purple-600 hover:bg-purple-700 active:scale-98 text-white text-xs sm:text-sm font-bold rounded-2xl shadow-sm flex items-center justify-center space-x-2 transition-all cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>✉️ ส่งสรุปรายงานประจำวันเข้าอีเมลทันที</span>
              </button>
            </div>

            {testEmailStatus && (
              <div className={`p-3 rounded-xl text-xs font-semibold flex items-center space-x-2 ${
                testEmailStatus.success ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'
              }`}>
                {testEmailStatus.success ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> : <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />}
                <span>{testEmailStatus.message}</span>
              </div>
            )}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SECTION 2: DETAILED ROLE-BASED ACCESS CONTROL (RBAC) (Requirement 4) */}
        {/* ========================================================================= */}
        <div className="bg-white rounded-3xl p-6 border border-sky-100 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
            <div className="flex items-center space-x-2">
              <div className="p-2 rounded-xl bg-indigo-100 text-indigo-700">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900">
                  ระบบกำหนดสิทธิ์การใช้งานอย่างละเอียดตามตำแหน่ง (RBAC Matrix)
                </h3>
                <p className="text-xs text-slate-500">
                  ระบุชัดเจนว่าแต่ละตำแหน่งงานในโรงแรมทำอะไรได้บ้าง พร้อมระบบสลับบทบาทจำลอง
                </p>
              </div>
            </div>

            {/* Current simulated role badge */}
            <div className="flex items-center space-x-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 text-xs">
              <span className="text-slate-500">ตำแหน่งปัจจุบันของคุณ:</span>
              <span className="font-bold text-indigo-900">{currentUser?.department || 'Admin'}</span>
            </div>
          </div>

          {roleSwitchMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{roleSwitchMessage}</span>
            </div>
          )}

          {/* Cards for each of the 7 hotel roles with detailed duties */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {rolePermissionsMatrix.map((item) => (
              <div
                key={item.role}
                className="p-5 rounded-2xl border border-slate-200/90 bg-slate-50/50 hover:bg-white hover:border-indigo-300 hover:shadow-md transition-all space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className={`px-2.5 py-0.5 text-[11px] font-bold rounded-md border ${item.badgeColor}`}>
                      {item.title}
                    </span>
                    <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setCurrentUserRole(item.role, item.title.split(' ')[0] as Department);
                      setRoleSwitchMessage(`สลับบทบาทเป็น "${item.title}" เรียบร้อยแล้ว`);
                      setTimeout(() => setRoleSwitchMessage(null), 4000);
                    }}
                    className="text-[11px] font-bold text-blue-600 hover:text-blue-800 bg-white hover:bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200 transition-colors cursor-pointer shrink-0 ml-2"
                  >
                    สลับบทบาทนี้
                  </button>
                </div>

                {/* Capability Checklist for this role */}
                <div className="pt-2 border-t border-slate-200/60 grid grid-cols-1 gap-1.5 text-xs">
                  {item.capabilities.map((cap, cIdx) => (
                    <div key={cIdx} className="flex items-center justify-between py-1 border-b border-slate-100 last:border-0">
                      <span className="text-slate-700">{cap.name}</span>
                      {cap.status === 'full' ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          <Check className="w-3 h-3" /> มีสิทธิ์
                        </span>
                      ) : cap.status === 'limited' ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                          เฉพาะส่วน
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                          <X className="w-3 h-3" /> ไม่อนุญาต
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SECTION 3: GOOGLE SHEETS & LINE NOTIFY CLOUD INTEGRATIONS */}
        {/* ========================================================================= */}
        <div className="bg-white rounded-3xl p-6 border border-sky-100 shadow-sm space-y-5">
          <div className="flex items-center space-x-2 pb-3 border-b border-slate-100">
            <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
            <div>
              <h3 className="font-bold text-base text-slate-900">การเชื่อมต่อ Google Sheets & ฐานข้อมูล</h3>
              <p className="text-xs text-slate-500">บันทึกประวัติงานแจ้งซ่อมลงตาราง Google Spreadsheet โดยตรง</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                ชื่อโรงแรม (Hotel Name)
              </label>
              <input
                type="text"
                value={hotelName}
                onChange={(e) => setHotelName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Google Spreadsheet ID
              </label>
              <input
                type="text"
                placeholder="ระบุ Spreadsheet ID หรือปล่อยว่างเพื่อสร้างใหม่"
                value={spreadsheetId}
                onChange={(e) => setSpreadsheetId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 font-mono focus:bg-white"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <label className="flex items-center space-x-2 text-xs text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={autoSync}
                onChange={(e) => setAutoSync(e.target.checked)}
                className="rounded text-blue-600"
              />
              <span>ซิงค์ข้อมูลลง Google Sheets อัตโนมัติทุกครั้งเมื่อมีการแจ้งซ่อมหรืออัปเดต</span>
            </label>

            {spreadsheetId && (
              <button
                type="button"
                onClick={() => syncGoogleSheets()}
                disabled={isSyncing}
                className="px-4 py-2 bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 text-xs font-semibold rounded-xl flex items-center space-x-1.5 transition-colors cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-sky-600 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>ซิงค์ข้อมูลเดี๋ยวนี้ ({tickets.length} รายการ)</span>
              </button>
            )}
          </div>

          {/* LINE Messaging API & Single Destination Target ID Section */}
          <div className="pt-4 border-t border-slate-100 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <label className="block text-sm font-bold text-slate-800 flex items-center gap-1.5">
                  <Bell className="w-4 h-4 text-[#06C755]" />
                  <span>ตั้งค่า LINE Messaging API (ส่งข้อความตรงเข้ากลุ่ม/แชทที่ระบุ)</span>
                </label>
                <p className="text-xs text-slate-500 mt-0.5">
                  แทนที่ LINE Notify ที่ปิดตัวลง สามารถระบุ Target ID เพื่อให้ส่งข้อมูลไปแค่ที่เดียว
                </p>
              </div>
              <a
                href="https://developers.line.biz/console/"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-[#05a847] hover:underline flex items-center gap-1 font-semibold shrink-0"
              >
                <span>LINE Developers Console</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            {/* Locked LINE Configuration Banner & Controls */}
            <div className={`p-4 rounded-2xl border transition-all ${
              isLineLocked 
                ? 'bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200 shadow-2xs' 
                : 'bg-amber-50 border-amber-300 shadow-xs'
            }`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    isLineLocked ? 'bg-emerald-600 text-white' : 'bg-amber-500 text-white'
                  }`}>
                    {isLineLocked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-slate-900">
                        {isLineLocked 
                          ? '🔒 ล็อคข้อมูล LINE Token & Target ID แล้ว' 
                          : '🔓 ปลดล็อคข้อมูล LINE (กำลังอยู่ในโหมดแก้ไข)'}
                      </span>
                      <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                        isLineLocked ? 'bg-emerald-600 text-white' : 'bg-amber-500 text-white'
                      }`}>
                        {isLineLocked ? 'LOCKED ป้องกันการเปลี่ยนแปลง' : 'UNLOCKED แก้ไขได้'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-0.5">
                      {isLineLocked
                        ? 'ข้อมูล Channel Access Token และ LINE Destination Target ID ถูกล็อคไว้ ไม่ให้มีการเปลี่ยนแปลงแบบอัตโนมัติ'
                        : 'สามารถพิมพ์แก้ไข Token หรือ Target ID ได้ เมื่อแก้ไขเสร็จแล้วกรุณากดปุ่ม "บันทึก & ล็อคข้อมูล" ด้านขวา'}
                    </p>
                  </div>
                </div>

                {/* Lock / Unlock Toggle & Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  {isLineLocked ? (
                    <button
                      type="button"
                      onClick={() => {
                        setIsLineLocked(false);
                        updateSettings({ isLineLocked: false });
                        setTestLineStatus({ success: true, message: 'ปลดล็อคข้อมูล LINE แล้ว สามารถพิมพ์แก้ไข Token หรือ Target ID ได้' });
                      }}
                      className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <Unlock className="w-3.5 h-3.5" />
                      <span>ปลดล็อคเพื่อแก้ไข</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setIsLineLocked(true);
                        updateSettings({
                          lineChannelAccessToken: lineChannelToken.trim(),
                          lineTargetId: lineTargetId.trim(),
                          lineNotifyToken: lineChannelToken.trim(),
                          isLineLocked: true
                        });
                        setTestLineStatus({ success: true, message: 'บันทึกและล็อคข้อมูล LINE เรียบร้อยแล้ว (ป้องกันการเปลี่ยนแปลงแบบอัตโนมัติ)' });
                      }}
                      className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      <span>บันทึก & ล็อคข้อมูลทันที</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      setLineTargetId(FIXED_DEFAULT_LINE_TARGET_ID);
                      setLineChannelToken(FIXED_DEFAULT_LINE_TOKEN);
                      setIsLineLocked(true);
                      updateSettings({
                        lineTargetId: FIXED_DEFAULT_LINE_TARGET_ID,
                        lineChannelAccessToken: FIXED_DEFAULT_LINE_TOKEN,
                        lineNotifyToken: FIXED_DEFAULT_LINE_TOKEN,
                        isLineLocked: true
                      });
                      setTestLineStatus({ success: true, message: `คืนค่าเริ่มต้น Target ID (${FIXED_DEFAULT_LINE_TARGET_ID}) และล็อคข้อมูลเรียบร้อยแล้ว` });
                    }}
                    className="px-3 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                    title="คืนค่าเป็น Target ID ที่ระบุไว้และล็อคข้อมูล"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                    <span>คืนค่าเดิม</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('line_technician')}
                    className="px-3 py-2 bg-[#06C755] hover:bg-[#05a847] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    <span>เปิดหน้า LINE ช่าง</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Token & Target ID Input Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* 1. Channel Access Token */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <span>1. LINE Channel Access Token (Long-lived)</span>
                    {isLineLocked && <Lock className="w-3 h-3 text-emerald-600" />}
                  </span>
                  <span className="text-[10px] text-slate-400 font-normal">
                    {isLineLocked ? '🔒 ล็อคแล้ว' : 'จากแท็บ Messaging API'}
                  </span>
                </label>
                <div className="relative">
                  <input
                    type="password"
                    readOnly={isLineLocked}
                    placeholder="ระบุ Channel Access Token..."
                    value={lineChannelToken}
                    onChange={(e) => setLineChannelToken(e.target.value)}
                    className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-mono transition-all ${
                      isLineLocked 
                        ? 'bg-slate-100 border border-slate-300 text-slate-600 cursor-not-allowed select-all' 
                        : 'bg-white border-2 border-amber-400 text-slate-900 focus:ring-2 focus:ring-[#06C755]'
                    }`}
                  />
                  {isLineLocked && (
                    <span className="absolute right-3 top-2.5 text-[10px] text-slate-400 font-semibold flex items-center gap-1 select-none">
                      <Lock className="w-3 h-3 text-slate-400" />
                      <span>LOCKED</span>
                    </span>
                  )}
                </div>
              </div>

              {/* 2. Destination Target ID */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700 flex items-center justify-between">
                  <span className="text-emerald-800 font-bold flex items-center gap-1">
                    <span>2. LINE Destination Target ID (ส่งไปที่เดียว)</span>
                    {isLineLocked && <Lock className="w-3 h-3 text-emerald-600" />}
                  </span>
                  <span className="text-[10px] text-emerald-600 font-medium">
                    {isLineLocked ? '🔒 ล็อคแล้ว' : 'User ID (U...) / Group ID (C...)'}
                  </span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    readOnly={isLineLocked}
                    placeholder="เช่น U1cae1619ff74e21fccd7266f4cd271de..."
                    value={lineTargetId}
                    onChange={(e) => setLineTargetId(e.target.value)}
                    className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-mono transition-all ${
                      isLineLocked 
                        ? 'bg-emerald-50/70 border border-emerald-300 text-emerald-950 font-bold cursor-not-allowed select-all' 
                        : 'bg-white border-2 border-amber-400 text-slate-900 font-bold focus:ring-2 focus:ring-[#06C755]'
                    }`}
                  />
                  {isLineLocked && (
                    <span className="absolute right-3 top-2.5 text-[10px] text-emerald-700 font-bold flex items-center gap-1 select-none">
                      <Lock className="w-3 h-3 text-emerald-600" />
                      <span>LOCKED</span>
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Explanation & Test Trigger */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 bg-emerald-50/60 border border-emerald-200/80 rounded-2xl">
              <div className="text-xs text-emerald-900 space-y-0.5">
                <p className="font-semibold flex items-center gap-1">
                  <Target className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>ส่งข้อมูลไปแค่ที่เดียว: ระบุ User ID เพื่อส่งหาบุคคล หรือ Group ID เพื่อส่งเข้ากลุ่มช่าง</span>
                </p>
                <p className="text-[11px] text-emerald-700">
                  ระบบจะทำการส่งการแจ้งเตือนงานทั้งหมดไปยัง LINE ปลายทางนี้เพียงที่เดียว ไม่ส่งไปที่อื่น
                </p>
              </div>

              <button
                type="button"
                onClick={handleTestLineNotify}
                className="px-4 py-2.5 bg-[#06C755] hover:bg-[#05a847] text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center justify-center space-x-1.5 shrink-0 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>ทดสอบ LINE Messaging API</span>
              </button>
            </div>

            {testLineStatus && (
              <div className={`p-3 rounded-xl text-xs font-semibold flex items-center space-x-2 ${
                testLineStatus.success ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'
              }`}>
                {testLineStatus.success ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> : <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />}
                <span>{testLineStatus.message}</span>
              </div>
            )}

            {/* Manual Sending Trigger Buttons */}
            <div className="p-3 bg-[#06C755]/5 border border-[#06C755]/20 rounded-2xl space-y-2">
              <span className="text-xs font-bold text-[#05a847] block">
                📲 ปุ่มกดส่งการแจ้งเตือน LINE ด้วยตนเอง (Manual Triggers)
              </span>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setIsLineModalOpen(true)}
                  className="px-3.5 py-2 bg-white border border-[#06C755] text-[#05a847] hover:bg-[#06C755] hover:text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>กดเลือกส่งการแจ้งเตือน LINE (Manual Sender Modal)</span>
                </button>

                <button
                  type="button"
                  onClick={async () => {
                    if (!lineChannelToken.trim()) {
                      setTestLineStatus({ success: false, message: 'กรุณากรอก Channel Access Token ก่อนส่ง' });
                      return;
                    }
                    if (!lineTargetId.trim()) {
                      setTestLineStatus({ success: false, message: 'กรุณากรอก Target ID เพื่อให้ระบบส่งข้อมูลไปแค่ที่เดียว' });
                      return;
                    }
                    const summaryMsg = formatDailySummaryLineMessage(tickets, hotelName);
                    const res = await sendLinePushMessage(lineChannelToken.trim(), lineTargetId.trim(), summaryMsg);
                    if (res.success) {
                      setTestLineStatus({ success: true, message: `ส่งสรุปรายงานภาพรวมงานซ่อมทั้งหมดเข้า LINE (${lineTargetId.trim()}) เรียบร้อยแล้ว!` });
                      confetti({ particleCount: 60, spread: 60, origin: { y: 0.6 } });
                    } else {
                      setTestLineStatus({ success: false, message: res.message || 'ส่งสรุปรายงานเข้า LINE ไม่สำเร็จ' });
                    }
                  }}
                  className="px-3.5 py-2 bg-[#06C755] text-white hover:bg-[#05a847] text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>ส่งสรุปภาพรวมงานซ่อมทั้งหมดเข้า LINE ปลายทางทันที</span>
                </button>
              </div>
            </div>

            {/* Automated Notification Options (ส่งอัตโนมัติ) */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2.5">
              <span className="text-xs font-bold text-slate-800 block">
                ⚙️ ตั้งค่าการส่งการแจ้งเตือนแบบอัตโนมัติ (Automated Trigger Options ไปยัง Target ID ที่ระบุ)
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-slate-700">
                <label className="flex items-center space-x-2.5 cursor-pointer p-2 bg-white rounded-xl border border-slate-200 hover:border-[#06C755]">
                  <input
                    type="checkbox"
                    checked={lineAutoNotifyNewTicket}
                    onChange={(e) => setLineAutoNotifyNewTicket(e.target.checked)}
                    className="w-4 h-4 text-[#06C755] rounded focus:ring-[#06C755]"
                  />
                  <div>
                    <span className="font-semibold block">ส่งอัตโนมัติเมื่อมีการแจ้งซ่อมใหม่</span>
                    <span className="text-[10px] text-slate-400">ส่งแจ้งเตือนรายละเอียดงานไปยัง Target ID ทันที</span>
                  </div>
                </label>

                <label className="flex items-center space-x-2.5 cursor-pointer p-2 bg-white rounded-xl border border-slate-200 hover:border-[#06C755]">
                  <input
                    type="checkbox"
                    checked={lineAutoNotifyStatusChange}
                    onChange={(e) => setLineAutoNotifyStatusChange(e.target.checked)}
                    className="w-4 h-4 text-[#06C755] rounded focus:ring-[#06C755]"
                  />
                  <div>
                    <span className="font-semibold block">ส่งอัตโนมัติเมื่ออัปเดตสถานะ/มอบหมายช่าง</span>
                    <span className="text-[10px] text-slate-400">แจ้งเตือนเมื่อมอบหมายงาน หรือซ่อมเสร็จรอตรวจ</span>
                  </div>
                </label>

                <label className="flex items-center space-x-2.5 cursor-pointer p-2 bg-white rounded-xl border border-slate-200 hover:border-[#06C755]">
                  <input
                    type="checkbox"
                    checked={lineAutoNotifyInspection}
                    onChange={(e) => setLineAutoNotifyInspection(e.target.checked)}
                    className="w-4 h-4 text-[#06C755] rounded focus:ring-[#06C755]"
                  />
                  <div>
                    <span className="font-semibold block">ส่งอัตโนมัติเมื่อตรวจรับงานซ่อม</span>
                    <span className="text-[10px] text-slate-400">แจ้งเตือนผลตรวจรับ/คะแนนดาวเมื่อปิดงาน</span>
                  </div>
                </label>

                <label className="flex items-center space-x-2.5 cursor-pointer p-2 bg-white rounded-xl border border-slate-200 hover:border-[#06C755]">
                  <input
                    type="checkbox"
                    checked={lineAutoNotifyDailyReport}
                    onChange={(e) => setLineAutoNotifyDailyReport(e.target.checked)}
                    className="w-4 h-4 text-[#06C755] rounded focus:ring-[#06C755]"
                  />
                  <div>
                    <span className="font-semibold block">ส่งอัตโนมัติเมื่อสรุปรายงานประจำวัน</span>
                    <span className="text-[10px] text-slate-400">ส่งสรุปตัวเลขงานเข้า LINE ตอน 18:00 น.</span>
                  </div>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions (Matching User Image 2 Footer) */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center space-x-2 text-xs text-slate-600">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span className="font-medium">เชื่อมต่อกับ Gmail API และ Google Auth อย่างปลอดภัย</span>
          </div>

          <div className="flex items-center space-x-3 w-full sm:w-auto">
            {saveMessage && (
              <span className="text-xs font-semibold text-emerald-700 animate-fade-in">
                ✓ {saveMessage}
              </span>
            )}
            <button
              type="submit"
              className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white text-sm font-bold rounded-2xl shadow-md transition-all cursor-pointer"
            >
              บันทึกการตั้งค่า
            </button>
          </div>
        </div>
      </form>

      {/* Manual LINE Trigger Modal */}
      <LineNotifyModal 
        isOpen={isLineModalOpen} 
        onClose={() => setIsLineModalOpen(false)} 
        ticket={tickets[0]} 
      />
    </div>
  );
};

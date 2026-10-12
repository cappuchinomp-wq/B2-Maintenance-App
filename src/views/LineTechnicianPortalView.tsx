import React, { useState } from 'react';
import { useMaintenance } from '../context/MaintenanceContext';
import { 
  MaintenanceTicket, 
  TicketStatus, 
  UrgencyLevel, 
  Technician,
  PartItem,
  LocationArea,
  WorkCategory,
  Department
} from '../types/maintenance';
import { sendLinePushMessage, formatLineMessage } from '../services/lineMessaging';
import { 
  Smartphone, 
  CheckCircle2, 
  Clock, 
  Wrench, 
  Send, 
  MessageSquare, 
  AlertTriangle, 
  Sparkles, 
  ChevronRight, 
  Camera, 
  DollarSign, 
  Check, 
  User, 
  Phone, 
  MapPin, 
  Calendar, 
  Layers, 
  ExternalLink, 
  Copy, 
  Search, 
  Filter, 
  Plus, 
  X, 
  Info,
  ShieldCheck,
  RefreshCw,
  SlidersHorizontal,
  ThumbsUp,
  HelpCircle,
  FileText
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const LineTechnicianPortalView: React.FC = () => {
  const { 
    tickets, 
    technicians, 
    settings, 
    updateTicketStatus, 
    updateTicket, 
    createTicket,
    setActiveTab 
  } = useMaintenance();

  // Active Technician working inside this LINE session
  const [selectedTechId, setSelectedTechId] = useState<string>(technicians[0]?.id || 'tech-1');
  const activeTech = technicians.find(t => t.id === selectedTechId) || technicians[0];

  // View presentation mode: 'mobile' (LINE LIFF simulator) or 'desktop' (wide view)
  const [viewMode, setViewMode] = useState<'mobile' | 'desktop'>('mobile');

  // Active tab inside LINE portal: 'pending' (งานใหม่รอกดรับ), 'in_progress' (งานของฉันกำลังทำ), 'pending_inspection' (งานรอตรวจรับ), 'completed' (ปิดงานแล้ว), 'all' (ทั้งหมด)
  const [lineTab, setLineTab] = useState<'pending' | 'in_progress' | 'pending_inspection' | 'completed' | 'all'>('pending');
  const [searchTerm, setSearchTerm] = useState('');

  // Modals
  const [updateModalTicket, setUpdateModalTicket] = useState<MaintenanceTicket | null>(null);
  const [submitModalTicket, setSubmitModalTicket] = useState<MaintenanceTicket | null>(null);
  const [createQuickModalOpen, setCreateQuickModalOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{ title: string; desc: string; type: 'success' | 'info' | 'error' } | null>(null);

  // Form State for "Update งาน"
  const [updateNote, setUpdateNote] = useState('');
  const [updateStatus, setUpdateStatus] = useState<TicketStatus>('in_progress');
  const [partsList, setPartsList] = useState<PartItem[]>([]);
  const [newPartName, setNewPartName] = useState('');
  const [newPartQty, setNewPartQty] = useState(1);
  const [newPartPrice, setNewPartPrice] = useState(0);
  const [updateImages, setUpdateImages] = useState<string[]>([]);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  // Form State for "ส่งงาน" (Submit completion)
  const [submitSummary, setSubmitSummary] = useState('');
  const [submitCost, setSubmitCost] = useState<number>(0);
  const [submitImages, setSubmitImages] = useState<string[]>([]);
  const [newSubmitImageUrl, setNewSubmitImageUrl] = useState('');
  const [confirmReady, setConfirmReady] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State for Quick Report
  const [quickRoom, setQuickRoom] = useState('101');
  const [quickArea, setQuickArea] = useState<LocationArea>('ห้องพัก');
  const [quickCat, setQuickCat] = useState<WorkCategory>('แอร์');
  const [quickUrgency, setQuickUrgency] = useState<UrgencyLevel>('High');
  const [quickDesc, setQuickDesc] = useState('');
  const [isCreatingQuick, setIsCreatingQuick] = useState(false);

  const showToast = (title: string, desc: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToastMessage({ title, desc, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Helper to send LINE notification to the fixed target ID
  const notifyFixedLine = async (msg: string, imgUrl?: string) => {
    const token = settings.lineChannelAccessToken || settings.lineNotifyToken;
    const target = settings.lineTargetId;
    if (token && target) {
      try {
        await sendLinePushMessage(token, target, msg, imgUrl);
      } catch (err) {
        console.error('Failed to send LINE notification:', err);
      }
    }
  };

  // 1. Feature: "กดรับงาน" (Accept Job)
  const handleAcceptJob = async (ticket: MaintenanceTicket) => {
    try {
      const techName = activeTech?.name || 'ช่างประจำเวร';
      const techPhone = activeTech?.phone || '-';

      await updateTicketStatus(
        ticket.id,
        'in_progress',
        `ช่าง ${techName} กดรับงานผ่านระบบ LINE เรียบร้อยแล้ว กำลังเข้าตรวจสอบ`,
        activeTech?.id
      );

      // Trigger Confetti
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });

      // Send LINE notification to fixed target ID
      const pushMsg = `👨‍🔧 ช่างกดรับงานแล้ว! (${ticket.id})
━━━━━━━━━━━━━━━
📍 สถานที่: ${ticket.area} - ห้อง ${ticket.roomNumber}
🔧 งาน: ${ticket.category}
👷‍♂️ ช่างผู้รับผิดชอบ: ${techName}
📞 โทร: ${techPhone}
⏱️ เวลาเริ่มงาน: ${new Date().toLocaleTimeString('th-TH')}
━━━━━━━━━━━━━━━
กำลังเข้าดำเนินการตรวจสอบและซ่อมแซม`;

      await notifyFixedLine(pushMsg);

      showToast(
        'กดรับงานสำเร็จแล้ว! ⚡',
        `ระบบมอบหมายงาน ${ticket.id} (ห้อง ${ticket.roomNumber}) ให้คุณแล้ว และส่งแจ้งเตือนเข้า LINE เรียบร้อย`,
        'success'
      );
    } catch (err: any) {
      showToast('เกิดข้อผิดพลาด', err.message || 'ไม่สามารถกดรับงานได้', 'error');
    }
  };

  // 2. Open "Update งาน" modal
  const handleOpenUpdateModal = (ticket: MaintenanceTicket) => {
    setUpdateModalTicket(ticket);
    setUpdateNote(ticket.technicianNotes || '');
    setUpdateStatus(ticket.status === 'pending' ? 'in_progress' : ticket.status);
    setPartsList(ticket.partsUsed ? [...ticket.partsUsed] : []);
    setUpdateImages(ticket.repairImages ? [...ticket.repairImages] : []);
  };

  // Add Part in Update
  const handleAddPart = () => {
    if (!newPartName.trim()) return;
    const newItem: PartItem = {
      name: newPartName.trim(),
      quantity: Number(newPartQty) || 1,
      unitPrice: Number(newPartPrice) || 0
    };
    setPartsList(prev => [...prev, newItem]);
    setNewPartName('');
    setNewPartQty(1);
    setNewPartPrice(0);
  };

  const handleRemovePart = (indexToRemove: number) => {
    setPartsList(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };

  // 2. Submit "Update งาน"
  const handleSaveUpdateJob = async () => {
    if (!updateModalTicket) return;
    setIsUpdating(true);

    try {
      const totalPartCost = partsList.reduce((sum, p) => sum + (p.unitPrice * p.quantity), 0);
      const prevTotal = updateModalTicket.totalCost || 0;
      const calculatedCost = Math.max(prevTotal, totalPartCost);

      await updateTicketStatus(
        updateModalTicket.id,
        updateStatus,
        updateNote.trim() || updateModalTicket.technicianNotes,
        activeTech?.id,
        calculatedCost,
        partsList,
        updateImages
      );

      // LINE Notification
      const pushMsg = `🔄 อัปเดตความคืบหน้างานซ่อม (${updateModalTicket.id})
━━━━━━━━━━━━━━━
📍 ห้อง: ${updateModalTicket.roomNumber} (${updateModalTicket.category})
👷‍♂️ ช่าง: ${activeTech?.name}
📊 สถานะ: ${updateStatus === 'on_hold' ? '⏸️ พักงานชั่วคราว รออะไหล่' : '⚙️ กำลังดำเนินการซ่อม'}
📝 บันทึก: ${updateNote || 'กำลังดำเนินการ'}
${partsList.length > 0 ? `🔩 รายการอะไหล่: ${partsList.map(p => `${p.name} x${p.quantity}`).join(', ')}` : ''}
━━━━━━━━━━━━━━━
อัปเดตผ่าน LINE ช่างเรียบร้อยแล้ว`;

      await notifyFixedLine(pushMsg, updateImages[0]);

      showToast('อัปเดตงานสำเร็จ! 📝', `บันทึกข้อมูลงาน ${updateModalTicket.id} และซิงค์กับ Webapp เรียบร้อย`, 'success');
      setUpdateModalTicket(null);
    } catch (err: any) {
      showToast('เกิดข้อผิดพลาด', err.message || 'ไม่สามารถอัปเดตงานได้', 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  // 3. Open "ส่งงาน" (Submit Completed Work) modal
  const handleOpenSubmitModal = (ticket: MaintenanceTicket) => {
    setSubmitModalTicket(ticket);
    setSubmitSummary(ticket.technicianNotes || 'ซ่อมแซมและทดสอบการใช้งานเรียบร้อย ไม่พบการรั่วซึม อุปกรณ์ทำงานปกติ');
    setSubmitCost(ticket.totalCost || 0);
    setSubmitImages(ticket.repairImages ? [...ticket.repairImages] : [
      'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=600&auto=format&fit=crop&q=80'
    ]);
    setConfirmReady(false);
  };

  // 3. Confirm "ส่งงาน"
  const handleConfirmSubmitJob = async () => {
    if (!submitModalTicket) return;
    if (!confirmReady) {
      showToast('โปรดยืนยันการตรวจสอบ', 'กรุณากดติ๊กยืนยันว่าการซ่อมเสร็จสมบูรณ์เรียบร้อยก่อนส่งงาน', 'info');
      return;
    }

    setIsSubmitting(true);
    try {
      await updateTicketStatus(
        submitModalTicket.id,
        'pending_inspection',
        submitSummary.trim() || 'ซ่อมเสร็จเรียบร้อย รอตรวจรับ',
        activeTech?.id,
        Number(submitCost) || submitModalTicket.totalCost || 0,
        submitModalTicket.partsUsed,
        submitImages
      );

      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.5 }
      });

      // Push notification to LINE
      const pushMsg = `🔍 ช่างซ่อมเสร็จแล้ว รอตรวจรับงาน! (${submitModalTicket.id})
━━━━━━━━━━━━━━━
📍 สถานที่: ${submitModalTicket.area} - ห้อง ${submitModalTicket.roomNumber}
🔧 งาน: ${submitModalTicket.category}
👷‍♂️ ช่างผู้ดำเนินการ: ${activeTech?.name}
💰 ค่าใช้จ่ายรวม: ฿${(Number(submitCost) || 0).toLocaleString()}
📝 สรุปการซ่อม: ${submitSummary}
━━━━━━━━━━━━━━━
รบกวนแม่บ้าน / ผู้ตรวจรับ เข้าตรวจงานในระบบ Webapp ได้ทันที`;

      await notifyFixedLine(pushMsg, submitImages[0]);

      showToast(
        'ส่งงานเรียบร้อยแล้ว! 🚀',
        `ตั๋ว ${submitModalTicket.id} เปลี่ยนเป็น "รอตรวจรับงาน" แล้ว และส่งแจ้งเตือนเข้า LINE ให้ผู้ตรวจรับทราบ`,
        'success'
      );
      setSubmitModalTicket(null);
    } catch (err: any) {
      showToast('เกิดข้อผิดพลาด', err.message || 'ไม่สามารถส่งงานได้', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 4. Quick Create Ticket via LINE
  const handleCreateQuickTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickDesc.trim()) return;

    setIsCreatingQuick(true);
    try {
      const created = await createTicket({
        area: quickArea,
        roomNumber: quickRoom,
        category: quickCat,
        urgency: quickUrgency,
        description: quickDesc.trim(),
        department: 'ช่างอาคาร',
        reporterName: `${activeTech.name} (แจ้งผ่าน LINE)`,
        reporterPhone: activeTech.phone
      });

      confetti({ particleCount: 50, spread: 60 });
      showToast('แจ้งซ่อมด่วนสำเร็จ!', `สร้างตั๋ว ${created.id} เรียบร้อยแล้ว`, 'success');
      setCreateQuickModalOpen(false);
      setQuickDesc('');
      setLineTab('pending');
    } catch (err: any) {
      showToast('เกิดข้อผิดพลาด', err.message || 'ไม่สามารถสร้างตั๋วได้', 'error');
    } finally {
      setIsCreatingQuick(false);
    }
  };

  // Filter tickets according to LINE Portal tab
  const filteredTickets = tickets.filter(ticket => {
    // Search
    if (searchTerm) {
      const match = 
        ticket.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.roomNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.category.toLowerCase().includes(searchTerm.toLowerCase());
      if (!match) return false;
    }

    switch (lineTab) {
      case 'pending':
        return ticket.status === 'pending';
      case 'in_progress':
        return ticket.status === 'in_progress' || ticket.status === 'on_hold';
      case 'pending_inspection':
        return ticket.status === 'pending_inspection';
      case 'completed':
        return ticket.status === 'completed';
      case 'all':
      default:
        return true;
    }
  });

  const pendingCount = tickets.filter(t => t.status === 'pending').length;
  const inProgressCount = tickets.filter(t => t.status === 'in_progress' || t.status === 'on_hold').length;
  const pendingInspectionCount = tickets.filter(t => t.status === 'pending_inspection').length;
  const completedCount = tickets.filter(t => t.status === 'completed').length;

  const urgencyConfig = {
    Critical: { label: 'ด่วนที่สุด (Critical)', badge: 'bg-rose-500 text-white', border: 'border-rose-400 bg-rose-50/40' },
    High: { label: 'ด่วนมาก (High)', badge: 'bg-orange-500 text-white', border: 'border-orange-300 bg-orange-50/40' },
    Medium: { label: 'ปานกลาง (Medium)', badge: 'bg-amber-500 text-white', border: 'border-amber-300 bg-amber-50/30' },
    Low: { label: 'ทั่วไป (Low)', badge: 'bg-emerald-500 text-white', border: 'border-emerald-300 bg-emerald-50/30' }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Toast Notification Alert */}
      {toastMessage && (
        <div className="fixed top-20 right-4 sm:right-8 z-50 animate-bounce">
          <div className={`px-4 py-3 rounded-2xl shadow-xl border flex items-center space-x-3 ${
            toastMessage.type === 'success' 
              ? 'bg-emerald-600 text-white border-emerald-500' 
              : toastMessage.type === 'error'
              ? 'bg-rose-600 text-white border-rose-500'
              : 'bg-sky-600 text-white border-sky-500'
          }`}>
            <Sparkles className="w-5 h-5 shrink-0 text-white" />
            <div>
              <p className="text-xs font-bold leading-tight">{toastMessage.title}</p>
              <p className="text-[11px] opacity-90">{toastMessage.desc}</p>
            </div>
            <button 
              onClick={() => setToastMessage(null)}
              className="p-1 hover:bg-white/20 rounded-lg text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Top Banner & Control Bar */}
      <div className="bg-gradient-to-r from-[#06C755] via-emerald-600 to-teal-700 rounded-3xl p-5 sm:p-7 text-white shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 -mt-6 -mr-6 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold text-white">
              <span className="w-2 h-2 rounded-full bg-emerald-300 animate-ping" />
              <span>LINE Official Technician Portal (LIFF / Webapp Real-time Sync)</span>
              <ShieldCheck className="w-3.5 h-3.5 text-white ml-1" />
            </div>

            <h1 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight text-white flex items-center gap-2">
              <span>หน้า LINE รับงานช่างอาคาร</span>
              <span className="text-xs font-bold px-2 py-0.5 rounded-lg bg-white text-[#06C755]">
                B2 Suphanburi
              </span>
            </h1>

            <p className="text-xs sm:text-sm text-emerald-50 max-w-2xl font-medium">
              ช่องทางให้ช่างสามารถ <strong className="text-white underline decoration-white/40">กดรับงาน</strong>, <strong className="text-white underline decoration-white/40">Update ความคืบหน้างาน</strong>, และ <strong className="text-white underline decoration-white/40">ส่งงานซ่อมเสร็จ</strong> ได้สะดวกรวดเร็ว เชื่อมต่อข้อมูลกับ Webapp และระบบแจ้งเตือน LINE ปลายทางที่กำหนดไว้โดยอัตโนมัติ
            </p>

            {/* Target ID indicator */}
            <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-white/90">
              <div className="bg-black/20 backdrop-blur-xs px-3 py-1 rounded-xl flex items-center gap-1.5 border border-white/15">
                <MapPin className="w-3.5 h-3.5 text-emerald-200" />
                <span>ปลายทาง LINE (ล็อคข้อมูลแล้ว):</span>
                <code className="font-mono font-bold bg-white/20 px-1.5 py-0.5 rounded text-[11px] text-white">
                  {settings.lineTargetId || 'U1cae1619ff74e21fccd7266f4cd271de'}
                </code>
                <span className="text-[10px] bg-white/20 text-emerald-200 px-1.5 py-0.2 rounded font-bold">🔒 LOCKED</span>
              </div>

              <button
                onClick={() => setActiveTab('settings')}
                className="text-xs text-emerald-100 hover:text-white underline flex items-center gap-1 font-semibold"
              >
                <span>แก้ไขการตั้งค่า LINE</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Action buttons and View Switcher */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* View Mode Toggle */}
            <div className="bg-white/20 p-1 rounded-2xl flex items-center gap-1 backdrop-blur-md border border-white/20">
              <button
                onClick={() => setViewMode('mobile')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  viewMode === 'mobile'
                    ? 'bg-white text-[#06C755] shadow-xs'
                    : 'text-white hover:bg-white/10'
                }`}
              >
                <Smartphone className="w-4 h-4" />
                <span>จอมือถือช่าง (LINE)</span>
              </button>
              <button
                onClick={() => setViewMode('desktop')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  viewMode === 'desktop'
                    ? 'bg-white text-[#06C755] shadow-xs'
                    : 'text-white hover:bg-white/10'
                }`}
              >
                <SlidersHorizontal className="w-4 h-4" />
                <span>จอเต็มกว้าง (Wide)</span>
              </button>
            </div>

            {/* Quick Report Ticket */}
            <button
              onClick={() => setCreateQuickModalOpen(true)}
              className="px-4 py-2.5 bg-white text-emerald-800 hover:bg-emerald-50 text-xs font-bold rounded-2xl shadow-sm transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4 text-[#06C755]" />
              <span>แจ้งซ่อมด่วนผ่าน LINE</span>
            </button>
          </div>
        </div>
      </div>

      {/* Technician Switcher Bar (เลือกช่างที่กำลังปฏิบัติงาน) */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <img
              src={activeTech?.avatar || 'https://images.unsplash.com/photo-1540569014015-19a7be504e3a?w=150'}
              alt={activeTech?.name}
              className="w-12 h-12 rounded-2xl object-cover border-2 border-emerald-500 shadow-xs"
            />
            <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-[#06C755] border-2 border-white flex items-center justify-center text-[9px] text-white font-bold">
              ✓
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">กำลังใช้งานในชื่อ:</span>
              <span className="text-sm font-black text-slate-900">{activeTech?.name}</span>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mt-0.5">
              <span className="flex items-center gap-1 text-slate-600">
                <Phone className="w-3 h-3 text-emerald-600" />
                <span>{activeTech?.phone}</span>
              </span>
              <span>•</span>
              <span className="text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-md">
                งานที่กำลังทำ: {inProgressCount} งาน
              </span>
            </div>
          </div>
        </div>

        {/* Quick Switch Dropdown */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-bold text-slate-600 shrink-0">
            สลับชื่อช่าง:
          </label>
          <select
            value={selectedTechId}
            onChange={(e) => setSelectedTechId(e.target.value)}
            className="px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-[#06C755] cursor-pointer"
          >
            {technicians.map(t => (
              <option key={t.id} value={t.id}>
                {t.name} ({t.phone})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Container: Mobile Simulator or Wide View */}
      <div className={`mx-auto transition-all duration-300 ${viewMode === 'mobile' ? 'max-w-md' : 'max-w-full'}`}>
        {/* Smartphone Frame Wrapper (if in mobile view) */}
        <div className={`bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden flex flex-col ${
          viewMode === 'mobile' ? 'min-h-[780px] border-slate-300 ring-8 ring-slate-100' : ''
        }`}>
          {/* Mobile Top Bar (LINE Status & Brand) */}
          <div className="bg-[#06C755] text-white p-3.5 sm:p-4 select-none">
            {/* Phone speaker & camera mockup notch */}
            {viewMode === 'mobile' && (
              <div className="flex justify-center mb-2">
                <div className="w-16 h-1 bg-white/40 rounded-full" />
              </div>
            )}

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center text-[#06C755] shadow-xs font-black text-sm">
                  LINE
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h2 className="text-sm font-black text-white leading-tight">
                      B2 Maintenance Bot
                    </h2>
                    <ShieldCheck className="w-4 h-4 text-emerald-200 fill-emerald-200" />
                  </div>
                  <p className="text-[11px] text-emerald-100 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                    <span>ออนไลน์ • ซิงค์ Webapp อัตโนมัติ</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-1.5">
                <button
                  onClick={() => {
                    navigator.clipboard?.writeText(window.location.href);
                    showToast('คัดลอกลิงก์แล้ว! 📋', 'คัดลอก URL หน้า LINE ช่างเพื่อส่งต่อในแชทแล้ว', 'info');
                  }}
                  title="คัดลอกลิงก์แชร์ให้ช่าง"
                  className="p-2 hover:bg-white/20 rounded-xl text-white transition-colors cursor-pointer"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Quick Action Navigation Tabs inside LINE */}
          <div className="bg-slate-50 border-b border-slate-200 p-2 overflow-x-auto scrollbar-none">
            <div className="flex items-center space-x-1.5 min-w-max">
              <button
                onClick={() => setLineTab('pending')}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  lineTab === 'pending'
                    ? 'bg-[#06C755] text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-200/70'
                }`}
              >
                <span>⚡ งานใหม่รอกดรับ</span>
                {pendingCount > 0 && (
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                    lineTab === 'pending' ? 'bg-white text-[#06C755]' : 'bg-rose-500 text-white'
                  }`}>
                    {pendingCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => setLineTab('in_progress')}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  lineTab === 'in_progress'
                    ? 'bg-[#06C755] text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-200/70'
                }`}
              >
                <span>⚙️ กำลังซ่อม</span>
                {inProgressCount > 0 && (
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                    lineTab === 'in_progress' ? 'bg-white text-[#06C755]' : 'bg-sky-500 text-white'
                  }`}>
                    {inProgressCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => setLineTab('pending_inspection')}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  lineTab === 'pending_inspection'
                    ? 'bg-[#06C755] text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-200/70'
                }`}
              >
                <span>🔍 รอตรวจรับ</span>
                {pendingInspectionCount > 0 && (
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                    lineTab === 'pending_inspection' ? 'bg-white text-[#06C755]' : 'bg-amber-500 text-white'
                  }`}>
                    {pendingInspectionCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => setLineTab('completed')}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  lineTab === 'completed'
                    ? 'bg-[#06C755] text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-200/70'
                }`}
              >
                <span>✅ ปิดงานแล้ว</span>
                <span className="text-[10px] opacity-75">({completedCount})</span>
              </button>

              <button
                onClick={() => setLineTab('all')}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  lineTab === 'all'
                    ? 'bg-[#06C755] text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-200/70'
                }`}
              >
                <span>📋 ทั้งหมด</span>
              </button>
            </div>
          </div>

          {/* Search box inside LINE */}
          <div className="p-3 bg-white border-b border-slate-100">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="ค้นหาห้องพัก, เลขตั๋ว, อาการ..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-[#06C755] focus:outline-hidden"
              />
            </div>
          </div>

          {/* Tickets List Area */}
          <div className="p-3 sm:p-4 space-y-3.5 flex-1 overflow-y-auto bg-slate-50/60 max-h-[620px]">
            {filteredTickets.length === 0 ? (
              <div className="text-center py-16 px-4 bg-white rounded-2xl border border-dashed border-slate-200">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-2 opacity-80" />
                <h3 className="text-sm font-bold text-slate-800">ไม่พบรายการงานในหมวดนี้</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                  {lineTab === 'pending'
                    ? 'ยินดีด้วย! ไม่มีงานใหม่ค้างรอรับงานในขณะนี้'
                    : 'ไม่มีงานที่ตรงกับเงื่อนไขการค้นหา'}
                </p>
                {lineTab !== 'pending' && (
                  <button
                    onClick={() => setLineTab('pending')}
                    className="mt-3 px-3.5 py-1.5 bg-[#06C755] text-white text-xs font-bold rounded-xl cursor-pointer"
                  >
                    ดูงานใหม่รอกดรับ
                  </button>
                )}
              </div>
            ) : (
              filteredTickets.map(ticket => {
                const urgency = urgencyConfig[ticket.urgency] || urgencyConfig.Medium;
                const isPending = ticket.status === 'pending';
                const isInProgress = ticket.status === 'in_progress' || ticket.status === 'on_hold';
                const isPendingInspection = ticket.status === 'pending_inspection';
                const isCompleted = ticket.status === 'completed';

                return (
                  <div
                    key={ticket.id}
                    className={`bg-white rounded-2xl p-4 border transition-all shadow-xs hover:shadow-md relative ${urgency.border}`}
                  >
                    {/* Header: Ticket ID & Urgency Pill */}
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-black text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md font-mono">
                          {ticket.id}
                        </span>
                        <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${urgency.badge}`}>
                          {ticket.urgency}
                        </span>
                      </div>

                      <div className="text-[11px] text-slate-400 font-medium">
                        {new Date(ticket.createdAt).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น.
                      </div>
                    </div>

                    {/* Room & Area */}
                    <div className="flex items-baseline justify-between mb-1.5">
                      <h4 className="text-base font-black text-slate-900 flex items-center gap-1.5">
                        <span className="text-[#06C755]">●</span>
                        <span>{ticket.area} - ห้อง {ticket.roomNumber}</span>
                      </h4>
                      <span className="text-xs font-bold text-sky-700 bg-sky-50 px-2.5 py-0.5 rounded-lg border border-sky-100">
                        {ticket.category}
                      </span>
                    </div>

                    {/* Description */}
                    <p className="text-xs text-slate-700 bg-slate-50/80 p-2.5 rounded-xl border border-slate-100 line-clamp-3 mb-2.5">
                      {ticket.description}
                    </p>

                    {/* Reporter & Assigned Tech Info */}
                    <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-500 mb-3 border-t border-slate-100 pt-2">
                      <div className="flex items-center gap-1 truncate">
                        <User className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="truncate">ผู้แจ้ง: {ticket.reporterName}</span>
                      </div>
                      <div className="flex items-center gap-1 truncate">
                        <Phone className="w-3 h-3 text-emerald-600 shrink-0" />
                        <a href={`tel:${ticket.reporterPhone}`} className="text-emerald-700 font-bold hover:underline truncate">
                          {ticket.reporterPhone}
                        </a>
                      </div>
                    </div>

                    {/* Attached Photo Preview (if any) */}
                    {ticket.images && ticket.images.length > 0 && (
                      <div className="mb-3 flex items-center gap-2 overflow-x-auto pb-1">
                        {ticket.images.map((img, idx) => (
                          <img
                            key={idx}
                            src={img}
                            alt="รูปแจ้งซ่อม"
                            onClick={() => setPreviewImage(img)}
                            className="w-12 h-12 rounded-lg object-cover border border-slate-200 hover:opacity-80 cursor-pointer shrink-0"
                          />
                        ))}
                        <span className="text-[10px] text-slate-400">รูปอาการเสีย</span>
                      </div>
                    )}

                    {/* Technician Notes or Parts (if in progress or completed) */}
                    {ticket.technicianNotes && (
                      <div className="mb-3 p-2 bg-emerald-50/70 border border-emerald-200/60 rounded-xl text-[11px] text-emerald-950">
                        <span className="font-bold block text-emerald-800">📝 บันทึกช่าง:</span>
                        <p className="line-clamp-2">{ticket.technicianNotes}</p>
                        {ticket.totalCost ? (
                          <span className="block mt-1 font-bold text-emerald-700">
                            💰 ยอดค่าใช้จ่าย: ฿{ticket.totalCost.toLocaleString()}
                          </span>
                        ) : null}
                      </div>
                    )}

                    {/* ACTION BUTTONS (กดรับงาน, Update งาน, ส่งงาน) */}
                    <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-2">
                      {/* 1. ปุ่ม "กดรับงาน" (สำหรับงานใหม่ที่ยังรอดำเนินการ) */}
                      {isPending && (
                        <button
                          onClick={() => handleAcceptJob(ticket)}
                          className="w-full py-2.5 bg-[#06C755] hover:bg-[#05a847] text-white text-xs font-black rounded-xl shadow-md shadow-emerald-500/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-98"
                        >
                          <Check className="w-4 h-4 stroke-[3]" />
                          <span>⚡ กดรับงานทันที (Accept Job)</span>
                        </button>
                      )}

                      {/* 2. ปุ่ม "Update งาน" (สำหรับงานที่กำลังซ่อม) */}
                      {isInProgress && (
                        <>
                          <button
                            onClick={() => handleOpenUpdateModal(ticket)}
                            className="flex-1 py-2 bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <Wrench className="w-3.5 h-3.5 text-sky-600" />
                            <span>Update งาน / อะไหล่</span>
                          </button>

                          {/* 3. ปุ่ม "ส่งงาน" (ซ่อมเสร็จแล้วส่งตรวจรับ) */}
                          <button
                            onClick={() => handleOpenSubmitModal(ticket)}
                            className="flex-1 py-2 bg-[#06C755] hover:bg-[#05a847] text-white text-xs font-black rounded-xl shadow-xs transition-all flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>🚀 ส่งงาน (ตรวจรับ)</span>
                          </button>
                        </>
                      )}

                      {/* สถานะรอตรวจรับ */}
                      {isPendingInspection && (
                        <div className="w-full p-2 bg-amber-50 border border-amber-200 rounded-xl text-center">
                          <span className="text-xs font-bold text-amber-800 flex items-center justify-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-amber-600 animate-spin" />
                            <span>ส่งงานแล้ว • กำลังรอผู้ตรวจรับงานตรวจสอบ</span>
                          </span>
                        </div>
                      )}

                      {/* สถานะปิดงานสำเร็จ */}
                      {isCompleted && (
                        <div className="w-full p-2 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs font-bold text-emerald-800">
                          <span className="flex items-center gap-1">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            <span>ปิดงานสำเร็จแล้ว</span>
                          </span>
                          <span>
                            {ticket.inspection?.rating ? '⭐'.repeat(ticket.inspection.rating) : '5 ดาว'}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Mobile Bottom Footer bar */}
          <div className="p-3 bg-white border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>ช่าง: {activeTech?.name.split(' ')[0]}</span>
            </span>

            <span className="font-semibold text-slate-700">
              รวม {tickets.length} รายการใน Webapp
            </span>
          </div>
        </div>
      </div>

      {/* MODAL 1: Update งาน (Update Job Progress & Parts) */}
      {updateModalTicket && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4 my-8 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <div className="w-9 h-9 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center">
                  <Wrench className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Update ความคืบหน้างานซ่อม
                  </h3>
                  <p className="text-xs text-slate-500 font-mono">
                    {updateModalTicket.id} • ห้อง {updateModalTicket.roomNumber} ({updateModalTicket.category})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setUpdateModalTicket(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Status Selector */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">
                สถานะการปฏิบัติงาน
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setUpdateStatus('in_progress')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    updateStatus === 'in_progress'
                      ? 'bg-sky-500 text-white border-sky-500 shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  ⚙️ กำลังดำเนินการซ่อม
                </button>
                <button
                  type="button"
                  onClick={() => setUpdateStatus('on_hold')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    updateStatus === 'on_hold'
                      ? 'bg-amber-500 text-white border-amber-500 shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  ⏸️ พักงานชั่วคราว (รออะไหล่)
                </button>
              </div>
            </div>

            {/* Technician Notes */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 flex items-center justify-between">
                <span>บันทึกความคืบหน้าของช่าง</span>
                <span className="text-[10px] text-slate-400 font-normal">ข้อความนี้จะส่งเข้า LINE ด้วย</span>
              </label>
              <textarea
                rows={3}
                placeholder="เช่น กำลังรื้อหน้ากากแอร์ตรวจเช็คท่อน้ำทิ้ง, เปลี่ยนแคปรันเรียบร้อยแล้ว, หรือรอสั่งเบิกอะไหล่..."
                value={updateNote}
                onChange={(e) => setUpdateNote(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-[#06C755] focus:outline-hidden"
              />
            </div>

            {/* Spare Parts Section */}
            <div className="space-y-2 border-t border-slate-100 pt-3">
              <label className="block text-xs font-bold text-slate-700 flex items-center justify-between">
                <span>🔩 อะไหล่ / อุปกรณ์ที่ใช้ (ถ้ามี)</span>
                <span className="text-xs text-emerald-700 font-bold">
                  รวม: ฿{partsList.reduce((sum, p) => sum + (p.unitPrice * p.quantity), 0).toLocaleString()}
                </span>
              </label>

              {/* Add Part inputs */}
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="ชื่ออะไหล่..."
                  value={newPartName}
                  onChange={(e) => setNewPartName(e.target.value)}
                  className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
                />
                <input
                  type="number"
                  placeholder="จำนวน"
                  min="1"
                  value={newPartQty}
                  onChange={(e) => setNewPartQty(Math.max(1, Number(e.target.value)))}
                  className="w-16 px-2 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 text-center"
                />
                <input
                  type="number"
                  placeholder="ราคา (บ.)"
                  min="0"
                  value={newPartPrice}
                  onChange={(e) => setNewPartPrice(Number(e.target.value))}
                  className="w-20 px-2 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 text-right"
                />
                <button
                  type="button"
                  onClick={handleAddPart}
                  className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shrink-0 cursor-pointer"
                >
                  เพิ่ม
                </button>
              </div>

              {/* Parts List */}
              {partsList.length > 0 && (
                <div className="space-y-1.5 max-h-28 overflow-y-auto pt-1">
                  {partsList.map((part, pIdx) => (
                    <div
                      key={pIdx}
                      className="flex items-center justify-between text-xs bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100"
                    >
                      <span className="font-medium text-slate-800">
                        {part.name} (x{part.quantity})
                      </span>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-slate-700">
                          ฿{(part.unitPrice * part.quantity).toLocaleString()}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemovePart(pIdx)}
                          className="text-rose-500 hover:text-rose-700 cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setUpdateModalTicket(null)}
                className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleSaveUpdateJob}
                disabled={isUpdating}
                className="px-5 py-2.5 bg-[#06C755] hover:bg-[#05a847] text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isUpdating ? 'กำลังบันทึก...' : 'บันทึกอัปเดต & แจ้งเตือน LINE'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: ส่งงานซ่อม (Submit Completed Work for Inspection) */}
      {submitModalTicket && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4 my-8 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-[#06C755] flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    ส่งมอบงานซ่อม (ส่งให้ตรวจรับ)
                  </h3>
                  <p className="text-xs text-slate-500 font-mono">
                    {submitModalTicket.id} • ห้อง {submitModalTicket.roomNumber} ({submitModalTicket.category})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSubmitModalTicket(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Repair Completion Summary */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 flex items-center justify-between">
                <span>สรุปผลการซ่อมแซม</span>
                <span className="text-[10px] text-emerald-600 font-medium">จะส่งให้ผู้ตรวจรับทาง LINE</span>
              </label>
              <textarea
                rows={3}
                value={submitSummary}
                onChange={(e) => setSubmitSummary(e.target.value)}
                placeholder="ระบุสิ่งที่ได้ทำการแก้ไข เช่น ล้างแอร์ เปลี่ยนฟิลเตอร์ใหม่ ทดสอบการทำงาน 30 นาที น้ำไม่รั่วซึมแล้ว..."
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-[#06C755] focus:outline-hidden"
              />
            </div>

            {/* Total Cost Input */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">
                ยอดค่าใช้จ่ายในการซ่อมรวม (บาท)
              </label>
              <div className="relative">
                <DollarSign className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="number"
                  min="0"
                  value={submitCost}
                  onChange={(e) => setSubmitCost(Number(e.target.value))}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white"
                />
              </div>
            </div>

            {/* Repair Photos */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700 flex items-center justify-between">
                <span>รูปถ่ายหลังซ่อมเสร็จสมบูรณ์ (After Photo)</span>
                <span className="text-[10px] text-slate-400">คลิกรูปเพื่อดูภาพใหญ่</span>
              </label>

              <div className="flex items-center gap-2">
                {submitImages.map((img, i) => (
                  <div key={i} className="relative group">
                    <img
                      src={img}
                      alt="รูปซ่อมเสร็จ"
                      onClick={() => setPreviewImage(img)}
                      className="w-16 h-16 rounded-xl object-cover border border-slate-200 cursor-pointer"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Confirmation Checkbox */}
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl">
              <label className="flex items-start space-x-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={confirmReady}
                  onChange={(e) => setConfirmReady(e.target.checked)}
                  className="mt-0.5 rounded text-[#06C755] focus:ring-[#06C755]"
                />
                <span className="text-xs text-emerald-900 font-semibold leading-relaxed">
                  ช่าง {activeTech?.name} ยืนยันว่าได้ทดสอบระบบเรียบร้อยแล้ว อุปกรณ์ใช้งานได้สมบูรณ์ พร้อมให้แม่บ้านหรือหัวหน้างานเข้าตรวจรับงาน
                </span>
              </label>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSubmitModalTicket(null)}
                className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleConfirmSubmitJob}
                disabled={isSubmitting || !confirmReady}
                className="px-5 py-2.5 bg-[#06C755] hover:bg-[#05a847] text-white text-xs font-black rounded-xl shadow-md transition-all flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isSubmitting ? 'กำลังส่งงาน...' : '🚀 ยืนยันส่งมอบงานซ่อม (ส่งตรวจรับ)'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Quick Ticket Report via LINE */}
      {createQuickModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4 my-8 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <div className="w-9 h-9 rounded-xl bg-[#06C755]/10 text-[#06C755] flex items-center justify-center">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    แจ้งซ่อมด่วนผ่าน LINE ช่าง
                  </h3>
                  <p className="text-xs text-slate-500">
                    ช่างพบเหตุขัดข้องขณะเดินตรวจอาคาร
                  </p>
                </div>
              </div>
              <button
                onClick={() => setCreateQuickModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateQuickTicket} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">สถานที่</label>
                  <select
                    value={quickArea}
                    onChange={(e) => setQuickArea(e.target.value as LocationArea)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  >
                    <option value="ห้องพัก">ห้องพัก</option>
                    <option value="ลอบบี้">ลอบบี้</option>
                    <option value="ห้องน้ำส่วนกลาง">ห้องน้ำส่วนกลาง</option>
                    <option value="ห้องประชุม / จัดเลี้ยง">ห้องประชุม / จัดเลี้ยง</option>
                    <option value="ออฟฟิศ">ออฟฟิศ</option>
                    <option value="อื่นๆ">อื่นๆ</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">เลขห้อง/จุด</label>
                  <input
                    type="text"
                    required
                    value={quickRoom}
                    onChange={(e) => setQuickRoom(e.target.value)}
                    placeholder="เช่น 304, ลอบบี้"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  >
                  </input>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">ประเภทงาน</label>
                  <select
                    value={quickCat}
                    onChange={(e) => setQuickCat(e.target.value as WorkCategory)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  >
                    <option value="แอร์">แอร์</option>
                    <option value="ไฟฟ้า">ไฟฟ้า</option>
                    <option value="ประปา">ประปา</option>
                    <option value="เฟอร์นิเจอร์">เฟอร์นิเจอร์</option>
                    <option value="ไอที / อินเตอร์เน็ต">ไอที / อินเตอร์เน็ต</option>
                    <option value="Fire Alarm">Fire Alarm</option>
                    <option value="งานสี / โครงสร้างอาคาร">งานสี / โครงสร้างอาคาร</option>
                    <option value="อื่นๆ">อื่นๆ</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">ความเร่งด่วน</label>
                  <select
                    value={quickUrgency}
                    onChange={(e) => setQuickUrgency(e.target.value as UrgencyLevel)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  >
                    <option value="Critical">🔴 ด่วนที่สุด (Critical)</option>
                    <option value="High">🟠 ด่วนมาก (High)</option>
                    <option value="Medium">🟡 ปานกลาง (Medium)</option>
                    <option value="Low">🟢 ทั่วไป (Low)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">รายละเอียดอาการเสีย</label>
                <textarea
                  required
                  rows={3}
                  value={quickDesc}
                  onChange={(e) => setQuickDesc(e.target.value)}
                  placeholder="ระบุอาการ เช่น หลอดไฟทางเดินชั้น 3 ดับ, ก๊อกน้ำอ่างล้างหน้ารั่ว..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setCreateQuickModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isCreatingQuick}
                  className="px-5 py-2.5 bg-[#06C755] hover:bg-[#05a847] text-white text-xs font-bold rounded-xl shadow-xs"
                >
                  {isCreatingQuick ? 'กำลังบันทึก...' : 'สร้างตั๋วแจ้งซ่อม & แจ้ง LINE'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Image Preview Lightbox */}
      {previewImage && (
        <div
          onClick={() => setPreviewImage(null)}
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 cursor-pointer"
        >
          <img
            src={previewImage}
            alt="พรีวิวรูป"
            className="max-h-[90vh] max-w-[90vw] object-contain rounded-2xl shadow-2xl"
          />
        </div>
      )}
    </div>
  );
};

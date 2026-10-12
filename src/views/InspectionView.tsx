import React, { useState } from 'react';
import { useMaintenance } from '../context/MaintenanceContext';
import { MaintenanceTicket } from '../types/maintenance';
import { 
  CheckSquare, 
  CheckCircle2, 
  XCircle, 
  Star, 
  Image as ImageIcon, 
  MessageSquare, 
  Wrench, 
  Phone, 
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Clock,
  DollarSign,
  AlertTriangle,
  UserCheck,
  FileText,
  Eye,
  Check,
  RotateCcw,
  Send
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { LineNotifyModal } from '../components/LineNotifyModal';

export const InspectionView: React.FC = () => {
  const { tickets, inspectTicket, currentUser } = useMaintenance();
  const [selectedTicket, setSelectedTicket] = useState<MaintenanceTicket | null>(null);
  const [isLineModalOpen, setIsLineModalOpen] = useState(false);

  // Multi-criteria ratings
  const [qualityRating, setQualityRating] = useState<number>(5);
  const [speedRating, setSpeedRating] = useState<number>(5);
  const [cleanlinessRating, setCleanlinessRating] = useState<number>(5);

  // Quality checklist
  const [checklist, setChecklist] = useState({
    cleanliness: true,
    functionality: true,
    workmanship: true,
    safety: true
  });

  const [feedback, setFeedback] = useState<string>('งานซ่อมเรียบร้อยดีมาก ผ่านเกณฑ์มาตรฐานโรงแรม');
  const [inspectorName, setInspectorName] = useState<string>(currentUser?.displayName || 'วรรณา (หัวหน้าแม่บ้าน)');
  const [inspectorDept, setInspectorDept] = useState<string>(currentUser?.department || 'แม่บ้าน');

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showRejectModal, setShowRejectModal] = useState<boolean>(false);
  const [rejectReasonCategory, setRejectReasonCategory] = useState<string>('งานยังไม่เรียบร้อยสมบูรณ์');
  const [rejectDetails, setRejectDetails] = useState<string>('');
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Tickets awaiting inspection
  const pendingInspectionTickets = tickets.filter(t => t.status === 'pending_inspection');
  // Recently completed inspected tickets
  const recentlyCompletedTickets = tickets.filter(t => t.status === 'completed' && t.inspection).slice(0, 6);

  const [statusBanner, setStatusBanner] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const averageRating = Math.round((qualityRating + speedRating + cleanlinessRating) / 3);

  const handleSelectTicket = (ticket: MaintenanceTicket) => {
    setSelectedTicket(ticket);
    setStatusBanner(null);
    setQualityRating(5);
    setSpeedRating(5);
    setCleanlinessRating(5);
    setChecklist({
      cleanliness: true,
      functionality: true,
      workmanship: true,
      safety: true
    });
    setFeedback('งานซ่อมเรียบร้อยดีมาก ผ่านเกณฑ์มาตรฐานโรงแรม');
  };

  const handleApprove = async () => {
    if (!selectedTicket) return;
    setIsSubmitting(true);
    setStatusBanner(null);
    try {
      const fullFeedback = `[ตรวจรับโดย ${inspectorName} - ${inspectorDept}] ${feedback} | การตรวจสอบ: ความสะอาด (${checklist.cleanliness ? 'ผ่าน' : 'ไม่ผ่าน'}), ฟังก์ชันใช้งาน (${checklist.functionality ? 'ผ่าน' : 'ไม่ผ่าน'}), ความประณีต (${checklist.workmanship ? 'ผ่าน' : 'ไม่ผ่าน'}), ความปลอดภัย (${checklist.safety ? 'ผ่าน' : 'ไม่ผ่าน'})`;

      await inspectTicket(selectedTicket.id, 'approved', averageRating, fullFeedback);
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.6 }
      });
      setStatusBanner({
        type: 'success',
        message: `ตรวจรับผ่านและอนุมัติปิดงานใบแจ้งซ่อม ${selectedTicket.id} (${selectedTicket.roomNumber} - ${selectedTicket.category}) เรียบร้อยแล้ว!`
      });
      setSelectedTicket(null);
      setIsSubmitting(false);
    } catch (e: any) {
      setStatusBanner({
        type: 'error',
        message: e.message || 'เกิดข้อผิดพลาดในการตรวจรับงาน'
      });
      setIsSubmitting(false);
    }
  };

  const handleRejectConfirm = async () => {
    if (!selectedTicket) return;
    const finalReason = `[ส่งกลับแก้ไขโดย ${inspectorName}] ${rejectReasonCategory}: ${rejectDetails}`;
    setIsSubmitting(true);
    setStatusBanner(null);
    try {
      await inspectTicket(selectedTicket.id, 'rejected', averageRating, finalReason);
      setStatusBanner({
        type: 'success',
        message: `ส่งงาน ${selectedTicket.id} กลับให้ช่างแก้ไขเพิ่มเติมเรียบร้อยแล้ว`
      });
      setShowRejectModal(false);
      setSelectedTicket(null);
      setIsSubmitting(false);
    } catch (e: any) {
      setStatusBanner({
        type: 'error',
        message: e.message || 'เกิดข้อผิดพลาด'
      });
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-amber-500 via-orange-600 to-amber-700 rounded-3xl p-6 sm:p-8 text-white shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 px-2.5 py-1 text-xs font-semibold bg-white/20 rounded-full backdrop-blur-xs text-amber-100 uppercase tracking-wider mb-2">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Quality Assurance & Work Inspection</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
              ระบบตรวจรับงานซ่อมบำรุงโรงแรม (Work Inspection)
            </h2>
            <p className="text-xs sm:text-sm text-amber-100 mt-1 max-w-2xl leading-relaxed">
              สำหรับหัวหน้าแม่บ้าน, พนักงานต้อนรับ (GSA) หรือผู้จัดการโรงแรม ตรวจสอบความถูกต้อง เช็คลิสต์มาตรฐาน ประเมินคะแนน และอนุมัติปิดงาน
            </p>
          </div>
          <div className="flex items-center space-x-3 bg-white/10 px-4 py-3 rounded-2xl backdrop-blur-md self-start sm:self-auto border border-white/15">
            <CheckSquare className="w-8 h-8 text-amber-100" />
            <div>
              <span className="text-[11px] text-amber-200 block">งานรอตรวจรับ:</span>
              <span className="text-xl font-black text-white">{pendingInspectionTickets.length} รายการ</span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Notification Message */}
      {statusBanner && (
        <div className={`p-4 rounded-2xl flex items-center justify-between text-xs sm:text-sm font-medium ${
          statusBanner.type === 'success' 
            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
            : 'bg-rose-50 text-rose-800 border border-rose-200'
        }`}>
          <div className="flex items-center space-x-2">
            {statusBanner.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
            )}
            <span>{statusBanner.message}</span>
          </div>
          <button 
            type="button" 
            onClick={() => setStatusBanner(null)} 
            className="text-xs text-slate-400 hover:text-slate-600 cursor-pointer font-bold px-2 py-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Content: Pending Inspection List + Inspection Detail Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: List of items waiting for inspection */}
        <div className="bg-white rounded-3xl p-5 border border-amber-200/60 shadow-2xs space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
              <span>คิวรอตรวจรับงาน</span>
              <span className="px-2 py-0.5 text-xs bg-amber-100 text-amber-800 rounded-full font-bold">
                {pendingInspectionTickets.length}
              </span>
            </h3>
          </div>

          <div className="space-y-2.5 max-h-[700px] overflow-y-auto pr-1">
            {pendingInspectionTickets.length === 0 ? (
              <div className="py-16 text-center text-slate-400 text-xs">
                <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2 opacity-80" />
                <p className="font-bold text-slate-700">ไม่มีงานค้างรอตรวจรับในขณะนี้</p>
                <p className="text-[11px] text-slate-400 mt-1">งานซ่อมทั้งหมดได้รับการตรวจรับเรียบร้อย</p>
              </div>
            ) : (
              pendingInspectionTickets.map(ticket => {
                const isSelected = selectedTicket?.id === ticket.id;
                return (
                  <div
                    key={ticket.id}
                    onClick={() => handleSelectTicket(ticket)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-amber-50/80 border-amber-400 ring-2 ring-amber-300 shadow-xs'
                        : 'bg-slate-50/80 border-slate-200 hover:border-amber-300 hover:bg-amber-50/30'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-blue-700">{ticket.id}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-100 text-amber-800 rounded">
                        รอตรวจรับ
                      </span>
                    </div>

                    <h4 className="font-bold text-xs text-slate-900 mt-1.5">
                      {ticket.area} ({ticket.roomNumber}) • {ticket.category}
                    </h4>
                    <p className="text-xs text-slate-600 mt-1 line-clamp-2">{ticket.description}</p>

                    <div className="mt-2.5 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-500">
                      <span>ช่าง: {ticket.assignedTechnician?.name.split(' ')[0] || 'รอระบุ'}</span>
                      <span className="text-amber-700 font-semibold flex items-center gap-1">
                        ตรวจงาน <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Detailed Inspection Action Card */}
        <div className="lg:col-span-2">
          {selectedTicket ? (
            <div className="bg-white rounded-3xl p-6 border border-amber-200/70 shadow-sm space-y-6">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between pb-4 border-b border-slate-100 gap-3">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono font-bold text-xs px-2.5 py-0.5 bg-blue-100 text-blue-800 rounded-md">
                      {selectedTicket.id}
                    </span>
                    <span className="text-xs font-bold px-2.5 py-0.5 bg-orange-100 text-orange-800 rounded-md">
                      {selectedTicket.category}
                    </span>
                    <span className="text-xs font-bold px-2.5 py-0.5 bg-red-100 text-red-700 rounded-md">
                      ความด่วน: {selectedTicket.urgency}
                    </span>
                  </div>
                  <h3 className="text-xl font-extrabold text-slate-900 mt-2">
                    {selectedTicket.area} (ห้องพัก {selectedTicket.roomNumber})
                  </h3>
                </div>

                <div className="text-left sm:text-right text-xs text-slate-500">
                  <span className="block font-medium">ผู้แจ้ง: {selectedTicket.reporterName}</span>
                  <span className="block text-[11px] text-slate-400">แผนก: {selectedTicket.department}</span>
                  <span className="block text-[11px] text-slate-400 font-mono mt-0.5">
                    แจ้งเมื่อ: {new Date(selectedTicket.createdAt).toLocaleString('th-TH')}
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsLineModalOpen(true)}
                    className="mt-2 px-3 py-1.5 bg-[#06C755] hover:bg-[#05a847] text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center space-x-1 sm:ml-auto cursor-pointer"
                    title="ส่งการแจ้งเตือน LINE สำหรับการตรวจรับรายการนี้"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>ส่ง LINE แจ้งเตือน</span>
                  </button>
                </div>
              </div>

              {/* 1. Problem Description & Tech Notes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-1.5">
                  <h5 className="font-bold text-slate-800 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <span>อาการเสียที่แจ้งซ่อม:</span>
                  </h5>
                  <p className="text-slate-700 leading-relaxed">{selectedTicket.description}</p>
                </div>

                <div className="p-4 bg-sky-50 rounded-2xl border border-sky-200 text-xs space-y-1.5">
                  <h5 className="font-bold text-sky-900 flex items-center gap-1.5">
                    <Wrench className="w-4 h-4 text-sky-600" />
                    <span>บันทึกผลการซ่อมแซมของช่าง:</span>
                  </h5>
                  <p className="text-sky-900 leading-relaxed font-medium">
                    {selectedTicket.technicianNotes || 'ช่างเข้าตรวจสอบและทำการแก้ไขเรียบร้อย พร้อมใช้งาน'}
                  </p>
                  {selectedTicket.assignedTechnician && (
                    <div className="text-[11px] text-sky-700 pt-1 border-t border-sky-200 flex items-center justify-between">
                      <span>ช่างผู้รับผิดชอบ: {selectedTicket.assignedTechnician.name}</span>
                      <a href={`tel:${selectedTicket.assignedTechnician.phone.replace(/[^0-9]/g, '')}`} className="flex items-center gap-1 text-sky-800 font-bold hover:underline">
                        <Phone className="w-3 h-3" /> โทรหาช่าง
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* 2. Parts Used & Cost Breakdown Details */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <DollarSign className="w-4 h-4 text-emerald-600" />
                    <span>รายการอะไหล่ & ค่าใช้จ่ายงานซ่อม (Parts & Costs):</span>
                  </span>
                  <span className="text-emerald-700 font-bold">
                    รวมทั้งสิ้น: ฿{(selectedTicket.totalCost || 0).toLocaleString()}
                  </span>
                </h4>

                {selectedTicket.partsUsed && selectedTicket.partsUsed.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead>
                        <tr className="border-b border-slate-200 text-slate-500 text-[11px]">
                          <th className="pb-1 font-semibold">รายการอะไหล่ / อุปกรณ์</th>
                          <th className="pb-1 font-semibold text-center">จำนวน</th>
                          <th className="pb-1 font-semibold text-right">ราคา/หน่วย</th>
                          <th className="pb-1 font-semibold text-right">รวม (บาท)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {selectedTicket.partsUsed.map((p, i) => (
                          <tr key={i}>
                            <td className="py-1.5 font-medium text-slate-800">{p.name}</td>
                            <td className="py-1.5 text-center">{p.quantity}</td>
                            <td className="py-1.5 text-right font-mono">฿{p.unitPrice.toLocaleString()}</td>
                            <td className="py-1.5 text-right font-mono font-bold text-slate-900">
                              ฿{(p.quantity * p.unitPrice).toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic">ไม่มีรายการเบิกอะไหล่ (งานตรวจเช็ค / บำรุงรักษาปกติ)</p>
                )}
              </div>

              {/* 3. Photo Comparison: Before vs After */}
              <div className="space-y-2">
                <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4 text-slate-600" />
                  <span>หลักฐานภาพถ่าย ก่อนซ่อม vs หลังซ่อม (Before & After Photo Proof)</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Before */}
                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                    <span className="text-xs font-semibold text-slate-700 block mb-2 flex items-center gap-1">
                      <span>📷 ภาพถ่ายจุดเกิดเหตุ (ก่อนซ่อม)</span>
                    </span>
                    {selectedTicket.images && selectedTicket.images.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {selectedTicket.images.map((img, i) => (
                          <img 
                            key={i} 
                            src={img} 
                            alt="Before" 
                            onClick={() => setPreviewImage(img)}
                            className="w-24 h-24 rounded-xl object-cover border border-slate-300 shadow-2xs hover:opacity-90 cursor-pointer" 
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="h-24 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 text-xs">
                        ไม่มีรูปภาพก่อนซ่อม
                      </div>
                    )}
                  </div>

                  {/* After */}
                  <div className="p-3.5 bg-emerald-50/70 rounded-2xl border border-emerald-200">
                    <span className="text-xs font-semibold text-emerald-800 block mb-2 flex items-center gap-1">
                      <span>✨ ภาพถ่ายผลงานของช่าง (หลังซ่อมเสร็จ)</span>
                    </span>
                    {selectedTicket.repairImages && selectedTicket.repairImages.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {selectedTicket.repairImages.map((img, i) => (
                          <img 
                            key={i} 
                            src={img} 
                            alt="After" 
                            onClick={() => setPreviewImage(img)}
                            className="w-24 h-24 rounded-xl object-cover border border-emerald-300 shadow-2xs hover:opacity-90 cursor-pointer" 
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="h-24 bg-emerald-100/50 rounded-xl flex items-center justify-center text-emerald-700 text-xs">
                        ไม่มีรูปภาพหลังซ่อม
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* 4. Inspection Checklist (Interactive Pass/Fail toggles) */}
              <div className="p-4 bg-amber-50/60 rounded-2xl border border-amber-200 space-y-3">
                <h4 className="font-bold text-xs text-amber-900 uppercase tracking-wider flex items-center justify-between">
                  <span>เช็คลิสต์ตรวจรับมาตรฐานงานซ่อม (Inspection Criteria Checklist):</span>
                  <span className="text-[11px] text-amber-700 font-normal">คลิกทำเครื่องหมายเพื่อยืนยัน</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                  <label className="flex items-center space-x-2.5 p-2 bg-white rounded-xl border border-amber-200/80 cursor-pointer hover:bg-amber-50">
                    <input
                      type="checkbox"
                      checked={checklist.cleanliness}
                      onChange={(e) => setChecklist({ ...checklist, cleanliness: e.target.checked })}
                      className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                    />
                    <span className="font-medium text-slate-800">1. ความสะอาดเรียบร้อยของพื้นที่หลังซ่อม</span>
                  </label>

                  <label className="flex items-center space-x-2.5 p-2 bg-white rounded-xl border border-amber-200/80 cursor-pointer hover:bg-amber-50">
                    <input
                      type="checkbox"
                      checked={checklist.functionality}
                      onChange={(e) => setChecklist({ ...checklist, functionality: e.target.checked })}
                      className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                    />
                    <span className="font-medium text-slate-800">2. อุปกรณ์/ระบบทำงานได้ปกติ 100%</span>
                  </label>

                  <label className="flex items-center space-x-2.5 p-2 bg-white rounded-xl border border-amber-200/80 cursor-pointer hover:bg-amber-50">
                    <input
                      type="checkbox"
                      checked={checklist.workmanship}
                      onChange={(e) => setChecklist({ ...checklist, workmanship: e.target.checked })}
                      className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                    />
                    <span className="font-medium text-slate-800">3. ความประณีตของงานและเก็บเครื่องมือ</span>
                  </label>

                  <label className="flex items-center space-x-2.5 p-2 bg-white rounded-xl border border-amber-200/80 cursor-pointer hover:bg-amber-50">
                    <input
                      type="checkbox"
                      checked={checklist.safety}
                      onChange={(e) => setChecklist({ ...checklist, safety: e.target.checked })}
                      className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                    />
                    <span className="font-medium text-slate-800">4. ปลอดภัย ไม่มีสายไฟหรือน้ำรั่วซึมตกค้าง</span>
                  </label>
                </div>
              </div>

              {/* 5. Evaluation & Multi-criteria Ratings Form */}
              <div className="p-5 bg-gradient-to-br from-amber-50 to-orange-50/50 rounded-2xl border border-amber-200 space-y-4">
                <h4 className="font-bold text-xs text-amber-900 uppercase tracking-wider flex items-center justify-between">
                  <span>การประเมินคุณภาพงาน & ให้คะแนนความพึงพอใจ:</span>
                  <span className="font-bold text-amber-800">คะแนนเฉลี่ย: {averageRating} / 5 ดาว</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Rating 1: Quality */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      1. คุณภาพผลงานซ่อม:
                    </label>
                    <div className="flex items-center space-x-1">
                      {[1, 2, 3, 4, 5].map(star => (
                        <button
                          type="button"
                          key={star}
                          onClick={() => setQualityRating(star)}
                          className="p-1 hover:scale-110 transition-transform cursor-pointer"
                        >
                          <Star className={`w-5 h-5 ${star <= qualityRating ? 'text-amber-400 fill-amber-400' : 'text-slate-300'}`} />
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Rating 2: Speed */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      2. ความรวดเร็วในการแก้ไข:
                    </label>
                    <div className="flex items-center space-x-1">
                      {[1, 2, 3, 4, 5].map(star => (
                        <button
                          type="button"
                          key={star}
                          onClick={() => setSpeedRating(star)}
                          className="p-1 hover:scale-110 transition-transform cursor-pointer"
                        >
                          <Star className={`w-5 h-5 ${star <= speedRating ? 'text-amber-400 fill-amber-400' : 'text-slate-300'}`} />
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Rating 3: Cleanliness */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      3. ความสะอาดเรียบร้อย:
                    </label>
                    <div className="flex items-center space-x-1">
                      {[1, 2, 3, 4, 5].map(star => (
                        <button
                          type="button"
                          key={star}
                          onClick={() => setCleanlinessRating(star)}
                          className="p-1 hover:scale-110 transition-transform cursor-pointer"
                        >
                          <Star className={`w-5 h-5 ${star <= cleanlinessRating ? 'text-amber-400 fill-amber-400' : 'text-slate-300'}`} />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Inspector Signature and Feedback */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-amber-200/60">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      ชื่อผู้ตรวจรับงาน (Inspector Name):
                    </label>
                    <input
                      type="text"
                      value={inspectorName}
                      onChange={(e) => setInspectorName(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-amber-300 rounded-xl text-xs text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      แผนกผู้ตรวจรับ (Department):
                    </label>
                    <select
                      value={inspectorDept}
                      onChange={(e) => setInspectorDept(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-amber-300 rounded-xl text-xs text-slate-800"
                    >
                      <option value="แม่บ้าน">แผนกแม่บ้าน (Housekeeping)</option>
                      <option value="พนักงานต้อนรับ (GSA)">พนักงานต้อนรับ (GSA)</option>
                      <option value="ผู้จัดการโรงแรม (HM)">ผู้จัดการโรงแรม (HM)</option>
                      <option value="ผู้ดูแลระบบ / Admin">ผู้ดูแลระบบ / Admin</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    ข้อคิดเห็น / คำแนะนำตรวจรับ (Inspection Comments):
                  </label>
                  <input
                    type="text"
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder="เช่น งานเรียบร้อยดี, อุปกรณ์ใช้งานได้สมบูรณ์, สีแห้งสนิท..."
                    className="w-full px-3.5 py-2.5 bg-white border border-amber-300 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                {/* Action Buttons */}
                <div className="pt-2 flex flex-col sm:flex-row gap-3">
                  <button
                    type="button"
                    onClick={handleApprove}
                    disabled={isSubmitting}
                    className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md flex items-center justify-center space-x-2 transition-all cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>อนุมัติผ่านงาน & ปิดจ็อบ (Approve & Close Job)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowRejectModal(true)}
                    disabled={isSubmitting}
                    className="py-3 px-4 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center space-x-1.5"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>ส่งกลับให้ช่างแก้ไข (Reject)</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-12 border border-sky-100 shadow-2xs text-center space-y-4">
              <ShieldCheck className="w-14 h-14 text-amber-500 mx-auto opacity-80" />
              <div>
                <h3 className="text-lg font-bold text-slate-800">เลือกรายการที่ต้องการตรวจรับงาน</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto leading-relaxed">
                  คลิกเลือกรายการแจ้งซ่อมจากคิวด้านซ้าย เพื่อดูรายละเอียดอะไหล่ ค่าใช้จ่าย ภาพถ่ายเปรียบเทียบก่อน-หลังซ่อม และทำการประเมินเช็คลิสต์
                </p>
              </div>

              {recentlyCompletedTickets.length > 0 && (
                <div className="pt-6 border-t border-slate-100 text-left">
                  <h4 className="font-bold text-xs text-slate-700 mb-3 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>งานที่ตรวจรับเสร็จสิ้นแล้วล่าสุด ({recentlyCompletedTickets.length})</span>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {recentlyCompletedTickets.map(t => (
                      <div key={t.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                        <div>
                          <span className="font-mono font-bold text-slate-800">{t.id}</span>
                          <span className="text-slate-600 ml-1.5">{t.area} ({t.roomNumber})</span>
                        </div>
                        <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-emerald-100 text-emerald-800">
                          ผ่านตรวจรับ ⭐ {t.inspection?.rating || 5}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Reject Modal */}
      {showRejectModal && selectedTicket && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 border border-rose-200 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center space-x-2 text-rose-600">
              <RotateCcw className="w-5 h-5" />
              <h3 className="text-base font-bold text-slate-900">ส่งงานกลับให้ช่างแก้ไข ({selectedTicket.id})</h3>
            </div>

            <p className="text-xs text-slate-600">
              ระบุสาเหตุและจุดที่ต้องการให้ช่างดำเนินการแก้ไขเพิ่มเติมก่อนส่งตรวจรับใหม่อีกครั้ง:
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                หมวดหมู่สาเหตุที่ส่งกลับ:
              </label>
              <select
                value={rejectReasonCategory}
                onChange={(e) => setRejectReasonCategory(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800"
              >
                <option value="งานยังไม่เรียบร้อยสมบูรณ์">งานยังไม่เรียบร้อยสมบูรณ์</option>
                <option value="อาการเดิมยังไม่หายสนิท">อาการเดิมยังไม่หายสนิท</option>
                <option value="บริเวณหน้างานยังไม่สะอาด/ไม่เก็บเครื่องมือ">บริเวณหน้างานยังไม่สะอาด / ไม่เก็บเครื่องมือ</option>
                <option value="สี/วัสดุไม่เรียบเนียน">สี / วัสดุไม่เรียบเนียน</option>
                <option value="ต้องเปลี่ยนอะไหล่เพิ่มเติม">ต้องเปลี่ยนอะไหล่เพิ่มเติม</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                รายละเอียดเพิ่มเติมถึงช่าง:
              </label>
              <textarea
                rows={3}
                value={rejectDetails}
                onChange={(e) => setRejectDetails(e.target.value)}
                placeholder="ระบุจุดที่ต้องปรับปรุง เช่น บานพับยังมีเสียงดัง, ขอบบัวสียังมีรอย..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800"
              />
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowRejectModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleRejectConfirm}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer"
              >
                ยืนยันส่งกลับแก้ไข
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Preview Lightbox */}
      {previewImage && (
        <div 
          onClick={() => setPreviewImage(null)} 
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 cursor-pointer"
        >
          <img src={previewImage} alt="Enlarged preview" className="max-w-full max-h-[85vh] rounded-2xl shadow-2xl object-contain" />
        </div>
      )}

      {/* Manual LINE Trigger Modal */}
      <LineNotifyModal 
        isOpen={isLineModalOpen} 
        onClose={() => setIsLineModalOpen(false)} 
        ticket={selectedTicket} 
        defaultType="pending_inspection"
      />
    </div>
  );
};

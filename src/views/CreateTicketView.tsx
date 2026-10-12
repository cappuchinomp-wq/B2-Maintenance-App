import React, { useState, useRef } from 'react';
import { useMaintenance } from '../context/MaintenanceContext';
import { 
  LocationArea, 
  WorkCategory, 
  Department, 
  UrgencyLevel,
  RoomType
} from '../types/maintenance';
import { 
  HOTEL_FLOORS, 
  ROOM_SUFFIXES, 
  ROOM_SUFFIX_MAP, 
  ROOM_TYPE_NAMES, 
  COMMON_AREAS 
} from '../data/mockData';
import { 
  CheckCircle2, 
  Upload, 
  X, 
  Image as ImageIcon, 
  Camera, 
  AlertCircle, 
  Zap, 
  Flame, 
  Wrench, 
  Sparkles,
  Phone,
  Building,
  Info
} from 'lucide-react';
import confetti from 'canvas-confetti';

const AREA_OPTIONS: LocationArea[] = [
  'ห้องพัก',
  'ลอบบี้',
  'ห้องประชุม / จัดเลี้ยง',
  'ห้องน้ำส่วนกลาง',
  'ออฟฟิศ',
  'สโตร์เก็บของ',
  'อื่นๆ'
];

const DEPARTMENT_OPTIONS: Department[] = [
  'พนักงานต้อนรับ (GSA)',
  'แม่บ้าน',
  'ช่างอาคาร',
  'พนักงานรักษาความปลอดภัย',
  'บัญชี',
  'ผู้จัดการโรงแรม (HM)',
  'Owner',
  'อื่นๆ'
];

const CATEGORY_ITEMS: { id: WorkCategory; label: string; iconEmoji: string }[] = [
  { id: 'ไฟฟ้า', label: 'ไฟฟ้า', iconEmoji: '💡' },
  { id: 'แอร์', label: 'แอร์', iconEmoji: '❄️' },
  { id: 'ประปา', label: 'ประปา', iconEmoji: '💧' },
  { id: 'เฟอร์นิเจอร์', label: 'เฟอร์นิเจอร์', iconEmoji: '🪵' },
  { id: 'ไอที / อินเตอร์เน็ต', label: 'ไอที / อินเตอร์เน็ต', iconEmoji: '🌐' },
  { id: 'Fire Alarm', label: 'Fire Alarm', iconEmoji: '🚨' },
  { id: 'งานสี / โครงสร้างอาคาร', label: 'งานสี / โครงสร้างอาคาร', iconEmoji: '🖌️' },
  { id: 'อื่นๆ', label: 'อื่นๆ', iconEmoji: '🛠️' },
];

const URGENCY_OPTIONS: { id: UrgencyLevel; label: string; subtext: string; color: string; activeBg: string }[] = [
  { 
    id: 'Critical', 
    label: 'Critical', 
    subtext: 'กระทบความปลอดภัย / ห้องขายไม่ได้', 
    color: 'text-red-700 border-red-300 bg-red-50/70',
    activeBg: 'bg-red-600 text-white border-red-600 shadow-md shadow-red-500/20' 
  },
  { 
    id: 'High', 
    label: 'High', 
    subtext: 'กระทบแขกโดยตรง', 
    color: 'text-orange-700 border-orange-300 bg-orange-50/70',
    activeBg: 'bg-orange-500 text-white border-orange-500 shadow-md shadow-orange-500/20' 
  },
  { 
    id: 'Medium', 
    label: 'Medium', 
    subtext: 'ใช้งานได้แต่ไม่สมบูรณ์', 
    color: 'text-amber-700 border-amber-300 bg-amber-50/70',
    activeBg: 'bg-amber-500 text-white border-amber-500 shadow-md shadow-amber-500/20' 
  },
  { 
    id: 'Low', 
    label: 'Low', 
    subtext: 'งานทั่วไป', 
    color: 'text-slate-700 border-slate-300 bg-slate-50/70',
    activeBg: 'bg-slate-700 text-white border-slate-700 shadow-md shadow-slate-500/20' 
  },
];

export const CreateTicketView: React.FC = () => {
  const { createTicket, currentUser, setActiveTab, settings } = useMaintenance();

  // Form State
  const [area, setArea] = useState<LocationArea | ''>('ห้องพัก');
  const [selectedFloor, setSelectedFloor] = useState<number>(3);
  const [roomNumber, setRoomNumber] = useState<string>('304');
  const [department, setDepartment] = useState<Department | ''>(currentUser?.department || 'พนักงานต้อนรับ (GSA)');
  const [category, setCategory] = useState<WorkCategory>('ไฟฟ้า');
  const [reporterPhone, setReporterPhone] = useState<string>(currentUser?.phone || '0812345678');
  const [reporterName, setReporterName] = useState<string>(currentUser?.displayName || 'พนักงานต้อนรับ');
  const [description, setDescription] = useState<string>('');
  const [urgency, setUrgency] = useState<UrgencyLevel>('Medium');
  const [images, setImages] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successTicketId, setSuccessTicketId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach(file => {
      if (!file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onload = (loadEvt) => {
        if (loadEvt.target?.result) {
          setImages(prev => [...prev, loadEvt.target!.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    if (!area) {
      setErrorMessage('กรุณาเลือกพื้นที่ / อาคาร');
      return;
    }
    if (!roomNumber.trim()) {
      setErrorMessage('กรุณาระบุเลขห้องหรือจุดเกิดเหตุ เช่น 304 หรือ ลอบบี้ชั้น 1');
      return;
    }
    if (!department) {
      setErrorMessage('กรุณาเลือกแผนก');
      return;
    }
    if (!description.trim()) {
      setErrorMessage('กรุณากรอกรายละเอียดอาการเสีย');
      return;
    }

    setIsSubmitting(true);
    try {
      const created = await createTicket({
        area,
        roomNumber: roomNumber.trim(),
        department,
        category,
        urgency,
        description: description.trim(),
        reporterName: reporterName.trim() || 'ผู้แจ้ง',
        reporterPhone: reporterPhone.trim() || '0812345678',
        images
      });

      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });

      setSuccessTicketId(created.id);
      setIsSubmitting(false);
    } catch (err: any) {
      setErrorMessage('เกิดข้อผิดพลาด: ' + (err.message || 'ไม่สามารถส่งแจ้งซ่อมได้'));
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setDescription('');
    setImages([]);
    setSuccessTicketId(null);
  };

  return (
    <div className="max-w-4xl mx-auto py-6 px-4 sm:px-6">
      {/* Success Modal */}
      {successTicketId && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-sky-100 text-center animate-in zoom-in-95">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">ส่งแจ้งซ่อมสำเร็จ!</h3>
            <p className="text-sm text-slate-600 mt-1">
              รหัสแจ้งซ่อมของคุณคือ <span className="font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">{successTicketId}</span>
            </p>

            <div className="mt-4 p-4 bg-sky-50 rounded-2xl text-left border border-sky-100 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500">สถานที่:</span>
                <span className="font-semibold text-slate-800">{area} ({roomNumber})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">ประเภทงาน:</span>
                <span className="font-semibold text-slate-800">{category}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">ระดับความเร่งด่วน:</span>
                <span className="font-bold text-orange-600">{urgency}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">สถานะ:</span>
                <span className="font-semibold text-blue-700">รอดำเนินการ (ส่งเข้า LINE / Google Sheets แล้ว)</span>
              </div>
            </div>

            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => {
                  resetForm();
                  setActiveTab('tracking');
                }}
                className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-md transition-colors"
              >
                ดูสถานะในหน้าติดตามงาน
              </button>
              <button
                onClick={resetForm}
                className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-xl transition-colors"
              >
                แจ้งซ่อมรายการอื่นเพิ่ม
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Form Card */}
      <div className="bg-white rounded-3xl shadow-sm border border-sky-100 overflow-hidden">
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-700 p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <span className="px-2.5 py-1 text-[11px] font-semibold bg-white/20 rounded-full backdrop-blur-xs text-sky-100 uppercase tracking-wider">
                Hotel Service Request
              </span>
              <h2 className="text-2xl font-bold mt-2">แบบฟอร์มแจ้งซ่อมห้องพักและอาคาร</h2>
              <p className="text-xs sm:text-sm text-sky-100 mt-1">
                กรอกข้อมูลอาการเสียเพื่อส่งมอบงานให้ช่างเข้าตรวจสอบและแจ้งเตือน Real-time ทันที
              </p>
            </div>
            <div className="hidden sm:flex w-12 h-12 bg-white/10 rounded-2xl items-center justify-center backdrop-blur-md">
              <Sparkles className="w-6 h-6 text-sky-200" />
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
          {errorMessage && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                <span>{errorMessage}</span>
              </div>
              <button
                type="button"
                onClick={() => setErrorMessage(null)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold px-2 py-1 cursor-pointer"
              >
                ✕
              </button>
            </div>
          )}

          {/* Row 1: พื้นที่ / อาคาร + เลขห้อง/จุดเกิดเหตุ */}
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1.5">
                  พื้นที่ / อาคาร <span className="text-red-500">*</span>
                </label>
                <select
                  value={area}
                  onChange={(e) => {
                    const newArea = e.target.value as LocationArea;
                    setArea(newArea);
                    if (newArea === 'ห้องพัก' && !roomNumber.match(/^[3-9][0-9]{2}$/)) {
                      setRoomNumber('304');
                    }
                  }}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 text-sm focus:bg-white focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all cursor-pointer"
                  required
                >
                  <option value="" disabled>เลือกพื้นที่ / อาคาร</option>
                  {AREA_OPTIONS.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1.5 flex items-center justify-between">
                  <span>เลขห้อง / จุดเกิดเหตุ <span className="text-red-500">*</span></span>
                  {area === 'ห้องพัก' && (
                    <span className="text-[11px] font-normal text-slate-500">
                      (ชั้น 3-9 • 18 ห้อง/ชั้น)
                    </span>
                  )}
                </label>
                <input
                  type="text"
                  value={roomNumber}
                  onChange={(e) => setRoomNumber(e.target.value)}
                  placeholder="เช่น 304, ลอบบี้ชั้น 1, ห้องประชุม A"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 text-sm focus:bg-white focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all"
                  required
                />
              </div>
            </div>

            {/* Interactive Room Picker for Guest Rooms (ชั้น 3 ถึง ชั้น 9) */}
            {area === 'ห้องพัก' && (
              <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200/90 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center space-x-2">
                    <Building className="w-4 h-4 text-sky-600" />
                    <span className="text-xs font-bold text-slate-800">
                      เลือกห้องพักรวดเร็ว: ชั้น {selectedFloor}
                    </span>
                  </div>

                  {/* Floor Selector Tabs */}
                  <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
                    {HOTEL_FLOORS.map(floor => (
                      <button
                        type="button"
                        key={floor}
                        onClick={() => {
                          setSelectedFloor(floor);
                          setRoomNumber(`${floor}01`);
                        }}
                        className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                          selectedFloor === floor
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        ชั้น {floor}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Room Types Legend */}
                <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-slate-600 pt-1 border-t border-slate-200/60">
                  <span className="font-semibold text-slate-500 mr-1">ผังห้อง:</span>
                  <span className="px-1.5 py-0.5 rounded bg-sky-100 text-sky-800 font-medium">01, 03: SUP_TWN</span>
                  <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-medium">02, 04, 10, 12, 13, 15: DLX_TRP</span>
                  <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-medium">05, 11, 17: SUP_DBL</span>
                  <span className="px-1.5 py-0.5 rounded bg-purple-100 text-purple-800 font-medium">19, 20: LUX_TRP</span>
                  <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 font-medium">06, 08, 14, 16, 18: DLX_DBL</span>
                </div>

                {/* 18 Rooms Grid for Selected Floor */}
                <div className="grid grid-cols-3 sm:grid-cols-6 lg:grid-cols-9 gap-2">
                  {ROOM_SUFFIXES.map(suffix => {
                    const rNum = `${selectedFloor}${suffix}`;
                    const rType = ROOM_SUFFIX_MAP[suffix];
                    const typeConfig = ROOM_TYPE_NAMES[rType];
                    const isSelected = roomNumber === rNum;

                    return (
                      <button
                        type="button"
                        key={rNum}
                        onClick={() => setRoomNumber(rNum)}
                        className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-blue-700 text-white border-blue-700 shadow-sm font-bold ring-2 ring-blue-300'
                            : 'bg-white hover:bg-slate-100 border-slate-200 text-slate-800'
                        }`}
                      >
                        <div className="text-xs font-bold">{rNum}</div>
                        <span className={`text-[9px] px-1 py-0.2 rounded font-semibold inline-block mt-0.5 ${
                          isSelected ? 'bg-white/20 text-white' : `${typeConfig.bg} ${typeConfig.color}`
                        }`}>
                          {rType}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Quick chips for Common Areas */}
            {area !== 'ห้องพัก' && (
              <div className="p-3 bg-slate-50/80 rounded-2xl border border-slate-200/90 space-y-2">
                <span className="text-xs font-semibold text-slate-700 block">
                  💡 จุดบริการและพื้นที่ส่วนกลางยอดนิยม:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {COMMON_AREAS.slice(0, 8).map(loc => (
                    <button
                      type="button"
                      key={loc}
                      onClick={() => setRoomNumber(loc)}
                      className={`px-2.5 py-1 text-xs rounded-lg border transition-all cursor-pointer ${
                        roomNumber === loc
                          ? 'bg-blue-600 text-white border-blue-600 font-semibold'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {loc}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Row 2: แผนก */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1.5">
              แผนก <span className="text-red-500">*</span>
            </label>
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value as Department)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 text-sm focus:bg-white focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all cursor-pointer"
              required
            >
              <option value="" disabled>เลือกแผนก</option>
              {DEPARTMENT_OPTIONS.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>

          {/* Row 3: ประเภทงาน (Grid Buttons with Emoji Matching Image 2) */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-2">
              ประเภทงาน <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {CATEGORY_ITEMS.map(cat => {
                const isSelected = category === cat.id;
                return (
                  <button
                    type="button"
                    key={cat.id}
                    onClick={() => setCategory(cat.id)}
                    className={`py-3 px-3 rounded-xl border text-sm font-medium transition-all flex items-center justify-center space-x-2 ${
                      isSelected
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-500/20 font-semibold scale-[1.02]'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    <span className="text-base">{cat.iconEmoji}</span>
                    <span className="truncate">{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Row 4: ชื่อผู้แจ้ง & เบอร์ติดต่อ */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1.5">
                ชื่อผู้แจ้ง <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={reporterName}
                onChange={(e) => setReporterName(e.target.value)}
                placeholder="เช่น ณภัทร (GSA กะเช้า)"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 text-sm focus:bg-white focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1.5">
                เบอร์ติดต่อ <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                value={reporterPhone}
                onChange={(e) => setReporterPhone(e.target.value)}
                placeholder="เช่น 0812345678"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 text-sm focus:bg-white focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all"
                required
              />
            </div>
          </div>

          {/* Row 5: รายละเอียดอาการเสีย */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1.5">
              รายละเอียดอาการเสีย <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="อธิบายปัญหาเพิ่มเติม เช่น แอร์ไม่เย็น มีน้ำหยดลงเตียง, ก๊อกน้ำปิดไม่สนิท, ไฟหน้ากระจกไม่ติด..."
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 text-sm focus:bg-white focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all"
              required
            />
          </div>

          {/* Row 6: แนบรูปภาพ */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1.5">
              แนบรูปภาพ (ก่อนซ่อม)
            </label>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                className="w-full sm:w-auto text-xs text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border file:border-slate-300 file:text-xs file:font-semibold file:bg-slate-50 hover:file:bg-slate-100 cursor-pointer"
              />
            </div>

            {/* Uploaded Images Preview */}
            {images.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2.5">
                {images.map((img, idx) => (
                  <div key={idx} className="relative group w-20 h-20 rounded-xl overflow-hidden border border-slate-300 shadow-2xs">
                    <img src={img} alt="Preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeImage(idx)}
                      className="absolute top-1 right-1 bg-rose-600 text-white rounded-full p-0.5 shadow-md opacity-90 hover:opacity-100"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Row 7: ระดับความเร่งด่วน (Grid Cards Matching Image 4) */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-2">
              ระดับความเร่งด่วน <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
              {URGENCY_OPTIONS.map(opt => {
                const isSelected = urgency === opt.id;
                return (
                  <button
                    type="button"
                    key={opt.id}
                    onClick={() => setUrgency(opt.id)}
                    className={`p-3.5 rounded-2xl border text-left transition-all ${
                      isSelected
                        ? opt.activeBg
                        : `${opt.color} hover:shadow-xs`
                    }`}
                  >
                    <div className="font-bold text-sm flex items-center justify-between">
                      <span>{opt.label}</span>
                      {opt.id === 'Critical' && <Flame className="w-4 h-4" />}
                    </div>
                    <p className={`text-[11px] mt-1 line-clamp-2 ${isSelected ? 'text-white/90' : 'opacity-80'}`}>
                      {opt.subtext}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Submit Button (Matching Green button in Screenshot 4) */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-base font-bold shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>กำลังส่งข้อมูลและแจ้งเตือน Real-time...</span>
                </>
              ) : (
                <span>ส่งแจ้งซ่อม</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

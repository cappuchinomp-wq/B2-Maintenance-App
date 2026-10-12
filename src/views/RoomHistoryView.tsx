import React, { useState, useMemo } from 'react';
import { useMaintenance } from '../context/MaintenanceContext';
import { 
  HOTEL_ROOMS, 
  HOTEL_ROOM_DETAILS, 
  HOTEL_FLOORS, 
  ROOM_TYPE_NAMES, 
  ROOM_SUFFIX_MAP,
  COMMON_AREAS 
} from '../data/mockData';
import { RoomType } from '../types/maintenance';
import { 
  Building2, 
  Search, 
  History, 
  Wrench, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  DollarSign, 
  PlusCircle,
  ShieldCheck,
  Zap,
  Layers,
  Sparkles,
  Filter
} from 'lucide-react';

export const RoomHistoryView: React.FC = () => {
  const { tickets, setActiveTab } = useMaintenance();
  const [selectedRoom, setSelectedRoom] = useState<string>('304');
  const [roomFilter, setRoomFilter] = useState<'all' | 'guest_rooms' | 'common_areas'>('guest_rooms');
  const [selectedFloor, setSelectedFloor] = useState<number | 'all'>('all');
  const [selectedRoomType, setSelectedRoomType] = useState<RoomType | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Determine room type info if it's a guest room
  const selectedRoomDetail = useMemo(() => {
    return HOTEL_ROOM_DETAILS.find(r => r.number === selectedRoom);
  }, [selectedRoom]);

  // Find all tickets for selected room
  const roomTickets = tickets.filter(t => 
    t.roomNumber.toLowerCase().includes(selectedRoom.toLowerCase()) ||
    t.area.toLowerCase().includes(selectedRoom.toLowerCase())
  );

  const pendingCount = roomTickets.filter(t => t.status !== 'completed').length;
  const completedCount = roomTickets.filter(t => t.status === 'completed').length;
  const totalCost = roomTickets.reduce((sum, t) => sum + (t.totalCost || 0), 0);

  // Category breakdown for selected room
  const catBreakdown = roomTickets.reduce((acc, t) => {
    acc[t.category] = (acc[t.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Determine room health status
  let healthBadge = {
    label: 'สภาพปกติ (Good)',
    color: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    icon: CheckCircle2
  };

  if (pendingCount > 0) {
    healthBadge = {
      label: `มีงานซ่อมค้าง (${pendingCount} รายการ)`,
      color: 'bg-red-100 text-red-800 border-red-300',
      icon: AlertCircle
    };
  } else if (roomTickets.length > 2) {
    healthBadge = {
      label: 'เฝ้าระวัง (เคยซ่อมบ่อย)',
      color: 'bg-amber-100 text-amber-800 border-amber-300',
      icon: Clock
    };
  }

  const HealthIcon = healthBadge.icon;

  // Filtered rooms list
  const filteredRooms = useMemo(() => {
    if (roomFilter === 'common_areas') {
      return COMMON_AREAS.filter(r => r.toLowerCase().includes(searchTerm.toLowerCase()));
    }

    if (roomFilter === 'guest_rooms') {
      return HOTEL_ROOM_DETAILS.filter(r => {
        const matchesSearch = r.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                              r.typeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                              r.type.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFloor = selectedFloor === 'all' || r.floor === selectedFloor;
        const matchesType = selectedRoomType === 'all' || r.type === selectedRoomType;
        return matchesSearch && matchesFloor && matchesType;
      }).map(r => r.number);
    }

    // All (Guest rooms + common areas)
    const gRooms = HOTEL_ROOMS.filter(r => r.toLowerCase().includes(searchTerm.toLowerCase()));
    const cAreas = COMMON_AREAS.filter(r => r.toLowerCase().includes(searchTerm.toLowerCase()));
    return [...gRooms, ...cAreas];
  }, [roomFilter, selectedFloor, selectedRoomType, searchTerm]);

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-3xl p-6 border border-sky-100 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-sky-100 text-sky-800">
                Hotel Room Layout
              </span>
              <span className="text-xs font-medium text-slate-500">
                7 ชั้น (ชั้น 3-9) • 18 ห้อง/ชั้น รวม 126 ห้อง
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">ประวัติห้องพักและสถานที่ (Room & Location History)</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              ตรวจสอบประวัติการแจ้งซ่อมย้อนหลัง ปัญหาที่เกิดซ้ำ ค่าบำรุงรักษารายห้อง และแบบห้องพัก (Room Type)
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                setRoomFilter('guest_rooms');
              }}
              className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                roomFilter === 'guest_rooms' ? 'bg-sky-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              🏨 ห้องพัก (126 ห้อง)
            </button>
            <button
              onClick={() => {
                setRoomFilter('common_areas');
              }}
              className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                roomFilter === 'common_areas' ? 'bg-sky-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              🏛️ พื้นที่ส่วนกลาง
            </button>
          </div>
        </div>

        {/* Room Type Legend Reference */}
        <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
          {(Object.entries(ROOM_TYPE_NAMES) as [RoomType, { label: string; desc: string; color: string; bg: string }][]).map(([typeKey, config]) => {
            let roomsStr = '';
            if (typeKey === 'SUP_TWN') roomsStr = '01, 03';
            else if (typeKey === 'DLX_TRP') roomsStr = '02, 04, 10, 12, 13, 15';
            else if (typeKey === 'SUP_DBL') roomsStr = '05, 11, 17';
            else if (typeKey === 'LUX_TRP') roomsStr = '19, 20';
            else if (typeKey === 'DLX_DBL') roomsStr = '06, 08, 14, 16, 18';

            return (
              <div key={typeKey} className={`p-2 rounded-xl border ${config.bg} text-xs`}>
                <div className="flex items-center justify-between">
                  <span className={`font-bold ${config.color}`}>{config.label}</span>
                  <span className="text-[10px] text-slate-500 font-mono">({roomsStr})</span>
                </div>
                <p className="text-[11px] text-slate-600 truncate mt-0.5">{config.desc}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Grid: Room Selector List + Room Detail Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Room Grid Selector */}
        <div className="bg-white rounded-3xl p-5 border border-sky-100 shadow-2xs space-y-4">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="ค้นหาเลขห้อง เช่น 304, SUP_TWN..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-sky-500"
            />
          </div>

          {/* Filters for Guest Rooms: Floor & Room Type */}
          {roomFilter === 'guest_rooms' && (
            <div className="space-y-2.5 pb-2 border-b border-slate-100">
              {/* Floor tabs */}
              <div>
                <span className="text-[11px] font-semibold text-slate-500 block mb-1">เลือกชั้น:</span>
                <div className="flex items-center gap-1 overflow-x-auto pb-1">
                  <button
                    onClick={() => setSelectedFloor('all')}
                    className={`px-2 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                      selectedFloor === 'all' ? 'bg-blue-600 text-white shadow-2xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    ทุกชั้น
                  </button>
                  {HOTEL_FLOORS.map(fl => (
                    <button
                      key={fl}
                      onClick={() => setSelectedFloor(fl)}
                      className={`px-2 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                        selectedFloor === fl ? 'bg-blue-600 text-white shadow-2xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      ชั้น {fl}
                    </button>
                  ))}
                </div>
              </div>

              {/* Room Type tabs */}
              <div>
                <span className="text-[11px] font-semibold text-slate-500 block mb-1">ประเภทห้อง:</span>
                <div className="flex flex-wrap gap-1">
                  <button
                    onClick={() => setSelectedRoomType('all')}
                    className={`px-2 py-0.5 text-[11px] font-semibold rounded-md transition-all cursor-pointer ${
                      selectedRoomType === 'all' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    ทั้งหมด
                  </button>
                  {(Object.keys(ROOM_TYPE_NAMES) as RoomType[]).map(typeKey => (
                    <button
                      key={typeKey}
                      onClick={() => setSelectedRoomType(typeKey)}
                      className={`px-2 py-0.5 text-[11px] font-semibold rounded-md transition-all cursor-pointer ${
                        selectedRoomType === typeKey ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {typeKey}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Rooms Grid */}
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-[520px] overflow-y-auto pr-1">
            {filteredRooms.map(room => {
              const countForThisRoom = tickets.filter(t => t.roomNumber.includes(room) || t.area.includes(room)).length;
              const hasActiveRepair = tickets.some(t => (t.roomNumber.includes(room) || t.area.includes(room)) && t.status !== 'completed');
              const isSelected = selectedRoom === room;
              const detail = HOTEL_ROOM_DETAILS.find(d => d.number === room);

              return (
                <button
                  key={room}
                  onClick={() => setSelectedRoom(room)}
                  className={`p-2 rounded-xl border text-center transition-all relative cursor-pointer ${
                    isSelected
                      ? 'bg-blue-700 text-white border-blue-700 shadow-sm font-bold ring-2 ring-blue-300'
                      : hasActiveRepair
                        ? 'bg-red-50 text-red-800 border-red-200 hover:bg-red-100 font-semibold'
                        : countForThisRoom > 0
                          ? 'bg-amber-50/70 text-amber-900 border-amber-200 hover:bg-amber-100'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <span className="text-xs truncate block font-bold">{room}</span>
                  {detail && (
                    <span className={`text-[8px] px-1 py-0.2 rounded font-semibold inline-block mt-0.5 ${
                      isSelected ? 'bg-white/20 text-white' : `${ROOM_TYPE_NAMES[detail.type].bg} ${ROOM_TYPE_NAMES[detail.type].color}`
                    }`}>
                      {detail.type}
                    </span>
                  )}
                  {countForThisRoom > 0 && (
                    <span className={`text-[9px] font-medium block mt-0.5 ${isSelected ? 'text-blue-100' : 'text-slate-500'}`}>
                      {countForThisRoom} งาน
                    </span>
                  )}
                  {hasActiveRepair && (
                    <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-ping" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column: Selected Room History Summary & Timeline */}
        <div className="lg:col-span-2 space-y-4">
          {/* Room Header Info Card */}
          <div className="bg-white rounded-3xl p-6 border border-sky-100 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="px-2.5 py-0.5 bg-blue-100 text-blue-800 font-bold text-xs rounded-lg">
                    ห้องพัก / จุดบริการ
                  </span>
                  {selectedRoomDetail && (
                    <span className={`px-2.5 py-0.5 text-xs font-bold rounded-lg border ${ROOM_TYPE_NAMES[selectedRoomDetail.type].bg} ${ROOM_TYPE_NAMES[selectedRoomDetail.type].color}`}>
                      {selectedRoomDetail.type} • {selectedRoomDetail.typeName}
                    </span>
                  )}
                  <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-lg border flex items-center gap-1 ${healthBadge.color}`}>
                    <HealthIcon className="w-3.5 h-3.5" />
                    <span>{healthBadge.label}</span>
                  </span>
                </div>
                <h3 className="text-2xl font-black text-slate-900 mt-1.5 flex items-center gap-2">
                  <span>ห้อง {selectedRoom}</span>
                  {selectedRoomDetail && (
                    <span className="text-xs font-normal text-slate-500">(ชั้น {selectedRoomDetail.floor})</span>
                  )}
                </h3>
              </div>

              <button
                onClick={() => setActiveTab('create_ticket')}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center space-x-1.5 transition-all cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span>+ แจ้งซ่อมห้องนี้</span>
              </button>
            </div>

            {/* Room Stats */}
            <div className="grid grid-cols-3 gap-3 mt-4">
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/70 text-center">
                <span className="text-[11px] text-slate-500 block">งานแจ้งทั้งหมด</span>
                <span className="text-lg font-bold text-slate-900">{roomTickets.length} ครั้ง</span>
              </div>
              <div className="bg-emerald-50 p-3 rounded-2xl border border-emerald-200 text-center">
                <span className="text-[11px] text-emerald-700 block">ซ่อมเสร็จแล้ว</span>
                <span className="text-lg font-bold text-emerald-800">{completedCount} งาน</span>
              </div>
              <div className="bg-indigo-50 p-3 rounded-2xl border border-indigo-200 text-center">
                <span className="text-[11px] text-indigo-700 block">ค่าซ่อมสะสม</span>
                <span className="text-lg font-bold text-indigo-900">฿{totalCost.toLocaleString()}</span>
              </div>
            </div>

            {/* Category summary tags */}
            {Object.keys(catBreakdown).length > 0 && (
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center space-x-2 flex-wrap gap-1">
                <span className="text-xs font-semibold text-slate-500">ประวัติงานที่พบบ่อย:</span>
                {Object.entries(catBreakdown).map(([cat, cnt]) => (
                  <span key={cat} className="px-2.5 py-0.5 bg-sky-50 text-sky-800 text-xs font-medium rounded-md border border-sky-100">
                    {cat} ({cnt} ครั้ง)
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Timeline of Repairs */}
          <div className="bg-white rounded-3xl p-6 border border-sky-100 shadow-2xs">
            <h4 className="font-bold text-sm text-slate-800 mb-4 flex items-center gap-1.5">
              <History className="w-4 h-4 text-sky-600" />
              <span>ประวัติการแจ้งซ่อมในห้องนี้ ({roomTickets.length} รายการ)</span>
            </h4>

            {roomTickets.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                ห้องนี้ยังไม่มีประวัติการแจ้งซ่อมในระบบ
              </div>
            ) : (
              <div className="space-y-4">
                {roomTickets.map((t) => (
                  <div key={t.id} className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200/80 text-xs space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="font-mono font-bold text-blue-700">{t.id}</span>
                        <span className="ml-2 font-semibold text-slate-800">{t.category}</span>
                        <span className="ml-2 text-slate-400">({new Date(t.createdAt).toLocaleDateString('th-TH')})</span>
                      </div>
                      <span className={`px-2 py-0.5 font-bold rounded ${
                        t.status === 'completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {t.status === 'completed' ? 'เสร็จสิ้น' : 'กำลังดำเนินการ'}
                      </span>
                    </div>

                    <p className="text-slate-700">{t.description}</p>

                    {t.technicianNotes && (
                      <div className="p-2.5 bg-white rounded-xl border border-slate-200 text-[11px] text-slate-600">
                        <strong>บันทึกการซ่อม:</strong> {t.technicianNotes}
                        {t.assignedTechnician && <span className="text-slate-400 block mt-0.5">โดย: {t.assignedTechnician.name}</span>}
                      </div>
                    )}

                    {t.inspection && (
                      <div className="text-[11px] text-emerald-700 font-medium">
                        ✓ ตรวจรับงานโดย {t.inspection.inspectedBy} ({'⭐'.repeat(t.inspection.rating || 5)})
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

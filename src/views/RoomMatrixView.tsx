import React, { useState, useMemo } from 'react';
import { useMaintenance } from '../context/MaintenanceContext';
import { 
  Building2, 
  Search, 
  Filter, 
  X, 
  PlusCircle, 
  CheckCircle2, 
  ExternalLink, 
  ArrowRight,
  Sparkles,
  Info,
  Clock,
  Wrench,
  AlertTriangle,
  Layers,
  PhoneCall,
  History
} from 'lucide-react';
import { TicketStatus, UrgencyLevel, RoomType, RoomInfo } from '../types/maintenance';
import { 
  HOTEL_ROOM_DETAILS, 
  HOTEL_FLOORS, 
  ROOM_TYPE_NAMES 
} from '../data/mockData';

export type RoomMaintenanceStatus = 'in_service' | 'under_repair' | 'needs_inspection' | 'pending' | 'on_hold';

export const RoomMatrixView: React.FC = () => {
  const { tickets, setActiveTab, settings } = useMaintenance();

  // State filters
  const [matrixFloorFilter, setMatrixFloorFilter] = useState<number | 'all'>('all');
  const [matrixStatusFilter, setMatrixStatusFilter] = useState<RoomMaintenanceStatus | 'all'>('all');
  const [matrixTypeFilter, setMatrixTypeFilter] = useState<RoomType | 'all'>('all');
  const [matrixSearchQuery, setMatrixSearchQuery] = useState<string>('');
  const [selectedRoomModal, setSelectedRoomModal] = useState<{
    room: RoomInfo;
    status: RoomMaintenanceStatus;
    activeTickets: typeof tickets;
  } | null>(null);

  // Room Matrix Data Calculation (126 Rooms across Floors 3-9)
  const roomMatrixData = useMemo(() => {
    return HOTEL_ROOM_DETAILS.map(room => {
      // Find open tickets for this specific room
      const activeTickets = tickets.filter(t => 
        t.area === 'ห้องพัก' && 
        t.roomNumber === room.number && 
        t.status !== 'completed'
      );

      let status: RoomMaintenanceStatus = 'in_service';

      if (activeTickets.some(t => t.status === 'in_progress')) {
        status = 'under_repair';
      } else if (activeTickets.some(t => t.status === 'pending_inspection')) {
        status = 'needs_inspection';
      } else if (activeTickets.some(t => t.status === 'pending')) {
        status = 'pending';
      } else if (activeTickets.some(t => t.status === 'on_hold')) {
        status = 'on_hold';
      }

      return {
        room,
        status,
        activeTickets
      };
    });
  }, [tickets]);

  // Summary counts
  const roomMatrixStats = useMemo(() => {
    const inService = roomMatrixData.filter(r => r.status === 'in_service').length;
    const underRepair = roomMatrixData.filter(r => r.status === 'under_repair').length;
    const needsInspection = roomMatrixData.filter(r => r.status === 'needs_inspection').length;
    const pending = roomMatrixData.filter(r => r.status === 'pending').length;
    const total = roomMatrixData.length; // 126
    const inServicePercent = Math.round((inService / total) * 100);

    return { inService, underRepair, needsInspection, pending, total, inServicePercent };
  }, [roomMatrixData]);

  // Filtered rooms
  const filteredRooms = useMemo(() => {
    return roomMatrixData.filter(item => {
      // Floor filter
      if (matrixFloorFilter !== 'all' && item.room.floor !== matrixFloorFilter) {
        return false;
      }
      // Status filter
      if (matrixStatusFilter !== 'all' && item.status !== matrixStatusFilter) {
        return false;
      }
      // Type filter
      if (matrixTypeFilter !== 'all' && item.room.type !== matrixTypeFilter) {
        return false;
      }
      // Search query
      if (matrixSearchQuery.trim()) {
        const query = matrixSearchQuery.trim().toLowerCase();
        return item.room.number.toLowerCase().includes(query) || 
               item.room.typeName.toLowerCase().includes(query) ||
               item.room.type.toLowerCase().includes(query);
      }
      return true;
    });
  }, [roomMatrixData, matrixFloorFilter, matrixStatusFilter, matrixTypeFilter, matrixSearchQuery]);

  // Status configuration helper
  const getMatrixStatusConfig = (status: RoomMaintenanceStatus) => {
    switch (status) {
      case 'in_service':
        return {
          label: 'ปกติ พร้อมบริการ',
          badgeText: 'In Service',
          dotColor: 'bg-emerald-500',
          ringColor: 'hover:ring-emerald-400',
          bgCard: 'bg-emerald-50/60 border-emerald-200/90 text-emerald-900',
          badgeBg: 'bg-emerald-100 text-emerald-800 border-emerald-200',
          indicatorColor: 'bg-emerald-500'
        };
      case 'under_repair':
        return {
          label: 'กำลังซ่อมแซม',
          badgeText: 'Under Repair',
          dotColor: 'bg-rose-500 animate-ping',
          ringColor: 'ring-2 ring-rose-400',
          bgCard: 'bg-rose-50 border-rose-300 text-rose-950 shadow-sm shadow-rose-100',
          badgeBg: 'bg-rose-600 text-white font-bold animate-pulse',
          indicatorColor: 'bg-rose-500'
        };
      case 'needs_inspection':
        return {
          label: 'รอตรวจรับงาน',
          badgeText: 'Needs Inspection',
          dotColor: 'bg-purple-500',
          ringColor: 'ring-2 ring-purple-400',
          bgCard: 'bg-purple-50 border-purple-300 text-purple-950 shadow-sm shadow-purple-100',
          badgeBg: 'bg-purple-600 text-white font-bold',
          indicatorColor: 'bg-purple-500'
        };
      case 'pending':
        return {
          label: 'รอดำเนินการ',
          badgeText: 'Pending',
          dotColor: 'bg-amber-500',
          ringColor: 'ring-2 ring-amber-400',
          bgCard: 'bg-amber-50 border-amber-300 text-amber-950 shadow-sm shadow-amber-100',
          badgeBg: 'bg-amber-500 text-white font-bold',
          indicatorColor: 'bg-amber-500'
        };
      case 'on_hold':
        return {
          label: 'รออะไหล่',
          badgeText: 'On Hold',
          dotColor: 'bg-slate-500',
          ringColor: 'ring-2 ring-slate-400',
          bgCard: 'bg-slate-100 border-slate-300 text-slate-900',
          badgeBg: 'bg-slate-600 text-white font-bold',
          indicatorColor: 'bg-slate-500'
        };
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-sky-800 via-blue-900 to-indigo-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-blue-700/30">
        <div className="relative z-10 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="inline-flex items-center space-x-2 px-3 py-1 bg-white/15 rounded-full text-xs font-medium text-sky-100 backdrop-blur-md border border-white/10">
                <Building2 className="w-3.5 h-3.5 text-sky-300" />
                <span>{settings.hotelName} • 7 ชั้น (ชั้น 3 - ชั้น 9) • 126 ห้องพัก</span>
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white">
                ผังสถานะห้องพัก & งานซ่อมบำรุงโรงแรม
              </h1>
              <p className="text-xs sm:text-sm text-sky-100/90 max-w-2xl leading-relaxed">
                Visual Room Maintenance Status Matrix • ตรวจสอบความพร้อมของห้องพักและสถานะงานซ่อมแซมแบบเรียลไทม์
              </p>
            </div>

            <button
              onClick={() => setActiveTab('create_ticket')}
              className="self-start sm:self-auto px-5 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white rounded-2xl text-xs sm:text-sm font-bold shadow-lg flex items-center space-x-2 transition-all cursor-pointer shrink-0"
            >
              <PlusCircle className="w-4 h-4" />
              <span>+ เปิดใบแจ้งซ่อมด่วน</span>
            </button>
          </div>

          {/* Quick Stats Summary Badges inside banner */}
          <div className="pt-3 border-t border-white/15 flex flex-wrap items-center gap-2">
            <span className="text-xs text-sky-200 font-semibold mr-1">สถานะห้องวันนี้:</span>
            
            <button
              onClick={() => setMatrixStatusFilter(matrixStatusFilter === 'in_service' ? 'all' : 'in_service')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-2 transition-all cursor-pointer border ${
                matrixStatusFilter === 'in_service'
                  ? 'bg-emerald-500 text-white border-emerald-400 shadow-md ring-2 ring-emerald-300'
                  : 'bg-white/10 text-white hover:bg-white/20 border-white/15'
              }`}
            >
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
              <span>ปกติ พร้อมบริการ:</span>
              <span className="font-mono text-sm">{roomMatrixStats.inService} ห้อง</span>
              <span className="text-[10px] opacity-80 font-normal">({roomMatrixStats.inServicePercent}%)</span>
            </button>

            <button
              onClick={() => setMatrixStatusFilter(matrixStatusFilter === 'under_repair' ? 'all' : 'under_repair')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-2 transition-all cursor-pointer border ${
                matrixStatusFilter === 'under_repair'
                  ? 'bg-rose-500 text-white border-rose-400 shadow-md ring-2 ring-rose-300'
                  : 'bg-white/10 text-white hover:bg-white/20 border-white/15'
              }`}
            >
              <span className="w-2.5 h-2.5 rounded-full bg-rose-400 animate-ping" />
              <span>กำลังซ่อมแซม:</span>
              <span className="font-mono text-sm">{roomMatrixStats.underRepair} ห้อง</span>
            </button>

            <button
              onClick={() => setMatrixStatusFilter(matrixStatusFilter === 'needs_inspection' ? 'all' : 'needs_inspection')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-2 transition-all cursor-pointer border ${
                matrixStatusFilter === 'needs_inspection'
                  ? 'bg-purple-500 text-white border-purple-400 shadow-md ring-2 ring-purple-300'
                  : 'bg-white/10 text-white hover:bg-white/20 border-white/15'
              }`}
            >
              <span className="w-2.5 h-2.5 rounded-full bg-purple-400" />
              <span>รอตรวจรับ:</span>
              <span className="font-mono text-sm">{roomMatrixStats.needsInspection} ห้อง</span>
            </button>

            <button
              onClick={() => setMatrixStatusFilter(matrixStatusFilter === 'pending' ? 'all' : 'pending')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-2 transition-all cursor-pointer border ${
                matrixStatusFilter === 'pending'
                  ? 'bg-amber-500 text-white border-amber-400 shadow-md ring-2 ring-amber-300'
                  : 'bg-white/10 text-white hover:bg-white/20 border-white/15'
              }`}
            >
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              <span>รอดำเนินการ:</span>
              <span className="font-mono text-sm">{roomMatrixStats.pending} ห้อง</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Matrix Box */}
      <div className="bg-white rounded-3xl p-6 border border-sky-100 shadow-sm space-y-5">
        {/* Floor Filter Tabs & Search Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
          {/* Floor tabs */}
          <div className="flex items-center space-x-1 overflow-x-auto scrollbar-none pb-1 md:pb-0">
            <span className="text-xs font-bold text-slate-500 mr-1.5 shrink-0 flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5 text-slate-400" />
              <span>เลือกชั้น:</span>
            </span>
            <button
              onClick={() => setMatrixFloorFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                matrixFloorFilter === 'all'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              ทุกชั้น (126 ห้อง)
            </button>
            {HOTEL_FLOORS.map(floor => (
              <button
                key={floor}
                onClick={() => setMatrixFloorFilter(floor)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  matrixFloorFilter === floor
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                ชั้น {floor} (18)
              </button>
            ))}
          </div>

          {/* Search box & reset button */}
          <div className="flex items-center space-x-2">
            <div className="relative flex-1 sm:w-52">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="ค้นหาเลขห้อง / ประเภท..."
                value={matrixSearchQuery}
                onChange={(e) => setMatrixSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-slate-800"
              />
              {matrixSearchQuery && (
                <button
                  onClick={() => setMatrixSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {(matrixFloorFilter !== 'all' || matrixStatusFilter !== 'all' || matrixTypeFilter !== 'all' || matrixSearchQuery) && (
              <button
                onClick={() => {
                  setMatrixFloorFilter('all');
                  setMatrixStatusFilter('all');
                  setMatrixTypeFilter('all');
                  setMatrixSearchQuery('');
                }}
                className="text-xs text-blue-600 hover:text-blue-800 font-semibold px-2.5 py-1 bg-white border border-blue-200 rounded-lg shrink-0 cursor-pointer"
              >
                ล้างตัวกรอง
              </button>
            )}
          </div>
        </div>

        {/* Room Type Selector / Legend */}
        <div className="flex flex-wrap items-center gap-2 text-[11px] pt-1 border-b border-slate-100 pb-3">
          <span className="text-slate-400 font-semibold mr-1">ประเภทห้องพัก:</span>
          {(['all', 'SUP_TWN', 'DLX_TRP', 'SUP_DBL', 'LUX_TRP', 'DLX_DBL'] as const).map(typeKey => {
            const isSelected = matrixTypeFilter === typeKey;
            if (typeKey === 'all') {
              return (
                <button
                  key="all"
                  onClick={() => setMatrixTypeFilter('all')}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                    isSelected ? 'bg-slate-800 text-white font-bold' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  ทุกประเภท
                </button>
              );
            }
            const info = ROOM_TYPE_NAMES[typeKey];
            return (
              <button
                key={typeKey}
                onClick={() => setMatrixTypeFilter(isSelected ? 'all' : typeKey)}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all border flex items-center space-x-1 cursor-pointer ${
                  isSelected ? 'bg-blue-600 text-white border-blue-700 font-bold' : `${info.bg} ${info.color}`
                }`}
              >
                <span className="font-bold">{info.label}</span>
                <span className="text-[10px] opacity-80">({info.desc})</span>
              </button>
            );
          })}
        </div>

        {/* ROOM MATRIX GRID */}
        <div className="space-y-4">
          {matrixFloorFilter === 'all' ? (
            HOTEL_FLOORS.map(floor => {
              const floorRooms = filteredRooms.filter(r => r.room.floor === floor);
              if (floorRooms.length === 0) return null;

              return (
                <div key={floor} className="bg-slate-50/60 p-4 rounded-2xl border border-slate-100">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <span className="w-2.5 h-4 bg-blue-600 rounded-full" />
                      <h3 className="text-xs font-black text-slate-800 tracking-wide uppercase">
                        ชั้น {floor} (Floor {floor})
                      </h3>
                      <span className="text-[11px] text-slate-400 font-medium">
                        • {floorRooms.length} ห้องพัก
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-500 font-medium">
                      พร้อมบริการ: <span className="font-bold text-emerald-600">{floorRooms.filter(r => r.status === 'in_service').length}</span> / {floorRooms.length} ห้อง
                    </div>
                  </div>

                  {/* 18 Rooms Grid per floor */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 lg:grid-cols-9 gap-2">
                    {floorRooms.map(item => {
                      const statusCfg = getMatrixStatusConfig(item.status);
                      const typeCfg = ROOM_TYPE_NAMES[item.room.type];
                      return (
                        <div
                          key={item.room.number}
                          onClick={() => setSelectedRoomModal(item)}
                          className={`p-2.5 rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col justify-between relative group ${statusCfg.bgCard} ${statusCfg.ringColor} hover:shadow-md hover:scale-[1.03]`}
                        >
                          <div className="flex items-start justify-between">
                            <span className="text-sm font-black font-mono tracking-tight text-slate-900">
                              {item.room.number}
                            </span>
                            <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${statusCfg.dotColor}`} />
                          </div>

                          <div className="mt-2 space-y-1">
                            <div className="flex items-center justify-between text-[10px]">
                              <span className="font-semibold text-slate-600 font-mono">
                                {typeCfg.label}
                              </span>
                            </div>
                            <div className={`px-1.5 py-0.5 text-[9px] font-bold rounded text-center truncate ${statusCfg.badgeBg}`}>
                              {statusCfg.badgeText}
                            </div>
                          </div>

                          {item.activeTickets.length > 0 && (
                            <div className="mt-1 text-[10px] flex items-center space-x-1 text-slate-800 font-medium truncate pt-1 border-t border-slate-200/40">
                              <span>{item.activeTickets[0].category === 'แอร์' ? '❄️' : item.activeTickets[0].category === 'ไฟฟ้า' ? '💡' : '🛠️'}</span>
                              <span className="truncate">{item.activeTickets[0].description}</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 lg:grid-cols-9 gap-2.5">
              {filteredRooms.map(item => {
                const statusCfg = getMatrixStatusConfig(item.status);
                const typeCfg = ROOM_TYPE_NAMES[item.room.type];
                return (
                  <div
                    key={item.room.number}
                    onClick={() => setSelectedRoomModal(item)}
                    className={`p-3 rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col justify-between relative group ${statusCfg.bgCard} ${statusCfg.ringColor} hover:shadow-md hover:scale-[1.03]`}
                  >
                    <div className="flex items-start justify-between">
                      <span className="text-base font-black font-mono tracking-tight text-slate-900">
                        {item.room.number}
                      </span>
                      <span className={`w-3 h-3 rounded-full shrink-0 ${statusCfg.dotColor}`} />
                    </div>

                    <div className="mt-2 space-y-1">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="font-semibold text-slate-600 font-mono">
                          {typeCfg.label}
                        </span>
                        <span className="text-slate-400">ชั้น {item.room.floor}</span>
                      </div>
                      <div className={`px-1.5 py-0.5 text-[10px] font-bold rounded text-center truncate ${statusCfg.badgeBg}`}>
                        {statusCfg.badgeText}
                      </div>
                    </div>

                    {item.activeTickets.length > 0 && (
                      <div className="mt-1.5 text-[10px] flex items-center space-x-1 text-slate-800 font-medium truncate pt-1 border-t border-slate-200/40">
                        <span>{item.activeTickets[0].category === 'แอร์' ? '❄️' : item.activeTickets[0].category === 'ไฟฟ้า' ? '💡' : '🛠️'}</span>
                        <span className="truncate">{item.activeTickets[0].description}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {filteredRooms.length === 0 && (
            <div className="p-12 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-700">ไม่พบห้องพักตามเงื่อนไขตัวกรอง</p>
              <p className="text-xs text-slate-400 mt-1">ลองเปลี่ยนชั้น หรือล้างตัวกรองสถานะ/การค้นหา</p>
            </div>
          )}
        </div>
      </div>

      {/* ROOM DETAILS POPUP MODAL */}
      {selectedRoomModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 border border-slate-200 relative overflow-hidden animate-in zoom-in-95">
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-600 to-blue-700 text-white flex items-center justify-center shadow-md font-black text-xl font-mono">
                  {selectedRoomModal.room.number}
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                    <span>ห้องพัก {selectedRoomModal.room.number}</span>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200 font-mono">
                      ชั้น {selectedRoomModal.room.floor}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    {ROOM_TYPE_NAMES[selectedRoomModal.room.type]?.desc} ({selectedRoomModal.room.type})
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedRoomModal(null)}
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="py-4 space-y-4">
              {/* Current Status Badge */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="text-xs font-semibold text-slate-600">สถานะความพร้อมห้องพัก:</span>
                {(() => {
                  const cfg = getMatrixStatusConfig(selectedRoomModal.status);
                  return (
                    <span className={`px-3 py-1 rounded-xl text-xs font-bold flex items-center space-x-1.5 ${cfg.badgeBg}`}>
                      <span className={`w-2 h-2 rounded-full ${cfg.dotColor}`} />
                      <span>{cfg.label} ({cfg.badgeText})</span>
                    </span>
                  );
                })()}
              </div>

              {/* Active Ticket Details if any */}
              {selectedRoomModal.activeTickets.length > 0 ? (
                <div className="space-y-3">
                  <div className="text-xs font-bold text-slate-700 flex items-center justify-between">
                    <span>รายการแจ้งซ่อมที่กำลังดำเนินการ ({selectedRoomModal.activeTickets.length})</span>
                    <span className="text-rose-600 font-semibold text-[11px]">ต้องการความดูแล</span>
                  </div>
                  {selectedRoomModal.activeTickets.map(ticket => (
                    <div key={ticket.id} className="p-3.5 rounded-2xl bg-rose-50/70 border border-rose-200 text-xs space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-rose-900 font-mono">{ticket.id}</span>
                        <span className="px-2 py-0.5 rounded-md bg-rose-200 text-rose-800 font-bold text-[10px]">
                          {ticket.category}
                        </span>
                      </div>
                      <p className="text-slate-800 font-medium leading-relaxed">{ticket.description}</p>
                      <div className="flex items-center justify-between text-[11px] text-slate-600 pt-1 border-t border-rose-200/60">
                        <span>ผู้แจ้ง: {ticket.reporterName}</span>
                        <span>ช่าง: {ticket.assignedTechnician ? ticket.assignedTechnician.name.split(' ')[0] : 'รอช่าง'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200 text-xs text-emerald-900 flex items-center space-x-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <div>
                    <p className="font-bold">ห้องพักอยู่ในสภาพสมบูรณ์ พร้อมเปิดบริการต้อนรับแขก</p>
                    <p className="text-[11px] text-emerald-700 mt-0.5">ไม่มีรายงานปัญหาหรือคิวงานซ่อมค้างในขณะนี้</p>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row gap-2">
              <button
                type="button"
                onClick={() => {
                  setSelectedRoomModal(null);
                  setActiveTab('create_ticket');
                }}
                className="flex-1 py-2.5 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center space-x-1.5 transition-all cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span>+ แจ้งซ่อมห้อง {selectedRoomModal.room.number}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSelectedRoomModal(null);
                  setActiveTab('rooms');
                }}
                className="py-2.5 px-4 bg-sky-50 text-blue-800 hover:bg-sky-100 font-bold text-xs rounded-xl border border-sky-200 flex items-center justify-center space-x-1.5 transition-all cursor-pointer"
              >
                <History className="w-3.5 h-3.5" />
                <span>ดูประวัติห้องนี้</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSelectedRoomModal(null);
                  setActiveTab('tracking');
                }}
                className="py-2.5 px-4 bg-slate-100 text-slate-700 hover:bg-slate-200 font-bold text-xs rounded-xl border border-slate-200 flex items-center justify-center space-x-1.5 transition-all cursor-pointer"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>ไปหน้าติดตามงาน</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

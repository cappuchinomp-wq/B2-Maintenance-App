import React, { useState } from 'react';
import { useMaintenance } from '../context/MaintenanceContext';
import { 
  MaintenanceTicket, 
  TicketStatus, 
  UrgencyLevel, 
  WorkCategory, 
  LocationArea,
  PartItem 
} from '../types/maintenance';
import { 
  Search, 
  Filter, 
  Kanban, 
  Table as TableIcon, 
  Phone, 
  UserCheck, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  X, 
  Upload, 
  Plus, 
  Trash2, 
  History, 
  ChevronRight,
  Sparkles,
  DollarSign,
  Send,
  Smartphone
} from 'lucide-react';
import { LineNotifyModal } from '../components/LineNotifyModal';

export const WorkTrackingView: React.FC = () => {
  const { 
    tickets, 
    technicians, 
    updateTicketStatus, 
    updateTicket,
    assignTechnician, 
    currentUser,
    setActiveTab 
  } = useMaintenance();

  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [urgencyFilter, setUrgencyFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [selectedTicket, setSelectedTicket] = useState<MaintenanceTicket | null>(null);
  const [lineModalTicket, setLineModalTicket] = useState<MaintenanceTicket | null>(null);

  // Technician update modal state
  const [techNotes, setTechNotes] = useState('');
  const [selectedTechId, setSelectedTechId] = useState('');
  const [repairImages, setRepairImages] = useState<string[]>([]);
  const [parts, setParts] = useState<PartItem[]>([]);
  const [newPartName, setNewPartName] = useState('');
  const [newPartQty, setNewPartQty] = useState(1);
  const [newPartPrice, setNewPartPrice] = useState(0);
  const [laborCost, setLaborCost] = useState(0);
  const [contractorFee, setContractorFee] = useState(0);
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [vendorName, setVendorName] = useState('');

  // Filtered tickets
  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = 
      ticket.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.roomNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.reporterName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (ticket.assignedTechnician?.name.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);

    const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter;
    const matchesUrgency = urgencyFilter === 'all' || ticket.urgency === urgencyFilter;
    const matchesCategory = categoryFilter === 'all' || ticket.category === categoryFilter;

    return matchesSearch && matchesStatus && matchesUrgency && matchesCategory;
  });

  const openTicketDetail = (ticket: MaintenanceTicket) => {
    setSelectedTicket(ticket);
    setTechNotes(ticket.technicianNotes || '');
    setSelectedTechId(ticket.assignedTechnician?.id || '');
    setRepairImages(ticket.repairImages || []);
    setParts(ticket.partsUsed || []);
    setLaborCost(ticket.laborCost || 0);
    setContractorFee(ticket.contractorFee || 0);
    setInvoiceNumber(ticket.invoiceNumber || '');
    setVendorName(ticket.vendorName || '');
  };

  const handleAddPart = () => {
    if (!newPartName.trim()) return;
    setParts(prev => [...prev, { name: newPartName.trim(), quantity: newPartQty, unitPrice: newPartPrice }]);
    setNewPartName('');
    setNewPartQty(1);
    setNewPartPrice(0);
  };

  const handleRemovePart = (index: number) => {
    setParts(prev => prev.filter((_, i) => i !== index));
  };

  const handleRepairImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (loadEvt) => {
        if (loadEvt.target?.result) {
          setRepairImages(prev => [...prev, loadEvt.target!.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleSaveProgress = async (newStatus: TicketStatus) => {
    if (!selectedTicket) return;
    const partsSum = parts.reduce((sum, p) => sum + (p.quantity * p.unitPrice), 0);
    const totalCost = partsSum + (Number(laborCost) || 0) + (Number(contractorFee) || 0);

    await updateTicketStatus(
      selectedTicket.id,
      newStatus,
      techNotes,
      selectedTechId || undefined,
      totalCost,
      parts,
      repairImages
    );

    // Also update accounting extra fields
    await updateTicket(selectedTicket.id, {
      laborCost: Number(laborCost) || 0,
      contractorFee: Number(contractorFee) || 0,
      invoiceNumber: invoiceNumber.trim(),
      vendorName: vendorName.trim()
    });

    // Refresh selected ticket in modal
    const updated = tickets.find(t => t.id === selectedTicket.id);
    if (updated) {
      setSelectedTicket(updated);
    } else {
      setSelectedTicket(null);
    }
    alert('อัปเดตสถานะงานและข้อมูลค่าใช้จ่ายเรียบร้อยแล้ว');
  };

  const KANBAN_COLUMNS: { id: TicketStatus; title: string; badgeColor: string; bg: string; border: string }[] = [
    { id: 'pending', title: 'รอดำเนินการ', badgeColor: 'bg-slate-500', bg: 'bg-slate-50/80', border: 'border-slate-200' },
    { id: 'in_progress', title: 'กำลังซ่อม', badgeColor: 'bg-sky-600', bg: 'bg-sky-50/50', border: 'border-sky-200' },
    { id: 'pending_inspection', title: 'รอตรวจรับงาน', badgeColor: 'bg-amber-500', bg: 'bg-amber-50/50', border: 'border-amber-200' },
    { id: 'completed', title: 'เสร็จสิ้น (Done)', badgeColor: 'bg-emerald-600', bg: 'bg-emerald-50/50', border: 'border-emerald-200' }
  ];

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 space-y-5">
      {/* Header & Filter Bar */}
      <div className="bg-white rounded-3xl p-5 border border-sky-100 shadow-2xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900">ติดตามสถานะงานแจ้งซ่อม (Work Tracking)</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              จัดการงาน มอบหมายช่าง บันทึกการแก้ไข และส่งต่อให้ผู้แจ้งตรวจรับงาน
            </p>
          </div>

          {/* View Mode Toggle & LINE Portal Link */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setActiveTab('line_technician')}
              className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-[#06C755] hover:bg-[#05a847] text-white shadow-xs transition-all cursor-pointer"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>หน้า LINE รับงานช่าง</span>
            </button>

            <div className="bg-slate-100 p-1 rounded-xl flex items-center space-x-1">
              <button
                onClick={() => setViewMode('kanban')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  viewMode === 'kanban' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Kanban className="w-3.5 h-3.5" />
                <span>บอร์ดคัมบัง (Kanban)</span>
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  viewMode === 'table' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <TableIcon className="w-3.5 h-3.5" />
                <span>ตารางข้อมูล (Table)</span>
              </button>
            </div>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2 border-t border-slate-100">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ค้นหาเลขห้อง, รหัสงาน, ผู้แจ้ง..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-sky-500"
            >
              <option value="all">ทุกสถานะ (All Statuses)</option>
              <option value="pending">รอดำเนินการ (Pending)</option>
              <option value="in_progress">กำลังซ่อม (In Progress)</option>
              <option value="pending_inspection">รอตรวจรับงาน (Pending Inspection)</option>
              <option value="completed">เสร็จสิ้น (Completed)</option>
            </select>
          </div>

          <div>
            <select
              value={urgencyFilter}
              onChange={(e) => setUrgencyFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-sky-500"
            >
              <option value="all">ทุกระดับความเร่งด่วน</option>
              <option value="Critical">🔴 Critical (วิกฤต/ห้องขายไม่ได้)</option>
              <option value="High">🟠 High (กระทบแขกโดยตรง)</option>
              <option value="Medium">🟡 Medium (ปานกลาง)</option>
              <option value="Low">🟢 Low (ทั่วไป)</option>
            </select>
          </div>

          <div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-sky-500"
            >
              <option value="all">ทุกประเภทงาน</option>
              <option value="ไฟฟ้า">💡 ไฟฟ้า</option>
              <option value="แอร์">❄️ แอร์</option>
              <option value="ประปา">💧 ประปา</option>
              <option value="เฟอร์นิเจอร์">🪵 เฟอร์นิเจอร์</option>
              <option value="ไอที / อินเตอร์เน็ต">🌐 ไอที / อินเตอร์เน็ต</option>
              <option value="Fire Alarm">🚨 Fire Alarm</option>
              <option value="งานสี / โครงสร้างอาคาร">🖌️ งานสี / โครงสร้างอาคาร</option>
              <option value="อื่นๆ">🛠️ อื่นๆ</option>
            </select>
          </div>
        </div>
      </div>

      {/* Kanban Board View */}
      {viewMode === 'kanban' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {KANBAN_COLUMNS.map(col => {
            const columnTickets = filteredTickets.filter(t => t.status === col.id);
            return (
              <div key={col.id} className={`rounded-3xl border ${col.border} ${col.bg} p-4 flex flex-col min-h-[600px]`}>
                {/* Column Header */}
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200/60">
                  <div className="flex items-center space-x-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${col.badgeColor}`} />
                    <h3 className="font-bold text-sm text-slate-800">{col.title}</h3>
                  </div>
                  <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-white text-slate-700 shadow-2xs">
                    {columnTickets.length}
                  </span>
                </div>

                {/* Ticket Cards */}
                <div className="space-y-3 flex-1 overflow-y-auto">
                  {columnTickets.length === 0 ? (
                    <div className="text-center py-12 text-slate-400 text-xs italic">
                      ไม่มีงานในสถานะนี้
                    </div>
                  ) : (
                    columnTickets.map(ticket => (
                      <div
                        key={ticket.id}
                        onClick={() => openTicketDetail(ticket)}
                        className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs hover:shadow-md hover:border-sky-300 transition-all cursor-pointer group"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md font-mono">
                            {ticket.id}
                          </span>
                          <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md ${
                            ticket.urgency === 'Critical' ? 'bg-red-100 text-red-700' :
                            ticket.urgency === 'High' ? 'bg-orange-100 text-orange-700' :
                            ticket.urgency === 'Medium' ? 'bg-amber-100 text-amber-700' :
                            'bg-slate-100 text-slate-700'
                          }`}>
                            {ticket.urgency}
                          </span>
                        </div>

                        <div className="mt-2">
                          <h4 className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                            <span>{ticket.area}</span>
                            <span className="text-sky-600">({ticket.roomNumber})</span>
                          </h4>
                          <p className="text-xs text-slate-600 mt-1 line-clamp-2 leading-relaxed">
                            {ticket.description}
                          </p>
                        </div>

                        {/* Badges & Meta */}
                        <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                          <span className="font-medium text-slate-700">{ticket.category}</span>
                          <span className="text-[10px] text-slate-400">
                            {new Date(ticket.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>

                        {/* Assigned Tech pill & Manual LINE Trigger */}
                        <div className="mt-2 flex items-center justify-between gap-1.5">
                          {ticket.assignedTechnician ? (
                            <div className="flex-1 flex items-center justify-between bg-sky-50 px-2 py-1 rounded-lg text-[11px] text-sky-800 min-w-0">
                              <span className="truncate font-medium">👨‍🔧 {ticket.assignedTechnician.name.split(' ')[0]}</span>
                              <a 
                                href={`tel:${ticket.assignedTechnician.phone.replace(/[^0-9]/g, '')}`}
                                onClick={(e) => e.stopPropagation()}
                                className="p-0.5 text-emerald-600 hover:text-emerald-700 shrink-0"
                                title="โทรหาช่าง"
                              >
                                <Phone className="w-3 h-3" />
                              </a>
                            </div>
                          ) : (
                            <div className="text-[10px] text-amber-600 italic">
                              ⏳ รอช่าง
                            </div>
                          )}

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setLineModalTicket(ticket);
                            }}
                            className="px-2 py-1 bg-[#06C755]/10 text-[#05a847] hover:bg-[#06C755] hover:text-white rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all shrink-0 cursor-pointer"
                            title="กดส่ง LINE Notify ของงานนี้"
                          >
                            <Send className="w-3 h-3" />
                            <span>LINE</span>
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Table View */}
      {viewMode === 'table' && (
        <div className="bg-white rounded-3xl p-5 border border-sky-100 shadow-2xs overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 uppercase text-[10px] tracking-wider">
                <th className="pb-3 font-semibold">รหัสงาน</th>
                <th className="pb-3 font-semibold">วันที่แจ้ง</th>
                <th className="pb-3 font-semibold">สถานที่ / ห้อง</th>
                <th className="pb-3 font-semibold">แผนก</th>
                <th className="pb-3 font-semibold">ประเภท</th>
                <th className="pb-3 font-semibold">ความด่วน</th>
                <th className="pb-3 font-semibold">รายละเอียด</th>
                <th className="pb-3 font-semibold">สถานะ</th>
                <th className="pb-3 font-semibold">ช่างรับผิดชอบ</th>
                <th className="pb-3 font-semibold text-right">ดำเนินการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTickets.map(ticket => (
                <tr key={ticket.id} className="hover:bg-sky-50/40 transition-colors">
                  <td className="py-3 font-mono font-bold text-slate-900">{ticket.id}</td>
                  <td className="py-3 text-slate-500">{new Date(ticket.createdAt).toLocaleDateString('th-TH')}</td>
                  <td className="py-3">
                    <span className="font-semibold text-slate-800">{ticket.area}</span>
                    <span className="text-slate-500 block text-[11px]">{ticket.roomNumber}</span>
                  </td>
                  <td className="py-3 text-slate-600">{ticket.department}</td>
                  <td className="py-3 text-slate-700 font-medium">{ticket.category}</td>
                  <td className="py-3">
                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md ${
                      ticket.urgency === 'Critical' ? 'bg-red-100 text-red-700' :
                      ticket.urgency === 'High' ? 'bg-orange-100 text-orange-700' :
                      ticket.urgency === 'Medium' ? 'bg-amber-100 text-amber-700' :
                      'bg-slate-100 text-slate-700'
                    }`}>
                      {ticket.urgency}
                    </span>
                  </td>
                  <td className="py-3 text-slate-600 max-w-xs truncate">{ticket.description}</td>
                  <td className="py-3">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-lg ${
                      ticket.status === 'completed' ? 'bg-emerald-100 text-emerald-800' :
                      ticket.status === 'in_progress' ? 'bg-sky-100 text-sky-800' :
                      ticket.status === 'pending_inspection' ? 'bg-amber-100 text-amber-800' :
                      'bg-slate-100 text-slate-700'
                    }`}>
                      {ticket.status === 'completed' ? 'เสร็จสิ้น' :
                       ticket.status === 'in_progress' ? 'กำลังซ่อม' :
                       ticket.status === 'pending_inspection' ? 'รอตรวจรับ' : 'รอดำเนินการ'}
                    </span>
                  </td>
                  <td className="py-3 text-slate-700">
                    {ticket.assignedTechnician ? (
                      <div className="flex items-center space-x-1">
                        <span>{ticket.assignedTechnician.name.split(' ')[0]}</span>
                        <a href={`tel:${ticket.assignedTechnician.phone.replace(/[^0-9]/g, '')}`} className="text-emerald-600">
                          <Phone className="w-3 h-3" />
                        </a>
                      </div>
                    ) : (
                      <span className="text-slate-400 italic">-</span>
                    )}
                  </td>
                  <td className="py-3 text-right">
                    <button
                      onClick={() => openTicketDetail(ticket)}
                      className="px-3 py-1 bg-sky-600 hover:bg-sky-700 text-white font-semibold rounded-lg shadow-2xs transition-colors"
                    >
                      จัดการงาน
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Ticket Management Detail Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-sky-100 my-8">
            <div className="flex items-start justify-between pb-4 border-b border-slate-100">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-mono font-bold px-2 py-0.5 bg-blue-100 text-blue-800 rounded">
                    {selectedTicket.id}
                  </span>
                  <span className={`px-2 py-0.5 text-xs font-bold rounded-md ${
                    selectedTicket.urgency === 'Critical' ? 'bg-red-100 text-red-700' :
                    selectedTicket.urgency === 'High' ? 'bg-orange-100 text-orange-700' :
                    'bg-amber-100 text-amber-700'
                  }`}>
                    {selectedTicket.urgency}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 mt-1">
                  {selectedTicket.area} - ห้อง {selectedTicket.roomNumber} ({selectedTicket.category})
                </h3>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setLineModalTicket(selectedTicket)}
                  className="px-3 py-1.5 bg-[#06C755] hover:bg-[#05a847] text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center space-x-1 cursor-pointer"
                  title="กดส่งการแจ้งเตือน LINE สำหรับรายการนี้"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">ส่ง LINE</span>
                </button>
                <button
                  onClick={() => setSelectedTicket(null)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="mt-4 space-y-5 max-h-[70vh] overflow-y-auto pr-2">
              {/* Problem Details */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 text-xs space-y-2">
                <p className="text-slate-700 font-medium leading-relaxed">
                  <strong>อาการเสีย:</strong> {selectedTicket.description}
                </p>
                <div className="grid grid-cols-2 gap-2 text-slate-500 pt-2 border-t border-slate-200">
                  <div>ผู้แจ้ง: <span className="font-semibold text-slate-800">{selectedTicket.reporterName} ({selectedTicket.department})</span></div>
                  <div>เบอร์โทร: <a href={`tel:${selectedTicket.reporterPhone}`} className="text-sky-600 font-semibold">{selectedTicket.reporterPhone}</a></div>
                </div>

                {/* Pre-repair Photos */}
                {selectedTicket.images && selectedTicket.images.length > 0 && (
                  <div className="pt-2">
                    <span className="text-slate-500 block mb-1 font-semibold">รูปภาพปัญหา (ก่อนซ่อม):</span>
                    <div className="flex flex-wrap gap-2">
                      {selectedTicket.images.map((img, i) => (
                        <a key={i} href={img} target="_blank" rel="noreferrer">
                          <img src={img} alt="Before" className="w-16 h-16 rounded-xl object-cover border border-slate-300 shadow-2xs hover:scale-105 transition-transform" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Technician Assignment Form */}
              <div className="p-4 bg-sky-50/70 rounded-2xl border border-sky-200 space-y-3">
                <h4 className="font-bold text-xs text-sky-900 uppercase tracking-wider flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-sky-700" />
                  <span>มอบหมายช่างผู้รับผิดชอบ</span>
                </h4>

                <div className="flex flex-col sm:flex-row gap-2">
                  <select
                    value={selectedTechId}
                    onChange={(e) => setSelectedTechId(e.target.value)}
                    className="flex-1 px-3 py-2 bg-white border border-sky-300 rounded-xl text-xs text-slate-800"
                  >
                    <option value="">เลือกช่างประจำเวร</option>
                    {technicians.map(tech => (
                      <option key={tech.id} value={tech.id}>
                        {tech.name} ({tech.skills.join(', ')}) - ติดงาน {tech.activeJobsCount}
                      </option>
                    ))}
                  </select>

                  {selectedTechId && (
                    <a
                      href={`tel:${technicians.find(t => t.id === selectedTechId)?.phone.replace(/[^0-9]/g, '')}`}
                      className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl flex items-center justify-center space-x-1"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>โทรหาช่าง</span>
                    </a>
                  )}
                </div>
              </div>

              {/* Technician Notes & Repair Proof Form */}
              <div className="p-4 bg-white rounded-2xl border border-slate-200 space-y-3">
                <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider">
                  บันทึกการซ่อม & ข้อมูลอะไหล่ (สำหรับช่าง)
                </h4>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    บันทึกผลการเข้าตรวจสอบและซ่อมแซม
                  </label>
                  <textarea
                    rows={3}
                    value={techNotes}
                    onChange={(e) => setTechNotes(e.target.value)}
                    placeholder="เช่น ล้างท่อน้ำทิ้ง, เปลี่ยนหลอดไฟ LED, ขันเกลียวข้อต่อใหม่..."
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:bg-white"
                  />
                </div>

                {/* Parts Used Section */}
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    รายการอะไหล่และอุปกรณ์ที่ใช้
                  </label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      placeholder="ชื่ออะไหล่"
                      value={newPartName}
                      onChange={(e) => setNewPartName(e.target.value)}
                      className="flex-2 p-2 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                    />
                    <input
                      type="number"
                      placeholder="จำนวน"
                      value={newPartQty}
                      onChange={(e) => setNewPartQty(Number(e.target.value))}
                      className="w-16 p-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-center"
                    />
                    <input
                      type="number"
                      placeholder="ราคา/หน่วย"
                      value={newPartPrice}
                      onChange={(e) => setNewPartPrice(Number(e.target.value))}
                      className="w-24 p-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-right"
                    />
                    <button
                      type="button"
                      onClick={handleAddPart}
                      className="px-3 py-2 bg-sky-600 text-white rounded-xl text-xs font-semibold"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  {parts.length > 0 && (
                    <div className="space-y-1 bg-slate-50 p-2.5 rounded-xl text-xs">
                      {parts.map((p, idx) => (
                        <div key={idx} className="flex items-center justify-between text-slate-700 py-1 border-b border-slate-200 last:border-0">
                          <span>{p.name} (x{p.quantity})</span>
                          <div className="flex items-center space-x-2">
                            <span className="font-semibold">฿{(p.quantity * p.unitPrice).toLocaleString()}</span>
                            <button onClick={() => handleRemovePart(idx)} className="text-red-500">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                      <div className="text-right font-bold text-slate-900 pt-1">
                        รวมค่าอะไหล่: ฿{parts.reduce((sum, p) => sum + (p.quantity * p.unitPrice), 0).toLocaleString()}
                      </div>
                    </div>
                  )}
                </div>

                {/* Additional Expenses: Labor & Contractor */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">ค่าแรง / ค่าบริการ (บาท)</label>
                    <input
                      type="number"
                      min="0"
                      value={laborCost}
                      onChange={(e) => setLaborCost(Math.max(0, parseFloat(e.target.value) || 0))}
                      className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">ค่าผู้รับเหมาภายนอก (บาท)</label>
                    <input
                      type="number"
                      min="0"
                      value={contractorFee}
                      onChange={(e) => setContractorFee(Math.max(0, parseFloat(e.target.value) || 0))}
                      className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                    />
                  </div>
                </div>

                {/* Invoice No. & Vendor Name */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">เลขที่ใบเสร็จ / บิล</label>
                    <input
                      type="text"
                      placeholder="เช่น INV-0891"
                      value={invoiceNumber}
                      onChange={(e) => setInvoiceNumber(e.target.value)}
                      className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">ร้านค้า / ผู้จัดจำหน่าย</label>
                    <input
                      type="text"
                      placeholder="เช่น ไทวัสดุ, โฮมโปร"
                      value={vendorName}
                      onChange={(e) => setVendorName(e.target.value)}
                      className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                    />
                  </div>
                </div>

                {/* Grand Total Preview */}
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-800">ยอดรวมค่าใช้จ่ายซ่อมแซม:</span>
                  <span className="text-base font-black text-emerald-800">
                    ฿{(parts.reduce((sum, p) => sum + (p.quantity * p.unitPrice), 0) + (Number(laborCost) || 0) + (Number(contractorFee) || 0)).toLocaleString()}
                  </span>
                </div>

                {/* Repair Images (After Repair) */}
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    แนบรูปภาพหลังซ่อม (หลักฐานการแก้ไข)
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleRepairImageUpload}
                    className="text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border file:border-slate-300 file:text-xs file:bg-slate-50 cursor-pointer"
                  />
                  {repairImages.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {repairImages.map((img, i) => (
                        <img key={i} src={img} alt="After Repair" className="w-14 h-14 rounded-xl object-cover border border-emerald-300" />
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-wrap gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => handleSaveProgress('in_progress')}
                  className="px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl shadow-xs"
                >
                  บันทึกความคืบหน้า (กำลังซ่อม)
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveProgress('pending_inspection')}
                  className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl shadow-md"
                >
                  ซ่อมเสร็จแล้ว → ส่งตรวจรับงาน
                </button>
              </div>

              {/* History Audit Log */}
              <div className="p-4 bg-slate-50 rounded-2xl text-xs space-y-2">
                <h5 className="font-bold text-slate-700 flex items-center gap-1">
                  <History className="w-3.5 h-3.5" />
                  <span>ประวัติการเปลี่ยนแปลง (Audit Log)</span>
                </h5>
                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                  {selectedTicket.historyLogs.map(log => (
                    <div key={log.id} className="text-[11px] text-slate-600 border-l-2 border-sky-400 pl-2 py-0.5">
                      <span className="font-semibold text-slate-800">{log.action}</span> โดย {log.performedBy}
                      <span className="text-[10px] text-slate-400 ml-2">
                        {new Date(log.timestamp).toLocaleString('th-TH')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Manual LINE Trigger Modal */}
      <LineNotifyModal 
        isOpen={!!lineModalTicket} 
        onClose={() => setLineModalTicket(null)} 
        ticket={lineModalTicket} 
      />
    </div>
  );
};

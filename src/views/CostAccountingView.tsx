import React, { useState, useMemo } from 'react';
import { useMaintenance } from '../context/MaintenanceContext';
import { 
  DollarSign, 
  FileSpreadsheet, 
  FileText, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Search, 
  Filter, 
  Receipt, 
  Building, 
  Edit3, 
  X, 
  Save,
  Download,
  Calendar,
  Layers,
  ChevronDown
} from 'lucide-react';
import { MaintenanceTicket, PartItem } from '../types/maintenance';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { applyThaiFontToDoc } from '../services/pdfHelper';

export const CostAccountingView: React.FC = () => {
  const { tickets, updateTicket, settings } = useMaintenance();
  
  // State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'verified' | 'paid'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [editingTicket, setEditingTicket] = useState<MaintenanceTicket | null>(null);

  // Form State for editing cost & accounting data
  const [partsList, setPartsList] = useState<PartItem[]>([]);
  const [laborCost, setLaborCost] = useState<number>(0);
  const [contractorFee, setContractorFee] = useState<number>(0);
  const [miscCost, setMiscCost] = useState<number>(0);
  const [invoiceNumber, setInvoiceNumber] = useState<string>('');
  const [vendorName, setVendorName] = useState<string>('');
  const [accountingStatus, setAccountingStatus] = useState<'pending' | 'verified' | 'paid'>('pending');
  const [accountingNotes, setAccountingNotes] = useState<string>('');
  const [isExporting, setIsExporting] = useState(false);

  // Filtered tickets
  const filteredTickets = useMemo(() => {
    return tickets.filter(t => {
      const matchSearch = t.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          t.roomNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (t.invoiceNumber && t.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
                          (t.vendorName && t.vendorName.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchStatus = statusFilter === 'all' || (t.accountingStatus || 'pending') === statusFilter;
      const matchCat = categoryFilter === 'all' || t.category === categoryFilter;
      return matchSearch && matchStatus && matchCat;
    });
  }, [tickets, searchTerm, statusFilter, categoryFilter]);

  // Financial Calculations
  const totalExpenses = filteredTickets.reduce((sum, t) => sum + (t.totalCost || 0), 0);
  
  const totalPartsCost = filteredTickets.reduce((sum, t) => {
    const partsSum = (t.partsUsed || []).reduce((pSum, p) => pSum + (p.quantity * p.unitPrice), 0);
    return sum + partsSum;
  }, 0);

  const totalLaborCost = filteredTickets.reduce((sum, t) => sum + (t.laborCost || 0), 0);
  const totalContractorFee = filteredTickets.reduce((sum, t) => sum + (t.contractorFee || 0), 0);
  const totalMiscCost = filteredTickets.reduce((sum, t) => sum + (t.miscCost || 0), 0);

  const pendingAccountingCount = tickets.filter(t => !t.accountingStatus || t.accountingStatus === 'pending').length;
  const verifiedCount = tickets.filter(t => t.accountingStatus === 'verified').length;
  const paidCount = tickets.filter(t => t.accountingStatus === 'paid').length;

  // Open Edit Cost Modal
  const openEditModal = (t: MaintenanceTicket) => {
    setEditingTicket(t);
    setPartsList(t.partsUsed ? [...t.partsUsed] : []);
    setLaborCost(t.laborCost || 0);
    setContractorFee(t.contractorFee || 0);
    setMiscCost(t.miscCost || 0);
    setInvoiceNumber(t.invoiceNumber || '');
    setVendorName(t.vendorName || '');
    setAccountingStatus(t.accountingStatus || 'pending');
    setAccountingNotes(t.accountingNotes || '');
  };

  // Add new part row
  const addPartRow = () => {
    setPartsList(prev => [...prev, { name: '', quantity: 1, unitPrice: 0 }]);
  };

  // Remove part row
  const removePartRow = (index: number) => {
    setPartsList(prev => prev.filter((_, i) => i !== index));
  };

  // Update part row
  const updatePartItem = (index: number, field: keyof PartItem, value: any) => {
    setPartsList(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  // Calculated total for modal form
  const modalPartsTotal = partsList.reduce((sum, p) => sum + (p.quantity * p.unitPrice), 0);
  const modalGrandTotal = modalPartsTotal + (Number(laborCost) || 0) + (Number(contractorFee) || 0) + (Number(miscCost) || 0);

  // Save Cost & Accounting Data
  const handleSaveCost = async () => {
    if (!editingTicket) return;

    const validParts = partsList.filter(p => p.name.trim() !== '');

    const updated = await updateTicket(editingTicket.id, {
      partsUsed: validParts,
      laborCost: Number(laborCost) || 0,
      contractorFee: Number(contractorFee) || 0,
      miscCost: Number(miscCost) || 0,
      totalCost: modalGrandTotal,
      invoiceNumber: invoiceNumber.trim(),
      vendorName: vendorName.trim(),
      accountingStatus: accountingStatus,
      accountingNotes: accountingNotes.trim()
    });

    if (updated) {
      setEditingTicket(null);
    }
  };

  // Export Accounting Ledger to Excel (.xlsx)
  const handleExportExcel = () => {
    setIsExporting(true);
    try {
      const wb = XLSX.utils.book_new();

      // Sheet 1: Accounting Summary
      const summaryRows = [
        ['สมุดบัญชีค่าใช้จ่ายซ่อมแซมและบำรุงรักษาโรงแรม (Maintenance Expense Ledger)'],
        ['โรงแรม:', settings.hotelName],
        ['วันที่ออกรายงาน:', new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })],
        [],
        ['สรุปยอดค่าใช้จ่าย (Financial Totals)', 'จำนวนเงิน (บาท)'],
        ['ยอดค่าใช้จ่ายในการซ่อมแซมรวมทั้งหมด', totalExpenses],
        ['ยอดค่าอะไหล่และอุปกรณ์ทั้งหมด', totalPartsCost],
        ['ยอดค่าแรงช่าง/ค่าบริการรวม', totalLaborCost],
        ['ยอดค่าจ้างผู้รับเหมาภายนอกรวม', totalContractorFee],
        ['ยอดค่าใช้จ่ายเบ็ดเตล็ดรวม', totalMiscCost],
        ['จำนวนรายการทั้งหมด (รายการ)', filteredTickets.length],
        ['รายการรอตรวจสอบบัญชี', pendingAccountingCount],
        ['รายการบันทึกบัญชีแล้ว', verifiedCount],
        ['รายการชำระเงินเรียบร้อย', paidCount],
        []
      ];

      const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows);
      wsSummary['!cols'] = [
        { wch: 38 },
        { wch: 22 }
      ];
      XLSX.utils.book_append_sheet(wb, wsSummary, 'สรุปยอดบัญชี');

      // Sheet 2: Itemized Accounting Ledger
      const ledgerRows = filteredTickets.map(t => {
        const partsStr = (t.partsUsed || []).map(p => `${p.name} (${p.quantity}x${p.unitPrice})`).join(', ') || '-';
        const partsSum = (t.partsUsed || []).reduce((sum, p) => sum + (p.quantity * p.unitPrice), 0);

        return {
          'รหัสใบแจ้งซ่อม': t.id,
          'วันที่แจ้ง': new Date(t.createdAt).toLocaleDateString('th-TH'),
          'เลขห้อง/จุดบริการ': t.roomNumber,
          'ประเภทงาน': t.category,
          'รายละเอียด': t.description,
          'รายการอะไหล่': partsStr,
          'ค่าอะไหล่ (บาท)': partsSum,
          'ค่าแรง (บาท)': t.laborCost || 0,
          'ค่าผู้รับเหมา (บาท)': t.contractorFee || 0,
          'ค่าใช้จ่ายอื่น (บาท)': t.miscCost || 0,
          'ยอดรวมสุทธิ (บาท)': t.totalCost || 0,
          'เลขที่ใบเสร็จ/บิล': t.invoiceNumber || '-',
          'ร้านค้า/ผู้จัดจำหน่าย': t.vendorName || '-',
          'สถานะทางบัญชี': t.accountingStatus === 'paid' ? 'ชำระเงินแล้ว' : t.accountingStatus === 'verified' ? 'บันทึกบัญชีแล้ว' : 'รอตรวจสอบ',
          'หมายเหตุบัญชี': t.accountingNotes || '-'
        };
      });

      const wsLedger = XLSX.utils.json_to_sheet(ledgerRows);
      wsLedger['!cols'] = [
        { wch: 16 }, // รหัสใบแจ้งซ่อม
        { wch: 18 }, // วันที่แจ้ง
        { wch: 18 }, // เลขห้อง/จุดบริการ
        { wch: 16 }, // ประเภทงาน
        { wch: 36 }, // รายละเอียด
        { wch: 32 }, // รายการอะไหล่
        { wch: 16 }, // ค่าอะไหล่
        { wch: 14 }, // ค่าแรง
        { wch: 16 }, // ค่าผู้รับเหมา
        { wch: 16 }, // ค่าใช้จ่ายอื่น
        { wch: 18 }, // ยอดรวมสุทธิ
        { wch: 18 }, // เลขที่ใบเสร็จ/บิล
        { wch: 22 }, // ร้านค้า/ผู้จัดจำหน่าย
        { wch: 18 }, // สถานะทางบัญชี
        { wch: 28 }  // หมายเหตุบัญชี
      ];
      XLSX.utils.book_append_sheet(wb, wsLedger, 'สมุดรายวันค่าใช้จ่าย');

      const fileName = `Hotel_Maintenance_Accounting_${new Date().toISOString().slice(0, 10)}.xlsx`;
      XLSX.writeFile(wb, fileName);
    } catch (err) {
      console.error(err);
      alert('เกิดข้อผิดพลาดในการสร้างไฟล์ Excel');
    } finally {
      setIsExporting(false);
    }
  };

  // Export Accounting Voucher & Ledger to PDF (.pdf) with Unicode Thai Support
  const handleExportPDF = () => {
    setIsExporting(true);
    try {
      const doc = new jsPDF('l', 'mm', 'a4'); // Landscape for rich ledger table
      applyThaiFontToDoc(doc);
      const pageWidth = doc.internal.pageSize.getWidth();

      // Header Banner
      doc.setFillColor(15, 23, 42); // Slate 900
      doc.rect(0, 0, pageWidth, 25, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFont('Garuda', 'bold');
      doc.setFontSize(14.5);
      doc.text('ใบสรุปบัญชีค่าใช้จ่ายซ่อมแซมและบำรุงรักษาโรงแรม (Maintenance Expense Ledger)', 14, 11);
      doc.setFont('Garuda', 'normal');
      doc.setFontSize(9);
      doc.text(`${settings.hotelName} • ออกเอกสารวันที่: ${new Date().toLocaleDateString('th-TH')} • ยอดรวมสุทธิ: ฿${totalExpenses.toLocaleString()} บาท`, 14, 19);

      // Ledger Table
      const tableData = filteredTickets.map(t => {
        const partsSum = (t.partsUsed || []).reduce((sum, p) => sum + (p.quantity * p.unitPrice), 0);
        const statusText = t.accountingStatus === 'paid' ? 'ชำระแล้ว' : t.accountingStatus === 'verified' ? 'ตรวจสอบแล้ว' : 'รอตรวจ';

        return [
          t.id,
          new Date(t.createdAt).toLocaleDateString('th-TH'),
          t.roomNumber,
          t.category,
          t.description.length > 30 ? t.description.slice(0, 30) + '...' : t.description,
          partsSum > 0 ? `${partsSum.toLocaleString()}` : '-',
          t.laborCost ? `${t.laborCost.toLocaleString()}` : '-',
          t.contractorFee ? `${t.contractorFee.toLocaleString()}` : '-',
          `฿${(t.totalCost || 0).toLocaleString()}`,
          t.invoiceNumber || '-',
          t.vendorName || '-',
          statusText
        ];
      });

      autoTable(doc, {
        startY: 32,
        head: [['รหัสงาน', 'วันที่', 'ห้อง', 'หมวดหมู่', 'รายละเอียด', 'ค่าอะไหล่', 'ค่าแรง', 'ผู้รับเหมา', 'ยอดรวมสุทธิ', 'เลขที่บิล', 'ร้านค้า', 'สถานะ']],
        body: tableData,
        theme: 'striped',
        styles: { font: 'Garuda', fontStyle: 'normal', fontSize: 8, cellPadding: 2 },
        headStyles: { font: 'Garuda', fontStyle: 'bold', fillColor: [30, 41, 59], textColor: [255, 255, 255], fontSize: 8.5 },
        bodyStyles: { font: 'Garuda', fontStyle: 'normal', fontSize: 8 },
        alternateRowStyles: { font: 'Garuda' },
        columnStyles: {
          4: { cellWidth: 46 },
          8: { fontStyle: 'bold', textColor: [16, 185, 129] }
        }
      });

      // Sign-off footer
      const pageHeight = doc.internal.pageSize.getHeight();
      doc.setFont('Garuda', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(71, 85, 105);
      doc.text('เจ้าหน้าที่บัญชี: ______________________      หัวหน้าแผนกช่าง: ______________________      ผู้จัดการทั่วไป / อนุมัติ: ______________________', 14, pageHeight - 10);

      const fileName = `Hotel_Maintenance_Accounting_Voucher_${new Date().toISOString().slice(0, 10)}.pdf`;
      doc.save(fileName);
    } catch (err) {
      console.error(err);
      alert('เกิดข้อผิดพลาดในการสร้างไฟล์ PDF');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 space-y-6">
      {/* Top Banner with Financial Summary & Export Buttons */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-slate-800">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 bg-white/15 rounded-full text-xs font-medium text-amber-200 backdrop-blur-md mb-2">
              <DollarSign className="w-3.5 h-3.5 text-amber-400" />
              <span>Maintenance Cost Accounting & Ledger</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              บันทึกและรายงานค่าใช้จ่ายซ่อมแซม (ระบบบัญชี)
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
              บันทึกรายการอะไหล่ ค่าแรง ผู้รับเหมา เลขที่ใบเสร็จเพื่อทำบัญชีย้อนหลัง และส่งออกเป็น Excel (.xlsx) / PDF (.pdf) ได้ครบถ้วน
            </p>
          </div>

          {/* Export Actions */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleExportExcel}
              disabled={isExporting}
              className="px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs sm:text-sm font-bold shadow-lg shadow-emerald-950/40 flex items-center space-x-2 transition-all transform hover:-translate-y-0.5 active:scale-95 cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Export สมุดบัญชี Excel</span>
            </button>

            <button
              onClick={handleExportPDF}
              disabled={isExporting}
              className="px-5 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl text-xs sm:text-sm font-bold shadow-lg shadow-rose-950/40 flex items-center space-x-2 transition-all transform hover:-translate-y-0.5 active:scale-95 cursor-pointer"
            >
              <FileText className="w-4 h-4" />
              <span>Export ใบสรุปบัญชี PDF</span>
            </button>
          </div>
        </div>

        {/* Financial KPI Highlights */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-6 pt-4 border-t border-slate-800">
          <div className="bg-white/10 p-3 rounded-xl backdrop-blur-xs">
            <span className="text-[11px] text-slate-300 block">ยอดค่าใช้จ่ายรวม</span>
            <span className="text-xl font-bold text-amber-300">฿{totalExpenses.toLocaleString()}</span>
          </div>
          <div className="bg-white/10 p-3 rounded-xl backdrop-blur-xs">
            <span className="text-[11px] text-slate-300 block">ค่าอะไหล่ & อุปกรณ์</span>
            <span className="text-xl font-bold text-sky-300">฿{totalPartsCost.toLocaleString()}</span>
          </div>
          <div className="bg-white/10 p-3 rounded-xl backdrop-blur-xs">
            <span className="text-[11px] text-slate-300 block">ค่าแรง / ค่าบริการ</span>
            <span className="text-xl font-bold text-emerald-300">฿{totalLaborCost.toLocaleString()}</span>
          </div>
          <div className="bg-white/10 p-3 rounded-xl backdrop-blur-xs">
            <span className="text-[11px] text-slate-300 block">ค่าผู้รับเหมาภายนอก</span>
            <span className="text-xl font-bold text-purple-300">฿{totalContractorFee.toLocaleString()}</span>
          </div>
          <div className="bg-white/10 p-3 rounded-xl backdrop-blur-xs">
            <span className="text-[11px] text-slate-300 block">รอตรวจสอบบัญชี</span>
            <span className="text-xl font-bold text-rose-300">{pendingAccountingCount} รายการ</span>
          </div>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="bg-white p-4 rounded-3xl border border-sky-100 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="ค้นหารหัสงาน, เลขห้อง, เลขที่บิล, ชื่อร้าน..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-sky-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filter */}
          <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl text-xs">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                statusFilter === 'all' ? 'bg-white text-slate-900 font-bold shadow-2xs' : 'text-slate-600'
              }`}
            >
              ทั้งหมด ({tickets.length})
            </button>
            <button
              onClick={() => setStatusFilter('pending')}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                statusFilter === 'pending' ? 'bg-white text-amber-800 font-bold shadow-2xs' : 'text-slate-600'
              }`}
            >
              รอตรวจสอบ ({pendingAccountingCount})
            </button>
            <button
              onClick={() => setStatusFilter('verified')}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                statusFilter === 'verified' ? 'bg-white text-blue-800 font-bold shadow-2xs' : 'text-slate-600'
              }`}
            >
              บันทึกแล้ว ({verifiedCount})
            </button>
            <button
              onClick={() => setStatusFilter('paid')}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                statusFilter === 'paid' ? 'bg-white text-emerald-800 font-bold shadow-2xs' : 'text-slate-600'
              }`}
            >
              จ่ายเงินแล้ว ({paidCount})
            </button>
          </div>
        </div>
      </div>

      {/* Itemized Accounting Ledger Table */}
      <div className="bg-white rounded-3xl border border-sky-100 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200/80 text-slate-600 font-bold">
              <tr>
                <th className="p-4">รหัสงาน / วันที่</th>
                <th className="p-4">ห้อง / จุดบริการ</th>
                <th className="p-4">หมวดหมู่ & รายละเอียด</th>
                <th className="p-4">รายการอะไหล่</th>
                <th className="p-4 text-right">ค่าอะไหล่</th>
                <th className="p-4 text-right">ค่าแรง/บริการ</th>
                <th className="p-4 text-right">ยอดรวมสุทธิ</th>
                <th className="p-4">เลขที่บิล / ร้านค้า</th>
                <th className="p-4 text-center">สถานะบัญชี</th>
                <th className="p-4 text-center">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTickets.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-slate-400">
                    ไม่พบรายการข้อมูลค่าใช้จ่ายตามเงื่อนไข
                  </td>
                </tr>
              ) : (
                filteredTickets.map(t => {
                  const partsSum = (t.partsUsed || []).reduce((sum, p) => sum + (p.quantity * p.unitPrice), 0);
                  const status = t.accountingStatus || 'pending';

                  return (
                    <tr key={t.id} className="hover:bg-sky-50/40 transition-colors">
                      <td className="p-4">
                        <span className="font-mono font-bold text-blue-700">{t.id}</span>
                        <span className="text-[11px] text-slate-400 block mt-0.5">
                          {new Date(t.createdAt).toLocaleDateString('th-TH')}
                        </span>
                      </td>

                      <td className="p-4 font-bold text-slate-800">
                        {t.roomNumber}
                        <span className="text-[10px] text-slate-400 font-normal block">{t.area}</span>
                      </td>

                      <td className="p-4 max-w-xs">
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md font-semibold text-[11px]">
                          {t.category}
                        </span>
                        <p className="text-slate-600 truncate mt-1">{t.description}</p>
                      </td>

                      <td className="p-4 text-[11px] text-slate-600 max-w-xs">
                        {t.partsUsed && t.partsUsed.length > 0 ? (
                          <div className="space-y-0.5">
                            {t.partsUsed.map((p, idx) => (
                              <div key={idx} className="truncate">
                                • {p.name} ({p.quantity} x ฿{p.unitPrice})
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>

                      <td className="p-4 text-right font-medium text-slate-700">
                        {partsSum > 0 ? `฿${partsSum.toLocaleString()}` : '-'}
                      </td>

                      <td className="p-4 text-right font-medium text-slate-700">
                        {t.laborCost || t.contractorFee ? (
                          <span>฿{((t.laborCost || 0) + (t.contractorFee || 0)).toLocaleString()}</span>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>

                      <td className="p-4 text-right font-bold text-emerald-700 text-sm">
                        ฿{(t.totalCost || 0).toLocaleString()}
                      </td>

                      <td className="p-4 text-[11px]">
                        <span className="font-mono text-slate-800 font-semibold block">
                          {t.invoiceNumber ? `#${t.invoiceNumber}` : '-'}
                        </span>
                        <span className="text-slate-500 truncate block">
                          {t.vendorName || '-'}
                        </span>
                      </td>

                      <td className="p-4 text-center">
                        <span className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border ${
                          status === 'paid'
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                            : status === 'verified'
                              ? 'bg-blue-100 text-blue-800 border-blue-300'
                              : 'bg-amber-100 text-amber-800 border-amber-300'
                        }`}>
                          {status === 'paid' ? 'ชำระแล้ว' : status === 'verified' ? 'บันทึกแล้ว' : 'รอตรวจ'}
                        </span>
                      </td>

                      <td className="p-4 text-center">
                        <button
                          onClick={() => openEditModal(t)}
                          className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold rounded-xl border border-blue-200 transition-colors flex items-center space-x-1 mx-auto cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>ลงบัญชี/แก้ไข</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Cost & Accounting Modal */}
      {editingTicket && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
                    {editingTicket.id}
                  </span>
                  <span className="text-xs text-slate-500">ห้อง {editingTicket.roomNumber} ({editingTicket.category})</span>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mt-1">บันทึกค่าใช้จ่าย & ข้อมูลทางบัญชี</h3>
              </div>
              <button
                onClick={() => setEditingTicket(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-5 mt-5">
              {/* Parts & Items List Builder */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Receipt className="w-4 h-4 text-sky-600" />
                    <span>รายการอะไหล่ & วัสดุอุปกรณ์ที่ใช้:</span>
                  </label>
                  <button
                    type="button"
                    onClick={addPartRow}
                    className="px-2.5 py-1 text-xs font-semibold bg-sky-50 text-sky-700 hover:bg-sky-100 rounded-lg border border-sky-200 flex items-center space-x-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>เพิ่มรายการ</span>
                  </button>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto p-1 bg-slate-50/60 rounded-2xl border border-slate-200/80">
                  {partsList.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-4">ยังไม่มีรายการอะไหล่ กด "+ เพิ่มรายการ"</p>
                  ) : (
                    partsList.map((part, idx) => (
                      <div key={idx} className="flex items-center gap-2 bg-white p-2 rounded-xl border border-slate-200">
                        <input
                          type="text"
                          value={part.name}
                          onChange={(e) => updatePartItem(idx, 'name', e.target.value)}
                          placeholder="ชื่ออะไหล่/วัสดุ เช่น สายชำระ, หลอดไฟ"
                          className="flex-1 px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white"
                        />
                        <input
                          type="number"
                          min="1"
                          value={part.quantity}
                          onChange={(e) => updatePartItem(idx, 'quantity', Math.max(1, parseInt(e.target.value) || 1))}
                          placeholder="จำนวน"
                          className="w-16 px-2 py-1.5 text-xs text-center bg-slate-50 border border-slate-200 rounded-lg focus:bg-white"
                        />
                        <input
                          type="number"
                          min="0"
                          value={part.unitPrice}
                          onChange={(e) => updatePartItem(idx, 'unitPrice', Math.max(0, parseFloat(e.target.value) || 0))}
                          placeholder="ราคา/หน่วย"
                          className="w-24 px-2 py-1.5 text-xs text-right bg-slate-50 border border-slate-200 rounded-lg focus:bg-white"
                        />
                        <span className="text-xs font-bold text-slate-700 w-20 text-right">
                          ฿{(part.quantity * part.unitPrice).toLocaleString()}
                        </span>
                        <button
                          type="button"
                          onClick={() => removePartRow(idx)}
                          className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Other Expenses: Labor, Contractor, Misc */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">ค่าแรง / ค่าบริการช่าง (บาท)</label>
                  <input
                    type="number"
                    min="0"
                    value={laborCost}
                    onChange={(e) => setLaborCost(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">ค่าจ้างผู้รับเหมาภายนอก (บาท)</label>
                  <input
                    type="number"
                    min="0"
                    value={contractorFee}
                    onChange={(e) => setContractorFee(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">ค่าใช้จ่ายเบ็ดเตล็ด (บาท)</label>
                  <input
                    type="number"
                    min="0"
                    value={miscCost}
                    onChange={(e) => setMiscCost(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white"
                  />
                </div>
              </div>

              {/* Grand Total Bar */}
              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-emerald-800">ยอดรวมค่าใช้จ่ายสุทธิ (Grand Total):</span>
                  <p className="text-[11px] text-emerald-600">ค่าอะไหล่ (฿{modalPartsTotal}) + ค่าแรง/บริการ (฿{laborCost + contractorFee + miscCost})</p>
                </div>
                <span className="text-2xl font-black text-emerald-800">฿{modalGrandTotal.toLocaleString()}</span>
              </div>

              {/* Invoice Number, Vendor Name, Accounting Status */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">เลขที่ใบเสร็จ / ใบกำกับภาษี</label>
                  <input
                    type="text"
                    value={invoiceNumber}
                    onChange={(e) => setInvoiceNumber(e.target.value)}
                    placeholder="เช่น INV-2026-0891"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">ร้านค้า / ผู้จัดจำหน่าย</label>
                  <input
                    type="text"
                    value={vendorName}
                    onChange={(e) => setVendorName(e.target.value)}
                    placeholder="เช่น ไทวัสดุ, โฮมโปร, ร้านเจริญการช่าง"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">สถานะทางบัญชี</label>
                  <select
                    value={accountingStatus}
                    onChange={(e) => setAccountingStatus(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white cursor-pointer font-semibold"
                  >
                    <option value="pending">รอตรวจสอบบัญชี</option>
                    <option value="verified">บันทึกบัญชีแล้ว</option>
                    <option value="paid">ชำระเงินเรียบร้อยแล้ว</option>
                  </select>
                </div>
              </div>

              {/* Accounting Notes */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">หมายเหตุฝ่ายบัญชี</label>
                <textarea
                  value={accountingNotes}
                  onChange={(e) => setAccountingNotes(e.target.value)}
                  placeholder="บันทึกข้อความสำหรับฝ่ายบัญชีหรือการเบิกจ่ายงบ..."
                  rows={2}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={() => setEditingTicket(null)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition-colors"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleSaveCost}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-md transition-colors flex items-center space-x-1.5 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>บันทึกข้อมูลบัญชี</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

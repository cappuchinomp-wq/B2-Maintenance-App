import React, { useState, useMemo } from 'react';
import { useMaintenance } from '../context/MaintenanceContext';
import { 
  BarChart3, 
  Download, 
  FileSpreadsheet, 
  FileText, 
  Calendar, 
  Filter, 
  TrendingUp, 
  Clock, 
  DollarSign, 
  CheckCircle2, 
  AlertTriangle, 
  Layers, 
  Building2, 
  Wrench, 
  Printer,
  Sparkles,
  ChevronRight
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  Cell, 
  PieChart, 
  Pie, 
  AreaChart, 
  Area 
} from 'recharts';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { HOTEL_FLOORS, ROOM_TYPE_NAMES } from '../data/mockData';
import { applyThaiFontToDoc } from '../services/pdfHelper';

export const AnalyticsReportView: React.FC = () => {
  const { tickets, settings } = useMaintenance();
  const [timeRange, setTimeRange] = useState<'7' | '30' | '90' | 'all'>('30');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isExporting, setIsExporting] = useState(false);

  // Filter tickets by date range
  const filteredTickets = useMemo(() => {
    if (timeRange === 'all') {
      return selectedCategory === 'all' ? tickets : tickets.filter(t => t.category === selectedCategory);
    }
    const days = parseInt(timeRange, 10);
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    return tickets.filter(t => {
      const tDate = new Date(t.createdAt);
      const inDate = tDate >= cutoff;
      const inCat = selectedCategory === 'all' || t.category === selectedCategory;
      return inDate && inCat;
    });
  }, [tickets, timeRange, selectedCategory]);

  // Key Metrics
  const totalVolume = filteredTickets.length;
  const completedTickets = filteredTickets.filter(t => t.status === 'completed');
  const pendingTickets = filteredTickets.filter(t => t.status === 'pending' || t.status === 'in_progress');
  const criticalTickets = filteredTickets.filter(t => t.urgency === 'Critical' || t.urgency === 'High');
  const totalCost = filteredTickets.reduce((sum, t) => sum + (t.totalCost || 0), 0);
  const avgCostPerTicket = totalVolume > 0 ? Math.round(totalCost / totalVolume) : 0;
  const completionRate = totalVolume > 0 ? Math.round((completedTickets.length / totalVolume) * 100) : 0;

  // Average Resolution Time (Hours)
  const avgResolutionHours = useMemo(() => {
    if (completedTickets.length === 0) return 2.4;
    const totalHours = completedTickets.reduce((sum, t) => {
      const start = new Date(t.createdAt).getTime();
      const end = new Date(t.completedAt || t.updatedAt).getTime();
      return sum + Math.max(0.5, (end - start) / (1000 * 60 * 60));
    }, 0);
    return Number((totalHours / completedTickets.length).toFixed(1));
  }, [completedTickets]);

  // Breakdown by Category
  const categoryData = useMemo(() => {
    const cats: Record<string, { count: number; cost: number; completed: number }> = {};
    filteredTickets.forEach(t => {
      if (!cats[t.category]) {
        cats[t.category] = { count: 0, cost: 0, completed: 0 };
      }
      cats[t.category].count += 1;
      cats[t.category].cost += (t.totalCost || 0);
      if (t.status === 'completed') cats[t.category].completed += 1;
    });

    const colors: Record<string, string> = {
      'แอร์': '#0284c7',
      'ไฟฟ้า': '#f59e0b',
      'ประปา': '#06b6d4',
      'เฟอร์นิเจอร์': '#ea580c',
      'ไอที / อินเตอร์เน็ต': '#6366f1',
      'Fire Alarm': '#ef4444',
      'งานสี / โครงสร้างอาคาร': '#ec4899',
      'อื่นๆ': '#64748b',
    };

    return Object.entries(cats).map(([name, data]) => ({
      name,
      count: data.count,
      cost: data.cost,
      completed: data.completed,
      color: colors[name] || '#3b82f6'
    })).sort((a, b) => b.count - a.count);
  }, [filteredTickets]);

  // Breakdown by Floor (ชั้น 3 - 9)
  const floorData = useMemo(() => {
    return HOTEL_FLOORS.map(fl => {
      const floorTickets = filteredTickets.filter(t => t.roomNumber.startsWith(fl.toString()));
      const cost = floorTickets.reduce((sum, t) => sum + (t.totalCost || 0), 0);
      return {
        floor: `ชั้น ${fl}`,
        count: floorTickets.length,
        cost: cost
      };
    });
  }, [filteredTickets]);

  // Top Rooms with Most Repairs
  const topRooms = useMemo(() => {
    const counts: Record<string, { count: number; cost: number; area: string }> = {};
    filteredTickets.forEach(t => {
      const key = t.roomNumber || t.area;
      if (!counts[key]) {
        counts[key] = { count: 0, cost: 0, area: t.area };
      }
      counts[key].count += 1;
      counts[key].cost += (t.totalCost || 0);
    });

    return Object.entries(counts)
      .map(([room, data]) => ({ room, ...data }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [filteredTickets]);

  // Export to Excel (.xlsx)
  const handleExportExcel = () => {
    setIsExporting(true);
    try {
      const wb = XLSX.utils.book_new();

      // Sheet 1: Executive Summary
      const summaryRows = [
        ['รายงานวิเคราะห์การแจ้งซ่อมและงานบำรุงรักษาโรงแรม (Maintenance Analytics Report)'],
        ['โรงแรม:', settings.hotelName],
        ['ช่วงเวลาข้อมูล:', timeRange === 'all' ? 'ข้อมูลทั้งหมด' : `${timeRange} วันล่าสุด`],
        ['วันที่ออกรายงาน:', new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })],
        [],
        ['ดัชนีชี้วัดหลัก (KPI Summary)', 'ค่า'],
        ['จำนวนงานแจ้งซ่อมทั้งหมด (รายการ)', totalVolume],
        ['งานที่ซ่อมเสร็จสิ้น (รายการ)', completedTickets.length],
        ['อัตราความสำเร็จในการซ่อม (%)', `${completionRate}%`],
        ['ระยะเวลาเฉลี่ยในการปิดงาน (ชั่วโมง)', `${avgResolutionHours} ชม.`],
        ['งานด่วนวิกฤต (Critical/High)', criticalTickets.length],
        ['ค่าใช้จ่ายในการซ่อมแซมรวม (บาท)', totalCost],
        ['ค่าใช้จ่ายเฉลี่ยต่องาน (บาท)', avgCostPerTicket],
        [],
        ['สรุปแยกตามประเภทงานซ่อม (Category Breakdown)'],
        ['ประเภทงาน', 'จำนวนงาน (รายการ)', 'ซ่อมเสร็จ (รายการ)', 'ค่าใช้จ่ายรวม (บาท)'],
        ...categoryData.map(c => [c.name, c.count, c.completed, c.cost]),
        [],
        ['สรุปแยกตามชั้นห้องพัก (Floor Breakdown)'],
        ['ชั้น', 'จำนวนงาน (รายการ)', 'ค่าใช้จ่ายรวม (บาท)'],
        ...floorData.map(f => [f.floor, f.count, f.cost])
      ];

      const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows);
      wsSummary['!cols'] = [
        { wch: 38 },
        { wch: 22 },
        { wch: 20 },
        { wch: 22 }
      ];
      XLSX.utils.book_append_sheet(wb, wsSummary, 'ภาพรวมและวิเคราะห์');

      // Sheet 2: All Filtered Tickets
      const ticketRows = filteredTickets.map(t => ({
        'รหัสใบแจ้งซ่อม': t.id,
        'วันที่แจ้ง': new Date(t.createdAt).toLocaleDateString('th-TH'),
        'พื้นที่/อาคาร': t.area,
        'เลขห้อง/จุดบริการ': t.roomNumber,
        'แผนกที่แจ้ง': t.department,
        'ประเภทงาน': t.category,
        'ความเร่งด่วน': t.urgency,
        'รายละเอียดอาการเสีย': t.description,
        'ผู้แจ้ง': t.reporterName,
        'สถานะงาน': t.status === 'completed' ? 'เสร็จสิ้น' : (t.status === 'in_progress' ? 'กำลังซ่อม' : (t.status === 'pending_inspection' ? 'รอตรวจรับ' : 'รอดำเนินการ')),
        'ช่างผู้รับผิดชอบ': t.assignedTechnician?.name || '-',
        'บันทึกช่าง': t.technicianNotes || '-',
        'ค่าใช้จ่ายรวม (บาท)': t.totalCost || 0,
        'เลขที่ใบเสร็จ/บิล': t.invoiceNumber || '-',
        'ผู้ตรวจรับ': t.inspection?.inspectedBy || '-',
        'คะแนนตรวจรับ': t.inspection?.rating ? `${t.inspection.rating} ดาว` : '-'
      }));

      const wsTickets = XLSX.utils.json_to_sheet(ticketRows);
      wsTickets['!cols'] = [
        { wch: 16 }, // รหัสใบแจ้งซ่อม
        { wch: 18 }, // วันที่แจ้ง
        { wch: 16 }, // พื้นที่/อาคาร
        { wch: 18 }, // เลขห้อง/จุดบริการ
        { wch: 18 }, // แผนกที่แจ้ง
        { wch: 16 }, // ประเภทงาน
        { wch: 14 }, // ความเร่งด่วน
        { wch: 38 }, // รายละเอียดอาการเสีย
        { wch: 18 }, // ผู้แจ้ง
        { wch: 16 }, // สถานะงาน
        { wch: 22 }, // ช่างผู้รับผิดชอบ
        { wch: 32 }, // บันทึกช่าง
        { wch: 18 }, // ค่าใช้จ่ายรวม
        { wch: 18 }, // เลขที่ใบเสร็จ/บิล
        { wch: 20 }, // ผู้ตรวจรับ
        { wch: 14 }  // คะแนนตรวจรับ
      ];
      XLSX.utils.book_append_sheet(wb, wsTickets, 'รายการแจ้งซ่อมทั้งหมด');

      const fileName = `Hotel_Maintenance_Analytics_${new Date().toISOString().slice(0, 10)}.xlsx`;
      XLSX.writeFile(wb, fileName);
    } catch (err) {
      console.error(err);
      alert('เกิดข้อผิดพลาดในการสร้างไฟล์ Excel');
    } finally {
      setIsExporting(false);
    }
  };

  // Export to PDF (.pdf) with Unicode Thai Support
  const handleExportPDF = () => {
    setIsExporting(true);
    try {
      const doc = new jsPDF('p', 'mm', 'a4');
      applyThaiFontToDoc(doc);
      const pageWidth = doc.internal.pageSize.getWidth();

      // Header Banner
      doc.setFillColor(14, 116, 144); // Cyan/Sky 700
      doc.rect(0, 0, pageWidth, 28, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFont('Garuda', 'bold');
      doc.setFontSize(15);
      doc.text('รายงานวิเคราะห์การแจ้งซ่อมและงานบำรุงรักษาโรงแรม', 14, 12);
      doc.setFont('Garuda', 'normal');
      doc.setFontSize(9.5);
      doc.text(`${settings.hotelName} • ช่วงเวลา: ${timeRange === 'all' ? 'ข้อมูลทั้งหมด' : timeRange + ' วันล่าสุด'} • ออกเอกสาร: ${new Date().toLocaleDateString('th-TH')}`, 14, 20);

      // KPI Table Overview
      doc.setTextColor(30, 41, 59);
      doc.setFont('Garuda', 'bold');
      doc.setFontSize(11);
      doc.text('1. ดัชนีชี้วัดประสิทธิภาพงานซ่อมบำรุง (Executive KPIs)', 14, 38);

      autoTable(doc, {
        startY: 42,
        head: [['ตัวชี้วัด (KPI Metric)', 'จำนวน/สถิติ', 'คำอธิบาย']],
        body: [
          ['งานแจ้งซ่อมทั้งหมด (Total Tickets)', `${totalVolume} รายการ`, 'จำนวนคำขอซ่อมที่บันทึกเข้าระบบ'],
          ['อัตราซ่อมเสร็จสิ้น (Completion Rate)', `${completionRate}% (${completedTickets.length} งาน)`, 'งานที่ตรวจรับและปิดงานเรียบร้อย'],
          ['ระยะเวลาเฉลี่ยในการปิดงาน (Avg Resolution)', `${avgResolutionHours} ชั่วโมง`, 'ความเร็วในการเข้าแก้ไขจนเสร็จสิ้น'],
          ['งานด่วนวิกฤต (Critical/High)', `${criticalTickets.length} งาน`, 'งานที่กระทบห้องพักและลูกค้าโดยตรง'],
          ['ค่าใช้จ่ายในการซ่อมแซมรวม (Total Cost)', `฿${totalCost.toLocaleString()} บาท`, 'รวมค่าอะไหล่และค่าแรงช่าง'],
          ['ค่าซ่อมเฉลี่ยต่องาน (Avg Cost/Ticket)', `฿${avgCostPerTicket.toLocaleString()} บาท`, 'เฉลี่ยต่อรายการซ่อม']
        ],
        theme: 'striped',
        styles: { font: 'Garuda', fontStyle: 'normal', fontSize: 8.5, cellPadding: 2.5 },
        headStyles: { font: 'Garuda', fontStyle: 'bold', fillColor: [14, 116, 144], textColor: [255, 255, 255] },
        bodyStyles: { font: 'Garuda', fontStyle: 'normal' },
        alternateRowStyles: { font: 'Garuda' }
      });

      // Category Breakdown Table
      const finalY1 = (doc as any).lastAutoTable.finalY || 100;
      doc.setFont('Garuda', 'bold');
      doc.setFontSize(11);
      doc.text('2. สรุปแยกตามหมวดหมู่งานซ่อม (Category Breakdown)', 14, finalY1 + 10);

      autoTable(doc, {
        startY: finalY1 + 14,
        head: [['หมวดหมู่งาน', 'จำนวนงาน', 'สัดส่วน (%)', 'ปิดงานแล้ว', 'ค่าใช้จ่ายรวม (บาท)']],
        body: categoryData.map(c => [
          c.name,
          `${c.count} งาน`,
          totalVolume > 0 ? `${((c.count / totalVolume) * 100).toFixed(1)}%` : '0%',
          `${c.completed} งาน`,
          `฿${c.cost.toLocaleString()}`
        ]),
        theme: 'grid',
        styles: { font: 'Garuda', fontStyle: 'normal', fontSize: 8.5, cellPadding: 2 },
        headStyles: { font: 'Garuda', fontStyle: 'bold', fillColor: [30, 64, 175], textColor: [255, 255, 255] },
        bodyStyles: { font: 'Garuda', fontStyle: 'normal' },
        alternateRowStyles: { font: 'Garuda' }
      });

      // Floor breakdown & top rooms
      const finalY2 = (doc as any).lastAutoTable.finalY || 160;
      if (finalY2 < 220) {
        doc.setFont('Garuda', 'bold');
        doc.setFontSize(11);
        doc.text('3. สรุปแยกตามชั้นห้องพัก (Floor Breakdown ชั้น 3-9)', 14, finalY2 + 10);

        autoTable(doc, {
          startY: finalY2 + 14,
          head: [['ชั้น', 'จำนวนงาน', 'ค่าใช้จ่ายรวม (บาท)']],
          body: floorData.map(f => [f.floor, `${f.count} งาน`, `฿${f.cost.toLocaleString()}`]),
          theme: 'striped',
          styles: { font: 'Garuda', fontStyle: 'normal', fontSize: 8.5, cellPadding: 2 },
          headStyles: { font: 'Garuda', fontStyle: 'bold', fillColor: [71, 85, 105], textColor: [255, 255, 255] },
          bodyStyles: { font: 'Garuda', fontStyle: 'normal' },
          alternateRowStyles: { font: 'Garuda' }
        });
      }

      // Sign-off footer
      const pageHeight = doc.internal.pageSize.getHeight();
      doc.setFont('Garuda', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(100, 116, 139);
      doc.text('ผู้จัดทำรายงาน: ______________________      ผู้ตรวจสอบ / ผู้จัดการ: ______________________', 14, pageHeight - 12);

      const fileName = `Hotel_Maintenance_Analytics_${new Date().toISOString().slice(0, 10)}.pdf`;
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
      {/* Top Banner with Export Buttons */}
      <div className="bg-gradient-to-r from-sky-800 via-blue-900 to-indigo-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 bg-white/15 rounded-full text-xs font-medium text-sky-100 backdrop-blur-md mb-2">
              <BarChart3 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Executive Analytics & Maintenance Insights</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              รายงานวิเคราะห์การแจ้งซ่อมและงานบำรุงรักษาโรงแรม
            </h1>
            <p className="text-xs sm:text-sm text-sky-100 mt-1 max-w-2xl leading-relaxed">
              วิเคราะห์ความถี่ปัญหา สถิติการปิดงาน ค่าใช้จ่ายซ่อมแซมรายหมวดหมู่ และส่งออกรายงาน Excel (.xlsx) / PDF (.pdf) ได้ทันที
            </p>
          </div>

          {/* Export Actions */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleExportExcel}
              disabled={isExporting}
              className="px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs sm:text-sm font-bold shadow-lg shadow-emerald-950/30 flex items-center space-x-2 transition-all transform hover:-translate-y-0.5 active:scale-95 cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Export Excel (.xlsx)</span>
            </button>

            <button
              onClick={handleExportPDF}
              disabled={isExporting}
              className="px-5 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl text-xs sm:text-sm font-bold shadow-lg shadow-rose-950/30 flex items-center space-x-2 transition-all transform hover:-translate-y-0.5 active:scale-95 cursor-pointer"
            >
              <FileText className="w-4 h-4" />
              <span>Export PDF (.pdf)</span>
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="mt-6 pt-4 border-t border-white/15 flex flex-wrap items-center justify-between gap-3">
          {/* Time range filter */}
          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold text-sky-200 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" /> ช่วงเวลา:
            </span>
            <div className="flex items-center space-x-1 bg-white/10 p-1 rounded-xl backdrop-blur-xs">
              {[
                { id: '7', label: '7 วันล่าสุด' },
                { id: '30', label: '30 วันล่าสุด' },
                { id: '90', label: '90 วันล่าสุด' },
                { id: 'all', label: 'ทั้งหมด' },
              ].map(item => (
                <button
                  key={item.id}
                  onClick={() => setTimeRange(item.id as any)}
                  className={`px-3 py-1 text-xs rounded-lg font-medium transition-all cursor-pointer ${
                    timeRange === item.id ? 'bg-white text-blue-900 font-bold shadow-xs' : 'text-sky-100 hover:bg-white/10'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Category Filter */}
          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold text-sky-200 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" /> หมวดหมู่:
            </span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-1 bg-white/10 border border-white/20 text-white rounded-xl text-xs font-medium focus:bg-slate-900 cursor-pointer"
            >
              <option value="all" className="text-slate-900">ทุกหมวดหมู่ ({tickets.length})</option>
              {categoryData.map(c => (
                <option key={c.name} value={c.name} className="text-slate-900">{c.name} ({c.count})</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-2xl border border-sky-100 shadow-2xs">
          <span className="text-xs font-medium text-slate-500 block">งานแจ้งทั้งหมด</span>
          <p className="text-2xl font-black text-slate-900 mt-1">{totalVolume}</p>
          <span className="text-[11px] text-sky-600 font-medium">รายการในช่วงนี้</span>
        </div>

        <div className="bg-emerald-50/70 p-4 rounded-2xl border border-emerald-200 shadow-2xs">
          <span className="text-xs font-semibold text-emerald-800 block">อัตราปิดงานสำเร็จ</span>
          <p className="text-2xl font-black text-emerald-700 mt-1">{completionRate}%</p>
          <span className="text-[11px] text-emerald-600 font-medium">{completedTickets.length} / {totalVolume} งาน</span>
        </div>

        <div className="bg-blue-50/70 p-4 rounded-2xl border border-blue-200 shadow-2xs">
          <span className="text-xs font-semibold text-blue-800 block">เวลาเฉลี่ยในการซ่อม</span>
          <p className="text-2xl font-black text-blue-700 mt-1">{avgResolutionHours} ชม.</p>
          <span className="text-[11px] text-blue-600 font-medium">ต่อหนึ่งใบงาน</span>
        </div>

        <div className="bg-red-50/70 p-4 rounded-2xl border border-red-200 shadow-2xs">
          <span className="text-xs font-semibold text-red-800 block">งานด่วนวิกฤต (Critical)</span>
          <p className="text-2xl font-black text-red-700 mt-1">{criticalTickets.length}</p>
          <span className="text-[11px] text-red-600 font-medium">กระทบแขกโดยตรง</span>
        </div>

        <div className="bg-amber-50/70 p-4 rounded-2xl border border-amber-200 shadow-2xs">
          <span className="text-xs font-semibold text-amber-800 block">ค่าใช้จ่ายรวม</span>
          <p className="text-2xl font-black text-amber-900 mt-1">฿{totalCost.toLocaleString()}</p>
          <span className="text-[11px] text-amber-700 font-medium">ค่าอะไหล่ & ค่าบริการ</span>
        </div>

        <div className="bg-purple-50/70 p-4 rounded-2xl border border-purple-200 shadow-2xs">
          <span className="text-xs font-semibold text-purple-800 block">ค่าซ่อมเฉลี่ย/งาน</span>
          <p className="text-2xl font-black text-purple-700 mt-1">฿{avgCostPerTicket.toLocaleString()}</p>
          <span className="text-[11px] text-purple-600 font-medium">ต้นทุนเฉลี่ย</span>
        </div>
      </div>

      {/* Main Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Category Volume & Cost Breakdown */}
        <div className="bg-white p-6 rounded-3xl border border-sky-100 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900">สัดส่วนงานแจ้งซ่อมและค่าใช้จ่ายตามประเภท</h3>
              <p className="text-xs text-slate-500">จำนวนงานและยอดค่าซ่อมแซมแยกตาม 8 หมวดหมู่</p>
            </div>
            <div className="p-2 bg-sky-50 text-sky-700 rounded-xl">
              <BarChart3 className="w-5 h-5" />
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-25} textAnchor="end" />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip 
                  formatter={(val: any, name: any) => [
                    name === 'count' ? `${val} รายการ` : `฿${Number(val).toLocaleString()}`,
                    name === 'count' ? 'จำนวนงาน' : 'ค่าใช้จ่าย'
                  ]} 
                />
                <Bar dataKey="count" name="count" radius={[6, 6, 0, 0]}>
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-100">
            {categoryData.slice(0, 4).map(c => (
              <div key={c.name} className="p-2.5 bg-slate-50 rounded-xl text-xs">
                <span className="font-semibold text-slate-700 truncate block">{c.name}</span>
                <span className="text-sm font-bold text-slate-900">{c.count} งาน</span>
                <span className="text-[10px] text-slate-500 block">฿{c.cost.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Chart 2: Floor Breakdown (ชั้น 3 - 9) */}
        <div className="bg-white p-6 rounded-3xl border border-sky-100 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900">สถิติงานซ่อมแยกตามชั้นห้องพัก (ชั้น 3-9)</h3>
              <p className="text-xs text-slate-500">จำนวนงานในแต่ละชั้น (18 ห้อง/ชั้น รวม 126 ห้อง)</p>
            </div>
            <div className="p-2 bg-indigo-50 text-indigo-700 rounded-xl">
              <Building2 className="w-5 h-5" />
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={floorData} margin={{ top: 10, right: 10, left: -20, bottom: 10 }}>
                <defs>
                  <linearGradient id="floorGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="floor" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(val: any) => [`${val} รายการ`, 'จำนวนงาน']} />
                <Area type="monotone" dataKey="count" stroke="#2563eb" strokeWidth={3} fillOpacity={1} fill="url(#floorGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-7 gap-1 pt-2 border-t border-slate-100 text-center">
            {floorData.map(f => (
              <div key={f.floor} className="p-1.5 bg-slate-50 rounded-lg">
                <span className="text-[10px] text-slate-500 block">{f.floor}</span>
                <span className="text-xs font-bold text-slate-800">{f.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top 5 Locations / Rooms with Highest Maintenance Activity */}
      <div className="bg-white p-6 rounded-3xl border border-sky-100 shadow-2xs space-y-4">
        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <span>📍 จุดและห้องพักที่พบการแจ้งซ่อมบ่อยที่สุด (Top 5 High Maintenance Areas)</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {topRooms.map((room, idx) => (
            <div key={room.room} className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200/80 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-blue-100 text-blue-800">
                    อันดับ #{idx + 1}
                  </span>
                  <span className="text-xs font-semibold text-slate-400">{room.area}</span>
                </div>
                <h4 className="text-lg font-black text-slate-900 mt-2">{room.room}</h4>
              </div>

              <div className="mt-4 pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs">
                <span className="text-slate-500">จำนวน: <strong className="text-slate-800">{room.count} งาน</strong></span>
                <span className="text-emerald-700 font-bold">฿{room.cost.toLocaleString()}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

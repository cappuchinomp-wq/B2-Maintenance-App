import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { useMaintenance } from '../context/MaintenanceContext';
import { MaintenanceTicket, LocationArea, WorkCategory, Department, UrgencyLevel, TicketStatus } from '../types/maintenance';
import { 
  FileSpreadsheet, 
  Upload, 
  Download, 
  CheckCircle2, 
  AlertCircle, 
  ArrowDownToLine, 
  RefreshCw, 
  FileText, 
  Trash2,
  Table as TableIcon
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const ExcelImportExportView: React.FC = () => {
  const { tickets, importTicketsFromExcel, settings } = useMaintenance();
  const [parsedRows, setParsedRows] = useState<MaintenanceTicket[]>([]);
  const [fileName, setFileName] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [importStatus, setImportStatus] = useState<{ success?: boolean; message?: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Download Standard Excel Template
  const downloadTemplate = () => {
    const templateData = [
      {
        'รหัสแจ้งซ่อม (Ticket ID)': 'TK-202609-EX1',
        'วันที่แจ้ง (YYYY-MM-DD)': '2026-09-25',
        'พื้นที่/อาคาร': 'ห้องพัก',
        'เลขห้อง/จุดเกิดเหตุ': '204',
        'แผนกผู้แจ้ง': 'แม่บ้าน',
        'ประเภทงาน': 'แอร์',
        'ระดับความเร่งด่วน (Critical/High/Medium/Low)': 'High',
        'รายละเอียดอาการเสีย': 'แอร์มีเสียงดังผิดปกติและเย็นช้า',
        'ชื่อผู้แจ้ง': 'นภา (แม่บ้าน)',
        'เบอร์ติดต่อ': '089-111-2233',
        'สถานะงาน (pending/in_progress/pending_inspection/completed)': 'completed',
        'ช่างผู้รับผิดชอบ': 'ช่างสมศักดิ์ วงศ์สวัสดิ์',
        'เบอร์โทรช่าง': '081-987-6543',
        'บันทึกการซ่อม': 'ล้างแผ่นกรองและหยอดน้ำมันพัดลมกรงกระรอก',
        'ค่าใช้จ่ายรวม': 250,
        'ผลการตรวจรับ': 'อนุมัติผ่านงาน'
      },
      {
        'รหัสแจ้งซ่อม (Ticket ID)': 'TK-202609-EX2',
        'วันที่แจ้ง (YYYY-MM-DD)': '2026-09-26',
        'พื้นที่/อาคาร': 'ลอบบี้',
        'เลขห้อง/จุดเกิดเหตุ': 'ห้องน้ำแขก ชั้น 1',
        'แผนกผู้แจ้ง': 'พนักงานต้อนรับ (GSA)',
        'ประเภทงาน': 'ประปา',
        'ระดับความเร่งด่วน (Critical/High/Medium/Low)': 'Medium',
        'รายละเอียดอาการเสีย': 'ก๊อกน้ำอ่างล้างมือปิดแล้วยังมีน้ำหยด',
        'ชื่อผู้แจ้ง': 'ธนากร (GSA)',
        'เบอร์ติดต่อ': '081-444-5566',
        'สถานะงาน (pending/in_progress/pending_inspection/completed)': 'completed',
        'ช่างผู้รับผิดชอบ': 'ช่างประสิทธิ์ บุญมี',
        'เบอร์โทรช่าง': '089-456-7890',
        'บันทึกการซ่อม': 'เปลี่ยนวาล์วเซรามิกใหม่',
        'ค่าใช้จ่ายรวม': 180,
        'ผลการตรวจรับ': 'อนุมัติผ่านงาน'
      }
    ];

    const ws = XLSX.utils.json_to_sheet(templateData);
    ws['!cols'] = [
      { wch: 24 }, // รหัสแจ้งซ่อม
      { wch: 20 }, // วันที่แจ้ง
      { wch: 16 }, // พื้นที่/อาคาร
      { wch: 20 }, // เลขห้อง/จุดเกิดเหตุ
      { wch: 22 }, // แผนกผู้แจ้ง
      { wch: 16 }, // ประเภทงาน
      { wch: 26 }, // ระดับความเร่งด่วน
      { wch: 40 }, // รายละเอียดอาการเสีย
      { wch: 20 }, // ชื่อผู้แจ้ง
      { wch: 18 }, // เบอร์ติดต่อ
      { wch: 34 }, // สถานะงาน
      { wch: 24 }, // ช่างผู้รับผิดชอบ
      { wch: 18 }, // เบอร์โทรช่าง
      { wch: 36 }, // บันทึกการซ่อม
      { wch: 16 }, // ค่าใช้จ่ายรวม
      { wch: 18 }  // ผลการตรวจรับ
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template_นำเข้าข้อมูลซ่อม');
    XLSX.writeFile(wb, 'Hotel_Maintenance_Import_Template.xlsx');
  };

  // Export current tickets to Excel
  const exportCurrentData = () => {
    const dataToExport = tickets.map(t => ({
      'รหัสแจ้งซ่อม': t.id,
      'วันที่แจ้ง': new Date(t.createdAt).toLocaleString('th-TH'),
      'พื้นที่/อาคาร': t.area,
      'เลขห้อง/ตำแหน่ง': t.roomNumber,
      'แผนกผู้แจ้ง': t.department,
      'ประเภทงาน': t.category,
      'ความเร่งด่วน': t.urgency,
      'รายละเอียดอาการ': t.description,
      'ผู้แจ้ง': t.reporterName,
      'เบอร์ติดต่อผู้แจ้ง': t.reporterPhone,
      'สถานะงาน': t.status === 'completed' ? 'เสร็จสิ้น' : (t.status === 'in_progress' ? 'กำลังซ่อม' : (t.status === 'pending_inspection' ? 'รอตรวจรับ' : 'รอดำเนินการ')),
      'ช่างรับผิดชอบ': t.assignedTechnician?.name || '-',
      'เบอร์ช่าง': t.assignedTechnician?.phone || '-',
      'บันทึกการซ่อม': t.technicianNotes || '-',
      'ค่าใช้จ่าย (บาท)': t.totalCost || 0,
      'ผลตรวจรับ': t.inspection?.status === 'approved' ? 'อนุมัติผ่าน' : (t.inspection?.status === 'rejected' ? 'ส่งกลับแก้ไข' : 'ยังไม่ตรวจ'),
      'วันที่อัปเดต': new Date(t.updatedAt).toLocaleString('th-TH')
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    ws['!cols'] = [
      { wch: 16 },
      { wch: 20 },
      { wch: 16 },
      { wch: 18 },
      { wch: 18 },
      { wch: 16 },
      { wch: 14 },
      { wch: 38 },
      { wch: 18 },
      { wch: 16 },
      { wch: 16 },
      { wch: 22 },
      { wch: 16 },
      { wch: 32 },
      { wch: 16 },
      { wch: 16 },
      { wch: 20 }
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'รายการแจ้งซ่อมทั้งหมด');
    XLSX.writeFile(wb, `Hotel_Maintenance_Export_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  // File Upload Handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setIsProcessing(true);
    setImportStatus(null);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const buffer = evt.target?.result as ArrayBuffer;
        const data = new Uint8Array(buffer);
        const wb = XLSX.read(data, { type: 'array' });
        const wsName = wb.SheetNames[0];
        const ws = wb.Sheets[wsName];
        const rawJson: any[] = XLSX.utils.sheet_to_json(ws);

        if (!rawJson || rawJson.length === 0) {
          throw new Error('ไม่พบข้อมูลในไฟล์ Excel ที่เลือก');
        }

        // Map parsed rows to MaintenanceTicket objects
        const mappedTickets: MaintenanceTicket[] = rawJson.map((row, index) => {
          const id = row['รหัสแจ้งซ่อม (Ticket ID)'] || row['รหัสแจ้งซ่อม'] || `TK-IMP-${Date.now()}-${index + 1}`;
          const date = row['วันที่แจ้ง (YYYY-MM-DD)'] || row['วันที่แจ้ง'] || new Date().toISOString();
          const area = (row['พื้นที่/อาคาร'] as LocationArea) || 'ห้องพัก';
          const roomNumber = String(row['เลขห้อง/จุดเกิดเหตุ'] || row['เลขห้อง/ตำแหน่ง'] || '101');
          const department = (row['แผนกผู้แจ้ง'] || row['แผนก'] || 'พนักงานต้อนรับ (GSA)') as Department;
          const category = (row['ประเภทงาน'] || 'อื่นๆ') as WorkCategory;
          const urgency = (row['ระดับความเร่งด่วน (Critical/High/Medium/Low)'] || row['ความเร่งด่วน'] || 'Medium') as UrgencyLevel;
          const description = String(row['รายละเอียดอาการเสีย'] || row['รายละเอียดอาการ'] || 'ข้อมูลนำเข้าย้อนหลัง');
          const reporterName = String(row['ชื่อผู้แจ้ง'] || row['ผู้แจ้ง'] || 'นำเข้าจากระบบ');
          const reporterPhone = String(row['เบอร์ติดต่อ'] || row['เบอร์ติดต่อผู้แจ้ง'] || '0812345678');
          const status = (row['สถานะงาน (pending/in_progress/pending_inspection/completed)'] || row['สถานะงาน'] || 'completed') as TicketStatus;
          const techName = row['ช่างผู้รับผิดชอบ'] || row['ช่างรับผิดชอบ'];
          const techPhone = row['เบอร์โทรช่าง'] || row['เบอร์ช่าง'];
          const techNotes = row['บันทึกการซ่อม'];
          const totalCost = Number(row['ค่าใช้จ่ายรวม'] || row['ค่าใช้จ่าย (บาท)']) || 0;
          const inspectionStatus = row['ผลการตรวจรับ'] || row['ผลตรวจรับ'];

          return {
            id,
            createdAt: new Date(date).toISOString(),
            updatedAt: new Date().toISOString(),
            area,
            roomNumber,
            department,
            category,
            urgency,
            description,
            reporterName,
            reporterPhone,
            status: ['pending', 'in_progress', 'pending_inspection', 'completed'].includes(status) ? status : 'completed',
            assignedTechnician: techName && techName !== '-' ? {
              id: `tech-imp-${index}`,
              name: techName,
              phone: techPhone || '',
              assignedAt: new Date(date).toISOString()
            } : undefined,
            technicianNotes: techNotes !== '-' ? techNotes : undefined,
            totalCost,
            images: [],
            inspection: inspectionStatus && inspectionStatus.includes('อนุมัติ') ? {
              inspectedBy: 'ผู้ตรวจรับ (นำเข้า)',
              inspectedAt: new Date().toISOString(),
              status: 'approved',
              rating: 5,
              feedback: 'นำเข้าข้อมูลย้อนหลังสมบูรณ์'
            } : undefined,
            historyLogs: [
              {
                id: `log-imp-${Date.now()}-${index}`,
                timestamp: new Date().toISOString(),
                status: 'completed',
                action: 'นำเข้าข้อมูลประวัติย้อนหลังจากไฟล์ Excel',
                performedBy: 'ระบบ'
              }
            ]
          };
        });

        setParsedRows(mappedTickets);
        setIsProcessing(false);
      } catch (err: any) {
        console.error('Excel parse error:', err);
        setImportStatus({ success: false, message: err.message || 'ไม่สามารถอ่านไฟล์ Excel ได้ ตรวจสอบรูปแบบคอลัมน์' });
        setIsProcessing(false);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // Confirm Import
  const handleConfirmImport = async () => {
    if (parsedRows.length === 0) return;
    setIsProcessing(true);
    try {
      const count = await importTicketsFromExcel(parsedRows);
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
      setImportStatus({ success: true, message: `นำเข้าข้อมูลย้อนหลังสำเร็จ ${count} รายการ เรียบร้อยแล้ว!` });
      setParsedRows([]);
      setFileName('');
      setIsProcessing(false);
    } catch (e: any) {
      setImportStatus({ success: false, message: e.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล' });
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-700 to-sky-800 rounded-3xl p-6 sm:p-8 text-white shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="px-2.5 py-1 text-xs font-semibold bg-white/20 rounded-full backdrop-blur-xs text-emerald-100 uppercase tracking-wider">
              Bulk Data Migration & Excel Hub
            </span>
            <h2 className="text-2xl font-bold mt-2">นำเข้าข้อมูลแจ้งซ่อมย้อนหลังผ่าน Excel (.xlsx)</h2>
            <p className="text-xs sm:text-sm text-emerald-100 mt-1 max-w-2xl">
              รองรับการนำเข้าข้อมูลประวัติงานซ่อมเดิมจากไฟล์ Excel เข้าสู่ระบบและ Google Sheets ได้ในคลิกเดียว
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5">
            <button
              onClick={downloadTemplate}
              className="px-4 py-2.5 bg-white/15 hover:bg-white/25 text-white rounded-xl text-xs sm:text-sm font-semibold backdrop-blur-xs border border-white/20 flex items-center space-x-2 transition-colors"
            >
              <ArrowDownToLine className="w-4 h-4" />
              <span>ดาวน์โหลดแม่แบบ Excel</span>
            </button>
            <button
              onClick={exportCurrentData}
              className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md flex items-center space-x-2 transition-transform active:scale-95"
            >
              <Download className="w-4 h-4" />
              <span>ส่งออกข้อมูลปัจจุบัน</span>
            </button>
          </div>
        </div>
      </div>

      {/* Upload Zone */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-sky-100 shadow-2xs">
        <div className="text-center max-w-xl mx-auto">
          <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto mb-4 border border-emerald-100">
            <FileSpreadsheet className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">เลือกไฟล์ Excel ที่ต้องการนำเข้า</h3>
          <p className="text-xs text-slate-500 mt-1 mb-6">
            รองรับไฟล์นามสกุล <strong>.xlsx, .xls, .csv</strong> โดยระบบจะทำการตรวจทานความถูกต้องก่อนบันทึก
          </p>

          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx, .xls, .csv"
            onChange={handleFileUpload}
            className="hidden"
          />

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full sm:w-auto px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold rounded-2xl shadow-md flex items-center justify-center space-x-2 transition-all cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              <span>{fileName ? `เปลี่ยนไฟล์ (${fileName})` : 'อัปโหลดไฟล์ Excel ย้อนหลัง'}</span>
            </button>

            {fileName && (
              <button
                type="button"
                onClick={() => {
                  setFileName('');
                  setParsedRows([]);
                  setImportStatus(null);
                }}
                className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold rounded-2xl"
              >
                ล้างไฟล์
              </button>
            )}
          </div>

          {importStatus && (
            <div className={`mt-4 p-4 rounded-2xl text-xs font-semibold flex items-center justify-center space-x-2 ${
              importStatus.success ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'
            }`}>
              {importStatus.success ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-red-600" />}
              <span>{importStatus.message}</span>
            </div>
          )}
        </div>
      </div>

      {/* Preview Table if rows parsed */}
      {parsedRows.length > 0 && (
        <div className="bg-white rounded-3xl p-6 border border-emerald-200 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <TableIcon className="w-5 h-5 text-emerald-600" />
                <span>ตัวอย่างข้อมูลที่พร้อมนำเข้า ({parsedRows.length} รายการ)</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                โปรดตรวจสอบความถูกต้องก่อนกดปุ่มยืนยันการนำเข้าข้อมูล
              </p>
            </div>

            <button
              onClick={handleConfirmImport}
              disabled={isProcessing}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md transition-all flex items-center space-x-2"
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>กำลังบันทึกข้อมูล...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>ยืนยันการนำเข้า {parsedRows.length} รายการ</span>
                </>
              )}
            </button>
          </div>

          <div className="overflow-x-auto max-h-96">
            <table className="w-full text-left text-xs">
              <thead className="sticky top-0 bg-slate-50">
                <tr className="border-b border-slate-200 text-slate-400 uppercase text-[10px]">
                  <th className="py-2.5 px-3 font-semibold">รหัสงาน</th>
                  <th className="py-2.5 px-3 font-semibold">สถานที่ / ห้อง</th>
                  <th className="py-2.5 px-3 font-semibold">แผนก</th>
                  <th className="py-2.5 px-3 font-semibold">ประเภท</th>
                  <th className="py-2.5 px-3 font-semibold">ความด่วน</th>
                  <th className="py-2.5 px-3 font-semibold">รายละเอียดอาการ</th>
                  <th className="py-2.5 px-3 font-semibold">ช่าง</th>
                  <th className="py-2.5 px-3 font-semibold">ค่าใช้จ่าย</th>
                  <th className="py-2.5 px-3 font-semibold">สถานะ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {parsedRows.map((row, idx) => (
                  <tr key={idx} className="hover:bg-emerald-50/30">
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-900">{row.id}</td>
                    <td className="py-2.5 px-3">{row.area} ({row.roomNumber})</td>
                    <td className="py-2.5 px-3">{row.department}</td>
                    <td className="py-2.5 px-3">{row.category}</td>
                    <td className="py-2.5 px-3">{row.urgency}</td>
                    <td className="py-2.5 px-3 max-w-xs truncate">{row.description}</td>
                    <td className="py-2.5 px-3">{row.assignedTechnician?.name || '-'}</td>
                    <td className="py-2.5 px-3 font-semibold text-slate-800">฿{(row.totalCost || 0).toLocaleString()}</td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

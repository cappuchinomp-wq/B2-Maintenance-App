import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { MaintenanceTicket } from '../types/maintenance';
import { getAccessToken } from './googleAuth';
import { applyThaiFontToDoc } from './pdfHelper';

export interface EmailReportOptions {
  recipientEmails: string[];
  reportDate: string; // YYYY-MM-DD
  hotelName: string;
  tickets: MaintenanceTicket[];
  notes?: string;
  senderName?: string;
}

/**
 * Generates an Excel (.xlsx) file Buffer for the daily report
 */
export const generateDailyExcelFile = (tickets: MaintenanceTicket[] = [], dateStr: string, hotelName: string): { blob: Blob; base64: string } => {
  const safeTickets = tickets || [];
  // Sheet 1: Summary Stats
  const total = safeTickets.length;
  const completed = safeTickets.filter(t => t.status === 'completed').length;
  const inProgress = safeTickets.filter(t => t.status === 'in_progress').length;
  const pending = safeTickets.filter(t => t.status === 'pending').length;
  const pendingInspection = safeTickets.filter(t => t.status === 'pending_inspection').length;
  const critical = safeTickets.filter(t => t.urgency === 'Critical' || t.urgency === 'High').length;
  const totalCost = safeTickets.reduce((sum, t) => sum + (t.totalCost || 0), 0);

  const summaryData = [
    ['รายงานสรุปงานแจ้งซ่อมประจำวัน (Hotel Daily Maintenance Report)'],
    ['ชื่อโรงแรม / สาขา:', hotelName],
    ['ประจำวันที่:', dateStr],
    ['พิมพ์รายงานเมื่อ:', new Date().toLocaleString('th-TH')],
    [],
    ['ดัชนีชี้วัด (KPIs)', 'จำนวน (รายการ)'],
    ['จำนวนงานแจ้งทั้งหมด', total],
    ['ซ่อมเสร็จสิ้น (Completed)', completed],
    ['กำลังดำเนินการ (In Progress)', inProgress],
    ['รอดำเนินการ / รอช่าง (Pending)', pending],
    ['รอตรวจรับงาน (Pending Inspection)', pendingInspection],
    ['งานด่วนวิกฤต (Critical / High)', critical],
    ['ค่าใช้จ่ายรวมงานซ่อม (บาท)', totalCost],
    [],
    ['สรุปแยกตามแผนก:'],
    ...Object.entries(
      safeTickets.reduce((acc, t) => {
        acc[t.department] = (acc[t.department] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    ).map(([dept, count]) => [dept, count])
  ];

  // Sheet 2: Ticket Details
  const detailHeaders = [
    'รหัสแจ้งซ่อม',
    'วันที่แจ้ง',
    'พื้นที่/อาคาร',
    'เลขห้อง/ตำแหน่ง',
    'แผนก',
    'ประเภทงาน',
    'ความเร่งด่วน',
    'อาการเสีย',
    'ผู้แจ้ง',
    'เบอร์โทรผู้แจ้ง',
    'สถานะ',
    'ช่างผู้รับผิดชอบ',
    'เบอร์โทรช่าง',
    'บันทึกการซ่อม',
    'ค่าใช้จ่าย (บาท)',
    'ผลตรวจรับ'
  ];

  const detailRows = safeTickets.map(t => [
    t.id,
    new Date(t.createdAt).toLocaleString('th-TH'),
    t.area,
    t.roomNumber,
    t.department,
    t.category,
    t.urgency,
    t.description,
    t.reporterName,
    t.reporterPhone,
    t.status === 'completed' ? 'เสร็จสิ้น' : (t.status === 'in_progress' ? 'กำลังซ่อม' : (t.status === 'pending_inspection' ? 'รอตรวจรับ' : 'รอดำเนินการ')),
    t.assignedTechnician?.name || '-',
    t.assignedTechnician?.phone || '-',
    t.technicianNotes || '-',
    t.totalCost || 0,
    t.inspection?.status === 'approved' ? 'ผ่านการตรวจรับ' : (t.inspection?.status === 'rejected' ? 'ส่งแก้ไข' : 'ยังไม่ตรวจ')
  ]);

  const wb = XLSX.utils.book_new();
  const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
  const wsDetails = XLSX.utils.aoa_to_sheet([detailHeaders, ...detailRows]);

  // Set column widths for clean Thai display without cut-off
  wsSummary['!cols'] = [
    { wch: 38 },
    { wch: 30 }
  ];

  wsDetails['!cols'] = [
    { wch: 16 }, // รหัสแจ้งซ่อม
    { wch: 22 }, // วันที่แจ้ง
    { wch: 16 }, // พื้นที่/อาคาร
    { wch: 18 }, // เลขห้อง/ตำแหน่ง
    { wch: 18 }, // แผนก
    { wch: 16 }, // ประเภทงาน
    { wch: 14 }, // ความเร่งด่วน
    { wch: 42 }, // อาการเสีย
    { wch: 20 }, // ผู้แจ้ง
    { wch: 16 }, // เบอร์โทรผู้แจ้ง
    { wch: 16 }, // สถานะ
    { wch: 22 }, // ช่างผู้รับผิดชอบ
    { wch: 16 }, // เบอร์โทรช่าง
    { wch: 36 }, // บันทึกการซ่อม
    { wch: 16 }, // ค่าใช้จ่าย
    { wch: 18 }  // ผลตรวจรับ
  ];

  XLSX.utils.book_append_sheet(wb, wsSummary, 'สรุปภาพรวม');
  XLSX.utils.book_append_sheet(wb, wsDetails, 'รายการแจ้งซ่อม');

  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

  // Convert to base64
  const bytes = new Uint8Array(excelBuffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64 = btoa(binary);

  return { blob, base64 };
};

/**
 * Generates a PDF file Blob and Base64 string for the daily report with Unicode Thai support
 */
export const generateDailyPdfFile = (tickets: MaintenanceTicket[] = [], dateStr: string, hotelName: string): { blob: Blob; base64: string } => {
  const safeTickets = tickets || [];
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  // Apply Garuda Thai font so Thai characters render beautifully instead of alien characters
  applyThaiFontToDoc(doc);

  // Color Palette
  const primaryBlue = [26, 86, 219]; // #1a56db
  const bgPastel = [240, 249, 255]; // #f0f9ff

  // Header Banner
  doc.setFillColor(primaryBlue[0], primaryBlue[1], primaryBlue[2]);
  doc.rect(0, 0, 210, 28, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('Garuda', 'bold');
  doc.setFontSize(15);
  doc.text(`${hotelName} - รายงานสรุปงานแจ้งซ่อมบำรุงประจำวัน`, 14, 12);
  doc.setFont('Garuda', 'normal');
  doc.setFontSize(9.5);
  doc.text(`สรุปประจำวันที่: ${dateStr} | ออกเอกสารเมื่อ: ${new Date().toLocaleTimeString('th-TH')}`, 14, 20);

  // Statistics Summary Cards
  const total = safeTickets.length;
  const completed = safeTickets.filter(t => t.status === 'completed').length;
  const inProgress = safeTickets.filter(t => t.status === 'in_progress').length;
  const pending = safeTickets.filter(t => t.status === 'pending').length;
  const pendingInspection = safeTickets.filter(t => t.status === 'pending_inspection').length;
  const critical = safeTickets.filter(t => t.urgency === 'Critical' || t.urgency === 'High').length;
  const totalCost = safeTickets.reduce((sum, t) => sum + (t.totalCost || 0), 0);

  // Summary box
  doc.setFillColor(bgPastel[0], bgPastel[1], bgPastel[2]);
  doc.roundedRect(14, 33, 182, 32, 3, 3, 'F');

  doc.setTextColor(30, 41, 59);
  doc.setFont('Garuda', 'bold');
  doc.setFontSize(10.5);
  doc.text('ดัชนีชี้วัดประสิทธิภาพงานซ่อมบำรุง (KPIs Summary)', 18, 40);

  doc.setFont('Garuda', 'normal');
  doc.setFontSize(8.5);
  doc.text(`• งานแจ้งซ่อมทั้งหมด: ${total} รายการ`, 20, 47);
  doc.text(`• ซ่อมเสร็จสิ้น (Done): ${completed} รายการ`, 20, 53);
  doc.text(`• กำลังดำเนินการ (In Progress): ${inProgress} รายการ`, 78, 47);
  doc.text(`• รอดำเนินการ (Pending): ${pending} รายการ`, 78, 53);
  doc.text(`• รอตรวจรับงาน: ${pendingInspection} รายการ`, 138, 47);
  doc.text(`• งานด่วนวิกฤต: ${critical} รายการ`, 138, 53);
  doc.text(`• ค่าใช้จ่ายรวมประมาณการ: ฿${totalCost.toLocaleString()} บาท`, 20, 59);

  // Table of Tickets
  const tableData = safeTickets.map((t) => [
    t.id,
    `${t.area} (${t.roomNumber})`,
    t.category,
    t.urgency === 'Critical' ? 'วิกฤต' : (t.urgency === 'High' ? 'ด่วนมาก' : (t.urgency === 'Medium' ? 'ปานกลาง' : 'ทั่วไป')),
    t.description.length > 35 ? t.description.substring(0, 35) + '...' : t.description,
    t.status === 'completed' ? 'เสร็จสิ้น' : (t.status === 'in_progress' ? 'กำลังซ่อม' : (t.status === 'pending_inspection' ? 'รอตรวจรับ' : 'รอดำเนินการ')),
    t.assignedTechnician?.name || '-'
  ]);

  autoTable(doc, {
    startY: 70,
    head: [['รหัส', 'สถานที่/ห้อง', 'ประเภท', 'ความด่วน', 'รายละเอียดอาการเสีย', 'สถานะ', 'ช่างผู้รับผิดชอบ']],
    body: tableData,
    theme: 'grid',
    styles: {
      font: 'Garuda',
      fontStyle: 'normal',
      fontSize: 8,
      textColor: [51, 65, 85],
      cellPadding: 2
    },
    headStyles: {
      font: 'Garuda',
      fontStyle: 'bold',
      fillColor: [30, 58, 138],
      textColor: [255, 255, 255],
      fontSize: 8.5
    },
    bodyStyles: {
      font: 'Garuda',
      fontStyle: 'normal',
      fontSize: 8,
      textColor: [51, 65, 85]
    },
    alternateRowStyles: {
      font: 'Garuda',
      fillColor: [248, 250, 252]
    },
    columnStyles: {
      0: { cellWidth: 20 },
      1: { cellWidth: 28 },
      2: { cellWidth: 18 },
      3: { cellWidth: 16 },
      4: { cellWidth: 52 },
      5: { cellWidth: 20 },
      6: { cellWidth: 24 }
    },
    margin: { left: 14, right: 14 }
  });

  // Footer note
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFont('Garuda', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(`หน้า ${i} จาก ${pageCount} | ระบบบริหารงานแจ้งซ่อมบำรุงโรงแรม ${hotelName}`, 14, 287);
  }

  const pdfOutput = doc.output('arraybuffer');
  const blob = new Blob([pdfOutput], { type: 'application/pdf' });

  const bytes = new Uint8Array(pdfOutput);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64 = btoa(binary);

  return { blob, base64 };
};

/**
 * Builds HTML Email Body with pastel luxury hotel styling
 */
export const buildReportHtmlEmail = (
  tickets: MaintenanceTicket[], 
  reportDate: string, 
  hotelName: string, 
  notes?: string
): string => {
  const total = tickets.length;
  const completed = tickets.filter(t => t.status === 'completed').length;
  const inProgress = tickets.filter(t => t.status === 'in_progress').length;
  const pending = tickets.filter(t => t.status === 'pending').length;
  const pendingInspection = tickets.filter(t => t.status === 'pending_inspection').length;
  const critical = tickets.filter(t => t.urgency === 'Critical' || t.urgency === 'High').length;
  const totalCost = tickets.reduce((sum, t) => sum + (t.totalCost || 0), 0);

  const rowsHtml = tickets.slice(0, 15).map(t => {
    let badgeColor = '#94a3b8';
    let badgeText = 'รอดำเนินการ';
    if (t.status === 'completed') { badgeColor = '#10b981'; badgeText = 'เสร็จสิ้น'; }
    else if (t.status === 'in_progress') { badgeColor = '#0284c7'; badgeText = 'กำลังซ่อม'; }
    else if (t.status === 'pending_inspection') { badgeColor = '#f59e0b'; badgeText = 'รอตรวจรับ'; }

    let urgencyBadge = '#e2e8f0';
    let urgencyTextColor = '#475569';
    if (t.urgency === 'Critical') { urgencyBadge = '#fee2e2'; urgencyTextColor = '#dc2626'; }
    else if (t.urgency === 'High') { urgencyBadge = '#ffedd5'; urgencyTextColor = '#ea580c'; }

    return `
      <tr style="border-bottom: 1px solid #e2e8f0;">
        <td style="padding: 10px 8px; font-weight: 600; color: #1e293b; font-size: 13px;">${t.id}</td>
        <td style="padding: 10px 8px; font-size: 13px; color: #334155;"><strong>${t.area}</strong> (${t.roomNumber})</td>
        <td style="padding: 10px 8px; font-size: 13px; color: #475569;">${t.category}</td>
        <td style="padding: 10px 8px; font-size: 12px;"><span style="background: ${urgencyBadge}; color: ${urgencyTextColor}; padding: 3px 8px; border-radius: 9999px; font-weight: 600;">${t.urgency}</span></td>
        <td style="padding: 10px 8px; font-size: 13px; color: #334155;">${t.description}</td>
        <td style="padding: 10px 8px; font-size: 12px;"><span style="background: ${badgeColor}; color: #ffffff; padding: 3px 8px; border-radius: 9999px; font-weight: 500;">${badgeText}</span></td>
        <td style="padding: 10px 8px; font-size: 13px; color: #475569;">${t.assignedTechnician?.name || '-'}</td>
      </tr>
    `;
  }).join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; }
        .container { max-width: 680px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #0284c7 0%, #1e3a8a 100%); color: white; padding: 28px 24px; text-align: left; }
        .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; padding: 20px 24px; background: #f0f9ff; }
        .stat-card { background: white; padding: 12px; border-radius: 8px; text-align: center; border: 1px solid #e0f2fe; }
        .stat-val { font-size: 20px; font-weight: 700; color: #0369a1; }
        .stat-lbl { font-size: 11px; color: #64748b; margin-top: 4px; }
        .content { padding: 24px; }
        table { width: 100%; border-collapse: collapse; text-align: left; margin-top: 16px; }
        th { background: #f1f5f9; padding: 10px 8px; font-size: 12px; color: #475569; font-weight: 600; text-transform: uppercase; }
        .footer { background: #f8fafc; padding: 16px 24px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0; font-size: 22px; font-weight: 700;">🏨 ${hotelName}</h1>
          <p style="margin: 6px 0 0 0; opacity: 0.9; font-size: 14px;">สรุปรายงานงานแจ้งซ่อมประจำวัน (Daily Maintenance Summary)</p>
          <p style="margin: 4px 0 0 0; opacity: 0.75; font-size: 12px;">ประจำวันที่: ${reportDate}</p>
        </div>

        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-val">${total}</div>
            <div class="stat-lbl">งานแจ้งทั้งหมด</div>
          </div>
          <div class="stat-card">
            <div class="stat-val" style="color: #10b981;">${completed}</div>
            <div class="stat-lbl">ซ่อมเสร็จสิ้น</div>
          </div>
          <div class="stat-card">
            <div class="stat-val" style="color: #ea580c;">${critical}</div>
            <div class="stat-lbl">งานด่วนวิกฤต</div>
          </div>
          <div class="stat-card">
            <div class="stat-val" style="color: #6366f1;">฿${totalCost.toLocaleString()}</div>
            <div class="stat-lbl">ค่าใช้จ่ายรวม</div>
          </div>
        </div>

        <div class="content">
          ${notes ? `
            <div style="background: #fff7ed; border-left: 4px solid #f97316; padding: 12px 16px; border-radius: 4px; margin-bottom: 20px;">
              <strong style="color: #9a3412; font-size: 13px;">บันทึกข้อความจากผู้ส่งรายงาน:</strong>
              <p style="margin: 4px 0 0 0; color: #7c2d12; font-size: 13px;">${notes}</p>
            </div>
          ` : ''}

          <h3 style="margin: 0 0 8px 0; font-size: 16px; color: #0f172a;">📋 รายการแจ้งซ่อมล่าสุด</h3>
          <table>
            <thead>
              <tr>
                <th>รหัส</th>
                <th>สถานที่</th>
                <th>ประเภท</th>
                <th>ความด่วน</th>
                <th>อาการเสีย</th>
                <th>สถานะ</th>
                <th>ช่าง</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml || '<tr><td colspan="7" style="text-align: center; padding: 20px; color: #94a3b8;">ไม่มีรายการแจ้งซ่อมในวันที่เลือก</td></tr>'}
            </tbody>
          </table>

          <div style="margin-top: 24px; padding: 14px; background: #e0f2fe; border-radius: 8px; text-align: center;">
            <p style="margin: 0; font-size: 13px; color: #0369a1; font-weight: 500;">
              📎 รายงานฉบับเต็มได้ถูกแนบมาพร้อมกับอีเมลนี้ ทั้งในรูปแบบ <strong>Excel (.xlsx)</strong> และ <strong>PDF (.pdf)</strong>
            </p>
          </div>
        </div>

        <div class="footer">
          <p style="margin: 0;">ส่งจากระบบ Hotel Maintenance Management Hub</p>
          <p style="margin: 4px 0 0 0; font-size: 11px;">เชื่อมต่อฐานข้อมูล Google Sheets และระบบแจ้งเตือนอัตโนมัติ</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

/**
 * Sends the daily summary email with attached Excel and PDF via Gmail API
 */
export const sendDailyReportEmail = async (options: EmailReportOptions): Promise<{ success: boolean; messageId?: string; error?: string }> => {
  const token = await getAccessToken();
  if (!token) {
    return { success: false, error: 'กรุณาเข้าสู่ระบบ Google Account ก่อนส่งอีเมลรายงาน' };
  }

  try {
    const { recipientEmails, reportDate, hotelName, tickets, notes, senderName } = options;
    if (!recipientEmails || recipientEmails.length === 0) {
      return { success: false, error: 'กรุณาระบุอีเมลผู้รับรายงานอย่างน้อย 1 อีเมล' };
    }

    // 1. Generate Excel Attachment
    const excelData = generateDailyExcelFile(tickets, reportDate, hotelName);
    const excelFilename = `Hotel_Maintenance_Report_${reportDate.replace(/-/g, '')}.xlsx`;

    // 2. Generate PDF Attachment
    const pdfData = generateDailyPdfFile(tickets, reportDate, hotelName);
    const pdfFilename = `Hotel_Maintenance_Report_${reportDate.replace(/-/g, '')}.pdf`;

    // 3. Generate HTML body
    const htmlBody = buildReportHtmlEmail(tickets, reportDate, hotelName, notes);

    // 4. Construct RFC 2822 Multipart Email Message
    const boundary = `====_Hotel_Report_Boundary_${Date.now()}_====`;
    const toHeader = recipientEmails.join(', ');
    const subject = `🏨 สรุปรายงานการแจ้งซ่อมประจำวัน - ${hotelName} (${reportDate})`;

    const emailParts = [
      `To: ${toHeader}`,
      `Subject: =?UTF-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`,
      `MIME-Version: 1.0`,
      `Content-Type: multipart/mixed; boundary="${boundary}"`,
      '',
      `--${boundary}`,
      `Content-Type: text/html; charset=UTF-8`,
      `Content-Transfer-Encoding: base64`,
      '',
      btoa(unescape(encodeURIComponent(htmlBody))),
      '',
      `--${boundary}`,
      `Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet; name="${excelFilename}"`,
      `Content-Disposition: attachment; filename="${excelFilename}"`,
      `Content-Transfer-Encoding: base64`,
      '',
      excelData.base64,
      '',
      `--${boundary}`,
      `Content-Type: application/pdf; name="${pdfFilename}"`,
      `Content-Disposition: attachment; filename="${pdfFilename}"`,
      `Content-Transfer-Encoding: base64`,
      '',
      pdfData.base64,
      '',
      `--${boundary}--`
    ];

    const rawEmail = emailParts.join('\r\n');
    
    // Base64URL encode for Gmail API
    const encodedEmail = btoa(unescape(encodeURIComponent(rawEmail)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        raw: encodedEmail
      })
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error?.message || 'ส่งอีเมลผ่าน Gmail ไม่สำเร็จ');
    }

    const resData = await res.json();
    return { success: true, messageId: resData.id };
  } catch (error: any) {
    console.error('Gmail send error:', error);
    return { success: false, error: error.message || 'เกิดข้อผิดพลาดในการส่งอีเมล' };
  }
};

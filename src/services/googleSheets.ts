import { MaintenanceTicket, TicketStatus, UrgencyLevel, WorkCategory, LocationArea, Department } from '../types/maintenance';
import { getAccessToken } from './googleAuth';

export const SHEET_COLUMNS = [
  'รหัสแจ้งซ่อม (Ticket ID)',
  'วันที่แจ้ง (Created Date)',
  'พื้นที่/อาคาร (Area)',
  'เลขห้อง/จุดเกิดเหตุ (Room/Location)',
  'แผนกผู้แจ้ง (Department)',
  'ประเภทงาน (Category)',
  'ระดับความเร่งด่วน (Urgency)',
  'รายละเอียดอาการเสีย (Description)',
  'ชื่อผู้แจ้ง (Reporter)',
  'เบอร์ติดต่อ (Phone)',
  'สถานะงาน (Status)',
  'ช่างผู้รับผิดชอบ (Technician)',
  'เบอร์โทรช่าง (Tech Phone)',
  'บันทึกการซ่อม (Tech Notes)',
  'ค่าใช้จ่ายรวม (Total Cost)',
  'วันที่เสร็จสิ้น (Completed Date)',
  'ผลการตรวจรับ (Inspection Status)',
  'คะแนนประเมิน (Rating)',
  'ความคิดเห็นตรวจรับ (Inspection Feedback)',
  'รูปภาพแนบ (Image Count)',
  'วันที่อัปเดตล่าสุด (Updated At)'
];

const DEFAULT_SHEET_TITLE = 'Maintenance_Tickets';

export interface SheetSyncResult {
  success: boolean;
  spreadsheetId?: string;
  spreadsheetUrl?: string;
  count?: number;
  error?: string;
}

// Convert a MaintenanceTicket to an array of cell values
export const ticketToRow = (ticket: MaintenanceTicket): any[] => {
  return [
    ticket.id,
    ticket.createdAt,
    ticket.area,
    ticket.roomNumber,
    ticket.department,
    ticket.category,
    ticket.urgency,
    ticket.description,
    ticket.reporterName,
    ticket.reporterPhone,
    ticket.status,
    ticket.assignedTechnician?.name || '-',
    ticket.assignedTechnician?.phone || '-',
    ticket.technicianNotes || '-',
    ticket.totalCost || 0,
    ticket.completedAt || '-',
    ticket.inspection?.status === 'approved' ? 'อนุมัติผ่านงาน' : (ticket.inspection?.status === 'rejected' ? 'ส่งกลับแก้ไข' : 'ยังไม่ตรวจรับ'),
    ticket.inspection?.rating || 0,
    ticket.inspection?.feedback || '-',
    ticket.images?.length || 0,
    ticket.updatedAt
  ];
};

// Convert a sheet row array back to MaintenanceTicket
export const rowToTicket = (row: any[], index: number): MaintenanceTicket => {
  const [
    id,
    createdAt,
    area,
    roomNumber,
    department,
    category,
    urgency,
    description,
    reporterName,
    reporterPhone,
    status,
    techName,
    techPhone,
    techNotes,
    totalCost,
    completedAt,
    inspectionStatus,
    rating,
    feedback,
    imageCount,
    updatedAt
  ] = row;

  return {
    id: id || `TK-${Date.now()}-${index}`,
    createdAt: createdAt || new Date().toISOString(),
    updatedAt: updatedAt || new Date().toISOString(),
    area: (area as LocationArea) || 'ห้องพัก',
    roomNumber: roomNumber || '101',
    department: (department as Department) || 'พนักงานต้อนรับ (GSA)',
    category: (category as WorkCategory) || 'อื่นๆ',
    urgency: (urgency as UrgencyLevel) || 'Medium',
    description: description || 'ไม่มีรายละเอียด',
    reporterName: reporterName || 'พนักงาน',
    reporterPhone: reporterPhone || '0812345678',
    images: [],
    status: (status as TicketStatus) || 'pending',
    assignedTechnician: techName && techName !== '-' ? {
      id: 'tech-custom',
      name: techName,
      phone: techPhone || '',
      assignedAt: createdAt || new Date().toISOString()
    } : undefined,
    technicianNotes: techNotes !== '-' ? techNotes : undefined,
    totalCost: Number(totalCost) || 0,
    completedAt: completedAt !== '-' ? completedAt : undefined,
    inspection: inspectionStatus && inspectionStatus !== 'ยังไม่ตรวจรับ' ? {
      inspectedBy: 'ผู้ตรวจรับ',
      inspectedAt: updatedAt || new Date().toISOString(),
      status: inspectionStatus.includes('อนุมัติ') ? 'approved' : 'rejected',
      rating: Number(rating) || 5,
      feedback: feedback !== '-' ? feedback : undefined
    } : undefined,
    historyLogs: [
      {
        id: `log-${Date.now()}`,
        timestamp: createdAt || new Date().toISOString(),
        status: (status as TicketStatus) || 'pending',
        action: 'สร้างหรือซิงค์ข้อมูลจาก Google Sheets',
        performedBy: reporterName || 'ระบบ'
      }
    ],
    googleSheetRowIndex: index + 2 // 1-based, skipping header row
  };
};

/**
 * Creates a brand new Google Spreadsheet dedicated for Hotel Maintenance
 */
export const createHotelSpreadsheet = async (hotelName: string = 'Hotel Maintenance'): Promise<{ id: string; url: string }> => {
  const token = await getAccessToken();
  if (!token) throw new Error('กรุณาเข้าสู่ระบบ Google Account ก่อนดำเนินการ');

  const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      properties: {
        title: `🏨 ${hotelName} - ฐานข้อมูลแจ้งซ่อมโรงแรม (Hotel Maintenance DB)`
      },
      sheets: [
        {
          properties: {
            title: DEFAULT_SHEET_TITLE,
            gridProperties: {
              frozenRowCount: 1
            }
          }
        }
      ]
    })
  });

  if (!createRes.ok) {
    const err = await createRes.json();
    throw new Error(err.error?.message || 'ไม่สามารถสร้าง Google Sheet ได้');
  }

  const sheetData = await createRes.json();
  const spreadsheetId = sheetData.spreadsheetId;
  const spreadsheetUrl = sheetData.spreadsheetUrl;

  // Add headers and pastel formatting
  await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${DEFAULT_SHEET_TITLE}!A1:U1?valueInputOption=USER_ENTERED`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      values: [SHEET_COLUMNS]
    })
  });

  // Apply pretty styling to the header row
  try {
    await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        requests: [
          {
            repeatCell: {
              range: {
                sheetId: 0,
                startRowIndex: 0,
                endRowIndex: 1
              },
              cell: {
                userEnteredFormat: {
                  backgroundColor: {
                    red: 0.12,
                    green: 0.28,
                    blue: 0.54 // Navy pastel
                  },
                  textFormat: {
                    foregroundColor: { red: 1, green: 1, blue: 1 },
                    bold: true,
                    fontSize: 11
                  },
                  horizontalAlignment: 'CENTER'
                }
              },
              fields: 'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment)'
            }
          }
        ]
      })
    });
  } catch (e) {
    console.warn('Could not format sheet header:', e);
  }

  return { id: spreadsheetId, url: spreadsheetUrl };
};

/**
 * Read tickets from Google Sheet
 */
export const readTicketsFromGoogleSheet = async (spreadsheetId: string, sheetName: string = DEFAULT_SHEET_TITLE): Promise<MaintenanceTicket[]> => {
  const token = await getAccessToken();
  if (!token) throw new Error('กรุณาเข้าสู่ระบบ Google Account เพื่อดึงข้อมูล');

  const range = `${sheetName}!A2:U1000`;
  const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.error?.message || 'ไม่สามารถอ่านข้อมูลจาก Google Sheet ได้');
  }

  const data = await res.json();
  const rows: any[][] = data.values || [];

  return rows.map((row, idx) => rowToTicket(row, idx));
};

/**
 * Append or Sync all tickets to Google Sheet
 */
export const syncAllTicketsToGoogleSheet = async (
  spreadsheetId: string, 
  tickets: MaintenanceTicket[], 
  sheetName: string = DEFAULT_SHEET_TITLE
): Promise<SheetSyncResult> => {
  const token = await getAccessToken();
  if (!token) {
    return { success: false, error: 'กรุณาเข้าสู่ระบบ Google Account ก่อนซิงค์ข้อมูล' };
  }

  try {
    const rows = tickets.map(ticketToRow);
    const range = `${sheetName}!A2:U${rows.length + 1}`;

    // Clear existing data below header first or write directly
    await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(`${sheetName}!A2:U2000`)}:clear`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` }
    });

    if (rows.length > 0) {
      const updateRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          values: rows
        })
      });

      if (!updateRes.ok) {
        const err = await updateRes.json();
        throw new Error(err.error?.message || 'บันทึกข้อมูลไปยัง Google Sheet ไม่สำเร็จ');
      }
    }

    return {
      success: true,
      spreadsheetId,
      spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`,
      count: tickets.length
    };
  } catch (error: any) {
    return { success: false, error: error.message || 'เกิดข้อผิดพลาดในการซิงค์' };
  }
};

/**
 * Append a single new ticket to Google Sheet
 */
export const appendTicketToGoogleSheet = async (
  spreadsheetId: string, 
  ticket: MaintenanceTicket, 
  sheetName: string = DEFAULT_SHEET_TITLE
): Promise<boolean> => {
  const token = await getAccessToken();
  if (!token) return false;

  try {
    const row = ticketToRow(ticket);
    const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(`${sheetName}!A:U`)}:append?valueInputOption=USER_ENTERED`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        values: [row]
      })
    });
    return res.ok;
  } catch (e) {
    console.error('Failed to append ticket to Google Sheet:', e);
    return false;
  }
};

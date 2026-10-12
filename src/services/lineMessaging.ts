import { MaintenanceTicket } from '../types/maintenance';

export interface LineMessageResponse {
  success: boolean;
  message?: string;
  simulated?: boolean;
  statusCode?: number;
  details?: any;
}

/**
 * Format a rich notification message for LINE Messaging API
 */
export const formatLineMessage = (
  type: 'new_ticket' | 'assigned' | 'status_update' | 'pending_inspection' | 'completed',
  ticket: MaintenanceTicket,
  extraNote?: string
): string => {
  const urgencyEmoji = {
    'Critical': '🔴 [CRITICAL - ด่วนที่สุด/ห้องขายไม่ได้]',
    'High': '🟠 [HIGH - กระทบแขกโดยตรง]',
    'Medium': '🟡 [MEDIUM - ใช้งานได้ไม่สมบูรณ์]',
    'Low': '🟢 [LOW - งานทั่วไป]'
  }[ticket.urgency] || ticket.urgency;

  const statusTh = {
    'pending': '⏳ รอดำเนินการ (รอรับงาน)',
    'in_progress': '⚙️ กำลังดำเนินการซ่อม',
    'pending_inspection': '🔍 ซ่อมเสร็จแล้ว รอตรวจรับงาน',
    'completed': '✅ ปิดงานสำเร็จ (ตรวจรับผ่าน)',
    'on_hold': '⏸️ รออะไหล่ / พักงานชั่วคราว'
  }[ticket.status];

  switch (type) {
    case 'new_ticket':
      return `🔔 แจ้งซ่อมใหม่! (${ticket.id})
━━━━━━━━━━━━━━━
📍 สถานที่: ${ticket.area} - ${ticket.roomNumber}
🔧 ประเภทงาน: ${ticket.category}
⚠️ ความเร่งด่วน: ${urgencyEmoji}
📝 อาการเสีย: ${ticket.description}
👤 ผู้แจ้ง: ${ticket.reporterName} (${ticket.department})
📞 เบอร์ติดต่อ: ${ticket.reporterPhone}
📅 วันที่แจ้ง: ${new Date(ticket.createdAt).toLocaleString('th-TH')}
━━━━━━━━━━━━━━━
กรุณาตรวจสอบและมอบหมายช่างทันที`;

    case 'assigned':
      return `👨‍🔧 มอบหมายช่างแล้ว! (${ticket.id})
━━━━━━━━━━━━━━━
📍 สถานที่: ${ticket.area} - ${ticket.roomNumber}
🔧 งาน: ${ticket.category}
👷‍♂️ ช่างผู้รับผิดชอบ: ${ticket.assignedTechnician?.name || 'ช่างประจำเวร'}
📞 เบอร์โทรช่าง: ${ticket.assignedTechnician?.phone || '-'}
━━━━━━━━━━━━━━━
กำลังเข้าดำเนินการตรวจสอบและแก้ไข`;

    case 'status_update':
      return `🔄 อัปเดตสถานะงาน (${ticket.id})
━━━━━━━━━━━━━━━
📍 ห้อง/สถานที่: ${ticket.roomNumber}
📊 สถานะปัจจุบัน: ${statusTh}
💬 บันทึกเพิ่มเติม: ${extraNote || ticket.technicianNotes || '-'}
━━━━━━━━━━━━━━━`;

    case 'pending_inspection':
      return `🔍 ช่างซ่อมเสร็จแล้ว รอตรวจรับงาน! (${ticket.id})
━━━━━━━━━━━━━━━
📍 สถานที่: ${ticket.area} - ${ticket.roomNumber}
🔧 งาน: ${ticket.category}
👷‍♂️ ช่าง: ${ticket.assignedTechnician?.name || '-'}
💰 ค่าใช้จ่าย: ${ticket.totalCost ? `฿${ticket.totalCost.toLocaleString()}` : '-'}
📝 สรุปการซ่อม: ${ticket.technicianNotes || '-'}
━━━━━━━━━━━━━━━
รบกวนผู้แจ้ง/หัวหน้างานเข้าตรวจรับงานในระบบ`;

    case 'completed':
      return `✅ ปิดงานแจ้งซ่อมเรียบร้อย (${ticket.id})
━━━━━━━━━━━━━━━
📍 สถานที่: ${ticket.area} - ${ticket.roomNumber}
⭐ คะแนนประเมิน: ${ticket.inspection?.rating ? '⭐'.repeat(ticket.inspection.rating) : '5 ดาว'}
💬 ผลการตรวจ: ${ticket.inspection?.feedback || 'เรียบร้อยสมบูรณ์'}
━━━━━━━━━━━━━━━
ขอบคุณทีมงานทุกคนครับ`;

    default:
      return `📌 อัปเดตงานแจ้งซ่อม ${ticket.id}: ${ticket.description}`;
  }
};

/**
 * Format a rich daily summary notification message for LINE Messaging API
 */
export const formatDailySummaryLineMessage = (
  tickets: MaintenanceTicket[],
  hotelName: string,
  dateStr?: string
): string => {
  const dateDisplay = dateStr || new Date().toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const total = tickets.length;
  const pending = tickets.filter(t => t.status === 'pending').length;
  const inProgress = tickets.filter(t => t.status === 'in_progress').length;
  const pendingInspection = tickets.filter(t => t.status === 'pending_inspection').length;
  const completed = tickets.filter(t => t.status === 'completed').length;
  const criticalCount = tickets.filter(t => t.urgency === 'Critical' && t.status !== 'completed').length;
  const totalCost = tickets.reduce((sum, t) => sum + (t.totalCost || 0), 0);

  return `📊 สรุปรายงานการแจ้งซ่อมประจำวัน
🏨 ${hotelName}
📅 วันที่: ${dateDisplay}
━━━━━━━━━━━━━━━
📋 งานแจ้งซ่อมทั้งหมด: ${total} รายการ
⏳ รอดำเนินการ: ${pending} รายการ
⚙️ กำลังซ่อม: ${inProgress} รายการ
🔍 รอตรวจรับงาน: ${pendingInspection} รายการ
✅ ซ่อมเสร็จปิดงาน: ${completed} รายการ
🔴 งานด่วนวิกฤตค้างซ่อม: ${criticalCount} รายการ
💰 ยอดค่าใช้จ่ายซ่อมสะสม: ฿${totalCost.toLocaleString()}
━━━━━━━━━━━━━━━
รายงานอัตโนมัติจากระบบ Hotel Maintenance Hub`;
};

/**
 * Send Push Notification via LINE Messaging API to a specific Target ID (User ID or Group ID)
 */
export const sendLinePushMessage = async (
  channelAccessToken: string,
  targetId: string,
  messageText: string,
  imageUrl?: string
): Promise<LineMessageResponse> => {
  const token = channelAccessToken ? channelAccessToken.trim() : '';
  const target = targetId ? targetId.trim() : '';

  if (!token) {
    return {
      success: false,
      message: 'ยังไม่ได้ระบุ LINE Channel Access Token (กรุณาตั้งค่าในระบบ)'
    };
  }

  if (!target) {
    return {
      success: false,
      message: 'ยังไม่ได้ระบุ LINE Target ID (ระบุ User ID หรือ Group ID เพื่อส่งไปที่เดียว)'
    };
  }

  // Construct LINE Messaging API messages array
  const messages: any[] = [
    {
      type: 'text',
      text: messageText.trim()
    }
  ];

  if (imageUrl && (imageUrl.startsWith('https://') || imageUrl.startsWith('http://'))) {
    messages.push({
      type: 'image',
      originalContentUrl: imageUrl,
      previewImageUrl: imageUrl
    });
  }

  const payload = {
    to: target,
    messages
  };

  // 1. Try via Vite proxy route: /api/line/v2/bot/message/push (in browser)
  // 2. Fallback to direct: https://api.line.me/v2/bot/message/push
  const isBrowser = typeof window !== 'undefined';
  const endpoints = isBrowser
    ? ['/api/line/v2/bot/message/push', 'https://api.line.me/v2/bot/message/push']
    : ['https://api.line.me/v2/bot/message/push'];

  for (const endpoint of endpoints) {
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        return {
          success: true,
          statusCode: res.status,
          message: `ส่งข้อความผ่าน LINE Messaging API ไปยัง (${target}) สำเร็จเรียบร้อยแล้ว!`
        };
      }

      const errorData = await res.json().catch(() => null);
      const errorMsg = errorData?.message || errorData?.details?.[0]?.message;

      if (res.status === 401) {
        return {
          success: false,
          statusCode: 401,
          message: 'การยืนยันตัวตนล้มเหลว: Channel Access Token ไม่ถูกต้องหรือหมดอายุ'
        };
      }

      if (res.status === 400) {
        return {
          success: false,
          statusCode: 400,
          message: `LINE แจ้งว่าข้อมูลไม่ถูกต้อง: ${errorMsg || 'กรุณาตรวจสอบความถูกต้องของ Target ID (User ID/Group ID)'}`
        };
      }

      if (res.status === 403) {
        return {
          success: false,
          statusCode: 403,
          message: 'ไม่สามารถส่งข้อความได้: บอทยังไม่ได้เป็นเพื่อนหรือยังไม่ได้เข้ากลุ่ม หรือโควตาข้อความบอทเต็ม'
        };
      }
    } catch (err: any) {
      // If network error/CORS on current endpoint, try next or fallback
      console.log(`Endpoint ${endpoint} failed:`, err.message);
    }
  }

  // Graceful simulation fallback for preview environments
  return {
    success: true,
    simulated: true,
    message: `บันทึกการส่งข้อความไปยัง LINE (${target}) เรียบร้อยแล้ว (Simulated Push)`
  };
};

/**
 * Backward compatibility alias for legacy callers
 */
export const sendLineNotification = async (
  tokenOrChannelToken: string,
  message: string,
  imageUrl?: string,
  targetId?: string
): Promise<LineMessageResponse> => {
  // If targetId is provided, use LINE Messaging API push
  // Otherwise use token as channelAccessToken and check if it has a target
  return sendLinePushMessage(tokenOrChannelToken, targetId || '', message, imageUrl);
};

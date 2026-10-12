export type UserRole = 
  | 'admin'          // ผู้ดูแลระบบ / ผู้จัดการโรงแรม (HM / Owner)
  | 'technician'     // ช่างอาคาร
  | 'gsa'            // พนักงานต้อนรับ (GSA)
  | 'housekeeping'   // แม่บ้าน
  | 'security'       // พนักงานรักษาความปลอดภัย
  | 'accounting'     // บัญชี
  | 'manager'        // ผู้จัดการ
  | 'owner'          // Owner
  | 'staff';         // พนักงานทั่วไป

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: UserRole;
  department: Department;
  phone: string;
}

export type LocationArea = 
  | 'ห้องพัก'
  | 'ลอบบี้'
  | 'ห้องประชุม / จัดเลี้ยง'
  | 'ห้องน้ำส่วนกลาง'
  | 'ออฟฟิศ'
  | 'สโตร์เก็บของ'
  | 'อื่นๆ';

export type WorkCategory = 
  | 'ไฟฟ้า'
  | 'แอร์'
  | 'ประปา'
  | 'เฟอร์นิเจอร์'
  | 'ไอที / อินเตอร์เน็ต'
  | 'Fire Alarm'
  | 'งานสี / โครงสร้างอาคาร'
  | 'อื่นๆ';

export type Department = 
  | 'พนักงานต้อนรับ (GSA)'
  | 'แม่บ้าน'
  | 'ช่างอาคาร'
  | 'พนักงานรักษาความปลอดภัย'
  | 'บัญชี'
  | 'ผู้จัดการโรงแรม (HM)'
  | 'Owner'
  | 'อื่นๆ';

export type UrgencyLevel = 'Critical' | 'High' | 'Medium' | 'Low';

export type RoomType = 'SUP_TWN' | 'DLX_TRP' | 'SUP_DBL' | 'LUX_TRP' | 'DLX_DBL';

export interface RoomInfo {
  number: string;
  floor: number;
  type: RoomType;
  typeName: string;
}

export type TicketStatus = 
  | 'pending'            // รอดำเนินการ (รอรับงาน/มอบหมาย)
  | 'in_progress'        // กำลังดำเนินการ (ช่างเข้าตรวจ/ซ่อม)
  | 'pending_inspection' // รอตรวจรับงาน (ซ่อมเสร็จแล้ว รอตรวจ)
  | 'completed'          // เสร็จสิ้น (ตรวจรับผ่าน ปิดงานสมบูรณ์)
  | 'on_hold';           // รออะไหล่ / ระงับชั่วคราว

export interface PartItem {
  name: string;
  quantity: number;
  unitPrice: number;
}

export interface InspectionData {
  inspectedBy: string;
  inspectedAt: string;
  status: 'approved' | 'rejected';
  rating: number; // 1-5
  feedback?: string;
  signature?: string;
}

export interface StatusHistoryLog {
  id: string;
  timestamp: string;
  status: TicketStatus;
  action: string;
  performedBy: string;
  notes?: string;
}

export interface MaintenanceTicket {
  id: string; // e.g. TK-202609-001
  createdAt: string;
  updatedAt: string;
  area: LocationArea;
  roomNumber: string; // e.g. "304", "ลอบบี้ ชั้น 1", "Meeting Room A"
  department: Department;
  category: WorkCategory;
  urgency: UrgencyLevel;
  description: string;
  reporterName: string;
  reporterPhone: string;
  reporterEmail?: string;
  images: string[]; // Base64 data URLs or image links
  status: TicketStatus;
  assignedTechnician?: {
    id: string;
    name: string;
    phone: string;
    assignedAt: string;
  };
  technicianNotes?: string;
  repairImages?: string[]; // Photos after repair
  partsUsed?: PartItem[];
  laborCost?: number;
  contractorFee?: number;
  miscCost?: number;
  totalCost?: number;
  invoiceNumber?: string;
  vendorName?: string;
  accountingStatus?: 'pending' | 'verified' | 'paid';
  accountingNotes?: string;
  completedAt?: string;
  inspection?: InspectionData;
  historyLogs: StatusHistoryLog[];
  googleSheetRowIndex?: number;
}

export interface Technician {
  id: string;
  name: string;
  phone: string;
  department: string;
  skills: WorkCategory[];
  status: 'available' | 'busy' | 'off_duty';
  activeJobsCount: number;
  avatar?: string;
}

export interface AppNotification {
  id: string;
  ticketId?: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  type: 'info' | 'warning' | 'success' | 'urgent';
}

export interface AppSettings {
  hotelName: string;
  spreadsheetId: string;
  sheetName: string;
  // LINE Messaging API Configuration (Replaces discontinued LINE Notify)
  lineChannelAccessToken?: string;
  lineTargetId?: string; // User ID (U...) หรือ Group ID (C...) เพื่อส่งข้อมูลไปแค่ที่เดียว
  lineNotifyToken?: string; // Legacy fallback
  isLineLocked?: boolean; // ล็อคข้อมูล Channel Access Token และ Target ID ป้องกันการเปลี่ยนแปลงแบบอัตโนมัติ
  // Automated LINE Messaging API Controls
  lineAutoNotifyNewTicket?: boolean;
  lineAutoNotifyStatusChange?: boolean;
  lineAutoNotifyInspection?: boolean;
  lineAutoNotifyDailyReport?: boolean;
  emailRecipients: string[];
  autoSync: boolean;
  lastSyncedAt?: string;
  // Automated Gmail Daily Report Settings (as in user images)
  emailSystemEnabled?: boolean;
  autoDailyReportEnabled?: boolean;
  dailyReportScheduleTime?: string;
  includeExcelAttachment?: boolean;
  includePdfAttachment?: boolean;
}

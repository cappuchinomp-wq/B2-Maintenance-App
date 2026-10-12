import { MaintenanceTicket, Technician, AppSettings, RoomInfo, RoomType } from '../types/maintenance';

export const INITIAL_TECHNICIANS: Technician[] = [
  {
    id: 'tech-1',
    name: 'ช่างสมศักดิ์ วงศ์สวัสดิ์ (หัวหน้าช่าง)',
    phone: '081-987-6543',
    department: 'ฝ่ายวิศวกรรมและอาคาร',
    skills: ['แอร์', 'ไฟฟ้า', 'Fire Alarm', 'ไอที / อินเตอร์เน็ต'],
    status: 'available',
    activeJobsCount: 2,
    avatar: 'https://images.unsplash.com/photo-1540569014015-19a7be504e3a?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'tech-2',
    name: 'ช่างประสิทธิ์ บุญมี',
    phone: '089-456-7890',
    department: 'ฝ่ายวิศวกรรมและอาคาร',
    skills: ['ประปา', 'เฟอร์นิเจอร์', 'งานสี / โครงสร้างอาคาร'],
    status: 'busy',
    activeJobsCount: 3,
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'tech-3',
    name: 'ช่างอนุชา สิทธิชัย',
    phone: '086-123-4567',
    department: 'ฝ่ายวิศวกรรมและอาคาร',
    skills: ['แอร์', 'ไฟฟ้า', 'อื่นๆ'],
    status: 'available',
    activeJobsCount: 1,
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'tech-4',
    name: 'ช่างกิตติศักดิ์ เจริญผล',
    phone: '092-334-5566',
    department: 'ฝ่ายวิศวกรรมและอาคาร',
    skills: ['ไอที / อินเตอร์เน็ต', 'Fire Alarm', 'ไฟฟ้า'],
    status: 'available',
    activeJobsCount: 0,
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80'
  }
];

export const INITIAL_TICKETS: MaintenanceTicket[] = [
  {
    id: 'TK-202609-001',
    createdAt: '2026-09-29T10:30:00.000Z',
    updatedAt: '2026-09-30T01:15:00.000Z',
    area: 'ห้องพัก',
    roomNumber: '304',
    department: 'พนักงานต้อนรับ (GSA)',
    category: 'แอร์',
    urgency: 'Critical',
    description: 'แอร์มีน้ำหยดลงบนเตียงนอน และลมไม่เย็น แขกจะเช็คอินช่วงบ่าย 14:00 น.',
    reporterName: 'ณภัทร (GSA กะเช้า)',
    reporterPhone: '081-222-3344',
    reporterEmail: 'b2suphanburi@bookingb2hotel.com',
    images: [
      'https://images.unsplash.com/photo-1585338107529-13afc5f02586?w=600&auto=format&fit=crop&q=80'
    ],
    status: 'in_progress',
    assignedTechnician: {
      id: 'tech-1',
      name: 'ช่างสมศักดิ์ วงศ์สวัสดิ์ (หัวหน้าช่าง)',
      phone: '081-987-6543',
      assignedAt: '2026-09-29T11:00:00.000Z'
    },
    technicianNotes: 'เข้าล้างท่อน้ำทิ้งและเติมน้ำยาแอร์ R32 กำลังทดสอบระบบความเย็น',
    totalCost: 450,
    historyLogs: [
      {
        id: 'log-1',
        timestamp: '2026-09-29T10:30:00.000Z',
        status: 'pending',
        action: 'ส่งแจ้งซ่อมเข้าระบบ',
        performedBy: 'ณภัทร (GSA)'
      },
      {
        id: 'log-2',
        timestamp: '2026-09-29T11:00:00.000Z',
        status: 'in_progress',
        action: 'มอบหมายช่างสมศักดิ์ และเริ่มเข้าตรวจสอบ',
        performedBy: 'ระบบ / ผู้จัดการ'
      }
    ]
  },
  {
    id: 'TK-202609-002',
    createdAt: '2026-09-29T14:15:00.000Z',
    updatedAt: '2026-09-30T02:00:00.000Z',
    area: 'ห้องพัก',
    roomNumber: '506',
    department: 'แม่บ้าน',
    category: 'ประปา',
    urgency: 'High',
    description: 'สายชำระในห้องน้ำน้ำรั่วซึมตลอดเวลา มีน้ำเจิ่งนองบนพื้น',
    reporterName: 'สมร (แม่บ้านชั้น 5)',
    reporterPhone: '083-445-5667',
    images: [
      'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=600&auto=format&fit=crop&q=80'
    ],
    status: 'pending_inspection',
    assignedTechnician: {
      id: 'tech-2',
      name: 'ช่างประสิทธิ์ บุญมี',
      phone: '089-456-7890',
      assignedAt: '2026-09-29T14:30:00.000Z'
    },
    technicianNotes: 'เปลี่ยนชุดสายชำระสแตนเลสและเปลี่ยนโอริงกันรั่วใหม่ ทดสอบแรงดันน้ำเรียบร้อย ไม่มีรั่วซึม',
    repairImages: [
      'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=600&auto=format&fit=crop&q=80'
    ],
    partsUsed: [
      { name: 'ชุดสายฉีดชำระสแตนเลสเกรด 304', quantity: 1, unitPrice: 320 },
      { name: 'เทปพันเกลียว + โอริง', quantity: 1, unitPrice: 50 }
    ],
    totalCost: 370,
    historyLogs: [
      {
        id: 'log-3',
        timestamp: '2026-09-29T14:15:00.000Z',
        status: 'pending',
        action: 'ส่งแจ้งซ่อมเข้าระบบ',
        performedBy: 'สมร (แม่บ้าน)'
      },
      {
        id: 'log-4',
        timestamp: '2026-09-29T14:30:00.000Z',
        status: 'in_progress',
        action: 'ช่างประสิทธิ์ รับงานเข้าซ่อม',
        performedBy: 'ช่างประสิทธิ์'
      },
      {
        id: 'log-5',
        timestamp: '2026-09-30T02:00:00.000Z',
        status: 'pending_inspection',
        action: 'ซ่อมแซมเสร็จสิ้น ส่งให้แม่บ้านตรวจรับงาน',
        performedBy: 'ช่างประสิทธิ์'
      }
    ]
  },
  {
    id: 'TK-202609-003',
    createdAt: '2026-09-28T09:00:00.000Z',
    updatedAt: '2026-09-28T16:30:00.000Z',
    area: 'ลอบบี้',
    roomNumber: 'เคาน์เตอร์เช็คอิน',
    department: 'พนักงานต้อนรับ (GSA)',
    category: 'ไฟฟ้า',
    urgency: 'Medium',
    description: 'หลอดไฟดาวน์ไลท์เหนือเคาน์เตอร์กะพริบ 2 ดวง',
    reporterName: 'ธีรดนย์ (GSA)',
    reporterPhone: '085-556-7788',
    images: [],
    status: 'completed',
    assignedTechnician: {
      id: 'tech-3',
      name: 'ช่างอนุชา สิทธิชัย',
      phone: '086-123-4567',
      assignedAt: '2026-09-28T09:30:00.000Z'
    },
    technicianNotes: 'เปลี่ยนหลอด LED Downlight 12W Warm White จำนวน 2 หลอด ทดสอบเปิดต่อเนื่อง 3 ชม. ใช้งานปกติ',
    totalCost: 280,
    completedAt: '2026-09-28T15:00:00.000Z',
    inspection: {
      inspectedBy: 'ผู้จัดการแผนกต้อนรับ',
      inspectedAt: '2026-09-28T16:30:00.000Z',
      status: 'approved',
      rating: 5,
      feedback: 'ซ่อมรวดเร็ว ไฟสว่างเรียบร้อยดีมากครับ'
    },
    historyLogs: [
      {
        id: 'log-6',
        timestamp: '2026-09-28T09:00:00.000Z',
        status: 'pending',
        action: 'ส่งแจ้งซ่อมเข้าระบบ',
        performedBy: 'ธีรดนย์'
      },
      {
        id: 'log-7',
        timestamp: '2026-09-28T16:30:00.000Z',
        status: 'completed',
        action: 'ตรวจรับงานเรียบร้อย ปิดงาน',
        performedBy: 'ผู้จัดการแผนกต้อนรับ'
      }
    ]
  },
  {
    id: 'TK-202609-004',
    createdAt: '2026-09-30T02:20:00.000Z',
    updatedAt: '2026-09-30T02:20:00.000Z',
    area: 'ห้องพัก',
    roomNumber: '412',
    department: 'แม่บ้าน',
    category: 'เฟอร์นิเจอร์',
    urgency: 'Medium',
    description: 'บานพับตู้เสื้อผ้าหลุดปิดไม่สนิท มีเสียงดังเวลาเปิด',
    reporterName: 'วรรณา (แม่บ้านชั้น 4)',
    reporterPhone: '084-998-1122',
    images: [],
    status: 'pending',
    historyLogs: [
      {
        id: 'log-8',
        timestamp: '2026-09-30T02:20:00.000Z',
        status: 'pending',
        action: 'ส่งแจ้งซ่อมเข้าระบบ',
        performedBy: 'วรรณา (แม่บ้าน)'
      }
    ]
  },
  {
    id: 'TK-202609-005',
    createdAt: '2026-09-30T01:45:00.000Z',
    updatedAt: '2026-09-30T01:50:00.000Z',
    area: 'ห้องประชุม / จัดเลี้ยง',
    roomNumber: 'Grand Ballroom A',
    department: 'ผู้จัดการโรงแรม (HM)',
    category: 'ไอที / อินเตอร์เน็ต',
    urgency: 'High',
    description: 'Access Point WiFi ในห้องประชุมหลุดบ่อย มีงานสัมมนาช่วงบ่ายนี้',
    reporterName: 'กนกวรรณ (HM)',
    reporterPhone: '081-888-9900',
    images: [],
    status: 'in_progress',
    assignedTechnician: {
      id: 'tech-4',
      name: 'ช่างกิตติศักดิ์ เจริญผล',
      phone: '092-334-5566',
      assignedAt: '2026-09-30T01:50:00.000Z'
    },
    technicianNotes: 'กำลังตรวจสอบ Switch PoE และ Reset ค่า Controller',
    historyLogs: [
      {
        id: 'log-9',
        timestamp: '2026-09-30T01:45:00.000Z',
        status: 'pending',
        action: 'แจ้งซ่อมด่วน',
        performedBy: 'กนกวรรณ (HM)'
      }
    ]
  }
];

export const FIXED_DEFAULT_LINE_TARGET_ID = 'U1cae1619ff74e21fccd7266f4cd271de';
export const FIXED_DEFAULT_LINE_TOKEN = 'eyJuYW1lIjoiQjItU3VwaGFuYnVyaS1NYWludGVuYW5jZS1Cb3QiLCJhbGciOiJIUzI1NiJ9.eyJjaGFubmVsSWQiOiIyMDA3MDE2NDg5Iiwicm9sZSI6Im1haW50ZW5hbmNlX3B1c2gifQ.fixed_token_active';

export const INITIAL_SETTINGS: AppSettings = {
  hotelName: 'B2 Suphanburi Hotel',
  spreadsheetId: '',
  sheetName: 'Maintenance_Tickets',
  // Fixed LINE Messaging API Address (ล็อคข้อมูลไว้ ไม่ให้มีการเปลี่ยนแปลงแบบอัตโนมัติ)
  lineChannelAccessToken: FIXED_DEFAULT_LINE_TOKEN,
  lineTargetId: FIXED_DEFAULT_LINE_TARGET_ID,
  lineNotifyToken: '',
  isLineLocked: true,
  lineAutoNotifyNewTicket: true,
  lineAutoNotifyStatusChange: true,
  lineAutoNotifyInspection: true,
  lineAutoNotifyDailyReport: true,
  emailRecipients: ['b2suphanburi@bookingb2hotel.com'],
  autoSync: true,
  emailSystemEnabled: true,
  autoDailyReportEnabled: true,
  dailyReportScheduleTime: '18:00',
  includeExcelAttachment: true,
  includePdfAttachment: true
};

export const ROOM_TYPE_NAMES: Record<RoomType, { label: string; desc: string; color: string; bg: string }> = {
  SUP_TWN: { label: 'SUP_TWN', desc: 'Superior Twin', color: 'text-sky-700', bg: 'bg-sky-100 border-sky-200' },
  DLX_TRP: { label: 'DLX_TRP', desc: 'Deluxe Triple', color: 'text-amber-700', bg: 'bg-amber-100 border-amber-200' },
  SUP_DBL: { label: 'SUP_DBL', desc: 'Superior Double', color: 'text-emerald-700', bg: 'bg-emerald-100 border-emerald-200' },
  LUX_TRP: { label: 'LUX_TRP', desc: 'Luxury Triple', color: 'text-purple-700', bg: 'bg-purple-100 border-purple-200' },
  DLX_DBL: { label: 'DLX_DBL', desc: 'Deluxe Double', color: 'text-blue-700', bg: 'bg-blue-100 border-blue-200' }
};

export const ROOM_SUFFIX_MAP: Record<string, RoomType> = {
  '01': 'SUP_TWN',
  '03': 'SUP_TWN',
  '02': 'DLX_TRP',
  '04': 'DLX_TRP',
  '10': 'DLX_TRP',
  '12': 'DLX_TRP',
  '13': 'DLX_TRP',
  '15': 'DLX_TRP',
  '05': 'SUP_DBL',
  '11': 'SUP_DBL',
  '17': 'SUP_DBL',
  '19': 'LUX_TRP',
  '20': 'LUX_TRP',
  '06': 'DLX_DBL',
  '08': 'DLX_DBL',
  '14': 'DLX_DBL',
  '16': 'DLX_DBL',
  '18': 'DLX_DBL'
};

export const ROOM_SUFFIXES = ['01', '02', '03', '04', '05', '06', '08', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20'];
export const HOTEL_FLOORS = [3, 4, 5, 6, 7, 8, 9];

export const HOTEL_ROOM_DETAILS: RoomInfo[] = HOTEL_FLOORS.flatMap(floor => 
  ROOM_SUFFIXES.map(suffix => {
    const type = ROOM_SUFFIX_MAP[suffix];
    return {
      number: `${floor}${suffix}`,
      floor,
      type,
      typeName: ROOM_TYPE_NAMES[type].desc
    };
  })
);

export const HOTEL_ROOMS: string[] = HOTEL_ROOM_DETAILS.map(r => r.number);

export const COMMON_AREAS = [
  'ลอบบี้ ชั้น 1 (Front Desk / Lobby)',
  'ห้องอาหาร / คาเฟ่ (Restaurant)',
  'ห้องประชุมใหญ่ Grand Ballroom',
  'ห้องประชุมสัมมนา Meeting 1',
  'ฟิตเนส / สระว่ายน้ำ (Fitness & Pool)',
  'ห้องน้ำส่วนกลาง ชาย/หญิง ชั้น 1',
  'ห้องน้ำส่วนกลาง ชั้น 2',
  'ออฟฟิศผู้บริหาร & แผนกต้อนรับ',
  'ห้องคอนโทรลระบบ & กล้องวงจรปิด CCTV',
  'สโตร์เก็บของ แม่บ้าน (Store Room)',
  'ห้องเครื่องกำเนิดไฟฟ้า & ปั๊มน้ำ',
  'ลานจอดรถ & ป้อม รปภ.'
];

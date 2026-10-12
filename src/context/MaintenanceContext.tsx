import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  MaintenanceTicket, 
  Technician, 
  UserProfile, 
  AppSettings, 
  AppNotification, 
  UserRole, 
  Department, 
  TicketStatus,
  UrgencyLevel,
  LocationArea,
  WorkCategory,
  PartItem
} from '../types/maintenance';
import { 
  INITIAL_TICKETS, 
  INITIAL_TECHNICIANS, 
  INITIAL_SETTINGS 
} from '../data/mockData';
import { 
  initAuth, 
  googleSignIn, 
  logout as authLogout, 
  mapUserToProfile,
  getAccessToken
} from '../services/googleAuth';
import { 
  syncAllTicketsToGoogleSheet, 
  readTicketsFromGoogleSheet, 
  appendTicketToGoogleSheet 
} from '../services/googleSheets';
import { 
  sendLinePushMessage, 
  sendLineNotification, 
  formatLineMessage 
} from '../services/lineMessaging';

interface MaintenanceContextType {
  tickets: MaintenanceTicket[];
  technicians: Technician[];
  currentUser: UserProfile | null;
  settings: AppSettings;
  notifications: AppNotification[];
  activeTab: string;
  isSyncing: boolean;
  syncStatus: { status: 'idle' | 'success' | 'error' | 'syncing'; message?: string };
  isAuthenticated: boolean;
  setActiveTab: (tab: string) => void;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  setCurrentUserRole: (role: UserRole, department?: Department) => void;
  createTicket: (data: {
    area: LocationArea;
    roomNumber: string;
    department: Department;
    category: WorkCategory;
    urgency: UrgencyLevel;
    description: string;
    reporterName: string;
    reporterPhone: string;
    images?: string[];
  }) => Promise<MaintenanceTicket>;
  updateTicketStatus: (
    ticketId: string, 
    newStatus: TicketStatus, 
    notes?: string, 
    technicianId?: string,
    totalCost?: number,
    partsUsed?: PartItem[],
    repairImages?: string[]
  ) => Promise<void>;
  updateTicket: (ticketId: string, updates: Partial<MaintenanceTicket>) => Promise<boolean>;
  assignTechnician: (ticketId: string, technicianId: string) => Promise<void>;
  inspectTicket: (
    ticketId: string, 
    status: 'approved' | 'rejected', 
    rating: number, 
    feedback?: string
  ) => Promise<void>;
  importTicketsFromExcel: (newTickets: MaintenanceTicket[]) => Promise<number>;
  syncGoogleSheets: () => Promise<boolean>;
  updateSettings: (newSettings: Partial<AppSettings>) => void;
  markNotificationAsRead: (id: string) => void;
  clearAllNotifications: () => void;
}

const MaintenanceContext = createContext<MaintenanceContextType | undefined>(undefined);

const LOCAL_STORAGE_TICKETS_KEY = 'b2_hotel_maintenance_tickets_v1';
const LOCAL_STORAGE_SETTINGS_KEY = 'b2_hotel_maintenance_settings_v1';
const LOCAL_STORAGE_NOTIFS_KEY = 'b2_hotel_maintenance_notifs_v1';

export const MaintenanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 1. Initial State from localStorage or fallback
  const [tickets, setTickets] = useState<MaintenanceTicket[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_TICKETS_KEY);
      return saved ? JSON.parse(saved) : INITIAL_TICKETS;
    } catch {
      return INITIAL_TICKETS;
    }
  });

  const [technicians, setTechnicians] = useState<Technician[]>(INITIAL_TECHNICIANS);
  
  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_SETTINGS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // ล็อคข้อมูล Channel Access Token และ LINE Destination Target ID ไม่ให้มีการเปลี่ยนแปลงแบบอัตโนมัติ
        const targetId = (parsed.lineTargetId && parsed.lineTargetId.trim() !== '' && parsed.lineTargetId !== 'C48b92_b2suphanburi_maint_team') 
          ? parsed.lineTargetId.trim() 
          : INITIAL_SETTINGS.lineTargetId;

        return {
          ...INITIAL_SETTINGS,
          ...parsed,
          lineTargetId: targetId,
          lineChannelAccessToken: (parsed.lineChannelAccessToken && parsed.lineChannelAccessToken.trim() !== '') 
            ? parsed.lineChannelAccessToken.trim() 
            : INITIAL_SETTINGS.lineChannelAccessToken,
          isLineLocked: parsed.isLineLocked !== undefined ? parsed.isLineLocked : true,
        };
      }
      return INITIAL_SETTINGS;
    } catch {
      return INITIAL_SETTINGS;
    }
  });

  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_NOTIFS_KEY);
      return saved ? JSON.parse(saved) : [
        {
          id: 'notif-1',
          ticketId: 'TK-202609-001',
          title: '🚨 งานด่วนวิกฤต (Critical)',
          message: 'ห้อง 304 แอร์น้ำรั่ว ช่างสมศักดิ์กำลังเข้าตรวจสอบ',
          timestamp: new Date().toISOString(),
          read: false,
          type: 'urgent'
        },
        {
          id: 'notif-2',
          ticketId: 'TK-202609-002',
          title: '🔍 รอตรวจรับงานซ่อม',
          message: 'ห้อง 208 ช่างประสิทธิ์เปลี่ยนสายชำระเรียบร้อย รอแม่บ้านตรวจรับ',
          timestamp: new Date().toISOString(),
          read: false,
          type: 'info'
        }
      ];
    } catch {
      return [];
    }
  });

  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    return {
      uid: 'demo-user-1',
      email: 'b2suphanburi@bookingb2hotel.com',
      displayName: 'ผู้จัดการทั่วไป (General Manager)',
      role: 'admin',
      department: 'ผู้จัดการโรงแรม (HM)',
      phone: '081-888-9900'
    };
  });

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncStatus, setSyncStatus] = useState<{ status: 'idle' | 'success' | 'error' | 'syncing'; message?: string }>({
    status: 'idle'
  });

  // Save to localStorage whenever tickets/settings/notifications change
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_TICKETS_KEY, JSON.stringify(tickets));
    } catch (e) {
      console.warn('Storage save failed:', e);
    }
  }, [tickets]);

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_SETTINGS_KEY, JSON.stringify(settings));
    } catch (e) {
      console.warn('Settings save failed:', e);
    }
  }, [settings]);

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_NOTIFS_KEY, JSON.stringify(notifications));
    } catch (e) {
      console.warn('Notifs save failed:', e);
    }
  }, [notifications]);

  // Firebase Auth listener
  useEffect(() => {
    const unsubscribe = initAuth(
      (user, token) => {
        setIsAuthenticated(true);
        if (user) {
          setCurrentUser(prev => {
            const mapped = mapUserToProfile(user);
            return prev ? { ...prev, email: mapped.email, displayName: mapped.displayName, photoURL: mapped.photoURL } : mapped;
          });
        }
      },
      () => {
        setIsAuthenticated(false);
      }
    );
    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async () => {
    try {
      const result = await googleSignIn();
      if (result) {
        setIsAuthenticated(true);
        const profile = mapUserToProfile(result.user);
        setCurrentUser(profile);
        addNotification({
          title: 'เข้าสู่ระบบสำเร็จ',
          message: `ยินดีต้อนรับ ${profile.displayName} เข้าสู่ระบบแจ้งซ่อมโรงแรม`,
          type: 'success'
        });
      }
    } catch (err: any) {
      console.error('Login error:', err);
      addNotification({
        title: 'เข้าสู่ระบบไม่สำเร็จ',
        message: err.message || 'โปรดลองใหม่อีกครั้ง',
        type: 'warning'
      });
    }
  };

  const logout = async () => {
    await authLogout();
    setIsAuthenticated(false);
    setCurrentUser(null);
  };

  const setCurrentUserRole = (role: UserRole, department?: Department) => {
    if (!currentUser) {
      setCurrentUser({
        uid: 'user-switched',
        email: 'b2suphanburi@bookingb2hotel.com',
        displayName: 'พนักงานจำลอง',
        role,
        department: department || 'พนักงานต้อนรับ (GSA)',
        phone: '0812345678'
      });
      return;
    }
    setCurrentUser({
      ...currentUser,
      role,
      department: department || currentUser.department
    });
  };

  const addNotification = (notif: { title: string; message: string; ticketId?: string; type?: 'info' | 'warning' | 'success' | 'urgent' }) => {
    const newNotif: AppNotification = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title: notif.title,
      message: notif.message,
      ticketId: notif.ticketId,
      timestamp: new Date().toISOString(),
      read: false,
      type: notif.type || 'info'
    };
    setNotifications(prev => [newNotif, ...prev.slice(0, 49)]);
  };

  // 2. Create Ticket
  const createTicket = async (data: {
    area: LocationArea;
    roomNumber: string;
    department: Department;
    category: WorkCategory;
    urgency: UrgencyLevel;
    description: string;
    reporterName: string;
    reporterPhone: string;
    images?: string[];
  }): Promise<MaintenanceTicket> => {
    const now = new Date();
    const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
    const countToday = tickets.length + 1;
    const ticketId = `TK-${yearMonth}-${String(countToday).padStart(3, '0')}`;

    const newTicket: MaintenanceTicket = {
      id: ticketId,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      area: data.area,
      roomNumber: data.roomNumber,
      department: data.department,
      category: data.category,
      urgency: data.urgency,
      description: data.description,
      reporterName: data.reporterName,
      reporterPhone: data.reporterPhone,
      reporterEmail: currentUser?.email,
      images: data.images || [],
      status: 'pending',
      historyLogs: [
        {
          id: `log-${Date.now()}`,
          timestamp: now.toISOString(),
          status: 'pending',
          action: 'สร้างรายการแจ้งซ่อม',
          performedBy: data.reporterName || 'ผู้แจ้ง'
        }
      ]
    };

    const updatedList = [newTicket, ...tickets];
    setTickets(updatedList);

    // In-app Notification
    addNotification({
      ticketId: newTicket.id,
      title: data.urgency === 'Critical' ? '🚨 แจ้งซ่อมด่วนวิกฤตใหม่!' : '🔔 มีการแจ้งซ่อมใหม่',
      message: `${data.area} (${data.roomNumber}) - ${data.category}: ${data.description.substring(0, 50)}`,
      type: data.urgency === 'Critical' ? 'urgent' : 'info'
    });

    // Real-time LINE Messaging API Notification (Automated to specific target ID)
    const lineToken = settings.lineChannelAccessToken || settings.lineNotifyToken;
    const lineTarget = settings.lineTargetId;
    if (lineToken && lineTarget && settings.lineAutoNotifyNewTicket !== false) {
      const lineMsg = formatLineMessage('new_ticket', newTicket);
      sendLinePushMessage(lineToken, lineTarget, lineMsg, newTicket.images[0]);
    }

    // Google Sheet sync if enabled
    if (settings.spreadsheetId && settings.autoSync) {
      appendTicketToGoogleSheet(settings.spreadsheetId, newTicket, settings.sheetName).catch(console.error);
    }

    return newTicket;
  };

  // 3. Update Ticket Status
  const updateTicketStatus = async (
    ticketId: string, 
    newStatus: TicketStatus, 
    notes?: string, 
    technicianId?: string,
    totalCost?: number,
    partsUsed?: PartItem[],
    repairImages?: string[]
  ) => {
    const now = new Date().toISOString();
    let updatedTicket: MaintenanceTicket | null = null;

    setTickets(prevTickets => {
      return prevTickets.map(ticket => {
        if (ticket.id !== ticketId) return ticket;

        let assignedTech = ticket.assignedTechnician;
        if (technicianId) {
          const techObj = technicians.find(t => t.id === technicianId);
          if (techObj) {
            assignedTech = {
              id: techObj.id,
              name: techObj.name,
              phone: techObj.phone,
              assignedAt: now
            };
          }
        }

        const newLogs = [
          ...ticket.historyLogs,
          {
            id: `log-${Date.now()}`,
            timestamp: now,
            status: newStatus,
            action: `เปลี่ยนสถานะเป็น ${newStatus}`,
            performedBy: currentUser?.displayName || 'ผู้ใช้งานระบบ',
            notes: notes
          }
        ];

        updatedTicket = {
          ...ticket,
          status: newStatus,
          updatedAt: now,
          assignedTechnician: assignedTech,
          technicianNotes: notes !== undefined ? notes : ticket.technicianNotes,
          totalCost: totalCost !== undefined ? totalCost : ticket.totalCost,
          partsUsed: partsUsed !== undefined ? partsUsed : ticket.partsUsed,
          repairImages: repairImages !== undefined ? repairImages : ticket.repairImages,
          completedAt: newStatus === 'completed' ? (ticket.completedAt || now) : ticket.completedAt,
          historyLogs: newLogs
        };

        return updatedTicket;
      });
    });

    if (updatedTicket) {
      // In-app Alert
      addNotification({
        ticketId: (updatedTicket as MaintenanceTicket).id,
        title: `🔄 อัปเดตงาน ${(updatedTicket as MaintenanceTicket).id}`,
        message: `${(updatedTicket as MaintenanceTicket).roomNumber}: สถานะเปลี่ยนเป็น ${newStatus}`,
        type: newStatus === 'completed' ? 'success' : 'info'
      });

      // LINE Messaging API Notification (Automated if enabled)
      const lineToken = settings.lineChannelAccessToken || settings.lineNotifyToken;
      const lineTarget = settings.lineTargetId;
      if (lineToken && lineTarget && settings.lineAutoNotifyStatusChange !== false) {
        let msgType: 'assigned' | 'status_update' | 'pending_inspection' | 'completed' = 'status_update';
        if (newStatus === 'pending_inspection') msgType = 'pending_inspection';
        else if (newStatus === 'completed') msgType = 'completed';
        
        const lineMsg = formatLineMessage(msgType, updatedTicket, notes);
        sendLinePushMessage(lineToken, lineTarget, lineMsg);
      }

      // Sync Google Sheets
      if (settings.spreadsheetId && settings.autoSync) {
        syncGoogleSheets();
      }
    }
  };

  // 3.5 Generic Update Ticket (for accounting, costs, extra metadata)
  const updateTicket = async (ticketId: string, updates: Partial<MaintenanceTicket>): Promise<boolean> => {
    const now = new Date().toISOString();
    let found = false;

    setTickets(prev => {
      return prev.map(t => {
        if (t.id !== ticketId) return t;
        found = true;
        return {
          ...t,
          ...updates,
          updatedAt: now
        };
      });
    });

    if (found && settings.spreadsheetId && settings.autoSync) {
      syncGoogleSheets();
    }

    return found;
  };

  // 4. Assign Technician
  const assignTechnician = async (ticketId: string, technicianId: string) => {
    const tech = technicians.find(t => t.id === technicianId);
    if (!tech) return;

    await updateTicketStatus(
      ticketId, 
      'in_progress', 
      `มอบหมายงานให้ ${tech.name}`, 
      technicianId
    );

    // Update technician active count
    setTechnicians(prev => prev.map(t => {
      if (t.id === technicianId) {
        return { ...t, activeJobsCount: t.activeJobsCount + 1 };
      }
      return t;
    }));
  };

  // 5. Inspect Ticket
  const inspectTicket = async (
    ticketId: string, 
    status: 'approved' | 'rejected', 
    rating: number, 
    feedback?: string
  ) => {
    const now = new Date().toISOString();
    const newTicketStatus: TicketStatus = status === 'approved' ? 'completed' : 'in_progress';

    setTickets(prev => prev.map(ticket => {
      if (ticket.id !== ticketId) return ticket;

      return {
        ...ticket,
        status: newTicketStatus,
        updatedAt: now,
        completedAt: status === 'approved' ? now : undefined,
        inspection: {
          inspectedBy: currentUser?.displayName || 'ผู้ตรวจรับ',
          inspectedAt: now,
          status,
          rating,
          feedback
        },
        historyLogs: [
          ...ticket.historyLogs,
          {
            id: `log-${Date.now()}`,
            timestamp: now,
            status: newTicketStatus,
            action: status === 'approved' ? `ตรวจรับผ่าน (ประเมิน ${rating} ดาว)` : `ไม่ผ่านการตรวจรับ: ${feedback || 'ต้องแก้ไข'}`,
            performedBy: currentUser?.displayName || 'ผู้ตรวจรับ',
            notes: feedback
          }
        ]
      };
    }));

    addNotification({
      ticketId,
      title: status === 'approved' ? '✅ ตรวจรับงานสำเร็จ' : '⚠️ ส่งงานกลับแก้ไข',
      message: status === 'approved' ? `ปิดงานแจ้งซ่อม ${ticketId} เรียบร้อยแล้ว` : `งาน ${ticketId} ต้องการการแก้ไขเพิ่มเติม`,
      type: status === 'approved' ? 'success' : 'warning'
    });

    const lineToken = settings.lineChannelAccessToken || settings.lineNotifyToken;
    const lineTarget = settings.lineTargetId;
    if (lineToken && lineTarget && settings.lineAutoNotifyInspection !== false) {
      const ticketObj = tickets.find(t => t.id === ticketId);
      if (ticketObj) {
        const lineMsg = formatLineMessage('completed', { ...ticketObj, status: newTicketStatus, inspection: { inspectedBy: currentUser?.displayName || 'ผู้ตรวจรับ', inspectedAt: now, status, rating, feedback } });
        sendLinePushMessage(lineToken, lineTarget, lineMsg);
      }
    }

    if (settings.spreadsheetId && settings.autoSync) {
      syncGoogleSheets();
    }
  };

  // 6. Import Tickets from Excel
  const importTicketsFromExcel = async (newTickets: MaintenanceTicket[]): Promise<number> => {
    if (!newTickets || newTickets.length === 0) return 0;
    
    // Merge by id or append
    const existingIds = new Set(tickets.map(t => t.id));
    const toAdd = newTickets.filter(t => !existingIds.has(t.id));
    const merged = [...toAdd, ...tickets];
    
    setTickets(merged);

    addNotification({
      title: '📊 นำเข้าข้อมูล Excel สำเร็จ',
      message: `นำเข้ารายการแจ้งซ่อมสำเร็จ ${newTickets.length} รายการ`,
      type: 'success'
    });

    if (settings.spreadsheetId && settings.autoSync) {
      syncAllTicketsToGoogleSheet(settings.spreadsheetId, merged, settings.sheetName).catch(console.error);
    }

    return newTickets.length;
  };

  // 7. Sync with Google Sheets
  const syncGoogleSheets = async (): Promise<boolean> => {
    if (!settings.spreadsheetId) {
      setSyncStatus({ status: 'error', message: 'กรุณาระบุ Google Spreadsheet ID ในการตั้งค่า' });
      return false;
    }

    setIsSyncing(true);
    setSyncStatus({ status: 'syncing', message: 'กำลังเชื่อมต่อและซิงค์ข้อมูล Google Sheets...' });

    try {
      // 1. Try reading any updates first
      const remoteTickets = await readTicketsFromGoogleSheet(settings.spreadsheetId, settings.sheetName);
      
      // If remote has data, merge
      if (remoteTickets && remoteTickets.length > 0) {
        const localIdMap = new Map(tickets.map(t => [t.id, t]));
        remoteTickets.forEach(rt => {
          localIdMap.set(rt.id, rt);
        });
        const combined = Array.from(localIdMap.values());
        setTickets(combined);
        await syncAllTicketsToGoogleSheet(settings.spreadsheetId, combined, settings.sheetName);
      } else {
        // Upload all local tickets to empty remote sheet
        await syncAllTicketsToGoogleSheet(settings.spreadsheetId, tickets, settings.sheetName);
      }

      setSyncStatus({ status: 'success', message: `ซิงค์ข้อมูลเรียบร้อย (${new Date().toLocaleTimeString('th-TH')})` });
      setSettings(prev => ({ ...prev, lastSyncedAt: new Date().toISOString() }));
      setIsSyncing(false);
      return true;
    } catch (err: any) {
      console.error('Google Sheets Sync Failed:', err);
      setSyncStatus({ status: 'error', message: err.message || 'ซิงค์ไม่สำเร็จ' });
      setIsSyncing(false);
      return false;
    }
  };

  const updateSettings = (newSettings: Partial<AppSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  const markNotificationAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  return (
    <MaintenanceContext.Provider
      value={{
        tickets,
        technicians,
        currentUser,
        settings,
        notifications,
        activeTab,
        isSyncing,
        syncStatus,
        isAuthenticated,
        setActiveTab,
        loginWithGoogle,
        logout,
        setCurrentUserRole,
        createTicket,
        updateTicketStatus,
        updateTicket,
        assignTechnician,
        inspectTicket,
        importTicketsFromExcel,
        syncGoogleSheets,
        updateSettings,
        markNotificationAsRead,
        clearAllNotifications
      }}
    >
      {children}
    </MaintenanceContext.Provider>
  );
};

export const useMaintenance = () => {
  const context = useContext(MaintenanceContext);
  if (!context) {
    throw new Error('useMaintenance must be used within a MaintenanceProvider');
  }
  return context;
};

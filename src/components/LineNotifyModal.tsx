import React, { useState, useEffect } from 'react';
import { useMaintenance } from '../context/MaintenanceContext';
import { MaintenanceTicket } from '../types/maintenance';
import { 
  sendLinePushMessage, 
  formatLineMessage, 
  formatDailySummaryLineMessage 
} from '../services/lineMessaging';
import { 
  Send, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  Key, 
  MessageSquare, 
  Bell, 
  Sparkles,
  ExternalLink,
  Edit3,
  Target,
  Info,
  Lock
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface LineNotifyModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticket?: MaintenanceTicket | null;
  defaultType?: 'new_ticket' | 'assigned' | 'status_update' | 'pending_inspection' | 'completed' | 'daily_summary' | 'custom';
}

export const LineNotifyModal: React.FC<LineNotifyModalProps> = ({
  isOpen,
  onClose,
  ticket,
  defaultType = 'new_ticket'
}) => {
  const { settings, tickets } = useMaintenance();

  const [messageType, setMessageType] = useState<'new_ticket' | 'assigned' | 'status_update' | 'pending_inspection' | 'completed' | 'daily_summary' | 'custom'>(
    defaultType
  );
  const [token, setToken] = useState(settings.lineChannelAccessToken || settings.lineNotifyToken || '');
  const [targetId, setTargetId] = useState(settings.lineTargetId || '');
  const [customNote, setCustomNote] = useState('');
  const [messageText, setMessageText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sendStatus, setSendStatus] = useState<{ success?: boolean; message?: string } | null>(null);

  // Sync token & targetId from settings when modal opens
  useEffect(() => {
    if (isOpen) {
      setToken(settings.lineChannelAccessToken || settings.lineNotifyToken || '');
      setTargetId(settings.lineTargetId || '');
      setSendStatus(null);
    }
  }, [settings.lineChannelAccessToken, settings.lineNotifyToken, settings.lineTargetId, isOpen]);

  // Recalculate default message when type or ticket changes
  useEffect(() => {
    if (!isOpen) return;

    if (messageType === 'daily_summary') {
      const summaryMsg = formatDailySummaryLineMessage(tickets, settings.hotelName || 'โรงแรม บีทู');
      setMessageText(summaryMsg);
    } else if (ticket) {
      const formatted = formatLineMessage(
        messageType === 'custom' ? 'status_update' : (messageType as any),
        ticket,
        customNote
      );
      setMessageText(formatted);
    } else {
      const sample: MaintenanceTicket = tickets[0] || {
        id: 'TK-SUMMARY-001',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        area: 'ห้องพัก',
        roomNumber: '304',
        department: 'พนักงานต้อนรับ (GSA)',
        category: 'แอร์',
        urgency: 'High',
        description: 'เครื่องปรับอากาศไม่เย็น มีลมเปล่า',
        reporterName: 'ผู้ใช้ระบบ',
        reporterPhone: '0812345678',
        status: 'in_progress',
        images: [],
        historyLogs: []
      };
      const formatted = formatLineMessage(
        messageType === 'custom' ? 'status_update' : (messageType as any),
        sample,
        customNote
      );
      setMessageText(formatted);
    }
  }, [messageType, ticket, customNote, tickets, settings.hotelName, isOpen]);

  if (!isOpen) return null;

  const handleSend = async () => {
    if (!token.trim()) {
      setSendStatus({
        success: false,
        message: 'กรุณาระบุ LINE Channel Access Token ก่อนกดส่ง'
      });
      return;
    }

    if (!targetId.trim()) {
      setSendStatus({
        success: false,
        message: 'กรุณาระบุ LINE Target ID (User ID หรือ Group ID) เพื่อให้ระบบส่งข้อมูลไปแค่ที่เดียว'
      });
      return;
    }

    if (!messageText.trim()) {
      setSendStatus({
        success: false,
        message: 'กรุณากรอกข้อความที่ต้องการส่งเข้า LINE'
      });
      return;
    }

    setIsSending(true);
    setSendStatus({ message: 'กำลังส่งข้อความผ่าน LINE Messaging API...' });

    try {
      const imageUrl = ticket?.images?.[0];
      const res = await sendLinePushMessage(token.trim(), targetId.trim(), messageText.trim(), imageUrl);

      if (res.success) {
        confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
        setSendStatus({
          success: true,
          message: res.message || `ส่งข้อความไปยัง LINE (${targetId.trim()}) สำเร็จแล้ว!`
        });
      } else {
        setSendStatus({
          success: false,
          message: res.message || 'ส่งข้อความไม่สำเร็จ กรุณาตรวจสอบ Token และ Target ID'
        });
      }
    } catch (err: any) {
      setSendStatus({
        success: false,
        message: err.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อ LINE Messaging API'
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-[#06C755]/10 text-[#06C755] flex items-center justify-center font-bold">
              <Send className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-base text-slate-800">
                  ส่งข้อความ LINE Messaging API
                </h3>
                <span className="text-[10px] px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full font-bold">
                  Official Bot
                </span>
              </div>
              <p className="text-xs text-slate-500">
                {ticket ? `รายการ: ${ticket.id} (${ticket.roomNumber})` : 'ส่งข้อความตรงไปยังที่เดียวที่กำหนด'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
          {/* Destination Target ID Badge */}
          <div className="p-3 bg-emerald-50/80 border border-emerald-200 rounded-2xl space-y-1.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-emerald-900 flex items-center gap-1.5">
                <Target className="w-4 h-4 text-emerald-600" />
                <span>ปลายทางที่จะส่งข้อมูลไป (Target ID ส่งไปที่เดียว):</span>
              </span>
              <div className="flex items-center gap-1">
                {settings.isLineLocked && (
                  <span className="text-[10px] text-emerald-800 bg-emerald-200/70 px-1.5 py-0.5 rounded font-bold flex items-center gap-0.5">
                    <Lock className="w-2.5 h-2.5" />
                    <span>LOCKED</span>
                  </span>
                )}
                <span className="text-[10px] text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded font-medium">
                  User / Group
                </span>
              </div>
            </div>
            <input
              type="text"
              placeholder="ระบุ User ID (U...) หรือ Group ID (C...) เพื่อส่งไปแค่ที่เดียว"
              value={targetId}
              onChange={e => setTargetId(e.target.value)}
              className="w-full px-3 py-1.5 bg-white border border-emerald-300 rounded-xl text-xs font-mono text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            />
            <p className="text-[10px] text-emerald-800">
              💡 ข้อความจะถูกส่งตรงไปหาเฉพาะบัญชีหรือกลุ่มนี้เพียงที่เดียว ไม่ส่งไปที่อื่น
            </p>
          </div>

          {/* Template Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              เลือกรูปแบบข้อความ (Notification Template)
            </label>
            <div className="grid grid-cols-2 gap-1.5 text-xs">
              {[
                { id: 'new_ticket', label: '🔔 แจ้งซ่อมใหม่' },
                { id: 'assigned', label: '👨‍🔧 มอบหมายช่าง' },
                { id: 'status_update', label: '🔄 อัปเดตสถานะ' },
                { id: 'pending_inspection', label: '🔍 รอตรวจรับงาน' },
                { id: 'completed', label: '✅ ปิดงานซ่อม' },
                { id: 'daily_summary', label: '📊 สรุปงานประจำวัน' }
              ].map(item => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setMessageType(item.id as any)}
                  className={`p-2 rounded-xl text-left font-medium border transition-all cursor-pointer ${
                    messageType === item.id
                      ? 'bg-[#06C755]/10 border-[#06C755] text-[#05a847] font-semibold'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Optional Extra Note */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              ข้อความเพิ่มเติม (Optional Note)
            </label>
            <input
              type="text"
              placeholder="เช่น รบกวนช่างเข้าดูด่วนภายใน 15 นาที..."
              value={customNote}
              onChange={e => setCustomNote(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-[#06C755]"
            />
          </div>

          {/* Message Preview Textarea */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                <Edit3 className="w-3.5 h-3.5 text-[#06C755]" />
                <span>ตัวอย่างข้อความที่จะส่ง (แก้ไขข้อความได้)</span>
              </label>
              <span className="text-[10px] text-slate-400">LINE Push Message</span>
            </div>
            <textarea
              rows={7}
              value={messageText}
              onChange={e => setMessageText(e.target.value)}
              className="w-full p-3 bg-slate-900 text-emerald-400 font-mono text-xs rounded-2xl border border-slate-800 focus:outline-hidden focus:ring-2 focus:ring-[#06C755] leading-relaxed resize-none"
            />
          </div>

          {/* Channel Access Token Field */}
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700 flex items-center gap-1">
                <Key className="w-3.5 h-3.5 text-slate-500" />
                LINE Channel Access Token (Long-lived)
              </span>
              <a
                href="https://developers.line.biz/console/"
                target="_blank"
                rel="noreferrer"
                className="text-[10px] text-[#05a847] font-medium hover:underline flex items-center gap-0.5"
              >
                <span>LINE Developers Console</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <input
              type="password"
              placeholder="ระบุ Channel Access Token..."
              value={token}
              onChange={e => setToken(e.target.value)}
              className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-mono text-slate-800"
            />
          </div>

          {/* Status Message */}
          {sendStatus && (
            <div
              className={`p-3 rounded-2xl text-xs font-semibold flex items-center space-x-2 ${
                sendStatus.success
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 animate-fade-in'
                  : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}
            >
              {sendStatus.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{sendStatus.message}</span>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl cursor-pointer"
          >
            ยกเลิก
          </button>
          <button
            type="button"
            onClick={handleSend}
            disabled={isSending}
            className="px-6 py-2.5 bg-[#06C755] hover:bg-[#05a847] active:scale-[0.98] text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center space-x-2 shrink-0 cursor-pointer disabled:opacity-50"
          >
            <Send className={`w-4 h-4 ${isSending ? 'animate-bounce' : ''}`} />
            <span>{isSending ? 'กำลังส่ง LINE...' : 'กดส่งไปยัง LINE ปลายทางทันที'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

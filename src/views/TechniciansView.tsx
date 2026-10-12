import React, { useState } from 'react';
import { useMaintenance } from '../context/MaintenanceContext';
import { Technician, WorkCategory } from '../types/maintenance';
import { 
  PhoneCall, 
  Phone, 
  UserPlus, 
  Wrench, 
  CheckCircle2, 
  Clock, 
  Shield, 
  MessageSquare, 
  Sparkles,
  X
} from 'lucide-react';

export const TechniciansView: React.FC = () => {
  const { technicians, tickets } = useMaintenance();
  const [showAddModal, setShowAddModal] = useState(false);
  const [filterSkill, setFilterSkill] = useState<string>('all');

  const filteredTechs = technicians.filter(tech => {
    if (filterSkill === 'all') return true;
    return tech.skills.includes(filterSkill as WorkCategory);
  });

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-orange-500 via-amber-600 to-sky-700 rounded-3xl p-6 sm:p-8 text-white shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="px-2.5 py-1 text-xs font-semibold bg-white/20 rounded-full backdrop-blur-xs text-orange-100 uppercase tracking-wider">
              Engineering Team & On-Duty Dispatch
            </span>
            <h2 className="text-2xl font-bold mt-2">ติดต่อช่างประจำเวร & ฝ่ายอาคาร (โทร)</h2>
            <p className="text-xs sm:text-sm text-orange-100 mt-1 max-w-2xl">
              โทรติดต่อทีมช่างโดยตรงเพื่อแจ้งเหตุฉุกเฉิน มอบหมายงานด่วน หรือติดตามสถานะการซ่อม
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <span className="px-3.5 py-2 bg-white/20 rounded-xl text-xs sm:text-sm font-semibold backdrop-blur-xs border border-white/20">
              ช่างประจำเวรวันนี้: {technicians.length} ท่าน
            </span>
          </div>
        </div>
      </div>

      {/* Filter Tabs by Skill */}
      <div className="bg-white rounded-3xl p-5 border border-sky-100 shadow-2xs">
        <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none">
          <span className="text-xs font-semibold text-slate-500 mr-2 shrink-0">กรองตามความเชี่ยวชาญ:</span>
          {['all', 'แอร์', 'ไฟฟ้า', 'ประปา', 'เฟอร์นิเจอร์', 'ไอที / อินเตอร์เน็ต', 'Fire Alarm', 'งานสี / โครงสร้างอาคาร'].map(skill => (
            <button
              key={skill}
              onClick={() => setFilterSkill(skill)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 ${
                filterSkill === skill
                  ? 'bg-orange-500 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {skill === 'all' ? 'ช่างทั้งหมด' : skill}
            </button>
          ))}
        </div>
      </div>

      {/* Technician Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {filteredTechs.map(tech => {
          const activeJobs = tickets.filter(t => t.assignedTechnician?.id === tech.id && t.status !== 'completed');
          const isAvailable = tech.status === 'available' || activeJobs.length < 2;

          return (
            <div
              key={tech.id}
              className="bg-white rounded-3xl p-5 border border-sky-100 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="relative">
                    <img
                      src={tech.avatar || 'https://images.unsplash.com/photo-1540569014015-19a7be504e3a?w=150'}
                      alt={tech.name}
                      className="w-14 h-14 rounded-2xl object-cover border-2 border-orange-200 shadow-xs"
                    />
                    <span
                      className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
                        isAvailable ? 'bg-emerald-500' : 'bg-amber-500'
                      }`}
                      title={isAvailable ? 'พร้อมรับงาน' : 'กำลังซ่อมงาน'}
                    />
                  </div>

                  <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md ${
                    isAvailable ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {isAvailable ? 'พร้อมรับงาน' : `ติดงาน (${activeJobs.length} งาน)`}
                  </span>
                </div>

                <div className="mt-3">
                  <h3 className="font-bold text-sm text-slate-900 leading-snug">{tech.name}</h3>
                  <p className="text-[11px] text-slate-500">{tech.department}</p>
                </div>

                {/* Skills tags */}
                <div className="mt-3 flex flex-wrap gap-1">
                  {tech.skills.map((skill, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 bg-sky-50 text-sky-700 rounded-md text-[10px] font-medium border border-sky-100"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-5 pt-3 border-t border-slate-100 space-y-2">
                <a
                  href={`tel:${tech.phone.replace(/[^0-9]/g, '')}`}
                  className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center justify-center space-x-2 transition-colors"
                >
                  <Phone className="w-4 h-4" />
                  <span>โทร {tech.phone}</span>
                </a>

                <a
                  href={`https://line.me/ti/p/~`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-2 px-4 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold rounded-xl flex items-center justify-center space-x-1.5 transition-colors"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                  <span>ส่งข้อความทาง LINE</span>
                </a>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

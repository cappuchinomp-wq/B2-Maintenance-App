/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { MaintenanceProvider, useMaintenance } from './context/MaintenanceContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { DashboardView } from './views/DashboardView';
import { CreateTicketView } from './views/CreateTicketView';
import { WorkTrackingView } from './views/WorkTrackingView';
import { RoomHistoryView } from './views/RoomHistoryView';
import { InspectionView } from './views/InspectionView';
import { ExcelImportExportView } from './views/ExcelImportExportView';
import { DailyReportView } from './views/DailyReportView';
import { AnalyticsReportView } from './views/AnalyticsReportView';
import { CostAccountingView } from './views/CostAccountingView';
import { ToolsHubView } from './views/ToolsHubView';
import { TechniciansView } from './views/TechniciansView';
import { RoomMatrixView } from './views/RoomMatrixView';
import { ReportsHubView } from './views/ReportsHubView';
import { OthersHubView } from './views/OthersHubView';
import { SettingsView } from './views/SettingsView';
import { LineTechnicianPortalView } from './views/LineTechnicianPortalView';
import { Wrench } from 'lucide-react';

const AppContent: React.FC = () => {
  const { activeTab, settings } = useMaintenance();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);

  const renderActiveView = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardView />;
      case 'room_matrix':
        return <RoomMatrixView />;
      case 'create_ticket':
        return <CreateTicketView />;
      case 'tracking':
        return <WorkTrackingView />;
      case 'line_technician':
        return <LineTechnicianPortalView />;
      case 'rooms':
        return <RoomHistoryView />;
      case 'inspection':
        return <InspectionView />;
      case 'excel':
        return <ExcelImportExportView />;
      case 'report':
        return <DailyReportView />;
      case 'analytics':
        return <AnalyticsReportView />;
      case 'accounting_cost':
        return <CostAccountingView />;
      case 'reports':
        return <ReportsHubView />;
      case 'others':
        return <OthersHubView />;
      case 'tools':
        return <ToolsHubView />;
      case 'technicians':
        return <TechniciansView />;
      case 'settings':
        return <SettingsView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <div className="min-h-screen flex bg-[#f8fafc] text-slate-800 antialiased selection:bg-sky-200 selection:text-sky-900 font-sans">
      {/* Side Navigation Bar (แถบเมนูด้านข้าง) */}
      <Sidebar 
        mobileOpen={mobileMenuOpen} 
        setMobileOpen={setMobileMenuOpen} 
        collapsed={sidebarCollapsed} 
        setCollapsed={setSidebarCollapsed}
        onOpenRoleModal={() => setShowRoleModal(true)}
      />

      {/* Main Content Area (เยื้องตาม Sidebar ด้านข้าง) */}
      <div 
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${
          sidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64 xl:pl-72'
        }`}
      >
        {/* Top Header Bar */}
        <Navbar 
          onToggleMobileMenu={() => setMobileMenuOpen(prev => !prev)}
          showRoleModal={showRoleModal}
          setShowRoleModal={setShowRoleModal}
        />

        {/* Main View Area */}
        <main className="flex-1 pb-12 min-w-0">
          {renderActiveView()}
        </main>

        {/* System Footer */}
        <footer className="bg-white border-t border-slate-200/80 py-5 text-xs text-slate-500">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 rounded-lg bg-sky-600 text-white flex items-center justify-center font-bold text-xs">
                <Wrench className="w-3.5 h-3.5" />
              </div>
              <span className="font-semibold text-slate-700">{settings.hotelName || 'Hotel Maintenance'}</span>
              <span>•</span>
              <span>ระบบบริหารและแจ้งซ่อมโรงแรม</span>
            </div>

            <div className="flex items-center space-x-4 text-[11px] text-slate-400">
              <span className="flex items-center gap-1">
                <span className={`w-2 h-2 rounded-full ${settings.spreadsheetId ? 'bg-emerald-500' : 'bg-amber-400'}`} />
                {settings.spreadsheetId ? 'Google Sheets เชื่อมต่อแล้ว' : 'Google Sheets พร้อมตั้งค่า'}
              </span>
              <span>•</span>
              <span>Gmail รายงานประจำวัน</span>
              <span>•</span>
              <span>LINE Messaging API Real-time</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <MaintenanceProvider>
      <AppContent />
    </MaintenanceProvider>
  );
}

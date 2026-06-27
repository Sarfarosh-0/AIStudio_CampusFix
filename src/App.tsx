/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  INITIAL_REPORTS, 
  CampusReport, 
  Priority, 
  STATUS_COLORS, 
  PRIORITY_COLORS, 
  CATEGORY_COLORS 
} from './types';
import ReportForm from './components/ReportForm';
import ResolverQueue from './components/ResolverQueue';
import PublicDashboard from './components/PublicDashboard';
import MapVisualizer from './components/MapVisualizer';
import { 
  Sparkles, 
  Flame, 
  CheckCircle2, 
  Layers, 
  FileText, 
  MapPin, 
  AlertTriangle,
  History,
  X
} from 'lucide-react';

export default function App() {
  const [reports, setReports] = useState<CampusReport[]>(INITIAL_REPORTS);
  const [selectedBuilding, setSelectedBuilding] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<'student' | 'resolver' | 'dashboard'>('student');
  
  // Real-time agentic cluster alerting system state
  const [escalatedAlert, setEscalatedAlert] = useState<{
    building: string;
    category: string;
    count: number;
  } | null>(null);

  // Status updates in Resolver Queue
  const handleUpdateStatus = (reportId: string, nextStatus: CampusReport['status_state']) => {
    setReports(prev => prev.map(report => {
      if (report.report_id === reportId) {
        return {
          ...report,
          status_state: nextStatus
        };
      }
      return report;
    }));
  };

  // Submit and run autonomous agent clustering check
  const handleSubmitReport = async (newReportData: Omit<CampusReport, 'report_id' | 'created_at' | 'cluster_flag' | 'category' | 'priority'> & {
    category?: any;
    priority?: any;
    reasoning?: string;
  }) => {
    
    const nextIdNum = reports.length + 1;
    const newReport: CampusReport = {
      report_id: `rep-${String(nextIdNum).padStart(3, '0')}`,
      image_payload: newReportData.image_payload,
      description: newReportData.description,
      building_tag: newReportData.building_tag,
      category: newReportData.category || 'Infrastructure',
      priority: newReportData.priority || 'Medium',
      status_state: 'Pending',
      cluster_flag: false,
      created_at: Date.now()
    };

    // Agentic Cluster check!
    // If there are 3 or more total reports in the same building with the same category that are not solved, trigger auto-escalation
    const existingActiveReports = reports.filter(r => 
      r.building_tag === newReport.building_tag &&
      r.category === newReport.category &&
      r.status_state !== 'Resolved'
    );

    const totalUnresolvedInCluster = existingActiveReports.length + 1;
    let didEscalate = false;

    const finalReports = [newReport, ...reports].map(r => {
      if (
        totalUnresolvedInCluster >= 3 &&
        r.building_tag === newReport.building_tag &&
        r.category === newReport.category &&
        r.status_state !== 'Resolved'
      ) {
        didEscalate = true;
        return {
          ...r,
          priority: 'High' as Priority,
          cluster_flag: true
        };
      }
      return r;
    });

    setReports(finalReports);

    if (didEscalate) {
      setEscalatedAlert({
        building: newReport.building_tag,
        category: newReport.category,
        count: totalUnresolvedInCluster
      });
    }
  };

  // Filter reported issues list in live side panel (affected by map selection)
  const displayedListReports = reports.filter(r => {
    if (selectedBuilding) {
      return r.building_tag === selectedBuilding;
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-surface-bg flex flex-col font-sans text-ink-primary">
      
      {/* Dynamic Global Agent Escalation Toast */}
      {escalatedAlert && (
        <div className="bg-critical-red text-white py-3 px-4 shadow-lg flex items-center justify-between transition-all duration-300">
          <div className="flex items-center gap-3 max-w-5xl mx-auto w-full">
            <Flame className="w-5 h-5 animate-bounce flex-shrink-0" />
            <p className="text-xs sm:text-sm font-semibold leading-snug">
              ⚠️ <strong>Agentic Escalation Triggered!</strong> {escalatedAlert.count} recurring reports of <strong>{escalatedAlert.category}</strong> at <strong>{escalatedAlert.building}</strong>. The system has automatically escalated their priorities to <strong>High</strong>.
            </p>
          </div>
          <button 
            onClick={() => setEscalatedAlert(null)}
            className="text-white hover:text-gray-200 transition p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Bar Header (Page 6 Logo & clean switchers) */}
      <header className="bg-white border-b border-border-divider">
        <div className="max-w-[1240px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black text-primary-blue tracking-tight hover:scale-[1.02] transition cursor-pointer select-none">
              CampusFix
            </h1>
          </div>

          {/* Clean Segment Mode Toggle */}
          <nav className="flex bg-neutral-100 p-1 rounded-badge select-none border border-neutral-200">
            <button
              id="nav-tab-student"
              onClick={() => setActiveView('student')}
              className={`px-3 py-1.5 rounded-badge text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeView === 'student'
                  ? 'bg-white text-primary-blue shadow-sm'
                  : 'text-text-secondary hover:text-ink-primary'
              }`}
            >
              📢 Reporter
            </button>
            <button
              id="nav-tab-resolver"
              onClick={() => setActiveView('resolver')}
              className={`px-3 py-1.5 rounded-badge text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeView === 'resolver'
                  ? 'bg-white text-primary-blue shadow-sm'
                  : 'text-text-secondary hover:text-ink-primary'
              }`}
            >
              🛠️ Authority
            </button>
            <button
              id="nav-tab-dashboard"
              onClick={() => setActiveView('dashboard')}
              className={`px-3 py-1.5 rounded-badge text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeView === 'dashboard'
                  ? 'bg-white text-primary-blue shadow-sm'
                  : 'text-text-secondary hover:text-ink-primary'
              }`}
            >
              📊 Analytics
            </button>
          </nav>
        </div>
      </header>

      {/* Primary Split Workspace */}
      <main className="flex-1 max-w-[1240px] w-full mx-auto px-4 sm:px-6 py-6 grid grid-cols-1 xl:grid-cols-12 gap-6">
        
        {/* Left Side Column: Active Mode Form/Table/Dashboard (Dynamic Span 7) */}
        <section className="xl:col-span-7 space-y-6">
          {activeView === 'student' && (
            <ReportForm onSubmitReport={handleSubmitReport} />
          )}

          {activeView === 'resolver' && (
            <ResolverQueue reports={reports} onUpdateStatus={handleUpdateStatus} />
          )}

          {activeView === 'dashboard' && (
            <PublicDashboard 
              reports={reports} 
              selectedBuilding={selectedBuilding} 
              onSelectBuilding={setSelectedBuilding} 
            />
          )}
        </section>

        {/* Right Side Column: Real-time map & reports view timeline (Dynamic Span 5) */}
        <section className="xl:col-span-5 space-y-6 flex flex-col justify-between">
          
          {/* Real-time Map Visualizer */}
          <div className="flex-1 min-h-[350px]">
            <MapVisualizer 
              reports={reports} 
              selectedBuilding={selectedBuilding} 
              onSelectBuilding={setSelectedBuilding}
            />
          </div>

          {/* Map Affected Live Subscriptions Feed (List View) */}
          <div className="bg-surface-card rounded-card border border-border-divider p-4 shadow-card">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-sm font-bold tracking-tight text-ink-primary flex items-center gap-1.5 select-none">
                <History className="w-4 h-4 text-primary-blue" />
                {selectedBuilding ? `🚨 Issues inside ${selectedBuilding}` : '📋 Live Action Feed'}
              </h3>
              
              <span className="text-[10px] font-mono text-text-secondary">
                {displayedListReports.length} reports total
              </span>
            </div>

            <div id="live-timeline-feed" className="space-y-3 max-h-[290px] overflow-y-auto pr-1">
              {displayedListReports.length === 0 ? (
                <div className="text-center py-8 bg-neutral-50 rounded border border-dashed text-text-secondary">
                  <p className="text-xs">No reports reported yet for this location.</p>
                </div>
              ) : (
                displayedListReports.map((report) => {
                  const pStyle = PRIORITY_COLORS[report.priority] || PRIORITY_COLORS.Medium;
                  const sStyle = STATUS_COLORS[report.status_state] || STATUS_COLORS.Pending;
                  
                  return (
                    <div 
                      key={report.report_id} 
                      className="border border-border-divider/70 rounded-lg p-3 hover:bg-neutral-50 transition-all flex gap-3 items-start relative bg-white"
                    >
                      {/* Thumbnail of actual report photo */}
                      <img 
                        src={report.image_payload} 
                        alt="Evidence thumbnail"
                        className="w-12 h-12 rounded object-cover flex-shrink-0 border bg-neutral-100"
                        referrerPolicy="no-referrer"
                      />

                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start gap-1">
                          <span className="text-xs font-bold text-ink-primary leading-tight truncate">
                            {report.building_tag}
                          </span>
                          <span 
                            style={{ backgroundColor: sStyle.bg, color: sStyle.text }}
                            className="text-[9px] font-extrabold px-1.5 py-0.5 rounded"
                          >
                            {report.status_state}
                          </span>
                        </div>

                        <p className="text-xs text-[#222] mt-1 line-clamp-2 leading-normal">
                          {report.description}
                        </p>

                        <div className="flex justify-between items-center mt-2 pt-1 border-t border-dashed border-neutral-100 flex-wrap gap-1.5">
                          <div className="flex gap-1.5 flex-wrap">
                            {/* Category badge */}
                            <span 
                              style={{ backgroundColor: CATEGORY_COLORS[report.category] + '15', color: CATEGORY_COLORS[report.category] }}
                              className="text-[9px] font-bold px-1.5 py-0.5 rounded"
                            >
                              {report.category}
                            </span>
                            
                            {/* Priority badge */}
                            <span 
                              style={{ backgroundColor: pStyle.bg, color: pStyle.text }}
                              className="text-[9px] font-bold px-1.5 py-0.5 rounded"
                            >
                              {report.priority}
                            </span>
                          </div>

                          {/* Escalation tracker banner */}
                          {report.cluster_flag && (
                            <span className="text-[8px] font-black tracking-wider text-[#6B21A8]/90 uppercase flex items-center gap-0.5 select-none">
                              <Flame className="w-2.5 h-2.5 animate-pulse" />
                              AI Escalated
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

        </section>
      </main>

      {/* Humble Footer */}
      <footer className="bg-white border-t border-border-divider py-4 select-none text-center">
        <p className="text-xs text-text-secondary">
          CampusFix · BlockseBlock Hackathon 2026 Submission · Built with Next-gen Gemini 3.5 Triage Engine.
        </p>
      </footer>
    </div>
  );
}

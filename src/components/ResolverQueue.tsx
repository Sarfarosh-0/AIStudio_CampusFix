/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { CampusReport, Category, STATUS_COLORS, PRIORITY_COLORS, CATEGORY_COLORS } from '../types';
import { 
  Wrench, 
  Utensils, 
  ShieldAlert, 
  Wifi, 
  Clock, 
  RefreshCw, 
  CheckCircle, 
  AlertTriangle,
  Flame,
  Search,
  Filter
} from 'lucide-react';

interface ResolverQueueProps {
  reports: CampusReport[];
  onUpdateStatus: (reportId: string, nextStatus: CampusReport['status_state']) => void;
}

const DEPARTMENT_TABS: { category: Category; label: string; icon: any }[] = [
  { category: 'Infrastructure', label: 'Infrastructure (Gov)', icon: Wrench },
  { category: 'Canteen & Hygiene', label: 'Canteen & Hygiene', icon: Utensils },
  { category: 'Safety', label: 'Campus Safety', icon: ShieldAlert },
  { category: 'Connectivity', label: 'IT & Connectivity', icon: Wifi }
];

export default function ResolverQueue({ reports, onUpdateStatus }: ResolverQueueProps) {
  const [activeTab, setActiveTab] = useState<Category>('Infrastructure');
  const [searchFilter, setSearchFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Filter accounts inside active queue
  const filteredReports = reports.filter(r => {
    const isCategory = r.category === activeTab;
    const matchesSearch = r.description.toLowerCase().includes(searchFilter.toLowerCase()) || 
                          r.building_tag.toLowerCase().includes(searchFilter.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' ? true : r.status_state === statusFilter;
    
    return isCategory && matchesSearch && matchesStatus;
  });

  // Department report totals for badges
  const getTabCount = (cat: Category) => {
    return reports.filter(r => r.category === cat && r.status_state !== 'Resolved').length;
  };

  return (
    <div id="resolver-queue-card" className="bg-surface-card rounded-card border border-border-divider p-6 shadow-card">
      <div className="flex justify-between items-start flex-wrap gap-4 mb-5">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-ink-primary">🛠️ Campus resolver queues</h2>
          <p className="text-xs text-text-secondary mt-1">
            Department-isolated dashboard for maintenance authorities. Track, prioritize, and click status buttons to update reported issues.
          </p>
        </div>
        
        {/* Simple search and status filters */}
        <div className="flex gap-2 flex-wrap w-full sm:w-auto">
          <div className="relative flex-1 sm:w-56">
            <input
              type="text"
              placeholder="Search reports/locations..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="w-full border border-border-divider rounded-lg pl-8 pr-3 py-1.5 text-xs focus:outline-none focus:border-primary-blue bg-white"
            />
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-text-secondary" />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-border-divider rounded-lg px-2 py-1.5 text-xs bg-white focus:outline-none focus:border-primary-blue cursor-pointer"
          >
            <option value="ALL">All States</option>
            <option value="Pending">Pending</option>
            <option value="In Progress">In Progress</option>
            <option value="Resolved">Resolved</option>
          </select>
        </div>
      </div>

      {/* Role-Specific Queue Navigation Tabs */}
      <div className="flex overflow-x-auto gap-1 border-b border-border-divider pb-2 scrollbar-none select-none mb-5">
        {DEPARTMENT_TABS.map((tab) => {
          const Icon = tab.icon;
          const pendingCount = getTabCount(tab.category);
          const isActive = activeTab === tab.category;

          return (
            <button
              key={tab.category}
              id={`tab-resolver-${tab.category.replace(/\s+/g, '-').toLowerCase()}`}
              onClick={() => setActiveTab(tab.category)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                isActive
                  ? 'bg-primary-blue text-white shadow-sm'
                  : 'text-text-secondary hover:text-ink-primary hover:bg-neutral-50'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {pendingCount > 0 && (
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                  isActive ? 'bg-white text-primary-blue' : 'bg-critical-tint text-critical-red'
                }`}>
                  {pendingCount}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Report Cards Grid */}
      {filteredReports.length === 0 ? (
        <div className="text-center py-10 border border-dashed border-border-divider rounded-lg bg-neutral-50 p-6">
          <p className="text-sm font-semibold text-text-secondary select-none">
            No active reports in this queue.
          </p>
          <p className="text-xs text-text-secondary mt-1">
            Toggle filter menus or simulate reporting a new issue!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredReports.map((report) => {
            const priorityStyle = PRIORITY_COLORS[report.priority] || PRIORITY_COLORS.Medium;
            const statusStyle = STATUS_COLORS[report.status_state] || STATUS_COLORS.Pending;

            return (
              <div
                key={report.report_id}
                id={`report-card-resolver-${report.report_id}`}
                className="bg-white rounded-card p-4 border border-border-divider shadow-card hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start gap-2 mb-2">
                    <span className="text-[10px] font-mono font-semibold bg-neutral-100 text-neutral-600 px-1.5 py-0.5 rounded">
                      ID: {report.report_id}
                    </span>
                    
                    <div className="flex items-center gap-1.5">
                      {/* Active Agentic Clustering Alert Banner */}
                      {report.cluster_flag && (
                        <div id={`cluster-tag-${report.report_id}`} className="bg-purple-100 text-[#6B21A8] border border-purple-200 text-[10px] font-bold px-2 py-0.5 rounded-badge flex items-center gap-1.5 animate-pulse select-none">
                          <Flame className="w-3 h-3 text-purple-600 animate-bounce" />
                          Escalated by AI
                        </div>
                      )}

                      {/* Priority Tag */}
                      <span
                        style={{
                          backgroundColor: priorityStyle.bg,
                          color: priorityStyle.text,
                        }}
                        className="text-[10px] font-semibold px-2 py-0.5 rounded-badge flex items-center gap-1 select-none"
                      >
                        <span
                          style={{ backgroundColor: priorityStyle.dot }}
                          className="h-1.5 w-1.5 rounded-full"
                        ></span>
                        {report.priority} Urgent
                      </span>
                    </div>
                  </div>

                  {/* Evidence Photo */}
                  <div className="flex gap-3 mb-3 items-start">
                    <div className="relative h-16 w-16 bg-neutral-100 rounded-md overflow-hidden flex-shrink-0 border">
                      <img
                        src={report.image_payload}
                        alt="Evidence Preview"
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-ink-primary leading-tight">
                        🏢 {report.building_tag}
                      </h4>
                      <p className="text-[11px] text-text-secondary mt-0.5">
                        Logged {new Date(report.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                      <p className="text-xs text-ink-primary mt-1 line-clamp-3 leading-relaxed">
                        {report.description}
                      </p>
                    </div>
                  </div>
                </div>

                {/* State controls inside dashboard */}
                <div className="mt-2 pt-3 border-t border-border-divider flex items-center justify-between gap-2 flex-wrap">
                  {/* Current Status Badge */}
                  <div className="text-xs flex items-center gap-1.5">
                    <span className="text-text-secondary uppercase text-[10px] tracking-wider select-none">Status:</span>
                    <span
                      style={{
                        backgroundColor: statusStyle.bg,
                        color: statusStyle.text,
                      }}
                      className="px-2 py-0.5 rounded-badge font-bold text-[11px]"
                    >
                      {report.status_state}
                    </span>
                  </div>

                  {/* Actions to shift states */}
                  <div className="flex gap-1.5">
                    {report.status_state === 'Pending' && (
                      <button
                        id={`btn-progress-${report.report_id}`}
                        onClick={() => onUpdateStatus(report.report_id, 'In Progress')}
                        className="bg-warning-tint text-warning-amber border border-warning-amber/30 text-[11px] font-semibold px-3 py-1.5 rounded-btn hover:bg-warning-amber hover:text-white transition cursor-pointer"
                      >
                        ⚡ Start Repair
                      </button>
                    )}
                    {report.status_state !== 'Resolved' && (
                      <button
                        id={`btn-resolve-${report.report_id}`}
                        onClick={() => onUpdateStatus(report.report_id, 'Resolved')}
                        className="bg-success-tint text-success-green border border-success-green/30 text-[11px] font-semibold px-3 py-1.5 rounded-btn hover:bg-success-green hover:text-white transition cursor-pointer animate-pulse-slow"
                      >
                        ✓ Mark Resolved
                      </button>
                    )}
                    {report.status_state === 'Resolved' && (
                      <span className="text-[11px] text-[#2E9E5B] font-bold flex items-center gap-1 py-1 px-2 select-none">
                        <CheckCircle className="w-3.5 h-3.5" />
                        Fixed End-to-End
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

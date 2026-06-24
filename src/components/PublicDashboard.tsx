/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { CampusReport, Category, CATEGORY_COLORS, PRIORITY_COLORS } from '../types';
import { TrendingUp, Sparkles, BarChart2, Flame } from 'lucide-react';

interface PublicDashboardProps {
  reports: CampusReport[];
  selectedBuilding: string | null;
  onSelectBuilding: (building: string | null) => void;
}

export default function PublicDashboard({ reports, selectedBuilding, onSelectBuilding }: PublicDashboardProps) {
  const totalReports = reports.length;
  
  // Calculate dynamic resolved issues. Start with 247 base seed as mentioned in design specs + actual resolved issues
  const actualResolved = reports.filter(r => r.status_state === 'Resolved').length;
  const baseSeedCount = 247;
  const displayResolvedCount = baseSeedCount + actualResolved;

  // Active (reported but unresolved) issues
  const activeReports = reports.filter(r => r.status_state !== 'Resolved').length;
  const inProgressReports = reports.filter(r => r.status_state === 'In Progress').length;
  const pendingReports = reports.filter(r => r.status_state === 'Pending').length;

  // Count by category
  const categories: Category[] = ['Infrastructure', 'Canteen & Hygiene', 'Safety', 'Connectivity'];
  const getCategoryStats = (cat: Category) => {
    const total = reports.filter(r => r.category === cat).length;
    const resolved = reports.filter(r => r.category === cat && r.status_state === 'Resolved').length;
    const pending = total - resolved;
    return { total, resolved, pending, pct: total > 0 ? Math.round((resolved / total) * 100) : 0 };
  };

  // Check how many have been auto-escalated
  const escalatedReportsCount = reports.filter(r => r.cluster_flag).length;

  return (
    <div id="public-dashboard-container" className="space-y-4">
      
      {/* Page Layout Header / Hero section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Deep Blue Hero Stat: Impact Counter */}
        <div id="hero-impact-stat" className="bg-primary-blue text-white rounded-card p-6 shadow-card flex flex-col justify-between md:col-span-1 border border-primary-blue-dark">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-widest text-[#DCE9F2] leading-none mb-1 select-none">
              🚀 Hackathon Impact Tracker
            </span>
            <p className="text-xs text-primary-blue-tint font-medium leading-tight">
              BlockseBlock Build Challenge 2026
            </p>
          </div>
          <div className="my-3 text-center">
            <h2 id="impact-resolved-counter" className="text-5xl font-black tracking-tight leading-none text-white transition-all transform hover:scale-105 duration-300">
              {displayResolvedCount}
            </h2>
            <p className="text-[10px] font-bold tracking-widest text-primary-blue-tint mt-1 select-none uppercase">
              Issues Resolved This Semester
            </p>
          </div>
          <div className="text-[11px] bg-primary-blue-dark/60 rounded px-2.5 py-1.5 border border-primary-blue-tint/20 text-center flex items-center justify-center gap-1">
            <TrendingUp className="w-3.5 h-3.5 text-success-green" />
            Live automated resolution rate: <strong>{totalReports > 0 ? Math.round((reports.filter(r => r.status_state === 'Resolved').length / totalReports) * 100) : 100}%</strong>
          </div>
        </div>

        {/* Real-time Status Stats Widget Grid */}
        <div className="md:col-span-2 grid grid-cols-2 sm:grid-cols-3 gap-3">
          
          {/* Active Pending widget */}
          <div className="bg-white rounded-card p-4 border border-border-divider shadow-card flex flex-col justify-between">
            <div>
              <span className="text-[10px] text-text-secondary uppercase tracking-widest font-bold select-none">
                🔴 AI Pending Triaged
              </span>
              <p className="text-2xl font-extrabold text-primary-blue mt-1">
                {pendingReports}
              </p>
            </div>
            <p className="text-[11px] text-text-secondary mt-2">
              Awaiting resolver dispatching
            </p>
          </div>

          {/* Active In Progress widget */}
          <div className="bg-white rounded-card p-4 border border-border-divider shadow-card flex flex-col justify-between">
            <div>
              <span className="text-[10px] text-text-secondary uppercase tracking-widest font-bold select-none">
                🟡 In Repair Active
              </span>
              <p className="text-2xl font-extrabold text-warning-amber mt-1">
                {inProgressReports}
              </p>
            </div>
            <p className="text-[11px] text-text-secondary mt-2">
              Staff active on locations
            </p>
          </div>

          {/* Agentic Escalated widget */}
          <div className="bg-white rounded-card p-4 border border-border-divider shadow-card flex flex-col justify-between col-span-2 sm:col-span-1">
            <div>
              <span className="text-[10px] text-text-secondary uppercase tracking-widest font-bold flex items-center gap-1 select-none">
                <Flame className="w-3 h-3 text-purple-600 animate-pulse" />
                🧬 Agent Escalated
              </span>
              <p className="text-2xl font-extrabold text-[#6B21A8] mt-1">
                {escalatedReportsCount}
              </p>
            </div>
            <p className="text-[11px] text-text-secondary mt-2">
              High-frequency issue clusters
            </p>
          </div>
        </div>
      </div>

      {/* Categories Department Breakdown Progress Chart */}
      <div className="bg-surface-card rounded-card border border-border-divider p-5 shadow-card">
        <h3 className="text-xs font-bold uppercase tracking-wider text-text-secondary mb-4 flex items-center gap-1.5 select-none">
          <BarChart2 className="w-4 h-4 text-primary-blue" />
          General Department Fix Ratio (Aggregate Metrics)
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {categories.map((cat) => {
            const stats = getCategoryStats(cat);
            const color = CATEGORY_COLORS[cat];
            
            return (
              <div key={cat} className="space-y-1 bg-neutral-50/50 p-3 rounded-lg border border-border-divider/50">
                <div className="flex justify-between items-center text-xs font-semibold">
                  <span className="text-ink-primary font-bold flex items-center gap-1.5">
                    <span style={{ backgroundColor: color }} className="h-2 w-2 rounded-full"></span>
                    {cat}
                  </span>
                  <span className="text-text-secondary">
                    {stats.resolved} solved · {stats.pending} pending ({stats.pct}% fix score)
                  </span>
                </div>
                {/* Custom Styled Progress Bar */}
                <div className="w-full bg-[#E2E8F0] h-2 rounded-badge overflow-hidden">
                  <div 
                    style={{ 
                      width: `${stats.total > 0 ? stats.pct : 100}%`,
                      backgroundColor: color 
                    }} 
                    className="h-full transition-all duration-550 ease-out"
                  ></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

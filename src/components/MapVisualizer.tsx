/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { CampusReport, CATEGORY_COLORS } from '../types';
import { MapPin, AlertCircle, CheckCircle2 } from 'lucide-react';

interface MapVisualizerProps {
  reports: CampusReport[];
  selectedBuilding: string | null;
  onSelectBuilding: (building: string | null) => void;
  interactive?: boolean;
}

// Fixed coordinates in a relative 100% SVG box for campus buildings
export const BUILDING_COORDINATES: Record<string, { x: number; y: number; label: string }> = {
  "Hostel A": { x: 18, y: 35, label: "Hostel Block A" },
  "Hostel B": { x: 15, y: 70, label: "Hostel Block B" },
  "Tech Block": { x: 50, y: 75, label: "Tech Block & Labs" },
  "Canteen": { x: 80, y: 68, label: "Central Canteen" },
  "Library": { x: 52, y: 30, label: "Central Library" },
  "Science Lab": { x: 82, y: 28, label: "Science & Research" },
  "Main Auditorium": { x: 50, y: 52, label: "Main Auditorium" }
};

export default function MapVisualizer({
  reports,
  selectedBuilding,
  onSelectBuilding,
  interactive = true
}: MapVisualizerProps) {
  
  // Calculate issue count (unresolved vs resolved) for each building
  const getBuildingStats = (buildingName: string) => {
    const buildingReports = reports.filter(r => r.building_tag === buildingName);
    const active = buildingReports.filter(r => r.status_state !== 'Resolved');
    const resolved = buildingReports.filter(r => r.status_state === 'Resolved');
    return {
      total: buildingReports.length,
      active: active.length,
      resolved: resolved.length,
      hasEscalated: active.some(r => r.cluster_flag || r.priority === 'High')
    };
  };

  return (
    <div id="map-visualizer-card" className="bg-surface-card rounded-card border border-border-divider p-4 shadow-card h-full flex flex-col justify-between">
      <div className="mb-3 flex justify-between items-center flex-wrap gap-2">
        <div>
          <h3 className="text-sm font-semibold tracking-wide uppercase text-text-secondary select-none">
            📍 Interactive Campus Blueprint
          </h3>
          <p className="text-xs text-text-secondary mt-0.5">
            Real-time status markers and cluster alert levels
          </p>
        </div>
        {selectedBuilding && (
          <button
            id="clear-map-filter-btn"
            onClick={() => onSelectBuilding(null)}
            className="text-[11px] bg-primary-blue-tint text-primary-blue px-2.5 py-1 rounded-badge font-semibold hover:bg-opacity-80 transition cursor-pointer"
          >
            Clear Filter ({selectedBuilding})
          </button>
        )}
      </div>

      {/* SVG Campus Map Wrapper */}
      <div className="relative flex-1 bg-[#EEF2F6] rounded-card min-h-[300px] max-h-[450px] border border-border-divider overflow-hidden select-none">
        
        {/* Subtle decorative mesh grid background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#E2E8F0_1px,transparent_1px),linear-gradient(to_bottom,#E2E8F0_1px,transparent_1px)] bg-[size:16px_16px] opacity-60"></div>
        
        <svg className="w-full h-full min-h-[300px]" viewBox="0 0 100 100" preserveAspectRatio="none">
          {/* Decorative Campus pathways (grey lines connecting blocks) */}
          <path
            d="M 18,35 L 52,30 M 15,70 L 50,75 M 52,30 L 50,52 M 50,52 L 50,75 M 50,52 L 80,68 M 52,30 L 82,28"
            stroke="#CBD5E1"
            strokeWidth="1.5"
            strokeDasharray="2 2"
            fill="none"
          />

          {/* Draw connecting roads */}
          <path
            d="M 16.5,50 C 35,50 40,55 50,52 M 50,52 L 81,48"
            stroke="#E2E8F0"
            strokeWidth="3"
            fill="none"
          />
        </svg>

        {/* Dynamic Building Cards Rendered on Map */}
        {Object.entries(BUILDING_COORDINATES).map(([name, coords]) => {
          const stats = getBuildingStats(name);
          const isSelected = selectedBuilding === name;
          
          return (
            <button
              key={name}
              id={`map-building-${name.replace(/\s+/g, '-').toLowerCase()}`}
              onClick={() => interactive && onSelectBuilding(isSelected ? null : name)}
              style={{
                left: `${coords.x}%`,
                top: `${coords.y}%`
              }}
              className={`absolute -translate-x-1/2 -translate-y-1/2 group transition-all duration-300 p-2 rounded-lg text-center flex flex-col items-center ${
                interactive ? 'cursor-pointer' : 'cursor-default'
              }`}
            >
              {/* Outer Glow Core Indicator */}
              <div className="relative">
                {stats.active > 0 && (
                  <span className={`absolute -inset-1.5 rounded-full ${
                    stats.hasEscalated 
                      ? 'bg-critical-red animate-ping' 
                      : 'bg-warning-amber animate-pulse'
                  } opacity-35`}></span>
                )}
                
                {/* Visual Icon Badge */}
                <div className={`relative h-9 w-9 rounded-full flex items-center justify-center transition-all duration-300 ${
                  stats.active > 0 
                  ? (stats.hasEscalated ? 'bg-critical-red text-white shadow-md shadow-critical-red/20' : 'bg-warning-amber text-white shadow-md')
                  : (stats.resolved > 0 ? 'bg-success-green text-white shadow' : 'bg-white text-primary-blue border-2 border-primary-blue-tint')
                } ${isSelected ? 'scale-125 ring-4 ring-primary-blue ring-offset-2' : ''}`}>
                  {stats.active > 0 ? (
                    stats.hasEscalated ? (
                      <AlertCircle className="w-5 h-5 animate-bounce" />
                    ) : (
                      <MapPin className="w-5 h-5" />
                    )
                  ) : stats.resolved > 0 ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : (
                    <MapPin className="w-4 h-4 text-primary-gray" />
                  )}
                </div>

                {/* Counter Badge if counts > 0 */}
                {stats.active > 0 && (
                  <div className="absolute -top-1.5 -right-1.5 bg-ink-primary text-white font-mono text-[10px] font-bold h-4 w-4 rounded-full flex items-center justify-center">
                    {stats.active}
                  </div>
                )}
              </div>

              {/* Building Label Card (grows on hover / selected) */}
              <div className={`mt-1.5 px-2 py-1 rounded border shadow-sm transition-all duration-200 ${
                isSelected 
                  ? 'bg-primary-blue-dark text-white border-primary-blue-dark'
                  : 'bg-white text-ink-primary border-border-divider hover:shadow-md'
              }`}>
                <p className="text-[11px] font-bold whitespace-nowrap leading-none select-none">
                  {name}
                </p>
                {stats.total > 0 ? (
                  <p className={`text-[9px] mt-0.5 select-none ${isSelected ? 'text-gray-200' : 'text-text-secondary'}`}>
                    {stats.active} pending · {stats.resolved} fixed
                  </p>
                ) : (
                  <p className={`text-[8px] uppercase tracking-wider select-none ${isSelected ? 'text-gray-200' : 'text-text-secondary'}`}>
                    Clear Status
                  </p>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Map Legend */}
      <div className="mt-3 grid grid-cols-3 gap-2 px-1 text-[11px] border-t border-border-divider pt-3 text-text-secondary">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-critical-red"></span>
          Cluster Alert / High Priority
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-warning-amber"></span>
          Pending Issues
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-success-green"></span>
          All Issues Resolved
        </span>
      </div>
    </div>
  );
}

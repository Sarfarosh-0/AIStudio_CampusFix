/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { Camera, AlertCircle, Sparkles, Check, RefreshCw } from 'lucide-react';
import { CampusReport, CAMPUS_BUILDINGS, Category, Priority } from '../types';

interface ReportFormProps {
  onSubmitReport: (newReport: Omit<CampusReport, 'report_id' | 'created_at' | 'cluster_flag' | 'category' | 'priority'> & {
    category?: Category;
    priority?: Priority;
    reasoning?: string;
  }) => Promise<void>;
}

// Quick presets for seamless demo testing (so judges don't need a local image)
const REPORT_IMAGE_PRESETS = [
  {
    id: "water_cooler",
    label: "Dropping/Leaking Pipe",
    description: "Water cooler pipe leaking and flooding corridor floors.",
    img: "https://images.unsplash.com/photo-1585842371054-2a7b4504a5e3?auto=format&fit=crop&w=600&q=80"
  },
  {
    id: "wifi_router",
    label: "WiFi Router Status",
    description: "Network router has an orange status light, cannot retrieve IP addresses.",
    img: "https://images.unsplash.com/photo-1544725176-7c40e5a71c5e?auto=format&fit=crop&w=600&q=80"
  },
  {
    id: "flickering_light",
    label: "Corridor Lights Flickering",
    description: "Lights on floor 3 staircase are flickering constantly and make buzzing sounds.",
    img: "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=600&q=80"
  },
  {
    id: "canteen_spill",
    label: "Canteen Food Overflow",
    description: "Trash bins overloaded near table 4 inside the canteen, attracting pests.",
    img: "https://images.unsplash.com/photo-1595113316349-9fa4ee24f884?auto=format&fit=crop&w=600&q=80"
  }
];

export default function ReportForm({ onSubmitReport }: ReportFormProps) {
  const [description, setDescription] = useState('');
  const [building, setBuilding] = useState(CAMPUS_BUILDINGS[1]); // Default to Hostel B
  const [imageUrl, setImageUrl] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [triageDetails, setTriageDetails] = useState<{
    category: string;
    priority: string;
    reasoning: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Character count validation (Max 500 chars)
  const isDescriptionValid = description.trim().length > 0 && description.length <= 500;

  // Image upload handling
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please upload a valid image file.');
      return;
    }
    setError(null);
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setImageUrl(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handlePresetSelect = (preset: typeof REPORT_IMAGE_PRESETS[0]) => {
    setImageUrl(preset.img);
    setDescription((prev) => prev || preset.description); // Auto-fills if empty
  };

  const triggerTriageAndSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isDescriptionValid) {
      setError('Description must be between 1 and 500 characters.');
      return;
    }
    if (!imageUrl) {
      setError('A photo is strictly required to verify the infrastructure failure.');
      return;
    }

    setLoading(true);
    setError(null);
    setTriageDetails(null);

    try {
      // Direct call to our backend Gemini API proxy endpoint
      const triageRes = await fetch('/api/triage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          report_text: description,
          building_tag: building,
          image_present: true,
          image_payload: imageUrl // pass base64 or source url
        })
      });

      if (!triageRes.ok) {
        throw new Error('Triage endpoint response failed.');
      }

      const parsedTriageResult = await triageRes.json();
      setTriageDetails(parsedTriageResult);

      // Create new report state entry locally
      await onSubmitReport({
        image_payload: imageUrl,
        description: description,
        building_tag: building,
        category: parsedTriageResult.category,
        priority: parsedTriageResult.priority,
        reasoning: parsedTriageResult.reasoning,
        status_state: 'Pending'
      });

      // Reset form variables upon successful submission
      setDescription('');
      setImageUrl('');
    } catch (err: any) {
      console.error(err);
      setError('AI Triage pipeline broke. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="report-form-container" className="bg-surface-card rounded-card border border-border-divider p-6 shadow-card">
      <div className="mb-5 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-ink-primary">📢 Report campus issue</h2>
          <p className="text-xs text-text-secondary mt-1">
            Capture or choose a photo, specify location, and our Gemini AI Agent will automatically triage category and routing path.
          </p>
        </div>
        <div className="flex items-center gap-1.5 bg-primary-blue-tint/60 text-primary-blue text-xs font-semibold px-3 py-1.5 rounded-badge uppercase select-none">
          <Sparkles className="w-3.5 h-3.5 animate-spin-slow" />
          Powered by Gemini 3.5
        </div>
      </div>

      <form onSubmit={triggerTriageAndSubmit} className="space-y-4">
        {/* Step 1: Photo Upload Component */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary mb-2">
            1. Evidence Image <span className="text-critical-red">*</span>
          </label>
          
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            {/* Drag & Drop Canvas */}
            <div
              id="file-drop-target"
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`md:col-span-3 border-2 border-dashed w-[630px] rounded-lg p-5 flex flex-col items-center justify-center text-center cursor-pointer min-h-[250px] transition-all duration-200 ${
                isDragging 
                  ? 'border-primary-blue bg-primary-blue-tint/30' 
                  : imageUrl 
                    ? 'border-success-green/60 bg-success-tint/20' 
                    : 'border-border-divider hover:border-primary-blue hover:bg-neutral-50'
              }`}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
              />
              {imageUrl ? (
                <div className="relative w-full h-[120px] flex items-center justify-center">
                  <img
                    src={imageUrl}
                    alt="Upload Preview"
                    className="h-full object-cover rounded-md"
                  />
                  <div className="absolute top-1 right-1 bg-success-green text-white p-1 rounded-full shadow-md">
                    <Check className="w-3 h-3" />
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setImageUrl('');
                    }}
                    className="absolute bottom-1 right-1 bg-critical-red text-white text-[10px] px-2 py-0.5 rounded shadow hover:bg-opacity-95"
                  >
                    Change
                  </button>
                </div>
              ) : (
                <>
                  <div className="h-10 w-10 rounded-full bg-primary-blue-tint flex items-center justify-center text-primary-blue mb-2 shadow-sm">
                    <Camera className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-semibold text-ink-primary">
                    Drag photo here or <span className="text-primary-blue">browse locally</span>
                  </p>
                  <p className="text-[11px] text-text-secondary mt-1">
                    Supports high-resolution camera uploads or screenshots
                  </p>
                </>
              )}
            </div>

            {/* Quick Presets Sidepanel (Crucial for convenient review!) */}
            {/* <div className="md:col-span-2 flex flex-col justify-between border border-border-divider rounded-lg p-3 bg-neutral-50">
              <span className="text-[11px] font-bold uppercase tracking-wider text-text-secondary block mb-1.5 select-none">
                💡 Demo Quick-Select
              </span>
              <div className="grid grid-cols-2 gap-1.5 flex-1">
                {REPORT_IMAGE_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    id={`preset-btn-${preset.id}`}
                    type="button"
                    onClick={() => handlePresetSelect(preset)}
                    className="group border border-border-divider rounded-md overflow-hidden text-left hover:border-primary-blue transition transition-all p-1 bg-white hover:shadow-sm"
                  >
                    <div className="relative h-10 bg-neutral-100 rounded overflow-hidden">
                      <img
                        src={preset.img}
                        alt={preset.label}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <span className="text-[10px] font-semibold text-ink-primary line-clamp-1 block mt-1 select-none">
                      {preset.label}
                    </span>
                  </button>
                ))}
              </div>
            </div> */}
          </div>
        </div>

        {/* Step 2: Location and Description Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-1">
            <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary mb-1.5">
              2. Building Tag <span className="text-critical-red">*</span>
            </label>
            <select
              id="report-building-select"
              value={building}
              onChange={(e) => setBuilding(e.target.value)}
              className="w-full border border-border-divider rounded-lg px-3 py-2 bg-white text-sm text-ink-primary font-medium focus:border-primary-blue focus:outline-none focus:ring-2 focus:ring-primary-blue/10 min-h-[40px] cursor-pointer"
            >
              {CAMPUS_BUILDINGS.map((b) => (
                <option key={b} value={b}>
                  🏢 {b}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <div className="flex justify-between mb-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary">
                3. Issue Description <span className="text-critical-red">*</span>
              </label>
              <span className={`text-[10px] font-semibold ${description.length > 500 ? 'text-critical-red' : 'text-text-secondary'}`}>
                {description.length}/500 chars
              </span>
            </div>
            <textarea
              id="report-description-input"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={520}
              placeholder="e.g. Broken faucet spilling water on ground floor Hostel B Canteen. Slippery and dangerous..."
              rows={2}
              className="w-full border border-border-divider rounded-lg px-3 py-2 text-sm text-ink-primary placeholder-[#999] bg-white focus:border-primary-blue focus:outline-none focus:ring-2 focus:ring-primary-blue/10 min-h-[40px]"
            />
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 bg-critical-tint/50 text-critical-red p-3 rounded-lg text-xs font-medium">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Dynamic AI Triage Logs Panel */}
        {triageDetails && (
          <div className="bg-[#FAF5FF] border border-purple-200 rounded-lg p-3.5 space-y-2 text-xs">
            <div className="flex items-center justify-between text-[#6B21A8] font-bold">
              <span className="flex items-center gap-1.5 select-none">
                <Sparkles className="w-4 h-4 text-purple-600 animate-pulse" />
                Gemini AI Real-time Classification Resolved!
              </span>
              <span className="bg-purple-100 px-2 py-0.5 rounded text-[10px]">SUCCESS</span>
            </div>
            <div className="grid grid-cols-2 gap-3 text-ink-primary font-medium">
              <div>
                <span className="text-[10px] text-text-secondary uppercase tracking-wider block select-none">Category Routed</span>
                <span className="bg-white border px-2 py-1 rounded inline-block mt-1 font-mono text-xs">{triageDetails.category}</span>
              </div>
              <div>
                <span className="text-[10px] text-text-secondary uppercase tracking-wider block select-none">Primary Urgency Level</span>
                <span className="bg-white border px-2 py-1 rounded inline-block mt-1 font-mono text-xs">{triageDetails.priority}</span>
              </div>
            </div>
            <p className="text-text-secondary leading-relaxed bg-white border p-2 rounded italic font-mono text-[11px] mt-2">
              <strong>Reasoning:</strong> {triageDetails.reasoning}
            </p>
          </div>
        )}

        {/* Submit Buttons */}
        <div className="flex items-center gap-2 pt-2 border-t border-border-divider">
          <button
            id="report-submit-btn"
            type="submit"
            disabled={loading || !isDescriptionValid || !imageUrl}
            className={`flex-1 text-white py-2.5 px-4 rounded-btn font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-primary-blue-dark/20 cursor-pointer ${
              loading 
                ? 'bg-primary-blue-dark/70 cursor-not-allowed' 
                : (!isDescriptionValid || !imageUrl)
                  ? 'bg-gray-300 cursor-not-allowed text-gray-500' 
                  : 'bg-primary-blue hover:bg-primary-blue-dark active:scale-[0.99]'
            }`}
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Consulting server-side AI model...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Submit Report & Triage
              </>
            )}
          </button>
          
          <button
            id="reset-form-btn"
            type="button"
            onClick={() => {
              setDescription('');
              setImageUrl('');
              setError(null);
              setTriageDetails(null);
            }}
            className="border border-[#CBD5E1] bg-white text-text-secondary hover:text-ink-primary font-semibold text-sm px-4 py-2.5 rounded-btn hover:bg-neutral-50 transition cursor-pointer"
          >
            Reset
          </button>
        </div>
      </form>
    </div>
  );
}

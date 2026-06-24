/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type Category = 'Infrastructure' | 'Canteen & Hygiene' | 'Safety' | 'Connectivity';
export type Priority = 'Low' | 'Medium' | 'High';
export type StatusState = 'Pending' | 'In Progress' | 'Resolved';

export interface CampusReport {
  report_id: string;
  image_payload: string; // Base64 string or mock image url/placeholder
  description: string;
  building_tag: string;
  category: Category;
  priority: Priority;
  status_state: StatusState;
  cluster_flag: boolean;
  created_at: number; // Unix epoch milliseconds
}

export const CAMPUS_BUILDINGS = [
  "Hostel A",
  "Hostel B",
  "Tech Block",
  "Canteen",
  "Library",
  "Science Lab",
  "Main Auditorium"
];

export const CATEGORIES: Category[] = [
  'Infrastructure',
  'Canteen & Hygiene',
  'Safety',
  'Connectivity'
];

export const CATEGORY_COLORS: Record<Category, string> = {
  'Infrastructure': '#5B7FBF',
  'Canteen & Hygiene': '#C77B3F',
  'Safety': '#A8434F',
  'Connectivity': '#4F9B8C'
};

export const PRIORITY_COLORS: Record<Priority, { text: string; bg: string; dot: string }> = {
  'Low': { text: '#2E9E5B', bg: '#E8F5EC', dot: '#2E9E5B' },
  'Medium': { text: '#E2A33D', bg: '#FBF0DC', dot: '#E2A33D' },
  'High': { text: '#D44C3F', bg: '#FBE4E1', dot: '#D44C3F' }
};

export const STATUS_COLORS: Record<StatusState, { text: string; bg: string }> = {
  'Pending': { text: '#1F5C99', bg: '#DCE9F2' },
  'In Progress': { text: '#E2A33D', bg: '#FBF0DC' },
  'Resolved': { text: '#2E9E5B', bg: '#E8F5EC' }
};

// Seed initial reports for robust demonstration
export const INITIAL_REPORTS: CampusReport[] = [
  {
    report_id: "rep-001",
    image_payload: "https://images.unsplash.com/photo-1585842371054-2a7b4504a5e3?auto=format&fit=crop&w=600&q=80", // water cooler dripping
    description: "Water cooler on 2nd floor Hostel B dripping continuously and creating a slip hazard.",
    building_tag: "Hostel B",
    category: "Infrastructure",
    priority: "Medium",
    status_state: "In Progress",
    cluster_flag: false,
    created_at: Date.now() - 3600000 * 24 * 2 // 2 days ago
  },
  {
    report_id: "rep-002",
    image_payload: "https://images.unsplash.com/photo-1544725176-7c40e5a71c5e?auto=format&fit=crop&w=600&q=80", // wifi router dead
    description: "Vite WiFi router under floor 1 lobby has no signal. Unable to connect.",
    building_tag: "Tech Block",
    category: "Connectivity",
    priority: "Medium",
    status_state: "Pending",
    cluster_flag: false,
    created_at: Date.now() - 3600000 * 5 // 5 hours ago
  },
  {
    report_id: "rep-003",
    image_payload: "https://images.unsplash.com/photo-1595113316349-9fa4ee24f884?auto=format&fit=crop&w=600&q=80", // broken tile
    description: "Cracked flooring Tiles in Block Canteen causing trip hazards right in front of the main counter.",
    building_tag: "Canteen",
    category: "Canteen & Hygiene",
    priority: "High",
    status_state: "Resolved",
    cluster_flag: false,
    created_at: Date.now() - 3600000 * 48 // 48 hours ago
  },
  {
    report_id: "rep-004",
    image_payload: "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=600&q=80", // flickering light
    description: "Corridor light flickers violently on floor 3, causing headaches and poor visibility near room 302.",
    building_tag: "Hostel A",
    category: "Infrastructure",
    priority: "Low",
    status_state: "Pending",
    cluster_flag: false,
    created_at: Date.now() - 3600000 * 1.5 // 1.5 hours ago
  },
  {
    report_id: "rep-005",
    image_payload: "https://images.unsplash.com/photo-1547082299-de196ea013d6?auto=format&fit=crop&w=600&q=80", // smoke detector chirping
    description: "Smoke detector chirping continuously at Hostel A first floor stairwell. Battery low.",
    building_tag: "Hostel A",
    category: "Safety",
    priority: "Low",
    status_state: "Pending",
    cluster_flag: false,
    created_at: Date.now() - 3600000 * 1.2 // 1.2 hours ago
  }
];

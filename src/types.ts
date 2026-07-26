export interface BarangayData {
  id: string;
  name: string;
  casualties: number;
  affectedFamilies: number;
  damagedHouses: number;
  priorityScore: number;
  normalizedCasualties: number;
  normalizedFamilies: number;
  normalizedHouses: number;
  rank: number;
  disaster?: string;
  lastUpdated?: number;
}

export type UrgencyLevel = 'Highest' | 'Urgent' | 'Moderate' | 'Low';

export interface DashboardStats {
  totalFamilies: number;
  totalCasualties: number;
  totalDamagedHouses: number;
  totalAssessed: number;
  highestPriorityName: string;
}

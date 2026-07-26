import { BarangayData } from './types';

export const calculateWSM = (data: BarangayData[]): BarangayData[] => {
  if (data.length === 0) return [];

  // Group by disaster
  const groups: Record<string, BarangayData[]> = {};
  data.forEach(item => {
    const d = item.disaster || 'Default';
    if (!groups[d]) groups[d] = [];
    groups[d].push(item);
  });

  const results: BarangayData[] = [];
  const w1 = 1 / 3;
  const w2 = 1 / 3;
  const w3 = 1 / 3;

  Object.values(groups).forEach(groupData => {
    // Find min & max for normalization within group
    const casualties = groupData.map(d => d.casualties);
    const families = groupData.map(d => d.affectedFamilies);
    const houses = groupData.map(d => d.damagedHouses);

    const minC = Math.min(...casualties);
    const maxC = Math.max(...casualties);

    const minF = Math.min(...families);
    const maxF = Math.max(...families);

    const minH = Math.min(...houses);
    const maxH = Math.max(...houses);

    // Calculate normalized values and priority scores
    const processedGroup = groupData.map(item => {
      // If not assessed (no lastUpdated), return 0s
      if (!item.lastUpdated && item.casualties === 0 && item.affectedFamilies === 0 && item.damagedHouses === 0) {
        return {
          ...item,
          normalizedCasualties: 0,
          normalizedFamilies: 0,
          normalizedHouses: 0,
          priorityScore: 0
        };
      }

      // Exact Python logic: (value - min) / (max - min), 0.0 if min == max
      const normCasualties = maxC === minC ? 0.0 : (item.casualties - minC) / (maxC - minC);
      const normFamilies = maxF === minF ? 0.0 : (item.affectedFamilies - minF) / (maxF - minF);
      const normHouses = maxH === minH ? 0.0 : (item.damagedHouses - minH) / (maxH - minH);

      // Score = w1 * norm_families + w2 * norm_casualties + w3 * norm_damaged
      const priorityScore = w1 * normFamilies + w2 * normCasualties + w3 * normHouses;

      return {
        ...item,
        normalizedCasualties: normCasualties,
        normalizedFamilies: normFamilies,
        normalizedHouses: normHouses,
        priorityScore
      };
    });

    // Rank within group descending by score
    const rankedGroup = processedGroup
      .sort((a, b) => b.priorityScore - a.priorityScore || b.casualties - a.casualties)
      .map((item, index) => ({
        ...item,
        rank: index + 1
      }));
    
    results.push(...rankedGroup);
  });

  return results;
};

export const getUrgencyLevel = (score: number): { label: string; color: string; bg: string } => {
  if (score >= 0.7) return { label: 'Highest', color: 'text-red-600', bg: 'bg-red-50' };
  if (score >= 0.4) return { label: 'Urgent', color: 'text-orange-500', bg: 'bg-orange-50' };
  if (score >= 0.1) return { label: 'Moderate', color: 'text-blue-500', bg: 'bg-blue-50' };
  return { label: 'Low', color: 'text-slate-400', bg: 'bg-slate-50' };
};

export const getRecommendation = (score: number): string => {
  if (score >= 0.7) return "Immediate response (within 24 hours)";
  if (score >= 0.4) return "Urgent (24–48 hours)";
  if (score >= 0.1) return "Scheduled (2–3 days)";
  return "Monitoring / delayed response";
};


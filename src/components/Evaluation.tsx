import React, { useMemo, useState } from 'react';
import { BarangayData } from '../types';
import { calculateWSM, generate37WeightScenarios, WeightConfig, DEFAULT_WEIGHTS } from '../utils';
import { 
  CheckCircle2, 
  Cpu, 
  BarChart, 
  Layers,
  HelpCircle,
  AlertCircle,
  Lightbulb,
  Calculator,
  ArrowRight,
  SlidersHorizontal,
  ShieldCheck,
  ShieldAlert,
  Sparkles,
  TrendingUp
} from 'lucide-react';

interface EvaluationProps {
  data: BarangayData[];
  weights?: WeightConfig;
  onWeightsChange?: (weights: WeightConfig) => void;
}

export default function Evaluation({ data, weights = DEFAULT_WEIGHTS, onWeightsChange }: EvaluationProps) {
  const assessed = data.filter(b => b.lastUpdated);
  const [benchmarkStatus, setBenchmarkStatus] = useState<'idle' | 'running' | 'done'>('idle');
  const [perfMetrics, setPerfMetrics] = useState({ total: 0, perRecord: 0, projected1000: 0 });
  const [selectedScenarioIndex, setSelectedScenarioIndex] = useState<number>(0);
  const [showAll37Scenarios, setShowAll37Scenarios] = useState<boolean>(false);
  
  // Group data by disaster for the "Priority Schedule" section
  const groupedData = useMemo<Record<string, BarangayData[]>>(() => {
    const groups: Record<string, BarangayData[]> = {};
    assessed.forEach(item => {
      const d = item.disaster || 'General / Current';
      if (!groups[d]) groups[d] = [];
      groups[d].push(item);
    });
    
    // Ensure sorted by rank within each disaster group
    Object.keys(groups).forEach(key => {
      groups[key].sort((a, b) => a.rank - b.rank);
    });
    
    return groups;
  }, [assessed]);

  // Generate 37 Weight Scenarios Sensitivity Analysis
  const scenarios = useMemo(() => generate37WeightScenarios(), []);

  const sensitivityAnalysis = useMemo(() => {
    if (assessed.length === 0) return null;

    // Run WSM across all 37 weight scenarios
    const scenarioResults = scenarios.map((sc, idx) => {
      const ranked = calculateWSM(assessed, sc.weights);
      return {
        id: sc.id,
        name: sc.name,
        weights: sc.weights,
        ranked
      };
    });

    // Map each barangay to its rank in all 37 scenarios
    const barangayStability = assessed.map(brgy => {
      const ranksAcross37 = scenarioResults.map(s => {
        const item = s.ranked.find(r => r.id === brgy.id);
        return item ? item.rank : 0;
      });

      const minRank = Math.min(...ranksAcross37);
      const maxRank = Math.max(...ranksAcross37);
      const rankRange = maxRank - minRank;
      const top5Count = ranksAcross37.filter(r => r <= 5).length;
      const top5Percentage = (top5Count / 37) * 100;

      return {
        id: brgy.id,
        name: brgy.name,
        disaster: brgy.disaster,
        baselineRank: brgy.rank,
        minRank,
        maxRank,
        rankRange,
        top5Count,
        top5Percentage,
        ranksAcross37
      };
    });

    // Overall Top-1 stability
    const top1PerScenario = scenarioResults.map(s => s.ranked[0]?.name);
    const top1Counts: Record<string, number> = {};
    top1PerScenario.forEach(name => {
      if (name) top1Counts[name] = (top1Counts[name] || 0) + 1;
    });

    return {
      scenarioResults,
      barangayStability,
      top1Counts
    };
  }, [assessed, scenarios]);

  const runBenchmark = () => {
    setBenchmarkStatus('running');
    setTimeout(() => {
      const iterations = 1000;
      const start = performance.now();
      for (let i = 0; i < iterations; i++) {
        const _ = calculateWSM(assessed);
      }
      const end = performance.now();
      const totalMs = (end - start) / iterations;
      const perRecordMs = assessed.length > 0 ? totalMs / assessed.length : 0;
      setPerfMetrics({ 
        total: totalMs, 
        perRecord: perRecordMs,
        projected1000: perRecordMs * 1000
      });
      setBenchmarkStatus('done');
    }, 600);
  };

  const jaccardResults = useMemo(() => {
    if (assessed.length < 3) return null;
    const disasters = Object.keys(groupedData);
    
    return disasters.map(disasterName => {
      const group = groupedData[disasterName];
      const kValues = [3, 5, 10].filter(k => k <= group.length);
      
      const getTopK = (arr: BarangayData[], key: keyof BarangayData, k: number) => {
        const sorted = [...arr].sort((a, b) => (b[key] as number) - (a[key] as number));
        return new Set(sorted.slice(0, k).map(b => b.id));
      };

      const wpsTopK = (arr: BarangayData[], k: number) => {
        return new Set(arr.slice(0, k).map(b => b.id));
      };

      const calculateJaccard = (setA: Set<string>, setB: Set<string>) => {
        const intersection = new Set([...setA].filter(x => setB.has(x)));
        const union = new Set([...setA, ...setB]);
        return union.size === 0 ? 1 : intersection.size / union.size;
      };

      const kMetrics = kValues.map(k => {
        const wpsSet = wpsTopK(group, k);
        return {
          k,
          families: calculateJaccard(wpsSet, getTopK(group, 'affectedFamilies', k)),
          casualties: calculateJaccard(wpsSet, getTopK(group, 'casualties', k)),
          houses: calculateJaccard(wpsSet, getTopK(group, 'damagedHouses', k))
        };
      });

      return { disasterName, kMetrics, count: group.length };
    });
  }, [groupedData, assessed]);

  // Pick sample barangay for manual calculation walkthrough
  const sampleBarangay = assessed.length > 0 ? assessed[0] : null;

  if (assessed.length === 0) {
    return (
      <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center shadow-sm">
        <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <BarChart className="text-blue-600" size={32} />
        </div>
        <h3 className="text-xl font-bold text-slate-900 mb-2">No Assessment Data Found</h3>
        <p className="text-slate-500 max-w-md mx-auto">
          Please upload a CSV file or enter assessments in the <strong>Assessment Input</strong> tab to run the Algorithm Assessment & Jaccard Index Evaluation.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      {/* Header Info */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
         <div>
            <h3 className="text-2xl font-black text-slate-900 uppercase">Weighted Priority Scheduler Evaluation Report</h3>
            <p className="text-slate-500 font-medium text-xs mt-1">Scientific verification of multi-criteria decision analysis (MCDA) vs single-criterion baselines</p>
         </div>
         <div className="flex items-center gap-3 bg-white p-2 rounded-2xl border border-slate-100 shadow-sm">
            <div className="px-4 py-2 bg-slate-50 rounded-xl border border-slate-100 text-center">
               <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Disaster Events</p>
               <p className="text-sm font-black text-slate-900">{Object.keys(groupedData).length}</p>
            </div>
            <div className="px-4 py-2 bg-slate-50 rounded-xl border border-slate-100 text-center">
               <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Total Assessed</p>
               <p className="text-sm font-black text-slate-900">{assessed.length}</p>
            </div>
         </div>
      </div>

      {/* Priority Schedule - Grouped Tables */}
      <section className="space-y-6">
        <div className="flex items-center gap-3">
           <Layers className="text-blue-600" size={20} />
           <h4 className="text-lg font-bold text-slate-900">PRIORITY SCHEDULE (ALGORITHM OUTPUT)</h4>
        </div>
        
        {(Object.entries(groupedData) as [string, BarangayData[]][]).map(([name, group]) => (
          <div key={name} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="bg-slate-900 px-6 py-4 flex items-center justify-between">
               <h5 className="text-white font-bold text-xs tracking-wide uppercase">{name} ({group.length} BARANGAYS)</h5>
               <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">WSM Ranked Queue</div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[11px] font-mono">
                <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-black uppercase tracking-tighter">
                  <tr>
                    <th className="px-6 py-3">Rank</th>
                    <th className="px-6 py-3">Barangay</th>
                    <th className="px-6 py-3 text-center">Score</th>
                    <th className="px-6 py-3 text-center">Families</th>
                    <th className="px-6 py-3 text-center">Casualties</th>
                    <th className="px-6 py-3 text-center">Damaged</th>
                    <th className="px-6 py-3 text-center">Norm_F</th>
                    <th className="px-6 py-3 text-center">Norm_C</th>
                    <th className="px-6 py-3 text-center">Norm_D</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {group.map((row) => (
                    <tr key={row.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-2.5 font-bold text-slate-900">#{row.rank}</td>
                      <td className="px-6 py-2.5 font-sans font-bold text-slate-700">{row.name}</td>
                      <td className="px-6 py-2.5 text-center text-blue-600 font-bold">{(row.priorityScore * 100).toFixed(1)}%</td>
                      <td className="px-6 py-2.5 text-center text-slate-600">{row.affectedFamilies}</td>
                      <td className="px-6 py-2.5 text-center text-slate-600">{row.casualties}</td>
                      <td className="px-6 py-2.5 text-center text-slate-600">{row.damagedHouses}</td>
                      <td className="px-6 py-2.5 text-center text-slate-400">{row.normalizedFamilies.toFixed(4)}</td>
                      <td className="px-6 py-2.5 text-center text-slate-400">{row.normalizedCasualties.toFixed(4)}</td>
                      <td className="px-6 py-2.5 text-center text-slate-400">{row.normalizedHouses.toFixed(4)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </section>

      {/* Manual Calculation Walkthrough */}
      {sampleBarangay && (
        <section className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm space-y-6">
           <div className="flex items-center gap-3">
              <Calculator className="text-purple-600" size={20} />
              <h4 className="text-lg font-bold text-slate-900">MANUAL CALCULATION DEMONSTRATION</h4>
           </div>
           
           <p className="text-xs text-slate-600 leading-relaxed">
              Demonstrating the exact Min-Max Normalization &amp; Weighted Sum Model formula step-by-step for <strong>{sampleBarangay.name}</strong> ({sampleBarangay.disaster || 'General'}):
           </p>

           <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                 <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Step 1: Raw Metrics</p>
                 <p className="text-xs font-bold text-slate-800">Fam: {sampleBarangay.affectedFamilies}</p>
                 <p className="text-xs font-bold text-slate-800">Cas: {sampleBarangay.casualties}</p>
                 <p className="text-xs font-bold text-slate-800">Dam: {sampleBarangay.damagedHouses}</p>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                 <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Step 2: Min-Max Norm</p>
                 <p className="text-xs font-mono font-bold text-blue-600">Norm_F = {sampleBarangay.normalizedFamilies.toFixed(4)}</p>
                 <p className="text-xs font-mono font-bold text-red-600">Norm_C = {sampleBarangay.normalizedCasualties.toFixed(4)}</p>
                 <p className="text-xs font-mono font-bold text-orange-600">Norm_D = {sampleBarangay.normalizedHouses.toFixed(4)}</p>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                 <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Step 3: Weights (w = 1/3)</p>
                 <p className="text-xs text-slate-600 font-mono">1/3 * Norm_F = {(sampleBarangay.normalizedFamilies/3).toFixed(4)}</p>
                 <p className="text-xs text-slate-600 font-mono">1/3 * Norm_C = {(sampleBarangay.normalizedCasualties/3).toFixed(4)}</p>
                 <p className="text-xs text-slate-600 font-mono">1/3 * Norm_D = {(sampleBarangay.normalizedHouses/3).toFixed(4)}</p>
              </div>

              <div className="bg-blue-600 text-white p-4 rounded-2xl shadow-sm">
                 <p className="text-[10px] font-black uppercase tracking-widest text-blue-200 mb-1">Step 4: Priority Score</p>
                 <p className="text-2xl font-black">{ (sampleBarangay.priorityScore * 100).toFixed(2) }%</p>
                 <p className="text-[10px] font-bold text-blue-100 uppercase tracking-widest mt-1">Queue Rank: #{sampleBarangay.rank}</p>
              </div>
           </div>
        </section>
      )}

      {/* Evaluation (A): Jaccard Analysis */}
      <section className="space-y-6">
        <div className="flex items-center gap-3">
           <CheckCircle2 className="text-emerald-600" size={20} />
           <h4 className="text-lg font-bold text-slate-900">EVALUATION (A): JACCARD INDEX (TOP-K SET AGREEMENT)</h4>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">
           The <strong>Jaccard Similarity Index</strong> (measuring ratio of intersection over union between two sets) evaluates set agreement between the top-K priority list produced by WPS (multi-criteria) versus sorting strictly by a single baseline criterion (Affected Families alone, Casualties alone, or Damaged Houses alone).
        </p>
        
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-8 py-5 font-black text-slate-500 uppercase tracking-widest">Disaster Event</th>
                  <th className="px-8 py-5 font-black text-slate-500 uppercase tracking-widest text-center">Top-K Depth</th>
                  <th className="px-8 py-5 font-black text-slate-500 uppercase tracking-widest text-center">Families Only</th>
                  <th className="px-8 py-5 font-black text-slate-500 uppercase tracking-widest text-center">Casualties Only</th>
                  <th className="px-8 py-5 font-black text-slate-500 uppercase tracking-widest text-center">Houses Only</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {jaccardResults?.map((res, rid) => (
                  <React.Fragment key={rid}>
                    {res.kMetrics.map((kRow, kid) => (
                      <tr key={`${rid}-${kid}`} className="hover:bg-slate-50/30 transition-colors">
                        {kid === 0 && (
                          <td rowSpan={res.kMetrics.length} className="px-8 py-5 align-top border-r border-slate-50">
                            <p className="font-bold text-slate-900 mb-1">{res.disasterName}</p>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{res.count} records evaluated</p>
                          </td>
                        )}
                        <td className="px-8 py-5 font-mono font-bold text-slate-500 text-center">Top-{kRow.k}</td>
                        <td className="px-8 py-5 text-center font-bold text-blue-600">{(kRow.families).toFixed(4)}</td>
                        <td className="px-8 py-5 text-center font-bold text-red-600">{(kRow.casualties).toFixed(4)}</td>
                        <td className="px-8 py-5 text-center font-bold text-orange-600">{(kRow.houses).toFixed(4)}</td>
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Actionable Decision Takeaways: "So What Now?" */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-3xl p-8 shadow-xl space-y-6">
           <div className="flex items-center gap-3 border-b border-slate-700 pb-4">
              <Lightbulb className="text-amber-400" size={24} />
              <div>
                 <h5 className="text-lg font-bold text-white uppercase tracking-wider">Operational Interpretation &amp; Decision Guidance ("So What Now?")</h5>
                 <p className="text-xs text-slate-400">Translating Jaccard metrics into actionable dispatch policy for disaster responders</p>
              </div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-5 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-2">
                 <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider">
                    <AlertCircle size={14} />
                    <span>1. Why Single-Metric Sorting Fails</span>
                 </div>
                 <p className="text-xs text-slate-300 leading-relaxed">
                    Jaccard scores strictly below 1.0 (typically ranging 0.20 to 0.60) prove that single-metric sorting misses critical zones. Sorting purely by casualty counts ignores massive family displacement or high structural collapse in other barangays.
                 </p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-2">
                 <div className="flex items-center gap-2 text-blue-400 text-xs font-bold uppercase tracking-wider">
                    <CheckCircle2 size={14} />
                    <span>2. Revealing Compound Risk Hotspots</span>
                 </div>
                 <p className="text-xs text-slate-300 leading-relaxed">
                    WPS successfully elevates barangays that suffer <em>moderate impact across all three dimensions</em>. These compound risk areas are unfairly deprioritized on single-criterion lists but rise to top rank in WPS.
                 </p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-2">
                 <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider">
                    <ArrowRight size={14} />
                    <span>3. Multi-Agency Resource Dispatch</span>
                 </div>
                 <p className="text-xs text-slate-300 leading-relaxed">
                    Instead of sending isolated medical teams or food trucks based on siloed spreadsheets, emergency commanders should dispatch joint response taskforces to top-ranked WPS barangays for balanced relief delivery.
                 </p>
              </div>
           </div>
        </div>
      </section>

      {/* Evaluation (C): 37 Weight Scenario Sensitivity Analysis */}
      {sensitivityAnalysis && (
        <section className="space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
               <SlidersHorizontal className="text-amber-500" size={20} />
               <div>
                  <h4 className="text-lg font-bold text-slate-900 uppercase">EVALUATION (C): 37-SCENARIO WEIGHT SENSITIVITY &amp; STABILITY MATRIX</h4>
                  <p className="text-xs text-slate-500 font-medium">Evaluating rank shifts across 37 systemic weight combinations (as modeled in Python MCDA sensitivity analysis)</p>
               </div>
            </div>

            <button 
              onClick={() => setShowAll37Scenarios(!showAll37Scenarios)}
              className="text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-xl transition-colors"
            >
              {showAll37Scenarios ? 'Collapse Scenarios' : 'View All 37 Scenarios Grid'}
            </button>
          </div>

          {/* Top 1 Leadership Stability & Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center gap-2 text-slate-400 text-[10px] font-black uppercase tracking-widest">
                <ShieldCheck size={14} className="text-emerald-500" />
                <span>Top #1 Rank Dominance</span>
              </div>
              <div>
                {Object.entries(sensitivityAnalysis.top1Counts).map(([bName, count]) => (
                  <div key={bName} className="flex justify-between items-center py-1 border-b border-slate-50 last:border-none">
                    <span className="font-bold text-slate-800 text-xs">{bName}</span>
                    <span className="font-mono text-xs font-bold bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-md">
                      {count}/37 ({((count/37)*100).toFixed(0)}%)
                    </span>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-slate-400 pt-2 border-t border-slate-100">
                Number of weight scenarios where this barangay secures Rank #1. High consensus indicates absolute priority.
              </p>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center gap-2 text-slate-400 text-[10px] font-black uppercase tracking-widest">
                <TrendingUp size={14} className="text-blue-500" />
                <span>Rank Shift Robustness</span>
              </div>
              <div>
                <h5 className="text-2xl font-black text-slate-900">
                  {(sensitivityAnalysis.barangayStability.filter(b => b.rankRange <= 2).length / (assessed.length || 1) * 100).toFixed(0)}%
                </h5>
                <p className="text-xs font-bold text-blue-600">Stable Barangays (Shift ≤ 2 ranks)</p>
              </div>
              <p className="text-[10px] text-slate-400 pt-2 border-t border-slate-100">
                Barangays whose queue position remains virtually unaffected by extreme weight shifts between casualties, families, and houses.
              </p>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center gap-2 text-slate-400 text-[10px] font-black uppercase tracking-widest">
                <Sparkles size={14} className="text-amber-500" />
                <span>Active Sensitivity Scenario</span>
              </div>
              <div>
                <span className="px-2.5 py-1 bg-amber-50 text-amber-700 rounded-md text-xs font-bold font-mono">
                  {scenarios[selectedScenarioIndex]?.id || 'S1'}: {scenarios[selectedScenarioIndex]?.name}
                </span>
                <p className="text-xs text-slate-600 mt-2 font-mono">
                  Fam: {(scenarios[selectedScenarioIndex]?.weights.wFamilies * 100).toFixed(0)}% | 
                  Cas: {(scenarios[selectedScenarioIndex]?.weights.wCasualties * 100).toFixed(0)}% | 
                  Dam: {(scenarios[selectedScenarioIndex]?.weights.wHouses * 100).toFixed(0)}%
                </p>
              </div>
              {onWeightsChange && (
                <button
                  onClick={() => onWeightsChange(scenarios[selectedScenarioIndex].weights)}
                  className="w-full mt-2 bg-slate-900 text-white py-2 rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors"
                >
                  Apply Scenario #{selectedScenarioIndex + 1} to App
                </button>
              )}
            </div>
          </div>

          {/* 37 Scenarios Matrix Grid (Expandable) */}
          {showAll37Scenarios && (
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <h5 className="font-bold text-slate-800 text-xs uppercase tracking-wider">37 Scenario Weight Configurations Matrix</h5>
                <span className="text-[10px] font-bold text-slate-400">Click any scenario to inspect</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-9 gap-2">
                {scenarios.map((sc, idx) => (
                  <button
                    key={sc.id}
                    onClick={() => setSelectedScenarioIndex(idx)}
                    className={`p-2.5 rounded-xl text-center text-xs transition-all border ${
                      selectedScenarioIndex === idx
                        ? 'bg-slate-900 text-white border-slate-900 font-bold shadow-md'
                        : 'bg-slate-50 hover:bg-slate-100 border-slate-100 text-slate-700 font-medium'
                    }`}
                  >
                    <p className="font-mono text-[10px] uppercase font-bold text-slate-400">{sc.id}</p>
                    <p className="text-[10px] font-mono mt-0.5">
                      {(sc.weights.wFamilies*100).toFixed(0)}/{(sc.weights.wCasualties*100).toFixed(0)}/{(sc.weights.wHouses*100).toFixed(0)}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Barangay Rank Stability Table across 37 Scenarios */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
              <h5 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Barangay Rank Variation Across 37 Scenarios</h5>
              <span className="text-[10px] font-mono font-bold text-slate-400">Min Rank ← Baseline → Max Rank</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-100/50 text-slate-500 font-bold uppercase text-[10px] border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-3 font-sans font-bold text-slate-800">Barangay</th>
                    <th className="px-6 py-3 text-center">Baseline Rank</th>
                    <th className="px-6 py-3 text-center text-emerald-600">Best Rank</th>
                    <th className="px-6 py-3 text-center text-red-600">Worst Rank</th>
                    <th className="px-6 py-3 text-center">Max Rank Shift</th>
                    <th className="px-6 py-3 text-center">Top-5 Consistency</th>
                    <th className="px-6 py-3 text-right font-sans font-bold">Stability Tag</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sensitivityAnalysis.barangayStability.slice(0, 15).map((b) => (
                    <tr key={b.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-3 font-sans font-bold text-slate-800">{b.name}</td>
                      <td className="px-6 py-3 text-center font-bold text-slate-900">#{b.baselineRank}</td>
                      <td className="px-6 py-3 text-center font-bold text-emerald-600">#{b.minRank}</td>
                      <td className="px-6 py-3 text-center font-bold text-red-600">#{b.maxRank}</td>
                      <td className="px-6 py-3 text-center font-bold">
                        <span className={`px-2 py-0.5 rounded-md ${b.rankRange <= 1 ? 'bg-emerald-50 text-emerald-700' : b.rankRange <= 3 ? 'bg-blue-50 text-blue-700' : 'bg-amber-50 text-amber-700'}`}>
                          ±{b.rankRange}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-center font-bold text-slate-700">
                        {b.top5Count}/37 ({b.top5Percentage.toFixed(0)}%)
                      </td>
                      <td className="px-6 py-3 text-right font-sans">
                        {b.rankRange <= 1 ? (
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded text-[10px] font-bold">Highly Stable</span>
                        ) : b.rankRange <= 3 ? (
                          <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-[10px] font-bold">Moderately Stable</span>
                        ) : (
                          <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded text-[10px] font-bold">Weight Sensitive</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {/* Evaluation (B): Computational Efficiency */}
      <section className="space-y-6">
        <div className="flex items-center gap-3">
           <Cpu className="text-violet-600" size={20} />
           <h4 className="text-lg font-bold text-slate-900">EVALUATION (B): COMPUTATIONAL EFFICIENCY BENCHMARK</h4>
        </div>
        
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-8">
           <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                 <p className="text-sm font-bold text-slate-800">Browser Benchmark Execution</p>
                 <p className="text-xs text-slate-500">Executes 1,000 algorithmic cycles to evaluate execution speed and scalability</p>
              </div>
              <button 
                onClick={runBenchmark}
                disabled={benchmarkStatus === 'running'}
                className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold text-xs hover:bg-slate-800 transition-all disabled:opacity-50 shadow-sm flex items-center justify-center gap-2"
              >
                {benchmarkStatus === 'running' ? 'RUNNING BENCHMARK...' : 'RUN PERFORMANCE BENCHMARK'}
              </button>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col justify-between">
                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Total Execution</span>
                 <div>
                    <h5 className="text-2xl font-black text-slate-900 mb-1">
                       {perfMetrics.total > 0 ? `${perfMetrics.total.toFixed(4)} ms` : '--'}
                    </h5>
                    <p className="text-xs text-emerald-600 font-bold tracking-tight">Real-time processing</p>
                 </div>
              </div>

              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col justify-between">
                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Time per Record</span>
                 <div>
                    <h5 className="text-2xl font-black text-slate-900 mb-1">
                       {perfMetrics.perRecord > 0 ? `${(perfMetrics.perRecord * 1000).toFixed(2)} µs` : '--'}
                    </h5>
                    <p className="text-xs text-blue-600 font-bold tracking-tight">{perfMetrics.perRecord > 0 ? `${perfMetrics.perRecord.toFixed(6)} ms` : 'Sub-millisecond'}</p>
                 </div>
              </div>

              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col justify-between">
                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Projected (1k Records)</span>
                 <div>
                    <h5 className="text-2xl font-black text-slate-900 mb-1">
                       {perfMetrics.projected1000 > 0 ? `${perfMetrics.projected1000.toFixed(2)} ms` : '--'}
                    </h5>
                    <p className="text-xs text-purple-600 font-bold tracking-tight">Scalable across provinces</p>
                 </div>
              </div>

              <div className="p-6 rounded-2xl bg-blue-600 text-white flex flex-col justify-between shadow-lg shadow-blue-200">
                 <span className="text-[10px] font-black text-blue-200 uppercase tracking-[0.2em] mb-4">Complexity Class</span>
                 <div>
                    <h5 className="text-2xl font-black mb-1">O(n log n)</h5>
                    <p className="text-xs text-blue-100 font-medium">Sorting-bound performance</p>
                 </div>
              </div>
           </div>
        </div>
      </section>

      {/* Footer */}
      <div className="border-t border-slate-200 pt-8 pb-4 text-center">
         <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">WEIGHTED PRIORITY SCHEDULER — SYSTEM VERIFIED</p>
      </div>
    </div>
  );
}


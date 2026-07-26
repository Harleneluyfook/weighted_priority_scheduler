import React, { useState, useMemo } from 'react';
import { 
  Search, 
  ArrowUpDown, 
  Filter, 
  Download,
  Info,
  Clock,
  ArrowRight,
  Users,
  Activity,
  ChevronDown,
  ChevronUp,
  Trash2,
  FileText
} from 'lucide-react';
import { BarangayData } from '../types';
import { getUrgencyLevel, getRecommendation } from '../utils';

interface PriorityQueueProps {
  barangays: BarangayData[];
  onRemove: (id: string) => void;
}

export default function PriorityQueue({ barangays, onRemove }: PriorityQueueProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'All' | 'Highest' | 'Urgent' | 'Moderate' | 'Low'>('All');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filteredData = useMemo(() => {
    return barangays
      .filter(b => b.name.toLowerCase().includes(searchTerm.toLowerCase()))
      .filter(b => {
        if (filter === 'All') return true;
        return getUrgencyLevel(b.priorityScore).label === filter;
      });
  }, [barangays, searchTerm, filter]);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const handleRemove = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to remove this assessment and reset it to zero?")) {
      onRemove(id);
    }
  };

  const activeCount = barangays.filter(b => b.priorityScore > 0).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
           <h3 className="text-2xl font-bold text-slate-900">Disaster Response Priority Queue</h3>
           <p className="text-gray-500">Live ranked list of all 128 Baguio barangays waiting for emergency resources.</p>
        </div>
        <div className="flex items-center gap-2">
           <button 
             className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-gray-50 transition-colors"
           >
             <Download size={16} />
             Export List
           </button>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white p-4 rounded-xl border border-gray-100 flex flex-col lg:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
           <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
           <input
             type="text"
             placeholder="Find barangay in queue..."
             className="w-full pl-11 pr-4 py-3 rounded-lg border border-gray-100 focus:outline-none focus:ring-2 focus:ring-slate-400 bg-gray-50"
             value={searchTerm}
             onChange={(e) => setSearchTerm(e.target.value)}
           />
        </div>
        <div className="flex items-center gap-2 w-full lg:w-auto overflow-x-auto pb-1 lg:pb-0 custom-scrollbar">
           <span className="text-xs font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap ml-2">Filter by Urgency:</span>
           {(['All', 'Highest', 'Urgent', 'Moderate', 'Low'] as const).map((level) => (
             <button
               key={level}
               onClick={() => setFilter(level)}
               className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap ${
                 filter === level 
                   ? 'bg-slate-900 text-white' 
                   : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
               }`}
             >
               {level}
             </button>
           ))}
        </div>
      </div>

      {/* Queue List Table */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 flex flex-col overflow-hidden">
        <div className="p-6 border-b border-slate-50 flex justify-between items-center">
          <h4 className="font-bold text-slate-800">Response Queue (WSM Ranked)</h4>
          <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black uppercase">Auto-Reranking On</span>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50/50 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Rank</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Barangay</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Score</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredData.length > 0 ? (
                filteredData.map((brgy) => {
                  const urgency = getUrgencyLevel(brgy.priorityScore);
                  const isAssessed = !!brgy.lastUpdated;
                  const isExpanded = expandedId === brgy.id;
                  
                  return (
                    <React.Fragment key={brgy.id}>
                      <tr 
                        className={`group hover:bg-slate-50/50 transition-colors cursor-pointer ${!isAssessed ? 'opacity-50' : ''} ${isExpanded ? 'bg-blue-50/10' : ''}`}
                        onClick={() => isAssessed && toggleExpand(brgy.id)}
                      >
                        <td className="px-6 py-4 align-middle">
                          <span className={`font-black ${isAssessed ? 'text-slate-900' : 'text-slate-400'}`}>#{brgy.rank}</span>
                        </td>
                        <td className="px-6 py-4 align-middle">
                          <div>
                            <p className="font-bold text-slate-800">{brgy.name}</p>
                            <div className="flex items-center gap-3 mt-1">
                              <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1 uppercase">
                                <Users size={10} /> {brgy.affectedFamilies} Families
                              </span>
                              <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1 uppercase">
                                <Activity size={10} /> {brgy.casualties} Casualties
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 align-middle">
                           <div className="flex justify-center">
                              <div className={`w-14 py-1.5 px-2 rounded-lg text-center font-black font-mono text-xs ${
                                isAssessed ? `${urgency.bg} ${urgency.color}` : 'bg-slate-50 text-slate-300'
                              }`}>
                                {isAssessed ? (brgy.priorityScore * 100).toFixed(1) + '%' : '0.0%'}
                              </div>
                           </div>
                        </td>
                        <td className="px-6 py-4 align-middle text-center">
                          {isAssessed ? (
                            <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider text-white ${
                              urgency.label === 'Highest' ? 'bg-red-600' :
                              urgency.label === 'Urgent' ? 'bg-orange-500' :
                              urgency.label === 'Moderate' ? 'bg-blue-500' : 'bg-slate-400'
                            }`}>
                              {urgency.label}
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 bg-slate-100 text-slate-400 rounded-md text-[10px] font-black uppercase tracking-wider">
                              Pending
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 align-middle text-right">
                          <div className="flex items-center justify-end gap-2">
                             {isAssessed && (
                               <button 
                                 onClick={(e) => handleRemove(e, brgy.id)}
                                 className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                 title="Delete assessment"
                               >
                                 <Trash2 size={16} />
                               </button>
                             )}
                             <button className={`p-2 rounded-lg transition-all ${
                               isAssessed ? 'text-blue-600 hover:bg-blue-50' : 'text-slate-300 pointer-events-none'
                             }`}>
                               {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                             </button>
                          </div>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr>
                          <td colSpan={5} className="px-8 py-8 bg-slate-50 group hover:bg-slate-50">
                             <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                <div className="lg:col-span-2">
                                   <div className="flex items-center gap-2 mb-4">
                                      <FileText size={14} className="text-blue-600" />
                                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Weighted Score Breakdown (WSM)</p>
                                   </div>
                                   
                                   <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                                      <table className="w-full text-left text-xs">
                                         <thead className="bg-slate-50 border-b border-slate-100">
                                            <tr>
                                               <th className="px-4 py-3 font-bold text-slate-500 uppercase">Impact Metric</th>
                                               <th className="px-4 py-3 font-bold text-slate-500 uppercase text-center">Value</th>
                                               <th className="px-4 py-3 font-bold text-slate-500 uppercase text-center">Normalized</th>
                                               <th className="px-4 py-3 font-bold text-slate-500 uppercase text-center">Weight</th>
                                               <th className="px-4 py-3 font-bold text-slate-500 uppercase text-right">Contribution</th>
                                            </tr>
                                         </thead>
                                         <tbody className="divide-y divide-slate-50 font-medium whitespace-nowrap">
                                            <tr>
                                               <td className="px-4 py-3 text-slate-600">Casualties</td>
                                               <td className="px-4 py-3 text-center">{brgy.casualties}</td>
                                               <td className="px-4 py-3 text-center">{(brgy.normalizedCasualties).toFixed(4)}</td>
                                               <td className="px-4 py-3 text-center">1/3</td>
                                               <td className="px-4 py-3 text-right font-bold text-red-600">+{(brgy.normalizedCasualties / 3).toFixed(4)}</td>
                                            </tr>
                                            <tr>
                                               <td className="px-4 py-3 text-slate-600">Affected Fam</td>
                                               <td className="px-4 py-3 text-center">{brgy.affectedFamilies}</td>
                                               <td className="px-4 py-3 text-center">{(brgy.normalizedFamilies).toFixed(4)}</td>
                                               <td className="px-4 py-3 text-center">1/3</td>
                                               <td className="px-4 py-3 text-right font-bold text-blue-600">+{(brgy.normalizedFamilies / 3).toFixed(4)}</td>
                                            </tr>
                                            <tr>
                                               <td className="px-4 py-3 text-slate-600">Damaged Houses</td>
                                               <td className="px-4 py-3 text-center">{brgy.damagedHouses}</td>
                                               <td className="px-4 py-3 text-center">{(brgy.normalizedHouses).toFixed(4)}</td>
                                               <td className="px-4 py-3 text-center">1/3</td>
                                               <td className="px-4 py-3 text-right font-bold text-orange-600">+{(brgy.normalizedHouses / 3).toFixed(4)}</td>
                                            </tr>
                                            <tr className="bg-slate-100/50 font-black">
                                               <td colSpan={4} className="px-4 py-3 text-slate-900 text-right uppercase text-[10px] tracking-widest">Final Priority Index:</td>
                                               <td className="px-4 py-3 text-right text-sm text-slate-900">{(brgy.priorityScore * 100).toFixed(2)}%</td>
                                            </tr>
                                         </tbody>
                                      </table>
                                   </div>
                                </div>
                                <div className="space-y-6">
                                   <div>
                                      <div className="flex items-center gap-2 mb-3">
                                         <Clock size={14} className="text-blue-600" />
                                         <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Response Plan</p>
                                      </div>
                                      <div className={`p-5 rounded-2xl border-2 ${urgency.bg} ${urgency.color.replace('text', 'border')} shadow-sm`}>
                                         <p className="text-xs font-black uppercase mb-1 tracking-wider">{urgency.label} Priority</p>
                                         <p className="text-sm font-bold text-slate-800 leading-relaxed">
                                            {getRecommendation(brgy.priorityScore)}
                                         </p>
                                      </div>
                                   </div>
                                   <div className="bg-white p-4 rounded-xl border border-slate-100 flex items-center justify-between shadow-sm">
                                      <div className="flex flex-col">
                                         <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Status Log</span>
                                         <span className="text-xs font-bold text-slate-800">{brgy.lastUpdated ? new Date(brgy.lastUpdated).toLocaleString() : 'Pending Entry'}</span>
                                      </div>
                                      <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-300">
                                         <Clock size={16} />
                                      </div>
                                   </div>
                                </div>
                             </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="py-20 text-center">
                    <div className="flex flex-col items-center justify-center space-y-3">
                       <Search size={32} className="text-slate-200" />
                       <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">No matching results</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="p-6 bg-slate-50/50 border-t border-slate-100">
          <div className="flex justify-between items-center">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Showing {filteredData.length} of 128 Barangays
            </p>
            <div className="flex gap-2">
              <button disabled className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-[10px] font-black text-slate-400 uppercase cursor-not-allowed">Previous</button>
              <button disabled className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-[10px] font-black text-slate-600 uppercase hover:bg-slate-50">Next Page</button>
            </div>
          </div>
        </div>
      </div>

      {/* Queue Legend */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-8 pt-8 border-t border-gray-100">
         <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-red-600" />
            <div className="text-xs">
               <p className="font-bold text-slate-900">Highest Priority</p>
               <p className="text-gray-500">Score 70% - 100%</p>
            </div>
         </div>
         <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-orange-500" />
            <div className="text-xs">
               <p className="font-bold text-slate-900">Urgent</p>
               <p className="text-gray-500">Score 40% - 69%</p>
            </div>
         </div>
         <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-blue-500" />
            <div className="text-xs">
               <p className="font-bold text-slate-900">Moderate</p>
               <p className="text-gray-500">Score 10% - 39%</p>
            </div>
         </div>
         <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-gray-400" />
            <div className="text-xs">
               <p className="font-bold text-slate-900">Low/Monitoring</p>
               <p className="text-gray-500">Score 0% - 9%</p>
            </div>
         </div>
      </div>
    </div>
  );
}

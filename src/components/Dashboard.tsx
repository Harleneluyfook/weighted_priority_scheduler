import React from 'react';
import { 
  Users, 
  Activity, 
  Home, 
  Target, 
  TrendingUp, 
  ArrowRight,
  AlertTriangle
} from 'lucide-react';
import { DashboardStats, BarangayData } from '../types';
import { getUrgencyLevel } from '../utils';

interface DashboardProps {
  stats: DashboardStats;
  topBarangays: BarangayData[];
  onNavigate: (tab: string) => void;
}

export default function Dashboard({ stats, topBarangays, onNavigate }: DashboardProps) {
  return (
    <div className="space-y-8">
      {/* Alert Banner */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="relative z-10">
          <h3 className="text-2xl font-bold mb-2">Emergency Response Dashboard</h3>
          <p className="text-slate-400 max-w-xl">
            Real-time disaster prioritization for 128 barangays of Baguio City. 
            Rankings are computed using the Weighted Sum Model based on reported casualties, affected families, and damaged structures.
          </p>
        </div>
        <div className="relative z-10 flex gap-4">
           <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
              <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">Status</p>
              <p className="text-lg font-bold text-red-500">OPERATIONAL</p>
           </div>
           <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
              <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">Last Update</p>
              <p className="text-lg font-bold text-white">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
           </div>
        </div>
        <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-red-600/10 rounded-full blur-3xl" />
      </div>

      {/* Metric Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
          <p className="label-caps !mb-1">Top Priority</p>
          <h3 className="text-xl font-black text-red-600 truncate">{stats.highestPriorityName}</h3>
          <p className="text-[10px] text-slate-500 mt-2">WSM Score Optimized</p>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
          <p className="label-caps !mb-1">Total Affected</p>
          <h3 className="text-2xl font-black text-slate-900">{stats.totalFamilies.toLocaleString()}</h3>
          <p className="text-[10px] text-green-500 mt-2">Families registered</p>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
          <p className="label-caps !mb-1">Total Casualties</p>
          <h3 className="text-2xl font-black text-slate-900">{stats.totalCasualties.toLocaleString()}</h3>
          <p className="text-[10px] text-red-400 mt-2">Verified reports</p>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
          <p className="label-caps !mb-1">Queue Density</p>
          <h3 className="text-2xl font-black text-slate-900">{stats.totalAssessed}</h3>
          <p className="text-[10px] text-blue-500 mt-2">Barangays Assessed</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Top 5 Priority Queue */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-lg font-bold flex items-center gap-2">
              <TrendingUp size={20} className="text-slate-900" />
              Critical Priority Areas (Top 5)
            </h4>
            <button 
              onClick={() => onNavigate('queue')}
              className="text-sm font-medium text-slate-600 hover:text-slate-900 flex items-center gap-1 group"
            >
              View full queue
              <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          <div className="space-y-3">
             {topBarangays.length > 0 ? (
               topBarangays.map((brgy) => {
                 const urgency = getUrgencyLevel(brgy.priorityScore);
                 return (
                   <div key={brgy.id} className="bg-white rounded-xl border border-gray-100 p-4 flex items-center justify-between group hover:border-slate-300 transition-all">
                      <div className="flex items-center gap-4">
                         <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center font-bold text-slate-400 group-hover:bg-slate-900 group-hover:text-white transition-colors">
                           #{brgy.rank}
                         </div>
                         <div>
                            <h5 className="font-bold text-slate-900">{brgy.name}</h5>
                            <div className="flex items-center gap-3 mt-1">
                               <span className="text-xs text-gray-500 flex items-center gap-1">
                                 <Users size={12} /> {brgy.affectedFamilies} families
                               </span>
                               <span className="text-xs text-gray-500 flex items-center gap-1">
                                 <Activity size={12} /> {brgy.casualties} casualties
                               </span>
                            </div>
                         </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                         <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded ${urgency.bg} ${urgency.color}`}>
                           {urgency.label}
                         </span>
                         <span className="text-lg font-mono font-bold text-slate-900">
                           {(brgy.priorityScore * 100).toFixed(1)}%
                         </span>
                      </div>
                   </div>
                 );
               })
             ) : (
               <div className="bg-white rounded-xl border border-dashed border-gray-300 p-12 text-center">
                  <p className="text-gray-400 font-medium">No assessment data available.</p>
                  <p className="text-xs text-gray-400 mt-1">Start by adding data in the Assessment Input section.</p>
               </div>
             )}
          </div>
        </div>

        {/* Summary Info */}
        <div className="space-y-6">
           <div className="dashboard-card bg-slate-50 border-none shadow-none">
              <h4 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Target size={18} />
                Operational Status
              </h4>
              <div className="space-y-4">
                 <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500">Total Barangays</span>
                    <span className="font-bold">128</span>
                 </div>
                 <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500">Assessed</span>
                    <span className="font-bold text-blue-600">{stats.totalAssessed}</span>
                 </div>
                 <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500">Remaining</span>
                    <span className="font-bold">{128 - stats.totalAssessed}</span>
                 </div>
                 <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden mt-2">
                    <div 
                      className="bg-slate-900 h-full transition-all duration-500" 
                      style={{ width: `${(stats.totalAssessed / 128) * 100}%` }} 
                    />
                 </div>
              </div>
           </div>

           <div className="dashboard-card border-orange-100 bg-orange-50/30">
              <h4 className="font-bold text-orange-900 mb-3 flex items-center gap-2">
                <AlertTriangle size={18} />
                Quick Action Required
              </h4>
              <p className="text-sm text-orange-800 leading-relaxed">
                Check the top-ranked barangays in the Priority Queue. Recommendations for immediate response are automatically updated as new data is entered.
              </p>
           </div>
        </div>
      </div>
    </div>
  );
}

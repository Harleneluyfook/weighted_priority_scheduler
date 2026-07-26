import React from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts';
import { BarangayData } from '../types';
import { getUrgencyLevel } from '../utils';
import { BarChart3, HeartPulse, Users, Home, AlertTriangle, CheckCircle, Lightbulb } from 'lucide-react';

interface AnalyticsProps {
  data: BarangayData[];
}

export default function Analytics({ data }: AnalyticsProps) {
  const top10Casualties = [...data]
    .sort((a, b) => b.casualties - a.casualties)
    .slice(0, 10);

  const top10Families = [...data]
    .sort((a, b) => b.affectedFamilies - a.affectedFamilies)
    .slice(0, 10);

  const totalCasualties = data.reduce((sum, b) => sum + (b.casualties || 0), 0);
  const totalFamilies = data.reduce((sum, b) => sum + (b.affectedFamilies || 0), 0);
  const totalHouses = data.reduce((sum, b) => sum + (b.damagedHouses || 0), 0);

  const urgencyCounts = data.reduce((acc, curr) => {
    const level = getUrgencyLevel(curr.priorityScore).label;
    acc[level] = (acc[level] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const pieData = Object.entries(urgencyCounts).map(([name, value]) => ({ name, value }));
  
  const COLORS = {
    'Highest': '#dc2626',
    'Urgent': '#f97316',
    'Moderate': '#3b82f6',
    'Low': '#64748b'
  };

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-16 bg-white rounded-3xl border border-gray-100 text-center">
         <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center text-blue-500 mb-4">
            <BarChart3 size={32} />
         </div>
         <h3 className="text-lg font-bold text-slate-800">No Disaster Data Uploaded Yet</h3>
         <p className="text-sm text-gray-500 max-w-sm mt-1">
           Upload a CSV file or enter assessments in the Assessment Input tab to view simple visual analytics.
         </p>
      </div>
    );
  }

  const highestCount = urgencyCounts['Highest'] || 0;
  const urgentCount = urgencyCounts['Urgent'] || 0;

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 text-white p-5 rounded-2xl flex flex-col justify-between">
           <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Assessed</p>
           <p className="text-3xl font-black mt-2">{data.length} <span className="text-xs font-normal text-slate-400">Barangays</span></p>
        </div>

        <div className="bg-red-50 border border-red-100 p-5 rounded-2xl flex flex-col justify-between">
           <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-red-700 uppercase tracking-wider">Casualties</p>
              <HeartPulse size={18} className="text-red-500" />
           </div>
           <p className="text-3xl font-black text-red-700 mt-2">{totalCasualties} <span className="text-xs font-normal text-red-500">People</span></p>
        </div>

        <div className="bg-blue-50 border border-blue-100 p-5 rounded-2xl flex flex-col justify-between">
           <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-blue-700 uppercase tracking-wider">Affected Families</p>
              <Users size={18} className="text-blue-500" />
           </div>
           <p className="text-3xl font-black text-blue-700 mt-2">{totalFamilies.toLocaleString()} <span className="text-xs font-normal text-blue-500">Families</span></p>
        </div>

        <div className="bg-amber-50 border border-amber-100 p-5 rounded-2xl flex flex-col justify-between">
           <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-amber-800 uppercase tracking-wider">Damaged Houses</p>
              <Home size={18} className="text-amber-600" />
           </div>
           <p className="text-3xl font-black text-amber-800 mt-2">{totalHouses.toLocaleString()} <span className="text-xs font-normal text-amber-600">Houses</span></p>
        </div>
      </div>

      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Chart 1: Reported Casualties */}
        <div className="lg:col-span-7 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between">
           <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                   <h4 className="text-base font-bold text-slate-900">Top 10 Casualty Hotspots</h4>
                   <p className="text-xs text-slate-500">Barangays with the highest reported casualties</p>
                </div>
                <span className="text-xs font-bold px-2.5 py-1 bg-red-100 text-red-700 rounded-full flex items-center gap-1">
                   <AlertTriangle size={12} /> Medical Priority
                </span>
              </div>

              <div className="h-[250px] w-full">
                 <ResponsiveContainer width="100%" height="100%">
                   <BarChart data={top10Casualties} layout="vertical" margin={{ left: 10, right: 20 }}>
                     <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                     <XAxis type="number" hide />
                     <YAxis 
                       dataKey="name" 
                       type="category" 
                       width={110} 
                       fontSize={11} 
                       fontWeight="600"
                       tick={{ fill: '#334155' }}
                     />
                     <Tooltip 
                       cursor={{ fill: '#f8fafc' }}
                       contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                     />
                     <Bar dataKey="casualties" name="Casualties" fill="#dc2626" radius={[0, 6, 6, 0]} barSize={18} />
                   </BarChart>
                 </ResponsiveContainer>
              </div>
           </div>

           {/* Simple Interpretation */}
           <div className="mt-4 p-3.5 bg-red-50/70 border border-red-100 rounded-xl text-xs text-red-900 space-y-1">
              <p className="font-bold">💡 What this means for responders:</p>
              <p className="text-red-800 leading-relaxed">
                These top barangays have reported the most injuries or casualties. Send search-and-rescue and medical teams here <strong>first</strong>.
              </p>
           </div>
        </div>

        {/* Chart 2: Urgency Breakdown */}
        <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between">
           <div>
              <div className="flex items-center justify-between mb-2">
                 <h4 className="text-base font-bold text-slate-900">Response Priority Levels</h4>
                 <span className="text-xs font-bold px-2.5 py-1 bg-slate-100 text-slate-700 rounded-full">Urgency Tiers</span>
              </div>
              <p className="text-xs text-slate-500 mb-2">How response urgency is split across barangays</p>

              <div className="h-[200px] w-full">
                 <ResponsiveContainer width="100%" height="100%">
                   <PieChart>
                     <Pie
                       data={pieData}
                       cx="50%"
                       cy="50%"
                       innerRadius={50}
                       outerRadius={75}
                       paddingAngle={4}
                       dataKey="value"
                       stroke="none"
                     >
                       {pieData.map((entry, index) => (
                         <Cell key={`cell-${index}`} fill={COLORS[entry.name as keyof typeof COLORS]} />
                       ))}
                     </Pie>
                     <Tooltip 
                       contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                     />
                   </PieChart>
                 </ResponsiveContainer>
              </div>

              <div className="flex flex-wrap justify-center gap-3">
                 {pieData.map((entry) => (
                   <div key={entry.name} className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                     <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[entry.name as keyof typeof COLORS] }} />
                     <span>{entry.name}: {entry.value}</span>
                   </div>
                 ))}
              </div>
           </div>

           {/* Simple Interpretation */}
           <div className="mt-4 p-3.5 bg-slate-50 border border-slate-100 rounded-xl text-xs text-slate-700 space-y-1">
              <p className="font-bold text-slate-900">💡 Summary:</p>
              <p className="leading-relaxed">
                {highestCount + urgentCount > 0 
                  ? `${highestCount + urgentCount} barangays need immediate action within 24 to 48 hours.`
                  : 'All barangays currently fall within moderate or low urgency levels.'
                }
              </p>
           </div>
        </div>

        {/* Chart 3: Affected Families Displacement */}
        <div className="lg:col-span-12 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
           <div className="flex items-center justify-between">
              <div>
                 <h4 className="text-base font-bold text-slate-900">Top 10 Barangays by Affected Families</h4>
                 <p className="text-xs text-slate-500">Shows where food packs, clean water, and shelter supplies are needed most</p>
              </div>
              <span className="text-xs font-bold px-3 py-1 bg-blue-50 text-blue-700 rounded-full">
                 Relief Logistics
              </span>
           </div>

           <div className="h-[220px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={top10Families} margin={{ top: 10, right: 20, left: 0, bottom: 40 }}>
                  <defs>
                    <linearGradient id="colorFamSimple" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.25}/>
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="name" 
                    fontSize={11} 
                    fontWeight="600"
                    tick={{ fill: '#334155' }}
                    interval={0}
                    angle={-25}
                    textAnchor="end"
                    height={45}
                    stroke="#cbd5e1"
                  />
                  <YAxis fontSize={11} fontWeight="600" tick={{ fill: '#334155' }} stroke="#cbd5e1" />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="affectedFamilies" 
                    name="Affected Families"
                    stroke="#2563eb" 
                    fillOpacity={1} 
                    fill="url(#colorFamSimple)" 
                    strokeWidth={3}
                  />
                </AreaChart>
              </ResponsiveContainer>
           </div>

           {/* Simple Interpretation */}
           <div className="p-3.5 bg-blue-50/70 border border-blue-100 rounded-xl text-xs text-blue-900 space-y-1">
              <p className="font-bold">💡 What this means for relief teams:</p>
              <p className="leading-relaxed">
                 Barangays with high peaks on this graph have large numbers of displaced residents. Prioritize food distribution trucks and evacuation center supplies for these areas.
              </p>
           </div>
        </div>

        {/* Quick Action Plan for Responders */}
        <div className="lg:col-span-12 bg-slate-900 text-white p-6 rounded-3xl space-y-3">
           <div className="flex items-center gap-2">
              <Lightbulb className="text-amber-400" size={20} />
              <h4 className="text-base font-bold text-white">Action Steps for Response Teams</h4>
           </div>
           <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
              <div className="bg-slate-800 p-4 rounded-2xl border border-slate-700 text-xs space-y-1">
                 <p className="font-bold text-red-400 flex items-center gap-1.5">
                   <CheckCircle size={14} /> 1. Medical &amp; Rescue
                 </p>
                 <p className="text-slate-300">Deploy ambulances and SAR teams directly to top casualty hotspots first.</p>
              </div>

              <div className="bg-slate-800 p-4 rounded-2xl border border-slate-700 text-xs space-y-1">
                 <p className="font-bold text-blue-400 flex items-center gap-1.5">
                   <CheckCircle size={14} /> 2. Relief Distribution
                 </p>
                 <p className="text-slate-300">Deliver family food packs and potable water to areas with high displacement numbers.</p>
              </div>

              <div className="bg-slate-800 p-4 rounded-2xl border border-slate-700 text-xs space-y-1">
                 <p className="font-bold text-amber-400 flex items-center gap-1.5">
                   <CheckCircle size={14} /> 3. Shelter &amp; Repairs
                 </p>
                 <p className="text-slate-300">Send shelter repair kits (tarps, tools) to barangays reporting heavy housing damage.</p>
              </div>
           </div>
        </div>

      </div>
    </div>
  );
}



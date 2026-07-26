import React, { useState, useMemo, useRef } from 'react';
import { 
  Search, 
  ChevronDown, 
  PlusCircle, 
  Trash2, 
  CheckCircle2,
  AlertCircle,
  Users,
  Activity,
  Home,
  FileUp,
  Download
} from 'lucide-react';
import Papa from 'papaparse';
import { BarangayData } from '../types';
import { getUrgencyLevel, getRecommendation } from '../utils';

interface AssessmentInputProps {
  barangays: BarangayData[];
  onUpdate: (id: string, data: Partial<BarangayData>) => void;
  onBulkUpdate: (updates: { name: string; casualties: number; affectedFamilies: number; damagedHouses: number }[]) => void;
}

export default function AssessmentInput({ barangays, onUpdate, onBulkUpdate }: AssessmentInputProps) {
  const [selectedId, setSelectedId] = useState<string>('');
  const [searchValue, setSearchValue] = useState('');
  const [formData, setFormData] = useState({
    casualties: '',
    families: '',
    houses: ''
  });
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredBarangays = useMemo(() => {
    return barangays
      .filter(b => b.name.toLowerCase().includes(searchValue.toLowerCase()))
      .slice(0, 50); // Limit display for performance
  }, [barangays, searchValue]);

  const selectedBarangay = useMemo(() => 
    barangays.find(b => b.id === selectedId),
    [barangays, selectedId]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedId) {
      setMessage({ type: 'error', text: 'Please select a barangay first.' });
      return;
    }

    const casualties = parseInt(formData.casualties) || 0;
    const families = parseInt(formData.families) || 0;
    const houses = parseInt(formData.houses) || 0;

    onUpdate(selectedId, {
      casualties,
      affectedFamilies: families,
      damagedHouses: houses
    });

    setMessage({ 
      type: 'success', 
      text: `Assessment for ${selectedBarangay?.name} has been updated and reranked.` 
    });

    // Clear form after submission
    setFormData({ casualties: '', families: '', houses: '' });
    setSelectedId('');
    setSearchValue('');

    // Clear message after delay
    setTimeout(() => setMessage(null), 5000);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const data = results.data as any[];
        const aggregationMap = new Map<string, { casualties: number; affectedFamilies: number; damagedHouses: number; disaster?: string }>();
        
        data.forEach(row => {
          // Normalize header keys (handle typos like 'Baranagy' and common variations)
          const name = (row['Baranagy'] || row['barangay'] || row['Barangay'] || row['Name'] || row['name'])?.trim();
          const disaster = (row['Disaster'] || row['disaster'] || row['Event'] || row['event'])?.trim();
          const casualties = parseInt(row['Casualties'] || row['casualties'] || 0);
          const families = parseInt(row['Affected Families'] || row['affected_families'] || row['Families'] || 0);
          const houses = parseInt(row['Damaged Houses'] || row['damaged_houses'] || row['Houses'] || 0);
          
          if (name) {
            const key = disaster ? `${disaster}-${name}` : name;
            const existing = aggregationMap.get(key) || { casualties: 0, affectedFamilies: 0, damagedHouses: 0, disaster };
            aggregationMap.set(key, {
              casualties: existing.casualties + (isNaN(casualties) ? 0 : casualties),
              affectedFamilies: existing.affectedFamilies + (isNaN(families) ? 0 : families),
              damagedHouses: existing.damagedHouses + (isNaN(houses) ? 0 : houses),
              disaster
            });
          }
        });

        const updates: { name: string; casualties: number; affectedFamilies: number; damagedHouses: number; disaster?: string }[] = [];
        aggregationMap.forEach((values, key) => {
          // Extract name from key if possible, but better to store it in values
          // Since I didn't store name in values, I'll extract it from key or use the key if no disaster
          let name = key;
          if (values.disaster && key.startsWith(values.disaster + '-')) {
            name = key.substring(values.disaster.length + 1);
          }
          updates.push({ 
            name, 
            casualties: values.casualties, 
            affectedFamilies: values.affectedFamilies, 
            damagedHouses: values.damagedHouses, 
            disaster: values.disaster 
          });
        });

        if (updates.length > 0) {
          onBulkUpdate(updates);
          setMessage({ type: 'success', text: `Successfully imported and aggregated ${updates.length} barangay records.` });
          setTimeout(() => setMessage(null), 5000);
        } else {
          setMessage({ type: 'error', text: 'Could not find valid barangay data. Ensure columns match: Baranagy, Affected Families, Casualties, Damaged Houses.' });
        }
        
        if (fileInputRef.current) fileInputRef.current.value = '';
      },
      error: (err) => {
        setMessage({ type: 'error', text: `Failed to parse CSV: ${err.message}` });
      }
    });
  };

  const downloadTemplate = () => {
    const headers = ['barangay', 'Affected Families', 'Casualties', 'Damaged Houses'];
    const sampleData = [
      ['Bakakeng Central', 120, 2, 15],
      ['Irisan', 350, 5, 45],
      ['Camp 7', 80, 0, 8]
    ];
    
    let csvContent = headers.join(',') + '\n';
    sampleData.forEach(row => {
      csvContent += row.join(',') + '\n';
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'wps_assessment_template.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleResetForm = () => {
    setFormData({ casualties: '', families: '', houses: '' });
    setSelectedId('');
    setSearchValue('');
    setMessage(null);
  };

  // Helper to handle focusing on input to clear 0
  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    if (e.target.value === '0') {
      const name = e.target.name;
      setFormData(prev => ({ ...prev, [name]: '' }));
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
           <h3 className="text-2xl font-bold text-slate-900">Disaster Impact Assessment</h3>
           <p className="text-gray-500">Select a barangay and input the relevant data to adjust prioritize ranking.</p>
        </div>
        <div className="flex items-center gap-4">
           <button 
             onClick={handleResetForm}
             className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-red-600 transition-colors"
           >
             <Trash2 size={16} />
             Clear Form
           </button>
           
           <input 
             type="file" 
             ref={fileInputRef} 
             onChange={handleFileUpload} 
             accept=".csv" 
             className="hidden" 
           />
           
           <button 
             onClick={() => fileInputRef.current?.click()}
             className="flex items-center gap-2 text-sm font-bold text-blue-600 bg-blue-50 px-4 py-2 rounded-xl hover:bg-blue-100 transition-all border border-blue-100"
           >
             <FileUp size={16} />
             Import CSV
           </button>

           <button 
             onClick={downloadTemplate}
             className="p-2 text-slate-400 hover:text-slate-600 transition-colors"
             title="Download CSV Template"
           >
             <Download size={18} />
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input Form */}
        <form onSubmit={handleSubmit} className="space-y-6 bg-white p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col">
          <h4 className="font-bold text-slate-800 mb-2">New Assessment</h4>
          
          {/* Custom Select Dropdown */}
          <div className="space-y-2 relative">
            <label className="label-caps">1. Select Barangay</label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-slate-200 text-left hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all bg-slate-50"
              >
                <span className={selectedBarangay ? 'text-slate-900 font-medium' : 'text-slate-400 font-medium text-sm'}>
                  {selectedBarangay ? selectedBarangay.name : 'Choose a barangay...'}
                </span>
                <ChevronDown size={20} className={`text-slate-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {isDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-slate-100 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="p-3 border-b border-slate-100">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                      <input
                        type="text"
                        placeholder="Search..."
                        className="w-full pl-10 pr-4 py-2 text-sm border border-slate-100 rounded-lg focus:outline-none focus:bg-slate-50"
                        value={searchValue}
                        onChange={(e) => setSearchValue(e.target.value)}
                        autoFocus
                      />
                    </div>
                  </div>
                  <div className="max-h-[250px] overflow-y-auto custom-scrollbar p-1">
                    {filteredBarangays.map((brgy) => (
                      <button
                        key={brgy.id}
                        type="button"
                        onClick={() => {
                          setSelectedId(brgy.id);
                          setIsDropdownOpen(false);
                          setSearchValue('');
                          setFormData({
                            casualties: brgy.casualties.toString() || '',
                            families: brgy.affectedFamilies.toString() || '',
                            houses: brgy.damagedHouses.toString() || ''
                          });
                        }}
                        className={`w-full text-left px-4 py-2.5 rounded-lg text-sm transition-colors ${
                          selectedId === brgy.id 
                            ? 'bg-blue-50 text-blue-700 font-bold' 
                            : 'text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {brgy.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
             <div className="grid grid-cols-1 gap-4">
                <div className="space-y-1.5">
                  <label className="label-caps">Casualties</label>
                  <input
                    type="number"
                    name="casualties"
                    min="0"
                    placeholder="0"
                    className="input-field"
                    value={formData.casualties}
                    onFocus={handleFocus}
                    onChange={(e) => setFormData({...formData, casualties: e.target.value})}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="label-caps">Affected Families</label>
                  <input
                    type="number"
                    name="families"
                    min="0"
                    placeholder="0"
                    className="input-field"
                    value={formData.families}
                    onFocus={handleFocus}
                    onChange={(e) => setFormData({...formData, families: e.target.value})}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="label-caps">Damaged Houses</label>
                  <input
                    type="number"
                    name="houses"
                    min="0"
                    placeholder="0"
                    className="input-field"
                    value={formData.houses}
                    onFocus={handleFocus}
                    onChange={(e) => setFormData({...formData, houses: e.target.value})}
                  />
                </div>
             </div>
          </div>

          <div className="pt-4 space-y-3">
            <button type="submit" className="w-full btn-primary py-4">
              Add to Assessment
            </button>
          </div>

          {message && (
            <div className={`p-4 rounded-xl flex items-start gap-3 animate-in fade-in zoom-in duration-300 ${
              message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
            }`}>
              {message.type === 'success' ? <CheckCircle2 size={18} className="mt-0.5" /> : <AlertCircle size={18} className="mt-0.5" />}
              <p className="text-sm font-medium">{message.text}</p>
            </div>
          )}
        </form>

        {/* Selected Status Panel */}
        <div className="space-y-6">
          {selectedBarangay ? (
            <>
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 space-y-6">
                <div className="flex items-center justify-between border-b border-slate-50 pb-4">
                   <h4 className="font-bold text-lg text-slate-800">{selectedBarangay.name}</h4>
                   <div className="text-right">
                      <p className="label-caps !mb-0">Current Rank</p>
                      <p className="text-2xl font-black text-blue-600">#{selectedBarangay.rank}</p>
                   </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                   <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <p className="label-caps !mb-1">WSM Score</p>
                      <p className="text-xl font-black font-mono text-slate-900">{(selectedBarangay.priorityScore * 100).toFixed(1)}%</p>
                   </div>
                   <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <p className="label-caps !mb-1">Priority Level</p>
                      <p className={`text-sm font-black uppercase ${getUrgencyLevel(selectedBarangay.priorityScore).color}`}>
                        {selectedBarangay.rank === 1 ? 'Critical Priority' : 
                         selectedBarangay.rank <= 10 ? 'High Priority' :
                         selectedBarangay.rank <= 30 ? 'Medium Priority' : 'Low Priority'}
                      </p>
                   </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                   <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-center">
                      <p className="text-[10px] text-slate-400 font-bold uppercase">Affected</p>
                      <p className="text-lg font-black text-slate-700">{selectedBarangay.affectedFamilies}</p>
                   </div>
                   <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-center">
                      <p className="text-[10px] text-slate-400 font-bold uppercase">Casualties</p>
                      <p className="text-lg font-black text-slate-700">{selectedBarangay.casualties}</p>
                   </div>
                   <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-center">
                      <p className="text-[10px] text-slate-400 font-bold uppercase">Damaged</p>
                      <p className="text-lg font-black text-slate-700">{selectedBarangay.damagedHouses}</p>
                   </div>
                </div>

                <div className="space-y-2">
                   <p className="label-caps">Response Recommendation</p>
                   <div className={`p-5 rounded-2xl border ${getUrgencyLevel(selectedBarangay.priorityScore).bg} border-slate-100 shadow-sm`}>
                      <p className="text-sm leading-relaxed font-bold text-slate-700">
                        {getRecommendation(selectedBarangay.priorityScore)}
                      </p>
                   </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-slate-50">
                    <p className="label-caps">Queue Position Visualization</p>
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                       <div className="flex justify-between items-center mb-3">
                          <span className="text-[10px] font-black text-blue-600 uppercase">Rank #{selectedBarangay.rank}</span>
                          <span className="text-[10px] font-black text-slate-400 uppercase">Total 128 Barangays</span>
                       </div>
                       <input 
                         type="range" 
                         min="1" 
                         max="128" 
                         value={selectedBarangay.rank} 
                         disabled 
                         className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-not-allowed accent-blue-600"
                       />
                       <div className="flex justify-between mt-2 text-[9px] text-slate-400 font-black uppercase">
                          <span>Highest Priority (#1)</span>
                          <span>Lowest Priority (#128)</span>
                       </div>
                    </div>
                </div>
              </div>

              <div className="bg-slate-900 rounded-3xl p-6 text-white flex items-center gap-4 border border-slate-800 shadow-xl">
                 <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center border border-slate-700">
                    <AlertCircle className="text-blue-500" />
                 </div>
                 <div>
                    <h5 className="font-bold text-sm">Automated Decision Logic</h5>
                    <p className="text-[10px] text-slate-400 leading-relaxed uppercase tracking-wide">
                      Real-time re-ranking triggered via WSM engine update.
                    </p>
                 </div>
              </div>
            </>
          ) : (
          <div className="h-full bg-slate-100/50 rounded-3xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center p-12 text-center text-slate-400 space-y-4">
               <div className="w-16 h-16 rounded-3xl bg-slate-200 flex items-center justify-center border border-slate-300">
                  <Search size={24} />
               </div>
               <div>
                  <p className="font-black text-slate-500 uppercase tracking-widest text-xs">No Area Selected</p>
                  <p className="text-xs mt-2 max-w-[200px] mx-auto text-slate-400">Select a location from the dropdown to access operational status panels.</p>
               </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

import React, { useState, useEffect, useMemo } from 'react';
import { 
  LayoutDashboard, 
  ClipboardCheck, 
  ListOrdered, 
  Info, 
  BarChart3, 
  Menu, 
  X, 
  History
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { BAGUIO_BARANGAYS } from './constants';
import { BarangayData } from './types';
import { calculateWSM } from './utils';
import Dashboard from './components/Dashboard';
import AssessmentInput from './components/AssessmentInput';
import PriorityQueue from './components/PriorityQueue';
import Analytics from './components/Analytics';
import HowItWorks from './components/HowItWorks';
import Evaluation from './components/Evaluation';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  // Close sidebar on small screens by default
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  const [barangayList, setBarangayList] = useState<BarangayData[]>(() => {
    // Initialize with 128 barangays, zeroed out
    return BAGUIO_BARANGAYS.map((name, index) => ({
      id: `brgy-${index}`,
      name,
      casualties: 0,
      affectedFamilies: 0,
      damagedHouses: 0,
      priorityScore: 0,
      normalizedCasualties: 0,
      normalizedFamilies: 0,
      normalizedHouses: 0,
      rank: index + 1
    }));
  });

  // Derived stats
  const rankedData = useMemo(() => calculateWSM(barangayList), [barangayList]);
  
  const assessedBarangays = useMemo(() => 
    rankedData.filter(b => !!b.lastUpdated),
    [rankedData]
  );

  const stats = useMemo(() => {
    const totalFamilies = assessedBarangays.reduce((sum, b) => sum + b.affectedFamilies, 0);
    const totalCasualties = assessedBarangays.reduce((sum, b) => sum + b.casualties, 0);
    const totalDamagedHouses = assessedBarangays.reduce((sum, b) => sum + b.damagedHouses, 0);
    const highestPriority = assessedBarangays.length > 0 ? assessedBarangays[0].name : "None";

    return {
      totalFamilies,
      totalCasualties,
      totalDamagedHouses,
      totalAssessed: assessedBarangays.length,
      highestPriorityName: highestPriority
    };
  }, [assessedBarangays]);

  const updateBarangay = (id: string, data: Partial<BarangayData>) => {
    setBarangayList(prev => prev.map(b => 
      b.id === id ? { ...b, ...data, lastUpdated: Date.now() } : b
    ));
  };

  const bulkUpdateBarangays = (updates: { name: string; casualties: number; affectedFamilies: number; damagedHouses: number; disaster?: string }[]) => {
    setBarangayList(prev => {
      const newList = [...prev];
      updates.forEach(update => {
        const index = newList.findIndex(b => 
          b.name.toLowerCase() === update.name.toLowerCase() && 
          (b.disaster || '').toLowerCase() === (update.disaster || '').toLowerCase()
        );
        
        if (index !== -1) {
          newList[index] = {
            ...newList[index],
            casualties: update.casualties,
            affectedFamilies: update.affectedFamilies,
            damagedHouses: update.damagedHouses,
            lastUpdated: Date.now()
          };
        } else {
          // Add new record
          newList.push({
            id: `brgy-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            name: update.name,
            casualties: update.casualties,
            affectedFamilies: update.affectedFamilies,
            damagedHouses: update.damagedHouses,
            disaster: update.disaster,
            priorityScore: 0,
            normalizedCasualties: 0,
            normalizedFamilies: 0,
            normalizedHouses: 0,
            rank: 0,
            lastUpdated: Date.now()
          });
        }
      });
      return newList;
    });
  };

  const resetBarangay = (id: string) => {
    setBarangayList(prev => prev.map(b => 
      b.id === id ? { 
        ...b, 
        casualties: 0, 
        affectedFamilies: 0, 
        damagedHouses: 0, 
        priorityScore: 0,
        normalizedCasualties: 0,
        normalizedFamilies: 0,
        normalizedHouses: 0,
        lastUpdated: undefined 
      } : b
    ));
  };

  const resetData = () => {
    if (confirm("Are you sure you want to reset all assessment data?")) {
      setBarangayList(BAGUIO_BARANGAYS.map((name, index) => ({
        id: `brgy-${index}`,
        name,
        casualties: 0,
        affectedFamilies: 0,
        damagedHouses: 0,
        priorityScore: 0,
        normalizedCasualties: 0,
        normalizedFamilies: 0,
        normalizedHouses: 0,
        rank: index + 1
      })));
    }
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'assessment', label: 'Assessment Input', icon: ClipboardCheck },
    { id: 'queue', label: 'Priority Queue', icon: ListOrdered },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'evaluation', label: 'Algorithm Assessment', icon: History },
    { id: 'how-it-works', label: 'How WPS Works', icon: Info },
  ];

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans">
      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 transition-opacity" 
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <motion.aside 
        initial={false}
        animate={{ 
          width: isSidebarOpen ? '280px' : '0px',
          x: isSidebarOpen ? 0 : -20 
        }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="bg-slate-900 text-white flex-shrink-0 z-50 lg:relative fixed inset-y-0 shadow-2xl lg:shadow-none overflow-hidden"
      >
        <div className="p-6 flex items-center gap-3 border-b border-slate-800">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-white text-xl">W</div>
          <div className={!isSidebarOpen ? 'hidden' : 'block'}>
            <h1 className="text-white font-bold leading-none tracking-tight">WPS</h1>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-1">Baguio City Ops</p>
          </div>
        </div>

        <nav className="p-4 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                if (window.innerWidth < 1024) setIsSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                activeTab === item.id 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20 font-medium' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              } ${!isSidebarOpen && 'justify-center'}`}
            >
              <item.icon size={20} />
              {isSidebarOpen && <span className="font-medium">{item.label}</span>}
            </button>
          ))}
        </nav>

        <div className="p-6 border-t border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center overflow-hidden border border-slate-600">
               <img src="https://api.dicebear.com/7.x/initials/svg?seed=BC" alt="User" />
            </div>
            {isSidebarOpen && (
              <div className="min-w-0">
                <p className="text-xs font-bold text-white truncate">Baguio City EOC</p>
                <p className="text-[10px] text-slate-500 uppercase tracking-tighter">Ops Terminal</p>
              </div>
            )}
          </div>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Header */}
        <header className="h-20 bg-transparent flex items-center justify-between px-8 flex-shrink-0">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 lg:hidden"
            >
              <Menu size={20} />
            </button>
            <div>
              <h2 className="text-2xl font-bold text-slate-900">
                {navItems.find(i => i.id === activeTab)?.label}
              </h2>
              <p className="text-slate-500 text-xs font-medium">Weighted Sum Model (WSM) Priority Scheduling for 128 Barangays</p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="hidden md:block text-right">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Current Time</p>
              <p className="text-sm font-bold text-slate-700">{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} | {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-slate-200 border-2 border-white shadow-sm overflow-hidden">
               <img src="https://api.dicebear.com/7.x/initials/svg?seed=BC" alt="User" />
            </div>
          </div>
        </header>

        {/* Dynamic Section */}
        <div className="flex-1 overflow-y-auto px-8 pb-8 custom-scrollbar">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === 'dashboard' && (
                <Dashboard 
                  stats={stats} 
                  topBarangays={assessedBarangays.slice(0, 5)} 
                  onNavigate={(tab) => setActiveTab(tab)}
                />
              )}
              {activeTab === 'assessment' && (
                <AssessmentInput 
                  barangays={rankedData} 
                  onUpdate={updateBarangay} 
                  onBulkUpdate={bulkUpdateBarangays}
                />
              )}
              {activeTab === 'queue' && (
                <PriorityQueue 
                  barangays={rankedData} 
                  onRemove={resetBarangay}
                />
              )}
              {activeTab === 'analytics' && (
                <Analytics data={assessedBarangays} />
              )}
              {activeTab === 'evaluation' && (
                <Evaluation data={rankedData} />
              )}
              {activeTab === 'how-it-works' && (
                <HowItWorks />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

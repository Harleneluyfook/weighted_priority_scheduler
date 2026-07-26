import React from 'react';
import { 
  CheckCircle2, 
  HelpCircle, 
  Zap, 
  ArrowRight,
  Database,
  Calculator,
  ListRestart
} from 'lucide-react';

export default function HowItWorks() {
  const steps = [
    {
      icon: Database,
      title: "Data Collection",
      color: "bg-blue-50 text-blue-600",
      description: "Gather impact data for each barangay, focusing on three key criteria: total casualties, number of families affected, and extent of structural damage."
    },
    {
      icon: Calculator,
      title: "WSM Normalization",
      color: "bg-purple-50 text-purple-600",
      description: "The system normalizes raw data on a scale of 0 to 1, ensuring criteria with different units (e.g., houses vs people) are comparable."
    },
    {
      icon: Zap,
      title: "Priority Scoring",
      color: "bg-orange-50 text-orange-600",
      description: "Using the Weighted Sum Model (WSM), equal weights are applied to normalized values to generate a single objective Priority Score."
    },
    {
      icon: ListRestart,
      title: "Dynamic Ranking",
      color: "bg-red-50 text-red-600",
      description: "The system automatically reorders the entire queue of 128 barangays in real-time as new assessments are submitted."
    }
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-12">
      <div className="text-center space-y-4">
         <h3 className="text-3xl font-bold text-slate-900">How the Weighted Priority Scheduler Works</h3>
         <p className="text-gray-500 max-w-2xl mx-auto">
           WPS automates disaster response prioritization to remove human bias and ensure resources 
           reach the most critical areas of Baguio City first.
         </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {steps.map((step, idx) => (
          <div key={idx} className="bg-white p-8 rounded-2xl border border-gray-100 space-y-4 relative">
             <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${step.color}`}>
                <step.icon size={24} />
             </div>
             <h4 className="text-lg font-bold text-slate-900 flex items-center gap-2">
               Step {idx + 1}: {step.title}
             </h4>
             <p className="text-gray-500 text-sm leading-relaxed">
               {step.description}
             </p>
             <div className="absolute top-6 right-8 text-4xl font-black text-gray-50 opacity-10">0{idx + 1}</div>
          </div>
        ))}
      </div>

      <div className="bg-slate-900 rounded-3xl p-8 text-white relative overflow-hidden">
         <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
               <h4 className="text-2xl font-bold">The Decision Engine</h4>
               <p className="text-slate-400 leading-relaxed text-sm">
                 The Weighted Sum Model (WSM) is a multi-criteria decision-making method. In WPS, it ensures that every barangay is evaluated against the same standard, providing an objective roadmap for emergency dispatch.
               </p>
               <ul className="space-y-3">
                  {[
                    "Zero manual tampering in ranking",
                    "Scientific normalization of impact",
                    "Real-time operational queueing",
                    "Scalable to all 128 Baguio barangays"
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm">
                       <CheckCircle2 size={16} className="text-green-500" />
                       {item}
                    </li>
                  ))}
               </ul>
            </div>
            <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
               <div className="flex items-center justify-between mb-6">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">WSM Formula</span>
                  <HelpCircle size={16} className="text-slate-500" />
               </div>
               <div className="bg-slate-900 p-6 rounded-xl text-center mb-6">
                  <p className="font-mono text-xl text-red-500 font-bold">S = Σ (w_i * r_ij)</p>
               </div>
               <div className="space-y-3">
                  <div className="flex justify-between text-xs">
                     <span className="text-slate-400">Casualties Weight</span>
                     <span className="text-white font-bold">33.3%</span>
                  </div>
                  <div className="flex justify-between text-xs">
                     <span className="text-slate-400">Families Weight</span>
                     <span className="text-white font-bold">33.3%</span>
                  </div>
                  <div className="flex justify-between text-xs">
                     <span className="text-slate-400">Houses Weight</span>
                     <span className="text-white font-bold">33.3%</span>
                  </div>
               </div>
            </div>
         </div>
         <div className="absolute top-0 right-0 w-64 h-64 bg-red-600/10 rounded-full blur-3xl -mr-20 -mt-20" />
      </div>
    </div>
  );
}

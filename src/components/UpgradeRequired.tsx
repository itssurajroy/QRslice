import React from "react";
import { Sparkles, Lock } from "lucide-react";

interface UpgradeRequiredProps {
  featureName: string;
  requiredTier: string;
}

export function UpgradeRequired({ featureName, requiredTier }: UpgradeRequiredProps) {
  return (
    <div className="max-w-3xl mx-auto mt-12 animate-fade-in-up">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8 text-center relative overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-emerald-100 rounded-full blur-3xl opacity-50" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-indigo-100 rounded-full blur-3xl opacity-50" />
        
        <div className="relative z-10 flex flex-col items-center">
          <div className="w-16 h-16 bg-gradient-to-tr from-slate-100 to-slate-200 rounded-2xl flex items-center justify-center mb-6 shadow-sm border border-slate-200">
            <Lock className="w-8 h-8 text-slate-400" />
          </div>
          
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mb-3">
            {featureName} is locked
          </h2>
          <p className="text-slate-500 text-sm sm:text-base max-w-md mx-auto mb-8 leading-relaxed">
            This powerful feature is exclusively available on the <span className="font-bold text-slate-900 capitalize">{requiredTier}</span> tier. Upgrade your restaurant to unlock this and scale your operations.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <a 
              href="mailto:support@qrslice.com?subject=Upgrade Request"
              className="px-6 py-3 bg-[#5738F5] hover:bg-[#4629D4] text-white font-bold rounded-xl shadow-md shadow-[#5738F5]/20 flex items-center gap-2 transition-all hover:scale-105 active:scale-95"
            >
              <Sparkles className="w-5 h-5 text-white/90" />
              Upgrade to {requiredTier}
            </a>
            <button
              type="button"
              onClick={() => window.history.back()}
              className="px-6 py-3 bg-white hover:bg-slate-50 text-slate-700 font-bold rounded-xl border border-slate-200 transition-colors"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

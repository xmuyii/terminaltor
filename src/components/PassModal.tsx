import React, { useState } from 'react';
import { X, Sparkles, Shield, Gamepad2, Award, Zap, Code2, Check, ArrowRight } from 'lucide-react';
import { Profile } from '../types';
import { SupabaseStore } from '../lib/supabase';

interface PassModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: Profile;
  onPassUpdated: (updatedProfile: Profile) => void;
}

export const PassModal: React.FC<PassModalProps> = ({
  isOpen,
  onClose,
  profile,
  onPassUpdated,
}) => {
  const [activeTab, setActiveTab] = useState<'perks' | 'stars'>('perks');
  const [starsInvoiceLogs, setStarsInvoiceLogs] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const handleTogglePass = () => {
    const updated = SupabaseStore.toggleProPass();
    onPassUpdated(updated);
  };

  const handleSimulateTelegramStarsInvoice = async () => {
    setIsProcessing(true);
    setStarsInvoiceLogs(null);

    const mockInvoice = {
      telegram_event: 'invoice_closed',
      status: 'paid',
      slug: `stars_pass_${profile.id}_${Date.now()}`,
      stars_amount: 2500,
      currency: 'XTR',
      user: {
        id: profile.id,
        username: profile.username,
      },
      item: 'Sovereign Creator Pass (Lifetime Access)',
      timestamp: new Date().toISOString(),
    };

    try {
      await new Promise((r) => setTimeout(r, 600));
      setStarsInvoiceLogs(JSON.stringify(mockInvoice, null, 2));

      // Unlock user profile with has_pro_pass = TRUE
      const updated = SupabaseStore.setProPassExplicit(true);
      onPassUpdated(updated);
    } catch (err: any) {
      setStarsInvoiceLogs(JSON.stringify({ error: err?.message || String(err) }, null, 2));
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-[#0c1222] border border-amber-500/40 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header Ribbon */}
        <div className="p-6 bg-gradient-to-r from-amber-950/40 via-amber-900/20 to-slate-900 border-b border-amber-800/40 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-black shadow-lg">
              <Sparkles className="w-6 h-6 fill-slate-950" />
            </div>
            <div>
              <div className="text-xs font-mono text-amber-400 font-bold uppercase tracking-wider">
                Full Access Gate
              </div>
              <h3 className="text-xl font-black text-slate-100">Sovereign Creator Pass</h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center gap-2 px-6 py-2.5 bg-slate-950/80 border-b border-slate-800/80 text-xs font-medium">
          <button
            type="button"
            onClick={() => setActiveTab('perks')}
            className={`px-3 py-1 rounded transition-colors cursor-pointer ${
              activeTab === 'perks'
                ? 'bg-amber-400 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Pass Benefits &amp; Status
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('stars')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded transition-colors cursor-pointer ${
              activeTab === 'stars'
                ? 'bg-amber-400 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Telegram Stars Invoice Pipeline</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 text-sm">
          {activeTab === 'perks' && (
            <>
              <p className="text-slate-300 leading-relaxed">
                Unlock advanced coding modules, capstone game projects, and verified digital certifications for aspiring computer scientists.
              </p>

              <div className="space-y-3">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Included with Creator Pass:
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-lg flex items-start gap-2.5">
                    <Gamepad2 className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-semibold text-slate-200">Level 5 RPG Engine Quest</div>
                      <div className="text-slate-400 text-[11px]">Turn-based battle state machine</div>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-lg flex items-start gap-2.5">
                    <Zap className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-semibold text-slate-200">Dedicated Pyodide Worker</div>
                      <div className="text-slate-400 text-[11px]">Zero UI thread stutters</div>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-lg flex items-start gap-2.5">
                    <Award className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-semibold text-slate-200">Verified Python Medal</div>
                      <div className="text-slate-400 text-[11px]">Cryptographic badge of completion</div>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-lg flex items-start gap-2.5">
                    <Shield className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-semibold text-slate-200">Offline-First Cloud Sync</div>
                      <div className="text-slate-400 text-[11px]">Zero progress loss on spotty connection</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Pricing & Test Action */}
              <div className="p-4 bg-amber-950/20 border border-amber-800/40 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="text-slate-400 text-xs">One-Time Student Lifetime Grant (Telegram Stars)</div>
                  <div className="text-2xl font-black text-amber-300 font-mono flex items-center gap-1.5">
                    <span>⭐️ 675 Stars</span>
                    <span className="text-xs text-slate-400 font-normal">/ lifetime (≈ ₦25,000)</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleTogglePass}
                  className={`px-5 py-2.5 rounded-lg font-bold text-xs transition-all shadow-md cursor-pointer ${
                    profile.has_pro_pass
                      ? 'bg-rose-900/80 hover:bg-rose-800 text-rose-200 border border-rose-700'
                      : 'bg-amber-400 hover:bg-amber-300 text-slate-950'
                  }`}
                >
                  {profile.has_pro_pass ? 'Deactivate Pass (Test Mode)' : 'Activate Pass (Instant Simulation)'}
                </button>
              </div>

              <div className="text-[11px] text-center text-slate-500">
                Current status: {profile.has_pro_pass ? 'Active Pass' : 'Standard Student Pass'} · Supabase RLS enforces tier gating.
              </div>
            </>
          )}

          {activeTab === 'stars' && (
            <div className="space-y-4 text-xs">
              <div>
                <h4 className="font-bold text-slate-200 mb-1">
                  Telegram Stars Invoice Architecture
                </h4>
                <p className="text-slate-400 leading-relaxed">
                  Purchases invoke <code className="text-amber-400 font-mono">window.Telegram.WebApp.openInvoice(url)</code> using the Telegram Stars currency (<code className="text-sky-300 font-mono">XTR</code>). Once settled, the webhook updates the user&apos;s record in Supabase with <code className="text-emerald-400 font-mono">has_pro_pass = TRUE</code>.
                </p>
              </div>

              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 font-mono text-[11px] text-slate-300 space-y-1">
                <div className="text-slate-500">// Event: telegram_invoice_closed</div>
                <div className="text-sky-400">Target User: {profile.id} ({profile.username})</div>
                <div className="text-amber-400">Stars Amount: ⭐️ 675 XTR (≈ ₦25,000)</div>
                <div className="text-emerald-400">Granted Field: has_pro_pass = TRUE</div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleSimulateTelegramStarsInvoice}
                  disabled={isProcessing}
                  className="flex items-center gap-2 px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-lg font-bold transition-all shadow-sm disabled:opacity-50 cursor-pointer"
                >
                  {isProcessing ? (
                    <span>Opening Telegram Stars Invoice...</span>
                  ) : (
                    <>
                      <span>Simulate Stars Invoice Payment (2,500 Stars)</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>

                {profile.has_pro_pass && (
                  <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                    <Check className="w-4 h-4" />
                    <span>User Unlocked</span>
                  </span>
                )}
              </div>

              {starsInvoiceLogs && (
                <div className="mt-3">
                  <div className="text-slate-400 font-bold mb-1">Telegram Stars Invoice Result:</div>
                  <pre className="p-3 bg-slate-950 border border-slate-800 rounded font-mono text-[11px] text-emerald-300 whitespace-pre-wrap">
                    {starsInvoiceLogs}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PassModal;

import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  Shield,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Sparkles,
  Users,
  ChevronLeft
} from 'lucide-react';
import { academyService, AcademyRecord } from '../lib/academyService';
import { Profile } from '../types';

interface AcademyJoinProps {
  currentProfile: Profile;
  initialCode?: string;
  onSuccess: () => void;
  onCancel?: () => void;
}

export const AcademyJoin: React.FC<AcademyJoinProps> = ({
  currentProfile,
  initialCode = '',
  onSuccess,
  onCancel,
}) => {
  const [joinCode, setJoinCode] = useState(initialCode);
  const [previewAcademy, setPreviewAcademy] = useState<AcademyRecord | null>(null);
  const [currentAlliance, setCurrentAlliance] = useState<AcademyRecord | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Check current alliance and inspect join code if provided
  useEffect(() => {
    academyService.getMyEnrolledAcademy(currentProfile.id).then((res) => {
      if (res) setCurrentAlliance(res.academy);
    });

    if (initialCode && initialCode.trim()) {
      academyService.getAcademyByJoinCode(initialCode).then((acad) => {
        setPreviewAcademy(acad);
      });
    }
  }, [currentProfile.id, initialCode]);

  const handleCodeChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const clean = e.target.value.toUpperCase();
    setJoinCode(clean);
    setErrorMsg(null);
    if (clean.length === 6) {
      const found = await academyService.getAcademyByJoinCode(clean);
      setPreviewAcademy(found);
    } else {
      setPreviewAcademy(null);
    }
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode.trim()) {
      setErrorMsg('Please enter a 6-character Alliance Join Code.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    const res = await academyService.joinAcademy(
      currentProfile.id,
      currentProfile.username,
      joinCode
    );

    setIsSubmitting(false);

    if (res.success && res.academy) {
      setSuccessMsg(`Welcome to ${res.academy.name}! Sovereign ${res.academy.subscription_plan.toUpperCase()} benefits unlocked.`);
      setTimeout(() => {
        onSuccess();
      }, 1500);
    } else {
      setErrorMsg(res.error || 'Failed to join academy.');
    }
  };

  const handleLeaveCurrent = async () => {
    if (!currentAlliance) return;
    const confirm = window.confirm(`Leave ${currentAlliance.name}? You will lose access to its seat benefits.`);
    if (!confirm) return;

    await academyService.leaveAcademy(currentProfile.id);
    setCurrentAlliance(null);
    setSuccessMsg('You have left your previous academy.');
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#f4fbf7] text-slate-800 p-4 sm:p-8 flex flex-col items-center justify-center">
      <div className="max-w-md w-full mx-auto space-y-6">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-emerald-700 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Back to Academy</span>
          </button>
        )}

        <div className="bg-white border border-emerald-200/90 rounded-2xl p-6 sm:p-8 shadow-md space-y-5">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 mb-1">
              <GraduationCap className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-extrabold text-slate-900">Join an Academy Alliance</h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              Enter your school or coding club's join code to receive instant Sovereign Premium access.
            </p>
          </div>

          {currentAlliance && (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-2">
              <div className="flex items-center gap-2 font-semibold">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Currently in {currentAlliance.name}</span>
              </div>
              <p className="text-[11px] text-amber-800">
                Students can only belong to 1 active academy at a time.
              </p>
              <button
                type="button"
                onClick={handleLeaveCurrent}
                className="text-[11px] font-bold text-rose-600 hover:text-rose-700 underline"
              >
                Leave {currentAlliance.name}
              </button>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleJoin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                <span>Alliance Join Code</span>
                <span className="text-[11px] text-emerald-700 font-mono font-bold">6 Characters</span>
              </label>
              <input
                type="text"
                value={joinCode}
                onChange={handleCodeChange}
                maxLength={6}
                placeholder="e.g. LOV300"
                required
                className="w-full px-4 py-3 bg-emerald-50/40 border border-emerald-200 rounded-xl font-mono text-xl font-extrabold text-emerald-900 tracking-widest text-center uppercase focus:bg-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Preview Card */}
            {previewAcademy && (
              <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/50 space-y-2 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-950">{previewAcademy.name}</span>
                  <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-emerald-200 text-emerald-900">
                    {previewAcademy.subscription_plan}
                  </span>
                </div>
                <div className="text-[11px] text-emerald-800 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Unlocks Tier 1–10 challenges &amp; 3 hints/day</span>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting || joinCode.length !== 6}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition-all shadow-md flex items-center justify-center gap-2 active:scale-95"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Enroll in Alliance Seat</span>
            </button>
          </form>

          <p className="text-[11px] text-slate-500 text-center leading-relaxed">
            Academy subscriptions are sponsored by your school or alliance owner. You will never be charged.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AcademyJoin;

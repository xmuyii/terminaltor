import React, { useState } from 'react';
import {
  GraduationCap,
  Shield,
  CheckCircle2,
  Users,
  Sparkles,
  ArrowRight,
  Zap,
  Lock,
  Building2,
  Award,
  ChevronLeft
} from 'lucide-react';
import { academyService } from '../lib/academyService';
import { Profile } from '../types';

interface AcademySignupProps {
  currentProfile: Profile;
  onSuccess: (academyId: string) => void;
  onCancel?: () => void;
}

export const AcademySignup: React.FC<AcademySignupProps> = ({
  currentProfile,
  onSuccess,
  onCancel,
}) => {
  const [plan, setPlan] = useState<'premium' | 'pro'>('premium');
  const [academyName, setAcademyName] = useState('');
  const [billingEmail, setBillingEmail] = useState(`${currentProfile?.username?.toLowerCase() || 'admin'}@school.edu.ng`);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const priceFormatted = plan === 'pro' ? '⭐️ 2,000 Stars' : '⭐️ 675 Stars';
  const seatCap = plan === 'pro' ? 100 : 30;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!academyName.trim()) {
      setErrorMsg('Please enter an Academy or School name.');
      return;
    }

    setIsProcessing(true);
    setErrorMsg(null);

    try {
      // Simulate Telegram Stars invoice billing & enrollment
      await new Promise((r) => setTimeout(r, 800));

      const newAcademy = await academyService.createAcademy({
        name: academyName,
        owner_id: currentProfile.id || 'usr_sovereign_cadet',
        plan,
        billing_email: billingEmail,
        paystack_ref: `STARS_ACAD_${Date.now()}`,
      });

      setIsProcessing(false);
      onSuccess(newAcademy.id);
    } catch (err: any) {
      setIsProcessing(false);
      setErrorMsg(err.message || 'Payment initiation failed. Please try again.');
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#f4fbf7] text-slate-800 p-4 sm:p-8 flex flex-col items-center">
      <div className="max-w-4xl w-full mx-auto space-y-8">
        {/* Top Header */}
        <div className="flex items-center justify-between">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-emerald-700 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
          )}
          <div className="flex items-center gap-2 text-xs font-mono font-semibold text-emerald-800 bg-emerald-100/80 px-3 py-1 rounded-full ml-auto">
            <Building2 className="w-3.5 h-3.5" />
            <span>B2B2C Institutional Alliance</span>
          </div>
        </div>

        {/* Hero */}
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 mb-2">
            <GraduationCap className="w-7 h-7" />
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Register Your Academy Alliance
          </h1>
          <p className="text-sm text-slate-600 leading-relaxed">
            One flat monthly subscription granting Sovereign Premium or Pro to every enrolled student.
            Students battle collectively in Multiplayer Arcades under your school alliance banner!
          </p>
        </div>

        {/* Plan Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {/* Plan 1: Academy Premium */}
          <div
            onClick={() => setPlan('premium')}
            className={`p-6 rounded-2xl border cursor-pointer transition-all relative ${
              plan === 'premium'
                ? 'bg-white border-emerald-500 ring-2 ring-emerald-500/20 shadow-lg'
                : 'bg-white/80 border-slate-200 hover:border-emerald-300'
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md">
                Standard School Cohort
              </span>
              <Users className="w-5 h-5 text-emerald-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">Academy Premium</h3>
            <div className="mt-2 mb-4">
              <span className="text-3xl font-extrabold text-slate-900">⭐️ 675</span>
              <span className="text-xs text-slate-500 font-medium"> Stars / month flat (≈ ₦25,000)</span>
            </div>
            <p className="text-xs text-slate-600 mb-6">
              Ideal for single secondary school classrooms and specialized STEM clubs.
            </p>
            <div className="space-y-2.5 text-xs text-slate-700 border-t border-slate-100 pt-4">
              <div className="flex items-center gap-2 font-semibold text-slate-900">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Up to 30 Student Seats Included</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Unlocks Tier 1–10 Challenges for all 30</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>3 AI Hint Tiers / Day per student</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>All 4 Leaderboards (Daily, Weekly, Monthly, All-Time)</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Multiplayer Arcade Alliance Banner</span>
              </div>
            </div>
          </div>

          {/* Plan 2: Academy Pro */}
          <div
            onClick={() => setPlan('pro')}
            className={`p-6 rounded-2xl border cursor-pointer transition-all relative ${
              plan === 'pro'
                ? 'bg-white border-amber-500 ring-2 ring-amber-500/20 shadow-lg'
                : 'bg-white/80 border-slate-200 hover:border-amber-300'
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2.5 py-1 rounded-md">
                Full Grade / High School
              </span>
              <Sparkles className="w-5 h-5 text-amber-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">Academy Pro</h3>
            <div className="mt-2 mb-4">
              <span className="text-3xl font-extrabold text-slate-900">⭐️ 2,000</span>
              <span className="text-xs text-slate-500 font-medium"> Stars / month flat (≈ ₦75,000)</span>
            </div>
            <p className="text-xs text-slate-600 mb-6">
              Complete department access for high schools, boarding academies, and coding bootcamps.
            </p>
            <div className="space-y-2.5 text-xs text-slate-700 border-t border-slate-100 pt-4">
              <div className="flex items-center gap-2 font-semibold text-slate-900">
                <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Up to 100 Student Seats Included</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Unlocks Tier 1–10 Challenges for all 100</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0" />
                <span>5 AI Hint Tiers / Day per student</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0" />
                <span>3 Streak Freezes / Month per student</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Priority Teacher Dashboard &amp; Gradebook Export</span>
              </div>
            </div>
          </div>
        </div>

        {/* Enrollment Checkout Form */}
        <div className="bg-white border border-emerald-200/90 rounded-2xl p-6 sm:p-8 max-w-xl mx-auto shadow-md">
          <div className="mb-6">
            <h4 className="text-base font-bold text-slate-900">School &amp; Billing Details</h4>
            <p className="text-xs text-slate-500">
              Selected Plan: <strong>{plan === 'pro' ? 'Academy Pro (100 Seats)' : 'Academy Premium (30 Seats)'}</strong> at {priceFormatted}/mo
            </p>
          </div>

          {errorMsg && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Alliance / Academy Name *
              </label>
              <input
                type="text"
                value={academyName}
                onChange={(e) => setAcademyName(e.target.value)}
                placeholder="e.g. King's College Lagos - Coding Guild"
                required
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Official Billing / Administrator Email *
              </label>
              <input
                type="email"
                value={billingEmail}
                onChange={(e) => setBillingEmail(e.target.value)}
                placeholder="principal@kingscollege.edu.ng"
                required
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isProcessing}
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
              >
                {isProcessing ? (
                  <span>Processing Telegram Stars Subscription...</span>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>Subscribe via Telegram Stars ({priceFormatted}/mo)</span>
                  </>
                )}
              </button>
            </div>

            <p className="text-[11px] text-slate-500 text-center leading-relaxed">
              Secured by Telegram Stars (XTR). Billed monthly. Cancel anytime from your Academy Owner Dashboard.
              When an academy lapses, students gracefully return to their personal tiers with no loss of progress.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AcademySignup;

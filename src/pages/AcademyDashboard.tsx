import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  Users,
  Copy,
  Check,
  Shield,
  Trash2,
  Sparkles,
  ArrowLeft,
  Calendar,
  CreditCard,
  AlertTriangle,
  Award,
  Zap,
  CheckCircle2,
  RefreshCw,
  ExternalLink,
  Trophy,
  Flame,
  TrendingUp,
  Lock,
  KeyRound,
  ArrowRight
} from 'lucide-react';
import {
  academyService,
  AcademyRecord,
  AcademyMemberRecord,
  MonthlyAcademyStanding,
} from '../lib/academyService';
import { Profile } from '../types';
import { telegramAuth } from '../lib/telegramAuth';

interface AcademyDashboardProps {
  currentProfile: Profile;
  academyId?: string;
  onBackToApp: () => void;
  onNavigateToSignup?: () => void;
  onNavigateToJoin?: () => void;
  onProfileUpdated?: (updated: Profile) => void;
}

export const AcademyDashboard: React.FC<AcademyDashboardProps> = ({
  currentProfile,
  academyId,
  onBackToApp,
  onNavigateToSignup,
  onNavigateToJoin,
  onProfileUpdated,
}) => {
  const [academy, setAcademy] = useState<AcademyRecord | null>(null);
  const [members, setMembers] = useState<AcademyMemberRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Instructor Passcode gate state
  const [passcodeInput, setPasscodeInput] = useState('');
  const [passcodeError, setPasscodeError] = useState<string | null>(null);

  // Student join code state
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [joinStatusMsg, setJoinStatusMsg] = useState<{ success: boolean; text: string } | null>(null);

  // Monthly Academy Leaderboard tab state
  const [leagueTab, setLeagueTab] = useState<'current_month' | 'last_month'>('current_month');
  const [currentMonthStandings, setCurrentMonthStandings] = useState<MonthlyAcademyStanding[]>([]);
  const [lastMonthStandings, setLastMonthStandings] = useState<MonthlyAcademyStanding[]>([]);

  const isInstructor =
    currentProfile.role === 'instructor' || currentProfile.role === 'teacher' || currentProfile.role === 'admin';

  const loadData = async () => {
    try {
      setLoading(true);
      let target: AcademyRecord | null = null;

      if (academyId) {
        target = await academyService.getAcademyById(academyId);
      }

      if (!target) {
        // Look up my enrolled academy first
        const myEnrolled = await academyService.getMyEnrolledAcademy(currentProfile.id);
        if (myEnrolled) {
          target = myEnrolled.academy;
        } else {
          // Look up if user owns any academy
          const all = await academyService.getAcademies();
          target = all.find((a) => a.owner_id === currentProfile.id) || null;
        }
      }

      if (target) {
        setAcademy(target);
        const mems = await academyService.getAcademyMembers(target.id);
        setMembers(mems);
      } else {
        setAcademy(null);
        setMembers([]);
      }

      setCurrentMonthStandings(academyService.getCurrentMonthLeaderboard());
      setLastMonthStandings(academyService.getLastMonthLeaderboard());
    } catch (err) {
      console.warn('Error loading academy dashboard:', err);
      setAcademy(null);
      setMembers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [academyId, currentProfile.id]);

  const handleCopyCode = () => {
    if (!academy) return;
    navigator.clipboard.writeText(academy.join_code || academy.joinCode || '');
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyLink = () => {
    if (!academy) return;
    const link = `${window.location.origin}#join-academy-${academy.join_code || academy.joinCode || ''}`;
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleVerifyPasscode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!passcodeInput.trim()) return;
    const res = telegramAuth.verifyInstructorPasscode(passcodeInput);
    if (res.success) {
      setPasscodeError(null);
      const updated = { ...currentProfile, role: 'instructor' as const };
      onProfileUpdated?.(updated);
      loadData();
    } else {
      setPasscodeError(res.message || 'Incorrect passcode. Try INSTRUCTOR2026');
    }
  };

  const handleJoinAcademy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCodeInput.trim()) return;
    setJoinStatusMsg(null);
    const res = await academyService.joinAcademy(joinCodeInput, currentProfile.id, currentProfile.username);
    if (res.success && res.academy) {
      setJoinStatusMsg({ success: true, text: res.message });
      setAcademy(res.academy);
      await loadData();
    } else {
      setJoinStatusMsg({ success: false, text: res.message || 'Invalid academy code.' });
    }
  };

  const handleRemoveStudent = async (userId: string, username: string) => {
    if (!academy) return;
    const confirm = window.confirm(
      `Remove ${username} from this Academy? This will vacate their student seat and revert them to their individual tier.`
    );
    if (!confirm) return;

    await academyService.removeMember(academy.id, userId);
    setStatusMessage(`Removed ${username}. 1 student seat vacated.`);
    setTimeout(() => setStatusMessage(null), 3000);
    await loadData();
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-[#f4fbf7]">
        <div className="flex items-center gap-3 text-emerald-800 font-semibold text-sm">
          <RefreshCw className="w-5 h-5 animate-spin" />
          <span>Verifying Academy Alliance Entitlements...</span>
        </div>
      </div>
    );
  }

  // =========================================================================
  // GATED ACCESS: Normal player without paid academy or instructor code
  // =========================================================================
  if (!academy && !isInstructor) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-[#070b14] text-slate-100 p-4 sm:p-8 flex flex-col items-center justify-center">
        <div className="max-w-2xl w-full mx-auto space-y-6 text-center">
          <button
            type="button"
            onClick={onBackToApp}
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer self-start mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Home</span>
          </button>

          <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-amber-500/10 border-2 border-amber-500/40 text-amber-400 shadow-xl shadow-amber-500/10">
            <Lock className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-mono font-bold uppercase tracking-wider">
              <span>Restricted Institutional Access</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Academy Alliances Gated
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-xl mx-auto">
              Academy Alliances provide multi-seat institutional licenses for schools, bootcamps, and coding clubs.
              A normal player cannot enter this section without first paying for an Academy Alliance or having their school give them an invite or instructor code.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left pt-2">
            {/* Action 1: Register and Pay */}
            <div className="p-5 rounded-2xl bg-slate-900/90 border border-emerald-500/40 space-y-3 flex flex-col justify-between">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider">
                  <Shield className="w-4 h-4" />
                  <span>Option 1: School Alliance</span>
                </div>
                <h3 className="text-sm font-bold text-white">Register &amp; Pay for Academy</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Flat ⭐️ 675 Stars/month (≈ ₦25,000) for 30 enrolled students. Instant owner &amp; instructor status.
                </p>
              </div>

              <button
                type="button"
                onClick={onNavigateToSignup}
                className="w-full py-2.5 px-4 bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 font-black text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Register Academy (⭐️ 675/mo)</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Action 2: Enter Student Code */}
            <div className="p-5 rounded-2xl bg-slate-900/90 border border-sky-500/40 space-y-3">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-bold text-sky-400 uppercase tracking-wider">
                  <GraduationCap className="w-4 h-4" />
                  <span>Option 2: Student Join Code</span>
                </div>
                <h3 className="text-sm font-bold text-white">Join via School Invite</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Enter the 8-character invite code issued by your teacher or academy coordinator.
                </p>
              </div>

              <form onSubmit={handleJoinAcademy} className="space-y-2">
                <input
                  type="text"
                  value={joinCodeInput}
                  onChange={(e) => setJoinCodeInput(e.target.value)}
                  placeholder="e.g. ACAD-4921"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-sky-500 font-mono uppercase tracking-wider text-center"
                />
                <button
                  type="submit"
                  className="w-full py-2 bg-sky-500 hover:bg-sky-400 active:scale-95 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-md cursor-pointer"
                >
                  Join Academy Alliance
                </button>
                {joinStatusMsg && (
                  <p
                    className={`text-[11px] font-semibold text-center ${
                      joinStatusMsg.success ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {joinStatusMsg.text}
                  </p>
                )}
              </form>
            </div>
          </div>

          {/* Action 3: Instructor Passcode Unlock */}
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 text-left space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
              <KeyRound className="w-4 h-4 text-amber-400" />
              <span>Are you an Academy Instructor or Staff Member?</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Enter your verified institution passcode to unlock administrative privileges.
            </p>
            <form onSubmit={handleVerifyPasscode} className="flex gap-2 pt-1">
              <input
                type="text"
                value={passcodeInput}
                onChange={(e) => setPasscodeInput(e.target.value)}
                placeholder="Passcode (e.g. INSTRUCTOR2026)"
                className="flex-1 px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 font-mono uppercase"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-amber-400 hover:bg-amber-300 active:scale-95 text-slate-950 font-bold text-xs rounded-xl transition-all cursor-pointer whitespace-nowrap"
              >
                Verify Code
              </button>
            </form>
            {passcodeError && <p className="text-xs text-rose-400">{passcodeError}</p>}
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // ACTIVE ACADEMY DASHBOARD: Render genuine academy details
  // =========================================================================
  const activeAcademy = academy || {
    id: `acad_owner_${currentProfile.id}`,
    name: 'Registered Academy Alliance',
    join_code: 'ACTIVE-ALLIANCE',
    seat_cap: 30,
    subscription_plan: 'pro',
    owner_id: currentProfile.id,
  };

  const seatsUsed = members.length;
  const seatCap = activeAcademy.seat_cap || activeAcademy.seats_total || 30;
  const seatsRemaining = Math.max(0, seatCap - seatsUsed);
  const occupancyPercent = Math.min(100, Math.round((seatsUsed / seatCap) * 100));
  const totalAllianceXp = members.reduce((acc, m) => acc + (m.xp_points || 0), 0);
  const totalChallengesSolved = members.reduce((acc, m) => acc + (m.challenges_solved || 0), 0);

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#f4fbf7] text-slate-800 p-4 sm:p-8">
      <div className="max-w-6xl w-full mx-auto space-y-8">
        {/* Top Header & Back Navigation */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-emerald-200">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBackToApp}
              className="p-2 rounded-xl hover:bg-emerald-100/70 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
              title="Return to Home"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-emerald-800 uppercase tracking-widest bg-emerald-100 px-2 py-0.5 rounded">
                  {activeAcademy.subscription_plan?.toUpperCase() || 'PRO'} ALLIANCE
                </span>
                <span className="text-xs text-slate-500 font-mono">ID: {activeAcademy.id}</span>
              </div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-0.5">
                {activeAcademy.name}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyLink}
              className="flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-slate-50 border border-emerald-300 text-emerald-800 font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
            >
              {copiedLink ? <Check className="w-4 h-4 text-emerald-600" /> : <ExternalLink className="w-4 h-4" />}
              <span>{copiedLink ? 'Link Copied!' : 'Copy Student Invite Link'}</span>
            </button>

            <button
              type="button"
              onClick={handleCopyCode}
              className="flex items-center gap-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
            >
              {copiedCode ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span className="font-mono">{copiedCode ? 'Copied' : activeAcademy.join_code || activeAcademy.joinCode}</span>
            </button>
          </div>
        </div>

        {statusMessage && (
          <div className="p-3 rounded-xl bg-emerald-100 border border-emerald-300 text-emerald-900 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>{statusMessage}</span>
          </div>
        )}

        {/* 4 Analytics Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-white border border-emerald-200 shadow-xs space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <span>Seats Occupied</span>
              <Users className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black font-mono text-slate-900">{seatsUsed}</span>
              <span className="text-xs text-slate-500 font-medium">/ {seatCap} max</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
              <div className="bg-emerald-500 h-full rounded-full transition-all" style={{ width: `${occupancyPercent}%` }} />
            </div>
            <span className="text-[11px] text-slate-500 font-medium block">
              {seatsRemaining} seats remaining for new cadets
            </span>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-emerald-200 shadow-xs space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <span>Total Alliance XP</span>
              <Zap className="w-4 h-4 text-amber-500" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black font-mono text-amber-700">{totalAllianceXp.toLocaleString()}</span>
              <span className="text-xs text-amber-600 font-bold">XP</span>
            </div>
            <span className="text-[11px] text-slate-500 font-medium block">
              Combined score from all registered cadets
            </span>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-emerald-200 shadow-xs space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <span>Challenges Conquered</span>
              <Award className="w-4 h-4 text-sky-600" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black font-mono text-sky-800">{totalChallengesSolved.toLocaleString()}</span>
              <span className="text-xs text-slate-500 font-medium">quests</span>
            </div>
            <span className="text-[11px] text-slate-500 font-medium block">
              Pyodide modules verified and completed
            </span>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-emerald-200 shadow-xs space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <span>Entitlement Tier</span>
              <Shield className="w-4 h-4 text-purple-600" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-purple-800 uppercase font-mono">
                {activeAcademy.subscription_plan || 'Pro'}
              </span>
            </div>
            <span className="text-[11px] text-slate-500 font-medium block">
              Unlocks Tier 6–10 Pro Quests for all enrolled seats
            </span>
          </div>
        </div>

        {/* Enrolled Students Table */}
        <div className="bg-white border border-emerald-200 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">Enrolled Academy Students</h3>
              <p className="text-xs text-slate-500">
                Students receive instant {activeAcademy.subscription_plan?.toUpperCase() || 'PRO'} tier benefits while holding an active seat.
              </p>
            </div>
            <span className="text-xs font-mono font-semibold text-slate-600 bg-slate-100 px-3 py-1 rounded-lg">
              {seatsUsed} of {seatCap} Seats Filled
            </span>
          </div>

          {members.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <Users className="w-8 h-8 text-slate-400 mx-auto" />
              <div className="font-bold text-slate-700 text-sm">No Students Enrolled Yet</div>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Share your invite code <code className="font-mono font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">{activeAcademy.join_code || activeAcademy.joinCode}</code> with your students to populate your alliance roster.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-emerald-100 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                    <th className="py-2.5 px-3">Student Handle</th>
                    <th className="py-2.5 px-3">Student User ID</th>
                    <th className="py-2.5 px-3 text-right">Points</th>
                    <th className="py-2.5 px-3 text-right">Quests Solved</th>
                    <th className="py-2.5 px-3 text-right">Last Active</th>
                    <th className="py-2.5 px-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {members.map((m) => (
                    <tr key={m.id} className="hover:bg-slate-50">
                      <td className="py-3 px-3 font-semibold text-slate-900">
                        {m.username}
                        {m.user_id === currentProfile.id && (
                          <span className="ml-2 text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded">
                            You
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-500 text-[11px]">{m.user_id}</td>
                      <td className="py-3 px-3 font-mono text-right text-emerald-700 font-semibold">
                        {m.xp_points || 0} XP
                      </td>
                      <td className="py-3 px-3 font-mono text-right text-slate-700">
                        {m.challenges_solved || 0}
                      </td>
                      <td className="py-3 px-3 font-mono text-right text-slate-500 text-[11px]">
                        {m.last_active || m.joined_at}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveStudent(m.user_id || m.userId || '', m.username)}
                          className="p-1 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded transition-colors cursor-pointer"
                          title="Vacate seat"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Subscription & Billing Details */}
        <div className="bg-white border border-emerald-200 rounded-2xl p-6 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-emerald-600" />
              <h3 className="text-sm font-bold text-slate-900">Institutional Billing &amp; Invoices</h3>
            </div>
            <span className="text-xs font-mono font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
              ⭐️ 675 Stars / month
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Next renewal on <strong>{activeAcademy.next_billing_date || 'Next monthly cycle'}</strong> via Telegram Stars recurring invoice.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AcademyDashboard;

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
} from 'lucide-react';
import {
  academyService,
  AcademyRecord,
  AcademyMemberRecord,
  MonthlyAcademyStanding,
  DEFAULT_ACADEMY,
  DEFAULT_MEMBERS,
} from '../lib/academyService';
import { Profile } from '../types';

interface AcademyDashboardProps {
  currentProfile: Profile;
  academyId?: string;
  onBackToApp: () => void;
  onNavigateToSignup?: () => void;
}

export const AcademyDashboard: React.FC<AcademyDashboardProps> = ({
  currentProfile,
  academyId,
  onBackToApp,
  onNavigateToSignup,
}) => {
  const [academy, setAcademy] = useState<AcademyRecord | null>(() => DEFAULT_ACADEMY);
  const [members, setMembers] = useState<AcademyMemberRecord[]>(() => DEFAULT_MEMBERS);
  const [loading, setLoading] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Monthly Academy Leaderboard tab state
  const [leagueTab, setLeagueTab] = useState<'current_month' | 'last_month'>('current_month');
  const [currentMonthStandings, setCurrentMonthStandings] = useState<MonthlyAcademyStanding[]>(() =>
    academyService.getCurrentMonthLeaderboard()
  );
  const [lastMonthStandings, setLastMonthStandings] = useState<MonthlyAcademyStanding[]>(() =>
    academyService.getLastMonthLeaderboard()
  );

  const loadData = async () => {
    try {
      let target = academyId ? await academyService.getAcademyById(academyId) : null;
      if (!target) {
        const all = await academyService.getAcademies();
        target = all.find((a) => a.owner_id === currentProfile.id) || all[0] || DEFAULT_ACADEMY;
      }

      if (target) {
        setAcademy(target);
        const mems = await academyService.getAcademyMembers(target.id);
        setMembers(mems.length > 0 ? mems : DEFAULT_MEMBERS);
      }
    } catch (err) {
      console.warn('Error loading academy dashboard:', err);
      // Fallback safely to default academy
      setAcademy(DEFAULT_ACADEMY);
      setMembers(DEFAULT_MEMBERS);
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

  const handleRemoveStudent = async (userId: string, username: string) => {
    if (!academy) return;
    const confirm = window.confirm(`Remove ${username} from this Academy? This will vacate their student seat and revert them to their individual tier.`);
    if (!confirm) return;

    await academyService.removeMember(academy.id, userId);
    setStatusMessage(`Removed ${username}. 1 student seat vacated.`);
    setTimeout(() => setStatusMessage(null), 3000);
    await loadData();
  };

  if (loading && !academy) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-[#f4fbf7]">
        <div className="flex items-center gap-3 text-emerald-800 font-semibold text-sm">
          <RefreshCw className="w-5 h-5 animate-spin" />
          <span>Loading Academy Alliance Dashboard...</span>
        </div>
      </div>
    );
  }

  const activeAcademy = academy || DEFAULT_ACADEMY;
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
              className="p-2 rounded-xl bg-white hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 border border-slate-200 transition-colors shadow-xs"
              title="Return to Home"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  {activeAcademy.name}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold font-mono uppercase bg-emerald-100 text-emerald-800 border border-emerald-300">
                  {activeAcademy.subscription_plan}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                B2B2C Seat Alliance · All enrolled students unlock Sovereign Premium &amp; Pro tiers
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {onNavigateToSignup && (
              <button
                type="button"
                onClick={onNavigateToSignup}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition-all shadow-xs flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>New Academy (₦25,000/mo)</span>
              </button>
            )}
          </div>
        </div>

        {/* Status Toast */}
        {statusMessage && (
          <div className="p-3 bg-emerald-100 border border-emerald-300 text-emerald-900 text-xs font-semibold rounded-xl flex items-center gap-2 shadow-xs animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{statusMessage}</span>
          </div>
        )}

        {/* 3 Metric Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Seat Occupancy */}
          <div className="bg-white border border-emerald-200/90 rounded-2xl p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
              <span>Seat Allocation</span>
              <Users className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-slate-900">{seatsUsed}</span>
              <span className="text-xs text-slate-500">/ {seatCap} max seats</span>
            </div>
            {/* Progress Bar */}
            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  occupancyPercent > 90 ? 'bg-amber-500' : 'bg-emerald-500'
                }`}
                style={{ width: `${occupancyPercent}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
              <span>{seatsRemaining} seats remaining</span>
              <span className="font-semibold text-slate-700">{occupancyPercent}% Occupied</span>
            </div>
          </div>

          {/* Card 2: Student Join Code */}
          <div className="bg-white border border-emerald-200/90 rounded-2xl p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
              <span>Alliance Join Code</span>
              <Shield className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-mono font-extrabold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-xl">
                {activeAcademy.join_code}
              </span>
              <button
                type="button"
                onClick={handleCopyCode}
                className="p-2 rounded-xl bg-slate-50 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 border border-slate-200 transition-colors"
                title="Copy Code"
              >
                {copiedCode ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            <button
              type="button"
              onClick={handleCopyLink}
              className="w-full py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-semibold text-xs rounded-xl border border-emerald-200 transition-colors flex items-center justify-center gap-1.5"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedLink ? 'Link Copied to Clipboard!' : 'Copy Direct Student Join Link'}</span>
            </button>
          </div>

          {/* Card 3: Alliance Scoreboard */}
          <div className="bg-white border border-emerald-200/90 rounded-2xl p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
              <span>Alliance Power Ranking</span>
              <Award className="w-4 h-4 text-amber-500" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-amber-600">{totalAllianceXp.toLocaleString()}</span>
              <span className="text-xs text-slate-500">Total Alliance XP</span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-100 pt-2">
              <span>{totalChallengesSolved} Solved Puzzles</span>
              <span className="font-semibold text-emerald-700">Top 5% Alliances</span>
            </div>
          </div>
        </div>

        {/* SECTION: Top Academies of the Month Leaderboard */}
        <div className="bg-white border border-emerald-200/90 rounded-2xl p-6 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-500" />
                <h3 className="text-base font-bold text-slate-900">Monthly Academy Alliance League</h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Top academies ranked by aggregate points. Last month&apos;s champions stand honored while the live battle for this month progresses!
              </p>
            </div>

            {/* Toggle Tabs: Current Month Live Battle vs Last Month Champions */}
            <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-bold gap-1 self-start sm:self-center">
              <button
                type="button"
                onClick={() => setLeagueTab('current_month')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition-all ${
                  leagueTab === 'current_month'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Flame className="w-3.5 h-3.5 text-amber-300" />
                <span>Current Month (Live Battle)</span>
              </button>

              <button
                type="button"
                onClick={() => setLeagueTab('last_month')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition-all ${
                  leagueTab === 'last_month'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Trophy className="w-3.5 h-3.5 text-amber-300" />
                <span>Last Month Champions</span>
              </button>
            </div>
          </div>

          {/* Leaderboard Table */}
          <div className="overflow-x-auto border border-emerald-100 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-emerald-50/70 border-b border-emerald-100 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Rank</th>
                  <th className="py-3 px-4">Academy Alliance</th>
                  <th className="py-3 px-4 text-center">Active Students</th>
                  <th className="py-3 px-4 text-right">Challenges Solved</th>
                  <th className="py-3 px-4 text-right">Alliance Points</th>
                  <th className="py-3 px-4 text-center">Honors</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-emerald-50">
                {(leagueTab === 'current_month' ? currentMonthStandings : lastMonthStandings).map((standing) => {
                  const isCurrentAcademy = standing.academyId === activeAcademy.id;
                  return (
                    <tr
                      key={standing.academyId}
                      className={`transition-colors ${
                        isCurrentAcademy ? 'bg-emerald-50/80 font-bold text-emerald-950' : 'hover:bg-slate-50'
                      }`}
                    >
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-700">
                        {standing.rank === 1 ? '🥇 1' : standing.rank === 2 ? '🥈 2' : standing.rank === 3 ? '🥉 3' : `#${standing.rank}`}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">{standing.academyName}</span>
                          {isCurrentAcademy && (
                            <span className="text-[10px] bg-emerald-600 text-white px-1.5 py-0.2 rounded font-bold">
                              Your Alliance
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono text-slate-600 font-semibold">
                        {standing.activeStudents} cadets
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-slate-700">
                        {standing.challengesSolved.toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-black text-emerald-800 text-sm">
                        {standing.points.toLocaleString()} pts
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {standing.badge ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                            {standing.badge}
                          </span>
                        ) : (
                          <span className="text-slate-400 font-mono text-[10px]">Ranked</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Enrolled Students Table */}
        <div className="bg-white border border-emerald-200/90 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">Enrolled Academy Students</h3>
              <p className="text-xs text-slate-500">
                Students receive instant {activeAcademy.subscription_plan.toUpperCase()} tier benefits as long as they hold an active seat.
              </p>
            </div>
            <span className="text-xs font-mono font-semibold text-slate-600 bg-slate-100 px-3 py-1 rounded-lg">
              {seatsUsed} of {seatCap} Seats Filled
            </span>
          </div>

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
                        className="p-1 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded transition-colors"
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
        </div>

        {/* Subscription & Billing Details */}
        <div className="bg-white border border-emerald-200/90 rounded-2xl p-6 shadow-xs space-y-3">
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
            Next renewal on <strong>{activeAcademy.next_billing_date || 'Next billing cycle'}</strong> via Telegram Stars recurring invoice.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AcademyDashboard;

import React, { useState, useEffect } from 'react';
import {
  Users,
  BookOpen,
  Award,
  Plus,
  Copy,
  Check,
  Download,
  AlertCircle,
  HelpCircle,
  Calendar,
  Sparkles,
  ArrowLeft,
  Trash2,
  CheckCircle2,
  Clock,
  Flame,
  Shield,
  GraduationCap
} from 'lucide-react';
import { ClassroomService, Cohort, CohortMember, Assignment, GradebookRow, CohortHintActivity } from '../lib/classroomService';
import { QUESTS } from '../data/quests';
import { Profile } from '../types';

interface TeacherDashboardProps {
  currentProfile: Profile;
  onSelectQuest?: (questId: string) => void;
  onBackToApp?: () => void;
}

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({
  currentProfile,
  onSelectQuest,
  onBackToApp
}) => {
  const [cohorts, setCohorts] = useState<Array<Cohort & { role: 'student' | 'teacher' }>>([]);
  const [selectedCohort, setSelectedCohort] = useState<Cohort | null>(null);
  const [activeTab, setActiveTab] = useState<'members' | 'assignments' | 'gradebook' | 'hints'>('members');
  
  // Data for selected cohort
  const [members, setMembers] = useState<CohortMember[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [gradebook, setGradebook] = useState<{ assignments: Assignment[]; rows: GradebookRow[] }>({ assignments: [], rows: [] });
  const [hintActivity, setHintActivity] = useState<CohortHintActivity | null>(null);

  // Modals
  const [showCreateCohortModal, setShowCreateCohortModal] = useState<boolean>(false);
  const [newCohortName, setNewCohortName] = useState<string>('');
  const [showJoinCohortModal, setShowJoinCohortModal] = useState<boolean>(false);
  const [joinCodeInput, setJoinCodeInput] = useState<string>('');
  const [joinError, setJoinError] = useState<string | null>(null);

  const [showNewAssignmentModal, setShowNewAssignmentModal] = useState<boolean>(false);
  const [assignmentTitle, setAssignmentTitle] = useState<string>('');
  const [assignmentDesc, setAssignmentDesc] = useState<string>('');
  const [assignmentDueDays, setAssignmentDueDays] = useState<number>(7);
  const [selectedChallengeIds, setSelectedChallengeIds] = useState<string[]>(['quest-1']);

  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const isTeacher = currentProfile.role === 'teacher' || currentProfile.role === 'instructor' || currentProfile.has_pro_pass;

  // Load user cohorts
  const refreshCohorts = () => {
    const list = ClassroomService.getUserCohorts(currentProfile.id);
    setCohorts(list);
    if (selectedCohort) {
      const refreshed = list.find((c) => c.id === selectedCohort.id);
      if (refreshed) setSelectedCohort(refreshed);
    }
  };

  useEffect(() => {
    ClassroomService.initDefaults();
    refreshCohorts();
  }, [currentProfile.id]);

  // Load selected cohort details
  useEffect(() => {
    if (!selectedCohort) return;

    try {
      const mems = ClassroomService.getCohortMembers(selectedCohort.id, currentProfile.id);
      setMembers(mems);
    } catch {
      // If student, get member count or public list
      const allMembers = ClassroomService.getMembers().filter((m) => m.cohort_id === selectedCohort.id);
      setMembers(allMembers);
    }

    const assigns = ClassroomService.getCohortAssignments(selectedCohort.id, currentProfile.id);
    setAssignments(assigns);

    try {
      const gb = ClassroomService.getGradebook(selectedCohort.id, currentProfile.id);
      setGradebook(gb);
    } catch {
      setGradebook({ assignments: [], rows: [] });
    }

    try {
      const hints = ClassroomService.getCohortHintActivity(selectedCohort.id, currentProfile.id);
      setHintActivity(hints);
    } catch {
      setHintActivity(null);
    }
  }, [selectedCohort, currentProfile.id]);

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleCreateCohort = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCohortName.trim()) return;

    const created = ClassroomService.createCohort(currentProfile.id, newCohortName.trim());
    setNewCohortName('');
    setShowCreateCohortModal(false);
    refreshCohorts();
    setSelectedCohort(created);
  };

  const handleJoinCohort = (e: React.FormEvent) => {
    e.preventDefault();
    setJoinError(null);
    const res = ClassroomService.joinCohort(currentProfile.id, joinCodeInput);
    if (!res.success) {
      setJoinError(res.message || 'Failed to join cohort.');
      return;
    }

    setJoinCodeInput('');
    setShowJoinCohortModal(false);
    refreshCohorts();
    if (res.cohort) setSelectedCohort(res.cohort);
  };

  const handleCreateAssignment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCohort || !assignmentTitle.trim() || selectedChallengeIds.length === 0) return;

    const dueAt = new Date(Date.now() + assignmentDueDays * 86400000).toISOString();
    ClassroomService.createAssignment(
      selectedCohort.id,
      currentProfile.id,
      assignmentTitle.trim(),
      assignmentDesc.trim(),
      selectedChallengeIds,
      dueAt
    );

    setShowNewAssignmentModal(false);
    setAssignmentTitle('');
    setAssignmentDesc('');
    setSelectedChallengeIds(['quest-1']);

    // Refresh assignments & gradebook
    const assigns = ClassroomService.getCohortAssignments(selectedCohort.id, currentProfile.id);
    setAssignments(assigns);
    try {
      const gb = ClassroomService.getGradebook(selectedCohort.id, currentProfile.id);
      setGradebook(gb);
    } catch {}
  };

  const handleRemoveMember = (targetUserId: string) => {
    if (!selectedCohort) return;
    if (confirm('Are you sure you want to remove this member from the cohort?')) {
      ClassroomService.removeMember(selectedCohort.id, currentProfile.id, targetUserId);
      const mems = ClassroomService.getCohortMembers(selectedCohort.id, currentProfile.id);
      setMembers(mems);
      const gb = ClassroomService.getGradebook(selectedCohort.id, currentProfile.id);
      setGradebook(gb);
    }
  };

  const handleExportCSV = () => {
    if (!selectedCohort) return;
    const csvContent = ClassroomService.exportGradebookCSV(selectedCohort.id, currentProfile.id);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `gradebook_${selectedCohort.name.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col">
      {/* Header Bar */}
      <div className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-30 px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {selectedCohort ? (
              <button
                type="button"
                onClick={() => setSelectedCohort(null)}
                className="flex items-center gap-1 text-xs text-slate-400 hover:text-white bg-slate-800 px-2.5 py-1.5 rounded-lg border border-slate-700 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>All Cohorts</span>
              </button>
            ) : onBackToApp && (
              <button
                type="button"
                onClick={onBackToApp}
                className="flex items-center gap-1 text-xs text-slate-400 hover:text-white bg-slate-800 px-2.5 py-1.5 rounded-lg border border-slate-700 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Return to Sandbox</span>
              </button>
            )}

            <div>
              <div className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-sky-400" />
                <h1 className="text-lg font-bold text-white">
                  {selectedCohort ? selectedCohort.name : 'Classroom & Teacher Console'}
                </h1>
                {selectedCohort && (
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-sky-500/10 border border-sky-500/30 text-sky-300 font-bold">
                    CODE: {selectedCohort.join_code}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                {selectedCohort
                  ? 'Manage cohort members, assign challenges, review real-time gradebook and monitor stuck students.'
                  : 'Manage student cohorts, distribute Python challenges, track submissions and analyze class performance.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setShowJoinCohortModal(true)}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition-colors flex items-center gap-1.5"
            >
              <Users className="w-3.5 h-3.5" />
              <span>Join with Code</span>
            </button>

            {isTeacher && (
              <button
                type="button"
                onClick={() => setShowCreateCohortModal(true)}
                className="px-3.5 py-2 bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-bold rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Create New Cohort</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Body */}
      <div className="max-w-7xl mx-auto w-full p-6 flex-1">
        {!selectedCohort ? (
          /* ==============================================================================
           * 1. ALL COHORTS VIEW
           * ============================================================================== */
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-200 flex items-center gap-2">
                <Users className="w-4 h-4 text-sky-400" />
                <span>Active Cohorts &amp; Classes ({cohorts.length})</span>
              </h2>
            </div>

            {cohorts.length === 0 ? (
              <div className="p-12 text-center bg-slate-900/40 border border-slate-800 rounded-2xl max-w-lg mx-auto space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-sky-500/10 border border-sky-500/30 text-sky-400 flex items-center justify-center mx-auto text-xl">
                  🎓
                </div>
                <div>
                  <h3 className="font-bold text-slate-200">No Cohorts Joined Yet</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Join a classroom using your teacher&apos;s 6-character code, or create a cohort if you are an instructor.
                  </p>
                </div>
                <div className="flex justify-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowJoinCohortModal(true)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-xl"
                  >
                    Join with Code
                  </button>
                  {isTeacher && (
                    <button
                      type="button"
                      onClick={() => setShowCreateCohortModal(true)}
                      className="px-4 py-2 bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-bold rounded-xl"
                    >
                      Create Cohort
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {cohorts.map((cohort) => (
                  <div
                    key={cohort.id}
                    className="bg-slate-900/80 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 flex flex-col justify-between gap-5 transition-all shadow-md group"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                          cohort.role === 'teacher'
                            ? 'bg-amber-500/10 text-amber-300 border border-amber-500/30'
                            : 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30'
                        }`}>
                          {cohort.role === 'teacher' ? 'Instructor / Owner' : 'Enrolled Student'}
                        </span>

                        <button
                          type="button"
                          onClick={() => handleCopyCode(cohort.join_code)}
                          className="flex items-center gap-1 text-[11px] font-mono text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-800 px-2 py-1 rounded border border-slate-700 transition-colors"
                          title="Copy student join code"
                        >
                          {copiedCode === cohort.join_code ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-400" />
                              <span className="text-emerald-400 font-bold">Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>{cohort.join_code}</span>
                            </>
                          )}
                        </button>
                      </div>

                      <h3 className="text-base font-bold text-white group-hover:text-sky-300 transition-colors">
                        {cohort.name}
                      </h3>
                      <p className="text-xs text-slate-400 mt-1">
                        Active cohort with synchronized assignments &amp; gradebook analytics.
                      </p>
                    </div>

                    <div className="space-y-3 pt-3 border-t border-slate-800/80">
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="p-2 bg-slate-950/60 rounded-lg border border-slate-800 text-center">
                          <span className="text-[10px] text-slate-400 block">Members</span>
                          <span className="font-bold text-slate-200 font-mono">{cohort.member_count || 1}</span>
                        </div>
                        <div className="p-2 bg-slate-950/60 rounded-lg border border-slate-800 text-center">
                          <span className="text-[10px] text-slate-400 block">Assignments</span>
                          <span className="font-bold text-slate-200 font-mono">{cohort.assignment_count || 0}</span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setSelectedCohort(cohort)}
                        className="w-full py-2.5 bg-sky-500/10 hover:bg-sky-500 text-sky-300 hover:text-slate-950 font-bold text-xs rounded-xl border border-sky-500/30 hover:border-sky-500 transition-all text-center"
                      >
                        Open Classroom
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* ==============================================================================
           * 2. COHORT DETAIL VIEW WITH 4 TABS (Members, Assignments, Gradebook, Hint Activity)
           * ============================================================================== */
          <div className="space-y-6">
            {/* Cohort Tabs */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('members')}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors flex items-center gap-2 ${
                    activeTab === 'members'
                      ? 'bg-sky-500 text-slate-950 shadow-sm'
                      : 'text-slate-400 hover:text-white bg-slate-900 border border-slate-800'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Members ({members.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('assignments')}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors flex items-center gap-2 ${
                    activeTab === 'assignments'
                      ? 'bg-sky-500 text-slate-950 shadow-sm'
                      : 'text-slate-400 hover:text-white bg-slate-900 border border-slate-800'
                  }`}
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Assignments ({assignments.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('gradebook')}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors flex items-center gap-2 ${
                    activeTab === 'gradebook'
                      ? 'bg-sky-500 text-slate-950 shadow-sm'
                      : 'text-slate-400 hover:text-white bg-slate-900 border border-slate-800'
                  }`}
                >
                  <Award className="w-3.5 h-3.5" />
                  <span>Gradebook Matrix</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('hints')}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors flex items-center gap-2 ${
                    activeTab === 'hints'
                      ? 'bg-sky-500 text-slate-950 shadow-sm'
                      : 'text-slate-400 hover:text-white bg-slate-900 border border-slate-800'
                  }`}
                >
                  <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
                  <span>Hint Activity &amp; Stuck Alert</span>
                </button>
              </div>

              {activeTab === 'assignments' && isTeacher && (
                <button
                  type="button"
                  onClick={() => setShowNewAssignmentModal(true)}
                  className="px-3.5 py-1.5 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>New Assignment</span>
                </button>
              )}

              {activeTab === 'gradebook' && isTeacher && (
                <button
                  type="button"
                  onClick={handleExportCSV}
                  className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-sm"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export Gradebook CSV</span>
                </button>
              )}
            </div>

            {/* Tab 1: Members */}
            {activeTab === 'members' && (
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
                <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300">Enrolled Students &amp; Instructors</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">Join code for students:</span>
                    <button
                      type="button"
                      onClick={() => handleCopyCode(selectedCohort.join_code)}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-amber-400 font-mono font-bold text-xs rounded border border-slate-700 flex items-center gap-1"
                    >
                      <Copy className="w-3 h-3" />
                      <span>{selectedCohort.join_code}</span>
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-950/60 border-b border-slate-800 text-slate-400 font-mono">
                      <tr>
                        <th className="py-3 px-4">Student / Username</th>
                        <th className="py-3 px-4">Role</th>
                        <th className="py-3 px-4">Total XP</th>
                        <th className="py-3 px-4">Daily Streak</th>
                        <th className="py-3 px-4">Last Active</th>
                        {isTeacher && <th className="py-3 px-4 text-right">Actions</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {members.map((m) => (
                        <tr key={m.user_id} className="hover:bg-slate-800/30 transition-colors">
                          <td className="py-3.5 px-4 font-semibold text-slate-200">
                            {m.username}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                              m.role === 'teacher'
                                ? 'bg-amber-500/10 text-amber-300 border border-amber-500/30'
                                : 'bg-slate-800 text-slate-300 border border-slate-700'
                            }`}>
                              {m.role}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 font-mono font-bold text-amber-400">
                            {m.xp} XP
                          </td>
                          <td className="py-3.5 px-4 font-mono text-orange-400">
                            🔥 {m.streak}d
                          </td>
                          <td className="py-3.5 px-4 text-slate-400">
                            {m.last_active}
                          </td>
                          {isTeacher && (
                            <td className="py-3.5 px-4 text-right">
                              {m.role !== 'teacher' && (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveMember(m.user_id)}
                                  className="text-rose-400 hover:text-rose-300 p-1 rounded hover:bg-rose-950/40 transition-colors"
                                  title="Remove student from cohort"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Tab 2: Assignments */}
            {activeTab === 'assignments' && (
              <div className="space-y-4">
                {assignments.length === 0 ? (
                  <div className="p-12 text-center bg-slate-900/40 border border-slate-800 rounded-2xl max-w-md mx-auto space-y-3">
                    <BookOpen className="w-10 h-10 text-slate-600 mx-auto" />
                    <h3 className="font-bold text-slate-300">No Assignments Yet</h3>
                    <p className="text-xs text-slate-400">
                      Instructors can assign challenges from the catalog with due dates.
                    </p>
                    {isTeacher && (
                      <button
                        type="button"
                        onClick={() => setShowNewAssignmentModal(true)}
                        className="px-4 py-2 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs rounded-xl"
                      >
                        Create First Assignment
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {assignments.map((assign) => (
                      <div
                        key={assign.id}
                        className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-sm"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <span className="text-[10px] font-mono text-sky-400 uppercase tracking-widest font-bold">
                              Assignment
                            </span>
                            <h3 className="text-base font-bold text-slate-100 mt-0.5">
                              {assign.title}
                            </h3>
                            <p className="text-xs text-slate-400 mt-1">
                              {assign.description}
                            </p>
                          </div>

                          {assign.due_at && (
                            <div className="flex items-center gap-1 text-[11px] font-mono text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-1 rounded">
                              <Calendar className="w-3 h-3" />
                              <span>Due {new Date(assign.due_at).toLocaleDateString()}</span>
                            </div>
                          )}
                        </div>

                        {/* Challenges in this assignment */}
                        <div className="space-y-1.5">
                          <span className="text-[11px] font-semibold text-slate-400">Challenges:</span>
                          <div className="flex flex-wrap gap-2">
                            {assign.challenge_ids.map((cid) => {
                              const quest = QUESTS.find((q) => q.id === cid);
                              return (
                                <button
                                  key={cid}
                                  type="button"
                                  onClick={() => onSelectQuest && onSelectQuest(cid)}
                                  className="px-2.5 py-1 bg-slate-950 border border-slate-800 hover:border-sky-500 text-slate-300 hover:text-white rounded-lg text-xs font-mono transition-colors flex items-center gap-1.5"
                                >
                                  <span>{quest ? quest.title : cid}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Completion bar */}
                        <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <span className="text-slate-400">Progress:</span>
                            <span className="font-mono font-bold text-slate-200">
                              {assign.solved_count || 0} / {assign.total_count || assign.challenge_ids.length} Solved
                            </span>
                          </div>

                          {assign.is_completed && (
                            <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Completed</span>
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Tab 3: Gradebook Matrix */}
            {activeTab === 'gradebook' && (
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-lg space-y-4">
                <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-200">Classroom Gradebook Matrix</h3>
                    <p className="text-xs text-slate-400 mt-0.5">Real-time student progress per assignment</p>
                  </div>
                  {isTeacher && (
                    <button
                      type="button"
                      onClick={handleExportCSV}
                      className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-1.5"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Export CSV</span>
                    </button>
                  )}
                </div>

                <div className="overflow-x-auto p-4 pt-0">
                  <table className="w-full text-left text-xs border border-slate-800 rounded-xl overflow-hidden">
                    <thead className="bg-slate-950 text-slate-400 font-mono border-b border-slate-800">
                      <tr>
                        <th className="py-3 px-4 font-bold text-slate-200">Student</th>
                        <th className="py-3 px-3">Total XP</th>
                        <th className="py-3 px-3">Streak</th>
                        {gradebook.assignments.map((a) => (
                          <th key={a.id} className="py-3 px-4 text-center">
                            <span className="text-slate-200 block font-sans font-semibold">{a.title}</span>
                            <span className="text-[10px] text-slate-500 font-mono">({a.challenge_ids.length} challenges)</span>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/80">
                      {gradebook.rows.map((row) => (
                        <tr key={row.user_id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="py-3 px-4 font-semibold text-slate-200 whitespace-nowrap">
                            {row.username}
                          </td>
                          <td className="py-3 px-3 font-mono text-amber-400 font-bold">
                            {row.total_xp}
                          </td>
                          <td className="py-3 px-3 font-mono text-orange-400">
                            🔥 {row.streak}d
                          </td>
                          {gradebook.assignments.map((a) => {
                            const cell = (row.assignments as any)?.[a.id] || (row.progress as any)?.[a.id];
                            const isComplete = cell && (cell.completed || cell.solved || cell.status === 'completed');
                            const solvedCount = cell?.solved_count ?? (cell?.solved ? 1 : 0);
                            const totalCount = cell?.total_count ?? 1;

                            return (
                              <td key={a.id} className="py-3 px-4 text-center">
                                <span className={`inline-flex items-center gap-1 font-mono font-bold px-2 py-0.5 rounded text-xs ${
                                  isComplete
                                    ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/40'
                                    : solvedCount > 0
                                    ? 'bg-amber-950/60 text-amber-300 border border-amber-500/30'
                                    : 'bg-slate-800/60 text-slate-500 border border-slate-700/60'
                                }`}>
                                  {isComplete && <Check className="w-3 h-3 text-emerald-400" />}
                                  <span>{cell ? `${solvedCount}/${totalCount}` : '0/0'}</span>
                                </span>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Tab 4: Hint Activity & Stuck Alert */}
            {activeTab === 'hints' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 text-center">
                    <span className="text-xs text-slate-400">Total Hints Requested</span>
                    <div className="text-3xl font-black font-mono text-amber-400 mt-1">
                      {hintActivity?.total_hints || 0}
                    </div>
                  </div>
                  <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 text-center">
                    <span className="text-xs text-slate-400">Students Requesting Guidance</span>
                    <div className="text-3xl font-black font-mono text-sky-400 mt-1">
                      {hintActivity?.active_students || 0}
                    </div>
                  </div>
                  <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 text-center">
                    <span className="text-xs text-slate-400">Max Difficulty Level 3 Hints</span>
                    <div className="text-3xl font-black font-mono text-rose-400 mt-1">
                      {hintActivity?.hints_by_level?.level_3 ?? (hintActivity?.hints_by_level as any)?.[3] ?? 0}
                    </div>
                  </div>
                </div>

                {/* Stuck Students Watchlist */}
                <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-md">
                  <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
                    <AlertCircle className="w-4 h-4" />
                    <span>Stuck Student Watchlist (Teacher Intervention Recommended)</span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Students who have requested 2+ hints on a single challenge without public questions.
                  </p>

                  <div className="space-y-2 pt-2">
                    {hintActivity?.stuck_students && (hintActivity.stuck_students as any[]).length > 0 ? (
                      (hintActivity.stuck_students as any[]).map((stuck: any) => (
                        <div
                          key={stuck.user_id || stuck.username}
                          className="flex items-center justify-between p-3 bg-slate-950/80 border border-slate-800 rounded-xl text-xs"
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="font-bold text-white">{stuck.username}</span>
                            <span className="px-2 py-0.5 rounded bg-rose-500/10 border border-rose-500/30 text-rose-300 font-mono font-bold">
                              {stuck.hint_count} hint requests
                            </span>
                          </div>

                          <div className="text-slate-400 text-[11px]">
                            Challenges: <span className="font-mono text-slate-200">{stuck.challenges.join(', ')}</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-xs text-slate-500 italic p-3 text-center bg-slate-950/40 rounded-xl">
                        No students are currently flagged as stuck.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal: Create Cohort */}
      {showCreateCohortModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <form
            onSubmit={handleCreateCohort}
            className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5 shadow-2xl"
          >
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Plus className="w-4 h-4 text-sky-400" />
              <span>Create New Cohort</span>
            </h3>
            <p className="text-xs text-slate-400">
              A 6-character uppercase alphanumeric join code (unambiguous) will be automatically generated for your students.
            </p>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Cohort Name</label>
              <input
                type="text"
                value={newCohortName}
                onChange={(e) => setNewCohortName(e.target.value)}
                placeholder="e.g. Lagos City Cyber Cadets - Batch 2"
                required
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-sky-400"
              />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowCreateCohortModal(false)}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs rounded-xl shadow-md"
              >
                Create Cohort
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal: Join Cohort with Code */}
      {showJoinCohortModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <form
            onSubmit={handleJoinCohort}
            className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5 shadow-2xl"
          >
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-sky-400" />
              <span>Join Classroom Cohort</span>
            </h3>
            <p className="text-xs text-slate-400">
              Enter the 6-character code provided by your instructor to join your class.
            </p>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">6-Character Join Code</label>
              <input
                type="text"
                value={joinCodeInput}
                onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
                placeholder="e.g. QNTM99"
                maxLength={6}
                required
                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-lg font-mono font-bold tracking-widest text-center text-amber-300 focus:outline-none focus:border-amber-400 uppercase"
              />
            </div>

            {joinError && (
              <div className="p-3 bg-rose-950/60 border border-rose-800 rounded-xl text-rose-300 text-xs">
                {joinError}
              </div>
            )}

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowJoinCohortModal(false);
                  setJoinError(null);
                }}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs rounded-xl shadow-md"
              >
                Join Cohort
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal: New Assignment */}
      {showNewAssignmentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <form
            onSubmit={handleCreateAssignment}
            className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto"
          >
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Plus className="w-4 h-4 text-sky-400" />
              <span>Create Assignment for {selectedCohort?.name}</span>
            </h3>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Title</label>
              <input
                type="text"
                value={assignmentTitle}
                onChange={(e) => setAssignmentTitle(e.target.value)}
                placeholder="e.g. Week 2: Algorithms & Arrays"
                required
                className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Description / Instructions</label>
              <textarea
                value={assignmentDesc}
                onChange={(e) => setAssignmentDesc(e.target.value)}
                placeholder="Describe what students should accomplish..."
                rows={2}
                className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Due In (Days)</label>
              <input
                type="number"
                min={1}
                max={60}
                value={assignmentDueDays}
                onChange={(e) => setAssignmentDueDays(parseInt(e.target.value, 10))}
                className="w-24 px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-white"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-2">Select Challenges from Catalog</label>
              <div className="space-y-2 max-h-48 overflow-y-auto p-2 bg-slate-950 border border-slate-800 rounded-xl">
                {QUESTS.map((q) => {
                  const isChecked = selectedChallengeIds.includes(q.id);
                  return (
                    <label
                      key={q.id}
                      className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-slate-900 cursor-pointer text-xs"
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedChallengeIds((prev) => [...prev, q.id]);
                          } else {
                            setSelectedChallengeIds((prev) => prev.filter((id) => id !== q.id));
                          }
                        }}
                        className="rounded border-slate-700 text-sky-500 focus:ring-0"
                      />
                      <span className="font-semibold text-slate-200">{q.title}</span>
                      <span className="text-[10px] text-slate-500 font-mono">({q.category})</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center gap-3 pt-3">
              <button
                type="button"
                onClick={() => setShowNewAssignmentModal(false)}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={selectedChallengeIds.length === 0}
                className="flex-1 py-2.5 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs rounded-xl shadow-md disabled:opacity-50"
              >
                Create Assignment
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default TeacherDashboard;

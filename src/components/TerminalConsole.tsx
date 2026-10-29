import React, { useState } from 'react';
import { Terminal, CheckCircle2, XCircle, AlertCircle, Trash2, Clock, Sparkles } from 'lucide-react';
import { ValidationResult } from '../types';

interface TerminalConsoleProps {
  stdout: string;
  stderr: string;
  isRunning: boolean;
  statusText?: string;
  validationResult: ValidationResult | null;
  onClear: () => void;
  className?: string;
}

export const TerminalConsole: React.FC<TerminalConsoleProps> = ({
  stdout,
  stderr,
  isRunning,
  statusText,
  validationResult,
  onClear,
  className = '',
}) => {
  const [activeTab, setActiveTab] = useState<'console' | 'tests'>('console');

  const hasTests = validationResult !== null && validationResult.testResults.length > 0;

  return (
    <div className={`flex flex-col bg-[#080d19] border border-slate-800 rounded-lg overflow-hidden ${className}`}>
      {/* Terminal Header Tabs */}
      <div className="flex items-center justify-between px-3 py-2 bg-slate-900 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-emerald-400" />
          <div className="flex items-center bg-slate-950 p-0.5 rounded border border-slate-800">
            <button
              type="button"
              onClick={() => setActiveTab('console')}
              className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
                activeTab === 'console'
                  ? 'bg-slate-800 text-slate-100 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Console Output
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('tests')}
              className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded transition-colors ${
                activeTab === 'tests'
                  ? 'bg-slate-800 text-slate-100 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>Test Results</span>
              {validationResult && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                    validationResult.allPassed
                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                      : 'bg-rose-950 text-rose-400 border border-rose-800'
                  }`}
                >
                  {validationResult.passedCount}/{validationResult.totalCount}
                </span>
              )}
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          {validationResult && (
            <div className="flex items-center gap-1 text-slate-400 font-mono text-[11px]">
              <Clock className="w-3 h-3 text-slate-500" />
              <span className="tabular-nums">{validationResult.executionTimeMs}ms</span>
            </div>
          )}

          <button
            type="button"
            onClick={onClear}
            className="flex items-center gap-1 p-1 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded transition-colors"
            title="Clear Terminal Output"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="sr-only">Clear</span>
          </button>
        </div>
      </div>

      {/* Terminal Body */}
      <div className="flex-1 p-3 overflow-y-auto font-mono text-xs select-text">
        {isRunning && (
          <div className="flex items-center gap-2 text-sky-400 py-1 mb-2">
            <div className="w-2 h-2 rounded-full bg-sky-400 animate-ping" />
            <span>{statusText || 'Executing in WebAssembly sandbox...'}</span>
          </div>
        )}

        {activeTab === 'console' && (
          <div className="space-y-2">
            {!stdout && !stderr && !isRunning && (
              <div className="text-slate-500 py-4 text-center">
                <p>Python WebAssembly console ready.</p>
                <p className="text-[11px] mt-1 text-slate-600">
                  Hit <kbd className="px-1 py-0.5 bg-slate-900 border border-slate-800 rounded text-slate-400">Run</kbd> or <kbd className="px-1 py-0.5 bg-slate-900 border border-slate-800 rounded text-slate-400">Ctrl+Enter</kbd> to execute your code.
                </p>
              </div>
            )}

            {stdout && (
              <div className="whitespace-pre-wrap text-emerald-300 leading-relaxed font-mono">
                {stdout}
              </div>
            )}

            {stderr && (
              <div className="p-2.5 bg-rose-950/40 border border-rose-900/60 rounded text-rose-300 whitespace-pre-wrap font-mono mt-2">
                <div className="flex items-center gap-1.5 font-bold text-rose-400 mb-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>Runtime Error</span>
                </div>
                {stderr}
              </div>
            )}
          </div>
        )}

        {activeTab === 'tests' && (
          <div className="space-y-3">
            {!hasTests && !isRunning && (
              <div className="text-slate-500 py-4 text-center">
                <p>No test results available yet.</p>
                <p className="text-[11px] mt-1 text-slate-600">
                  Click &quot;Run &amp; Test&quot; in the workspace to evaluate against quest criteria.
                </p>
              </div>
            )}

            {validationResult && (
              <>
                <div
                  className={`p-3 rounded border flex items-center justify-between ${
                    validationResult.allPassed
                      ? 'bg-emerald-950/40 border-emerald-800/80 text-emerald-200'
                      : 'bg-amber-950/40 border-amber-800/80 text-amber-200'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {validationResult.allPassed ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
                    )}
                    <div>
                      <div className="font-semibold text-sm">
                        {validationResult.allPassed
                          ? 'All Challenge Tests Passed!'
                          : `${validationResult.passedCount} of ${validationResult.totalCount} Tests Passed`}
                      </div>
                      <div className="text-[11px] opacity-80">
                        {validationResult.allPassed
                          ? 'Quest objective fulfilled. Experience points awarded!'
                          : 'Review failed test cases below and adjust your Python logic.'}
                      </div>
                    </div>
                  </div>

                  {validationResult.allPassed && (
                    <div className="flex items-center gap-1 text-xs font-bold text-emerald-400 bg-emerald-900/60 px-2.5 py-1 rounded border border-emerald-700">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Level Up</span>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  {validationResult.testResults.map((tc, idx) => (
                    <div
                      key={tc.testId || idx}
                      className={`p-2.5 rounded border text-xs ${
                        tc.passed
                          ? 'bg-slate-900/60 border-emerald-900/40 text-slate-300'
                          : 'bg-rose-950/20 border-rose-900/50 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          {tc.passed ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                          ) : (
                            <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                          )}
                          <span className="font-semibold text-slate-200">{tc.title}</span>
                        </div>
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                            tc.passed
                              ? 'bg-emerald-950 text-emerald-300'
                              : 'bg-rose-950 text-rose-300'
                          }`}
                        >
                          {tc.passed ? 'PASSED' : 'FAILED'}
                        </span>
                      </div>

                      {!tc.passed && (
                        <div className="mt-2 space-y-1.5 pl-6 text-[11px]">
                          <div>
                            <span className="text-slate-500">Expected: </span>
                            <span className="text-slate-300 bg-slate-950 px-1 py-0.5 rounded">
                              {tc.expected}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-500">Actual: </span>
                            <span className="text-rose-300 bg-slate-950 px-1 py-0.5 rounded">
                              {tc.actual}
                            </span>
                          </div>
                          {tc.error && (
                            <div className="text-rose-400 text-[10px]">
                              Hint: {tc.error}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TerminalConsole;

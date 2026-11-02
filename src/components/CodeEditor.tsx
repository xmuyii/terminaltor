import React, { useRef, useState, useEffect } from 'react';
import Editor, { OnMount } from '@monaco-editor/react';
import { Play, RotateCcw, Copy, Check, Terminal, Code2, Sparkles } from 'lucide-react';

export interface CodeEditorProps {
  initialCode: string;
  value: string;
  onChange: (value: string) => void;
  onRun?: () => void;
  isRunning?: boolean;
  readOnly?: boolean;
  height?: string;
  className?: string;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({
  initialCode,
  value,
  onChange,
  onRun,
  isRunning = false,
  readOnly = false,
  height = '100%',
  className = '',
}) => {
  const [copied, setCopied] = useState(false);
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const [fontSize, setFontSize] = useState(isMobile ? 16 : 14);
  const editorRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Visual Viewport API: Ensure keyboard does not cover cursor on mobile
  useEffect(() => {
    if (typeof window === 'undefined' || !window.visualViewport) return;

    const handleViewportResize = () => {
      if (editorRef.current && containerRef.current) {
        containerRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    };

    window.visualViewport.addEventListener('resize', handleViewportResize);
    return () => window.visualViewport?.removeEventListener('resize', handleViewportResize);
  }, []);

  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;

    // Define custom dark cyber theme matching our palette
    monaco.editor.defineTheme('sovereign-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '64748B', fontStyle: 'italic' },
        { token: 'keyword', foreground: '38BDF8', fontStyle: 'bold' },
        { token: 'string', foreground: '34D399' },
        { token: 'number', foreground: 'FBBF24' },
        { token: 'operator', foreground: 'F472B6' },
        { token: 'function', foreground: '60A5FA' },
      ],
      colors: {
        'editor.background': '#0B1120',
        'editor.foreground': '#E2E8F0',
        'editorLineNumber.foreground': '#475569',
        'editorLineNumber.activeForeground': '#38BDF8',
        'editorCursor.foreground': '#38BDF8',
        'editor.selectionBackground': '#1E293B',
        'editor.inactiveSelectionBackground': '#172554',
      },
    });

    monaco.editor.setTheme('sovereign-dark');

    // Register Ctrl+Enter or Cmd+Enter to Run Code
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
      if (onRun && !isRunning) {
        onRun();
      }
    });
  };

  const handleFormat = () => {
    try {
      if (editorRef.current) {
        const action = editorRef.current.getAction('editor.action.formatDocument');
        if (action) {
          action.run();
          return;
        }
      }
      const lines = value.split('\n');
      const formatted = lines.map((l) => l.replace(/[ \t]+$/, '')).join('\n');
      onChange(formatted);
      if (editorRef.current) {
        editorRef.current.setValue(formatted);
      }
    } catch {
      // fallback
    }
  };

  const handleReset = () => {
    if (window.confirm('Reset code back to the starting template?')) {
      onChange(initialCode);
      if (editorRef.current) {
        editorRef.current.setValue(initialCode);
      }
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  return (
    <div className={`flex flex-col bg-[#0B1120] border border-slate-800 rounded-lg overflow-hidden ${className}`}>
      {/* Editor Header Toolbar */}
      <div className="flex items-center justify-between px-3 py-2 bg-slate-900/90 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Code2 className="w-4 h-4 text-sky-400" />
          <span className="text-xs font-semibold text-slate-200">main.py</span>
          <span className="text-[11px] text-slate-500 font-mono">Python 3.12</span>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Font scale buttons */}
          <div className="flex items-center border border-slate-800 rounded bg-slate-950/50 mr-1">
            <button
              type="button"
              onClick={() => setFontSize((s) => Math.max(12, s - 1))}
              className="px-1.5 py-0.5 text-[11px] text-slate-400 hover:text-white"
              title="Decrease Font Size"
            >
              A-
            </button>
            <span className="px-1 text-[10px] text-slate-500 font-mono">{fontSize}</span>
            <button
              type="button"
              onClick={() => setFontSize((s) => Math.min(20, s + 1))}
              className="px-1.5 py-0.5 text-[11px] text-slate-400 hover:text-white"
              title="Increase Font Size"
            >
              A+
            </button>
          </div>

          <button
            type="button"
            onClick={handleFormat}
            className="flex items-center gap-1 px-2 py-1 text-xs text-slate-400 hover:text-sky-300 hover:bg-slate-800 rounded transition-colors"
            title="Format Code"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="hidden sm:inline text-[11px]">Format</span>
          </button>

          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1 px-2 py-1 text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors"
            title="Copy Code"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline text-[11px]">{copied ? 'Copied' : 'Copy'}</span>
          </button>

          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1 px-2 py-1 text-xs text-slate-400 hover:text-amber-300 hover:bg-slate-800 rounded transition-colors"
            title="Reset to Starter Code"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline text-[11px]">Reset</span>
          </button>

          {onRun && (
            <button
              type="button"
              onClick={onRun}
              disabled={isRunning}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded text-white transition-all shadow-sm ${
                isRunning
                  ? 'bg-sky-600/50 cursor-not-allowed'
                  : 'bg-sky-500 hover:bg-sky-400 active:scale-95'
              }`}
              title="Run Code (Ctrl + Enter)"
            >
              {isRunning ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Running...</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-white" />
                  <span>Run</span>
                  <span className="hidden md:inline text-[10px] opacity-75 font-mono">⌘↵</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Monaco Editor Container */}
      <div ref={containerRef} className="relative flex-1 min-h-[300px]" style={{ height }}>
        <Editor
          height="100%"
          language="python"
          theme="vs-dark"
          value={value}
          onChange={(newVal) => onChange(newVal ?? '')}
          onMount={handleEditorDidMount}
          options={{
            readOnly,
            fontSize,
            lineNumbers: isMobile ? 'off' : 'on',
            lineNumbersMinChars: isMobile ? 1 : 3,
            glyphMargin: false,
            folding: !isMobile,
            minimap: { enabled: false },
            wordWrap: 'on',
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 4,
            insertSpaces: true,
            formatOnPaste: true,
            fontFamily: "'JetBrains Mono', monospace",
            renderLineHighlight: 'all',
            padding: { top: 12, bottom: 12 },
            cursorBlinking: 'smooth',
            smoothScrolling: true,
          }}
          loading={
            <div className="flex flex-col items-center justify-center h-full bg-[#0B1120] text-slate-400 gap-3">
              <Terminal className="w-6 h-6 animate-pulse text-sky-400" />
              <p className="text-xs font-mono">Loading Monaco Editor Engine...</p>
            </div>
          }
        />
      </div>

      {/* Editor Footer Status */}
      <div className="flex items-center justify-between px-3 py-1 bg-slate-950/80 border-t border-slate-900 text-[11px] text-slate-500 font-mono">
        <div>
          <span>Lines: {value.split('\n').length}</span>
          <span className="mx-2">·</span>
          <span>Chars: {value.length}</span>
        </div>
        <div className="flex items-center gap-2">
          <span>UTF-8</span>
          <span className="text-slate-600">|</span>
          <span>Spaces: 4</span>
        </div>
      </div>
    </div>
  );
};

export default CodeEditor;

/**
 * Pyodide WebAssembly Dedicated Web Worker
 * Offloads heavy WASM compilation and execution from the main UI thread.
 */

declare function importScripts(...urls: string[]): void;

interface WorkerMessagePayload {
  id: string;
  type: 'RUN_CODE' | 'RUN_TESTS' | 'INIT';
  code?: string;
  testCases?: Array<{
    id: string;
    title: string;
    expected_output?: string;
    assertion_code?: string;
  }>;
}

let pyodideInstance: any = null;
let isInitializing = false;

async function initPyodideInWorker() {
  if (pyodideInstance) return pyodideInstance;
  if (isInitializing) {
    while (isInitializing) {
      await new Promise((r) => setTimeout(r, 50));
    }
    return pyodideInstance;
  }

  isInitializing = true;
  postMessage({ type: 'STATUS', message: 'Downloading Pyodide WebAssembly in Worker...' });

  try {
    // Import pyodide in worker scope
    importScripts('https://cdn.jsdelivr.net/pyodide/v0.26.4/full/pyodide.js');
    postMessage({ type: 'STATUS', message: 'Compiling Python 3.12 VM off-thread...' });

    // @ts-expect-error loadPyodide is available globally in Worker via importScripts
    pyodideInstance = await loadPyodide({
      indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.26.4/full/',
    });

    await pyodideInstance.runPythonAsync(`
import sys
import io

class OutputCapture:
    def __init__(self):
        self.stdout_buffer = io.StringIO()
        self.stderr_buffer = io.StringIO()
        self._orig_stdout = sys.stdout
        self._orig_stderr = sys.stderr

    def start(self):
        self.stdout_buffer = io.StringIO()
        self.stderr_buffer = io.StringIO()
        sys.stdout = self.stdout_buffer
        sys.stderr = self.stderr_buffer

    def stop(self):
        sys.stdout = self._orig_stdout
        sys.stderr = self._orig_stderr
        return self.stdout_buffer.getvalue(), self.stderr_buffer.getvalue()

_capture = OutputCapture()
`);

    postMessage({ type: 'STATUS', message: 'Worker Pyodide Runtime Ready!' });
    isInitializing = false;
    return pyodideInstance;
  } catch (err: any) {
    isInitializing = false;
    postMessage({ type: 'ERROR', error: err?.message || 'Failed to initialize Pyodide in worker' });
    throw err;
  }
}

self.onmessage = async (e: MessageEvent<WorkerMessagePayload>) => {
  const { id, type, code = '', testCases = [] } = e.data;

  try {
    const pyodide = await initPyodideInWorker();

    if (type === 'INIT') {
      postMessage({ id, type: 'INIT_SUCCESS' });
      return;
    }

    if (type === 'RUN_CODE') {
      const startTime = performance.now();
      await pyodide.runPythonAsync('_capture.start()');

      let executionError: string | undefined;
      try {
        await pyodide.runPythonAsync(code);
      } catch (err: any) {
        executionError = err?.message || String(err);
      }

      const [stdout, stderr] = (await pyodide.runPythonAsync('_capture.stop()')) as [string, string];
      const timeMs = Math.round(performance.now() - startTime);

      postMessage({
        id,
        type: 'RUN_CODE_RESULT',
        stdout: stdout || '',
        stderr: executionError ? `${stderr}\n${executionError}`.trim() : stderr,
        executionTimeMs: timeMs,
      });
      return;
    }

    if (type === 'RUN_TESTS') {
      const startTime = performance.now();
      const testResults = [];
      let combinedStdout = '';
      let combinedStderr = '';

      for (let i = 0; i < testCases.length; i++) {
        const tc = testCases[i];
        postMessage({
          id,
          type: 'STATUS',
          message: `Worker verifying test case ${i + 1}/${testCases.length}: ${tc.title}...`,
        });

        let passed = false;
        let actualOutput = '';
        let testError: string | undefined;

        await pyodide.runPythonAsync('_capture.start()');
        let executionFailed = false;

        try {
          await pyodide.runPythonAsync(code);
        } catch (err: any) {
          executionFailed = true;
          testError = err?.message || String(err);
        }

        if (!executionFailed && tc.assertion_code) {
          try {
            await pyodide.runPythonAsync(tc.assertion_code);
          } catch (assertErr: any) {
            executionFailed = true;
            testError = assertErr?.message || String(assertErr);
          }
        }

        const [out, err] = (await pyodide.runPythonAsync('_capture.stop()')) as [string, string];
        actualOutput = (out || '').trim();
        if (out) combinedStdout += out;
        if (err) combinedStderr += err;

        if (!executionFailed) {
          if (tc.expected_output !== undefined) {
            const expected = tc.expected_output.trim().replace(/\r\n/g, '\n');
            const actual = actualOutput.replace(/\r\n/g, '\n');
            passed = actual.includes(expected) || actual === expected;
          } else {
            passed = true;
          }
        } else {
          passed = false;
        }

        testResults.push({
          testId: tc.id,
          title: tc.title,
          passed,
          expected: tc.expected_output ?? 'Execution without assertion error',
          actual: actualOutput || (testError ? `Error: ${testError}` : '(Empty output)'),
          error: testError,
        });
      }

      const passedCount = testResults.filter((t) => t.passed).length;
      const allPassed = testResults.length > 0 && passedCount === testResults.length;
      const timeMs = Math.round(performance.now() - startTime);

      postMessage({
        id,
        type: 'RUN_TESTS_RESULT',
        result: {
          allPassed,
          passedCount,
          totalCount: testResults.length,
          testResults,
          stdout: combinedStdout,
          stderr: combinedStderr,
          executionTimeMs: timeMs,
        },
      });
    }
  } catch (err: any) {
    postMessage({
      id,
      type: 'FATAL_ERROR',
      error: err?.message || 'Worker execution failed',
    });
  }
};

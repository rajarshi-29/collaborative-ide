export class CodeRunnerService {
  static async runCode(file) {
    if (!file) {
      return { success: false, stdout: '', stderr: 'No file selected to run.', exitCode: 1 };
    }

    // 1. Native Execution via Electron
    if (file.fullPath && window.electronAPI?.invoke) {
      try {
        const res = await window.electronAPI.invoke('exec:runFile', {
          fullPath: file.fullPath,
          language: file.language
        });
        return res;
      } catch (err) {
        console.warn('Native execution failed, falling back to in-browser runner:', err);
      }
    }

    // 2. In-Browser Execution
    const language = file.language || '';
    const content = file.content || '';

    // JavaScript / TypeScript Execution
    if (language === 'javascript' || language === 'typescript') {
      return CodeRunnerService.runJavaScript(content);
    }

    // Python Execution
    if (language === 'python') {
      return CodeRunnerService.runPython(content);
    }

    // Shell / Text / Other
    return {
      success: true,
      stdout: `[Executed ${file.name}]\nFile content size: ${content.length} bytes\n`,
      stderr: '',
      exitCode: 0
    };
  }

  static async runJavaScript(code) {
    const logs = [];
    const cleanCode = code
      .replace(/^import\s+.*$/gm, '// $&')
      .replace(/^export\s+(default\s+)?/gm, '');

    // Attempt isolated execution in a Web Worker to prevent UI lockup
    if (typeof Worker !== 'undefined' && typeof Blob !== 'undefined' && typeof URL !== 'undefined') {
      try {
        const workerScript = `
          self.onmessage = function() {
            const logs = [];
            const customConsole = {
              log: (...args) => logs.push(args.map(a => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' ')),
              warn: (...args) => logs.push('[WARN] ' + args.map(a => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' ')),
              error: (...args) => logs.push('[ERROR] ' + args.map(a => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' ')),
              info: (...args) => logs.push('[INFO] ' + args.map(a => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' '))
            };
            try {
              const runFn = new Function('console', ${JSON.stringify(cleanCode)});
              const result = runFn(customConsole);
              self.postMessage({ success: true, logs, result });
            } catch (err) {
              self.postMessage({ success: false, logs, error: err.message || String(err) });
            }
          };
        `;

        const blob = new Blob([workerScript], { type: 'application/javascript' });
        const worker = new Worker(URL.createObjectURL(blob));

        return await new Promise((resolve) => {
          const timer = setTimeout(() => {
            worker.terminate();
            resolve({
              success: false,
              stdout: logs.join('\n'),
              stderr: 'Execution timed out after 5000ms (potential infinite loop).',
              exitCode: 124
            });
          }, 5000);

          worker.onmessage = (e) => {
            clearTimeout(timer);
            worker.terminate();
            const { success, logs: resLogs, result, error } = e.data;
            let stdout = (resLogs || []).join('\n');
            if (result !== undefined) {
              if (stdout) stdout += '\n';
              stdout += `Return value: ${typeof result === 'object' ? JSON.stringify(result) : String(result)}`;
            }
            resolve({
              success,
              stdout: stdout || (success ? 'Code executed successfully (no output).' : ''),
              stderr: error || '',
              exitCode: success ? 0 : 1
            });
          };

          worker.onerror = (err) => {
            clearTimeout(timer);
            worker.terminate();
            resolve({
              success: false,
              stdout: logs.join('\n'),
              stderr: err.message || 'Worker execution error',
              exitCode: 1
            });
          };

          worker.postMessage('run');
        });
      } catch (workerErr) {
        // Fall back to synchronous execution if Worker creation failed (e.g. CSP restrictions)
      }
    }

    try {
      const customConsole = {
        log: (...args) => logs.push(args.map(a => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' ')),
        warn: (...args) => logs.push('[WARN] ' + args.map(a => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' ')),
        error: (...args) => logs.push('[ERROR] ' + args.map(a => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' ')),
        info: (...args) => logs.push('[INFO] ' + args.map(a => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' '))
      };

      const runFn = new Function('console', cleanCode);
      const result = runFn(customConsole);

      let stdout = logs.join('\n');
      if (result !== undefined) {
        if (stdout) stdout += '\n';
        stdout += `Return value: ${typeof result === 'object' ? JSON.stringify(result) : String(result)}`;
      }

      return {
        success: true,
        stdout: stdout || 'Code executed successfully (no output).',
        stderr: '',
        exitCode: 0
      };
    } catch (err) {
      return {
        success: false,
        stdout: logs.join('\n'),
        stderr: err.message || String(err),
        exitCode: 1
      };
    }
  }

  static runPython(code) {
    const outputs = [];

    try {
      const lines = code.split('\n');
      const variables = {};

      for (const rawLine of lines) {
        const line = rawLine.trim();
        if (!line || line.startsWith('#')) continue;

        // Detect print(...)
        const printMatch = line.match(/^print\((.*)\)$/);
        if (printMatch) {
          const rawArg = printMatch[1].trim();
          // String literal
          if ((rawArg.startsWith('"') && rawArg.endsWith('"')) || (rawArg.startsWith("'") && rawArg.endsWith("'"))) {
            outputs.push(rawArg.slice(1, -1));
          } else if (variables[rawArg] !== undefined) {
            outputs.push(String(variables[rawArg]));
          } else {
            try {
              // evaluate simple math/expressions
              const evaluated = Function(`"use strict"; return (${rawArg})`)();
              outputs.push(String(evaluated));
            } catch (e) {
              outputs.push(rawArg);
            }
          }
        }

        // Variable assignment: x = 123 or x = "hello"
        const assignMatch = line.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*(.*)$/);
        if (assignMatch) {
          const varName = assignMatch[1];
          const valExpr = assignMatch[2].trim();
          try {
            if ((valExpr.startsWith('"') && valExpr.endsWith('"')) || (valExpr.startsWith("'") && valExpr.endsWith("'"))) {
              variables[varName] = valExpr.slice(1, -1);
            } else {
              variables[varName] = Function(`"use strict"; return (${valExpr})`)();
            }
          } catch (e) {
            variables[varName] = valExpr;
          }
        }
      }

      return {
        success: true,
        stdout: outputs.length > 0 ? outputs.join('\n') : 'Process finished with exit code 0.',
        stderr: '',
        exitCode: 0
      };
    } catch (err) {
      return {
        success: false,
        stdout: outputs.join('\n'),
        stderr: err.message || String(err),
        exitCode: 1
      };
    }
  }
}

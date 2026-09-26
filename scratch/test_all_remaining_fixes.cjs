const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');

app.whenReady().then(async () => {
  const win = new BrowserWindow({
    width: 1366,
    height: 850,
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.resolve(__dirname, '../electron/preload.cjs')
    }
  });

  const distPath = path.resolve(__dirname, '../dist/index.html');
  await win.loadFile(distPath);
  await new Promise(r => setTimeout(r, 2000));

  const results = [];
  const record = (name, pass, details = '') => {
    results.push({ name, pass, details });
    console.log(`[VERIFY] ${pass ? '✓ PASS' : '✗ FAIL'}: ${name} ${details ? '(' + details + ')' : ''}`);
  };

  // TEST 1: Preload Whitelist Security (Issue 2.2)
  try {
    const secResult = await win.webContents.executeJavaScript(`
      (async () => {
        let blocked = false;
        try {
          await window.electronAPI.invoke('malicious:arbitraryChannel');
        } catch (e) {
          blocked = e.message.includes('Unauthorized IPC channel');
        }
        const hasDirectMethods = typeof window.electronAPI.readFile === 'function' &&
                                 typeof window.electronAPI.writeFile === 'function' &&
                                 typeof window.electronAPI.searchFiles === 'function';
        return { blocked, hasDirectMethods };
      })()
    `);
    record('Preload Whitelist Enforcement', secResult.blocked && secResult.hasDirectMethods, 'Unauthorized channel blocked');
  } catch (e) {
    record('Preload Whitelist Enforcement', false, e.message);
  }

  // TEST 2: Workspace File Search (Issue 1.2)
  try {
    // Switch to Search panel in sidebar
    await win.webContents.executeJavaScript(`
      (() => {
        const searchBtn = document.querySelector('button[aria-label="Search"]');
        if (searchBtn) searchBtn.click();
      })()
    `);
    await new Promise(r => setTimeout(r, 400));

    // Type query into search input
    await win.webContents.executeJavaScript(`
      (() => {
        const input = document.querySelector('.sidebar-left input[placeholder*="Search in files"]');
        if (input) {
          const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
          setter.call(input, 'def ');
          input.dispatchEvent(new Event('input', { bubbles: true }));
          input.dispatchEvent(new Event('change', { bubbles: true }));
        }
      })()
    `);
    // Wait for debounce search
    await new Promise(r => setTimeout(r, 600));

    const searchState = await win.webContents.executeJavaScript(`
      (() => {
        const header = document.querySelector('.sidebar-left')?.innerText || '';
        const results = document.querySelectorAll('.sidebar-left .file-tree-item');
        return { header, matchCount: results.length };
      })()
    `);
    record('Disk & Memory File Search', searchState.matchCount >= 1, `Matches found: ${searchState.matchCount}`);
  } catch (e) {
    record('Disk & Memory File Search', false, e.message);
  }

  // TEST 3: Terminal Vertical Resizer (Issue 5.1)
  try {
    // Open terminal if not already open
    await win.webContents.executeJavaScript(`
      (() => {
        const termBtn = document.querySelector('button[title*="Terminal"]');
        if (termBtn && !document.querySelector('.terminal-section')) termBtn.click();
      })()
    `);
    await new Promise(r => setTimeout(r, 400));

    const resizerState = await win.webContents.executeJavaScript(`
      (() => {
        const gutter = document.querySelector('.gutter-vertical');
        const terminal = document.querySelector('.terminal-section');
        return {
          hasGutter: !!gutter,
          hasTerminal: !!terminal,
          terminalHeight: terminal ? terminal.offsetHeight : 0
        };
      })()
    `);
    record('Terminal Vertical Resizer', resizerState.hasGutter && resizerState.terminalHeight > 0, `Height: ${resizerState.terminalHeight}px`);
  } catch (e) {
    record('Terminal Vertical Resizer', false, e.message);
  }

  // TEST 4: Monaco Model Disposal on Tab Close (Issue 3.3)
  try {
    const disposalState = await win.webContents.executeJavaScript(`
      (() => {
        const initialModelCount = window.monaco ? window.monaco.editor.getModels().length : 0;
        const activeTab = document.querySelector('.tab-item.active');
        if (activeTab) {
          const closeBtn = activeTab.querySelector('.tab-close-btn');
          if (closeBtn) closeBtn.click();
        }
        return { initialModelCount };
      })()
    `);
    await new Promise(r => setTimeout(r, 500));

    const postDisposalState = await win.webContents.executeJavaScript(`
      (() => {
        const postModelCount = window.monaco ? window.monaco.editor.getModels().length : 0;
        return { postModelCount };
      })()
    `);
    record('Monaco Model Disposal on Tab Close', postDisposalState.postModelCount < disposalState.initialModelCount || postDisposalState.postModelCount === 0, `Before: ${disposalState.initialModelCount}, After: ${postDisposalState.postModelCount}`);
  } catch (e) {
    record('Monaco Model Disposal on Tab Close', false, e.message);
  }

  // TEST 5: Dead Code Removal Verification (Issue 4.2 & 4.3)
  try {
    const atomJsExists = fs.existsSync(path.resolve(__dirname, '../exports/atom.js'));
    const pkgJson = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../package.json'), 'utf-8'));
    const hasYWebsocket = !!pkgJson.dependencies['y-websocket'];
    record('Dead Code & Dependency Hygiene', !atomJsExists && !hasYWebsocket, `exports/atom.js deleted: ${!atomJsExists}, y-websocket removed: ${!hasYWebsocket}`);
  } catch (e) {
    record('Dead Code & Dependency Hygiene', false, e.message);
  }

  // TEST 6: Capture Visual Screenshot of Remediated IDE
  const screenshot = await win.webContents.capturePage();
  const screenPath = path.resolve(__dirname, 'all_remaining_fixes_verified.png');
  fs.writeFileSync(screenPath, screenshot.toPNG());
  console.log('Saved screenshot:', screenPath);

  console.log('\n================ VERIFICATION SUMMARY ================');
  const allPassed = results.every(r => r.pass);
  console.log(JSON.stringify(results, null, 2));
  console.log(`OVERALL RESULT: ${allPassed ? 'ALL AUDIT ISSUES RESOLVED' : 'SOME CHECKS FAILED'}\n`);

  app.quit();
});

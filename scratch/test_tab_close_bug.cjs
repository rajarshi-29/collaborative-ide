const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');

app.whenReady().then(async () => {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.resolve(__dirname, '../electron/preload.cjs')
    }
  });

  const htmlPath = path.resolve(__dirname, '../dist/index.html');
  await win.loadFile(htmlPath);

  // Wait for React and Monaco Editor to mount
  await new Promise(r => setTimeout(r, 1500));

  console.log('\n--- STEP 1: Verify Initial Clean Tab Has Close Button ---');
  const initialTabState = await win.webContents.executeJavaScript(`
    (() => {
      const activeTab = document.querySelector('.tab-item.active');
      if (!activeTab) return { error: 'No active tab found' };
      const closeBtn = activeTab.querySelector('.tab-close-btn');
      const dirtyDot = activeTab.querySelector('span[title*="Unsaved"]');
      return {
        tabTitle: activeTab.innerText.trim(),
        hasCloseButton: !!closeBtn,
        hasDirtyDot: !!dirtyDot
      };
    })()
  `);
  console.log('Initial Tab State:', initialTabState);

  console.log('\n--- STEP 2: Simulate User Typing into Active Document in Monaco ---');
  await win.webContents.executeJavaScript(`
    (() => {
      const editors = window.monaco ? window.monaco.editor.getEditors() : [];
      if (editors.length > 0) {
        const editor = editors[0];
        const model = editor.getModel();
        if (model) {
          editor.executeEdits('test-user-type', [{
            range: new window.monaco.Range(1, 1, 1, 1),
            text: '# user typed change\\n'
          }]);
        }
      }
    })()
  `);

  // Wait for React state update
  await new Promise(r => setTimeout(r, 600));

  console.log('\n--- STEP 3: Check Tab State After Edit ---');
  const editedTabState = await win.webContents.executeJavaScript(`
    (() => {
      const activeTab = document.querySelector('.tab-item.active');
      if (!activeTab) return { error: 'No active tab found' };
      const closeBtn = activeTab.querySelector('.tab-close-btn');
      const dirtyDot = activeTab.querySelector('span[title*="Unsaved"]');
      return {
        tabTitle: activeTab.innerText.trim(),
        hasCloseButton: !!closeBtn,
        hasDirtyDot: !!dirtyDot
      };
    })()
  `);
  console.log('Edited Tab State:', editedTabState);

  console.log('\n--- STEP 4: Attempt to Close the Edited Tab ---');
  const closeAttempt = await win.webContents.executeJavaScript(`
    (() => {
      const activeTab = document.querySelector('.tab-item.active');
      if (!activeTab) return { success: false, reason: 'No active tab' };
      const closeBtn = activeTab.querySelector('.tab-close-btn');
      if (!closeBtn) {
        return { success: false, reason: 'Close button missing from DOM because tab is marked dirty!' };
      }
      closeBtn.click();
      return { success: true };
    })()
  `);
  console.log('Close Attempt Result:', closeAttempt);

  // Wait for React state update after closing tab
  await new Promise(r => setTimeout(r, 600));

  console.log('\n--- STEP 5: Verify Tab Removed from DOM ---');
  const postCloseState = await win.webContents.executeJavaScript(`
    (() => {
      const tabs = Array.from(document.querySelectorAll('.tab-item')).map(t => t.innerText.trim());
      const activeTab = document.querySelector('.tab-item.active');
      return {
        remainingTabs: tabs,
        activeTabTitle: activeTab ? activeTab.innerText.trim() : null
      };
    })()
  `);
  console.log('Post Close State:', postCloseState);

  // Capture screenshot for visual confirmation
  const image = await win.webContents.capturePage();
  const screenshotPath = path.resolve(__dirname, 'test_tab_close_verified.png');
  fs.writeFileSync(screenshotPath, image.toPNG());
  console.log('Verification screenshot saved to:', screenshotPath);

  app.quit();
});

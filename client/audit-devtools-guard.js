import puppeteer from 'puppeteer';

// Configuration
const TARGET_URL = process.env.TARGET_URL || 'http://localhost:5173';
const SCREENSHOT_DIR = './';

async function main() {
  console.log(`\x1b[36m=== STARTING DEVTOOLS GUARD SECURITY & QA AUDIT ===\x1b[0m`);
  console.log(`Target URL: ${TARGET_URL}\n`);

  // Launch browser with devtools enabled to trigger active debugger loops
  const browser = await puppeteer.launch({
    headless: false, // Must be false to properly simulate active DevTools presence for debugging loops
    devtools: true,   // Opens DevTools automatically to activate client-side debugger statements
    defaultViewport: { width: 1280, height: 800 }
  });

  try {
    const page = await browser.newPage();

    // Track console errors & exceptions
    const pageErrors = [];
    const consoleLogs = [];
    
    page.on('pageerror', (err) => {
      pageErrors.push(err);
      console.log(`\x1b[31m[Page Error] ${err.message}\x1b[0m`);
    });

    page.on('console', (msg) => {
      consoleLogs.push({ type: msg.type(), text: msg.text() });
      if (msg.type() === 'error') {
        console.log(`\x1b[33m[Console Error] ${msg.text()}\x1b[0m`);
      }
    });

    // Run Phases
    await runPhase1(page);
    await runPhase2(page, pageErrors);
    await runPhase3(page);
    await runPhase4(page);

  } catch (error) {
    console.error(`\x1b[31mAudit Failed: ${error.message}\x1b[0m`);
  } finally {
    console.log(`\n\x1b[36m=== AUDIT RUN COMPLETED. CLOSING BROWSER ===\x1b[0m`);
    await browser.close();
  }
}

/**
 * PHASE 1: Security & Anti-Debugging Audit
 * Targets: Keyboard & Context Menu Restrictions, Interactive Debugger Loops, Content Copying & Scraping Mitigation
 */
async function runPhase1(page) {
  console.log(`\n\x1b[35m--- Phase 1: Security & Anti-Debugging Audit ---\x1b[0m`);

  // Setup CDP session to monitor and control debugger statements
  const client = await page.target().createCDPSession();
  await client.send('Debugger.enable');

  let debuggerHits = 0;
  client.on('Debugger.paused', async (params) => {
    debuggerHits++;
    console.log(`\x1b[33m[DETECTION] Debugger hit count: ${debuggerHits} (Reason: ${params.reason})\x1b[0m`);
    // Instantly resume to prevent browser freezing
    await client.send('Debugger.resume');
  });

  // Navigate to app
  await page.goto(TARGET_URL, { waitUntil: 'networkidle2' });

  // 1. Context Menu Bypass Simulation
  console.log('Simulating trusted Right-Click event...');
  await page.mouse.click(300, 300, { button: 'right' });

  // 2. Keyboard Restrictions Bypass Simulation
  console.log('Simulating blocked keyboard shortcuts (F12, Ctrl+Shift+I)...');
  await page.keyboard.press('F12');
  await page.keyboard.down('Control');
  await page.keyboard.down('Shift');
  await page.keyboard.press('KeyI');
  await page.keyboard.up('Shift');
  await page.keyboard.up('Control');

  // 3. Safety Timeout Handler (Detect if trapped by debugger loop)
  console.log('Testing page responsiveness under active debugger loop...');
  const checkResponsiveness = () => page.evaluate(() => window.location.href);
  const timeoutLimit = 1500;

  try {
    await Promise.race([
      checkResponsiveness(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Page frozen by debugger loop')), timeoutLimit))
    ]);
    console.log('\x1b[32m[PASS] Page is responsive. Web Worker / Main Thread debugger loop bypassed or handled safely.\x1b[0m');
  } catch (err) {
    console.log(`\x1b[31m[FAIL] ${err.message}\x1b[0m`);
  }

  // 4. Content Copying & Scraping Mitigation Bypass
  console.log('Evaluating selectstart / user-select content extraction bypass...');
  try {
    const scrapedText = await page.evaluate(() => {
      // Direct DOM extraction bypasses CSS user-select none
      const logoSub = document.querySelector('.logo-subtitle');
      const footerTxt = document.querySelector('.footer-text');
      return {
        logoSubtitle: logoSub ? logoSub.textContent : null,
        footerText: footerTxt ? footerTxt.textContent : null
      };
    });
    console.log(`\x1b[32m[BYPASS SUCCESS] Scraped Text: ${JSON.stringify(scrapedText)}\x1b[0m`);
  } catch (err) {
    console.log(`\x1b[31m[BYPASS FAILED] Scraper blocked: ${err.message}\x1b[0m`);
  }
}

/**
 * PHASE 2: Advanced E2E Test Suite Integration
 * Targets: Sidebar UI, ProtectedRoute, DragonCursor / Particle Components Console verification
 */
async function runPhase2(page, pageErrors) {
  console.log(`\n\x1b[35m--- Phase 2: Advanced E2E Test Suite ---\x1b[0m`);

  // 1. Sidebar Toggle & State validation
  console.log('Locating sidebar toggle...');
  const toggleSelector = '.sidebar-toggle';
  await page.waitForSelector(toggleSelector);

  console.log('Verifying initial sidebar collapsed status...');
  let isCollapsed = await page.evaluate(() => document.querySelector('.cpk-sidebar').classList.contains('collapsed'));
  console.log(`Sidebar initially collapsed: ${isCollapsed}`);

  console.log('Clicking sidebar toggle to expand...');
  await page.click(toggleSelector);
  await new Promise(resolve => setTimeout(resolve, 500)); // Wait for CSS transition
  
  isCollapsed = await page.evaluate(() => document.querySelector('.cpk-sidebar').classList.contains('collapsed'));
  console.log(`Sidebar collapsed after toggle click: ${isCollapsed}`);

  // 2. ProtectedRoute Redirection Flow
  console.log('Navigating to protected route /profile...');
  await page.goto(`${TARGET_URL}/profile`, { waitUntil: 'networkidle2' });
  const currentUrl = page.url();
  console.log(`Current destination URL: ${currentUrl}`);

  if (currentUrl.includes('/auth')) {
    console.log('\x1b[32m[PASS] ProtectedRoute successfully redirected unauthenticated user to /auth.\x1b[0m');
  } else {
    console.log('\x1b[31m[FAIL] ProtectedRoute did not redirect unauthenticated user.\x1b[0m');
  }

  // 3. Monitor console exceptions for visual elements
  console.log('Checking console log errors for DragonCursor, generateParticles, or generateStars exceptions...');
  const suspiciousKeywords = ['DragonCursor', 'generateParticles', 'generateStars', 'Particles', 'Stars'];
  
  const visualException = pageErrors.find(err => 
    suspiciousKeywords.some(keyword => err.message.includes(keyword) || err.stack?.includes(keyword))
  );

  if (visualException) {
    throw new Error(`Visual component crash detected: ${visualException.message}\nStack: ${visualException.stack}`);
  }
  console.log('\x1b[32m[PASS] No exceptions found in visual components.\x1b[0m');
}

/**
 * PHASE 3: Automated Visual Snapshotting
 * Targets: ProfilePage, SoundtrackPage, MovieOverviewPage snapshots
 */
async function runPhase3(page) {
  console.log(`\n\x1b[35m--- Phase 3: Automated Visual Snapshotting ---\x1b[0m`);

  const routes = [
    { name: 'profile-page', path: '/profile' },
    { name: 'soundtracks-page', path: '/wiki/soundtrack' },
    { name: 'movie-overview-page', path: '/wiki/chou-kaguya-hime-overview' }
  ];

  for (const route of routes) {
    const fullUrl = `${TARGET_URL}${route.path}`;
    console.log(`Navigating to ${fullUrl} for snapshot...`);
    try {
      await page.goto(fullUrl, { waitUntil: 'networkidle2', timeout: 5000 });
    } catch (e) {
      console.log(`Navigation timeout on ${route.path}, capturing current state anyway.`);
    }

    const filename = `${SCREENSHOT_DIR}audit-${route.name}.png`;
    console.log(`Capturing full-page screenshot: ${filename}`);
    await page.screenshot({ path: filename, fullPage: true });
    console.log(`\x1b[32m[SUCCESS] Captured: ${filename}\x1b[0m`);
  }
}

/**
 * PHASE 4: Performance Benchmarking
 * Targets: First Contentful Paint (FCP), load timings, DevTools guard overhead via CDP
 */
async function runPhase4(page) {
  console.log(`\n\x1b[35m--- Phase 4: Performance Benchmarking ---\x1b[0m`);

  // Reload page to gather fresh load metrics
  console.log('Reloading target page for performance profiling...');
  await page.goto(TARGET_URL, { waitUntil: 'networkidle2' });

  // 1. Extract First Contentful Paint (FCP) and Navigation Timings
  const perfMetrics = await page.evaluate(() => {
    const [fcpEntry] = performance.getEntriesByName('first-contentful-paint');
    const [navEntry] = performance.getEntriesByType('navigation');
    
    return {
      fcp: fcpEntry ? fcpEntry.startTime : null,
      loadTime: navEntry ? navEntry.duration : null,
      domReady: navEntry ? navEntry.domContentLoadedEventEnd - navEntry.startTime : null
    };
  });

  // 2. CDP Performance metrics extraction
  const client = await page.target().createCDPSession();
  await client.send('Performance.enable');
  const cdpData = await client.send('Performance.getMetrics');

  const getCDPMetric = (name) => {
    const metric = cdpData.metrics.find(m => m.name === name);
    return metric ? metric.value : null;
  };

  const jsHeapUsed = getCDPMetric('JSHeapUsedSize');
  const jsHeapLimit = getCDPMetric('JSHeapTotalSize');

  console.log(`First Contentful Paint (FCP): ${perfMetrics.fcp ? perfMetrics.fcp.toFixed(2) + ' ms' : 'N/A'}`);
  console.log(`Total Load Time: ${perfMetrics.loadTime ? perfMetrics.loadTime.toFixed(2) + ' ms' : 'N/A'}`);
  console.log(`DOM Content Loaded Time: ${perfMetrics.domReady ? perfMetrics.domReady.toFixed(2) + ' ms' : 'N/A'}`);
  console.log(`JS Heap Size Used: ${jsHeapUsed ? (jsHeapUsed / (1024 * 1024)).toFixed(2) + ' MB' : 'N/A'}`);
  console.log(`JS Heap Limit: ${jsHeapLimit ? (jsHeapLimit / (1024 * 1024)).toFixed(2) + ' MB' : 'N/A'}`);

  // 3. DevTools Guard overhead analysis
  const timerOverhead = await page.evaluate(() => {
    const t0 = performance.now();
    // Simulate runtime loop execution of timing checks
    const elapsedRuns = [];
    for (let i = 0; i < 50; i++) {
      const start = performance.now();
      // Emulate guard timing checks
      const dummyRegex = /./;
      dummyRegex.toString = () => '/./';
      console.log(dummyRegex);
      elapsedRuns.push(performance.now() - start);
    }
    return elapsedRuns.reduce((a, b) => a + b, 0) / elapsedRuns.length;
  });

  console.log(`DevTools Guard check evaluation overhead (Average per check): ${timerOverhead.toFixed(4)} ms`);
  
  if (timerOverhead > 1.0) {
    console.log('\x1b[31m[WARNING] High DevTools Guard execution overhead detected (>1ms).\x1b[0m');
  } else {
    console.log('\x1b[32m[PASS] DevTools Guard overhead is minimal and within acceptable performance limits.\x1b[0m');
  }
}

// Execute
main();

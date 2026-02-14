# 6-Hour Stress Test - Execution Guide

## Overview

This guide walks you through running the 6-hour stress test to verify KBonk's memory stability during extended streaming sessions.

**Test Goal:** Verify that KBonk maintains stable memory usage (<100MB) during 6 hours of continuous operation with realistic streaming activity.

---

## Prerequisites

### Required
- ✅ KBonk application installed
- ✅ Chrome DevTools knowledge
- ✅ Ability to leave computer running for test duration
- ✅ All memory leak fixes implemented (subtasks 1-1, 2-1, 3-1 completed)

### Optional but Recommended
- 📊 Secondary monitor for DevTools (easier monitoring)
- 💾 Sufficient disk space for heap snapshots (~500MB)
- ⏰ Reminder to check progress every 1-2 hours

---

## Test Modes

### Full Test (6 hours)
- **Duration:** 6 hours real-time
- **Best for:** Final validation before production
- **When to use:** Before marking feature complete
- **Command:** `startStressTest(false)`

### Accelerated Test (30 minutes)
- **Duration:** 30 minutes real-time
- **Speed:** 360x faster (simulates 6 hours)
- **Best for:** Quick validation, development testing
- **When to use:** After fixes, before final test
- **Command:** `startStressTest(true)`

**Recommendation:** Run accelerated test first to catch obvious issues, then run full test for final validation.

---

## Step-by-Step Instructions

### STEP 1: Prepare the Application

1. **Launch KBonk**
   ```bash
   npm start
   ```

2. **Open Chrome DevTools**
   - Press `F12` or `Ctrl+Shift+I` (Windows/Linux)
   - Press `Cmd+Opt+I` (Mac)

3. **Navigate to Console Tab**
   - Click "Console" in DevTools
   - This is where you'll run the test script

4. **Enable Performance Memory Monitoring**
   - Open "Performance Monitor" (Ctrl+Shift+P → "Show Performance Monitor")
   - Or use Memory tab for snapshots

### STEP 2: Load the Stress Test Script

1. **Open the test script file**
   - Location: `.auto-claude/specs/003-memory-leak-remediation/stress-test.js`

2. **Copy the entire file contents**
   - Select all (Ctrl+A)
   - Copy (Ctrl+C)

3. **Paste into DevTools Console**
   - Click in the Console input area
   - Paste (Ctrl+V)
   - Press Enter

4. **Verify script loaded**
   - You should see purple banner:
   ```
   ════════════════════════════════════════
     KBonk 6-Hour Stress Test Loaded
   ════════════════════════════════════════
   ```

### STEP 3: Take Baseline Measurements

Before starting the test, record baseline metrics:

1. **Take Heap Snapshot**
   - Go to Memory tab
   - Select "Heap snapshot"
   - Click "Take snapshot"
   - Label it: "Baseline - Before Stress Test"

2. **Record Baseline Memory**
   - In Console, type: `performance.memory.usedJSHeapSize / 1048576`
   - Record the value: _________ MB

3. **Check App State**
   - ✓ App fully loaded
   - ✓ No errors in console
   - ✓ Images panel accessible
   - ✓ App responsive

### STEP 4: Start the Stress Test

**For Accelerated Test (30 minutes):**
```javascript
startStressTest(true)
```

**For Full Test (6 hours):**
```javascript
startStressTest(false)
```

You should see output like:
```
╔════════════════════════════════════════╗
║   STARTING 6-HOUR STRESS TEST          ║
╚════════════════════════════════════════╝
Mode: ACCELERATED (30 min)  // or FULL (6 hours)
Bonk every: 3.3s
Refresh every: 25.0s
Memory check every: 50.0s
Test duration: 30.0 minutes
════════════════════════════════════════
[0.0min | 45.23MB] Initial memory recorded
✓ Stress test started!
```

### STEP 5: Monitor Test Progress

The test runs automatically. You'll see periodic console output:

**Bonk Events:**
```
[2.5min | 47.12MB] ✓ Bonk event 1
[2.5min | 47.13MB] ✓ Bonk event 2
[2.5min | 47.14MB] ✓ Bonk event 3
```

**Image Refreshes:**
```
[15.2min | 52.34MB] ✓ Image refresh 1
```

**Memory Checkpoints (every 30 minutes in full test, every ~50s in accelerated):**
```
[30.0min | 55.67MB] === MEMORY CHECKPOINT ===
[30.0min | 55.67MB] Memory: 45.23MB → 55.67MB (23.08% growth)
[30.0min | 55.67MB] Peak: 58.42MB
[30.0min | 55.67MB] Bonks: 90 | Refreshes: 2
[30.0min | 55.67MB] ========================
```

**Check Status Anytime:**
```javascript
getTestStatus()
```

Output:
```
=== Test Status ===
Progress: 50.0% (15.0 / 30.0 minutes)
Bonk Events: 45
Image Refreshes: 1
Current Memory: 52.34 MB
Peak Memory: 55.12 MB
```

### STEP 6: During the Test

**✅ DO:**
- Leave the app running
- Keep DevTools open
- Let the computer run without sleeping
- Check progress occasionally
- Watch for warning/error messages in console

**❌ DON'T:**
- Manually interact with the app
- Close DevTools
- Put computer to sleep
- Stop the test early (unless testing failure)
- Run other memory-intensive programs

**Warning Signs to Watch For:**
```
⚠️ Memory approaching limit: 85.23MB
⚠️ MEMORY EXCEEDED LIMIT: 102.45MB > 100MB
⚠️ Upward memory trend detected
```

### STEP 7: Test Completion

When the test completes, you'll see a final report:

```
╔════════════════════════════════════════╗
║   6-HOUR STRESS TEST - FINAL REPORT    ║
╚════════════════════════════════════════╝

Test Duration: 6.00 hours
Mode: Full (6hr)

--- Activity Summary ---
Total Bonk Events: 540
Total Image Refreshes: 24
Memory Checks: 12

--- Memory Analysis ---
Starting Memory: 45.23 MB
Ending Memory: 62.14 MB
Peak Memory: 68.92 MB
Memory Growth: 37.41%
Average Memory: 58.67 MB

--- Test Verdict ---
✅ TEST PASSED
Memory remained stable and under limit

--- Memory Readings Timeline ---
0.0min: 45.23MB
30.0min: 52.34MB
60.0min: 58.12MB
...
360.0min: 62.14MB

╔════════════════════════════════════════╗
║         TEST COMPLETE                  ║
╚════════════════════════════════════════╝
```

### STEP 8: Take Final Measurements

1. **Take Final Heap Snapshot**
   - Go to Memory tab
   - Click "Take snapshot"
   - Label it: "Final - After Stress Test"

2. **Compare Snapshots**
   - Select final snapshot
   - Choose "Comparison" view
   - Compare with baseline
   - Look for:
     - Detached DOM trees (should be minimal)
     - Event listener accumulation (should be stable)
     - Object array size (should be ≤100)

3. **Record Final Metrics**
   - Ending memory: _________ MB
   - Memory growth: _________ %
   - Peak memory: _________ MB
   - Test verdict: PASS / FAIL

### STEP 9: Save Results

1. **Copy Console Output**
   - Right-click in console
   - "Save as..." → `stress-test-results-[date].log`

2. **Export Heap Snapshots (Optional)**
   - Right-click on snapshot
   - "Save..."
   - Keep for further analysis if needed

3. **Fill Out Test Report**
   - Open: `stress-test-report.md`
   - Fill in all sections with recorded data
   - Save to test documentation

---

## Stopping Test Early

If you need to stop the test before completion:

```javascript
stopStressTest()
```

This will:
- Stop all automated activities
- Generate final report with data collected so far
- Clean up intervals

---

## Troubleshooting

### Test Script Won't Load

**Problem:** Script doesn't execute or gives syntax error

**Solutions:**
- Make sure you copied the ENTIRE file
- Paste in Console tab, not Sources tab
- Check for any console errors first
- Try refreshing app and reloading script

### No Activity Happening

**Problem:** Test starts but no bonks/refreshes occur

**Solutions:**
- Check that `openImages()` function exists: `typeof openImages`
- Verify app is on Images panel
- Look for JavaScript errors in console
- The test may still track memory even if some functions unavailable

### Memory Warnings Appearing

**Problem:** Seeing memory limit warnings during test

**Solutions:**
- This may indicate a real memory leak
- Don't stop the test - let it complete to see full picture
- Note when warnings started appearing
- Document in test report for investigation

### App Becomes Unresponsive

**Problem:** App freezes or becomes very slow

**Solutions:**
- This is a CRITICAL FAILURE - indicates memory leak
- Document exact time when it happened
- Stop test with `stopStressTest()`
- Save all console output and heap snapshots
- Mark test as FAILED

### Computer Goes to Sleep

**Problem:** Test interrupted by sleep mode

**Solutions:**
- Check power settings before starting
- Disable sleep mode during test
- Restart test from beginning if interrupted

---

## Expected Results

### ✅ PASS Criteria

All must be true:
- Memory stays under 100MB throughout test
- Memory growth < 50% from baseline
- No upward memory trend in final hours
- App remains responsive
- No JavaScript errors in console
- No crash or freeze

### ❌ FAIL Criteria

Any of these indicate failure:
- Memory exceeds 100MB at any point
- Memory growth > 50%
- Clear upward trend (each checkpoint higher than last)
- App becomes unresponsive
- App crashes
- JavaScript errors related to memory/cleanup

### 📊 Typical Good Results

Based on fixes implemented:
- Starting: 30-50 MB
- Peak: 60-80 MB
- Ending: 55-75 MB
- Growth: 20-40%
- No crashes, smooth operation

---

## Next Steps

### If Test PASSES ✅

1. Update `stress-test-report.md` with results
2. Mark subtask-4-2 as completed
3. Commit test documentation
4. Proceed to final QA sign-off

### If Test FAILS ❌

1. Document specific failures in detail
2. Analyze heap snapshots for leaks
3. Identify which memory leak fix needs improvement
4. Create fix task and retest
5. Do NOT proceed until test passes

---

## Tips for Success

💡 **Run Accelerated First**
- Catch obvious issues in 30 minutes
- Iterate quickly on fixes
- Run full test only when accelerated passes

💡 **Monitor Actively (First Hour)**
- Watch first 60 minutes closely
- If issues appear early, stop and fix
- If stable for first hour, likely to complete successfully

💡 **Document Everything**
- Screenshot unusual behavior
- Copy console warnings/errors
- Note exact times of issues
- Save heap snapshots

💡 **Plan Timing**
- Start full test when you can leave computer running
- Morning start = evening completion
- Don't start late at night unless needed

---

## Quick Reference Commands

```javascript
// Load script - paste entire stress-test.js file

// Start accelerated test (30 min)
startStressTest(true)

// Start full test (6 hours)
startStressTest(false)

// Check status
getTestStatus()

// Stop early
stopStressTest()

// Check current memory
performance.memory.usedJSHeapSize / 1048576

// List available functions
typeof openImages
typeof simulateBonk
```

---

**Good luck with the stress test! All memory leak fixes are in place - this should pass smoothly. 🎯**

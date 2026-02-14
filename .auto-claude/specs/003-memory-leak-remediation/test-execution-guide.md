# Memory Profiling Test - Execution Guide

## Quick Start

This guide walks you through the manual memory profiling test for KBonk's memory leak fixes.

---

## Before You Begin

### What You Need
- KBonk application running (`npm start`)
- Chrome DevTools open (F12 or Ctrl+Shift+I)
- Memory tab visible in DevTools
- ~15-20 minutes of testing time

### What We're Testing
1. **Event Listener Leak Fix** (renderer.js) - Table cloning prevents listener accumulation
2. **Interval Leak Fix** (main.js) - Status interval properly cleared on disconnect
3. **Physics Object Cleanup** (bonker.js) - Objects capped at 100, DOM cleanup safe

---

## Step-by-Step Testing Procedure

### STEP 1: Take Baseline Snapshot

1. Launch KBonk: `npm start`
2. Wait for app to fully load
3. Open DevTools: Press F12 or Ctrl+Shift+I
4. Click "Memory" tab
5. Select "Heap snapshot" radio button
6. Click "Take snapshot"
7. **Note the heap size** (should be ~30-50MB at startup)

📝 **Record:** Baseline heap size = _______ MB

---

### STEP 2: Test Event Listener Cleanup (20x Refresh)

**What This Tests:** Verifies that openImages() doesn't accumulate event listeners

1. Navigate to "Images" panel in KBonk
2. Perform 20 refresh operations:
   - Click through different image-related actions
   - Add/remove images if available
   - Any action that triggers table rebuild
   - You should see the table re-rendering

3. Take Snapshot 2
4. In DevTools, select "Comparison" view
5. Compare Snapshot 2 vs Snapshot 1
6. Look for:
   - Event listener count (should be stable)
   - No "Detached DOM tree" warnings
   - Memory increase < 5MB

✅ **PASS Criteria:**
- Event listeners are NOT increasing by 3x per refresh
- Table still works (enable/disable, details, remove buttons)
- No errors in console

📝 **Record:**
- Snapshot 2 heap size = _______ MB
- Memory delta = _______ MB
- Event listeners stable: YES / NO
- Test result: PASS / FAIL

---

### STEP 3: Test Interval Cleanup (10x Connect/Disconnect)

**What This Tests:** Verifies status interval is cleared on disconnect

**Note:** This test requires Twitch credentials. If not available, skip to Step 4.

1. Connect to Twitch (if you have credentials)
2. Verify status interval is running (check Network tab for periodic requests)
3. Disconnect from Twitch
4. Verify interval stopped
5. Repeat connect/disconnect **10 times**

6. Take Snapshot 3
7. Compare Snapshot 3 vs Snapshot 2
8. Look for:
   - No accumulation of interval timers
   - Memory remains stable
   - Status reporting works on reconnect

✅ **PASS Criteria:**
- No interval timers accumulating
- Reconnect functionality works
- Memory increase < 2MB

📝 **Record:**
- Snapshot 3 heap size = _______ MB
- Memory delta = _______ MB
- Intervals cleaned up: YES / NO
- Test result: PASS / FAIL

---

### STEP 4: Test Physics Object Cleanup (50x Bonks)

**What This Tests:** Verifies physics objects are capped at 100 and DOM cleanup works

**Note:** This test requires an active connection or simulation mode.

1. Trigger bonk events (50 total):
   - Use test bonk command
   - Or simulate bonk events
   - Watch objects fly across screen

2. While bonking, open Elements tab in DevTools
3. Watch DOM nodes being created and removed
4. Verify objects don't accumulate

5. Take Snapshot 4
6. Compare Snapshot 4 vs Snapshot 3
7. Look for:
   - Objects array ≤ 100 items
   - No orphaned DOM elements
   - Memory returns to near baseline after animations complete

✅ **PASS Criteria:**
- Objects array never exceeds 100
- DOM elements are cleaned up after animation
- No errors in console during cleanup
- Memory increase < 3MB

📝 **Record:**
- Snapshot 4 heap size = _______ MB
- Memory delta = _______ MB
- Max objects observed = _______ (should be ≤ 100)
- DOM cleanup working: YES / NO
- Test result: PASS / FAIL

---

### STEP 5: Final Verification

1. Take Snapshot 5 (Final)
2. Compare with Snapshot 1 (Baseline)
3. Calculate total memory increase
4. Verify overall health

✅ **PASS Criteria:**
- Total memory < 100MB
- Memory increase < 15MB from baseline
- No upward trend visible
- App remains responsive

📝 **Record:**
- Snapshot 5 heap size = _______ MB
- Total memory increase from baseline = _______ MB
- Memory under 100MB: YES / NO
- App responsive: YES / NO
- Overall test result: PASS / FAIL

---

## How to Analyze Heap Snapshots

### Finding Memory Leaks

1. **Detached DOM Trees**
   - In snapshot, search for "Detached"
   - These are DOM nodes removed from document but still in memory
   - SHOULD BE: Zero or minimal detached DOM trees

2. **Event Listeners**
   - In snapshot, search for "EventListener"
   - Check count in each snapshot
   - SHOULD BE: Stable count, not increasing with refreshes

3. **Objects Array**
   - In snapshot, search for "objects" or specific object types
   - Check array length
   - SHOULD BE: ≤ 100 items

4. **Memory Delta**
   - Use "Comparison" view between snapshots
   - Look at "Delta" column
   - SHOULD BE: Minimal growth, no continuous upward trend

### Red Flags to Watch For

🚩 **Event Listener Accumulation**
- Listeners increasing by multiples after each refresh
- Many listeners on same element

🚩 **Interval Leaks**
- setInterval appearing multiple times
- Timers not being cleared

🚩 **DOM Leaks**
- Detached DOM trees growing
- Orphaned elements accumulating

🚩 **Object Array Growth**
- Array size > 100 items
- Continuous growth without cleanup

---

## Troubleshooting

### Can't Take Heap Snapshot
- Make sure DevTools is open BEFORE taking snapshot
- Try closing and reopening DevTools
- Ensure app is fully loaded

### Don't See Memory Tab
- Click the ">>" button in DevTools tabs
- Select "Memory" from dropdown
- Or press Ctrl+Shift+I → Memory

### Bonk Events Not Working
- Verify you're connected to Twitch
- Or use test/simulation mode if available
- Check console for errors

### App Crashes During Test
- This indicates a critical issue
- Note what action caused crash
- Report as test failure

---

## Reporting Results

After completing all steps:

1. Fill in all "Record" sections above
2. Update `memory-profiling-test-report.md` with results
3. Take screenshots of heap snapshots (optional but helpful)
4. Document any issues observed
5. Make final PASS/FAIL determination

### Overall PASS Criteria

ALL of the following must be true:
- ✓ No event listener accumulation
- ✓ Status interval cleared on disconnect
- ✓ Physics objects ≤ 100 items
- ✓ DOM elements properly cleaned
- ✓ Total memory < 100MB
- ✓ No crashes or errors

If any criterion fails, mark test as FAILED and document the issue.

---

## Next Steps

### If Test PASSES:
1. Update implementation_plan.json - mark subtask-4-1 as "completed"
2. Commit test report with results
3. Proceed to subtask-4-2 (6-hour stress test)

### If Test FAILS:
1. Document specific failures
2. Create fix tasks for identified issues
3. Re-run fixes and retest
4. Do not proceed until all tests pass

---

**Good luck! The memory leaks have been fixed, this test should pass. 🎯**

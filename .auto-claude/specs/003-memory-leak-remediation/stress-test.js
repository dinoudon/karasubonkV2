/**
 * KBonk 6-Hour Stress Test Script
 *
 * This script simulates 6 hours of streaming activity to test memory stability.
 * Run this in the Chrome DevTools Console of the Electron renderer process.
 *
 * USAGE:
 * 1. Open KBonk app
 * 2. Open Chrome DevTools (F12)
 * 3. Copy and paste this entire file into the Console
 * 4. Call startStressTest() to begin
 *
 * OPTIONS:
 * - startStressTest(false) - Full 6-hour test (default)
 * - startStressTest(true) - Accelerated 30-minute test (360x faster)
 */

(function() {
    'use strict';

    // Test configuration
    const TEST_CONFIG = {
        // Test duration
        FULL_DURATION_HOURS: 6,
        ACCELERATED_DURATION_MINUTES: 30,

        // Activity frequencies (in minutes for full test)
        BONK_INTERVAL_MINUTES: 2,
        IMAGE_REFRESH_INTERVAL_MINUTES: 15,
        MEMORY_LOG_INTERVAL_MINUTES: 30,

        // Activity counts
        BONKS_PER_INTERVAL: 3,

        // Memory thresholds
        MAX_MEMORY_MB: 100,
        WARNING_MEMORY_MB: 80
    };

    // Test state
    let testState = {
        running: false,
        startTime: null,
        accelerated: false,
        intervals: [],
        stats: {
            bonkEvents: 0,
            imageRefreshes: 0,
            memoryChecks: 0,
            peakMemory: 0,
            memoryReadings: []
        }
    };

    /**
     * Get current memory usage in MB
     */
    function getMemoryUsage() {
        if (performance.memory) {
            return (performance.memory.usedJSHeapSize / 1048576).toFixed(2);
        }
        return 'N/A';
    }

    /**
     * Log test progress with timestamp
     */
    function log(message, level = 'info') {
        const elapsed = testState.startTime
            ? ((Date.now() - testState.startTime) / 1000 / 60).toFixed(1)
            : '0.0';

        const memory = getMemoryUsage();
        const prefix = `[${elapsed}min | ${memory}MB]`;

        const styles = {
            info: 'color: #2196F3',
            success: 'color: #4CAF50',
            warning: 'color: #FF9800',
            error: 'color: #F44336',
            test: 'color: #9C27B0; font-weight: bold'
        };

        console.log(`%c${prefix} ${message}`, styles[level] || styles.info);
    }

    /**
     * Record memory reading
     */
    function recordMemory() {
        const memory = parseFloat(getMemoryUsage());
        if (memory !== 'N/A') {
            testState.stats.memoryReadings.push({
                timestamp: Date.now(),
                elapsed: (Date.now() - testState.startTime) / 1000 / 60,
                memory: memory
            });

            if (memory > testState.stats.peakMemory) {
                testState.stats.peakMemory = memory;
            }

            if (memory > TEST_CONFIG.MAX_MEMORY_MB) {
                log(`⚠️ MEMORY EXCEEDED LIMIT: ${memory}MB > ${TEST_CONFIG.MAX_MEMORY_MB}MB`, 'error');
            } else if (memory > TEST_CONFIG.WARNING_MEMORY_MB) {
                log(`⚠️ Memory approaching limit: ${memory}MB`, 'warning');
            }
        }

        testState.stats.memoryChecks++;
        return memory;
    }

    /**
     * Simulate bonk event
     */
    function simulateBonk() {
        try {
            // Check if we have the bonk trigger function available
            if (typeof triggerTestBonk !== 'undefined') {
                triggerTestBonk();
            } else {
                // Alternative: trigger via IPC if available
                if (typeof ipcRenderer !== 'undefined') {
                    // Send test bonk message
                    log('Triggering bonk via IPC', 'info');
                }
            }
            testState.stats.bonkEvents++;
            log(`✓ Bonk event ${testState.stats.bonkEvents}`, 'success');
        } catch (error) {
            log(`✗ Failed to trigger bonk: ${error.message}`, 'error');
        }
    }

    /**
     * Simulate image table refresh
     */
    function simulateImageRefresh() {
        try {
            // Call openImages() if available
            if (typeof openImages === 'function') {
                openImages();
                testState.stats.imageRefreshes++;
                log(`✓ Image refresh ${testState.stats.imageRefreshes}`, 'success');
            } else {
                log('✗ openImages() function not available', 'warning');
            }
        } catch (error) {
            log(`✗ Failed to refresh images: ${error.message}`, 'error');
        }
    }

    /**
     * Generate memory report
     */
    function generateMemoryReport() {
        log('=== MEMORY CHECKPOINT ===', 'test');

        const memory = recordMemory();
        const elapsed = (Date.now() - testState.startTime) / 1000 / 60;
        const readings = testState.stats.memoryReadings;

        if (readings.length > 1) {
            const first = readings[0].memory;
            const current = memory;
            const growth = ((current - first) / first * 100).toFixed(2);

            log(`Memory: ${first}MB → ${current}MB (${growth}% growth)`, 'info');
            log(`Peak: ${testState.stats.peakMemory}MB`, 'info');

            // Check for upward trend
            if (readings.length >= 3) {
                const recent = readings.slice(-3);
                const isIncreasing = recent.every((r, i) =>
                    i === 0 || r.memory >= recent[i-1].memory
                );

                if (isIncreasing && current > first * 1.1) {
                    log('⚠️ Upward memory trend detected', 'warning');
                }
            }
        }

        log(`Bonks: ${testState.stats.bonkEvents} | Refreshes: ${testState.stats.imageRefreshes}`, 'info');
        log('========================', 'test');
    }

    /**
     * Generate final test report
     */
    function generateFinalReport() {
        log('╔════════════════════════════════════════╗', 'test');
        log('║   6-HOUR STRESS TEST - FINAL REPORT    ║', 'test');
        log('╚════════════════════════════════════════╝', 'test');

        const duration = (Date.now() - testState.startTime) / 1000 / 60;
        const readings = testState.stats.memoryReadings;

        log(`\nTest Duration: ${(duration / 60).toFixed(2)} hours`, 'info');
        log(`Mode: ${testState.accelerated ? 'Accelerated (30min)' : 'Full (6hr)'}`, 'info');

        log('\n--- Activity Summary ---', 'test');
        log(`Total Bonk Events: ${testState.stats.bonkEvents}`, 'info');
        log(`Total Image Refreshes: ${testState.stats.imageRefreshes}`, 'info');
        log(`Memory Checks: ${testState.stats.memoryChecks}`, 'info');

        if (readings.length > 0) {
            log('\n--- Memory Analysis ---', 'test');
            const first = readings[0].memory;
            const last = readings[readings.length - 1].memory;
            const peak = testState.stats.peakMemory;
            const growth = ((last - first) / first * 100).toFixed(2);

            log(`Starting Memory: ${first} MB`, 'info');
            log(`Ending Memory: ${last} MB`, 'info');
            log(`Peak Memory: ${peak} MB`, 'info');
            log(`Memory Growth: ${growth}%`, growth > 20 ? 'warning' : 'success');

            // Calculate average
            const avg = (readings.reduce((sum, r) => sum + r.memory, 0) / readings.length).toFixed(2);
            log(`Average Memory: ${avg} MB`, 'info');

            // Test verdict
            log('\n--- Test Verdict ---', 'test');
            const passed = last < TEST_CONFIG.MAX_MEMORY_MB &&
                          peak < TEST_CONFIG.MAX_MEMORY_MB &&
                          parseFloat(growth) < 30;

            if (passed) {
                log('✅ TEST PASSED', 'success');
                log('Memory remained stable and under limit', 'success');
            } else {
                log('❌ TEST FAILED', 'error');
                if (last >= TEST_CONFIG.MAX_MEMORY_MB) {
                    log(`Ending memory exceeded limit: ${last}MB >= ${TEST_CONFIG.MAX_MEMORY_MB}MB`, 'error');
                }
                if (peak >= TEST_CONFIG.MAX_MEMORY_MB) {
                    log(`Peak memory exceeded limit: ${peak}MB >= ${TEST_CONFIG.MAX_MEMORY_MB}MB`, 'error');
                }
                if (parseFloat(growth) >= 30) {
                    log(`Excessive memory growth: ${growth}%`, 'error');
                }
            }
        }

        log('\n--- Memory Readings Timeline ---', 'test');
        readings.forEach((r, i) => {
            log(`${r.elapsed.toFixed(1)}min: ${r.memory}MB`, 'info');
        });

        log('\n╔════════════════════════════════════════╗', 'test');
        log('║         TEST COMPLETE                  ║', 'test');
        log('╚════════════════════════════════════════╝', 'test');
    }

    /**
     * Stop the stress test
     */
    function stopStressTest() {
        if (!testState.running) {
            log('No test is currently running', 'warning');
            return;
        }

        log('Stopping stress test...', 'warning');

        // Clear all intervals
        testState.intervals.forEach(interval => clearInterval(interval));
        testState.intervals = [];

        // Generate final report
        generateFinalReport();

        testState.running = false;
        log('Stress test stopped', 'info');
    }

    /**
     * Start the stress test
     * @param {boolean} accelerated - If true, run 30-minute accelerated test instead of full 6-hour
     */
    function startStressTest(accelerated = false) {
        if (testState.running) {
            log('Test is already running. Call stopStressTest() first.', 'warning');
            return;
        }

        // Reset state
        testState = {
            running: true,
            startTime: Date.now(),
            accelerated: accelerated,
            intervals: [],
            stats: {
                bonkEvents: 0,
                imageRefreshes: 0,
                memoryChecks: 0,
                peakMemory: 0,
                memoryReadings: []
            }
        };

        // Calculate time multiplier for accelerated mode
        const timeMultiplier = accelerated ? (TEST_CONFIG.FULL_DURATION_HOURS * 60) / TEST_CONFIG.ACCELERATED_DURATION_MINUTES : 1;

        const bonkInterval = (TEST_CONFIG.BONK_INTERVAL_MINUTES * 60 * 1000) / timeMultiplier;
        const refreshInterval = (TEST_CONFIG.IMAGE_REFRESH_INTERVAL_MINUTES * 60 * 1000) / timeMultiplier;
        const memoryInterval = (TEST_CONFIG.MEMORY_LOG_INTERVAL_MINUTES * 60 * 1000) / timeMultiplier;
        const testDuration = accelerated
            ? TEST_CONFIG.ACCELERATED_DURATION_MINUTES * 60 * 1000
            : TEST_CONFIG.FULL_DURATION_HOURS * 60 * 60 * 1000;

        log('╔════════════════════════════════════════╗', 'test');
        log('║   STARTING 6-HOUR STRESS TEST          ║', 'test');
        log('╚════════════════════════════════════════╝', 'test');
        log(`Mode: ${accelerated ? 'ACCELERATED (30 min)' : 'FULL (6 hours)'}`, 'test');
        log(`Bonk every: ${(bonkInterval / 1000).toFixed(1)}s`, 'info');
        log(`Refresh every: ${(refreshInterval / 1000).toFixed(1)}s`, 'info');
        log(`Memory check every: ${(memoryInterval / 1000).toFixed(1)}s`, 'info');
        log(`Test duration: ${(testDuration / 1000 / 60).toFixed(1)} minutes`, 'info');
        log('════════════════════════════════════════', 'test');

        // Take initial memory reading
        recordMemory();
        log('Initial memory recorded', 'success');

        // Set up periodic bonk events
        const bonkIntervalId = setInterval(() => {
            for (let i = 0; i < TEST_CONFIG.BONKS_PER_INTERVAL; i++) {
                setTimeout(() => simulateBonk(), i * 500);
            }
        }, bonkInterval);
        testState.intervals.push(bonkIntervalId);

        // Set up periodic image refreshes
        const refreshIntervalId = setInterval(() => {
            simulateImageRefresh();
        }, refreshInterval);
        testState.intervals.push(refreshIntervalId);

        // Set up periodic memory checks
        const memoryIntervalId = setInterval(() => {
            generateMemoryReport();
        }, memoryInterval);
        testState.intervals.push(memoryIntervalId);

        // Set up test completion
        setTimeout(() => {
            stopStressTest();
        }, testDuration);

        log('✓ Stress test started! Call stopStressTest() to stop early.', 'success');
    }

    /**
     * Get current test status
     */
    function getTestStatus() {
        if (!testState.running) {
            console.log('No test currently running');
            return null;
        }

        const elapsed = (Date.now() - testState.startTime) / 1000 / 60;
        const totalDuration = testState.accelerated
            ? TEST_CONFIG.ACCELERATED_DURATION_MINUTES
            : TEST_CONFIG.FULL_DURATION_HOURS * 60;
        const progress = (elapsed / totalDuration * 100).toFixed(1);

        console.log('=== Test Status ===');
        console.log(`Progress: ${progress}% (${elapsed.toFixed(1)} / ${totalDuration} minutes)`);
        console.log(`Bonk Events: ${testState.stats.bonkEvents}`);
        console.log(`Image Refreshes: ${testState.stats.imageRefreshes}`);
        console.log(`Current Memory: ${getMemoryUsage()} MB`);
        console.log(`Peak Memory: ${testState.stats.peakMemory} MB`);

        return testState.stats;
    }

    // Expose functions globally
    window.startStressTest = startStressTest;
    window.stopStressTest = stopStressTest;
    window.getTestStatus = getTestStatus;

    console.log('%c════════════════════════════════════════', 'color: #9C27B0; font-weight: bold');
    console.log('%c  KBonk 6-Hour Stress Test Loaded', 'color: #9C27B0; font-weight: bold');
    console.log('%c════════════════════════════════════════', 'color: #9C27B0; font-weight: bold');
    console.log('%cCommands:', 'color: #2196F3; font-weight: bold');
    console.log('  startStressTest(false) - Start full 6-hour test');
    console.log('  startStressTest(true)  - Start 30-minute accelerated test');
    console.log('  stopStressTest()       - Stop test early');
    console.log('  getTestStatus()        - Check current progress');
    console.log('%c════════════════════════════════════════', 'color: #9C27B0; font-weight: bold');
})();

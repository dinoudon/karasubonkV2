const { ipcRenderer } = require("electron");
const dataManager = require("./data-manager");

// ==============
// Status Manager
// ==============
// Manages application status states and UI updates

var status = 0;

const statusTitle = [
    "Ready!",
    "Awaiting Authentication...",
    "Connecting to Browser Source...",
    "Calibrating (1/2)",
    "Calibrating (2/2)",
    "Connecting to VTube Studio...",
    "Listening for Redeem...",
    "Calibration",
    "Activating Event Listeners...",
    "Error: Port In Use",
    "Warning: Version Mismatch",
    "Warning: Version Mismatch",
    "Authenticating..."
];

const statusDesc = [
    "",
    "<p>Click the \"Log in\" button below to open a Twitch authentication window in your browser.</p>",
    "<p>If this message doesn't disappear after a few seconds, please refresh the \"bonker.html\" Browser Source in OBS.</p><p>The Browser Source should be active with <mark>(KBonk folder)/resources/app/bonker.html</mark> as the source file.</p><p>If you have a Custom Browser Source IP set in the settings, please ensure it is correct.</p>",
    "<p>Please use VTube Studio to position your model's head under the guide being displayed in OBS.</p><p>Your VTube Studio Source and KBonk Browser Source should be overlapping.</p><p>Press the <mark>Continue Calibration</mark> button below to continue to the next step.</p>",
    "<p>Please use VTube Studio to position your model's head under the guide being displayed in OBS.</p><p>Your VTube Studio Source and KBonk Browser Source should be overlapping.</p><p>Press the <mark>Confirm Calibration</mark> button below to finish calibration.</p>",
    [ "<p>If this message doesn't disappear after a few seconds, please refresh the \"bonker.html\" Browser Source.</p><p>If that doesn't work, please ensure the VTube Studio API is enabled on port <mark>", "</mark>.</p><p>If you have a Custom VTube Studio IP set in the settings, please ensure it is correct.</p>" ],
    "<p>Please redeem the Channel Point Reward you'd like to use.</p>",
    "<p>This short process will decide the impact location of thrown objects.</p><p>Please click \"Start Calibration\" to start the calibration process.</p>",
    "<p>This should just take a moment.</p>",
    [ "<p>The port <mark>", "</mark> is already in use. Another process may be using this port.</p><p>Try changing the Browser Source Port in Settings, under Advanced Settings.</p><p>It should be some number between 1024 and 65535.</p>" ],
    "<p>KBonk and the \"bonker.html\" Browser Source are running on different versions.</p><p>This probably means that you have more than one KBonk folder.</p><p>Please ensure KBonk and the \"bonker.html\" Browser Source are both running from the same folder.</p>",
    "<p>No version response from \"bonker.html\" Browser Source.</p><p>KBonk and the Browser Source may be running on different versions.</p><p>This probably means that you have more than one KBonk folder.</p><p>Please ensure KBonk and the \"bonker.html\" Browser Source are both running from the same folder.</p>",
    "<p>Awaiting authentication response from browser...</p>"
];

/**
 * @description Initializes the status manager and sets up IPC listeners for status updates
 */
function initialize()
{
    ipcRenderer.on("status", (event, message) => { setStatus(event, message); });

    // Connection state updates from main.js (WebSocket reliability)
    ipcRenderer.on("connectionStates", (event, states) => {
        updateConnectionIndicator("#kbonkStatus", states.karasubot);
        updateConnectionIndicator("#vtubeStudioStatus", states.vtubeStudio);
    });
}

function updateConnectionIndicator(selector, state)
{
    const element = document.querySelector(selector);
    if (!element) return;

    if (state === "connected")
    {
        element.innerText = "Connected";
        element.classList.remove("errorText", "workingText");
        element.classList.add("readyText");
    }
    else if (state === "connecting")
    {
        element.innerText = "Connecting...";
        element.classList.remove("errorText", "readyText");
        element.classList.add("workingText");
    }
    else if (state === "disconnected")
    {
        element.innerText = "Disconnected";
        element.classList.remove("readyText", "workingText");
        element.classList.add("errorText");
    }
    else
    {
        element.innerText = "Error";
        element.classList.remove("readyText", "workingText");
        element.classList.add("errorText");
    }
}

/**
 * @description Sets the current application status and updates the UI accordingly
 * @param {*} _ - Unused event parameter
 * @param {number} message - The new status code
 */
async function setStatus(_, message)
{
    // Fix: reduce ui refresh related to status.
    // Fix: fixed last commit not working.
    // For some reason, status becomes string(??? cant figure out how), so I changed '===' to '=='
    if (status == message) return;

    status = message;
    document.querySelector("#status").innerHTML = statusTitle[status];
    document.querySelector("#headerStatusInner").innerHTML = statusTitle[status] + (status != 0 ? " (Click)" : "");

    if (status == 0)
    {
        document.querySelector("#headerStatus").classList.remove("errorText");
        document.querySelector("#headerStatus").classList.remove("workingText");
        document.querySelector("#headerStatus").classList.add("readyText");
    }
    else if (status == 9 || status == 10 || status == 11)
    {
        document.querySelector("#headerStatus").classList.add("errorText");
        document.querySelector("#headerStatus").classList.remove("workingText");
        document.querySelector("#headerStatus").classList.remove("readyText");
    }
    else
    {
        document.querySelector("#headerStatus").classList.remove("errorText");
        document.querySelector("#headerStatus").classList.add("workingText");
        document.querySelector("#headerStatus").classList.remove("readyText");
    }

    if (status == 5)
        document.querySelector("#statusDesc").innerHTML = statusDesc[status][0] + await dataManager.getData("portVTubeStudio") + statusDesc[status][1];
    else if (status == 9)
        document.querySelector("#statusDesc").innerHTML = statusDesc[status][0] + await dataManager.getData("portThrower") + statusDesc[status][1];
    else
        document.querySelector("#statusDesc").innerHTML = statusDesc[status];

    if (status == 3 || status == 4 || status == 7)
    {
        if (status == 7)
            document.querySelector("#nextCalibrate").querySelector(".innerTopButton").innerText = "Start Calibration";
        else if (status == 3)
            document.querySelector("#nextCalibrate").querySelector(".innerTopButton").innerText = "Continue Calibration";
        else if (status == 4)
            document.querySelector("#nextCalibrate").querySelector(".innerTopButton").innerText = "Confirm Calibration";
        document.querySelector("#calibrateButtons").classList.remove("hidden");
    }
    else
        document.querySelector("#calibrateButtons").classList.add("hidden");
}

/**
 * @description Gets the current application status code
 * @returns {number} The current status code
 */
function getStatus()
{
    return status;
}

module.exports = {
    initialize,
    setStatus,
    getStatus,
    /**
     * @description Array of status title strings for different application states
     */
    statusTitle,
    /**
     * @description Array of status description strings for different application states
     */
    statusDesc
};

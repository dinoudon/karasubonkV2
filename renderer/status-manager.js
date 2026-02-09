const { ipcRenderer } = require("electron");

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

function initialize()
{
    ipcRenderer.on("status", (event, message) => { setStatus(event, message); });
}

async function setStatus(_, message)
{
    if (status == message) return;

    status = message;
    // Status update logic will be implemented here
}

function getStatus()
{
    return status;
}

module.exports = {
    initialize,
    setStatus,
    getStatus,
    statusTitle,
    statusDesc
};

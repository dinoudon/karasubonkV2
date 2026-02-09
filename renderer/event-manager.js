const { ipcRenderer } = require("electron");

// =============
// Event Manager
// =============
// Manages IPC event listeners and communication with main process

function initialize()
{
    setupAuthenticationEvents();
    setupLinkEvents();
}

function setupAuthenticationEvents()
{
    ipcRenderer.on("username", (event, message) => {
        // Username event handling will be implemented here
    });
}

function setupLinkEvents()
{
    // Link event handling will be implemented here
}

module.exports = {
    initialize,
    setupAuthenticationEvents,
    setupLinkEvents
};

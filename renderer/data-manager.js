const { ipcRenderer } = require("electron");
const fs = require("fs");

// ============
// Data Manager
// ============
// Handles data persistence and retrieval operations

var userDataPath = null;

function initialize()
{
    ipcRenderer.on("userDataPath", (event, message) => {
        userDataPath = message;
    });
    ipcRenderer.send("getUserDataPath");
}

async function getData(key)
{
    return await ipcRenderer.invoke("getData", key);
}

function setData(key, value)
{
    ipcRenderer.send("setData", key, value);
}

module.exports = {
    initialize,
    getData,
    setData,
    getUserDataPath: () => userDataPath
};

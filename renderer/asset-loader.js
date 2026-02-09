const { ipcRenderer } = require("electron");
const fs = require("fs");

// ============
// Asset Loader
// ============
// Handles loading and management of image and sound assets

function initialize()
{
    // Asset loading event listeners will be set up here
}

async function loadImage()
{
    // Image loading logic will be implemented here
}

async function loadSound()
{
    // Sound loading logic will be implemented here
}

function copyFilesToDirectory()
{
    ipcRenderer.send("copyFilesToDirectory");
}

module.exports = {
    initialize,
    loadImage,
    loadSound,
    copyFilesToDirectory
};

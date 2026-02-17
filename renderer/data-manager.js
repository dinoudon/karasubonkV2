const { ipcRenderer } = require("electron");
const fs = require("fs");

// ============
// Data Manager
// ============
// Handles data persistence and retrieval operations

const defaultData = JSON.parse(fs.readFileSync(__dirname + "/../defaultData.json", "utf8"));

// Counter for number of writes that are being attempted
// Will only attempt to load data if not currently writing
// Inter-process communication means this is necessary
var isWriting = 0;
var userDataPath = null;

/**
 * @description Initializes the data manager and sets up IPC listeners for user data path
 */
function initialize()
{
    ipcRenderer.on("userDataPath", (event, message) => {
        userDataPath = message;
    });
    ipcRenderer.send("getUserDataPath");

    ipcRenderer.on("doneWriting", () => {
        if (--isWriting < 0)
            isWriting = 0;
    });
}

/**
 * @description Retrieves requested data field from persistent storage, waiting for any current writes to finish first
 * @param {string} field - The data field to retrieve
 * @returns {Promise<any>} The value of the requested field
 */
async function getData(field)
{
    while (isWriting > 0)
        await new Promise(resolve => setTimeout(resolve, 10));

    if (!fs.existsSync(userDataPath + "/data.json"))
        fs.writeFileSync(userDataPath + "/data.json", JSON.stringify(defaultData));

    var data;
    // An error should only be thrown if the other process is in the middle of writing to the file.
    // If so, it should finish shortly and this loop will exit.
    while (data == null)
    {
        try {
            data = JSON.parse(fs.readFileSync(userDataPath + "/data.json", "utf8"));
        } catch {}
    }
    data = JSON.parse(fs.readFileSync(userDataPath + "/data.json", "utf8"));
    var field = data[field];
    if (typeof field === "string" || field instanceof String)
        return field.trim();
    return field;
}

/**
 * @description Sends new data to the main process to write to persistent storage
 * @param {string} field - The data field to update
 * @param {any} value - The new value to set
 */
function setData(field, value)
{
    isWriting++;
    ipcRenderer.send("setData", [ field, value ]);

    if (field == "portThrower" || field == "portVTubeStudio" || field == "ipThrower" || field == "ipVTubeStudio")
        setPorts();
}

// If ports change, write them to the file read by the Browser Source file
async function setPorts()
{
    fs.writeFileSync(__dirname + "/../ports.js", "const ports = [ " + await getData("portThrower") + ", " + await getData("portVTubeStudio") + " ]; const ips = [ \"" + await getData("ipThrower") + "\", \"" + await getData("ipVTubeStudio") + "\" ];");
}

/**
 * @description Gets the user data path
 * @returns {string|null} The user data path or null if not initialized
 */
const getUserDataPath = () => userDataPath;

module.exports = { initialize, getData, setData, getUserDataPath };

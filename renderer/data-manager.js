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

// Get requested data, waiting for any current writes to finish first
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

// Send new data to the main process to write to file
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

module.exports = { initialize, getData, setData, getUserDataPath: () => userDataPath };

const { ipcRenderer } = require("electron");
const fs = require("fs");

// ===============
// Startup Handler
// ===============
// Handles application startup, data migration, and version checking

let dataManager = null;
let uiController = null;
let assetLoader = null;
let animationController = null;

const version = 1.26;
const folders = ["throws", "impacts", "decals", "windups"];

function initialize(dependencies) {
    dataManager = dependencies.dataManager;
    uiController = dependencies.uiController;
    assetLoader = dependencies.assetLoader;
    animationController = dependencies.animationController;

    // Set up IPC listeners
    setupIPCListeners();
}

function setupIPCListeners() {
    // Handle username updates
    ipcRenderer.on("username", (event, message) => {
        document.querySelector("#username").classList.add("readyText");
        document.querySelector("#username").classList.remove("errorText");
        document.querySelector("#username").innerText = message;
        document.querySelector("#logout").innerText = "Log out";
    });

    // Handle raid event - fetch emotes
    ipcRenderer.on("raid", (event, message) => {
        getRaidEmotes(event, message);
    });
}

async function runStartup() {
    const { getData, setData, getUserDataPath } = dataManager;

    // Create user data directory if needed
    if (!fs.existsSync(getUserDataPath()))
        fs.mkdirSync(getUserDataPath());

    if (!fs.existsSync(getUserDataPath() + "/data.json") && fs.existsSync(__dirname + "/../data.json"))
        fs.copyFileSync(__dirname + "/../data.json", getUserDataPath() + "/data.json");

    // Set up asset folders
    folders.forEach((folder) => {
        if (!fs.existsSync(getUserDataPath() + "/" + folder))
            fs.mkdirSync(getUserDataPath() + "/" + folder);

        // Fix: fixed a dictionary not found crash.
        if (!fs.existsSync(__dirname + "/../" + folder))
            fs.mkdirSync(__dirname + "/../" + folder);

        fs.readdirSync(__dirname + "/../" + folder).forEach(file => {
            if (!fs.existsSync(getUserDataPath() + "/" + folder + "/" + file))
                fs.copyFileSync(__dirname + "/../" + folder + "/" + file, getUserDataPath() + "/" + folder + "/" + file);
        });
    });

    // Run data migrations
    await migrateData(getData, setData);

    // Load all settings via ui-controller
    await uiController.loadAllSettings();

    assetLoader.openImages();
    uiController.openBitImages();
    assetLoader.copyFilesToDirectory();

    // Pass openBitSounds function to animation controller
    animationController.setOpenBitSounds(uiController.openBitSounds);

    checkVersion();
    document.title += " " + version;
    setData("version", version);
}

async function migrateData(getData, setData) {
    // UPDATING FROM 1.0.1 OR EARLIER
    var throws = await getData("throws");
    for (var i = 0; i < throws.length; i++) {
        if (Array.isArray(throws[i])) {
            throws[i] = {
                "location": throws[i][0],
                "weight": throws[i][1],
                "scale": throws[i][2],
                "sound": throws[i][3],
                "volume": throws[i][4] == null ? 1 : throws[i][4],
                "enabled": true,
                "customs": []
            };
        }
    }
    setData("throws", throws);

    var impacts = await getData("impacts");
    var bitImpacts = await getData("bitImpacts");
    var hasBitImpacts = bitImpacts != null && bitImpacts.length > 0;
    for (var i = 0; i < impacts.length; i++) {
        if (Array.isArray(impacts[i])) {
            impacts[i] = {
                "location": impacts[i][0],
                "volume": impacts[i][1],
                "enabled": true,
                "bits": !hasBitImpacts,
                "customs": []
            };
        }
    }
    setData("impacts", impacts);

    if (bitImpacts != null) {
        var impacts = await getData("impacts");
        for (var i = 0; i < bitImpacts.length; i++) {
            impacts.push({
                "location": bitImpacts[i][0],
                "volume": bitImpacts[i][1],
                "enabled": false,
                "bits": true,
                "customs": []
            });
        }

        setData("bitImpacts", null);
        setData("impacts", impacts);
    }

    var redeems = await getData("redeems");
    if (redeems == null) {
        redeems = [];

        var oldId = await getData("singleRedeemID");
        var oldEnabled = await getData("singleRedeemEnabled");
        if (oldId != null && oldId != "") {
            redeems.push({
                "enabled": oldEnabled == null || !oldEnabled ? false : true,
                "id": oldId,
                "name": "Single",
                "bonkType": "single"
            });
        }

        oldId = await getData("barrageRedeemID");
        oldEnabled = await getData("barrageRedeemEnabled");
        if (oldId != null && oldId != "") {
            redeems.push({
                "enabled": oldEnabled == null || !oldEnabled ? false : true,
                "id": oldId,
                "name": "Barrage",
                "bonkType": "barrage"
            });
        }

        setData("redeems", redeems);
    }

    var commands = await getData("commands");
    if (commands == null) {
        commands = [];

        var oldCommand = await getData("singleCommandTitle");
        var oldEnabled = await getData("singleCommandEnabled");
        if (oldCommand != null && oldCommand != "") {
            commands.push({
                "enabled": oldEnabled == null || !oldEnabled ? false : true,
                "name": oldCommand,
                "cooldown": await getData("singleCommandCooldown"),
                "bonkType": "single"
            });
        }

        oldCommand = await getData("barrageCommandTitle");
        oldEnabled = await getData("barrageCommandEnabled");
        if (oldCommand != null && oldCommand != "") {
            commands.push({
                "enabled": oldEnabled == null || !oldEnabled ? false : true,
                "name": oldCommand,
                "cooldown": await getData("singleCommandCooldown"),
                "bonkType": "barrage"
            });
        }

        setData("commands", commands);
    }

    // UPDATE 1.12 - Added Spin Speed settings
    var customBonks = await getData("customBonks");
    if (customBonks != null) {
        for (const key in customBonks) {
            if (customBonks[key].spinSpeedOverride == null)
                customBonks[key].spinSpeedOverride = false;
            if (customBonks[key].spinSpeedMin == null)
                customBonks[key].spinSpeedMin = 5;
            if (customBonks[key].spinSpeedMax == null)
                customBonks[key].spinSpeedMax = 10;
        }

        setData("customBonks", customBonks);
    }

    // UPDATE 1.13 - Added "Minimize to Tray" option
    var tray = await getData("minimizeToTray");
    if (tray == null)
        setData("minimizeToTray", false);

    // UPDATE 1.22 - Changed "Return Speed" to "Return Time"
    var prevVer = await getData("version");
    if (prevVer != null && prevVer < 1.22)
        setData("returnSpeed", 0.3);

    var commands = await getData("commands");
    if (commands != null) {
        for (const key in commands) {
            if (commands[key].modOnly == null)
                commands[key].modOnly = false;
        }

        setData("commands", commands);
    }

    // UPDATE 1.23 - Added "Throw Direction" setting
    var prevVer = await getData("version");
    if (prevVer == null || prevVer < 1.22)
        setData("throwDirection", "weighted");

    if (customBonks != null) {
        for (const key in customBonks) {
            if (customBonks[key].throwDirectionOverride == null)
                customBonks[key].throwDirectionOverride = false;
            if (customBonks[key].throwDirection == null)
                customBonks[key].throwDirection = "weighted";
        }

        setData("customBonks", customBonks);
    }

    var ipThrower = await getData("ipThrower");
    if (ipThrower == null)
        setData("ipThrower", "");

    var ipVTubeStudio = await getData("ipVTubeStudio");
    if (ipVTubeStudio == null)
        setData("ipVTubeStudio", "");
}

function getRaidEmotes(_, data) {
    var channelEmotes = new XMLHttpRequest();
    channelEmotes.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
            const emotes = JSON.parse(this.responseText);
            ipcRenderer.send("emotes", emotes);
        }
    };
    channelEmotes.open("GET", "https://api.twitch.tv/helix/chat/emotes?broadcaster_id=" + data[0], true);
    channelEmotes.setRequestHeader("Authorization", "Bearer " + data[1]);
    channelEmotes.setRequestHeader("Client-Id", "u4rwa52hwkkgyoyow0t3gywxyv54pg");
    channelEmotes.send();
}

function checkVersion() {
    var versionRequest = new XMLHttpRequest();
    versionRequest.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
            const latestVersion = JSON.parse(this.responseText);
            if (latestVersion.latest > version)
                document.querySelector("#newVersion").classList.remove("hidden");
        }
    };
    versionRequest.open("GET", "https://itch.io/api/1/x/wharf/latest?game_id=1387406&channel_name=win32", true);
    versionRequest.send();
}

module.exports = {
    initialize,
    runStartup
};

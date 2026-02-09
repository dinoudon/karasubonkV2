const { ipcRenderer } = require("electron");

// ==============
// UI Controller
// ==============
// Handles UI updates and DOM manipulation

let dataManager, assetLoader, eventManager, animationController;
let clampValue, loadImageCustom, loadSoundCustom, loadBitImage, loadImageSound, openImageDetails, currentImageIndex;
let openBitImages, openBitSounds, testItem, differentValue;

function initialize(dependencies = {})
{
    if (dependencies.dataManager) dataManager = dependencies.dataManager;
    if (dependencies.assetLoader) assetLoader = dependencies.assetLoader;
    if (dependencies.eventManager) eventManager = dependencies.eventManager;
    if (dependencies.animationController) animationController = dependencies.animationController;
    if (dependencies.clampValue) clampValue = dependencies.clampValue;
    if (dependencies.loadImageCustom) loadImageCustom = dependencies.loadImageCustom;
    if (dependencies.loadSoundCustom) loadSoundCustom = dependencies.loadSoundCustom;
    if (dependencies.loadBitImage) loadBitImage = dependencies.loadBitImage;
    if (dependencies.loadImageSound) loadImageSound = dependencies.loadImageSound;
    if (dependencies.openImageDetails) openImageDetails = dependencies.openImageDetails;
    if (dependencies.currentImageIndex !== undefined) currentImageIndex = dependencies.currentImageIndex;
    if (dependencies.openBitImages) openBitImages = dependencies.openBitImages;
    if (dependencies.openBitSounds) openBitSounds = dependencies.openBitSounds;
    if (dependencies.testItem) testItem = dependencies.testItem;
    if (dependencies.differentValue) differentValue = dependencies.differentValue;

    setupUIEventListeners();
}

function setupUIEventListeners()
{
    const { getData, setData } = dataManager;

    // Logout button
    document.querySelector("#logout").addEventListener("click", () => {
        ipcRenderer.send("reauthenticate");
        document.querySelector("#username").classList.remove("readyText");
        document.querySelector("#username").classList.add("errorText");
        document.querySelector("#username").innerText = "None";
        document.querySelector("#logout").innerText = "Log in";
    });

    // Itch.io link
    document.querySelector("#itchLink a").addEventListener("click", () => { ipcRenderer.send("link"); });

    // Image library event listeners
    document.querySelector("#newImage").addEventListener("click", () => { document.querySelector("#loadImage").click(); });
    document.querySelector("#loadImage").addEventListener("change", assetLoader.loadImage);

    document.querySelector("#imageTable").querySelector(".selectAll input").addEventListener("change", async () => {
        document.querySelector("#imageTable").querySelectorAll(".imageEnabled").forEach((element) => {
            element.checked = document.querySelector("#imageTable").querySelector(".selectAll input").checked;
        });
        var throws = await getData("throws");
        for (var i = 0; i < throws.length; i++)
            throws[i].enabled = document.querySelector("#imageTable").querySelector(".selectAll input").checked;
        setData("throws", throws);
    });

    // Bit image scale event listeners
    document.querySelector("#bit1").querySelector(".bitImageScale").addEventListener("change", async () => {
        var bitThrows = await getData("bitThrows");
        bitThrows.one.scale = parseFloat(document.querySelector("#bit1").querySelector(".bitImageScale").value);
        setData("bitThrows", bitThrows);
    });
    document.querySelector("#bitImageAdd1").addEventListener("click", () => { document.querySelector("#loadBitImageone").click(); });
    document.querySelector("#loadBitImageone").addEventListener("change", () => { loadBitImage("one") });

    document.querySelector("#bit100").querySelector(".bitImageScale").addEventListener("change", async () => {
        var bitThrows = await getData("bitThrows");
        bitThrows.oneHundred.scale = parseFloat(document.querySelector("#bit100").querySelector(".bitImageScale").value);
        setData("bitThrows", bitThrows);
    });
    document.querySelector("#bitImageAdd100").addEventListener("click", () => { document.querySelector("#loadBitImageoneHundred").click(); });
    document.querySelector("#loadBitImageoneHundred").addEventListener("change", () => { loadBitImage("oneHundred") });

    document.querySelector("#bit1000").querySelector(".bitImageScale").addEventListener("change", async () => {
        var bitThrows = await getData("bitThrows");
        bitThrows.oneThousand.scale = parseFloat(document.querySelector("#bit1000").querySelector(".bitImageScale").value);
        setData("bitThrows", bitThrows);
    });
    document.querySelector("#bitImageAdd1000").addEventListener("click", () => { document.querySelector("#loadBitImageoneThousand").click(); });
    document.querySelector("#loadBitImageoneThousand").addEventListener("change", () => { loadBitImage("oneThousand") });

    document.querySelector("#bit5000").querySelector(".bitImageScale").addEventListener("change", async () => {
        var bitThrows = await getData("bitThrows");
        bitThrows.fiveThousand.scale = parseFloat(document.querySelector("#bit5000").querySelector(".bitImageScale").value);
        setData("bitThrows", bitThrows);
    });
    document.querySelector("#bitImageAdd5000").addEventListener("click", () => { document.querySelector("#loadBitImagefiveThousand").click(); });
    document.querySelector("#loadBitImagefiveThousand").addEventListener("change", () => { loadBitImage("fiveThousand") });

    document.querySelector("#bit10000").querySelector(".bitImageScale").addEventListener("change", async () => {
        var bitThrows = await getData("bitThrows");
        bitThrows.tenThousand.scale = parseFloat(document.querySelector("#bit10000").querySelector(".bitImageScale").value);
        setData("bitThrows", bitThrows);
    });
    document.querySelector("#bitImageAdd10000").addEventListener("click", () => { document.querySelector("#loadBitImagetenThousand").click(); });
    document.querySelector("#loadBitImagetenThousand").addEventListener("change", () => { loadBitImage("tenThousand") });

    // Image sound loader
    document.querySelector("#loadImageSound").addEventListener("change", loadImageSound);

    // Sound library event listeners
    document.querySelector("#newSound").addEventListener("click", () => { document.querySelector("#loadSound").click(); });
    document.querySelector("#loadSound").addEventListener("change", assetLoader.loadSound);

    document.querySelector("#soundTable").querySelector(".selectAll input").addEventListener("change", async () => {
        document.querySelector("#soundTable").querySelectorAll(".imageEnabled").forEach((element) => {
            element.checked = document.querySelector("#soundTable").querySelector(".selectAll input").checked;
        });
        var impacts = await getData("impacts");
        for (var i = 0; i < impacts.length; i++)
            impacts[i].enabled = document.querySelector("#soundTable").querySelector(".selectAll input").checked;
        setData("impacts", impacts);
    });

    // Bit sounds
    document.querySelector("#newBitSound").addEventListener("click", () => { document.querySelector("#loadBitSound").click(); });
    document.querySelector("#loadBitSound").addEventListener("change", loadBitSound);

    document.querySelector("#bitSoundTable").querySelector(".selectAll input").addEventListener("change", async () => {
        document.querySelector("#bitSoundTable").querySelectorAll(".imageEnabled").forEach((element) => {
            element.checked = document.querySelector("#bitSoundTable").querySelector(".selectAll input").checked;
        });
        var impacts = await getData("impacts");
        for (var i = 0; i < impacts.length; i++)
            impacts[i].bits = document.querySelector("#bitSoundTable").querySelector(".selectAll input").checked;
        setData("impacts", impacts);
    });

    // Custom bonks and events
    document.querySelector("#bonksAdd").addEventListener("click", eventManager.addBonk);
    document.querySelector("#redeemAdd").addEventListener("click", eventManager.newRedeem);
    document.querySelector("#commandAdd").addEventListener("click", eventManager.newCommand);

    // Settings event listeners
    document.querySelector("#followEnabled").addEventListener("change", () => setData("followEnabled", document.querySelector("#followEnabled").checked));
    document.querySelector("#subEnabled").addEventListener("change", () => setData("subEnabled", document.querySelector("#subEnabled").checked));
    document.querySelector("#subGiftEnabled").addEventListener("change", () => setData("subGiftEnabled", document.querySelector("#subGiftEnabled").checked));
    document.querySelector("#charityEnabled").addEventListener("change", () => setData("charityEnabled", document.querySelector("#charityEnabled").checked));
    document.querySelector("#bitsEnabled").addEventListener("change", () => setData("bitsEnabled", document.querySelector("#bitsEnabled").checked));
    document.querySelector("#raidEnabled").addEventListener("change", () => setData("raidEnabled", document.querySelector("#raidEnabled").checked));

    document.querySelector("#followType").addEventListener("change", () => setData("followType", document.querySelector("#followType").value));
    document.querySelector("#subType").addEventListener("change", () => setData("subType", document.querySelector("#subType").value));
    document.querySelector("#subGiftType").addEventListener("change", () => setData("subGiftType", document.querySelector("#subGiftType").value));
    document.querySelector("#charityType").addEventListener("change", () => setData("charityType", document.querySelector("#charityType").value));
    document.querySelector("#bitsMinDonation").addEventListener("change", () => { clampValue(document.querySelector("#bitsMinDonation"), 0, null); setData("bitsMinDonation", parseInt(document.querySelector("#bitsMinDonation").value)) });
    document.querySelector("#bitsMaxBarrageCount").addEventListener("change", () => { clampValue(document.querySelector("#bitsMaxBarrageCount"), 0, null); setData("bitsMaxBarrageCount", parseInt(document.querySelector("#bitsMaxBarrageCount").value)) });

    document.querySelector("#raidMinRaiders").addEventListener("change", () => { setData("raidMinRaiders", parseInt(document.querySelector("#raidMinRaiders").value)) });
    document.querySelector("#raidMinBarrageCount").addEventListener("change", () => { clampValue(document.querySelector("#raidMinBarrageCount"), 0, parseFloat(document.querySelector("#raidMaxBarrageCount").value)); setData("raidMinBarrageCount", parseInt(document.querySelector("#raidMinBarrageCount").value)) });
    document.querySelector("#raidMaxBarrageCount").addEventListener("change", () => { clampValue(document.querySelector("#raidMaxBarrageCount"), parseFloat(document.querySelector("#raidMinBarrageCount").value), null); setData("raidMaxBarrageCount", parseInt(document.querySelector("#raidMaxBarrageCount").value)) });

    document.querySelector("#followCooldown").addEventListener("change", () => { clampValue(document.querySelector("#followCooldown"), 0, null); setData("followCooldown", parseFloat(document.querySelector("#followCooldown").value)) });
    document.querySelector("#subCooldown").addEventListener("change", () => { clampValue(document.querySelector("#subCooldown"), 0, null); setData("subCooldown", parseFloat(document.querySelector("#subCooldown").value)) });
    document.querySelector("#subGiftCooldown").addEventListener("change", () => { clampValue(document.querySelector("#subGiftCooldown"), 0, null); setData("subGiftCooldown", parseFloat(document.querySelector("#subGiftCooldown").value)) });
    document.querySelector("#charityCooldown").addEventListener("change", () => { clampValue(document.querySelector("#charityCooldown"), 0, null); setData("charityCooldown", parseFloat(document.querySelector("#charityCooldown").value)) });
    document.querySelector("#bitsCooldown").addEventListener("change", () => { clampValue(document.querySelector("#bitsCooldown"), 0, null); setData("bitsCooldown", parseFloat(document.querySelector("#bitsCooldown").value)) });
    document.querySelector("#raidCooldown").addEventListener("change", () => { clampValue(document.querySelector("#raidCooldown"), 0, null); setData("raidCooldown", parseFloat(document.querySelector("#raidCooldown").value)) });
    document.querySelector("#raidEnabled").addEventListener("change", () => setData("raidEnabled", document.querySelector("#raidEnabled").checked));

    document.querySelector("#bitsOnlySingle").addEventListener("change", () => setData("bitsOnlySingle", document.querySelector("#bitsOnlySingle").checked));
    document.querySelector("#raidEmotes").addEventListener("change", () => setData("raidEmotes", document.querySelector("#raidEmotes").checked));

    document.querySelector("#barrageCount").addEventListener("change", () => { clampValue(document.querySelector("#barrageCount"), 0, null); setData("barrageCount", parseInt(document.querySelector("#barrageCount").value)) });
    document.querySelector("#barrageFrequency").addEventListener("change", () => { clampValue(document.querySelector("#barrageFrequency"), 0, null); setData("barrageFrequency", parseFloat(document.querySelector("#barrageFrequency").value)) });
    document.querySelector("#throwDuration").addEventListener("change", () => { clampValue(document.querySelector("#throwDuration"), 0.1, null); setData("throwDuration", parseFloat(document.querySelector("#throwDuration").value)) });
    document.querySelector("#returnSpeed").addEventListener("change", () => { clampValue(document.querySelector("#returnSpeed"), 0, null); setData("returnSpeed", parseFloat(document.querySelector("#returnSpeed").value)) });
    document.querySelector("#throwAngleMin").addEventListener("change", () => { clampValue(document.querySelector("#throwAngleMin"), -90, parseFloat(document.querySelector("#throwAngleMax").value)); setData("throwAngleMin", parseFloat(document.querySelector("#throwAngleMin").value)) });
    document.querySelector("#throwAngleMax").addEventListener("change", () => { clampValue(document.querySelector("#throwAngleMax"), parseFloat(document.querySelector("#throwAngleMin").value), null); setData("throwAngleMax", parseFloat(document.querySelector("#throwAngleMax").value)) });
    document.querySelector("#throwDirection").addEventListener("change", () => { setData("throwDirection", document.querySelector("#throwDirection").value) });
    document.querySelector("#spinSpeedMin").addEventListener("change", () => { clampValue(document.querySelector("#spinSpeedMin"), 0, parseFloat(document.querySelector("#spinSpeedMax").value)); setData("spinSpeedMin", parseFloat(document.querySelector("#spinSpeedMin").value)) });
    document.querySelector("#spinSpeedMax").addEventListener("change", () => { clampValue(document.querySelector("#spinSpeedMax"), parseFloat(document.querySelector("#spinSpeedMin").value), null); setData("spinSpeedMax", parseFloat(document.querySelector("#spinSpeedMax").value)) });
    document.querySelector("#physicsSim").addEventListener("change", () => setData("physicsSim", document.querySelector("#physicsSim").checked));
    document.querySelector("#physicsFPS").addEventListener("change", () => { clampValue(document.querySelector("#physicsFPS"), 1, 60); setData("physicsFPS", parseFloat(document.querySelector("#physicsFPS").value)) });
    document.querySelector("#physicsGravity").addEventListener("change", () => { clampValue(document.querySelector("#physicsGravity"), 0.01, null); setData("physicsGravity", parseFloat(document.querySelector("#physicsGravity").value)) });
    document.querySelector("#physicsReverse").addEventListener("change", () => setData("physicsReverse", document.querySelector("#physicsReverse").checked));
    document.querySelector("#physicsRotate").addEventListener("change", () => setData("physicsRotate", document.querySelector("#physicsRotate").checked));
    document.querySelector("#physicsHorizontal").addEventListener("change", () => { setData("physicsHorizontal", parseFloat(document.querySelector("#physicsHorizontal").value)) });
    document.querySelector("#physicsVertical").addEventListener("change", () => { setData("physicsVertical", parseFloat(document.querySelector("#physicsVertical").value)) });

    document.querySelector("#closeEyes").addEventListener("change", () => {
        const val = document.querySelector("#closeEyes").checked;
        setData("closeEyes", val);
        if (val)
        {
            document.querySelector("#openEyes").checked = false;
            setData("openEyes", false);
        }
    });

    document.querySelector("#openEyes").addEventListener("change", () => {
        const val = document.querySelector("#openEyes").checked;
        setData("openEyes", val);
        if (val)
        {
            document.querySelector("#closeEyes").checked = false;
            setData("closeEyes", false);
        }
    });

    document.querySelector("#itemScaleMin").addEventListener("change", () => { clampValue(document.querySelector("#itemScaleMin"), 0, parseFloat(document.querySelector("#itemScaleMax").value)); setData("itemScaleMin", parseFloat(document.querySelector("#itemScaleMin").value)) });
    document.querySelector("#itemScaleMax").addEventListener("change", () => { clampValue(document.querySelector("#itemScaleMax"), parseFloat(document.querySelector("#itemScaleMin").value), null); setData("itemScaleMax", parseFloat(document.querySelector("#itemScaleMax").value)) });
    document.querySelector("#delay").addEventListener("change", () => { clampValue(document.querySelector("#delay"), 0, null); setData("delay", parseInt(document.querySelector("#delay").value)) } );
    document.querySelector("#volume").addEventListener("change", () => { clampValue(document.querySelector("#volume"), 0, 1); setData("volume", parseFloat(document.querySelector("#volume").value)) });
    document.querySelector("#portThrower").addEventListener("change", () => { differentValue(document.querySelector("#portThrower"), document.querySelector("#portVTubeStudio")); clampValue(document.querySelector("#portThrower"), 1024, 65535); setData("portThrower", parseInt(document.querySelector("#portThrower").value)) });
    document.querySelector("#portVTubeStudio").addEventListener("change", () => { differentValue(document.querySelector("#portVTubeStudio"), document.querySelector("#portThrower")); clampValue(document.querySelector("#portVTubeStudio"), 1024, 65535); setData("portVTubeStudio", parseInt(document.querySelector("#portVTubeStudio").value)) });
    document.querySelector("#ipThrower").addEventListener("change", () => setData("ipThrower", document.querySelector("#ipThrower").value));
    document.querySelector("#ipVTubeStudio").addEventListener("change", () => setData("ipVTubeStudio", document.querySelector("#ipVTubeStudio").value));
    document.querySelector("#minimizeToTray").addEventListener("change", () => setData("minimizeToTray", document.querySelector("#minimizeToTray").checked));

    // Window navigation event listeners
    document.querySelector("#header").addEventListener("click", () => { animationController.showPanelLarge("statusWindow"); });

    document.querySelector("#helpButton").addEventListener("click", () => { ipcRenderer.send("help"); });
    document.querySelector("#calibrateButton").addEventListener("click", () => { animationController.showPanelLarge("statusWindow", true); });
    document.querySelector("#settingsButton").addEventListener("click", () => { animationController.showPanelLarge("settings"); });
    document.querySelector("#testBonksButton").addEventListener("click", () => { animationController.showPanelLarge("testBonks"); });

    document.querySelector("#imagesButton").addEventListener("click", () => { animationController.showPanel("bonkImages"); });
    document.querySelector("#soundsButton").addEventListener("click", () => { animationController.showPanel("bonkSounds"); });
    document.querySelector("#customButton").addEventListener("click", () => { animationController.showPanel("customBonks"); });
    document.querySelector("#eventsButton").addEventListener("click", () => { animationController.showPanel("events"); });

    document.querySelector("#imagesDefaultTab").addEventListener("click", () => { animationController.showTab("imageTable", [ "bitImageTable" ], "imagesDefaultTab", [ "imagesBitsTab" ]); });
    document.querySelector("#imagesBitsTab").addEventListener("click", () => { animationController.showTab("bitImageTable", [ "imageTable" ], "imagesBitsTab", [ "imagesDefaultTab" ]); });

    document.querySelector("#soundsDefaultTab").addEventListener("click", () => { animationController.showTab("soundTable", [ "bitSoundTable" ], "soundsDefaultTab", [ "soundsBitsTab" ]); });
    document.querySelector("#soundsBitsTab").addEventListener("click", () => { animationController.showTab("bitSoundTable", [ "soundTable" ], "soundsBitsTab", [ "soundsDefaultTab" ]); });

    document.querySelectorAll(".windowBack").forEach((element) => { element.addEventListener("click", () => { animationController.back(); }) });

    // Testing and calibration event listeners
    document.querySelector("#testSingle").addEventListener("click", () => { ipcRenderer.send("single"); });
    document.querySelector("#testBarrage").addEventListener("click", () => { ipcRenderer.send("barrage"); });
    document.querySelector("#testSub").addEventListener("click", () => { ipcRenderer.send("sub"); });
    document.querySelector("#testSubGift").addEventListener("click", () => { ipcRenderer.send("subGift"); });
    document.querySelector("#testCharity").addEventListener("click", () => { ipcRenderer.send("charity"); });
    document.querySelector("#testBits").addEventListener("click", () => { ipcRenderer.send("bits"); });
    document.querySelector("#testFollow").addEventListener("click", () => { ipcRenderer.send("follow"); });
    document.querySelector("#testEmote").addEventListener("click", () => { ipcRenderer.send("emote"); });
    document.querySelector("#testRaid").addEventListener("click", () => { ipcRenderer.send("raid"); });

    document.querySelector("#calibrateButton").addEventListener("click", () => { if (!animationController.getCancelCalibrate()) ipcRenderer.send("startCalibrate"); });
    document.querySelector("#nextCalibrate").addEventListener("click", () => { ipcRenderer.send("nextCalibrate"); });
    document.querySelector("#cancelCalibrate").addEventListener("click", () => { ipcRenderer.send("cancelCalibrate"); animationController.back(); });
}

async function loadBitSound()
{
    const { getData, setData, getUserDataPath } = dataManager;
    const fs = require("fs");

    var impacts = await getData("impacts");
    var files = document.querySelector("#loadBitSound").files;
    for (var i = 0; i < files.length; i++)
    {
        var soundFile = files[i];
        if (!fs.existsSync(getUserDataPath() + "/impacts/"))
            fs.mkdirSync(getUserDataPath() + "/impacts/");

        var append = "";
        while (fs.existsSync(getUserDataPath() + "/impacts/" + soundFile.name.substr(0, soundFile.name.lastIndexOf(".")) + append + soundFile.name.substr(soundFile.name.lastIndexOf("."))))
            append = append == "" ? 2 : (append + 1);
        var filename = soundFile.name.substr(0, soundFile.name.lastIndexOf(".")) + append + soundFile.name.substr(soundFile.name.lastIndexOf("."));

        fs.copyFileSync(soundFile.path, getUserDataPath() + "/impacts/" + filename);

        impacts.unshift({
            "location": "impacts/" + filename,
            "volume": 1.0,
            "enabled": false,
            "bits": true,
            "customs": []
        });
    }
    setData("impacts", impacts);
    openBitSounds();
    assetLoader.copyFilesToDirectory();

    document.querySelector("#loadBitSound").value = null;
}

function updateStatusDisplay(status, title, description)
{
    // Status display update logic will be implemented here
}

function updateUsernameDisplay(username)
{
    // Username display update logic will be implemented here
}

function showCalibrationButtons(status)
{
    // Calibration button visibility logic will be implemented here
}

function hideCalibrationButtons()
{
    // Calibration button hiding logic will be implemented here
}

module.exports = {
    initialize,
    setupUIEventListeners,
    updateStatusDisplay,
    updateUsernameDisplay,
    showCalibrationButtons,
    hideCalibrationButtons
};

const { ipcRenderer } = require("electron");

// =============
// Event Manager
// =============
// Manages IPC event listeners and communication with main process
// Also handles custom bonk management

let getData, setData, animationController, uiController, assetLoader;

// Variables for redeem data management
let gettingRedeemData = false, redeemData, cancelledGetRedeemData = false;

/**
 * @description Initializes the event manager with dependencies and sets up IPC listeners
 * @param {Object} dependencies - Dependencies object containing getData, setData, and controller references
 */
function initialize(dependencies = {})
{
    setupAuthenticationEvents();
    setupLinkEvents();
    setupRedeemDataListener();

    // Store dependencies for bonk management functions
    if (dependencies.getData) getData = dependencies.getData;
    if (dependencies.setData) setData = dependencies.setData;
    if (dependencies.animationController) animationController = dependencies.animationController;
    if (dependencies.uiController) uiController = dependencies.uiController;
    if (dependencies.assetLoader) assetLoader = dependencies.assetLoader;
}

/**
 * @description Sets up IPC listeners for authentication events
 */
function setupAuthenticationEvents()
{
    ipcRenderer.on("username", (event, message) => {
        // Username event handling will be implemented here
    });
}

/**
 * @description Sets up IPC listeners for link events
 */
function setupLinkEvents()
{
    // Link event handling will be implemented here
}

/**
 * @description Sets up IPC listener for redeem data responses
 */
function setupRedeemDataListener()
{
    ipcRenderer.on("redeemData", (event, message) => {
        redeemData = message;
        gettingRedeemData = false;
    });
}

/**
 * @description Creates a new redeem event and adds it to the redeems collection
 * @returns {Promise<void>}
 */
async function newRedeem()
{
    var redeems = await getData("redeems");

    redeems.push({
        "enabled": true,
        "id": null,
        "name": null,
        "bonkType": "single"
    });

    setData("redeems", redeems);

    openEvents();
}

/**
 * @description Creates a new command event and adds it to the commands collection
 * @returns {Promise<void>}
 */
async function newCommand()
{
    var commands = await getData("commands");

    commands.push({
        "enabled": true,
        "modOnly": false,
        "name": "",
        "cooldown": 0,
        "bonkType": "single"
    });

    setData("commands", commands);

    openEvents();
}

/**
 * @description Initiates listening for a channel point redeem and waits for the data
 * @returns {Promise<Array>} The redeem data [id, name]
 */
async function getRedeemData()
{
    gettingRedeemData = true;
    cancelledGetRedeemData = false;
    ipcRenderer.send("listenRedeemStart");

    while (gettingRedeemData)
        await new Promise(resolve => setTimeout(resolve, 10));

    return redeemData;
}

/**
 * @description Cancels the current redeem data listening process
 */
function cancelGetRedeemData()
{
    cancelledGetRedeemData = true;
    gettingRedeemData = false;
    ipcRenderer.send("listenRedeemCancel");
}

/**
 * @description Checks if the redeem data listening was cancelled
 * @returns {boolean} True if cancelled, false otherwise
 */
function wasCancelled()
{
    return cancelledGetRedeemData;
}

/**
 * @description Creates a new custom bonk configuration with default settings
 * @returns {Promise<void>}
 */
async function addBonk()
{
    var newBonkNumber = 1;
    var customBonks = await getData("customBonks");
    if (customBonks == null)
        customBonks = {};

    while (customBonks["Custom Bonk " + newBonkNumber] != null)
        newBonkNumber++;

    customBonks["Custom Bonk " + newBonkNumber] = {
        "barrageCount": 1,
        "barrageFrequencyOverride": false,
        "barrageFrequency": await getData("barrageFrequency"),
        "throwDurationOverride": false,
        "throwDuration": await getData("throwDuration"),
        "throwAngleOverride": false,
        "throwAngleMin": await getData("throwAngleMin"),
        "throwAngleMax": await getData("throwAngleMax"),
        "throwDirectionOverride": false,
        "throwDirection": await getData("throwDirection"),
        "spinSpeedMin": await getData("spinSpeedMin"),
        "spinSpeedMax": await getData("spinSpeedMax"),
        "itemsOverride": false,
        "soundsOverride": false,
        "impactDecals": [],
        "windupSounds": [],
        "windupDelay": 0
    };

    setData("customBonks", customBonks);

    var throws = await getData("throws");
    for (var i = 0; i < throws.length; i++)
        if (throws[i].enabled)
            throws[i].customs.push("Custom Bonk " + newBonkNumber);
    setData("throws", throws);

    var impacts = await getData("impacts");
    for (var i = 0; i < impacts.length; i++)
        if (impacts[i].enabled)
            impacts[i].customs.push("Custom Bonk " + newBonkNumber);
    setData("impacts", impacts);

    openBonks();
}

/**
 * @description Opens the bonk details panel for editing a custom bonk configuration
 * @param {string} customBonkName - The name of the custom bonk to edit
 * @returns {Promise<void>}
 */
async function bonkDetails(customBonkName)
{
    var customBonks = await getData("customBonks");

    if (customBonks[customBonkName] != null)
    {
        animationController.showPanel("bonkDetails", true);

        // Copy new elements to remove all old listeners
        var oldTable = document.querySelector("#bonkDetailsTable");
        var newTable = oldTable.cloneNode(true);
        oldTable.after(newTable);
        oldTable.remove();

        const bonkDetailsTable = document.querySelector("#bonkDetailsTable");

        // Bonk Name
        bonkDetailsTable.querySelector(".bonkName").value = customBonkName;
        bonkDetailsTable.querySelector(".bonkName").addEventListener("change", async () => {
            var customBonks = await getData("customBonks");
            if (customBonks[bonkDetailsTable.querySelector(".bonkName").value] == null)
            {
                customBonks[bonkDetailsTable.querySelector(".bonkName").value] = customBonks[customBonkName];
                delete customBonks[customBonkName];

                var throws = await getData("throws");
                for (var i = 0; i < throws.length; i++)
                {
                    if (throws[i].customs.includes(customBonkName))
                    {
                        throws[i].customs.splice(throws[i].customs.indexOf(customBonkName), 1);
                        throws[i].customs.push(bonkDetailsTable.querySelector(".bonkName").value);
                    }
                }
                setData("throws", throws);

                var impacts = await getData("impacts");
                for (var i = 0; i < impacts.length; i++)
                {
                    if (impacts[i].customs.includes(customBonkName))
                    {
                        impacts[i].customs.splice(impacts[i].customs.indexOf(customBonkName), 1);
                        impacts[i].customs.push(bonkDetailsTable.querySelector(".bonkName").value);
                    }
                }
                setData("impacts", impacts);

                customBonkName = bonkDetailsTable.querySelector(".bonkName").value;
            }
            else
            {
                // Error: Name exists
            }
            setData("customBonks", customBonks);
        });

        // Barrage Count
        bonkDetailsTable.querySelector(".barrageCount").value = customBonks[customBonkName].barrageCount;
        bonkDetailsTable.querySelector(".barrageCount").addEventListener("change", async () => {
            var customBonks = await getData("customBonks");
            customBonks[customBonkName].barrageCount = parseInt(bonkDetailsTable.querySelector(".barrageCount").value);
            setData("customBonks", customBonks);
        });

        // Barrage Frequency
        bonkDetailsTable.querySelector(".barrageFrequencyOverride").checked = customBonks[customBonkName].barrageFrequencyOverride;
        bonkDetailsTable.querySelector(".barrageFrequency").disabled = !customBonks[customBonkName].barrageFrequencyOverride;
        bonkDetailsTable.querySelector(".barrageFrequencyOverride").addEventListener("change", async () => {
            var customBonks = await getData("customBonks");
            customBonks[customBonkName].barrageFrequencyOverride = bonkDetailsTable.querySelector(".barrageFrequencyOverride").checked;
            bonkDetailsTable.querySelector(".barrageFrequency").disabled = !customBonks[customBonkName].barrageFrequencyOverride;
            setData("customBonks", customBonks);
        });

        bonkDetailsTable.querySelector(".barrageFrequency").value = customBonks[customBonkName].barrageFrequency;
        bonkDetailsTable.querySelector(".barrageFrequency").addEventListener("change", async () => {
            var customBonks = await getData("customBonks");
            customBonks[customBonkName].barrageFrequency = parseFloat(bonkDetailsTable.querySelector(".barrageFrequency").value);
            setData("customBonks", customBonks);
        });

        // Throw Duration
        bonkDetailsTable.querySelector(".throwDurationOverride").checked = customBonks[customBonkName].throwDurationOverride;
        bonkDetailsTable.querySelector(".throwDuration").disabled = !customBonks[customBonkName].throwDurationOverride;
        bonkDetailsTable.querySelector(".throwDurationOverride").addEventListener("change", async () => {
            var customBonks = await getData("customBonks");
            customBonks[customBonkName].throwDurationOverride = bonkDetailsTable.querySelector(".throwDurationOverride").checked;
            bonkDetailsTable.querySelector(".throwDuration").disabled = !customBonks[customBonkName].throwDurationOverride;
            setData("customBonks", customBonks);
        });

        bonkDetailsTable.querySelector(".throwDuration").value = customBonks[customBonkName].throwDuration;
        bonkDetailsTable.querySelector(".throwDuration").addEventListener("change", async () => {
            var customBonks = await getData("customBonks");
            customBonks[customBonkName].throwDuration = parseFloat(bonkDetailsTable.querySelector(".throwDuration").value);
            setData("customBonks", customBonks);
        });

        // Spin Speed
        bonkDetailsTable.querySelector(".spinSpeedOverride").checked = customBonks[customBonkName].spinSpeedOverride;
        bonkDetailsTable.querySelector(".spinSpeedMin").disabled = !customBonks[customBonkName].spinSpeedOverride;
        bonkDetailsTable.querySelector(".spinSpeedMax").disabled = !customBonks[customBonkName].spinSpeedOverride;
        bonkDetailsTable.querySelector(".spinSpeedOverride").addEventListener("change", async () => {
            var customBonks = await getData("customBonks");
            customBonks[customBonkName].spinSpeedOverride = bonkDetailsTable.querySelector(".spinSpeedOverride").checked;
            bonkDetailsTable.querySelector(".spinSpeedMin").disabled = !customBonks[customBonkName].spinSpeedOverride;
            bonkDetailsTable.querySelector(".spinSpeedMax").disabled = !customBonks[customBonkName].spinSpeedOverride;
            setData("customBonks", customBonks);
        });

        bonkDetailsTable.querySelector(".spinSpeedMin").value = customBonks[customBonkName].spinSpeedMin;
        bonkDetailsTable.querySelector(".spinSpeedMin").addEventListener("change", async () => {
            var customBonks = await getData("customBonks");
            customBonks[customBonkName].spinSpeedMin = parseFloat(bonkDetailsTable.querySelector(".spinSpeedMin").value);
            setData("customBonks", customBonks);
        });

        // Throw Angle Max
        bonkDetailsTable.querySelector(".spinSpeedMax").value = customBonks[customBonkName].spinSpeedMax;
        bonkDetailsTable.querySelector(".spinSpeedMax").addEventListener("change", async () => {
            var customBonks = await getData("customBonks");
            customBonks[customBonkName].spinSpeedMax = parseFloat(bonkDetailsTable.querySelector(".spinSpeedMax").value);
            setData("customBonks", customBonks);
        });

        // Throw Angle
        bonkDetailsTable.querySelector(".throwAngleOverride").checked = customBonks[customBonkName].throwAngleOverride;
        bonkDetailsTable.querySelector(".throwAngleMin").disabled = !customBonks[customBonkName].throwAngleOverride;
        bonkDetailsTable.querySelector(".throwAngleMax").disabled = !customBonks[customBonkName].throwAngleOverride;
        bonkDetailsTable.querySelector(".throwAngleOverride").addEventListener("change", async () => {
            var customBonks = await getData("customBonks");
            customBonks[customBonkName].throwAngleOverride = bonkDetailsTable.querySelector(".throwAngleOverride").checked;
            bonkDetailsTable.querySelector(".throwAngleMin").disabled = !customBonks[customBonkName].throwAngleOverride;
            bonkDetailsTable.querySelector(".throwAngleMax").disabled = !customBonks[customBonkName].throwAngleOverride;
            setData("customBonks", customBonks);
        });

        bonkDetailsTable.querySelector(".throwAngleMin").value = customBonks[customBonkName].throwAngleMin;
        bonkDetailsTable.querySelector(".throwAngleMin").addEventListener("change", async () => {
            var customBonks = await getData("customBonks");
            customBonks[customBonkName].throwAngleMin = parseInt(bonkDetailsTable.querySelector(".throwAngleMin").value);
            setData("customBonks", customBonks);
        });

        bonkDetailsTable.querySelector(".throwAngleMax").value = customBonks[customBonkName].throwAngleMax;
        bonkDetailsTable.querySelector(".throwAngleMax").addEventListener("change", async () => {
            var customBonks = await getData("customBonks");
            customBonks[customBonkName].throwAngleMax = parseInt(bonkDetailsTable.querySelector(".throwAngleMax").value);
            setData("customBonks", customBonks);
        });

        // Throw Direction
        bonkDetailsTable.querySelector(".throwDirectionOverride").checked = customBonks[customBonkName].throwDirectionOverride;
        bonkDetailsTable.querySelector(".throwDirection").disabled = !customBonks[customBonkName].throwDirectionOverride;
        bonkDetailsTable.querySelector(".throwDirectionOverride").addEventListener("change", async () => {
            var customBonks = await getData("customBonks");
            customBonks[customBonkName].throwDirectionOverride = bonkDetailsTable.querySelector(".throwDirectionOverride").checked;
            bonkDetailsTable.querySelector(".throwDirection").disabled = !customBonks[customBonkName].throwDirectionOverride;
            setData("customBonks", customBonks);
        });

        bonkDetailsTable.querySelector(".throwDirection").value = customBonks[customBonkName].throwDirection;
        bonkDetailsTable.querySelector(".throwDirection").addEventListener("change", async () => {
            var customBonks = await getData("customBonks");
            customBonks[customBonkName].throwDirection = bonkDetailsTable.querySelector(".throwDirection").value;
            setData("customBonks", customBonks);
        });

        // Items
        bonkDetailsTable.querySelector(".imagesOverride").checked = customBonks[customBonkName].itemsOverride;
        bonkDetailsTable.querySelector(".images").disabled = !customBonks[customBonkName].itemsOverride;
        bonkDetailsTable.querySelector(".imagesOverride").addEventListener("change", async () => {
            var customBonks = await getData("customBonks");
            customBonks[customBonkName].itemsOverride = bonkDetailsTable.querySelector(".imagesOverride").checked;
            bonkDetailsTable.querySelector(".images").disabled = !customBonks[customBonkName].itemsOverride;
            setData("customBonks", customBonks);
        });

        bonkDetailsTable.querySelector(".images").addEventListener("click", () => {
            if (!bonkDetailsTable.querySelector(".images").disabled)
            {
                uiController.openImagesCustom(customBonkName);
                animationController.showPanel("bonkImagesCustom", true);
            }
        });

        // Sounds
        bonkDetailsTable.querySelector(".soundsOverride").checked = customBonks[customBonkName].soundsOverride;
        bonkDetailsTable.querySelector(".sounds").disabled = !customBonks[customBonkName].soundsOverride;
        bonkDetailsTable.querySelector(".soundsOverride").addEventListener("change", async () => {
            var customBonks = await getData("customBonks");
            customBonks[customBonkName].soundsOverride = bonkDetailsTable.querySelector(".soundsOverride").checked;
            bonkDetailsTable.querySelector(".sounds").disabled = !customBonks[customBonkName].soundsOverride;
            setData("customBonks", customBonks);
        });

        bonkDetailsTable.querySelector(".sounds").addEventListener("click", () => {
            if (!bonkDetailsTable.querySelector(".sounds").disabled)
            {
                uiController.openSoundsCustom(customBonkName);
                animationController.showPanel("bonkSoundsCustom", true);
            }
        });

        // Impact Decals
        bonkDetailsTable.querySelector(".impactDecals").addEventListener("click", () => {
            assetLoader.openImpactDecals(customBonkName);
            animationController.showPanel("impactDecals", true);
        });

        // Windup Sounds
        bonkDetailsTable.querySelector(".windupSounds").addEventListener("click", () => {
            assetLoader.openWindupSounds(customBonkName);
            animationController.showPanel("windupSounds", true);
        });

        // Windup Delay
        bonkDetailsTable.querySelector(".windupDelay").value = customBonks[customBonkName].windupDelay;
        bonkDetailsTable.querySelector(".windupDelay").addEventListener("change", async () => {
            var customBonks = await getData("customBonks");
            customBonks[customBonkName].windupDelay = parseFloat(bonkDetailsTable.querySelector(".windupDelay").value);
            setData("customBonks", customBonks);
        });
    }
}

/**
 * @description Displays the custom bonks library UI with all configured bonks
 * @returns {Promise<void>}
 */
async function openBonks()
{
    var customBonks = await getData("customBonks");

    document.querySelectorAll(".customBonkRow").forEach(element => { element.remove(); });

    if (customBonks == null)
        setData("customBonks", {});
    else
    {
        for (const key in customBonks)
        {
            const row = document.querySelector("#customBonkRow").cloneNode(true);
            row.removeAttribute("id");
            row.removeAttribute("hidden");
            row.classList.add("customBonkRow");
            document.querySelector("#bonksTable").appendChild(row);

            row.querySelector(".bonkDetailsButton").addEventListener("click", () => {
                bonkDetails(key);
            });

            row.querySelector(".imageLabel").innerText = key;

            row.querySelector(".imageRemove").addEventListener("click", async () => {
                delete customBonks[key];
                setData("customBonks", customBonks);

                var throws = await getData("throws");
                for (var i = 0; i < throws.length; i++)
                {
                    if (throws[i].customs.includes(key))
                        throws[i].customs.splice(throws[i].customs.indexOf(key), 1);
                }
                setData("throws", throws);

                var impacts = await getData("impacts");
                for (var i = 0; i < impacts.length; i++)
                {
                    if (impacts[i].customs.includes(key))
                        impacts[i].customs.splice(impacts[i].customs.indexOf(key), 1);
                }

                setData("impacts", impacts);

                var eventType = await getData("redeems");
                for (var i = 0; i < eventType.length; i++)
                {
                    if (eventType[i].bonkType == key)
                        eventType[i].bonkType = "single";
                }
                setData("redeems", eventType);

                eventType = await getData("commands");
                for (var i = 0; i < eventType.length; i++)
                {
                    if (eventType[i].bonkType == key)
                        eventType[i].bonkType = "single";
                }
                setData("commands", eventType);

                eventType = await getData("subType");
                if (eventType == key)
                    setData("subType", "barrage");

                eventType = await getData("subGiftType");
                if (eventType == key)
                    setData("subGiftType", "barrage");

                eventType = await getData("charityType");
                if (eventType == key)
                    setData("charityType", "barrage");

                openBonks();
            });
        };
    }
}

/**
 * @description Populates the test bonks panel with all custom bonk options
 * @returns {Promise<void>}
 */
async function openTestBonks()
{
    var customBonks = await getData("customBonks");

    document.querySelectorAll(".testCustom").forEach(element => { element.remove(); });

    if (customBonks == null)
        setData("customBonks", {});
    else
    {
        for (const key in customBonks)
        {
            const row = document.querySelector("#testCustom").cloneNode(true);
            row.removeAttribute("id");
            row.removeAttribute("hidden");
            row.classList.add("testCustom");
            document.querySelector("#testCustom").after(row);

            row.querySelector(".innerTopButton").innerText = key;

            row.addEventListener("click", () => testCustomBonk(key));
        };
    }
}

/**
 * @description Sends a test request for a custom bonk to the main process
 * @param {string} customName - The name of the custom bonk to test
 */
function testCustomBonk(customName)
{
    ipcRenderer.send("testCustomBonk", customName);
}

/**
 * @description Displays the events panel with all redeems and commands
 * @returns {Promise<void>}
 */
async function openEvents()
{
    const customBonks = await getData("customBonks");

    // Fill redeem rows
    var redeems = await getData("redeems");

    document.querySelectorAll(".redeemsRow").forEach(element => { element.remove(); });

    redeems.forEach((_, index) =>
    {
        var row = document.querySelector("#redeemsRow").cloneNode(true);
        row.removeAttribute("id");
        row.classList.add("redeemsRow");
        row.classList.remove("hidden");
        document.querySelector("#redeemsRow").after(row);

        row.querySelector(".redeemEnabled").checked = redeems[index].enabled;
        row.querySelector(".redeemEnabled").addEventListener("change", async () => {
            var redeems = await getData("redeems");
            redeems[index].enabled = row.querySelector(".redeemEnabled").checked;
            setData("redeems", redeems);
        });

        row.querySelector(".redeemName").innerHTML = redeems[index].name == null ? "<b class=\"errorText\">Unassigned</b>" : redeems[index].name;

        row.querySelector(".redeemID").addEventListener("click", async () => {
            var redeems = await getData("redeems");
            row.querySelector(".redeemID").classList.add("hidden");
            row.querySelector(".redeemCancel").classList.remove("hidden");
            row.querySelector(".redeemName").innerText = "Listening...";
            var data = await getRedeemData();
            if (!wasCancelled())
            {
                row.querySelector(".redeemID").classList.remove("hidden");
                row.querySelector(".redeemCancel").classList.add("hidden");
                redeems[index].id = data[0];
                redeems[index].name = data[1];
                row.querySelector(".redeemName").innerText = data[1];
                setData("redeems", redeems);
            }
        });

        row.querySelector(".redeemCancel").addEventListener("click", async () => {
            var redeems = await getData("redeems");
            row.querySelector(".redeemID").classList.remove("hidden");
            row.querySelector(".redeemCancel").classList.add("hidden");

            row.querySelector(".redeemName").innerHTML = redeems[index].name == null ? "<b class=\"errorText\">Unassigned</b>" : redeems[index].name;

            cancelGetRedeemData();
        });

        for (var key in customBonks)
        {
            var customBonk = document.createElement("option");
            customBonk.value = key;
            customBonk.innerText = key;
            row.querySelector(".bonkType").appendChild(customBonk);
        }

        row.querySelector(".bonkType").value = redeems[index].bonkType;
        row.querySelector(".bonkType").addEventListener("change", async () => {
            var redeems = await getData("redeems");
            redeems[index].bonkType = row.querySelector(".bonkType").value;
            setData("redeems", redeems);
        });

        row.querySelector(".redeemRemove").addEventListener("click", async () => {
            var redeems = await getData("redeems");
            redeems.splice(index, 1);
            setData("redeems", redeems);
            openEvents();
        });
    });

    // Fill command rows
    var commands = await getData("commands");

    document.querySelectorAll(".commandsRow").forEach(element => { element.remove(); });

    commands.forEach((_, index) =>
    {
        var row = document.querySelector("#commandsRow").cloneNode(true);
        row.removeAttribute("id");
        row.classList.add("commandsRow");
        row.classList.remove("hidden");
        document.querySelector("#commandsRow").after(row);

        row.querySelector(".commandEnabled").checked = commands[index].enabled;
        row.querySelector(".commandEnabled").addEventListener("change", async () => {
            var commands = await getData("commands");
            commands[index].enabled = row.querySelector(".commandEnabled").checked;
            setData("commands", commands);
        });

        row.querySelector(".commandModOnly").checked = commands[index].modOnly;
        row.querySelector(".commandModOnly").addEventListener("change", async () => {
            commands[index].modOnly = row.querySelector(".commandModOnly").checked;
            setData("commands", commands);
        });

        row.querySelector(".commandName").value = commands[index].name;
        row.querySelector(".commandName").addEventListener("change", async () => {
            var commands = await getData("commands");
            commands[index].name = row.querySelector(".commandName").value;
            setData("commands", commands);
        });

        row.querySelector(".commandCooldown").value = commands[index].cooldown;
        row.querySelector(".commandCooldown").addEventListener("change", async () => {
            var commands = await getData("commands");
            commands[index].cooldown = row.querySelector(".commandCooldown").value;
            setData("commands", commands);
        });

        for (var key in customBonks)
        {
            var customBonk = document.createElement("option");
            customBonk.value = key;
            customBonk.innerText = key;
            row.querySelector(".bonkType").appendChild(customBonk);
        }

        row.querySelector(".bonkType").value = commands[index].bonkType;
        row.querySelector(".bonkType").addEventListener("change", async () => {
            var commands = await getData("commands");
            commands[index].bonkType = row.querySelector(".bonkType").value;
            setData("commands", commands);
        });

        row.querySelector(".commandRemove").addEventListener("click", async () => {
            var commands = await getData("commands");
            commands.splice(index, 1);
            setData("commands", commands);
            openEvents();
        });
    });

    var node = document.querySelector("#followType");
    while (node.childElementCount > 4)
        node.removeChild(node.lastChild);

    for (var key in customBonks)
    {
        var customBonk = document.createElement("option");
        customBonk.value = key;
        customBonk.innerText = key;
        node.appendChild(customBonk);
    }

    // Update Sub and Gift Sub drop-downs
    node = document.querySelector("#subType");
    while (node.childElementCount > 4)
        node.removeChild(node.lastChild);

    for (var key in customBonks)
    {
        var customBonk = document.createElement("option");
        customBonk.value = key;
        customBonk.innerText = key;
        node.appendChild(customBonk);
    }

    node = document.querySelector("#subGiftType");
    while (node.childElementCount > 4)
        node.removeChild(node.lastChild);

    for (var key in customBonks)
    {
        var customBonk = document.createElement("option");
        customBonk.value = key;
        customBonk.innerText = key;
        node.appendChild(customBonk);
    }

    // Update Charity drop-down
    node = document.querySelector("#charityType");
    while (node.childElementCount > 4)
        node.removeChild(node.lastChild);

    for (var key in customBonks)
    {
        var customBonk = document.createElement("option");
        customBonk.value = key;
        customBonk.innerText = key;
        node.appendChild(customBonk);
    }
}

module.exports = {
    initialize,
    setupAuthenticationEvents,
    setupLinkEvents,
    setupRedeemDataListener,
    addBonk,
    bonkDetails,
    openBonks,
    openTestBonks,
    testCustomBonk,
    newRedeem,
    newCommand,
    getRedeemData,
    cancelGetRedeemData,
    wasCancelled,
    openEvents
};

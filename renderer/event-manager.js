const { ipcRenderer } = require("electron");

// =============
// Event Manager
// =============
// Manages IPC event listeners and communication with main process
// Also handles custom bonk management

let getData, setData, showPanel, openImagesCustom, openSoundsCustom, assetLoader;

function initialize(dependencies = {})
{
    setupAuthenticationEvents();
    setupLinkEvents();

    // Store dependencies for bonk management functions
    if (dependencies.getData) getData = dependencies.getData;
    if (dependencies.setData) setData = dependencies.setData;
    if (dependencies.showPanel) showPanel = dependencies.showPanel;
    if (dependencies.openImagesCustom) openImagesCustom = dependencies.openImagesCustom;
    if (dependencies.openSoundsCustom) openSoundsCustom = dependencies.openSoundsCustom;
    if (dependencies.assetLoader) assetLoader = dependencies.assetLoader;
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

async function bonkDetails(customBonkName)
{
    var customBonks = await getData("customBonks");

    if (customBonks[customBonkName] != null)
    {
        showPanel("bonkDetails", true);

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
                openImagesCustom(customBonkName);
                showPanel("bonkImagesCustom", true);
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
                openSoundsCustom(customBonkName);
                showPanel("bonkSoundsCustom", true);
            }
        });

        // Impact Decals
        bonkDetailsTable.querySelector(".impactDecals").addEventListener("click", () => {
            assetLoader.openImpactDecals(customBonkName);
            showPanel("impactDecals", true);
        });

        // Windup Sounds
        bonkDetailsTable.querySelector(".windupSounds").addEventListener("click", () => {
            assetLoader.openWindupSounds(customBonkName);
            showPanel("windupSounds", true);
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

function testCustomBonk(customName)
{
    ipcRenderer.send("testCustomBonk", customName);
}

module.exports = {
    initialize,
    setupAuthenticationEvents,
    setupLinkEvents,
    addBonk,
    bonkDetails,
    openBonks,
    openTestBonks,
    testCustomBonk
};

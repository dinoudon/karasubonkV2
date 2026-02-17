const { ipcRenderer } = require("electron");
const fs = require("fs");

// ==============
// UI Controller
// ==============
// Handles UI updates and DOM manipulation

let dataManager, assetLoader, eventManager, animationController;
let currentImageIndex = -1;

/**
 * @description Initializes the UI controller with dependencies and sets up event listeners
 * @param {Object} dependencies - Dependencies object containing dataManager, assetLoader, eventManager, and animationController
 */
function initialize(dependencies = {})
{
    if (dependencies.dataManager) dataManager = dependencies.dataManager;
    if (dependencies.assetLoader) assetLoader = dependencies.assetLoader;
    if (dependencies.eventManager) eventManager = dependencies.eventManager;
    if (dependencies.animationController) animationController = dependencies.animationController;

    setupUIEventListeners();
}

/**
 * @description Ensures two input nodes have different values by incrementing if they match
 * @param {HTMLElement} node - The first input node
 * @param {HTMLElement} otherNode - The second input node to compare against
 */
function differentValue(node, otherNode)
{
    if (node.value == otherNode.value)
        node.value++;
}

/**
 * @description Clamps an input node's value between min and max bounds
 * @param {HTMLElement} node - The input node to clamp
 * @param {number|null} min - Minimum value (null for no minimum)
 * @param {number|null} max - Maximum value (null for no maximum)
 */
function clampValue(node, min, max)
{
    var val = node.value;
    if (min != null && val < min)
        val = min;
    if (max != null && val > max)
        val = max;
    node.value = val;
}

/**
 * @description Loads custom images for a specific custom bonk type
 * @param {string} customName - The name of the custom bonk type
 * @returns {Promise<void>}
 */
async function loadImageCustom(customName)
{
    const { getData, setData, getUserDataPath } = dataManager;
    var throws = await getData("throws");
    var files = document.querySelector("#loadImageCustom").files;
    for (var i = 0; i < files.length; i++)
    {
        var imageFile = files[i];
        if (!fs.existsSync(getUserDataPath() + "/throws/"))
            fs.mkdirSync(getUserDataPath() + "/throws/");

        var source = fs.readFileSync(imageFile.path);

        var append = "";
        if (imageFile.path != getUserDataPath() + "\\throws\\" + imageFile.name)
        {
            while (fs.existsSync(getUserDataPath() + "/throws/" + imageFile.name.substr(0, imageFile.name.lastIndexOf(".")) + append + imageFile.name.substr(imageFile.name.lastIndexOf("."))))
            {
                var target = fs.readFileSync(getUserDataPath() + "/throws/" + imageFile.name.substr(0, imageFile.name.lastIndexOf(".")) + append + imageFile.name.substr(imageFile.name.lastIndexOf(".")));

                if (target.equals(source))
                    append = append == "" ? 2 : (append + 1);
                else
                    break;
            }
        }
        var filename = imageFile.name.substr(0, imageFile.name.lastIndexOf(".")) + append + imageFile.name.substr(imageFile.name.lastIndexOf("."));

        fs.copyFileSync(imageFile.path, getUserDataPath() + "/throws/" + filename);

        throws.unshift({
            "enabled": false,
            "location": "throws/" + filename,
            "weight": 1.0,
            "scale": 1.0,
            "sound": null,
            "volume": 1.0,
            "customs": [ customName ]
        });
    }
    setData("throws", throws);
    openImagesCustom(customName);
    assetLoader.copyFilesToDirectory();

    document.querySelector("#loadImageCustom").value = null;
}

/**
 * @description Displays the custom images library for a specific custom bonk type
 * @param {string} customName - The name of the custom bonk type
 * @returns {Promise<void>}
 */
async function openImagesCustom(customName)
{
    const { getData, setData, getUserDataPath } = dataManager;
    var oldTable = document.querySelector("#imageTableCustom");
    var newTable = oldTable.cloneNode(true);
    oldTable.after(newTable);
    oldTable.remove();

    document.querySelector("#newImageCustom").addEventListener("click", () => { document.querySelector("#loadImageCustom").click(); });
    document.querySelector("#loadImageCustom").addEventListener("change", () => { loadImageCustom(customName); });

    var throws = await getData("throws");

    var allEnabled = true;
    for (var i = 0; i < throws.length; i++)
    {
        if (!throws[i].customs.includes(customName))
        {
            allEnabled = false;
            break;
        }
    }
    document.querySelector("#imageTableCustom").querySelector(".selectAll input").checked = allEnabled;

    document.querySelector("#imageTableCustom").querySelector(".selectAll input").addEventListener("change", async () => {
        var throws = await getData("throws");
        document.querySelector("#imageTableCustom").querySelectorAll(".imageEnabled").forEach((element) => {
            element.checked = document.querySelector("#imageTableCustom").querySelector(".selectAll input").checked;
        });
        for (var i = 0; i < throws.length; i++)
        {
            if (document.querySelector("#imageTableCustom").querySelector(".selectAll input").checked && !throws[i].customs.includes(customName))
                throws[i].customs.push(customName);
            else if (!document.querySelector("#imageTableCustom").querySelector(".selectAll input").checked && throws[i].customs.includes(customName))
                throws[i].customs.splice(throws[i].customs.indexOf(customName), 1);
        }
        setData("throws", throws);
    });

    document.querySelector("#imageTableCustom").querySelectorAll(".imageRow").forEach((element) => { element.remove(); });

    if (throws == null)
        setData("throws", []);
    else
    {
        throws.forEach((_, index) =>
        {
            if (fs.existsSync(getUserDataPath() + "/" + throws[index].location))
            {
                var row = document.querySelector("#imageRowCustom").cloneNode(true);
                row.removeAttribute("id");
                row.classList.add("imageRow");
                row.removeAttribute("hidden");
                document.querySelector("#imageTableCustom").appendChild(row);

                row.querySelector(".imageLabel").innerText = throws[index].location.substr(throws[index].location.lastIndexOf('/') + 1);

                row.querySelector(".imageImage").src = getUserDataPath() + "/" + throws[index].location;

                row.querySelector(".imageEnabled").checked = throws[index].customs.includes(customName);
                row.querySelector(".imageEnabled").addEventListener("change", async () => {
                    var throws = await getData("throws");
                    if (!row.querySelector(".imageEnabled").checked && throws[index].customs.includes(customName))
                        throws[index].customs.splice(throws[index].customs.indexOf(customName), 1);
                    else if (row.querySelector(".imageEnabled").checked && !throws[index].customs.includes(customName))
                        throws[index].customs.push(customName);
                    setData("throws", throws);

                    var allEnabled = true;
                    for (var i = 0; i < throws.length; i++)
                    {
                        if (!throws[i].customs.includes(customName))
                        {
                            allEnabled = false;
                            break;
                        }
                    }
                    document.querySelector("#imageTableCustom").querySelector(".selectAll input").checked = allEnabled;
                });
            }
            else
            {
                throws.splice(index, 1);
                setData("throws", throws);
            }
        });
    }
}

/**
 * @description Loads custom impact sounds for a specific custom bonk type
 * @param {string} customName - The name of the custom bonk type
 * @returns {Promise<void>}
 */
async function loadSoundCustom(customName)
{
    const { getData, setData, getUserDataPath } = dataManager;
    var impacts = await getData("impacts");
    var files = document.querySelector("#loadSoundCustom").files;
    for (var i = 0; i < files.length; i++)
    {
        var soundFile = files[i];
        if (!fs.existsSync(getUserDataPath() + "/impacts/"))
            fs.mkdirSync(getUserDataPath() + "/impacts/");

        var source = fs.readFileSync(soundFile.path);

        var append = "";
        if (soundFile.path != getUserDataPath() + "\\impacts\\" + soundFile.name)
        {
            while (fs.existsSync(getUserDataPath() + "/impacts/" + soundFile.name.substr(0, soundFile.name.lastIndexOf(".")) + append + soundFile.name.substr(soundFile.name.lastIndexOf("."))))
            {
                var target = fs.readFileSync(getUserDataPath() + "/impacts/" + soundFile.name.substr(0, soundFile.name.lastIndexOf(".")) + append + soundFile.name.substr(soundFile.name.lastIndexOf(".")));

                if (target.equals(source))
                    append = append == "" ? 2 : (append + 1);
                else
                    break;
            }
        }
        var filename = soundFile.name.substr(0, soundFile.name.lastIndexOf(".")) + append + soundFile.name.substr(soundFile.name.lastIndexOf("."));

        fs.copyFileSync(soundFile.path, getUserDataPath() + "/impacts/" + filename);

        impacts.unshift({
            "location": "impacts/" + filename,
            "volume": 1.0,
            "enabled": false,
            "customs": [ customName ]
        });
    }
    setData("impacts", impacts);
    openSoundsCustom(customName);
    assetLoader.copyFilesToDirectory();

    document.querySelector("#loadSoundCustom").value = null;
}

/**
 * @description Displays the custom sounds library for a specific custom bonk type
 * @param {string} customName - The name of the custom bonk type
 * @returns {Promise<void>}
 */
async function openSoundsCustom(customName)
{
    const { getData, setData, getUserDataPath } = dataManager;
    var oldTable = document.querySelector("#soundTableCustom");
    var newTable = oldTable.cloneNode(true);
    oldTable.after(newTable);
    oldTable.remove();

    document.querySelector("#newSoundCustom").addEventListener("click", () => { document.querySelector("#loadSoundCustom").click(); });
    document.querySelector("#loadSoundCustom").addEventListener("change", () => { loadSoundCustom(customName); });

    var impacts = await getData("impacts");

    var allEnabled = true;
    for (var i = 0; i < impacts.length; i++)
    {
        if (!impacts[i].customs.includes(customName))
        {
            allEnabled = false;
            break;
        }
    }
    document.querySelector("#soundTableCustom").querySelector(".selectAll input").checked = allEnabled;

    document.querySelector("#soundTableCustom").querySelector(".selectAll input").addEventListener("change", async () => {
        var impacts = await getData("impacts");
        document.querySelector("#soundTableCustom").querySelectorAll(".imageEnabled").forEach((element) => {
            element.checked = document.querySelector("#soundTableCustom").querySelector(".selectAll input").checked;
        });
        for (var i = 0; i < impacts.length; i++)
        {
            if (document.querySelector("#soundTableCustom").querySelector(".selectAll input").checked && !impacts[i].customs.includes(customName))
                impacts[i].customs.push(customName);
            else if (!document.querySelector("#soundTableCustom").querySelector(".selectAll input").checked && impacts[i].customs.includes(customName))
                impacts[i].customs.splice(impacts[i].customs.indexOf(customName), 1);
        }
        setData("impacts", impacts);
    });

    document.querySelector("#soundTableCustom").querySelectorAll(".soundRow").forEach((element) => { element.remove(); });

    if (impacts == null)
        setData("impacts", []);
    else
    {
        impacts.forEach((_, index) =>
        {
            if (fs.existsSync(getUserDataPath() + "/" + impacts[index].location))
            {
                var row = document.querySelector("#soundRowCustom").cloneNode(true);
                row.removeAttribute("id");
                row.classList.add("soundRow");
                row.removeAttribute("hidden");
                row.querySelector(".imageLabel").innerText = impacts[index].location.substr(impacts[index].location.lastIndexOf('/') + 1);
                document.querySelector("#soundTableCustom").appendChild(row);

                row.querySelector(".imageEnabled").checked = impacts[index].customs.includes(customName);
                row.querySelector(".imageEnabled").addEventListener("change", async () => {
                    var impacts = await getData("impacts");
                    if (!row.querySelector(".imageEnabled").checked && impacts[index].customs.includes(customName))
                        impacts[index].customs.splice(impacts[index].customs.indexOf(customName), 1);
                    else if (row.querySelector(".imageEnabled").checked && !impacts[index].customs.includes(customName))
                        impacts[index].customs.push(customName);
                    setData("impacts", impacts);

                    for (var i = 0; i < impacts.length; i++)
                    {
                        if (!impacts[i].customs.includes(customName))
                        {
                            allEnabled = false;
                            break;
                        }
                    }
                    document.querySelector("#soundTableCustom").querySelector(".selectAll input").checked = allEnabled;
                });
            }
            else
            {
                impacts.splice(index, 1);
                setData("impacts", impacts);
            }
        });
    }
}

/**
 * @description Loads a bit image for a specific bit tier
 * @param {string} key - The bit tier key (one, oneHundred, etc.)
 * @returns {Promise<void>}
 */
async function loadBitImage(key)
{
    const { getData, setData, getUserDataPath } = dataManager;
    var bitThrows = await getData("bitThrows");
    var files = document.querySelector("#loadBitImage" + key).files;
    var imageFile = files[0];
    if (!fs.existsSync(getUserDataPath() + "/throws/"))
        fs.mkdirSync(getUserDataPath() + "/throws/");

    var append = "";
    if (imageFile.path != getUserDataPath() + "\\throws\\" + imageFile.name)
        while (fs.existsSync(getUserDataPath() + "/throws/" + imageFile.name.substr(0, imageFile.name.lastIndexOf(".")) + append + imageFile.name.substr(imageFile.name.lastIndexOf("."))))
            append = append == "" ? 2 : (append + 1);
    var filename = imageFile.name.substr(0, imageFile.name.lastIndexOf(".")) + append + imageFile.name.substr(imageFile.name.lastIndexOf("."));

    fs.copyFileSync(imageFile.path, getUserDataPath() + "/throws/" + filename);

    bitThrows[key].location = "throws/" + filename;
    setData("bitThrows", bitThrows);
    openBitImages();
    assetLoader.copyFilesToDirectory();

    document.querySelector("#loadBitImage" + key).value = null;
}

/**
 * @description Displays the bit images library with all bit tier images
 * @returns {Promise<void>}
 */
async function openBitImages()
{
    const { getData, setData, getUserDataPath } = dataManager;
    var bitThrows = await getData("bitThrows");

    if (bitThrows == null)
    {
        const defaultData = require("./data-manager").defaultData;
        bitThrows = defaultData.bitThrows;
        setData("bitThrows", bitThrows);
    }

    document.querySelector("#bit1").querySelector(".imageImage").src = getUserDataPath() + "/" + bitThrows.one.location;
    document.querySelector("#bit1").querySelector(".bitImageScale").value = bitThrows.one.scale;

    document.querySelector("#bit100").querySelector(".imageImage").src = getUserDataPath() + "/" + bitThrows.oneHundred.location;
    document.querySelector("#bit100").querySelector(".bitImageScale").value = bitThrows.oneHundred.scale;

    document.querySelector("#bit1000").querySelector(".imageImage").src = getUserDataPath() + "/" + bitThrows.oneThousand.location;
    document.querySelector("#bit1000").querySelector(".bitImageScale").value = bitThrows.oneThousand.scale;

    document.querySelector("#bit5000").querySelector(".imageImage").src = getUserDataPath() + "/" + bitThrows.fiveThousand.location;
    document.querySelector("#bit5000").querySelector(".bitImageScale").value = bitThrows.fiveThousand.scale;

    document.querySelector("#bit10000").querySelector(".imageImage").src = getUserDataPath() + "/" + bitThrows.tenThousand.location;
    document.querySelector("#bit10000").querySelector(".bitImageScale").value = bitThrows.tenThousand.scale;
}

/**
 * @description Loads a custom sound for the currently selected image
 * @returns {Promise<void>}
 */
async function loadImageSound()
{
    const { getData, setData, getUserDataPath } = dataManager;
    var soundFile = document.querySelector("#loadImageSound").files[0];
    if (!fs.existsSync(getUserDataPath() + "/impacts/"))
        fs.mkdirSync(getUserDataPath() + "/impacts/");

    var append = "";
    if (soundFile.path != getUserDataPath() + "\\impacts\\" + soundFile.name)
        while (fs.existsSync( getUserDataPath() + "/impacts/" + soundFile.name.substr(0, soundFile.name.lastIndexOf(".")) + append + soundFile.name.substr(soundFile.name.lastIndexOf("."))))
            append = append == "" ? 2 : (append + 1);
    var filename = soundFile.name.substr(0, soundFile.name.lastIndexOf(".")) + append + soundFile.name.substr(soundFile.name.lastIndexOf("."));

    fs.copyFileSync(soundFile.path, getUserDataPath() + "/impacts/" + filename);

    var throws = await getData("throws");
    throws[currentImageIndex].sound = "impacts/" + filename;
    setData("throws", throws);

    document.querySelector("#loadImageSound").value = null;
    openImageDetails(currentImageIndex);
    assetLoader.copyFilesToDirectory();
}

/**
 * @description Opens the image details panel for editing the currently selected image
 * @returns {Promise<void>}
 */
async function openImageDetails()
{
    const { getData, setData, getUserDataPath } = dataManager;
    var throws = await getData("throws");

    var oldButton = document.querySelector("#testImage");
    var newButton = document.querySelector("#testImage").cloneNode(true);
    oldButton.after(newButton);
    oldButton.remove();

    var oldTable = document.querySelector("#testImage");
    var newTable = oldTable.cloneNode(true);
    oldTable.after(newTable);
    oldTable.remove();

    document.querySelector("#testImage").addEventListener("click", () => testItem(currentImageIndex));

    const details = document.querySelector("#imageDetails");

    details.querySelector(".imageLabel").innerText = throws[currentImageIndex].location.substr(throws[currentImageIndex].location.lastIndexOf('/') + 1);

    details.querySelector(".imageImage").src = getUserDataPath() + "/" + throws[currentImageIndex].location;
    details.querySelector(".imageImage").style.transform = "scale(" + throws[currentImageIndex].scale + ")";
    details.querySelector(".imageWeight").value = throws[currentImageIndex].weight;
    details.querySelector(".imageScale").value = throws[currentImageIndex].scale;

    if (throws[currentImageIndex].pixel == null)
        throws[currentImageIndex].pixel = false;
    details.querySelector(".imagePixel").checked = throws[currentImageIndex].pixel;
    details.querySelector(".imageImage").style.imageRendering = (throws[currentImageIndex].pixel ? "pixelated" : "auto");

    if (throws[currentImageIndex].sound != null)
    {
        details.querySelector(".imageSoundName").value = throws[currentImageIndex].sound.substr(8);
        details.querySelector(".imageSoundRemove").removeAttribute("disabled");
    }
    else
    {
        details.querySelector(".imageSoundName").value = null;
        details.querySelector(".imageSoundRemove").disabled = "disabled";
    }

    details.querySelector(".imageWeight").addEventListener("change", async () => {
        var throws = await getData("throws");
        throws[currentImageIndex].weight = parseFloat(details.querySelector(".imageWeight").value);
        setData("throws", throws);
    });

    details.querySelector(".imageScale").addEventListener("change", async () => {
        var throws = await getData("throws");
        throws[currentImageIndex].scale = parseFloat(details.querySelector(".imageScale").value);
        details.querySelector(".imageImage").style.transform = "scale(" + throws[currentImageIndex].scale + ")";
        setData("throws", throws);
    });

    details.querySelector(".imagePixel").addEventListener("change", async () => {
        var throws = await getData("throws");
        throws[currentImageIndex].pixel = details.querySelector(".imagePixel").checked;
        details.querySelector(".imageImage").style.imageRendering = (throws[currentImageIndex].pixel ? "pixelated" : "auto");
        setData("throws", throws);
    });

    details.querySelector(".imageSoundVolume").value = throws[currentImageIndex].volume;
    details.querySelector(".imageSoundVolume").addEventListener("change", async () => {
        var throws = await getData("throws");
        throws[currentImageIndex].volume = parseFloat(details.querySelector(".imageSoundVolume").value);
        setData("throws", throws);
    });

    details.querySelector(".imageSoundRemove").addEventListener("click", async () => {
        var throws = await getData("throws");
        throws[currentImageIndex].sound = null;
        setData("throws", throws);
        details.querySelector(".imageSoundName").value = null;
        details.querySelector(".imageSoundRemove").disabled = "disabled";
    });
}

/**
 * @description Displays the bit sounds library showing which sounds are enabled for bits
 * @returns {Promise<void>}
 */
async function openBitSounds()
{
    const { getData, setData, getUserDataPath } = dataManager;
    var impacts = await getData("impacts");

    document.querySelectorAll(".bitSoundRow").forEach((element) => { element.remove(); });

    if (impacts == null)
        setData("impacts", []);
    else
    {
        impacts.forEach((_, index) =>
        {
            if (fs.existsSync(getUserDataPath() + "/" + impacts[index].location))
            {
                var row = document.querySelector("#bitSoundRow").cloneNode(true);
                row.removeAttribute("id");
                row.classList.add("bitSoundRow");
                row.removeAttribute("hidden");
                row.querySelector(".imageLabel").innerText = impacts[index].location.substr(impacts[index].location.lastIndexOf('/') + 1);
                document.querySelector("#bitSoundTable").appendChild(row);

                row.querySelector(".imageEnabled").checked = impacts[index].bits;
                row.querySelector(".imageEnabled").addEventListener("change", async () => {
                    var impacts = await getData("impacts");
                    impacts[index].bits = row.querySelector(".imageEnabled").checked;
                    setData("impacts", impacts);

                    var allEnabled = true;
                    for (var i = 0; i < impacts.length; i++)
                    {
                        if (!impacts[i].bits)
                        {
                            allEnabled = false;
                            break;
                        }
                    }
                    document.querySelector("#bitSoundTable").querySelector(".selectAll input").checked = allEnabled;
                });
            }
            else
            {
                impacts.splice(index, 1);
                setData("impacts", impacts);
            }
        });
    }
}

/**
 * @description Sends a test request for a specific throw item to the main process
 * @param {number} index - The index of the throw item to test
 * @returns {Promise<void>}
 */
async function testItem(index)
{
    const { getData } = dataManager;
    const throws = await getData("throws");
    ipcRenderer.send("testItem", throws[index]);
}

/**
 * @description Sets the current image index for editing
 * @param {number} index - The index of the image to edit
 */
function setCurrentImageIndex(index)
{
    currentImageIndex = index;
}

/**
 * @description Gets the current image index
 * @returns {number} The current image index
 */
function getCurrentImageIndex()
{
    return currentImageIndex;
}

/**
 * @description Sets up all UI event listeners for buttons, inputs, and navigation
 */
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

/**
 * @description Loads bit-specific impact sounds
 * @returns {Promise<void>}
 */
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

/**
 * @description Updates the status display in the UI
 * @param {number} status - The status code
 * @param {string} title - The status title
 * @param {string} description - The status description
 */
function updateStatusDisplay(status, title, description)
{
    // Status display update logic will be implemented here
}

/**
 * @description Updates the username display in the UI
 * @param {string} username - The username to display
 */
function updateUsernameDisplay(username)
{
    // Username display update logic will be implemented here
}

/**
 * @description Shows calibration buttons based on status
 * @param {number} status - The current status code
 */
function showCalibrationButtons(status)
{
    // Calibration button visibility logic will be implemented here
}

/**
 * @description Hides calibration buttons
 */
function hideCalibrationButtons()
{
    // Calibration button hiding logic will be implemented here
}

/**
 * @description Loads a specific data field and applies it to the corresponding UI element
 * @param {string} field - The data field to load
 * @returns {Promise<void>}
 */
async function loadData(field)
{
    const { getData, setData } = dataManager;

    // Enable physics simulation for all users upon updating to 1.19
    if (field == "physicsSim")
    {
        var didPhysicsUpdate = await getData("didPhysicsUpdate");
        if (didPhysicsUpdate == null)
        {
            setData("physicsSim", true);
            setData("didPhysicsUpdate", true);
        }
    }

    const thisData = await getData(field);
    if (thisData != null)
    {
        if (document.querySelector("#" + field).type == "checkbox")
            document.querySelector("#" + field).checked = thisData;
        else
            document.querySelector("#" + field).value = thisData;
    }
    else
    {
        const node = document.querySelector("#" + field);
        const val = node.type == "checkbox" ? node.checked : (node.type == "number" ? parseFloat(node.value) : node.value);
        setData(field, val);
    }
}

/**
 * @description Loads all settings from persistent storage and applies them to UI
 * @returns {Promise<void>}
 */
async function loadAllSettings()
{
    await loadData("followEnabled");
    await loadData("subEnabled");
    await loadData("subGiftEnabled");
    await loadData("charityEnabled");
    await loadData("bitsEnabled");
    await loadData("raidEnabled");

    await loadData("followType");
    await loadData("subType");
    await loadData("subGiftType");
    await loadData("charityType");
    await loadData("bitsMinDonation");
    await loadData("bitsMaxBarrageCount");
    await loadData("raidMinRaiders");
    await loadData("raidMinBarrageCount");
    await loadData("raidMaxBarrageCount");

    await loadData("followCooldown");
    await loadData("subCooldown");
    await loadData("subGiftCooldown");
    await loadData("charityCooldown");
    await loadData("bitsCooldown");
    await loadData("raidCooldown");
    await loadData("bitsOnlySingle");
    await loadData("raidEmotes");

    await loadData("barrageCount");
    await loadData("barrageFrequency");
    await loadData("throwDuration");
    await loadData("returnSpeed");
    await loadData("throwAngleMin");
    await loadData("throwAngleMax");
    await loadData("throwDirection");
    await loadData("physicsSim");
    await loadData("physicsFPS");
    await loadData("physicsGravity");
    await loadData("physicsReverse");
    await loadData("physicsRotate");
    await loadData("physicsHorizontal");
    await loadData("physicsVertical");
    await loadData("spinSpeedMin");
    await loadData("spinSpeedMax");
    await loadData("closeEyes");
    await loadData("openEyes");
    await loadData("itemScaleMin");
    await loadData("itemScaleMax");
    await loadData("delay");
    await loadData("volume");
    await loadData("portThrower");
    await loadData("portVTubeStudio");
    await loadData("ipThrower");
    await loadData("ipVTubeStudio");
    await loadData("minimizeToTray");
}

module.exports = {
    initialize,
    setupUIEventListeners,
    updateStatusDisplay,
    updateUsernameDisplay,
    showCalibrationButtons,
    hideCalibrationButtons,
    loadData,
    loadAllSettings,
    loadImageCustom,
    openImagesCustom,
    loadSoundCustom,
    openSoundsCustom,
    loadBitImage,
    openBitImages,
    loadImageSound,
    openImageDetails,
    openBitSounds,
    testItem,
    differentValue,
    clampValue,
    setCurrentImageIndex,
    getCurrentImageIndex
};

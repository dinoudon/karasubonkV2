const { ipcRenderer } = require("electron");
const fs = require("fs");
const dataManager = require("./data-manager");

// ============
// Asset Loader
// ============
// Handles loading and management of image and sound assets

const { getData, setData, getUserDataPath } = dataManager;

const folders = [ "throws", "impacts", "decals", "windups" ];

// Dependencies injected from renderer
var dependencies = {};

function initialize(deps)
{
    dependencies = deps || {};
}

async function loadImage()
{
    var throws = await getData("throws");
    var files = document.querySelector("#loadImage").files;
    for (var i = 0; i < files.length; i++)
    {
        // Grab the image that was just loaded
        var imageFile = files[i];
        // If the folder for objects doesn't exist for some reason, make it
        if (!fs.existsSync(getUserDataPath() + "/throws/"))
            fs.mkdirSync(getUserDataPath() + "/throws/");

        var source = fs.readFileSync(imageFile.path);

        // Ensure that we're not overwriting any existing files with the same name
        // If the files have the same contents, allows the overwrite
        // If the files have different contents, add an interating number to the end until it's a unique filename or has the same contents
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

        // Make a copy of the file into the local folder
        fs.copyFileSync(imageFile.path, getUserDataPath() + "/throws/" + filename);

        // Add the new image, update the data, and refresh the images page
        throws.unshift({
            "enabled": true,
            "location": "throws/" + filename,
            "weight": 1.0,
            "scale": 1.0,
            "sound": null,
            "volume": 1.0,
            "customs": []
        });
    }
    setData("throws", throws);
    openImages();
    copyFilesToDirectory();

    // Reset the image upload
    document.querySelector("#loadImage").value = null;
}

async function openImages()
{
    var throws = await getData("throws");

    document.querySelector("#imageTable").querySelectorAll(".imageRow").forEach((element) => { element.remove(); });

    var allEnabled = true;
    for (var i = 0; i < throws.length; i++)
    {
        if (!throws[i].enabled)
        {
            allEnabled = false;
            break;
        }
    }
    document.querySelector("#imageTable").querySelector(".selectAll input").checked = allEnabled;

    if (throws == null)
        setData("throws", []);
    else
    {
        throws.forEach((_, index) =>
        {
            if (fs.existsSync(getUserDataPath() + "/" + throws[index].location))
            {
                var row = document.querySelector("#imageRow").cloneNode(true);
                row.removeAttribute("id");
                row.classList.add("imageRow");
                row.removeAttribute("hidden");
                document.querySelector("#imageTable").appendChild(row);

                row.querySelector(".imageLabel").innerText = throws[index].location.substr(throws[index].location.lastIndexOf('/') + 1);

                row.querySelector(".imageImage").src = getUserDataPath() + "/" + throws[index].location;

                var pixel = throws[index].pixel != null ? throws[index].pixel : false;
                row.querySelector(".imageImage").style.imageRendering = (pixel ? "pixelated" : "auto");

                row.querySelector(".imageEnabled").checked = throws[index].enabled;
                row.querySelector(".imageEnabled").addEventListener("change", async () => {
                    var throws = await getData("throws");
                    throws[index].enabled = row.querySelector(".imageEnabled").checked;
                    setData("throws", throws);

                    var allEnabled = true;
                    for (var i = 0; i < throws.length; i++)
                    {
                        if (!throws[i].enabled)
                        {
                            allEnabled = false;
                            break;
                        }
                    }
                    document.querySelector("#imageTable").querySelector(".selectAll input").checked = allEnabled;
                });

                row.querySelector(".imageDetails").addEventListener("click", () => {
                    if (dependencies.setCurrentImageIndex)
                        dependencies.setCurrentImageIndex(index);
                    if (dependencies.openImageDetails)
                        dependencies.openImageDetails();
                    if (dependencies.showPanel)
                        dependencies.showPanel("imageDetails", true);
                });

                row.querySelector(".imageRemove").addEventListener("click", async () => {
                    var throws = await getData("throws");
                    throws.splice(index, 1);
                    setData("throws", throws);
                    openImages();
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

async function loadSound()
{
    var impacts = await getData("impacts");
    var files = document.querySelector("#loadSound").files;
    for (var i = 0; i < files.length; i++)
    {
        var soundFile = files[i];
        if (!fs.existsSync(getUserDataPath() + "/impacts/"))
            fs.mkdirSync(getUserDataPath() + "/impacts/");

        var append = "";
        if (soundFile.path != getUserDataPath() + "\\impacts\\" + soundFile.name)
            while (fs.existsSync( getUserDataPath() + "/impacts/" + soundFile.name.substr(0, soundFile.name.lastIndexOf(".")) + append + soundFile.name.substr(soundFile.name.lastIndexOf("."))))
                append = append == "" ? 2 : (append + 1);
        var filename = soundFile.name.substr(0, soundFile.name.lastIndexOf(".")) + append + soundFile.name.substr(soundFile.name.lastIndexOf("."));

        fs.copyFileSync(soundFile.path, getUserDataPath() + "/impacts/" + filename);

        impacts.unshift({
            "location": "impacts/" + filename,
            "volume": 1.0,
            "enabled": true,
            "bits": true,
            "customs": []
        });
    }
    setData("impacts", impacts);
    openSounds();
    copyFilesToDirectory();

    document.querySelector("#loadSound").value = null;
}

async function openSounds()
{
    var impacts = await getData("impacts");

    document.querySelector("#soundTable").querySelectorAll(".soundRow").forEach((element) => { element.remove(); });

    if (impacts == null)
        setData("impacts", []);
    else
    {
        impacts.forEach((_, index) =>
        {
            if (fs.existsSync(getUserDataPath() + "/" + impacts[index].location))
            {
                var row = document.querySelector("#soundRow").cloneNode(true);
                row.removeAttribute("id");
                row.classList.add("soundRow");
                row.removeAttribute("hidden");
                row.querySelector(".imageLabel").innerText = impacts[index].location.substr(impacts[index].location.lastIndexOf('/') + 1);
                document.querySelector("#soundTable").appendChild(row);

                row.querySelector(".imageRemove").addEventListener("click", async () => {
                    var impacts = await getData("impacts");
                    impacts.splice(index, 1);
                    setData("impacts", impacts);
                    openSounds();
                });

                row.querySelector(".imageEnabled").checked = impacts[index].enabled;
                row.querySelector(".imageEnabled").addEventListener("change", async () => {
                    var impacts = await getData("impacts");
                    impacts[index].enabled = row.querySelector(".imageEnabled").checked;
                    setData("impacts", impacts);

                    var allEnabled = true;
                    for (var i = 0; i < impacts.length; i++)
                    {
                        if (!impacts[i].enabled)
                        {
                            allEnabled = false;
                            break;
                        }
                    }
                    document.querySelector("#soundTable").querySelector(".selectAll input").checked = allEnabled;
                });

                row.querySelector(".soundVolume").value = impacts[index].volume;
                row.querySelector(".soundVolume").addEventListener("change", async () => {
                    var impacts = await getData("impacts");
                    if (dependencies.clampValue)
                        dependencies.clampValue(row.querySelector(".soundVolume"), 0, 1);
                    impacts[index].volume = parseFloat(row.querySelector(".soundVolume").value);
                    setData("impacts", impacts);
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

async function loadImpactDecal(customName)
{
    var customBonks = await getData("customBonks");
    var files = document.querySelector("#loadImpactDecal").files;
    for (var i = 0; i < files.length; i++)
    {
        var imageFile = files[i];
        if (!fs.existsSync(getUserDataPath() + "/decals/"))
            fs.mkdirSync(getUserDataPath() + "/decals/");

        var source = fs.readFileSync(imageFile.path);

        // Ensure that we're not overwriting any existing files with the same name
        // If the files have the same contents, allows the overwrite
        // If the files have different contents, add an interating number to the end until it's a unique filename or has the same contents
        var append = "";
        if (imageFile.path != getUserDataPath() + "\\decals\\" + imageFile.name)
        {
            while (fs.existsSync(getUserDataPath() + "/decals/" + imageFile.name.substr(0, imageFile.name.lastIndexOf(".")) + append + imageFile.name.substr(imageFile.name.lastIndexOf("."))))
            {
                var target = fs.readFileSync(getUserDataPath() + "/decals/" + imageFile.name.substr(0, imageFile.name.lastIndexOf(".")) + append + imageFile.name.substr(imageFile.name.lastIndexOf(".")));

                if (target.equals(source))
                    append = append == "" ? 2 : (append + 1);
                else
                    break;
            }
        }
        var filename = imageFile.name.substr(0, imageFile.name.lastIndexOf(".")) + append + imageFile.name.substr(imageFile.name.lastIndexOf("."));

        fs.copyFileSync(imageFile.path, getUserDataPath() + "/decals/" + filename);

        customBonks[customName].impactDecals.unshift({
            "location": "decals/" + filename,
            "duration": 0.25,
            "scale": 1,
            "enabled": true
        });
    }
    setData("customBonks", customBonks);
    openImpactDecals(customName);
    copyFilesToDirectory();

    document.querySelector("#loadImpactDecal").value = null;
}

async function openImpactDecals(customName)
{
    // Refresh table to remove old event listeners
    var oldTable = document.querySelector("#impactDecalsTable");
    var newTable = oldTable.cloneNode(true);
    oldTable.after(newTable);
    oldTable.remove();

    document.querySelector("#newImpactDecal").addEventListener("click", () => { document.querySelector("#loadImpactDecal").click(); });
    document.querySelector("#loadImpactDecal").addEventListener("change", () => { loadImpactDecal(customName) });

    var customBonks = await getData("customBonks");

    var allEnabled = true;
    for (var i = 0; i < customBonks[customName].impactDecals.length; i++)
    {
        if (!customBonks[customName].impactDecals[i].enabled)
        {
            allEnabled = false;
            break;
        }
    }
    document.querySelector("#impactDecalsTable").querySelector(".selectAll input").checked = allEnabled;

    document.querySelector("#impactDecalsTable").querySelector(".selectAll input").addEventListener("change", async () => {
        var customBonks = await getData("customBonks");
        document.querySelector("#impactDecalsTable").querySelectorAll(".imageEnabled").forEach((element) => {
            element.checked = document.querySelector("#impactDecalsTable").querySelector(".selectAll input").checked;
        });
        for (var i = 0; i < customBonks[customName].impactDecals.length; i++)
            customBonks[customName].impactDecals[i].enabled = document.querySelector("#impactDecalsTable").querySelector(".selectAll input").checked;
        setData("customBonks", customBonks);
    });

    document.querySelector("#impactDecalsTable").querySelectorAll(".imageRow").forEach((element) => { element.remove(); });

    customBonks[customName].impactDecals.forEach((_, index) =>
    {
        if (fs.existsSync(getUserDataPath() + "/" + customBonks[customName].impactDecals[index].location))
        {
            var row = document.querySelector("#impactDecalRow").cloneNode(true);
            row.removeAttribute("id");
            row.classList.add("imageRow");
            row.removeAttribute("hidden");
            row.querySelector(".imageLabel").innerText = customBonks[customName].impactDecals[index].location.substr(customBonks[customName].impactDecals[index].location.lastIndexOf('/') + 1);
            document.querySelector("#impactDecalsTable").appendChild(row);

            row.querySelector(".imageImage").src = getUserDataPath() + "/" + customBonks[customName].impactDecals[index].location;

            row.querySelector(".imageRemove").addEventListener("click", async () => {
                var customBonks = await getData("customBonks");
                customBonks[customName].impactDecals.splice(index, 1);
                setData("customBonks", customBonks);
                openImpactDecals(customName);
            });

            row.querySelector(".imageEnabled").checked = customBonks[customName].impactDecals[index].enabled;
            row.querySelector(".imageEnabled").addEventListener("change", async () => {
                var customBonks = await getData("customBonks");
                customBonks[customName].impactDecals[index].enabled = row.querySelector(".imageEnabled").checked;
                setData("customBonks", customBonks);

                var allEnabled = true;
                for (var i = 0; i < customBonks[customName].impactDecals.length; i++)
                {
                    if (!customBonks[customName].impactDecals[i].enabled)
                    {
                        allEnabled = false;
                        break;
                    }
                }
                document.querySelector("#impactDecalsTable").querySelector(".selectAll input").checked = allEnabled;
            });

            row.querySelector(".decalDuration").value = customBonks[customName].impactDecals[index].duration;
            row.querySelector(".decalDuration").addEventListener("change", async () => {
                var customBonks = await getData("customBonks");
                if (dependencies.clampValue)
                    dependencies.clampValue(row.querySelector(".decalDuration"), 0, null);
                customBonks[customName].impactDecals[index].duration = parseFloat(row.querySelector(".decalDuration").value);
                setData("customBonks", customBonks);
            });

            row.querySelector(".decalScale").value = customBonks[customName].impactDecals[index].scale;
            row.querySelector(".decalScale").addEventListener("change", async () => {
                var customBonks = await getData("customBonks");
                if (dependencies.clampValue)
                    dependencies.clampValue(row.querySelector(".decalScale"), 0, null);
                customBonks[customName].impactDecals[index].scale = parseFloat(row.querySelector(".decalScale").value);
                setData("customBonks", customBonks);
            });
        }
        else
        {
            customBonks[customName].impactDecals.splice(index, 1);
            setData("customBonks", customBonks);
        }
    });
}

async function loadWindupSound(customName)
{
    var customBonks = await getData("customBonks");
    var files = document.querySelector("#loadWindupSound").files;
    for (var i = 0; i < files.length; i++)
    {
        var soundFile = files[i];
        if (!fs.existsSync(getUserDataPath() + "/windups/"))
            fs.mkdirSync(getUserDataPath() + "/windups/");

        var source = fs.readFileSync(soundFile.path);

        // Ensure that we're not overwriting any existing files with the same name
        // If the files have the same contents, allows the overwrite
        // If the files have different contents, add an interating number to the end until it's a unique filename or has the same contents
        var append = "";
        if (soundFile.path != getUserDataPath() + "\\windups\\" + soundFile.name)
        {
            while (fs.existsSync(getUserDataPath() + "/windups/" + soundFile.name.substr(0, soundFile.name.lastIndexOf(".")) + append + soundFile.name.substr(soundFile.name.lastIndexOf("."))))
            {
                var target = fs.readFileSync(getUserDataPath() + "/windups/" + soundFile.name.substr(0, soundFile.name.lastIndexOf(".")) + append + soundFile.name.substr(soundFile.name.lastIndexOf(".")));

                if (target.equals(source))
                    append = append == "" ? 2 : (append + 1);
                else
                    break;
            }
        }
        var filename = soundFile.name.substr(0, soundFile.name.lastIndexOf(".")) + append + soundFile.name.substr(soundFile.name.lastIndexOf("."));

        fs.copyFileSync(soundFile.path, getUserDataPath() + "/windups/" + filename);

        customBonks[customName].windupSounds.unshift({
            "location": "windups/" + filename,
            "volume": 1.0,
            "enabled": true
        });
    }
    setData("customBonks", customBonks);
    openWindupSounds(customName);
    copyFilesToDirectory();

    document.querySelector("#loadWindupSound").value = null;
}

async function openWindupSounds(customName)
{
    // Refresh table to remove old event listeners
    var oldTable = document.querySelector("#windupSoundTable");
    var newTable = oldTable.cloneNode(true);
    oldTable.after(newTable);
    oldTable.remove();

    document.querySelector("#newWindupSound").addEventListener("click", () => { document.querySelector("#loadWindupSound").click(); });
    document.querySelector("#loadWindupSound").addEventListener("change", () => { loadWindupSound(customName) });

    var customBonks = await getData("customBonks");

    var allEnabled = true;
    for (var i = 0; i < customBonks[customName].windupSounds.length; i++)
    {
        if (!customBonks[customName].windupSounds[i].enabled)
        {
            allEnabled = false;
            break;
        }
    }
    document.querySelector("#windupSoundTable").querySelector(".selectAll input").checked = allEnabled;

    document.querySelector("#windupSoundTable").querySelector(".selectAll input").addEventListener("change", async () => {
        var customBonks = await getData("customBonks");
        document.querySelector("#windupSoundTable").querySelectorAll(".imageEnabled").forEach((element) => {
            element.checked = document.querySelector("#windupSoundTable").querySelector(".selectAll input").checked;
        });
        for (var i = 0; i < customBonks[customName].windupSounds.length; i++)
            customBonks[customName].windupSounds[i].enabled = document.querySelector("#windupSoundTable").querySelector(".selectAll input").checked;
        setData("customBonks", customBonks);
    });

    document.querySelector("#windupSoundTable").querySelectorAll(".soundRow").forEach((element) => { element.remove(); });

    customBonks[customName].windupSounds.forEach((_, index) =>
    {
        if (fs.existsSync(getUserDataPath() + "/" + customBonks[customName].windupSounds[index].location))
        {
            var row = document.querySelector("#windupSoundRow").cloneNode(true);
            row.removeAttribute("id");
            row.classList.add("soundRow");
            row.removeAttribute("hidden");
            row.querySelector(".imageLabel").innerText = customBonks[customName].windupSounds[index].location.substr(customBonks[customName].windupSounds[index].location.lastIndexOf('/') + 1);
            document.querySelector("#windupSoundTable").appendChild(row);

            row.querySelector(".imageRemove").addEventListener("click", async () => {
                var customBonks = await getData("customBonks");
                customBonks[customName].windupSounds.splice(index, 1);
                setData("customBonks", customBonks);
                openWindupSounds(customName);
            });

            row.querySelector(".imageEnabled").checked = customBonks[customName].windupSounds[index].enabled;
            row.querySelector(".imageEnabled").addEventListener("change", async () => {
                var customBonks = await getData("customBonks");
                customBonks[customName].windupSounds[index].enabled = row.querySelector(".imageEnabled").checked;
                setData("customBonks", customBonks);

                var allEnabled = true;
                for (var i = 0; i < customBonks[customName].windupSounds.length; i++)
                {
                    if (!customBonks[customName].windupSounds[i].enabled)
                    {
                        allEnabled = false;
                        break;
                    }
                }
                document.querySelector("#windupSoundTable").querySelector(".selectAll input").checked = allEnabled;
            });

            row.querySelector(".soundVolume").value = customBonks[customName].windupSounds[index].volume;
            row.querySelector(".soundVolume").addEventListener("change", async () => {
                var customBonks = await getData("customBonks");
                if (dependencies.clampValue)
                    dependencies.clampValue(row.querySelector(".soundVolume"), 0, 1);
                customBonks[customName].windupSounds[index].volume = parseFloat(row.querySelector(".soundVolume").value);
                setData("customBonks", customBonks);
            });
        }
        else
        {
            customBonks[customName].windupSounds.splice(index, 1);
            setData("customBonks", customBonks);
        }
    });
}

function copyFilesToDirectory()
{
    folders.forEach((folder) => {
        if (!fs.existsSync(__dirname + "/" + folder))
            fs.mkdirSync(__dirname + "/" + folder);

        fs.readdirSync(getUserDataPath() + "/" + folder).forEach(file => {
            fs.copyFileSync(getUserDataPath() + "/" + folder + "/" + file, __dirname + "/" + folder + "/" + file);
        });
    })
}

module.exports = {
    initialize,
    loadImage,
    openImages,
    loadSound,
    openSounds,
    loadImpactDecal,
    openImpactDecals,
    loadWindupSound,
    openWindupSounds,
    copyFilesToDirectory
};

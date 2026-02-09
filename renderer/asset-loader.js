const { ipcRenderer } = require("electron");
const fs = require("fs");
const dataManager = require("./data-manager");

// ============
// Asset Loader
// ============
// Handles loading and management of image and sound assets

const { getData, setData, getUserDataPath } = dataManager;

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

function copyFilesToDirectory()
{
    ipcRenderer.send("copyFilesToDirectory");
}

module.exports = {
    initialize,
    loadImage,
    openImages,
    loadSound,
    openSounds,
    copyFilesToDirectory
};

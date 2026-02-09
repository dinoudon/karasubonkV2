const { ipcRenderer } = require("electron");

// ==================
// Animation Controller
// ==================
// Manages window animations and panel transitions

let assetLoader, eventManager, statusManager;

// Panel state variables
let currentPanel, playing = false;
let panelStack = [];
let currentPanelLarge, playingLarge = false, openPanelLarge = false, cancelCalibrate = false;

function initialize(dependencies = {})
{
    if (dependencies.assetLoader) assetLoader = dependencies.assetLoader;
    if (dependencies.eventManager) eventManager = dependencies.eventManager;
    if (dependencies.statusManager) statusManager = dependencies.statusManager;

    // Set initial panel
    currentPanel = document.querySelector("#bonkImages");
}

function removeAll(panel)
{
    panel.classList.remove("leftIn");
    panel.classList.remove("rightIn");
    panel.classList.remove("upIn");
    panel.classList.remove("downIn");

    panel.classList.remove("leftOut");
    panel.classList.remove("rightOut");
    panel.classList.remove("upOut");
    panel.classList.remove("downOut");
}

function back()
{
    if (!playingLarge && openPanelLarge)
    {
        openPanelLarge = false;

        var anim = Math.floor(Math.random() * 4);
        switch (anim)
        {
            case 0:
                anim = "left";
                break;
            case 1:
                anim = "right";
                break;
            case 2:
                anim = "up";
                break;
            case 3:
                anim = "down";
                break;
        }

        removeAll(document.querySelector("#wideWindow"));
        document.querySelector("#wideWindow").classList.add(anim + "Out");

        if (currentPanelLarge.id == "statusWindow" && (statusManager.getStatus() == 3 || statusManager.getStatus() == 4 || statusManager.getStatus() == 7))
        {
            cancelCalibrate = true;
            ipcRenderer.send("cancelCalibrate");
        }

        playingLarge = true;
        setTimeout(() => {
            currentPanelLarge.classList.add("hidden");
            currentPanelLarge = null;
            playingLarge = false;
            cancelCalibrate = false;
            document.querySelector("#wideWindow").classList.add("hidden");
        }, 500);
    }
    else if (panelStack.length > 0)
        showPanel(panelStack.pop(), false);
}

function showPanel(panel, stack)
{
    if (!playing)
    {
        if (document.querySelector("#" + panel) != currentPanel)
        {
            playing = true;

            var anim = Math.floor(Math.random() * 4);
            switch (anim)
            {
                case 0:
                    anim = "left";
                    break;
                case 1:
                    anim = "right";
                    break;
                case 2:
                    anim = "up";
                    break;
                case 3:
                    anim = "down";
                    break;
            }

            var oldPanel = currentPanel;
            removeAll(oldPanel);
            oldPanel.classList.add(anim + "Out");

            setTimeout(() => {
                oldPanel.classList.add("hidden");
            }, 500);

            if (stack == null)
                panelStack = [];

            if (stack == null || !stack)
            {

                document.querySelector("#sideBar").querySelectorAll(".overlayButton").forEach((element) => { element.classList.remove("buttonSelected"); });

                if (panel == "bonkImages")
                {
                    document.querySelector("#imagesButton").querySelector(".overlayButton").classList.add("buttonSelected");
                    assetLoader.openImages();
                }
                else if (panel == "bonkSounds")
                {
                    document.querySelector("#soundsButton").querySelector(".overlayButton").classList.add("buttonSelected");
                    assetLoader.openSounds();
                    openBitSounds();
                }
                else if (panel == "customBonks")
                {
                    document.querySelector("#customButton").querySelector(".overlayButton").classList.add("buttonSelected");
                    eventManager.openBonks();
                }
                else if (panel == "events")
                {
                    document.querySelector("#eventsButton").querySelector(".overlayButton").classList.add("buttonSelected");
                    eventManager.openEvents();
                }
            }
            else if (stack)
                panelStack.push(oldPanel.id);

            currentPanel = document.querySelector("#" + panel);
            currentPanel.classList.remove("hidden");
            removeAll(currentPanel);
            currentPanel.classList.add(anim + "In");

            setTimeout(() => {
                playing = false;
            }, 500);
        }
    }
}

function showPanelLarge(panel)
{
    if (!playingLarge)
    {
        if (document.querySelector("#" + panel) != currentPanelLarge)
        {
            var anim = Math.floor(Math.random() * 4);
            switch (anim)
            {
                case 0:
                    anim = "left";
                    break;
                case 1:
                    anim = "right";
                    break;
                case 2:
                    anim = "up";
                    break;
                case 3:
                    anim = "down";
                    break;
            }

            if (panel == "testBonks")
                eventManager.openTestBonks();

            var oldPanel = currentPanelLarge;
            currentPanelLarge = document.querySelector("#" + panel);
            removeAll(currentPanelLarge);
            currentPanelLarge.classList.remove("hidden");

            if (!openPanelLarge)
            {
                openPanelLarge = true;
                removeAll(document.querySelector("#wideWindow"));
                document.querySelector("#wideWindow").classList.remove("hidden");
                document.querySelector("#wideWindow").classList.add(anim + "In");
            }
            else
            {
                if (oldPanel != null)
                {
                    if (oldPanel.id == "statusWindow" && (statusManager.getStatus() == 3 || statusManager.getStatus() == 4 || statusManager.getStatus() == 7))
                        ipcRenderer.send("cancelCalibrate");

                    removeAll(oldPanel);
                    oldPanel.classList.add(anim + "Out");
                    setTimeout(() => {
                        oldPanel.classList.add("hidden");
                    }, 500);
                }

                currentPanelLarge.classList.add(anim + "In");
            }

            playingLarge = true;
            setTimeout(() => {
                playingLarge = false;
            }, 500);
        }
        else
            back();
    }
}

function showTab(show, hide, select, deselect)
{
    if (show == "soundTable")
        assetLoader.openSounds();
    else if (show == "bitSoundTable")
        openBitSounds();

    for (var i = 0; i < hide.length; i++)
        document.querySelector("#" + hide[i]).classList.add("hidden");

    document.querySelector("#" + show).classList.remove("hidden");

    for (var i = 0; i < deselect.length; i++)
        document.querySelector("#" + deselect[i]).classList.remove("selectedTab");

    document.querySelector("#" + select).classList.add("selectedTab");
}

// Helper function reference - this will be passed from renderer.js
let openBitSounds;

function setOpenBitSounds(fn)
{
    openBitSounds = fn;
}

function getCancelCalibrate()
{
    return cancelCalibrate;
}

module.exports = {
    initialize,
    removeAll,
    showPanel,
    showPanelLarge,
    back,
    showTab,
    setOpenBitSounds,
    getCancelCalibrate
};

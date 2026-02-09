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

/**
 * @description Initializes the animation controller with dependencies and sets the initial panel
 * @param {Object} dependencies - Dependencies object containing assetLoader, eventManager, and statusManager
 */
function initialize(dependencies = {})
{
    if (dependencies.assetLoader) assetLoader = dependencies.assetLoader;
    if (dependencies.eventManager) eventManager = dependencies.eventManager;
    if (dependencies.statusManager) statusManager = dependencies.statusManager;

    // Set initial panel
    currentPanel = document.querySelector("#bonkImages");
}

/**
 * @description Removes all animation classes from a panel element
 * @param {HTMLElement} panel - The panel element to clean
 */
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

/**
 * @description Navigates back to the previous panel or closes the large panel
 */
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

/**
 * @description Shows a panel with animation and manages panel navigation history
 * @param {string} panel - The ID of the panel to show
 * @param {boolean} stack - Whether to add the current panel to the navigation stack
 */
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

/**
 * @description Shows a large overlay panel with animation
 * @param {string} panel - The ID of the large panel to show
 */
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

/**
 * @description Switches between tabs by showing/hiding panels and updating selection states
 * @param {string} show - The ID of the panel to show
 * @param {Array<string>} hide - Array of panel IDs to hide
 * @param {string} select - The ID of the tab to select
 * @param {Array<string>} deselect - Array of tab IDs to deselect
 */
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

/**
 * @description Sets the openBitSounds function reference from renderer.js
 * @param {Function} fn - The openBitSounds function to store
 */
function setOpenBitSounds(fn)
{
    openBitSounds = fn;
}

/**
 * @description Gets the current calibration cancellation state
 * @returns {boolean} True if calibration was cancelled, false otherwise
 */
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

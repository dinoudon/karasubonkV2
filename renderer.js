const dataManager = require("./renderer/data-manager");
const statusManager = require("./renderer/status-manager");
const assetLoader = require("./renderer/asset-loader");
const eventManager = require("./renderer/event-manager");
const animationController = require("./renderer/animation-controller");
const uiController = require("./renderer/ui-controller");
const startupHandler = require("./renderer/startup-handler");

// ============================
// Renderer Process Orchestrator
// ============================
// Initializes and coordinates all renderer modules

// Initialize data manager
dataManager.initialize();

// Initialize status manager
statusManager.initialize();

// Initialize UI controller first (no dependencies on other controllers)
uiController.initialize({
    dataManager: dataManager,
    assetLoader: assetLoader,
    eventManager: eventManager,
    animationController: animationController
});

// Initialize asset loader with UI and animation controllers
assetLoader.initialize({
    uiController: uiController,
    animationController: animationController
});

// Initialize event manager with controllers
eventManager.initialize({
    getData: dataManager.getData,
    setData: dataManager.setData,
    animationController: animationController,
    uiController: uiController,
    assetLoader: assetLoader
});

// Initialize animation controller
animationController.initialize({
    assetLoader: assetLoader,
    eventManager: eventManager,
    statusManager: statusManager
});

// Initialize startup handler
startupHandler.initialize({
    dataManager: dataManager,
    uiController: uiController,
    assetLoader: assetLoader,
    animationController: animationController
});

// Run startup sequence when window loads
window.onload = async function() {
    await startupHandler.runStartup();
};

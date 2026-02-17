# Renderer Module Structure

This directory contains the modularized renderer process code for the KarasubonkV2 Electron application. The original 2,680-line `renderer.js` file has been split into focused, maintainable modules with clear responsibilities.

## Architecture Overview

The renderer process follows a **dependency injection pattern** where modules are initialized with their dependencies, enabling loose coupling and better testability. The main `renderer.js` file serves as a lightweight orchestrator (~61 lines) that initializes and coordinates all modules.

### Module Initialization Flow

```
1. dataManager.initialize()
2. statusManager.initialize()
3. uiController.initialize({ dataManager, assetLoader, eventManager, animationController })
4. assetLoader.initialize({ uiController, animationController })
5. eventManager.initialize({ getData, setData, animationController, uiController, assetLoader })
6. animationController.initialize({ assetLoader, eventManager, statusManager })
7. startupHandler.initialize({ dataManager, uiController, assetLoader, animationController })
8. startupHandler.runStartup()
```

## Modules

### 1. data-manager.js (~88 lines)
**Responsibility:** Handles all data persistence and retrieval operations.

**Key Exports:**
- `initialize()` - Sets up IPC listeners for user data path
- `getData(field)` - Retrieves data from persistent storage
- `setData(field, value)` - Writes data to persistent storage
- `getUserDataPath()` - Returns the user data directory path

**Dependencies:** None (foundational module)

**Notes:**
- Manages the `isWriting` counter to prevent race conditions during concurrent reads/writes
- Handles port configuration for Browser Source communication
- All file I/O is centralized here

---

### 2. status-manager.js (~129 lines)
**Responsibility:** Manages application status states and UI status updates.

**Key Exports:**
- `initialize()` - Sets up IPC listeners for status changes
- `setStatus(_, statusCode)` - Updates the application status and UI
- `getStatus()` - Returns the current status code
- `statusTitle` - Array of status title strings
- `statusDesc` - Array of status description strings

**Dependencies:**
- `dataManager` (for getting port numbers)

**Status Codes:**
- `0` - Ready
- `1` - Awaiting Authentication
- `2` - Connecting to Browser Source
- `3-4` - Calibration steps
- `5` - Connecting to VTube Studio
- `6` - Listening for Redeem
- `7` - Calibration mode
- `8` - Activating Event Listeners
- `9` - Error: Port In Use
- `10-11` - Warning: Version Mismatch
- `12` - Authenticating

---

### 3. asset-loader.js (~595 lines)
**Responsibility:** Handles loading and management of all image and sound assets.

**Key Exports:**
- `initialize(deps)` - Sets up dependencies (uiController, animationController)
- `loadImage()` - Loads throw images from file input
- `openImages()` - Displays the image library UI
- `loadSound()` - Loads sound files
- `openSounds()` - Displays the sound library UI
- `loadImpactDecal()` - Loads impact decal images
- `openImpactDecals()` - Displays impact decal library
- `loadWindupSound()` - Loads windup sound files
- `openWindupSounds()` - Displays windup sound library
- `copyFilesToDirectory()` - Copies asset files to application directory

**Dependencies:**
- `dataManager` (for getData/setData)
- `uiController` (injected for UI operations)
- `animationController` (injected for panel management)

**Asset Types:**
- **Throws** - Objects thrown at the VTuber model
- **Sounds** - Audio files for throw sounds
- **Impact Decals** - Visual effects on impact
- **Windup Sounds** - Pre-throw audio cues

---

### 4. event-manager.js (~704 lines)
**Responsibility:** Manages events, bonks, and IPC communication with the main process.

**Key Exports:**
- `initialize(deps)` - Sets up IPC listeners and dependencies
- `newRedeem()` - Creates a new channel point redeem event
- `newCommand()` - Creates a new chat command event
- `getRedeemData()` - Fetches redeem data from Twitch API
- `cancelGetRedeemData()` - Cancels ongoing redeem data fetch
- `addBonk(bonkType)` - Creates a new bonk configuration
- `bonkDetails(bonk, bonkName, bonkType)` - Opens bonk detail UI
- `openBonks(bonkType)` - Displays bonk library for a specific type
- `openTestBonks()` - Opens test bonk interface
- `testCustomBonk(customBonk)` - Tests a custom bonk configuration
- `openEvents()` - Displays the events management UI

**Dependencies:**
- `dataManager.getData` and `dataManager.setData`
- `animationController` (for panel navigation)
- `uiController` (for UI operations)
- `assetLoader` (for asset management)

**Event Types:**
- **Redeems** - Twitch channel point redemptions
- **Commands** - Chat commands that trigger bonks
- **Bonks** - Configurations for throw events (single, rapid, barrage, homing, custom)

---

### 5. animation-controller.js (~221 lines)
**Responsibility:** Manages window animations and panel transitions.

**Key Exports:**
- `initialize(deps)` - Sets up dependencies and initial panel state
- `removeAll(panel)` - Removes all animation classes from a panel
- `showPanel(panelId, stack)` - Shows a panel with animation
- `showPanelLarge(panelId)` - Shows a large overlay panel
- `back()` - Navigates back to previous panel
- `showTab(tab)` - Switches between tabs in the UI
- `setOpenBitSounds(fn)` - Sets the openBitSounds callback

**Dependencies:**
- `assetLoader` (for refreshing asset lists)
- `eventManager` (for event-related panels)
- `statusManager` (for status-related UI updates)

**Animation Types:**
- Left/Right/Up/Down slide transitions
- Panel stacking for navigation history
- Large overlay panels for status and detailed views

---

### 6. ui-controller.js (~1,206 lines)
**Responsibility:** Handles all UI event listeners, DOM manipulation, and user interactions.

**Key Exports:**
- `initialize(deps)` - Sets up dependencies and event listeners
- `loadAllSettings()` - Loads all application settings into UI
- `differentValue(node, otherNode)` - Ensures two inputs have different values
- `clampValue(node, min, max)` - Clamps input value to bounds
- `loadImageCustom(customName)` - Loads images for custom bonk types
- `openImagesCustom(customName)` - Displays custom image library
- `loadSoundCustom(customName)` - Loads sounds for custom bonk types
- `openSoundsCustom(customName)` - Displays custom sound library
- `loadBitImage()` - Loads Twitch bit threshold images
- `openBitImages()` - Displays bit image library
- `openBitSounds()` - Displays bit sound library
- `loadImageSound(imageIndex)` - Loads sound for a specific image
- `openImageDetails(imageIndex)` - Opens detailed view for an image
- `testItem(type, item)` - Tests an asset (image/sound/bonk)

**Dependencies:**
- `dataManager` (for data operations)
- `assetLoader` (for asset management)
- `eventManager` (for event management)
- `animationController` (for panel navigation)

**UI Sections Managed:**
- Image/Sound library management
- Bit threshold configuration
- Settings panels (Twitch, VTube Studio, Advanced)
- Calibration interface
- Testing and preview functions

---

### 7. startup-handler.js (~222 lines)
**Responsibility:** Handles application startup, data migration, and version management.

**Key Exports:**
- `initialize(deps)` - Sets up dependencies and IPC listeners
- `runStartup()` - Executes the application startup sequence
- `migrateData(getData, setData)` - Migrates data from older versions
- `checkVersion()` - Validates Browser Source version compatibility

**Dependencies:**
- `dataManager` (for data operations)
- `uiController` (for loading settings)
- `assetLoader` (for initial asset loading)
- `animationController` (for UI setup)

**Startup Sequence:**
1. Create user data directory structure
2. Copy default assets if needed
3. Run data migrations for version compatibility
4. Load all settings into UI
5. Open initial asset libraries
6. Copy files to application directory
7. Check version compatibility with Browser Source

---

## Module Statistics

| Module | Lines | Primary Responsibility |
|--------|-------|----------------------|
| data-manager.js | 88 | Data persistence |
| status-manager.js | 129 | Status management |
| asset-loader.js | 595 | Asset loading |
| event-manager.js | 704 | Event/bonk management |
| animation-controller.js | 221 | UI animations |
| ui-controller.js | 1,206 | UI interactions |
| startup-handler.js | 222 | Application startup |
| **Original renderer.js** | **2,680** | **Everything** |
| **New renderer.js** | **61** | **Orchestration** |

**Total Reduction:** 2,680 lines → 61 lines (97.7% reduction in main file)

## Dependency Graph

```
renderer.js (orchestrator)
    │
    ├─→ data-manager (no dependencies)
    │
    ├─→ status-manager
    │       └─→ data-manager
    │
    ├─→ ui-controller
    │       ├─→ data-manager
    │       ├─→ asset-loader
    │       ├─→ event-manager
    │       └─→ animation-controller
    │
    ├─→ asset-loader
    │       ├─→ data-manager
    │       ├─→ ui-controller
    │       └─→ animation-controller
    │
    ├─→ event-manager
    │       ├─→ data-manager (getData, setData)
    │       ├─→ animation-controller
    │       ├─→ ui-controller
    │       └─→ asset-loader
    │
    ├─→ animation-controller
    │       ├─→ asset-loader
    │       ├─→ event-manager
    │       └─→ status-manager
    │
    └─→ startup-handler
            ├─→ data-manager
            ├─→ ui-controller
            ├─→ asset-loader
            └─→ animation-controller
```

## Design Patterns

### Dependency Injection
All modules receive their dependencies through an `initialize(deps)` function rather than using `require()` to import other modules directly. This:
- Prevents circular dependencies
- Makes testing easier (dependencies can be mocked)
- Makes module relationships explicit
- Enables runtime configuration

### Module Exports
All modules follow CommonJS pattern with explicit exports:
```javascript
module.exports = {
    initialize,
    functionA,
    functionB,
    constantC
};
```

### Separation of Concerns
Each module has a single, well-defined responsibility:
- **Data layer** (data-manager) - No UI logic
- **Presentation layer** (ui-controller, animation-controller) - No data logic
- **Business logic** (event-manager, asset-loader) - Coordinates between data and UI
- **Infrastructure** (status-manager, startup-handler) - Application lifecycle

## Benefits of Modularization

1. **Maintainability** - Each module is focused and easier to understand
2. **Testability** - Modules can be tested in isolation with mocked dependencies
3. **Reusability** - Functions are organized by domain, making them easier to find and reuse
4. **Collaboration** - Multiple developers can work on different modules without conflicts
5. **Performance** - Easier to identify and optimize performance bottlenecks
6. **Documentation** - JSDoc comments are now organized by module responsibility

## Future Improvements

- Add unit tests for each module
- Extract common utilities into a separate utils module
- Consider using TypeScript for better type safety
- Add error boundaries and centralized error handling
- Implement a pub/sub pattern for cross-module communication
- Add module-level logging for debugging

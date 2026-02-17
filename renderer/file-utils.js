const fs = require("fs");

// ==========
// File Utils
// ==========
// Shared utilities for file loading operations

/**
 * @description Resolves filename conflicts when loading a file into a target directory.
 * Ensures unique filenames by comparing file contents.
 * If files have the same contents, allows the overwrite.
 * If files have different contents, adds an incrementing number to the filename.
 * @param {string} sourcePath - Full path to the source file
 * @param {string} targetDir - Target directory path (no trailing slash)
 * @param {string} originalFilename - The original filename
 * @returns {string} Resolved filename (may have numeric suffix appended)
 */
function loadFileWithConflictResolution(sourcePath, targetDir, originalFilename) {
    var source = fs.readFileSync(sourcePath);
    var baseFilename = originalFilename.substr(0, originalFilename.lastIndexOf("."));
    var extension = originalFilename.substr(originalFilename.lastIndexOf("."));

    var append = "";
    if (sourcePath != targetDir + "\\" + originalFilename)
    {
        while (fs.existsSync(targetDir + "/" + baseFilename + append + extension))
        {
            var target = fs.readFileSync(targetDir + "/" + baseFilename + append + extension);

            if (target.equals(source))
                append = append == "" ? 2 : (append + 1);
            else
                break;
        }
    }

    return baseFilename + append + extension;
}

module.exports = { loadFileWithConflictResolution };

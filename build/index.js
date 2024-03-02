"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const config_plugins_1 = require("@expo/config-plugins");
const fs_extra_1 = require("fs-extra");
const path = __importStar(require("path"));
function withCustomAssetsAndroid(config, props) {
    // Specify the source directory of your assets
    const assetSourceDir = props.assetsPath;
    return (0, config_plugins_1.withDangerousMod)(config, [
        "android",
        async (config) => {
            // Get the path to the Android project directory
            const { projectRoot } = config.modRequest;
            // Get the path to the Android resources directory
            const resDir = path.join(projectRoot, "android", "app", "src", "main", "res");
            // Create the 'raw' directory if it doesn't exist
            const rawDir = path.join(resDir, "raw");
            (0, fs_extra_1.ensureDirSync)(rawDir);
            // Get the path to the assets directory
            const assetSourcePath = path.join(projectRoot, assetSourceDir);
            // Retrieve all files in the assets directory
            const assetFiles = await (0, fs_extra_1.readdir)(assetSourcePath);
            // Move each asset file to the resources 'raw' directory
            for (const assetFile of assetFiles) {
                const srcAssetPath = path.join(assetSourcePath, assetFile);
                const destAssetPath = path.join(rawDir, assetFile);
                (0, fs_extra_1.copyFileSync)(srcAssetPath, destAssetPath);
            }
            // Update the Android resources XML file
            const resourcesXmlPath = path.join(resDir, "values", "resources.xml");
            let resourcesXml;
            if ((0, fs_extra_1.existsSync)(resourcesXmlPath)) {
                resourcesXml = await (0, fs_extra_1.readFile)(resourcesXmlPath, "utf-8");
            }
            else {
                resourcesXml = "<resources>\n</resources>";
            }
            const rawResourcesTags = assetFiles.map((assetFile) => `<string name="${assetFile.substring(0, assetFile.lastIndexOf("."))}">${assetFile}</string>`);
            const rawResourcesRegex = /<string name="[^"]+">[^<]+<\/string>/g;
            let match;
            const matches = [];
            while ((match = rawResourcesRegex.exec(resourcesXml)) !== null) {
                matches.push(match[0]);
            }
            // Replace each found tag with the corresponding tag from rawResourcesTags
            for (let i = 0; i < rawResourcesTags.length; i++) {
                if (i < matches.length) {
                    resourcesXml = resourcesXml.replace(matches[i], rawResourcesTags[i]);
                }
                else {
                    // If there are more tags than matches, append them before the </resources> tag
                    const stringResourcesRegex = /<\/resources>/;
                    resourcesXml = resourcesXml.replace(stringResourcesRegex, `${rawResourcesTags[i]}\n    </resources>`);
                }
            }
            await (0, fs_extra_1.writeFile)(resourcesXmlPath, resourcesXml);
            return config;
        },
    ]);
}
function withCustomAssetsIos(config, props) {
    const { assetsPath, assetsDirName } = props;
    return (0, config_plugins_1.withXcodeProject)(config, async (config) => {
        // Get the path to the iOS project directory
        const { projectRoot } = config.modRequest;
        // Get the path to the iOS resources directory
        const iosDir = path.join(projectRoot, "ios");
        // Create the 'assets' directory if it doesn't exist
        const assetsDir = path.join(iosDir, assetsDirName ?? "Assets");
        if ((0, fs_extra_1.existsSync)(assetsDir) === false)
            (0, fs_extra_1.ensureDirSync)(assetsDir);
        // Get the path to the assets directory
        const assetSourceDir = assetsPath;
        const assetSourcePath = path.join(projectRoot, assetSourceDir);
        // Retrieve all files in the assets directory
        const assetFiles = await (0, fs_extra_1.readdir)(assetSourcePath);
        // Load Xcode project
        const project = config.modResults;
        // Create a new group
        const groupName = "Assets";
        // Add files to the new group
        assetFiles.forEach((assetFile) => {
            const assetPath = path.join(assetsPath, assetFile);
            const destAssetPath = path.join(assetsDir, assetFile);
            (0, fs_extra_1.copyFileSync)(assetPath, destAssetPath);
            config_plugins_1.IOSConfig.XcodeUtils.addResourceFileToGroup({
                filepath: destAssetPath,
                groupName,
                project,
                isBuildFile: true,
                verbose: true,
            });
        });
        return config;
    });
}
const withCustomAssets = (config, props) => {
    config = withCustomAssetsIos(config, props);
    config = withCustomAssetsAndroid(config, props);
    return config;
};
exports.default = (0, config_plugins_1.createRunOncePlugin)(withCustomAssets, "expo-custom-assets", "1.2.1");

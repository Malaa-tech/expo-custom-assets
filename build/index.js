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
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const path = __importStar(require("node:path"));
const config_plugins_1 = require("@expo/config-plugins");
const fs_extra_1 = require("fs-extra");
async function processDirectory(sourcePath, destPath, ignoredPattern) {
    const files = await (0, fs_extra_1.readdir)(sourcePath, { withFileTypes: true });
    for (const file of files) {
        if (ignoredPattern && file.name.match(new RegExp(ignoredPattern))) {
            continue;
        }
        const srcPath = path.join(sourcePath, file.name);
        const destFilePath = path.join(destPath, file.name);
        if (file.isDirectory()) {
            (0, fs_extra_1.ensureDirSync)(destFilePath);
            await processDirectory(srcPath, destFilePath, ignoredPattern);
        }
        else {
            (0, fs_extra_1.ensureDirSync)(destPath);
            (0, fs_extra_1.copyFileSync)(srcPath, destFilePath);
        }
    }
}
function withCustomAssetsAndroid(config, props) {
    const { assetsPaths, ignoredPattern, preserveFolder } = props;
    return (0, config_plugins_1.withDangerousMod)(config, [
        "android",
        async (config) => {
            const { projectRoot } = config.modRequest;
            const rawDir = path.join(projectRoot, "android", "app", "src", "main", "res", "raw");
            (0, fs_extra_1.ensureDirSync)(rawDir);
            for (const assetSourceDir of assetsPaths) {
                const assetSourcePath = path.join(projectRoot, assetSourceDir);
                if (preserveFolder) {
                    await processDirectory(assetSourcePath, rawDir, ignoredPattern);
                }
                else {
                    const files = await (0, fs_extra_1.readdir)(assetSourcePath, { withFileTypes: true });
                    for (const file of files) {
                        if (file.isFile() && (!ignoredPattern || !file.name.match(new RegExp(ignoredPattern)))) {
                            const srcPath = path.join(assetSourcePath, file.name);
                            const destPath = path.join(rawDir, file.name);
                            (0, fs_extra_1.copyFileSync)(srcPath, destPath);
                        }
                    }
                }
            }
            return config;
        },
    ]);
}
async function processIosDirectory(sourcePath, destPath, project, groupName, ignoredPattern) {
    const files = await (0, fs_extra_1.readdir)(sourcePath, { withFileTypes: true });
    for (const file of files) {
        if (ignoredPattern && file.name.match(new RegExp(ignoredPattern))) {
            continue;
        }
        const srcPath = path.join(sourcePath, file.name);
        const destFilePath = path.join(destPath, file.name);
        if (file.isDirectory()) {
            (0, fs_extra_1.ensureDirSync)(destFilePath);
            await processIosDirectory(srcPath, destFilePath, project, groupName, ignoredPattern);
        }
        else {
            (0, fs_extra_1.ensureDirSync)(destPath);
            (0, fs_extra_1.copyFileSync)(srcPath, destFilePath);
            config_plugins_1.IOSConfig.XcodeUtils.addResourceFileToGroup({
                filepath: destFilePath,
                groupName,
                project,
                isBuildFile: true,
                verbose: true,
            });
        }
    }
}
function withCustomAssetsIos(config, props) {
    const { assetsPaths, assetsDirName, ignoredPattern, preserveFolder } = props;
    return (0, config_plugins_1.withXcodeProject)(config, async (config) => {
        const { projectRoot } = config.modRequest;
        const iosDir = path.join(projectRoot, "ios");
        const assetsDir = path.join(iosDir, assetsDirName ?? "Assets");
        (0, fs_extra_1.ensureDirSync)(assetsDir);
        const project = config.modResults;
        const groupName = "Assets";
        for (const assetSourceDir of assetsPaths) {
            const assetSourcePath = path.join(projectRoot, assetSourceDir);
            if (preserveFolder) {
                await processIosDirectory(assetSourcePath, assetsDir, project, groupName, ignoredPattern);
            }
            else {
                const files = await (0, fs_extra_1.readdir)(assetSourcePath, { withFileTypes: true });
                for (const file of files) {
                    if (file.isFile() && (!ignoredPattern || !file.name.match(new RegExp(ignoredPattern)))) {
                        const srcPath = path.join(assetSourcePath, file.name);
                        const destPath = path.join(assetsDir, file.name);
                        (0, fs_extra_1.copyFileSync)(srcPath, destPath);
                        config_plugins_1.IOSConfig.XcodeUtils.addResourceFileToGroup({
                            filepath: destPath,
                            groupName,
                            project,
                            isBuildFile: true,
                            verbose: true,
                        });
                    }
                }
            }
        }
        return config;
    });
}
const withCustomAssets = (config, props) => {
    config = withCustomAssetsIos(config, props);
    config = withCustomAssetsAndroid(config, props);
    return config;
};
let pkg = {
    name: "expo-custom-assets",
};
try {
    pkg = require("expo-custom-assets/package.json");
}
catch {
    console.error("Failed to load package.json for expo-custom-assets");
}
exports.default = (0, config_plugins_1.createRunOncePlugin)(withCustomAssets, pkg.name, pkg.version);

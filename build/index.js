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
    return (0, config_plugins_1.withDangerousMod)(config, [
        "android",
        async (config) => {
            const { projectRoot } = config.modRequest;
            const resDir = path.join(projectRoot, "android", "app", "src", "main", "res");
            const rawDir = path.join(resDir, "raw");
            (0, fs_extra_1.ensureDirSync)(rawDir);
            for (const assetSourceDir of props.assetsPaths) {
                const assetSourcePath = path.join(projectRoot, assetSourceDir);
                const assetFiles = await (0, fs_extra_1.readdir)(assetSourcePath);
                for (const assetFile of assetFiles) {
                    const srcAssetPath = path.join(assetSourcePath, assetFile);
                    const destAssetPath = path.join(rawDir, assetFile);
                    (0, fs_extra_1.copyFileSync)(srcAssetPath, destAssetPath);
                }
            }
            // XML 파일 업데이트 로직은 여기에 포함됩니다. 필요에 따라 조정하십시오.
            // 각 assetsPaths에 대해 처리한 후 resources.xml 업데이트
            return config;
        },
    ]);
}
function withCustomAssetsIos(config, props) {
    return (0, config_plugins_1.withXcodeProject)(config, async (config) => {
        const { projectRoot } = config.modRequest;
        const iosDir = path.join(projectRoot, "ios");
        const assetsDir = path.join(iosDir, props.assetsDirName ?? "Assets");
        (0, fs_extra_1.ensureDirSync)(assetsDir);
        for (const assetSourceDir of props.assetsPaths) {
            const assetSourcePath = path.join(projectRoot, assetSourceDir);
            const assetFiles = await (0, fs_extra_1.readdir)(assetSourcePath);
            const project = config.modResults;
            const groupName = "Assets";
            for (const assetFile of assetFiles) {
                const assetPath = path.join(assetSourceDir, assetFile);
                const destAssetPath = path.join(assetsDir, assetFile);
                (0, fs_extra_1.copyFileSync)(assetPath, destAssetPath);
                config_plugins_1.IOSConfig.XcodeUtils.addResourceFileToGroup({
                    filepath: destAssetPath,
                    groupName,
                    project,
                    isBuildFile: true,
                    verbose: true,
                });
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
    // package.json에서 버전을 가져오거나 기본값을 사용
};
// package.json에서 패키지 정보를 가져오려 시도
try {
    pkg = require("expo-custom-assets/package.json");
}
catch {
    // 패키지 정보를 가져오는데 실패할 경우 처리
}
exports.default = (0, config_plugins_1.createRunOncePlugin)(withCustomAssets, pkg.name, pkg.version);

"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var fs_extra_1 = require("fs-extra");
var path = require("path");
var config_plugins_1 = require("@expo/config-plugins");
function withCustomAssetsAndroid(config, props) {
    var _this = this;
    // Specify the source directory of your assets
    var assetSourceDir = props.assetsPath;
    return (0, config_plugins_1.withDangerousMod)(config, [
        "android",
        function (config) { return __awaiter(_this, void 0, void 0, function () {
            var projectRoot, resDir, rawDir, assetSourcePath, assetFiles, _i, assetFiles_1, assetFile, srcAssetPath, destAssetPath, resourcesXmlPath, resourcesXml, rawResourcesTags, rawResourcesRegex, match, matches, i, stringResourcesRegex;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        projectRoot = config.modRequest.projectRoot;
                        resDir = path.join(projectRoot, "android", "app", "src", "main", "res");
                        rawDir = path.join(resDir, "raw");
                        (0, fs_extra_1.ensureDirSync)(rawDir);
                        assetSourcePath = path.join(projectRoot, assetSourceDir);
                        return [4 /*yield*/, (0, fs_extra_1.readdir)(assetSourcePath)];
                    case 1:
                        assetFiles = _a.sent();
                        // Move each asset file to the resources 'raw' directory
                        for (_i = 0, assetFiles_1 = assetFiles; _i < assetFiles_1.length; _i++) {
                            assetFile = assetFiles_1[_i];
                            srcAssetPath = path.join(assetSourcePath, assetFile);
                            destAssetPath = path.join(rawDir, assetFile);
                            (0, fs_extra_1.copyFileSync)(srcAssetPath, destAssetPath);
                        }
                        resourcesXmlPath = path.join(resDir, "values", "resources.xml");
                        if (!(0, fs_extra_1.existsSync)(resourcesXmlPath)) return [3 /*break*/, 3];
                        return [4 /*yield*/, (0, fs_extra_1.readFile)(resourcesXmlPath, "utf-8")];
                    case 2:
                        resourcesXml = _a.sent();
                        return [3 /*break*/, 4];
                    case 3:
                        resourcesXml = "<resources>\n</resources>";
                        _a.label = 4;
                    case 4:
                        rawResourcesTags = assetFiles.map(function (assetFile) {
                            return "<string name=\"".concat(assetFile.substring(0, assetFile.lastIndexOf(".")), "\">").concat(assetFile, "</string>");
                        });
                        rawResourcesRegex = /<string name="[^"]+">[^<]+<\/string>/g;
                        matches = [];
                        while ((match = rawResourcesRegex.exec(resourcesXml)) !== null) {
                            matches.push(match[0]);
                        }
                        // Replace each found tag with the corresponding tag from rawResourcesTags
                        for (i = 0; i < rawResourcesTags.length; i++) {
                            if (i < matches.length) {
                                resourcesXml = resourcesXml.replace(matches[i], rawResourcesTags[i]);
                            }
                            else {
                                stringResourcesRegex = /<\/resources>/;
                                resourcesXml = resourcesXml.replace(stringResourcesRegex, "".concat(rawResourcesTags[i], "\n    </resources>"));
                            }
                        }
                        return [4 /*yield*/, (0, fs_extra_1.writeFile)(resourcesXmlPath, resourcesXml)];
                    case 5:
                        _a.sent();
                        return [2 /*return*/, config];
                }
            });
        }); },
    ]);
}
function withCustomAssetsIos(config, props) {
    var _this = this;
    var assetsPath = props.assetsPath;
    return (0, config_plugins_1.withXcodeProject)(config, function (config) { return __awaiter(_this, void 0, void 0, function () {
        var projectRoot, iosDir, assetsDir, assetSourceDir, assetSourcePath, assetFiles, project, groupName;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    projectRoot = config.modRequest.projectRoot;
                    iosDir = path.join(projectRoot, "ios");
                    assetsDir = path.join(iosDir, "Assets");
                    (0, fs_extra_1.ensureDirSync)(assetsDir);
                    assetSourceDir = assetsPath;
                    assetSourcePath = path.join(projectRoot, assetSourceDir);
                    return [4 /*yield*/, (0, fs_extra_1.readdir)(assetSourcePath)];
                case 1:
                    assetFiles = _a.sent();
                    project = config.modResults;
                    groupName = "Assets";
                    // Add files to the new group
                    assetFiles.forEach(function (assetFile) {
                        var assetPath = path.join(assetsPath, assetFile);
                        var destAssetPath = path.join(assetsDir, assetFile);
                        (0, fs_extra_1.copyFileSync)(assetPath, destAssetPath);
                        config_plugins_1.IOSConfig.XcodeUtils.addResourceFileToGroup({
                            filepath: destAssetPath,
                            groupName: groupName,
                            project: project,
                            isBuildFile: true,
                            verbose: true,
                        });
                    });
                    return [2 /*return*/, config];
            }
        });
    }); });
}
var withCustomAssets = function (config, props) {
    config = withCustomAssetsIos(config, props);
    config = withCustomAssetsAndroid(config, props);
    return config;
};
exports.default = (0, config_plugins_1.createRunOncePlugin)(withCustomAssets, "expo-custom-assets", "1.0.0");

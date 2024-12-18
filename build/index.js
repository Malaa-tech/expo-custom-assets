var __createBinding =
	(this && this.__createBinding) ||
	(Object.create
		? (o, m, k, k2) => {
				if (k2 === undefined) k2 = k;
				var desc = Object.getOwnPropertyDescriptor(m, k);
				if (
					!desc ||
					("get" in desc ? !m.__esModule : desc.writable || desc.configurable)
				) {
					desc = { enumerable: true, get: () => m[k] };
				}
				Object.defineProperty(o, k2, desc);
			}
		: (o, m, k, k2) => {
				if (k2 === undefined) k2 = k;
				o[k2] = m[k];
			});
var __setModuleDefault =
	(this && this.__setModuleDefault) ||
	(Object.create
		? (o, v) => {
				Object.defineProperty(o, "default", { enumerable: true, value: v });
			}
		: (o, v) => {
				o["default"] = v;
			});
var __importStar =
	(this && this.__importStar) ||
	(() => {
		var ownKeys = (o) => {
			ownKeys =
				Object.getOwnPropertyNames ||
				((o) => {
					var ar = [];
					for (var k in o)
						if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
					return ar;
				});
			return ownKeys(o);
		};
		return (mod) => {
			if (mod && mod.__esModule) return mod;
			var result = {};
			if (mod != null)
				for (var k = ownKeys(mod), i = 0; i < k.length; i++)
					if (k[i] !== "default") __createBinding(result, mod, k[i]);
			__setModuleDefault(result, mod);
			return result;
		};
	})();
Object.defineProperty(exports, "__esModule", { value: true });
const config_plugins_1 = require("@expo/config-plugins");
const fs_extra_1 = require("fs-extra");
const path = __importStar(require("node:path"));
function withCustomAssetsAndroid(config, props) {
	const { assetsPaths, ignoredPattern } = props;
	return (0, config_plugins_1.withDangerousMod)(config, [
		"android",
		async (config) => {
			const { projectRoot } = config.modRequest;
			const resDir = path.join(
				projectRoot,
				"android",
				"app",
				"src",
				"main",
				"res",
			);
			const rawDir = path.join(resDir, "raw");
			(0, fs_extra_1.ensureDirSync)(rawDir);
			for (const assetSourceDir of assetsPaths) {
				const assetSourcePath = path.join(projectRoot, assetSourceDir);
				const assetFiles = (
					await (0, fs_extra_1.readdir)(assetSourcePath)
				).filter((file) => !file.match(new RegExp(ignoredPattern ?? "")));
				for (const assetFile of assetFiles) {
					const srcAssetPath = path.join(assetSourcePath, assetFile);
					const destAssetPath = path.join(rawDir, assetFile);
					(0, fs_extra_1.copyFileSync)(srcAssetPath, destAssetPath);
				}
			}
			return config;
		},
	]);
}
function withCustomAssetsIos(config, props) {
	const { assetsPaths, assetsDirName, ignoredPattern } = props;
	return (0, config_plugins_1.withXcodeProject)(config, async (config) => {
		const { projectRoot } = config.modRequest;
		const iosDir = path.join(projectRoot, "ios");
		const assetsDir = path.join(iosDir, assetsDirName ?? "Assets");
		(0, fs_extra_1.ensureDirSync)(assetsDir);
		for (const assetSourceDir of assetsPaths) {
			const assetSourcePath = path.join(projectRoot, assetSourceDir);
			// const assetFiles = await readdir(assetSourcePath);
			const assetFiles = (
				await (0, fs_extra_1.readdir)(assetSourcePath)
			).filter((file) => !file.match(new RegExp(ignoredPattern ?? "")));
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
	// biome-ignore lint/style/noParameterAssign: this is the way :p
	config = withCustomAssetsIos(config, props);
	// biome-ignore lint/style/noParameterAssign: this is the way :p
	config = withCustomAssetsAndroid(config, props);
	return config;
};
let pkg = {
	name: "expo-custom-assets",
};
try {
	pkg = require("expo-custom-assets/package.json");
} catch {
	console.error("Failed to load package.json for expo-custom-assets");
}
exports.default = (0, config_plugins_1.createRunOncePlugin)(
	withCustomAssets,
	pkg.name,
	pkg.version,
);

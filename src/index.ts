import * as path from "node:path";
import {
	type ConfigPlugin,
	createRunOncePlugin,
	IOSConfig,
	withDangerousMod,
	withXcodeProject,
} from "@expo/config-plugins";
import type { ExpoConfig } from "@expo/config-types";
import { copyFileSync, ensureDirSync, readdir } from "fs-extra";

function withCustomAssetsAndroid(
	config: ExpoConfig,
	props: { assetsPaths: string[]; ignoredPattern?: string },
) {
	const { assetsPaths, ignoredPattern } = props;
	return withDangerousMod(config, [
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
			ensureDirSync(rawDir);

			for (const assetSourceDir of assetsPaths) {
				const assetSourcePath = path.join(projectRoot, assetSourceDir);
				const assetFiles = (await readdir(assetSourcePath)).filter((file) =>
					ignoredPattern === undefined
						? true
						: !file.match(new RegExp(ignoredPattern)),
				);

				for (const assetFile of assetFiles) {
					const srcAssetPath = path.join(assetSourcePath, assetFile);
					const destAssetPath = path.join(rawDir, assetFile);
					copyFileSync(srcAssetPath, destAssetPath);
				}
			}

			return config;
		},
	]);
}

function withCustomAssetsIos(
	config: ExpoConfig,
	props: {
		assetsPaths: string[];
		assetsDirName?: string;
		ignoredPattern?: string;
	},
) {
	const { assetsPaths, assetsDirName, ignoredPattern } = props;
	return withXcodeProject(config, async (config) => {
		const { projectRoot } = config.modRequest;
		const iosDir = path.join(projectRoot, "ios");
		const assetsDir = path.join(iosDir, assetsDirName ?? "Assets");
		ensureDirSync(assetsDir);

		for (const assetSourceDir of assetsPaths) {
			const assetSourcePath = path.join(projectRoot, assetSourceDir);
			// const assetFiles = await readdir(assetSourcePath);
			const assetFiles = (await readdir(assetSourcePath)).filter((file) =>
				ignoredPattern === undefined
					? true
					: !file.match(new RegExp(ignoredPattern)),
			);

			const project = config.modResults;
			const groupName = "Assets";

			for (const assetFile of assetFiles) {
				const assetPath = path.join(assetSourceDir, assetFile);
				const destAssetPath = path.join(assetsDir, assetFile);
				copyFileSync(assetPath, destAssetPath);
				IOSConfig.XcodeUtils.addResourceFileToGroup({
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

const withCustomAssets: ConfigPlugin<{
	assetsPaths: string[];
	assetsDirName?: string;
	ignoredPattern?: string;
}> = (config, props) => {
	// biome-ignore lint/style/noParameterAssign: this is the way :p
	config = withCustomAssetsIos(config, props);
	// biome-ignore lint/style/noParameterAssign: this is the way :p
	config = withCustomAssetsAndroid(config, props);
	return config;
};

let pkg: { name: string; version?: string } = {
	name: "expo-custom-assets",
};

try {
	pkg = require("expo-custom-assets/package.json");
} catch {
	console.error("Failed to load package.json for expo-custom-assets");
}

export default createRunOncePlugin(withCustomAssets, pkg.name, pkg.version);

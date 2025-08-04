import * as path from "node:path";
import {
	type ConfigPlugin,
	createRunOncePlugin,
	IOSConfig,
	withDangerousMod,
	withXcodeProject,
	type XcodeProject,
} from "@expo/config-plugins";
import type { ExpoConfig } from "@expo/config-types";
import { copyFileSync, ensureDirSync, readdir } from "fs-extra";


function withCustomAssetsAndroid(
	config: ExpoConfig,
	props: { assetsPaths: string[]; ignoredPattern?: string;  },
) {
	const { assetsPaths, ignoredPattern } = props;
	return withDangerousMod(config, [
		"android",
		async (config) => {
			const { projectRoot } = config.modRequest;
			const rawDir = path.join(
				projectRoot,
				"android",
				"app",
				"src",
				"main",
				"res",
				"raw",
			);

			ensureDirSync(rawDir);

			for (const assetSourceDir of assetsPaths) {
				const assetSourcePath = path.join(projectRoot, assetSourceDir);
				
				const files = await readdir(assetSourcePath, { withFileTypes: true });
					for (const file of files) {
						if (file.isFile() && (!ignoredPattern || !file.name.match(new RegExp(ignoredPattern)))) {
							const srcPath = path.join(assetSourcePath, file.name);
							const destPath = path.join(rawDir, file.name);
							copyFileSync(srcPath, destPath);
						}
					}
			}

			return config;
		},
	]);
}

async function processIosDirectory(
	sourcePath: string,
	destPath: string,
	project: XcodeProject,
	groupName: string,
	ignoredPattern?: string,
) {
	const files = await readdir(sourcePath, { withFileTypes: true });

	for (const file of files) {
		if (ignoredPattern && file.name.match(new RegExp(ignoredPattern))) {
			continue;
		}

		const srcPath = path.join(sourcePath, file.name);
		const destFilePath = path.join(destPath, file.name);

		if (file.isDirectory()) {
			ensureDirSync(destFilePath);
			await processIosDirectory(srcPath, destFilePath, project, groupName, ignoredPattern);
		} else {
			ensureDirSync(destPath);
			copyFileSync(srcPath, destFilePath);
			IOSConfig.XcodeUtils.addResourceFileToGroup({
				filepath: destFilePath,
				groupName,
				project,
				isBuildFile: true,
				verbose: true,
			});
		}
	}
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

		const project = config.modResults;
		const groupName = "Assets";

		for (const assetSourceDir of assetsPaths) {
			const assetSourcePath = path.join(projectRoot, assetSourceDir);

		const files = await readdir(assetSourcePath, { withFileTypes: true });
				for (const file of files) {
					if (file.isFile() && (!ignoredPattern || !file.name.match(new RegExp(ignoredPattern)))) {
						const srcPath = path.join(assetSourcePath, file.name);
						const destPath = path.join(assetsDir, file.name);
						copyFileSync(srcPath, destPath);
						IOSConfig.XcodeUtils.addResourceFileToGroup({
							filepath: destPath,
							groupName,
							project,
							isBuildFile: true,
							verbose: true,
						});
					}
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
	config = withCustomAssetsIos(config, props);
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

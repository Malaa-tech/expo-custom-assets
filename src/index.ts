import * as path from "node:path";
import {
	type ConfigPlugin,
	createRunOncePlugin,
	IOSConfig,
	withDangerousMod,
	withXcodeProject,
} from "@expo/config-plugins";
import type { ExpoConfig } from "@expo/config-types";
import { copy, copyFileSync, ensureDirSync, readdir } from "fs-extra";


function withCustomAssetsAndroid(
	config: ExpoConfig,
	props: { assetsPaths: string[];assetsDirName?: string; ignoredPattern?: string; preserveFolder?: boolean },
) {
	const { assetsPaths, assetsDirName, ignoredPattern, preserveFolder } = props;
	return withDangerousMod(config, [
		"android",
		async (config) => {
			const { projectRoot } = config.modRequest;
			const customDirName = assetsDirName ?? "assets";
			if (preserveFolder) {
				const assetsDir = path.join(
					projectRoot,
					"android",
					"app",
					"src",
					"main",
					`${customDirName}`,
				);
				ensureDirSync(assetsDir);

				for (const assetSourceDir of assetsPaths) {
					const assetSourcePath = path.join(projectRoot, assetSourceDir);
					await copy(assetSourcePath, path.join(assetsDir, path.basename(assetSourceDir)));
				}
			} else {
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
		preserveFolder?: boolean;
	},
) {
	const { assetsPaths, assetsDirName, ignoredPattern, preserveFolder } = props;
	return withXcodeProject(config, async (config) => {
		const { projectRoot, platformProjectRoot } = config.modRequest;
		const project = config.modResults;
		const groupName = assetsDirName ?? "Assets";

		IOSConfig.XcodeUtils.ensureGroupRecursively(project, groupName);
		const assetsDir = path.join(platformProjectRoot, groupName);
		ensureDirSync(assetsDir);

		for (const assetSourceDir of assetsPaths) {
			const assetSourcePath = path.join(projectRoot, assetSourceDir);

			if (preserveFolder) {
				const destDir = path.join(assetsDir, path.basename(assetSourceDir));
				await copy(assetSourcePath, destDir);
			} else {
				const files = await readdir(assetSourcePath, { withFileTypes: true });
				for (const file of files) {
					if (file.isFile() && (!ignoredPattern || !file.name.match(new RegExp(ignoredPattern)))) {
						const srcPath = path.join(assetSourcePath, file.name);
						const destPath = path.join(assetsDir, file.name);
						copyFileSync(srcPath, destPath);
					}
				}
			}
		}

		// Add the assets to the Xcode project
		const files = await readdir(assetsDir, { withFileTypes: true });
		for (const file of files) {
			IOSConfig.XcodeUtils.addResourceFileToGroup({
				filepath: path.join(groupName, file.name),
				groupName,
				project,
				isBuildFile: true,
				verbose: true,
			});
		}

		return config;
	});
}

const withCustomAssets: ConfigPlugin<{
	assetsPaths: string[];
	assetsDirName?: string;
	ignoredPattern?: string;
	preserveFolder?: boolean;
}> = (config, props) => {
	config = withCustomAssetsAndroid(config, props);
	config = withCustomAssetsIos(config, props);
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

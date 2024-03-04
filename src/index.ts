import {
  ConfigPlugin,
  IOSConfig,
  createRunOncePlugin,
  withDangerousMod,
  withXcodeProject,
} from "@expo/config-plugins";
import { ExpoConfig } from "@expo/config-types";
import { copyFileSync, ensureDirSync, readdir } from "fs-extra";
import * as path from "path";

function withCustomAssetsAndroid(
  config: ExpoConfig,
  props: { assetsPaths: string[] }
) {
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
        "res"
      );
      const rawDir = path.join(resDir, "raw");
      ensureDirSync(rawDir);

      for (const assetSourceDir of props.assetsPaths) {
        const assetSourcePath = path.join(projectRoot, assetSourceDir);
        const assetFiles = await readdir(assetSourcePath);

        for (const assetFile of assetFiles) {
          const srcAssetPath = path.join(assetSourcePath, assetFile);
          const destAssetPath = path.join(rawDir, assetFile);
          copyFileSync(srcAssetPath, destAssetPath);
        }
      }

      // XML 파일 업데이트 로직은 여기에 포함됩니다. 필요에 따라 조정하십시오.
      // 각 assetsPaths에 대해 처리한 후 resources.xml 업데이트
      return config;
    },
  ]);
}

function withCustomAssetsIos(
  config: ExpoConfig,
  props: { assetsPaths: string[]; assetsDirName?: string }
) {
  return withXcodeProject(config, async (config) => {
    const { projectRoot } = config.modRequest;
    const iosDir = path.join(projectRoot, "ios");
    const assetsDir = path.join(iosDir, props.assetsDirName ?? "Assets");
    ensureDirSync(assetsDir);

    for (const assetSourceDir of props.assetsPaths) {
      const assetSourcePath = path.join(projectRoot, assetSourceDir);
      const assetFiles = await readdir(assetSourcePath);

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

const withCustomAssets: ConfigPlugin<{ assetsPaths: string[] }> = (
  config,
  props
) => {
  config = withCustomAssetsIos(config, props);
  config = withCustomAssetsAndroid(config, props);
  return config;
};

let pkg: { name: string; version?: string } = {
  name: "expo-custom-assets",
  // package.json에서 버전을 가져오거나 기본값을 사용
};
// package.json에서 패키지 정보를 가져오려 시도
try {
  pkg = require("expo-custom-assets/package.json");
} catch {
  // 패키지 정보를 가져오는데 실패할 경우 처리
}

export default createRunOncePlugin(withCustomAssets, pkg.name, pkg.version);

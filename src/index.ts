import {
  ensureDirSync,
  readdir,
  copyFileSync,
  existsSync,
  readFile,
  writeFile,
} from "fs-extra";
import * as path from "path";
import {
  ConfigPlugin,
  withDangerousMod,
  withXcodeProject,
  IOSConfig,
  createRunOncePlugin,
} from "@expo/config-plugins";
import { ExpoConfig } from "@expo/config-types";
function withCustomAssetsAndroid(
  config: ExpoConfig,
  props: { assetsPath: string }
) {
  // Specify the source directory of your assets
  const assetSourceDir = props.assetsPath;

  return withDangerousMod(config, [
    "android",
    async (config) => {
      // Get the path to the Android project directory
      const { projectRoot } = config.modRequest;

      // Get the path to the Android resources directory
      const resDir = path.join(
        projectRoot,
        "android",
        "app",
        "src",
        "main",
        "res"
      );

      // Create the 'raw' directory if it doesn't exist
      const rawDir = path.join(resDir, "raw");
      ensureDirSync(rawDir);

      // Get the path to the assets directory
      const assetSourcePath = path.join(projectRoot, assetSourceDir);

      // Retrieve all files in the assets directory
      const assetFiles = await readdir(assetSourcePath);
      // Move each asset file to the resources 'raw' directory
      for (const assetFile of assetFiles) {
        const srcAssetPath = path.join(assetSourcePath, assetFile);
        const destAssetPath = path.join(rawDir, assetFile);
        copyFileSync(srcAssetPath, destAssetPath);
      }

      // Update the Android resources XML file
      const resourcesXmlPath = path.join(resDir, "values", "resources.xml");

      let resourcesXml;
      if (existsSync(resourcesXmlPath)) {
        resourcesXml = await readFile(resourcesXmlPath, "utf-8");
      } else {
        resourcesXml = "<resources>\n</resources>";
      }

      const rawResourcesTags = assetFiles.map(
        (assetFile) =>
          `<string name="${assetFile.substring(
            0,
            assetFile.lastIndexOf(".")
          )}">${assetFile}</string>`
      );
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
        } else {
          // If there are more tags than matches, append them before the </resources> tag
          const stringResourcesRegex = /<\/resources>/;
          resourcesXml = resourcesXml.replace(
            stringResourcesRegex,
            `${rawResourcesTags[i]}\n    </resources>`
          );
        }
      }

      await writeFile(resourcesXmlPath, resourcesXml);
      return config;
    },
  ]);
}
function withCustomAssetsIos(
  config: ExpoConfig,
  props: { assetsPath: string }
) {
  const { assetsPath } = props;

  return withXcodeProject(config, async (config) => {
    // Get the path to the iOS project directory
    const { projectRoot } = config.modRequest;
    // Get the path to the iOS resources directory
    const iosDir = path.join(projectRoot, "ios");
    // Create the 'assets' directory if it doesn't exist
    const assetsDir = path.join(iosDir, "Assets");
    ensureDirSync(assetsDir);
    // Get the path to the assets directory
    const assetSourceDir = assetsPath;
    const assetSourcePath = path.join(projectRoot, assetSourceDir);
    // Retrieve all files in the assets directory
    const assetFiles = await readdir(assetSourcePath);

    // Load Xcode project
    const project = config.modResults;

    // Create a new group
    const groupName = "Assets";

    // Add files to the new group
    assetFiles.forEach((assetFile) => {
      const assetPath = path.join(assetsPath, assetFile);
      const destAssetPath = path.join(assetsDir, assetFile);
      copyFileSync(assetPath, destAssetPath);
      IOSConfig.XcodeUtils.addResourceFileToGroup({
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
const withCustomAssets: ConfigPlugin<{ assetsPath: string }> = (
  config,
  props
) => {
  config = withCustomAssetsIos(config, props);
  config = withCustomAssetsAndroid(config, props);
  return config;
};

export default createRunOncePlugin(
  withCustomAssets,
  "expo-custom-assets",
  "1.0.0"
);

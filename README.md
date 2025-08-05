# expo-custom-assets

Expo plugin to add custom assets to xcode and android studio to allow the usage of it as local files for projects like [Rive](https://help.rive.app/runtimes/overview/react-native/adding-rive-to-expo)

# Demo

<https://github.com/Malaa-tech/expo-custom-assets/assets/43112535/2a6de948-d3e9-4362-925f-3a3c786016b1>

# API documentation

- This plugin requires assets path only nothing more

### Add the package to your npm dependencies

```
npm install expo-custom-assets
yarn add expo-custom-assets
pnpm install expo-custom-assets
bun install expo-custom-assets
```

# Installation in managed Expo projects

For [managed](https://docs.expo.dev/archive/managed-vs-bare/) Expo projects

- After installing the package through npm add the plugin to your app.json

```json
    "plugins": [
      [
        "expo-custom-assets",
        {
          // Add asset directory paths, the plugin copies the files in the given paths to the app bundle folder named Assets
          "assetsPaths": ["./path-to-your-asset-folder"]
          // if you want custom assets directory name use this prop (default: "Assets")
          // "assetsDirName": "testName"
          // if you want to ignore some files use this prop (default: "")
          // "ignoredPattern": ".png$"
          // if you want to preserve the folder structure use this prop (default: false)
          // "preserveFolder": true
        }
      ]
    ]
```

# Installation in bare React Native projects

For bare React Native projects, you must ensure that you have [installed and configured the `expo` package](https://docs.expo.dev/bare/installing-expo-modules/) before continuing.

# Contributing

Contributions are very welcome! we have some things to do in our [Todo's](#Todo's)

# Todo's

- [x] Stop creating Assets folder in it exist
- [x] Allow for custom asset folder name
- [x] Fix typescript error when building the package
- [ ] Add more example for other custom assets other than Rive

# Credits

- For the android part I almost used the plugin from [MortadhaFadhlaoui](https://github.com/MortadhaFadhlaoui) at <https://github.com/MortadhaFadhlaoui/rive-react-native-android-blank> with small modifications
- For ios part I really benefited from <https://github.com/outsung/expo-dynamic-app-icon>
- ChatGpt for the great help with making the script work as I wanted

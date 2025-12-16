import 'dotenv/config';

export default {
  expo: {
    name: "my-app",
    slug: "my-app",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    assetBundlePatterns: [
      "**/*"
    ],
    plugins: [
      [
        "expo-camera",
        {
          "cameraPermission": "Yiyeceklerin kalorisini hesaplamak için kameraya izin verin."
        }
      ]
    ],
    ios: {
      "supportsTablet": true
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#ffffff"
      },
      permissions: [
        "android.permission.CAMERA",
        "android.permission.RECORD_AUDIO"
      ],
      package: "com.ahmet.diyetapp"
    },
    web: {
      favicon: "./assets/favicon.png"
    },
    extra: {
      eas: {
        projectId: "4f25b9fd-547a-433c-b1cd-05f65a21a846"
      },
      geminiApiKey: process.env.GEMINI_API_KEY,
    }
  }
};

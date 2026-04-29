import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.kindrail.companion",
  appName: "KINDRAIL",
  webDir: "../companion-web/dist",
  bundledWebRuntime: false,
  server: {
    androidScheme: "https"
  }
};

export default config;


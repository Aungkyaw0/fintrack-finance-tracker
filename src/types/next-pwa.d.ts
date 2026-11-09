declare module "next-pwa" {
  import type { NextConfig } from "next";
  interface PWAConfig {
    dest?: string;
    register?: boolean;
    skipWaiting?: boolean;
    disable?: boolean;
    runtimeCaching?: object[];
    [key: string]: unknown;
  }
  function withPWA(config: PWAConfig): (nextConfig: NextConfig) => NextConfig;
  export = withPWA;
}


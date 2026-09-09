import { defineCloudflareConfig } from "@opennextjs/cloudflare";

const config = {
  ...defineCloudflareConfig({}),
  buildCommand: "export NODE_OPTIONS=\"--max-old-space-size=4096 ${NODE_OPTIONS:-}\" && next build",
};

export default config;

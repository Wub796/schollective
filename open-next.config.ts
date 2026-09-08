import { defineCloudflareConfig } from "@opennextjs/cloudflare";

export default {
  ...defineCloudflareConfig({}),
  buildCommand: "export NODE_OPTIONS=\"--max-old-space-size=4096 ${NODE_OPTIONS:-}\" && next build",
};

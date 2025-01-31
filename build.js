import { build } from "@observablehq/framework";

await build({
  source: "src",
  output: "dist",
  include: ["app.js"]  // Explicitly include app.js
}); 
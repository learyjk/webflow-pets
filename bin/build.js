import * as esbuild from "esbuild";

const ctx = await esbuild.context({
  entryPoints: [
    "src/scripts/content.ts",
    "src/test/index.ts",
    "src/scripts/popup.ts",
  ],
  bundle: true,
  outdir: "dist",
  sourcemap: true,
});

await ctx.watch();
await ctx.serve({
  port: 3000,
  servedir: "dist",
});

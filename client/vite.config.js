import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { existsSync } from "node:fs";

const stylesModulePlugin = () => ({
  name: "styles-scss-modules",
  enforce: "pre",
  async resolveId(source, importer, options) {
    if (!source.endsWith(".styles.scss")) {
      return null;
    }

    const importerDir = importer ? path.dirname(importer) : process.cwd();
    const resolvedPath = path.resolve(importerDir, source);
    const modulePath = resolvedPath.replace(/\.styles\.scss$/, ".styles.module.scss");

    if (!existsSync(modulePath)) {
      return null;
    }

    const relativeModulePath = path
      .relative(importerDir, modulePath)
      .replace(/\\/g, "/");
    const normalizedModulePath = relativeModulePath.startsWith(".")
      ? relativeModulePath
      : `./${relativeModulePath}`;

    const result = await this.resolve(normalizedModulePath, importer, {
      ...(options || {}),
      skipSelf: true
    });

    return result || null;
  }
});

export default defineConfig({
  plugins: [react(), stylesModulePlugin()],
  server: {
    port: 5173
  },
  css: {
    modules: {
      scopeBehaviour: "local",
      localsConvention: "camelCase"
    }
  }
});

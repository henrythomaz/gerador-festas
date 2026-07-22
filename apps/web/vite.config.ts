// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite"; // <-- importe
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(), // <-- adicione antes do tsconfigPaths
    tsconfigPaths(),
  ],
  build: {
    outDir: "dist",
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (id.includes("react") || id.includes("react-dom")) return "react";
            if (id.includes("@tanstack")) return "tanstack";
            if (
              [
                "@radix-ui/react-dialog",
                "@radix-ui/react-dropdown-menu",
                "@radix-ui/react-select",
                "@radix-ui/react-tabs",
              ].some((pkg) => id.includes(pkg))
            )
              return "radix";
            if (["lucide-react", "sonner", "cmdk", "vaul"].some((pkg) => id.includes(pkg)))
              return "ui";
            return "vendor";
          }
        },
      },
    },
  },
});

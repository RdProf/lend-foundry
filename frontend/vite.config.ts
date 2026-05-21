import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import fs from "node:fs";
import path from "node:path";

export default defineConfig({
    plugins: [
        tailwindcss(),
        {
            name: "csv-upload-plugin",
            configureServer(server) {
                server.middlewares.use((req, res, next) => {
                    if (req.url === "/api/upload-csv" && req.method === "POST") {
                        let body = "";
                        req.on("data", (chunk) => {
                            body += chunk.toString();
                        });
                        req.on("end", () => {
                            const publicDir = path.resolve(__dirname, "public");
                            if (!fs.existsSync(publicDir)) {
                                fs.mkdirSync(publicDir, { recursive: true });
                            }
                            fs.writeFileSync(path.join(publicDir, "data.csv"), body);
                            res.statusCode = 200;
                            res.setHeader("Content-Type", "text/plain");
                            res.end("OK");
                        });
                    } else {
                        next();
                    }
                });
            },
            configurePreviewServer(server) {
                server.middlewares.use((req, res, next) => {
                    if (req.url === "/api/upload-csv" && req.method === "POST") {
                        let body = "";
                        req.on("data", (chunk) => {
                            body += chunk.toString();
                        });
                        req.on("end", () => {
                            const publicDir = path.resolve(__dirname, "public");
                            if (!fs.existsSync(publicDir)) {
                                fs.mkdirSync(publicDir, { recursive: true });
                            }
                            fs.writeFileSync(path.join(publicDir, "data.csv"), body);
                            
                            const distDir = path.resolve(__dirname, "dist");
                            if (fs.existsSync(distDir)) {
                                fs.writeFileSync(path.join(distDir, "data.csv"), body);
                            }
                            
                            res.statusCode = 200;
                            res.setHeader("Content-Type", "text/plain");
                            res.end("OK");
                        });
                    } else {
                        next();
                    }
                });
            },
        },
    ],
});

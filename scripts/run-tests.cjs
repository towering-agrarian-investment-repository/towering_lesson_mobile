#!/usr/bin/env node
// Runs every Node test file in one process-less spawn per file so a failure in
// one suite cannot hide another. `node --test <directory>` is not portable
// across the Node versions this project supports, so the file list is built
// here instead of relying on shell globbing.
const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const files = [
    path.join(root, "scripts", "startup-compat.test.cjs"),
    ...fs
        .readdirSync(path.join(root, "scripts", "tests"))
        .filter((name) => name.endsWith(".test.cjs"))
        .sort()
        .map((name) => path.join(root, "scripts", "tests", name)),
];

const result = spawnSync(process.execPath, ["--test", ...files], {
    cwd: root,
    stdio: "inherit",
});

if (result.error) {
    console.error(result.error);
    process.exit(1);
}

process.exit(result.status ?? 1);

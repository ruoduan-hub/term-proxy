#!/usr/bin/env node

import process from "node:process";
import inquirer from "inquirer";

import { isValidSemver, updateProjectVersions } from "./version-utils.mjs";

async function main() {
  const inputVersion = process.argv.slice(2).find((argument) => argument !== "--");
  const version =
    inputVersion ??
    (
      await inquirer.prompt([
        {
          type: "input",
          name: "version",
          message: "请输入新版本号 (x.y.z):",
          validate(value) {
            return isValidSemver(value) || "版本号必须是 x.y.z 格式，例如 1.2.3";
          },
        },
      ])
    ).version;

  if (!isValidSemver(version)) {
    throw new Error("版本号必须是 x.y.z 格式，例如 1.2.3");
  }

  const normalizedVersion = version.trim();
  const updatedFiles = await updateProjectVersions({
    rootDir: process.cwd(),
    version: normalizedVersion,
  });

  console.log(`已更新版本号为 ${normalizedVersion}:`);
  for (const file of updatedFiles) {
    console.log(`- ${file}`);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});

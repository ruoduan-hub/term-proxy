import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

const VERSION_PATTERN = /^\d+\.\d+\.\d+$/;

export function isValidSemver(version) {
  return VERSION_PATTERN.test(version.trim());
}

async function updateJsonVersion(filePath, version) {
  const data = JSON.parse(await readFile(filePath, "utf8"));
  data.version = version;
  await writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`);
}

async function updateCargoTomlVersion(filePath, version) {
  const content = await readFile(filePath, "utf8");
  const packageVersionPattern = /(\[package\][\s\S]*?\nversion = )"[^"]+"/;

  if (!packageVersionPattern.test(content)) {
    throw new Error(`未找到 Cargo.toml 的 [package] version 字段: ${filePath}`);
  }

  const updatedContent = content.replace(packageVersionPattern, `$1"${version}"`);
  await writeFile(filePath, updatedContent);
}

async function updateCargoLockVersion(filePath, version) {
  const content = await readFile(filePath, "utf8");
  const packageBlockPattern =
    /(\[\[package\]\]\nname = "term-proxy"\nversion = )"[^"]+"/;

  if (!packageBlockPattern.test(content)) {
    throw new Error(`未找到 Cargo.lock 中 term-proxy 的 version 字段: ${filePath}`);
  }

  const updatedContent = content.replace(packageBlockPattern, `$1"${version}"`);
  await writeFile(filePath, updatedContent);
}

export async function updateProjectVersions({ rootDir, version }) {
  const normalizedVersion = version.trim();

  if (!isValidSemver(normalizedVersion)) {
    throw new Error("版本号必须是 x.y.z 格式，例如 1.2.3");
  }

  const files = [
    "package.json",
    "src-tauri/Cargo.toml",
    "src-tauri/tauri.conf.json",
    "src-tauri/Cargo.lock",
  ];

  await updateJsonVersion(join(rootDir, "package.json"), normalizedVersion);
  await updateCargoTomlVersion(
    join(rootDir, "src-tauri", "Cargo.toml"),
    normalizedVersion,
  );
  await updateJsonVersion(
    join(rootDir, "src-tauri", "tauri.conf.json"),
    normalizedVersion,
  );
  await updateCargoLockVersion(
    join(rootDir, "src-tauri", "Cargo.lock"),
    normalizedVersion,
  );

  return files;
}

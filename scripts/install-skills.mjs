#!/usr/bin/env node

import { existsSync, readFileSync } from "fs";
import { dirname, join, resolve } from "path";
import { fileURLToPath } from "url";
import { homedir } from "os";
import { spawnSync } from "child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const repoRoot = resolve(__dirname, "..");
const lockPath = join(repoRoot, "skills.lock.json");

if (!existsSync(lockPath)) {
  console.error("skills.lock.json not found at repo root.");
  process.exit(1);
}

const lock = JSON.parse(readFileSync(lockPath, "utf8"));
const codexHome = process.env.CODEX_HOME || join(homedir(), ".codex");
const skillsDir = join(codexHome, "skills");
const installer = join(
  skillsDir,
  ".system",
  "skill-installer",
  "scripts",
  "install-skill-from-github.py"
);

if (!existsSync(installer)) {
  console.error("skill-installer not found. Is Codex installed on this machine?");
  console.error(`Expected: ${installer}`);
  process.exit(1);
}

const python = process.env.PYTHON || "python3";

function installSkill(skill) {
  const destName = skill.dest || skill.path.split("/").pop();
  const destDir = join(skillsDir, destName);

  if (existsSync(destDir)) {
    console.log(`- ${skill.name}: already installed at ${destDir}`);
    return;
  }

  const args = [
    installer,
    "--repo",
    skill.repo,
    "--path",
    skill.path,
    "--ref",
    skill.ref || "main",
    "--dest",
    skillsDir,
    "--name",
    destName
  ];

  if (skill.method) {
    args.push("--method", skill.method);
  }

  console.log(`- Installing ${skill.name}...`);
  const res = spawnSync(python, args, { stdio: "inherit" });
  if (res.status !== 0) {
    console.error(`Failed to install ${skill.name}.`);
    process.exit(res.status || 1);
  }
}

console.log("Installing Codex skills from skills.lock.json");

for (const skill of lock.skills || []) {
  installSkill(skill);
}

console.log("Done. Restart Codex to pick up new skills.");

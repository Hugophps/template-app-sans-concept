#!/usr/bin/env node

import { cpSync, existsSync, mkdirSync, readFileSync, rmSync } from "fs";
import { dirname, join, resolve } from "path";
import { fileURLToPath } from "url";
import { homedir, tmpdir } from "os";
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

const hasInstaller = existsSync(installer);
const hasGit =
  spawnSync("git", ["--version"], { stdio: "ignore" }).status === 0;

if (!hasInstaller) {
  if (!hasGit) {
    console.error("skill-installer not found and git is not available.");
    console.error("Install Codex or install git to enable skill downloads.");
    console.error(`Expected skill-installer at: ${installer}`);
    process.exit(1);
  }
  console.warn("skill-installer not found. Falling back to git clone.");
  console.warn(`Expected: ${installer}`);
}

const python = process.env.PYTHON || "python3";

function installSkillWithInstaller(skill) {
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

function installSkillWithGit(skill) {
  const destName = skill.dest || skill.path.split("/").pop();
  const destDir = join(skillsDir, destName);

  if (existsSync(destDir)) {
    console.log(`- ${skill.name}: already installed at ${destDir}`);
    return;
  }

  mkdirSync(skillsDir, { recursive: true });
  const tempDir = join(tmpdir(), `codex-skill-${Date.now()}`);
  const repoUrl = `https://github.com/${skill.repo}.git`;
  const ref = skill.ref || "main";

  console.log(`- Cloning ${skill.repo}@${ref}...`);
  const clone = spawnSync("git", ["clone", "--depth", "1", "--branch", ref, repoUrl, tempDir], {
    stdio: "inherit"
  });
  if (clone.status !== 0) {
    console.error(`Failed to clone ${skill.repo}.`);
    process.exit(clone.status || 1);
  }

  const sourceDir = join(tempDir, skill.path);
  if (!existsSync(sourceDir)) {
    console.error(`Path not found in repo: ${skill.path}`);
    process.exit(1);
  }

  console.log(`- Installing ${skill.name}...`);
  cpSync(sourceDir, destDir, { recursive: true });
  rmSync(tempDir, { recursive: true, force: true });
}

console.log("Installing Codex skills from skills.lock.json");

for (const skill of lock.skills || []) {
  if (hasInstaller) {
    installSkillWithInstaller(skill);
  } else {
    installSkillWithGit(skill);
  }
}

console.log("Done. Restart Codex to pick up new skills.");

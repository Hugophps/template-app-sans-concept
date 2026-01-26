#!/usr/bin/env node

import { cpSync, existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "fs";
import { basename, dirname, join, resolve, sep } from "path";
import { fileURLToPath } from "url";
import { homedir } from "os";
import { spawnSync } from "child_process";
import readline from "readline/promises";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const repoRoot = resolve(__dirname, "..");

const STATE_DIR = join(repoRoot, ".bootstrap");
const STATE_PATH = join(STATE_DIR, "state.json");
const STATE_VERSION = 1;

type ProjectInfo = {
  appName: string;
  slug: string;
  description?: string;
};

type DomainInfo = {
  rootDomain: string;
  stagingDomain: string;
  prodDomain: string;
};

type ScopeInfo = {
  githubOwner: string;
  vercelScope: string;
  supabaseOrg: string;
  supabaseRegion?: string;
};

type AppParams = {
  publicAppName: string;
  supportEmail: string;
  primaryColor: string;
  logoUrl: string;
};

type I18nConfig = {
  defaultLocale: string;
  supportedLocales: string[];
  detectBrowser: boolean;
};

type LegalConfig = {
  mode: "web" | "stores";
};

type LegalProfile = {
  jurisdiction: string;
  appType: string;
  dataCollected: string[];
  analyticsEnabled: boolean;
  analyticsTool?: string;
  payments: boolean;
  userGeneratedContent: boolean;
  legalEntityName: string;
  legalContactEmail: string;
};

type UiRefs = {
  figmaUrl: string;
  figmaFileKey?: string;
  screenshots: string[];
  figmaTokenPresent: boolean;
};

type SupabaseRefs = {
  staging?: string;
  prod?: string;
};

type TokenCheck = {
  vercelToken: boolean;
  githubToken: boolean;
  supabaseToken: boolean;
};

type BootstrapData = {
  project?: ProjectInfo;
  domains?: DomainInfo;
  scopes?: ScopeInfo;
  appParams?: AppParams;
  i18n?: I18nConfig;
  legal?: LegalConfig;
  legalProfile?: LegalProfile;
  uiRefs?: UiRefs;
  supabaseRefs?: SupabaseRefs;
  tokens?: TokenCheck;
  localRepoPath?: string;
};

type BootstrapState = {
  version: number;
  completed: string[];
  flags: Record<string, boolean>;
  data: BootstrapData;
};

type StepResult = {
  completed: boolean;
  exit?: boolean;
};

type Step = {
  id: string;
  title: string;
  run: (state: BootstrapState, ask: AskFn) => Promise<StepResult>;
};

type AskFn = (question: string, options?: { defaultValue?: string }) => Promise<string>;

function loadState(): BootstrapState {
  if (!existsSync(STATE_PATH)) {
    return { version: STATE_VERSION, completed: [], flags: {}, data: {} };
  }
  try {
    const raw = readFileSync(STATE_PATH, "utf8");
    const parsed = JSON.parse(raw) as BootstrapState;
    if (parsed.version !== STATE_VERSION) {
      return { version: STATE_VERSION, completed: [], flags: {}, data: {} };
    }
    parsed.completed ||= [];
    parsed.flags ||= {};
    parsed.data ||= {};
    return parsed;
  } catch {
    return { version: STATE_VERSION, completed: [], flags: {}, data: {} };
  }
}

function saveState(state: BootstrapState) {
  if (!existsSync(STATE_DIR)) {
    mkdirSync(STATE_DIR, { recursive: true });
  }
  writeFileSync(STATE_PATH, JSON.stringify(state, null, 2));
}

function isStepCompleted(state: BootstrapState, id: string): boolean {
  return state.completed.includes(id);
}

function markStepCompleted(state: BootstrapState, id: string) {
  if (!state.completed.includes(id)) state.completed.push(id);
}

function getSkillsLock() {
  const lockPath = join(repoRoot, "skills.lock.json");
  if (!existsSync(lockPath)) {
    throw new Error("skills.lock.json not found in repo root.");
  }
  const raw = readFileSync(lockPath, "utf8");
  const parsed = JSON.parse(raw) as {
    skills: Array<{ name: string; path: string; dest?: string }>;
  };
  return parsed;
}

function getSkillsDir() {
  const codexHome = process.env.CODEX_HOME || join(homedir(), ".codex");
  return join(codexHome, "skills");
}

function skillDestName(skill: { path: string; dest?: string }) {
  return skill.dest || skill.path.split("/").pop() || skill.path;
}

function checkSkillsInstalled(): { missing: string[] } {
  const lock = getSkillsLock();
  const skillsDir = getSkillsDir();
  const missing: string[] = [];

  for (const skill of lock.skills || []) {
    const destName = skillDestName(skill);
    const destDir = join(skillsDir, destName);
    if (!existsSync(destDir)) missing.push(skill.name);
  }

  return { missing };
}

function runInstallScript(): boolean {
  const script = join(repoRoot, "scripts", "install-skills.mjs");
  if (!existsSync(script)) {
    console.error("install-skills.mjs not found at scripts/install-skills.mjs");
    return false;
  }

  const node = process.execPath;
  const res = spawnSync(node, [script], { stdio: "inherit", cwd: repoRoot });
  return res.status === 0;
}

async function makeAskFn(): Promise<AskFn> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const ask: AskFn = async (question, options) => {
    const suffix = options?.defaultValue ? ` (${options.defaultValue})` : "";
    const answer = await rl.question(`${question}${suffix} `);
    const trimmed = answer.trim();
    if (!trimmed && options?.defaultValue) return options.defaultValue;
    return trimmed;
  };

  // Close on process exit
  process.on("exit", () => rl.close());
  return ask;
}

async function askYesNo(ask: AskFn, question: string): Promise<boolean> {
  const answer = (await ask(`${question} [y/n]`)).toLowerCase();
  if (answer === "y" || answer === "yes") return true;
  if (answer === "n" || answer === "no") return false;
  return askYesNo(ask, question);
}

async function askRequired(
  ask: AskFn,
  question: string,
  options?: { defaultValue?: string }
): Promise<string> {
  while (true) {
    const answer = (await ask(question, options)).trim();
    if (answer) return answer;
    console.log("Please enter a value.");
  }
}

async function askValidated(
  ask: AskFn,
  question: string,
  validate: (value: string) => boolean,
  options?: { defaultValue?: string }
): Promise<string> {
  while (true) {
    const answer = (await ask(question, options)).trim();
    if (validate(answer)) return answer;
    console.log("Invalid value. Please try again.");
  }
}

function slugify(input: string): string {
  return input
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

function isValidSlug(value: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);
}

function isValidDomain(value: string): boolean {
  return /^[a-z0-9.-]+$/.test(value) && value.includes(".");
}

function isValidEmail(value: string): boolean {
  return /^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$/.test(value);
}

function isValidHexColor(value: string): boolean {
  return /^#[0-9a-fA-F]{6}$/.test(value);
}

function isValidLocale(value: string): boolean {
  return /^[a-z]{2}(-[a-z]{2})?$/.test(value);
}

function isValidHttpsUrlOrEmpty(value: string): boolean {
  if (!value) return true;
  return /^https:\\/\\//.test(value);
}

function isValidHttpsUrl(value: string): boolean {
  return /^https:\\/\\//.test(value);
}

function isExistingDirectory(pathValue: string): boolean {
  try {
    return statSync(pathValue).isDirectory();
  } catch {
    return false;
  }
}

function isExistingFile(pathValue: string): boolean {
  try {
    return statSync(pathValue).isFile();
  } catch {
    return false;
  }
}

function isSubPath(parent: string, child: string): boolean {
  const parentPath = resolve(parent) + sep;
  const childPath = resolve(child) + sep;
  return childPath.startsWith(parentPath);
}

function parseLocales(input: string): string[] {
  const parts = input
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
  const unique: string[] = [];
  for (const locale of parts) {
    if (!unique.includes(locale)) unique.push(locale);
  }
  return unique;
}

function parseList(input: string): string[] {
  return input
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function extractFigmaFileKey(url: string): string | undefined {
  const match = url.match(/figma\\.com\\/(file|design)\\/([a-zA-Z0-9]+)\\//);
  if (!match) return undefined;
  return match[2];
}

function ensureDir(pathValue: string) {
  if (!existsSync(pathValue)) {
    mkdirSync(pathValue, { recursive: true });
  }
}

function commandExists(command: string, args: string[] = ["--version"]): boolean {
  const res = spawnSync(command, args, { stdio: "ignore" });
  if (res.error) return false;
  return res.status === 0;
}

function runCommand(
  command: string,
  args: string[],
  options?: { env?: NodeJS.ProcessEnv; cwd?: string; inherit?: boolean; input?: string }
): { ok: boolean; stdout: string } {
  const stdio =
    options?.inherit && options?.input
      ? (["pipe", "inherit", "inherit"] as const)
      : options?.inherit
      ? "inherit"
      : (["pipe", "pipe", "pipe"] as const);

  const res = spawnSync(command, args, {
    cwd: options?.cwd,
    env: options?.env,
    input: options?.input,
    stdio,
    encoding: "utf8"
  });

  if (res.error) return { ok: false, stdout: "" };
  if (res.status !== 0) return { ok: false, stdout: res.stdout || "" };
  return { ok: true, stdout: res.stdout || "" };
}

function ghEnv() {
  return {
    ...process.env,
    GH_TOKEN: process.env.GH_TOKEN || process.env.GITHUB_TOKEN
  };
}

function vercelArgs(scope?: string) {
  const args: string[] = [];
  if (process.env.VERCEL_TOKEN) {
    args.push("--token", process.env.VERCEL_TOKEN);
  }
  if (scope && scope !== "personal") {
    args.push("--scope", scope);
  }
  return args;
}

function vercelEnv() {
  return {
    ...process.env
  };
}

function supabaseEnv() {
  return {
    ...process.env
  };
}

function copyTemplate(sourceDir: string, targetDir: string) {
  const ignoreNames = new Set([
    ".git",
    ".bootstrap",
    "node_modules",
    "pnpm-lock.yaml",
    "package-lock.json",
    "yarn.lock",
    "APP_TODO.md"
  ]);

  cpSync(sourceDir, targetDir, {
    recursive: true,
    filter: (src) => {
      const name = basename(src);
      if (ignoreNames.has(name)) return false;
      return true;
    }
  });
}

function writeAppTodo(state: BootstrapState) {
  const { project, domains, scopes, appParams, i18n, legal, legalProfile, supabaseRefs, uiRefs } = state.data;
  const lines: string[] = [];

  lines.push("# APP_TODO");
  lines.push("");
  lines.push("## Project");
  lines.push(`- App name: ${project?.appName ?? "TBD"}`);
  lines.push(`- Slug / Repo: ${project?.slug ?? "TBD"}`);
  lines.push(`- Description: ${project?.description ?? "TBD"}`);
  lines.push(`- Local repo path: ${state.data.localRepoPath ?? "TBD"}`);
  lines.push("");
  lines.push("## Domains");
  lines.push(`- Root: ${domains?.rootDomain ?? "TBD"}`);
  lines.push(`- Staging: ${domains?.stagingDomain ?? "TBD"}`);
  lines.push(`- Production: ${domains?.prodDomain ?? "TBD"}`);
  lines.push("");
  lines.push("## Required local env vars");
  lines.push("- VERCEL_TOKEN");
  lines.push("- GITHUB_TOKEN");
  lines.push("- SUPABASE_ACCESS_TOKEN");
  lines.push("- FIGMA_TOKEN");
  lines.push("");
  lines.push("## Infra (manual unless automated)");
  lines.push(`- GitHub repo: ${scopes?.githubOwner ?? "TBD"}/${project?.slug ?? "TBD"}`);
  lines.push(
    `- Vercel projects: ${project?.slug ?? "app"}-staging / ${project?.slug ?? "app"}-prod`
  );
  lines.push(
    `- Supabase projects: ${project?.slug ?? "app"}-staging / ${project?.slug ?? "app"}-prod (region ${scopes?.supabaseRegion ?? "EU"})`
  );
  if (supabaseRefs?.staging || supabaseRefs?.prod) {
    lines.push(`- Supabase project refs: staging=${supabaseRefs?.staging ?? "TBD"}, prod=${supabaseRefs?.prod ?? "TBD"}`);
  }
  lines.push("- DNS: staging + prod subdomains");
  lines.push("- Vercel env vars (staging + prod):");
  lines.push("  - NEXT_PUBLIC_SUPABASE_URL");
  lines.push("  - NEXT_PUBLIC_SUPABASE_ANON_KEY");
  lines.push("  - SUPABASE_SERVICE_ROLE_KEY (optional, server-only)");
  lines.push(`  - NEXT_PUBLIC_LEGAL_MODE=${legal?.mode ?? "web"}`);
  lines.push("");
  lines.push("## App params");
  lines.push(`- Public app name: ${appParams?.publicAppName ?? "TBD"}`);
  lines.push(`- Support email: ${appParams?.supportEmail ?? "TBD"}`);
  lines.push(`- Primary color: ${appParams?.primaryColor ?? "TBD"}`);
  lines.push(`- Logo URL: ${appParams?.logoUrl || "TBD"}`);
  lines.push("- App config: src/config/app.json (verify values)");
  lines.push("");
  lines.push("## Auth (Supabase)");
  lines.push("- Enable Magic Link only (no password)");
  lines.push("- Set redirect URLs:");
  lines.push(`  - https://${domains?.stagingDomain ?? "staging.example.com"}/auth/callback`);
  lines.push(`  - https://${domains?.prodDomain ?? "app.example.com"}/auth/callback`);
  lines.push("- Update email templates from:");
  lines.push("  - emails/magic-link.html");
  lines.push("  - emails/change-email.html");
  lines.push("");
  lines.push("## i18n");
  lines.push(`- Default locale: ${i18n?.defaultLocale ?? "en"}`);
  lines.push(`- Supported locales: ${(i18n?.supportedLocales ?? ["en"]).join(", ")}`);
  lines.push("- Locale is stored in public.profiles.locale (default 'en')");
  lines.push("");
  lines.push("## Legal");
  lines.push(`- Default mode: ${legal?.mode ?? "web"}`);
  lines.push("- Provide Privacy Policy + Terms + Imprint (and Cookies if tracking)");
  lines.push("- Stores (if applicable): ensure Privacy Policy URL and data safety forms");
  if (legalProfile) {
    lines.push(`- Jurisdiction: ${legalProfile.jurisdiction}`);
    lines.push(`- App type: ${legalProfile.appType}`);
    lines.push(`- Data collected: ${legalProfile.dataCollected.join(", ")}`);
    lines.push(`- Analytics: ${legalProfile.analyticsEnabled ? "yes" : "no"}`);
    lines.push(`- Payments: ${legalProfile.payments ? "yes" : "no"}`);
    lines.push(`- UGC: ${legalProfile.userGeneratedContent ? "yes" : "no"}`);
  }
  lines.push("");
  lines.push("## Profile page");
  lines.push("- Show user email");
  lines.push("- Button: change email");
  lines.push("- Button: change language");
  lines.push("");
  lines.push("## UI references");
  lines.push(`- Figma URL: ${uiRefs?.figmaUrl ?? "TBD"}`);
  lines.push(`- Figma token required: ${uiRefs?.figmaTokenPresent ? "yes" : "no"}`);
  lines.push(`- Screenshots: ${uiRefs?.screenshots?.length ? uiRefs.screenshots.join(", ") : "TBD"}`);
  lines.push("");

  const outputDir = state.data.localRepoPath || repoRoot;
  writeFileSync(join(outputDir, "APP_TODO.md"), lines.join("\n"));
}

function formatBullets(items: string[]): string {
  return items.map((item) => `- ${item}`).join("\n");
}

function renderPrivacyEn(profile: LegalProfile, appName: string, updated: string): string {
  const analyticsLine = profile.analyticsEnabled
    ? `We use ${profile.analyticsTool || "analytics tools"} to understand usage and improve the service.`
    : "We do not use analytics or tracking cookies.";
  const paymentsLine = profile.payments
    ? "Payments are handled by third-party providers. We do not store full payment details."
    : "We do not process payments in the app.";
  const ugcLine = profile.userGeneratedContent
    ? "Users may submit content. You are responsible for what you upload."
    : "The app does not include user-generated content features.";

  return `# Privacy Policy

Last updated: ${updated}

## Overview
${appName} provides this ${profile.appType} application. This policy explains how we collect, use, and share information.

## Data we collect
${formatBullets(profile.dataCollected)}

## How we use data
- Provide and maintain the service
- Support users and respond to requests
- Improve reliability and security
- Comply with legal obligations

## Analytics and cookies
${analyticsLine}

## Payments
${paymentsLine}

## User content
${ugcLine}

## Data sharing
We do not sell your data. We may share data with service providers that help us run the service.

## Data retention
We keep data only as long as necessary for the purposes described above.

## Your rights
Depending on your jurisdiction (${profile.jurisdiction}), you may request access, correction, or deletion of your data.

## Contact
${profile.legalEntityName} — ${profile.legalContactEmail}
`;
}

function renderTermsEn(profile: LegalProfile, appName: string, updated: string): string {
  const paymentsLine = profile.payments
    ? "If you purchase paid features, you agree to the pricing, billing, and renewal terms presented at checkout."
    : "There are no paid features at this time.";
  const ugcLine = profile.userGeneratedContent
    ? "You are responsible for any content you submit and must have the rights to share it."
    : "The service does not allow user-generated content.";

  return `# Terms of Service

Last updated: ${updated}

## Acceptance
By using ${appName}, you agree to these terms. This service is provided as a ${profile.appType} application.

## Accounts
You are responsible for maintaining the confidentiality of your login links and account activity.

## Acceptable use
You agree not to misuse the service, interfere with its operation, or attempt unauthorized access.

## Payments
${paymentsLine}

## User content
${ugcLine}

## Termination
We may suspend or terminate access if you violate these terms.

## Liability
The service is provided \"as is\" without warranties. To the maximum extent permitted by law, we are not liable for indirect damages.

## Governing law
These terms are governed by the laws of ${profile.jurisdiction}.

## Contact
${profile.legalEntityName} — ${profile.legalContactEmail}
`;
}

function renderImprintEn(profile: LegalProfile, appName: string): string {
  return `# Imprint / Legal Notice

Service: ${appName}
Legal entity: ${profile.legalEntityName}
Jurisdiction: ${profile.jurisdiction}
Contact: ${profile.legalContactEmail}
`;
}

function renderCookiesEn(profile: LegalProfile, appName: string, updated: string): string {
  const tool = profile.analyticsTool || "analytics tools";
  return `# Cookies Policy

Last updated: ${updated}

${appName} uses cookies and similar technologies to operate the service and measure usage.
We use ${tool} to understand how the app is used and to improve it. You can control cookies through your browser settings.
`;
}

function renderPrivacyFr(profile: LegalProfile, appName: string, updated: string): string {
  const analyticsLine = profile.analyticsEnabled
    ? `Nous utilisons ${profile.analyticsTool || "des outils d'analyse"} pour comprendre l'usage et ameliorer le service.`
    : "Nous n'utilisons pas d'analytics ni de cookies de suivi.";
  const paymentsLine = profile.payments
    ? "Les paiements sont geres par des prestataires tiers. Nous ne stockons pas les details complets de paiement."
    : "Nous ne traitons pas de paiements dans l'app.";
  const ugcLine = profile.userGeneratedContent
    ? "Les utilisateurs peuvent soumettre du contenu. Vous etes responsable de ce que vous publiez."
    : "L'app ne propose pas de fonctionnalites de contenu utilisateur.";

  return `# Politique de confidentialite

Derniere mise a jour : ${updated}

## Vue d'ensemble
${appName} fournit cette application ${profile.appType}. Cette politique explique comment nous collectons, utilisons et partageons les informations.

## Donnees collectees
${formatBullets(profile.dataCollected)}

## Utilisation des donnees
- Fournir et maintenir le service
- Support utilisateur et reponse aux demandes
- Ameliorer la fiabilite et la securite
- Respecter les obligations legales

## Analytics et cookies
${analyticsLine}

## Paiements
${paymentsLine}

## Contenu utilisateur
${ugcLine}

## Partage des donnees
Nous ne vendons pas vos donnees. Nous pouvons partager des donnees avec des prestataires qui nous aident a exploiter le service.

## Conservation des donnees
Nous conservons les donnees uniquement le temps necessaire aux finalites decrites ci-dessus.

## Vos droits
Selon votre juridiction (${profile.jurisdiction}), vous pouvez demander l'acces, la correction ou la suppression de vos donnees.

## Contact
${profile.legalEntityName} — ${profile.legalContactEmail}
`;
}

function renderTermsFr(profile: LegalProfile, appName: string, updated: string): string {
  const paymentsLine = profile.payments
    ? "Si vous achetez des fonctionnalites payantes, vous acceptez les conditions de prix, facturation et renouvellement affichees."
    : "Il n'y a pas de fonctionnalites payantes pour le moment.";
  const ugcLine = profile.userGeneratedContent
    ? "Vous etes responsable du contenu que vous soumettez et devez disposer des droits necessaires."
    : "Le service ne permet pas le contenu utilisateur.";

  return `# Conditions d'utilisation

Derniere mise a jour : ${updated}

## Acceptation
En utilisant ${appName}, vous acceptez ces conditions. Ce service est fourni en tant qu'application ${profile.appType}.

## Comptes
Vous etes responsable de la confidentialite de vos liens de connexion et de l'activite du compte.

## Usage acceptable
Vous vous engagez a ne pas detourner le service, perturber son fonctionnement ou tenter un acces non autorise.

## Paiements
${paymentsLine}

## Contenu utilisateur
${ugcLine}

## Resiliation
Nous pouvons suspendre ou resilier l'acces si vous violez ces conditions.

## Responsabilite
Le service est fourni \"tel quel\" sans garantie. Dans la limite permise par la loi, nous ne sommes pas responsables des dommages indirects.

## Droit applicable
Ces conditions sont regies par les lois de ${profile.jurisdiction}.

## Contact
${profile.legalEntityName} — ${profile.legalContactEmail}
`;
}

function renderImprintFr(profile: LegalProfile, appName: string): string {
  return `# Mentions legales

Service : ${appName}
Entite legale : ${profile.legalEntityName}
Juridiction : ${profile.jurisdiction}
Contact : ${profile.legalContactEmail}
`;
}

function renderCookiesFr(profile: LegalProfile, appName: string, updated: string): string {
  const tool = profile.analyticsTool || "des outils d'analyse";
  return `# Politique relative aux cookies

Derniere mise a jour : ${updated}

${appName} utilise des cookies et des technologies similaires pour faire fonctionner le service et mesurer l'usage.
Nous utilisons ${tool} pour comprendre l'utilisation de l'app et l'ameliorer. Vous pouvez controler les cookies via les reglages de votre navigateur.
`;
}

function writeLegalDocs(state: BootstrapState): { localesNeedingAgent: string[] } {
  const repoPath = state.data.localRepoPath;
  const profile = state.data.legalProfile;
  const locales = state.data.i18n?.supportedLocales ?? ["en"];
  const appName =
    state.data.appParams?.publicAppName || state.data.project?.appName || "App";

  if (!repoPath || !profile) return { localesNeedingAgent: [] };

  const updated = new Date().toISOString().slice(0, 10);
  const baseDir = join(repoPath, "content", "legal");
  ensureDir(baseDir);

  const privacyEn = renderPrivacyEn(profile, appName, updated);
  const termsEn = renderTermsEn(profile, appName, updated);
  const imprintEn = renderImprintEn(profile, appName);
  const cookiesEn = profile.analyticsEnabled
    ? renderCookiesEn(profile, appName, updated)
    : "";

  const localesNeedingAgent: string[] = [];

  for (const locale of locales) {
    const localeDir = join(baseDir, locale);
    ensureDir(localeDir);

    if (locale === "en") {
      writeFileSync(join(localeDir, "privacy.md"), privacyEn);
      writeFileSync(join(localeDir, "terms.md"), termsEn);
      writeFileSync(join(localeDir, "imprint.md"), imprintEn);
      if (cookiesEn) writeFileSync(join(localeDir, "cookies.md"), cookiesEn);
      continue;
    }

    if (locale.startsWith("fr")) {
      writeFileSync(join(localeDir, "privacy.md"), renderPrivacyFr(profile, appName, updated));
      writeFileSync(join(localeDir, "terms.md"), renderTermsFr(profile, appName, updated));
      writeFileSync(join(localeDir, "imprint.md"), renderImprintFr(profile, appName));
      if (cookiesEn) writeFileSync(join(localeDir, "cookies.md"), renderCookiesFr(profile, appName, updated));
      continue;
    }

    // For other locales, require agent translation
    writeFileSync(join(localeDir, "privacy.md"), privacyEn);
    writeFileSync(join(localeDir, "terms.md"), termsEn);
    writeFileSync(join(localeDir, "imprint.md"), imprintEn);
    if (cookiesEn) writeFileSync(join(localeDir, "cookies.md"), cookiesEn);
    localesNeedingAgent.push(locale);
  }

  const profilePath = join(repoPath, "content", "legal", "profile.json");
  writeFileSync(profilePath, JSON.stringify(profile, null, 2));

  return { localesNeedingAgent };
}

function writeAppConfig(state: BootstrapState) {
  const repoPath = state.data.localRepoPath;
  if (!repoPath) return;

  const project = state.data.project;
  const appParams = state.data.appParams;
  const i18n = state.data.i18n;

  const configPath = join(repoPath, "src", "config", "app.json");
  const defaultLocale = i18n?.defaultLocale ?? "en";
  const supportedLocales = i18n?.supportedLocales ?? ["en"];
  const normalizedLocales = supportedLocales.includes(defaultLocale)
    ? supportedLocales
    : [defaultLocale, ...supportedLocales];

  const config = {
    appName: project?.appName ?? "App",
    publicAppName: appParams?.publicAppName ?? project?.appName ?? "App",
    supportEmail: appParams?.supportEmail ?? "support@example.com",
    logoUrl: appParams?.logoUrl ?? "/brand/logo.svg",
    primaryColor: appParams?.primaryColor ?? "#1b7f6a",
    defaultLocale,
    supportedLocales: normalizedLocales
  };

  writeFileSync(configPath, JSON.stringify(config, null, 2));

  const defaultLocale = config.defaultLocale;
  const migrationPath = join(repoPath, "supabase", "migrations", "20260126000000_init.sql");
  if (existsSync(migrationPath)) {
    const content = readFileSync(migrationPath, "utf-8")
      .replace(/default 'en'/g, `default '${defaultLocale}'`)
      .replace(/values \\(new.id, 'en'\\)/g, `values (new.id, '${defaultLocale}')`);
    writeFileSync(migrationPath, content);
  }
}

function shadeHex(hex: string, percent: number): string {
  const raw = hex.trim().replace("#", "");
  const normalized =
    raw.length === 3
      ? raw
          .split("")
          .map((value) => value + value)
          .join("")
      : raw;

  if (normalized.length !== 6) return hex;

  const num = parseInt(normalized, 16);
  const channels = [(num >> 16) & 255, (num >> 8) & 255, num & 255];
  const adjust = (value: number) => {
    const delta = percent < 0 ? value * percent : (255 - value) * percent;
    const next = Math.round(value + delta);
    return Math.min(255, Math.max(0, next));
  };

  const [r, g, b] = channels.map(adjust);
  const toHex = (value: number) => value.toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function applyUiOverrides(state: BootstrapState) {
  const repoPath = state.data.localRepoPath;
  const appParams = state.data.appParams;
  if (!repoPath || !appParams?.primaryColor) return;

  const primary = appParams.primaryColor;
  const strong = shadeHex(primary, -0.18);

  const globalsPath = join(repoPath, "src", "app", "globals.css");
  if (existsSync(globalsPath)) {
    let css = readFileSync(globalsPath, "utf-8");
    css = css.replace(/--color-brand: #[0-9a-fA-F]{3,8};/, `--color-brand: ${primary};`);
    css = css.replace(/--color-brand-strong: #[0-9a-fA-F]{3,8};/, `--color-brand-strong: ${strong};`);
    writeFileSync(globalsPath, css);
  }

  const tokensPath = join(repoPath, "src", "ui", "tokens.json");
  if (existsSync(tokensPath)) {
    try {
      const tokens = JSON.parse(readFileSync(tokensPath, "utf-8"));
      if (
        tokens?.color?.primitive?.fern?.["500"]?.$value &&
        typeof tokens.color.primitive.fern["500"].$value === "string"
      ) {
        tokens.color.primitive.fern["500"].$value = primary;
      }
      if (
        tokens?.color?.primitive?.fern?.["700"]?.$value &&
        typeof tokens.color.primitive.fern["700"].$value === "string"
      ) {
        tokens.color.primitive.fern["700"].$value = strong;
      }
      writeFileSync(tokensPath, JSON.stringify(tokens, null, 2));
    } catch {
      // ignore token parsing issues
    }
  }
}

const stepSkills: Step = {
  id: "skills",
  title: "Install required Codex skills",
  run: async (state, ask) => {
    while (true) {
      const { missing } = checkSkillsInstalled();

      if (missing.length === 0) {
        state.flags.skillsInstalled = true;
        if (!state.flags.skillsRestartConfirmed) {
          const ok = await askYesNo(
            ask,
            "Skills are installed. Have you restarted Codex since installation?"
          );
          if (!ok) {
            console.log("Please restart Codex and rerun the bootstrap.");
            saveState(state);
            return { completed: false, exit: true };
          }
          state.flags.skillsRestartConfirmed = true;
        }
        return { completed: true };
      }

      console.log("Missing required skills:");
      for (const name of missing) console.log(`- ${name}`);

      const installNow = await askYesNo(ask, "Install skills now?");
      if (!installNow) {
        console.log("Cannot continue without required skills.");
        continue;
      }

      const ok = runInstallScript();
      if (!ok) {
        console.log("Install failed. Fix the issue and try again.");
        continue;
      }

      state.flags.skillsInstalled = true;
      saveState(state);
      console.log("Skills installed. Restart Codex, then rerun the bootstrap.");
      return { completed: false, exit: true };
    }
  }
};

const stepCliCheck: Step = {
  id: "cli-check",
  title: "Check required CLIs",
  run: async (state, ask) => {
    const required = [
      { name: "gh", hint: "GitHub CLI" },
      { name: "vercel", hint: "Vercel CLI" },
      { name: "supabase", hint: "Supabase CLI" }
    ];

    while (true) {
      const missing = required.filter((cmd) => !commandExists(cmd.name));
      if (missing.length === 0) return { completed: true };

      console.log("Missing required CLIs:");
      for (const cmd of missing) console.log(`- ${cmd.name} (${cmd.hint})`);
      await ask("Install the missing CLIs, then press Enter to re-check.");
    }
  }
};

const stepTokens: Step = {
  id: "tokens",
  title: "Check required tokens",
  run: async (state, ask) => {
    const required = ["VERCEL_TOKEN", "GITHUB_TOKEN", "SUPABASE_ACCESS_TOKEN"];

    while (true) {
      const missing = required.filter((name) => !process.env[name]);
      if (missing.length === 0) {
        state.data.tokens = {
          vercelToken: true,
          githubToken: true,
          supabaseToken: true
        };
        return { completed: true };
      }

      console.log("Missing required env vars:");
      for (const name of missing) console.log(`- ${name}`);
      await ask("Set the missing env vars and press Enter to re-check.");
    }
  }
};

const stepProjectInfo: Step = {
  id: "project-info",
  title: "Project info",
  run: async (state, ask) => {
    const appName = await askRequired(ask, "App display name");
    const slugSuggestion = slugify(appName);
    const slugDefault = slugSuggestion ? { defaultValue: slugSuggestion } : undefined;
    let slug = (
      await askValidated(
        ask,
        "App slug (kebab-case)",
        (value) => isValidSlug(value.toLowerCase()),
        slugDefault
      )
    ).toLowerCase();
    const description = await ask("Short description (optional)");

    let baseDir = "";
    while (true) {
      const defaultBase = resolve(repoRoot, "..");
      baseDir = await askValidated(
        ask,
        "Base directory for new app",
        (value) => isExistingDirectory(value),
        { defaultValue: defaultBase }
      );

      if (isSubPath(repoRoot, baseDir)) {
        console.log("Base directory cannot be inside the template repo.");
        continue;
      }
      break;
    }

    while (true) {
      const targetDir = join(baseDir, slug);
      if (existsSync(targetDir)) {
        console.log(`A project with this name already exists: ${targetDir}`);
        slug = (
          await askValidated(
            ask,
            "Choose a different slug (kebab-case)",
            (value) => isValidSlug(value.toLowerCase()),
            { defaultValue: slug }
          )
        ).toLowerCase();
        continue;
      }

      state.data.project = {
        appName,
        slug,
        description: description || undefined
      };
      state.data.localRepoPath = targetDir;
      break;
    }

    return { completed: true };
  }
};

const stepDomains: Step = {
  id: "domains",
  title: "Domains",
  run: async (state, ask) => {
    const rootDomain = (await askValidated(
      ask,
      "Root domain (example.com)",
      (value) => isValidDomain(value.toLowerCase())
    )).toLowerCase();
    const stagingDefault = `staging.${rootDomain}`;
    const prodDefault = `app.${rootDomain}`;
    const stagingDomain = await askValidated(
      ask,
      "Staging domain",
      (value) => isValidDomain(value.toLowerCase()),
      { defaultValue: stagingDefault }
    );
    const prodDomain = await askValidated(
      ask,
      "Production domain",
      (value) => isValidDomain(value.toLowerCase()),
      { defaultValue: prodDefault }
    );

    state.data.domains = {
      rootDomain,
      stagingDomain: stagingDomain.toLowerCase(),
      prodDomain: prodDomain.toLowerCase()
    };
    return { completed: true };
  }
};

const stepScopes: Step = {
  id: "scopes",
  title: "Accounts / scopes",
  run: async (state, ask) => {
    const githubOwner = await askRequired(ask, "GitHub owner (user or org)");
    const vercelScope = await askRequired(ask, "Vercel scope (team slug or 'personal')", {
      defaultValue: "personal"
    });
    const supabaseOrg = await askRequired(ask, "Supabase org slug or ID");
    const supabaseRegion = await askRequired(ask, "Supabase region", {
      defaultValue: "eu-west-1"
    });

    state.data.scopes = {
      githubOwner,
      vercelScope: vercelScope.toLowerCase(),
      supabaseOrg,
      supabaseRegion: supabaseRegion.toLowerCase()
    };
    return { completed: true };
  }
};

const stepAppParams: Step = {
  id: "app-params",
  title: "App parameters",
  run: async (state, ask) => {
    const project = state.data.project;
    const domains = state.data.domains;

    const publicAppName = await askRequired(ask, "Public app name (for emails)", {
      defaultValue: project?.appName
    });

    const supportDefault = domains?.rootDomain ? `support@${domains.rootDomain}` : undefined;
    const supportEmail = await askValidated(ask, "Support email", isValidEmail, {
      defaultValue: supportDefault
    });

    const primaryColor = await askValidated(
      ask,
      "Primary color (hex)",
      isValidHexColor,
      { defaultValue: "#3b5bdb" }
    );

    const logoDefault = domains?.prodDomain
      ? `https://${domains.prodDomain}/emails/logo.png`
      : undefined;
    const logoUrl = await askValidated(ask, "Logo URL (https)", isValidHttpsUrlOrEmpty, {
      defaultValue: logoDefault
    });

    state.data.appParams = { publicAppName, supportEmail, primaryColor, logoUrl };
    return { completed: true };
  }
};

const stepI18n: Step = {
  id: "i18n",
  title: "i18n settings",
  run: async (state, ask) => {
    const defaultLocale = (
      await askValidated(ask, "Default locale", (value) => isValidLocale(value.toLowerCase()), {
        defaultValue: "en"
      })
    ).toLowerCase();
    const supportedInput = await askRequired(ask, "Supported locales (comma-separated)", {
      defaultValue: "en,fr"
    });
    const supportedLocales = parseLocales(supportedInput);
    if (!supportedLocales.includes(defaultLocale)) supportedLocales.unshift(defaultLocale);

    state.data.i18n = {
      defaultLocale,
      supportedLocales,
      detectBrowser: false
    };
    return { completed: true };
  }
};

const stepLegal: Step = {
  id: "legal",
  title: "Legal mode",
  run: async (state, ask) => {
    const mode = (
      await askValidated(
        ask,
        "Legal mode (web|stores)",
        (value) => {
          const normalized = value.toLowerCase();
          return normalized === "web" || normalized === "stores";
        },
        { defaultValue: "web" }
      )
    ).toLowerCase() as "web" | "stores";

    state.data.legal = { mode };
    return { completed: true };
  }
};

const stepLegalProfile: Step = {
  id: "legal-profile",
  title: "Legal profile",
  run: async (state, ask) => {
    const jurisdiction = await askRequired(
      ask,
      "Primary jurisdiction (ex: France/UE, US, UK)"
    );
    const appType = await askRequired(
      ask,
      "App type (ex: SaaS B2B, B2C, marketplace, content, health, finance)"
    );
    const dataCollectedInput = await askRequired(
      ask,
      "Data collected (comma-separated, ex: email, name, billing, location)"
    );
    const dataCollected = parseList(dataCollectedInput);

    const analyticsEnabled = await askYesNo(
      ask,
      "Analytics / tracking enabled?"
    );
    let analyticsTool: string | undefined;
    if (analyticsEnabled) {
      analyticsTool = await askRequired(
        ask,
        "Analytics tool (ex: Plausible, GA4)"
      );
    }

    const payments = await askYesNo(ask, "Payments / subscriptions?");
    const userGeneratedContent = await askYesNo(
      ask,
      "User-generated content?"
    );

    const legalEntityName = await askRequired(
      ask,
      "Legal entity name (ex: Sans Concept)"
    );

    const supportDefault = state.data.appParams?.supportEmail;
    const legalContactEmail = await askValidated(
      ask,
      "Legal contact email",
      isValidEmail,
      { defaultValue: supportDefault }
    );

    state.data.legalProfile = {
      jurisdiction,
      appType,
      dataCollected,
      analyticsEnabled,
      analyticsTool,
      payments,
      userGeneratedContent,
      legalEntityName,
      legalContactEmail
    };

    return { completed: true };
  }
};

const stepLocalRepo: Step = {
  id: "local-repo",
  title: "Create local repo from template",
  run: async (state, ask) => {
    const project = state.data.project;
    const repoPath = state.data.localRepoPath;
    if (!project) {
      console.log("Missing project info. Restart bootstrap.");
      return { completed: false, exit: true };
    }

    if (!repoPath) {
      console.log("Missing repo path. Restart bootstrap.");
      return { completed: false, exit: true };
    }

    if (resolve(repoPath) === resolve(repoRoot)) {
      console.log("Target directory cannot be the template repo itself.");
      return { completed: false, exit: true };
    }

    if (isSubPath(repoRoot, repoPath)) {
      console.log("Target directory cannot be inside the template repo.");
      return { completed: false, exit: true };
    }

    if (existsSync(repoPath)) {
      console.log(`Target directory already exists: ${repoPath}`);
      console.log("Delete or rename it, then rerun the bootstrap.");
      return { completed: false, exit: true };
    }

    console.log(`Copying template to ${repoPath}...`);
    copyTemplate(repoRoot, repoPath);
    writeAppConfig(state);

    const gitInit = runCommand("git", ["init", "-b", "main"], {
      cwd: repoPath,
      inherit: true
    });
    if (!gitInit.ok) {
      const fallbackInit = runCommand("git", ["init"], { cwd: repoPath, inherit: true });
      if (!fallbackInit.ok) {
        console.log("Git init failed. Fix and retry.");
        return { completed: false, exit: true };
      }
      runCommand("git", ["branch", "-M", "main"], { cwd: repoPath, inherit: true });
    }

    runCommand("git", ["add", "."], { cwd: repoPath, inherit: true });
    while (true) {
      const commit = runCommand("git", ["commit", "-m", "chore: init app from template"], {
        cwd: repoPath,
        inherit: true
      });
      if (commit.ok) break;

      const retry = await askYesNo(
        ask,
        "Git commit failed (user.name/email?). Fix and retry?"
      );
      if (!retry) break;
    }

    runCommand("git", ["checkout", "-b", "develop"], { cwd: repoPath, inherit: true });
    const stayOnDevelop = await askYesNo(
      ask,
      "Keep current branch on develop? (recommended)"
    );
    if (!stayOnDevelop) {
      runCommand("git", ["checkout", "main"], { cwd: repoPath, inherit: true });
    }

    return { completed: true };
  }
};

const stepUiRefs: Step = {
  id: "ui-refs",
  title: "UI references (Figma + screenshots)",
  run: async (state, ask) => {
    const repoPath = state.data.localRepoPath;
    if (!repoPath) {
      console.log("Missing repo path. Restart bootstrap.");
      return { completed: false, exit: true };
    }

    let figmaUrl = "";
    let figmaFileKey: string | undefined;
    while (true) {
      figmaUrl = await askValidated(
        ask,
        "Figma file URL (https://...)",
        isValidHttpsUrl
      );
      figmaFileKey = extractFigmaFileKey(figmaUrl);
      if (figmaFileKey) break;
      console.log("Could not extract Figma file key from URL.");
    }

    while (!process.env.FIGMA_TOKEN) {
      console.log("FIGMA_TOKEN is required to read the Figma file.");
      await ask("Set FIGMA_TOKEN and press Enter to re-check.");
    }

    let screenshotPaths: string[] = [];
    while (true) {
      const screenshotsInput = await askRequired(
        ask,
        "Screenshot file paths (comma-separated)"
      );
      screenshotPaths = parseList(screenshotsInput);
      const invalid = screenshotPaths.filter((pathValue) => !isExistingFile(pathValue));
      if (invalid.length === 0) break;
      console.log("Invalid screenshot paths:");
      for (const pathValue of invalid) console.log(`- ${pathValue}`);
    }

    const refsDir = join(repoPath, "ui", "refs");
    const screenshotsDir = join(refsDir, "screenshots");
    ensureDir(screenshotsDir);

    for (const pathValue of screenshotPaths) {
      const name = basename(pathValue);
      cpSync(pathValue, join(screenshotsDir, name));
    }

    const figmaMeta = {
      url: figmaUrl,
      fileKey: figmaFileKey || null,
      collectedAt: new Date().toISOString()
    };
    writeFileSync(join(refsDir, "figma.json"), JSON.stringify(figmaMeta, null, 2));

    const uiBriefPath = join(refsDir, "UI_BRIEF.md");
    if (!existsSync(uiBriefPath)) {
      writeFileSync(
        uiBriefPath,
        `# UI Brief\n\n- Visual adjectives (4-6):\n- Density (compact / balanced / airy):\n- Do not do:\n- Key UI references (screenshots + Figma frames):\n`
      );
    }

    state.data.uiRefs = {
      figmaUrl,
      figmaFileKey,
      screenshots: screenshotPaths.map((pathValue) => basename(pathValue)),
      figmaTokenPresent: true
    };

    return { completed: true };
  }
};

const stepUiSync: Step = {
  id: "ui-sync",
  title: "Apply UI overrides",
  run: async (state) => {
    const repoPath = state.data.localRepoPath;
    if (!repoPath) {
      console.log("Missing repo path. Restart bootstrap.");
      return { completed: false, exit: true };
    }

    applyUiOverrides(state);
    return { completed: true };
  }
};

const stepLegalDocs: Step = {
  id: "legal-docs",
  title: "Generate legal pages",
  run: async (state, ask) => {
    const repoPath = state.data.localRepoPath;
    if (!repoPath) {
      console.log("Missing repo path. Restart bootstrap.");
      return { completed: false, exit: true };
    }

    if (!state.data.legalProfile) {
      console.log("Missing legal profile. Restart bootstrap.");
      return { completed: false, exit: true };
    }

    const { localesNeedingAgent } = writeLegalDocs(state);

    if (localesNeedingAgent.length > 0) {
      console.log("Locales require agent translation:");
      for (const locale of localesNeedingAgent) console.log(`- ${locale}`);
      console.log("Please translate content/legal/en into these locales.");
      await ask("Press Enter once translations are complete.");
    }

    return { completed: true };
  }
};

const stepInfra: Step = {
  id: "infra",
  title: "Provision GitHub / Vercel / Supabase",
  run: async (state, ask) => {
    const project = state.data.project;
    const scopes = state.data.scopes;
    const legal = state.data.legal;

    if (!project || !scopes || !legal) {
      console.log("Missing configuration. Restart bootstrap.");
      return { completed: false, exit: true };
    }

    const repoFullName = `${scopes.githubOwner}/${project.slug}`;

    while (true) {
      const exists = runCommand(
        "gh",
        ["repo", "view", repoFullName, "--json", "name"],
        { env: ghEnv() }
      ).ok;

      if (exists) {
        state.flags.githubRepoCreated = true;
        break;
      }

      const createRepo = await askYesNo(ask, `Create GitHub repo ${repoFullName}?`);
      if (!createRepo) {
        const skip = await askYesNo(ask, "Skip GitHub repo creation for now?");
        if (skip) break;
        continue;
      }

      const visibility = (
        await askValidated(
          ask,
          "Repo visibility (private/public)",
          (value) => ["private", "public"].includes(value.toLowerCase()),
          { defaultValue: "private" }
        )
      ).toLowerCase();

      const args = ["repo", "create", repoFullName, `--${visibility}`, "--confirm"];
      if (project.description) args.push("--description", project.description);
      const res = runCommand("gh", args, { env: ghEnv(), inherit: true });
      if (!res.ok) {
        console.log("GitHub repo creation failed. Fix and retry.");
        continue;
      }

      state.flags.githubRepoCreated = true;
      break;
    }

    const vercelProjects = [`${project.slug}-staging`, `${project.slug}-prod`];
    const vercelScope = scopes.vercelScope;
    for (const name of vercelProjects) {
      while (true) {
        const list = runCommand(
          "vercel",
          ["project", "ls", "--json", ...vercelArgs(vercelScope)],
          { env: vercelEnv() }
        );

        if (list.ok) {
          try {
            const parsed = JSON.parse(list.stdout) as Array<{ name?: string }>;
            if (parsed.some((item) => item.name === name)) break;
          } catch {
            // ignore parse errors
          }
        }

        console.log(`Create Vercel project: ${name}`);
        console.log("When prompted, enter the project name exactly.");
        const res = runCommand(
          "vercel",
          ["project", "add", ...vercelArgs(vercelScope)],
          { env: vercelEnv(), inherit: true }
        );

        if (!res.ok) {
          console.log("Vercel project creation failed. Fix and retry.");
          continue;
        }

        const ok = await askYesNo(ask, `Was ${name} created?`);
        if (ok) break;
      }
    }

    const supabaseProjects = [
      { name: `${project.slug}-staging`, key: "staging" },
      { name: `${project.slug}-prod`, key: "prod" }
    ] as const;

    state.data.supabaseRefs ||= {};

    for (const entry of supabaseProjects) {
      const alreadySet = state.data.supabaseRefs?.[entry.key];
      if (alreadySet) continue;

      while (true) {
        console.log(`Create Supabase project: ${entry.name}`);
        console.log("Supabase CLI will ask for a database password.");
        const res = runCommand(
          "supabase",
          [
            "projects",
            "create",
            entry.name,
            "--org-id",
            scopes.supabaseOrg,
            "--region",
            scopes.supabaseRegion || "eu-west-1"
          ],
          { env: supabaseEnv(), inherit: true }
        );

        if (!res.ok) {
          console.log("Supabase project creation failed. Fix and retry.");
          continue;
        }

        const ref = await askRequired(
          ask,
          `Paste Supabase project ref for ${entry.name}`
        );
        state.data.supabaseRefs[entry.key] = ref;
        break;
      }
    }

    // Vercel env var for legal mode (optional)
    const setLegal = await askYesNo(
      ask,
      "Set NEXT_PUBLIC_LEGAL_MODE on Vercel projects now?"
    );
    if (setLegal) {
      for (const name of vercelProjects) {
        console.log(`Setting NEXT_PUBLIC_LEGAL_MODE on ${name}`);
        console.log(`When prompted, enter value: ${legal.mode}`);
        runCommand(
          "vercel",
          ["env", "add", "NEXT_PUBLIC_LEGAL_MODE", "production", ...vercelArgs(vercelScope)],
          {
            env: vercelEnv(),
            inherit: true
          }
        );
      }
    }

    return { completed: true };
  }
};

const stepGitRemote: Step = {
  id: "git-remote",
  title: "Connect git remote and push branches",
  run: async (state, ask) => {
    const repoPath = state.data.localRepoPath;
    const project = state.data.project;
    const scopes = state.data.scopes;

    if (!repoPath || !project || !scopes) {
      console.log("Missing repo path or scopes. Restart bootstrap.");
      return { completed: false, exit: true };
    }

    const repoFullName = `${scopes.githubOwner}/${project.slug}`;
    const view = runCommand(
      "gh",
      ["repo", "view", repoFullName, "--json", "sshUrl,url"],
      { env: ghEnv() }
    );

    if (!view.ok) {
      console.log("GitHub repo not found or gh auth failed.");
      return { completed: false, exit: true };
    }

    let sshUrl = "";
    let httpsUrl = "";
    try {
      const parsed = JSON.parse(view.stdout) as { sshUrl?: string; url?: string };
      sshUrl = parsed.sshUrl || "";
      httpsUrl = parsed.url || "";
    } catch {
      console.log("Failed to parse GitHub repo info.");
      return { completed: false, exit: true };
    }

    const useSsh = await askYesNo(ask, "Use SSH for git remote? (y = SSH, n = HTTPS)");
    const remoteUrl = useSsh ? sshUrl : httpsUrl;

    if (!remoteUrl) {
      console.log("No remote URL available. Fix and retry.");
      return { completed: false, exit: true };
    }

    const existingRemote = runCommand("git", ["remote", "get-url", "origin"], {
      cwd: repoPath
    });
    if (existingRemote.ok) {
      const replace = await askYesNo(
        ask,
        `Remote 'origin' already set. Replace with ${remoteUrl}?`
      );
      if (replace) {
        runCommand("git", ["remote", "set-url", "origin", remoteUrl], {
          cwd: repoPath,
          inherit: true
        });
      }
    } else {
      runCommand("git", ["remote", "add", "origin", remoteUrl], {
        cwd: repoPath,
        inherit: true
      });
    }

    while (true) {
      const pushMain = runCommand("git", ["push", "-u", "origin", "main"], {
        cwd: repoPath,
        inherit: true
      });
      const pushDevelop = runCommand("git", ["push", "-u", "origin", "develop"], {
        cwd: repoPath,
        inherit: true
      });
      if (pushMain.ok && pushDevelop.ok) break;

      const retry = await askYesNo(
        ask,
        "Git push failed. Fix credentials and retry?"
      );
      if (!retry) break;
    }

    return { completed: true };
  }
};

const stepSummary: Step = {
  id: "summary",
  title: "Review and generate TODO",
  run: async (state, ask) => {
    const { project, domains, scopes, appParams, i18n, legal, legalProfile, uiRefs } = state.data;
    console.log("Summary:");
    console.log(`- App name: ${project?.appName ?? "TBD"}`);
    console.log(`- Slug / Repo: ${project?.slug ?? "TBD"}`);
    console.log(`- Root domain: ${domains?.rootDomain ?? "TBD"}`);
    console.log(`- Staging domain: ${domains?.stagingDomain ?? "TBD"}`);
    console.log(`- Production domain: ${domains?.prodDomain ?? "TBD"}`);
    console.log(`- Local repo path: ${state.data.localRepoPath ?? "TBD"}`);
    console.log(`- GitHub owner: ${scopes?.githubOwner ?? "TBD"}`);
    console.log(`- Vercel scope: ${scopes?.vercelScope ?? "TBD"}`);
    console.log(`- Supabase org: ${scopes?.supabaseOrg ?? "TBD"}`);
    console.log(`- Supabase region: ${scopes?.supabaseRegion ?? "TBD"}`);
    console.log(`- Public app name: ${appParams?.publicAppName ?? "TBD"}`);
    console.log(`- Support email: ${appParams?.supportEmail ?? "TBD"}`);
    console.log(`- Primary color: ${appParams?.primaryColor ?? "TBD"}`);
    console.log(`- Logo URL: ${appParams?.logoUrl || "TBD"}`);
    console.log(`- Locales: ${(i18n?.supportedLocales ?? ["en"]).join(", ")}`);
    console.log(`- Default locale: ${i18n?.defaultLocale ?? "en"}`);
    console.log(`- Legal mode: ${legal?.mode ?? "web"}`);
    if (legalProfile) {
      console.log(`- Jurisdiction: ${legalProfile.jurisdiction}`);
      console.log(`- App type: ${legalProfile.appType}`);
      console.log(`- Data collected: ${legalProfile.dataCollected.join(", ")}`);
      console.log(`- Analytics: ${legalProfile.analyticsEnabled ? "yes" : "no"}`);
      console.log(`- Payments: ${legalProfile.payments ? "yes" : "no"}`);
      console.log(`- UGC: ${legalProfile.userGeneratedContent ? "yes" : "no"}`);
    }
    if (uiRefs) {
      console.log(`- Figma URL: ${uiRefs.figmaUrl}`);
      console.log(`- Screenshots: ${uiRefs.screenshots.join(", ")}`);
    }
    if (state.data.supabaseRefs?.staging || state.data.supabaseRefs?.prod) {
      console.log(
        `- Supabase refs: staging=${state.data.supabaseRefs?.staging ?? "TBD"}, prod=${state.data.supabaseRefs?.prod ?? "TBD"}`
      );
    }

    const ok = await askYesNo(ask, "Confirm and generate APP_TODO.md?");
    if (!ok) {
      console.log("Aborted. Delete .bootstrap/state.json to restart.");
      return { completed: false, exit: true };
    }

    writeAppTodo(state);
    return { completed: true };
  }
};

const stepFinish: Step = {
  id: "finish",
  title: "Bootstrap summary",
  run: async () => {
    console.log("Base bootstrap complete. Next: infra automation steps.");
    return { completed: true };
  }
};

async function main() {
  const state = loadState();
  const ask = await makeAskFn();

  const steps: Step[] = [
    stepSkills,
    stepCliCheck,
    stepTokens,
    stepProjectInfo,
    stepDomains,
    stepScopes,
    stepAppParams,
    stepI18n,
    stepLegal,
    stepLegalProfile,
    stepLocalRepo,
    stepUiRefs,
    stepUiSync,
    stepLegalDocs,
    stepInfra,
    stepGitRemote,
    stepSummary,
    stepFinish
  ];

  for (const step of steps) {
    if (isStepCompleted(state, step.id)) continue;

    console.log(`\n== ${step.title} ==`);
    const result = await step.run(state, ask);
    if (result.completed) {
      markStepCompleted(state, step.id);
      saveState(state);
    }

    if (result.exit) {
      process.exit(0);
    }
  }

  console.log("Bootstrap complete.");
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});

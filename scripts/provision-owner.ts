import {
  provisionOwner,
  hashOwnerPassword,
  validateOwnerEmail,
  validatePasswordStrength,
  auditDatabaseState,
} from "../src/lib/auth/provision";
import { prisma } from "../src/lib/db";

function parseArgs(): {
  email?: string;
  name?: string;
  password?: string;
  hashOnly?: string;
  auditOnly: boolean;
  help: boolean;
} {
  const args = process.argv.slice(2);
  const result: {
    email?: string;
    name?: string;
    password?: string;
    hashOnly?: string;
    auditOnly: boolean;
    help: boolean;
  } = {
    auditOnly: false,
    help: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--help" || arg === "-h") {
      result.help = true;
    } else if (arg === "--audit-only") {
      result.auditOnly = true;
    } else if (arg === "--email" && i + 1 < args.length) {
      result.email = args[++i];
    } else if (arg === "--name" && i + 1 < args.length) {
      result.name = args[++i];
    } else if (arg === "--password" && i + 1 < args.length) {
      result.password = args[++i];
    } else if (arg === "--hash-only" && i + 1 < args.length) {
      result.hashOnly = args[++i];
    }
  }

  return result;
}

function printHelp(): void {
  console.log(`
AkShelf Production Owner Provisioning Tool
===========================================

Usage:
  npx tsx scripts/provision-owner.ts [options]
  npm run db:provision [-- options]

Options:
  --email <email>         Owner email address (default: process.env.OWNER_EMAIL or owner@akshelf.local)
  --name <name>           Owner display name (default: process.env.OWNER_NAME or 'AkShelf Owner')
  --password <password>   Generate bcrypt hash and provision owner in one step
  --hash-only <password>  Generate and display bcrypt hash without touching the database
  --audit-only            Audit database contents without making any modifications
  --help, -h              Show this help message

Examples:
  # 1. Provision owner using environment variables (.env.local / Vercel)
  npm run db:provision

  # 2. Generate a bcrypt hash for your secret password
  npm run db:provision -- --hash-only "MySecretPassword123!"

  # 3. Provision owner with custom email and password
  npm run db:provision -- --email me@domain.com --password "MySecretPassword123!"

  # 4. Check if the database has 0 dummy records
  npm run db:provision -- --audit-only
`);
}

async function main() {
  const options = parseArgs();

  if (options.help) {
    printHelp();
    return;
  }

  // Handle hash-only mode (safe offline generation)
  if (options.hashOnly) {
    const password = options.hashOnly;
    const strength = validatePasswordStrength(password);
    if (!strength.valid) {
      console.error(`❌ Password error: ${strength.error}`);
      process.exit(1);
    }

    const { rawHash, escapedHash } = await hashOwnerPassword(password, 10);
    console.log(`\n🔑 Password Bcrypt Hash Generated Successfully:`);
    console.log(`----------------------------------------------------------------`);
    console.log(`Raw Hash:     ${rawHash}`);
    console.log(`Escaped Hash: ${escapedHash}  (Recommended for .env.local and Vercel)`);
    console.log(`----------------------------------------------------------------`);
    console.log(`\nAdd this to your environment variables:`);
    console.log(`OWNER_PASSWORD_HASH="${escapedHash}"\n`);
    return;
  }

  // Handle audit-only mode
  if (options.auditOnly) {
    console.log(`🔍 Auditing AkShelf database state...`);
    const audit = await auditDatabaseState(prisma);
    console.log(`\n📊 Database Record Summary:`);
    console.log(`   - Users:              ${audit.users}`);
    console.log(`   - Titles:             ${audit.titles}`);
    console.log(`   - User Titles:        ${audit.userTitles}`);
    console.log(`   - Seasons:            ${audit.seasons}`);
    console.log(`   - Episodes:           ${audit.episodes}`);
    console.log(`   - User Episodes:      ${audit.userEpisodes}`);
    console.log(`   - Watch History:      ${audit.watchHistory}`);

    if (audit.isCleanProduction) {
      console.log(`\n✅ Database status: Clean production-ready (0 mock catalog titles).`);
    } else {
      console.log(`\nℹ️ Database contains existing titles/records.`);
      console.log(`   If you need a blank slate, run: npm run db:clean`);
    }
    return;
  }

  // Standard provisioning flow
  const email = (options.email || process.env.OWNER_EMAIL || "owner@akshelf.local").trim();
  const name = (options.name || process.env.OWNER_NAME || "AkShelf Owner").trim();

  if (!validateOwnerEmail(email)) {
    console.error(`❌ Invalid owner email address: "${email}"`);
    process.exit(1);
  }

  console.log(`🚀 AkShelf Production Provisioning Pass`);
  console.log(`========================================`);

  // If a plaintext password was supplied via CLI or OWNER_PASSWORD
  const plaintextPassword = options.password || process.env.OWNER_PASSWORD;
  if (plaintextPassword) {
    const strength = validatePasswordStrength(plaintextPassword);
    if (!strength.valid) {
      console.error(`❌ Password error: ${strength.error}`);
      process.exit(1);
    }

    const { rawHash, escapedHash } = await hashOwnerPassword(plaintextPassword, 10);
    console.log(`\n🔑 Computed Bcrypt Hash:`);
    console.log(`   Raw Hash:     ${rawHash}`);
    console.log(`   Escaped Hash: ${escapedHash}`);
    console.log(`\nMake sure to set in your Vercel or production .env:`);
    console.log(`OWNER_EMAIL="${email}"`);
    console.log(`OWNER_PASSWORD_HASH="${escapedHash}"\n`);
  } else if (!process.env.OWNER_PASSWORD_HASH) {
    console.warn(`\n⚠️  Notice: OWNER_PASSWORD_HASH is not currently defined in environment.`);
    console.warn(
      `   Run 'npm run db:provision -- --hash-only "<password>"' to generate your hash.`,
    );
  }

  // Provision owner in PostgreSQL
  console.log(`👤 Provisioning owner record in PostgreSQL...`);
  const result = await provisionOwner({
    email,
    name,
    prismaClient: prisma,
  });

  if (result.created) {
    console.log(`✨ Created new owner account: ${result.user.email} (ID: ${result.user.id})`);
  } else {
    console.log(`ℹ️ Existing owner account verified: ${result.user.email} (ID: ${result.user.id})`);
  }

  // Audit database
  const audit = await auditDatabaseState(prisma);
  console.log(`\n📊 Post-Provisioning Audit:`);
  console.log(`   - Users:              ${audit.users}`);
  console.log(`   - Catalog Titles:     ${audit.titles}`);
  console.log(`   - User Titles:        ${audit.userTitles}`);
  console.log(`   - Watch History:      ${audit.watchHistory}`);

  if (audit.isCleanProduction) {
    console.log(`\n🛡️ Zero-pollution verified: Database has 0 dummy catalog records.`);
    console.log(`🚀 Ready for production deployment!`);
  } else {
    console.log(`\nℹ️ Database contains existing catalog records (${audit.titles} titles).`);
    console.log(`   To wipe dummy data for production launch, run: npm run db:clean`);
  }
}

main()
  .catch((err) => {
    console.error("❌ Provisioning failed with error:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

// Seed script for local/dev environments.
// Run with: npx tsx prisma/seed.ts  (or npm run db:seed)
//
// Everything here is written as upserts keyed on each model's unique
// constraint, so the script is safe to re-run repeatedly.

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

interface Summary {
  created: string[];
  skipped: string[];
}

const summary: Summary = { created: [], skipped: [] };

async function seedAdminUser() {
  const email = "admin@example.com";
  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing) {
    summary.skipped.push(`User ${email} (already exists)`);
    return;
  }

  const passwordHash = await bcrypt.hash("ChangeMe123!", 12);

  await prisma.user.create({
    data: {
      email,
      passwordHash,
      displayName: "Admin",
      isActive: true,
    },
  });

  summary.created.push(`User ${email}`);
}

interface LookupSeed {
  category: string;
  value: string;
  label: string;
  sortOrder: number;
}

function buildLookupSeeds(): LookupSeed[] {
  const seeds: LookupSeed[] = [];

  const clientTypes: [string, string][] = [
    ["SHIPPER", "Shipper"],
    ["CONSIGNEE", "Consignee"],
    ["BROKER", "Broker"],
    ["AGENT", "Agent"],
    ["CARRIER", "Carrier"],
    ["CUSTOMER", "Customer"],
  ];
  clientTypes.forEach(([value, label], i) =>
    seeds.push({ category: "CLIENT_TYPE", value, label, sortOrder: i })
  );

  const containerTypes: [string, string][] = [
    ["20DV", "20' Dry Van"],
    ["40DV", "40' Dry Van"],
    ["40HC", "40' High Cube"],
    ["53TRAILER", "53' Trailer"],
    ["FLATBED", "Flatbed"],
  ];
  containerTypes.forEach(([value, label], i) =>
    seeds.push({ category: "CONTAINER_TYPE", value, label, sortOrder: i })
  );

  const pieceTypes: [string, string][] = [
    ["PALLET", "Pallet"],
    ["CRATE", "Crate"],
    ["DRUM", "Drum"],
    ["CARTON", "Carton"],
    ["SKID", "Skid"],
  ];
  pieceTypes.forEach(([value, label], i) =>
    seeds.push({ category: "PIECE_TYPE", value, label, sortOrder: i })
  );

  const chargeCodes: [string, string][] = [
    ["FRT", "Freight"],
    ["FSC", "Fuel Surcharge"],
    ["ACC", "Accessorial"],
    ["DET", "Detention"],
    ["THC", "Terminal Handling"],
  ];
  chargeCodes.forEach(([value, label], i) =>
    seeds.push({ category: "CHARGE_CODE", value, label, sortOrder: i })
  );

  const currencies: [string, string][] = [
    ["USD", "US Dollar"],
    ["CAD", "Canadian Dollar"],
    ["MXN", "Mexican Peso"],
  ];
  currencies.forEach(([value, label], i) =>
    seeds.push({ category: "CURRENCY", value, label, sortOrder: i })
  );

  return seeds;
}

async function seedLookupValues() {
  const seeds = buildLookupSeeds();

  for (const seed of seeds) {
    const existing = await prisma.lookupValue.findUnique({
      where: { category_value: { category: seed.category, value: seed.value } },
    });

    if (existing) {
      summary.skipped.push(`LookupValue ${seed.category}/${seed.value} (already exists)`);
      continue;
    }

    await prisma.lookupValue.create({
      data: {
        category: seed.category,
        value: seed.value,
        label: seed.label,
        sortOrder: seed.sortOrder,
        isActive: true,
      },
    });

    summary.created.push(`LookupValue ${seed.category}/${seed.value}`);
  }
}

async function main() {
  console.log("Seeding database...\n");

  await seedAdminUser();
  await seedLookupValues();
  await seedLocations();
  await seedChargeCodeQboMaps();

  console.log("Created:");
  if (summary.created.length === 0) {
    console.log("  (nothing new)");
  } else {
    summary.created.forEach((line) => console.log(`  + ${line}`));
  }

  console.log("\nSkipped (already existed):");
  if (summary.skipped.length === 0) {
    console.log("  (nothing skipped)");
  } else {
    summary.skipped.forEach((line) => console.log(`  = ${line}`));
  }

  console.log("\nSeed complete.");
}

async function seedLocations() {
  const locations: { name: string; city: string; state: string; country: string }[] = [
    { name: "Los Angeles, CA", city: "Los Angeles", state: "CA", country: "US" },
    { name: "Chicago, IL", city: "Chicago", state: "IL", country: "US" },
    { name: "Newark, NJ", city: "Newark", state: "NJ", country: "US" },
    { name: "Houston, TX", city: "Houston", state: "TX", country: "US" },
    { name: "Atlanta, GA", city: "Atlanta", state: "GA", country: "US" },
    { name: "Dallas, TX", city: "Dallas", state: "TX", country: "US" },
  ];

  for (const loc of locations) {
    const existing = await prisma.location.findFirst({ where: { name: loc.name } });

    if (existing) {
      summary.skipped.push(`Location ${loc.name} (already exists)`);
      continue;
    }

    await prisma.location.create({
      data: {
        name: loc.name,
        city: loc.city,
        state: loc.state,
        country: loc.country,
        isActive: true,
      },
    });

    summary.created.push(`Location ${loc.name}`);
  }
}

/**
 * Deliberately does NOT seed a ChargeCodeQboItemMap row. This used to seed
 * placeholder mappings (chargeCode -> fake QBO Item ids "1".."5") for local
 * dev convenience, but those ids happened to collide with real, unrelated
 * Items in the connected QBO company — invoices synced "successfully" onto
 * the wrong Product/Service with no visible error. The single default item
 * ("Trucking" — see DEFAULT_QBO_ITEM_KEY in src/lib/qbo.ts) must be set
 * explicitly per environment/company via /quickbooks/charge-codes, where the
 * real QBO Item id is picked from a live list rather than guessed.
 */
async function seedChargeCodeQboMaps() {}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

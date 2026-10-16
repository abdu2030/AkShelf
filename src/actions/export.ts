"use server";

import { auth } from "@/lib/auth";
import {
  generateJsonExport,
  restoreFromJson,
  verifySchemaConsistency,
} from "@/lib/export/export-service";
import { RestoreResult } from "@/lib/export/types";
import { revalidatePath } from "next/cache";

export async function verifyBackupAction(rawData: unknown): Promise<{
  valid: boolean;
  errors: string[];
}> {
  return verifySchemaConsistency(rawData);
}

export async function restoreBackupAction(rawData: unknown): Promise<RestoreResult> {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return {
      success: false,
      titlesRestored: 0,
      episodesRestored: 0,
      historyRestored: 0,
      errors: ["You must be signed in as the owner to restore backups."],
    };
  }

  const result = await restoreFromJson(userId, rawData);

  if (result.success) {
    revalidatePath("/library");
    revalidatePath("/history");
    revalidatePath("/watchlist");
    revalidatePath("/");
    revalidatePath("/settings");
  }

  return result;
}

export async function getBackupDataAction() {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    throw new Error("Unauthorized");
  }

  return generateJsonExport(userId);
}

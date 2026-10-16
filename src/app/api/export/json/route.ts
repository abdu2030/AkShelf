import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { generateJsonExport } from "@/lib/export/export-service";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const data = await generateJsonExport(userId);
    const dateStr = new Date().toISOString().split("T")[0];
    const filename = `akshelf-backup-${dateStr}.json`;

    return new NextResponse(JSON.stringify(data, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
      },
    });
  } catch (error: unknown) {
    console.error("[ExportAPI:JSON] Failed to generate export:", error);
    return NextResponse.json({ error: "Failed to generate JSON backup." }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { generateCsvExport } from "@/lib/export/export-service";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const csvContent = await generateCsvExport(userId);
    const dateStr = new Date().toISOString().split("T")[0];
    const filename = `akshelf-library-${dateStr}.csv`;

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
      },
    });
  } catch (error: unknown) {
    console.error("[ExportAPI:CSV] Failed to generate export:", error);
    return NextResponse.json({ error: "Failed to generate CSV export." }, { status: 500 });
  }
}

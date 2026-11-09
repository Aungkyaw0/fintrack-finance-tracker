import { NextRequest, NextResponse } from "next/server";
import { writeFile } from "fs/promises";
import path from "path";
import crypto from "crypto";
import { getCurrentUser } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const data = await request.formData();
    const file: File | null = data.get("file") as unknown as File;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Get extension and generate unique file name
    const ext = file.name.split(".").pop() || "jpg";
    const uniqueId = crypto.randomBytes(16).toString("hex");
    const filename = `${Date.now()}-${uniqueId}.${ext}`;

    const uploadDir = path.join(process.cwd(), "public", "images", "uploads");
    const filepath = path.join(uploadDir, filename);

    await writeFile(filepath, buffer);

    const publicUrl = `/images/uploads/${filename}`;
    return NextResponse.json({ success: true, url: publicUrl });
  } catch (error) {
    console.error("Upload failed:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}


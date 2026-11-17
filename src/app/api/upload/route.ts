import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { getCurrentUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";

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

    const supabase = await createAdminClient();

    // Upload to Supabase Storage bucket 'uploads'
    const { error: uploadError } = await supabase.storage
      .from("uploads")
      .upload(filename, buffer, {
        contentType: file.type || "image/jpeg",
        upsert: true,
      });

    if (uploadError) {
      console.error("Supabase storage upload error:", uploadError);
      return NextResponse.json(
        { error: uploadError.message || "Failed to upload image" },
        { status: 500 }
      );
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("uploads").getPublicUrl(filename);

    return NextResponse.json({ success: true, url: publicUrl });
  } catch (error) {
    console.error("Upload failed:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}

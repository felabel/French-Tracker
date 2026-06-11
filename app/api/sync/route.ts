import { kv } from "@vercel/kv";
import { NextRequest, NextResponse } from "next/server";
import { SyncBlob } from "@/lib/types";

function kvKey(syncId: string): string {
  return `sync:${syncId}`;
}

function isValidSyncId(syncId: string): boolean {
  return /^[a-zA-Z0-9_-]{4,64}$/.test(syncId);
}

export async function GET(req: NextRequest) {
  const syncId = req.nextUrl.searchParams.get("syncId");
  if (!syncId || !isValidSyncId(syncId)) {
    return NextResponse.json({ error: "Invalid sync ID" }, { status: 400 });
  }

  try {
    const blob = await kv.get<SyncBlob>(kvKey(syncId));
    if (!blob) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json(blob);
  } catch {
    return NextResponse.json(
      { error: "KV not configured. Add Redis/KV integration on Vercel." },
      { status: 503 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = (await req.json()) as { syncId?: string; blob?: SyncBlob };
    const { syncId, blob } = body;

    if (!syncId || !isValidSyncId(syncId) || !blob || blob.version !== 1) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const key = kvKey(syncId);
    const existing = await kv.get<SyncBlob>(key);

    if (existing) {
      const existingTime = new Date(existing.updatedAt).getTime();
      const incomingTime = new Date(blob.updatedAt).getTime();
      if (incomingTime < existingTime - 1000) {
        return NextResponse.json(existing);
      }
    }

    blob.updatedAt = new Date().toISOString();
    await kv.set(key, blob);
    return NextResponse.json(blob);
  } catch {
    return NextResponse.json(
      { error: "KV not configured. Add Redis/KV integration on Vercel." },
      { status: 503 }
    );
  }
}

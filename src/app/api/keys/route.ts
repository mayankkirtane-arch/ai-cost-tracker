import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("api_keys")
    .select("id, provider, label, key_hint, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ keys: data });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { provider, api_key, label } = body;

  if (!provider || !api_key) {
    return NextResponse.json(
      { error: "Provider and API key are required" },
      { status: 400 }
    );
  }

  const validProviders = ["openai", "anthropic", "groq"];
  if (!validProviders.includes(provider)) {
    return NextResponse.json({ error: "Invalid provider" }, { status: 400 });
  }

  const encryptionKey = process.env.ENCRYPTION_KEY;
  if (!encryptionKey) {
    return NextResponse.json(
      { error: "Server encryption not configured" },
      { status: 500 }
    );
  }

  const keyHint = api_key.slice(-4);

  const { data, error } = await supabase.rpc("insert_api_key", {
    p_user_id: user.id,
    p_provider: provider,
    p_label: label || null,
    p_api_key: api_key,
    p_key_hint: keyHint,
    p_encryption_key: encryptionKey,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const inserted = Array.isArray(data) ? data[0] : data;
  return NextResponse.json({ key: inserted }, { status: 201 });
}

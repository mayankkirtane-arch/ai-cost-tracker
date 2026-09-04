import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const encryptionKey = process.env.ENCRYPTION_KEY;
  if (!encryptionKey) {
    return NextResponse.json(
      { error: "Server encryption key not configured" },
      { status: 500 }
    );
  }

  // Get optional key_id from body
  let keyId: string | undefined;
  try {
    const body = await request.json();
    keyId = body.key_id;
  } catch {
    // optional body
  }

  // Fetch user's anthropic keys
  let query = supabase
    .from("api_keys")
    .select("id, provider, label, key_hint")
    .eq("user_id", user.id)
    .eq("provider", "anthropic");

  if (keyId) {
    query = query.eq("id", keyId);
  }

  const { data: keys, error: keysError } = await query;

  if (keysError || !keys || keys.length === 0) {
    return NextResponse.json(
      { error: "No Anthropic API keys found. Please add a Claude API key first." },
      { status: 404 }
    );
  }

  const results: Array<{
    key_id: string;
    key_hint: string;
    status: "success" | "error";
    message?: string;
    record_count?: number;
  }> = [];

  // Default time range: past 30 days
  const startingAt = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  for (const k of keys) {
    // Decrypt key
    const { data: rawKey, error: decryptError } = await supabase.rpc(
      "get_decrypted_api_key",
      {
        p_key_id: k.id,
        p_user_id: user.id,
        p_encryption_key: encryptionKey,
      }
    );

    if (decryptError || !rawKey) {
      results.push({
        key_id: k.id,
        key_hint: k.key_hint,
        status: "error",
        message: "Failed to decrypt API key.",
      });
      continue;
    }

    // Fetch usage from Anthropic Admin API
    try {
      const url = `https://api.anthropic.com/v1/organizations/usage_report/messages?starting_at=${encodeURIComponent(startingAt)}&bucket_width=1d`;
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "x-api-key": rawKey,
          "anthropic-version": "2023-06-01",
          "Accept": "application/json",
        },
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        let errMsg = errJson.error?.message;

        if (response.status === 401 || response.status === 403 || !errMsg) {
          errMsg = "This key doesn't have permission to access usage data. Make sure you're using an Admin API key, or a personal/service key that isn't scoped to a specific workspace.";
        }

        results.push({
          key_id: k.id,
          key_hint: k.key_hint,
          status: "error",
          message: errMsg,
        });
        continue;
      }

      const usageData = await response.json();
      const buckets = usageData.data || [];
      let insertedCount = 0;

      for (const bucket of buckets) {
        const startTime = bucket.starting_at;
        const endTime = bucket.ending_at;

        for (const resItem of bucket.results || []) {
          const uncachedInput = resItem.uncached_input_tokens || 0;
          const cacheReadInput = resItem.cache_read_input_tokens || 0;
          const outputTokens = resItem.output_tokens || 0;

          await supabase.from("usage_logs").insert({
            user_id: user.id,
            api_key_id: k.id,
            provider: "anthropic",
            start_time: startTime,
            end_time: endTime,
            uncached_input_tokens: uncachedInput,
            cache_read_input_tokens: cacheReadInput,
            output_tokens: outputTokens,
            raw_data: resItem,
          });

          insertedCount++;
        }
      }

      results.push({
        key_id: k.id,
        key_hint: k.key_hint,
        status: "success",
        record_count: insertedCount,
        message: `Successfully fetched and saved ${insertedCount} usage record(s).`,
      });
    } catch (err: unknown) {
      results.push({
        key_id: k.id,
        key_hint: k.key_hint,
        status: "error",
        message: err instanceof Error ? err.message : "Network error calling Anthropic API",
      });
    }
  }

  return NextResponse.json({ results });
}

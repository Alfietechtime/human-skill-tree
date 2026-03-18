import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

const AFDIAN_USER_ID = process.env.AFDIAN_USER_ID ?? "";
const AFDIAN_API_TOKEN = process.env.AFDIAN_API_TOKEN ?? "";

// Plan ID → plan name mapping
const PLAN_MAP: Record<string, "basic" | "pro"> = {
  "6fff08e21c5f11f1861052540025c377": "basic",
  "8682e9c61c5f11f1ad885254001e7c00": "pro",
};

function getServiceSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

function verifyAfdianSign(
  token: string,
  userId: string,
  params: string
): string {
  const signStr = token + "params" + params + "ts" + userId + "user_id";
  return crypto.createHash("md5").update(signStr).digest("hex");
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (body.ec !== 200 || !body.data?.order) {
      return Response.json({ ec: 200 });
    }

    const order = body.data.order;
    const planId: string = order.plan_id;
    const planName = PLAN_MAP[planId];
    const amount = parseFloat(order.total_amount || "0");
    const txId = order.out_trade_no;

    if (!planName) {
      console.warn("[Afdian] Unknown plan_id:", planId);
      return Response.json({ ec: 200 });
    }

    // The user's remark should contain their app email
    const remark: string = (order.remark || "").trim();
    const emailMatch = remark.match(
      /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/
    );

    if (!emailMatch) {
      console.warn("[Afdian] No email in remark:", remark);
      return Response.json({ ec: 200 });
    }

    const email = emailMatch[0].toLowerCase();
    const supabase = getServiceSupabase();

    // Find user by email
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", email)
      .single();

    if (!profile) {
      console.warn("[Afdian] No user found for email:", email);
      return Response.json({ ec: 200 });
    }

    // Calculate expiration (order.month months from now)
    const months = order.month || 1;
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + months);

    // Upgrade user plan
    await supabase
      .from("profiles")
      .update({
        plan: planName,
        plan_expires_at: expiresAt.toISOString(),
      })
      .eq("id", profile.id);

    // Log payment
    await supabase.from("payments").insert({
      user_id: profile.id,
      amount,
      currency: "CNY",
      provider: "aifadian",
      provider_tx_id: txId,
      status: "completed",
    });

    console.log(
      `[Afdian] Upgraded ${email} to ${planName} until ${expiresAt.toISOString()}`
    );

    return Response.json({ ec: 200 });
  } catch (err) {
    console.error("[Afdian] Webhook error:", err);
    return Response.json({ ec: 200 });
  }
}

import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

const LS_WEBHOOK_SECRET = process.env.LEMONSQUEEZY_WEBHOOK_SECRET ?? "";

// LemonSqueezy variant ID → plan name mapping
// TODO: Replace with actual variant IDs after creating products
const VARIANT_MAP: Record<string, "basic" | "pro"> = {
  [process.env.LS_BASIC_VARIANT_ID ?? ""]: "basic",
  [process.env.LS_PRO_VARIANT_ID ?? ""]: "pro",
};

function getServiceSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

function verifySignature(rawBody: string, signature: string): boolean {
  if (!LS_WEBHOOK_SECRET) return false;
  const hmac = crypto
    .createHmac("sha256", LS_WEBHOOK_SECRET)
    .update(rawBody)
    .digest("hex");
  return crypto.timingSafeEqual(Buffer.from(hmac), Buffer.from(signature));
}

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-signature") ?? "";

    // Verify webhook signature
    if (LS_WEBHOOK_SECRET && !verifySignature(rawBody, signature)) {
      console.warn("[LemonSqueezy] Invalid signature");
      return new Response("Invalid signature", { status: 401 });
    }

    const body = JSON.parse(rawBody);
    const eventName: string = body.meta?.event_name ?? "";

    // Only process subscription-related events
    if (
      eventName !== "subscription_created" &&
      eventName !== "subscription_updated" &&
      eventName !== "order_created"
    ) {
      return Response.json({ ok: true });
    }

    const attrs = body.data?.attributes;
    if (!attrs) return Response.json({ ok: true });

    // Get email from the order/subscription
    const email = (
      attrs.user_email ||
      attrs.customer_email ||
      body.meta?.custom_data?.email ||
      ""
    )
      .trim()
      .toLowerCase();

    if (!email) {
      console.warn("[LemonSqueezy] No email found in webhook");
      return Response.json({ ok: true });
    }

    // Determine plan from variant ID
    const variantId = String(
      attrs.variant_id || attrs.first_order_item?.variant_id || ""
    );
    const planName = VARIANT_MAP[variantId];

    if (!planName) {
      console.warn("[LemonSqueezy] Unknown variant:", variantId);
      return Response.json({ ok: true });
    }

    const supabase = getServiceSupabase();

    // Find user by email
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", email)
      .single();

    if (!profile) {
      console.warn("[LemonSqueezy] No user found for email:", email);
      return Response.json({ ok: true });
    }

    // Handle subscription status
    const status = attrs.status;
    if (status === "expired" || status === "cancelled" || status === "unpaid") {
      // Downgrade to free
      await supabase
        .from("profiles")
        .update({ plan: "free", plan_expires_at: null })
        .eq("id", profile.id);
      console.log(`[LemonSqueezy] Downgraded ${email} to free`);
      return Response.json({ ok: true });
    }

    // Calculate expiration
    const renewsAt = attrs.renews_at || attrs.ends_at;
    const expiresAt = renewsAt ? new Date(renewsAt) : new Date();
    if (!renewsAt) {
      expiresAt.setMonth(expiresAt.getMonth() + 1);
    }

    // Upgrade user plan
    await supabase
      .from("profiles")
      .update({
        plan: planName,
        plan_expires_at: expiresAt.toISOString(),
      })
      .eq("id", profile.id);

    // Log payment for order_created events
    if (eventName === "order_created") {
      const amount = parseFloat(attrs.total || attrs.subtotal || "0") / 100;
      await supabase.from("payments").insert({
        user_id: profile.id,
        amount,
        currency: "USD",
        provider: "lemonsqueezy",
        provider_tx_id: String(body.data?.id || ""),
        status: "completed",
      });
    }

    console.log(
      `[LemonSqueezy] Upgraded ${email} to ${planName} until ${expiresAt.toISOString()}`
    );

    return Response.json({ ok: true });
  } catch (err) {
    console.error("[LemonSqueezy] Webhook error:", err);
    return Response.json({ ok: true }, { status: 200 });
  }
}

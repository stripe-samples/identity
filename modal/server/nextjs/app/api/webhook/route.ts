import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import Stripe from "stripe";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  let event: Stripe.Event;

  try {
    if (process.env.STRIPE_WEBHOOK_SECRET && signature) {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } else {
      event = JSON.parse(body) as Stripe.Event;
    }
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json(
      { error: "Webhook signature verification failed" },
      { status: 400 }
    );
  }

  const data = event.data;
  const eventType = event.type;

  switch (eventType) {
    case "identity.verification_session.verified": {
      // All the verification checks passed
      const verificationSession =
        data.object as Stripe.Identity.VerificationSession;
      console.log("Verification session verified:", verificationSession.id);
      break;
    }
    case "identity.verification_session.requires_input": {
      // At least one of the verification checks failed
      const verificationSession =
        data.object as Stripe.Identity.VerificationSession;

      console.log(
        "Verification check failed:",
        verificationSession.last_error?.reason
      );

      // Handle specific failure reasons
      switch (verificationSession.last_error?.code) {
        case "document_unverified_other": {
          // The document was invalid
          break;
        }
        case "document_expired": {
          // The document was expired
          break;
        }
        case "document_type_not_supported": {
          // Document type not supported
          break;
        }
        default: {
          // ...
        }
      }
      break;
    }
  }

  return NextResponse.json({ received: true });
}

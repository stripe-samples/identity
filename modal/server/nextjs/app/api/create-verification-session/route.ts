import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";

export async function POST() {
  try {
    const verificationSession =
      await stripe.identity.verificationSessions.create({
        type: "document",
        metadata: {
          user_id: "{{USER_ID}}",
        },
        // Additional options for configuring the verification session:
        // options: {
        //   document: {
        //     // Array of strings of allowed identity document types.
        //     allowed_types: ['driving_license'], // passport | id_card
        //
        //     // Collect an ID number and perform an ID number check with the
        //     // document's extracted name and date of birth.
        //     require_id_number: true,
        //
        //     // Disable image uploads, identity document images have to be captured
        //     // using the device's camera.
        //     require_live_capture: true,
        //
        //     // Capture a face image and perform a selfie check comparing a photo
        //     // ID and a picture of your user's face.
        //     require_matching_selfie: true,
        //   }
        // },
      });

    return NextResponse.json({
      client_secret: verificationSession.client_secret,
    });
  } catch (e) {
    console.error(e);
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: { message } }, { status: 400 });
  }
}

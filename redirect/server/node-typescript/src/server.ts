import env from 'dotenv';
import path from 'path';
// Replace if using a different env file or config.
env.config({ path: './.env' });

import bodyParser from 'body-parser';
import express from 'express';

import Stripe from 'stripe';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2020-08-27',
  appInfo: { // For sample support and debugging, not required for production:
    name: 'stripe-samples/identity/redirect',
    url: 'https://github.com/stripe-samples',
    version: '0.0.1',
  },
  typescript: true,
});

const app = express();
const resolve = path.resolve;

app.use(express.static(process.env.STATIC_DIR));
app.use(
  (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ): void => {
    if (req.originalUrl === '/webhook') {
      next();
    } else {
      bodyParser.json()(req, res, next);
    }
  }
);

app.get('/', (_: express.Request, res: express.Response): void => {
  // Serve checkout page.
  const indexPath = resolve(process.env.STATIC_DIR + '/index.html');
  res.sendFile(indexPath);
});

app.get('/config', (_: express.Request, res: express.Response): void => {
  // Serve checkout page.
  res.send({
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY
  });
});

app.post(
  '/create-verification-session',
  async (req: express.Request, res: express.Response): Promise<void> => {
    try {
      const verificationSession: Stripe.Identity.VerificationSession = await stripe.identity.verificationSessions.create({
        type: 'document',
        metadata: {
          user_id: '{{USER_ID}}',
        }
        // Additional options for configuring the verification session:
        // options: {
        //   document: {
        //     # Array of strings of allowed identity document types.
        //     allowed_types: ['driving_license'], # passport | id_card
        //
        //     # Collect an ID number and perform an ID number check with the
        //     # document’s extracted name and date of birth.
        //     require_id_number: true,
        //
        //     # Disable image uploads, identity document images have to be captured
        //     # using the device’s camera.
        //     require_live_capture: true,
        //
        //     # Capture a face image and perform a selfie check comparing a photo
        //     # ID and a picture of your user’s face.
        //     require_matching_selfie: true,
        //   }
        // },
      });

      // Send publishable key and PaymentIntent client_secret to client.
      res.redirect(303, verificationSession.url);
    } catch (e) {
      console.log(e);
      res.status(400).send({
        error: {
          message: e.message,
        }
      });
    }
  }
);

// Expose a endpoint as a webhook handler for asynchronous events.
// Configure your webhook in the stripe developer dashboard:
// https://dashboard.stripe.com/test/webhooks
app.post(
  '/webhook',
  // Use body-parser to retrieve the raw body as a buffer.
  bodyParser.raw({ type: 'application/json' }),
  async (req: express.Request, res: express.Response): Promise<void> => {
    // Retrieve the event by verifying the signature using the raw body and secret.
    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        req.headers['stripe-signature'],
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.log(`⚠️  Webhook signature verification failed.`);
      res.sendStatus(400);
      return;
    }

    // Extract the data from the event.
    const data: Stripe.Event.Data = event.data;
    const eventType: string = event.type;

    // Successfully constructed event
    switch (eventType) {
      case 'identity.verification_session.verified': {
        // All the verification checks passed
        const verificationSession: Stripe.Identity.VerificationSession = event.data.object as Stripe.Identity.VerificationSession;
        break;
      }
      case 'identity.verification_session.requires_input': {
        // At least one of the verification checks failed
        const verificationSession: Stripe.Identity.VerificationSession = event.data.object as Stripe.Identity.VerificationSession;

        console.log('Verification check failed: ' + verificationSession.last_error.reason);

        // Handle specific failure reasons
        switch (verificationSession.last_error.code) {
          case 'document_unverified_other': {
            // The document was invalid
            break;
          }
          case 'document_expired': {
            // The document was expired
            break;
          }
          case 'document_type_not_supported': {
            // document type not supported
            break;
          }
          default: {
            // ...
          }
        }
      }
    }

    res.sendStatus(200);
  }
);

app.listen(4242, (): void =>
  console.log(`Node server listening on port ${4242}!`)
);

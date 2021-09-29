package com.stripe.sample;

import java.util.HashMap;
import java.nio.file.Paths;

import static spark.Spark.get;
import static spark.Spark.post;
import static spark.Spark.staticFiles;
import static spark.Spark.port;

import com.google.gson.Gson;
import com.google.gson.annotations.SerializedName;

import com.stripe.Stripe;
import com.stripe.net.ApiResource;
import com.stripe.model.Event;
import com.stripe.model.EventDataObjectDeserializer;
import com.stripe.model.PaymentIntent;
import com.stripe.exception.*;
import com.stripe.net.Webhook;
import com.stripe.param.PaymentIntentCreateParams;

import io.github.cdimascio.dotenv.Dotenv;

public class Server {
  private static Gson gson = new Gson();

  static class CreatePaymentRequest {
    @SerializedName("currency")
    String currency;

    public String getCurrency() {
      return currency;
    }
  }

  static class ConfigResponse {
    private String publishableKey;

    public ConfigResponse(String publishableKey) {
      this.publishableKey = publishableKey;
    }
  }

  static class FailureResponse {
    private HashMap<String, String> error;

    public FailureResponse(String message) {
      this.error = new HashMap<String, String>();
      this.error.put("message", message);
    }
  }

  static class CreatePaymentResponse {
    private String clientSecret;

    public CreatePaymentResponse(String clientSecret) {
      this.clientSecret = clientSecret;
    }
  }

  public static void main(String[] args) {
    port(4242);
    Dotenv dotenv = Dotenv.load();

    Stripe.apiKey = dotenv.get("STRIPE_SECRET_KEY");

    // For sample support and debugging, not required for production:
    Stripe.setAppInfo(
        "stripe-samples/identity/redirect",
        "0.0.1",
        "https://github.com/stripe-samples");

    staticFiles.externalLocation(
        Paths.get(
          Paths.get("").toAbsolutePath().toString(),
          dotenv.get("STATIC_DIR")
          ).normalize().toString());

    get("/config", (request, response) -> {
      response.type("application/json");

      return gson.toJson(new ConfigResponse(dotenv.get("STRIPE_PUBLISHABLE_KEY")));
    });

    post("/create-payment-intent", (request, response) -> {
      response.type("application/json");

      CreatePaymentRequest postBody = gson.fromJson(request.body(), CreatePaymentRequest.class);

      PaymentIntentCreateParams createParams = new PaymentIntentCreateParams
        .Builder()
        .setCurrency(postBody.getCurrency())
        .setAmount(1999L)
        .build();

      try {
        // Create a PaymentIntent with the order amount and currency
        PaymentIntent intent = PaymentIntent.create(createParams);

        // Send PaymentIntent details to client
        return gson.toJson(new CreatePaymentResponse(intent.getClientSecret()));
      } catch(StripeException e) {
        response.status(400);
        return gson.toJson(new FailureResponse(e.getMessage()));
      } catch(Exception e) {
        response.status(500);
        return gson.toJson(e);
      }
    });

    post("/webhook", (request, response) -> {
      String payload = request.body();
      String sigHeader = request.headers("Stripe-Signature");
      String endpointSecret = dotenv.get("STRIPE_WEBHOOK_SECRET");

      Event event = null;

      try {
        event = Webhook.constructEvent(payload, sigHeader, endpointSecret);
      } catch (SignatureVerificationException e) {
        // Invalid signature
        response.status(400);
        return "";
      }

      switch(event.getType()) {
        case "identity.verification_session.verified":
          // All the verification checks passed
          if (dataObjectDeserializer.getObject().isPresent()) {
            verificationSession = (VerificationSession) dataObjectDeserializer.getObject().get();
          } else {
            // Deserialization failed, probably due to an API version mismatch.
            // Refer to the Javadoc documentation on `EventDataObjectDeserializer` for
            // instructions on how to handle this case, or return an error here.
          }
          break;
        case "identity.verification_session.requires_input":
          // At least one of the verification checks failed
          if (dataObjectDeserializer.getObject().isPresent()) {
            verificationSession = (VerificationSession) dataObjectDeserializer.getObject().get();

            switch(verificationSession.getLastError().getCode()) {
              case "document_unverified_other":
                // the document was invalid
                break;
              case "document_expired":
                // the document was expired
                break;
              case "document_type_not_supported":
                // document type not supported
                break;
              default:
                // ...
            }
          } else {
            // Deserialization failed, probably due to an API version mismatch.
            // Refer to the Javadoc documentation on `EventDataObjectDeserializer` for
            // instructions on how to handle this case, or return an error here.
          }
          break;
        default:
          // other event type
      }
      response.status(200);
      return "";
    });
  }
}

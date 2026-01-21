"use client";

import { useState } from "react";
import { getStripe } from "@/lib/get-stripe";

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleVerify = async () => {
    setLoading(true);
    setError(null);

    try {
      const stripe = await getStripe();
      if (!stripe) {
        throw new Error("Failed to load Stripe");
      }

      // Create the VerificationSession on the server
      const response = await fetch("/api/create-verification-session", {
        method: "POST",
      });
      const data = await response.json();

      if (data.error) {
        throw new Error(data.error.message);
      }

      // Open the modal on the client
      const { error: verifyError } = await stripe.verifyIdentity(
        data.client_secret
      );

      if (!verifyError) {
        window.location.href = "/submitted";
      } else {
        setError(verifyError.message || "Verification failed");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="w-full max-w-md">
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <h1 className="text-2xl font-bold mb-4">
            Verify your identity to book
          </h1>
          <h4 className="text-gray-600 mb-8">
            Get ready to take a photo of your ID and a selfie
          </h4>

          {error && (
            <div className="text-red-600 text-sm mb-4">{error}</div>
          )}

          <button
            onClick={handleVerify}
            disabled={loading}
            className="w-full bg-stripe-purple text-white py-3 rounded-md font-semibold hover:bg-opacity-90 disabled:opacity-50"
          >
            {loading ? "Loading..." : "Verify me"}
          </button>
        </div>
      </div>
    </main>
  );
}

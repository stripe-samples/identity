<?php
require '../vendor/autoload.php';

$dotenv = Dotenv\Dotenv::createImmutable(__DIR__ . '/..');
$dotenv->load();
?>
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Stripe Identity Sample</title>
    <meta name="description" content="A demo of Stripe Identity" />
    <script src="https://js.stripe.com/v3/"></script>
  </head>
  <body>
    <div class="sr-root">
      <div class="sr-main">
        <section class="container">
          <div>
            <h1>Verify your identity to book</h1>
            <h4>Get ready to take a photo of your ID and a selfie</h4>

            <button id="verify-button">Verify me</button>
          </div>
        </section>
      </div>
    </div>
    <script type="text/javascript">
      document.addEventListener('DOMContentLoaded', async () => {

        // Set your publishable key: remember to change this to your live publishable key in production
        // Find your keys here: https://dashboard.stripe.com/apikeys
        const stripe = Stripe('<?= $_ENV["STRIPE_PUBLISHABLE_KEY"] ?>');

        var verifyButton = document.getElementById('verify-button');
        verifyButton.addEventListener('click', async () => {
          // Get the VerificationSession client secret using the server-side
          // endpoint you created in step 3.

          try {

            // Create the VerificationSession on the server.
            const {client_secret} = await fetch('/create-verification-session.php', {
              method: 'POST',
            }).then(r => r.json())

            // Open the modal on the client.
            const {error} = await stripe.verifyIdentity(client_secret);
            if(!error) {
              window.location.href = '/submitted.html';
            } else {
              alert(error.message);
            }
          } catch(e) {
            alert(e.message);
          }
        })
      })
    </script>
  </body>
</html>

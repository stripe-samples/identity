<?php
require '../vendor/autoload.php';
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

            <form action="/create-verification-session.php" method="POST">
              <button type="submit">Verify me</button>
            </form>
          </div>
        </section>
      </div>
    </div>
  </body>
</html>

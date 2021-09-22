<?php
use Slim\Http\Request;
use Slim\Http\Response;
use Stripe\Stripe;

require 'vendor/autoload.php';

$dotenv = Dotenv\Dotenv::create(__DIR__);
$dotenv->load();

require './config.php';

$app = new \Slim\App;

// For demo purposes we're hardcoding the amount and currency here.
// Replace this with your own inventory/cart/order logic.
$purchase = ['amount' => 1099, 'currency' => 'USD'];

function createPurchase($items)
{
  // Extend this function with your logic to validate
  // the purchase details server-side and prevent
  // manipulation of price details on the client.
  global $purchase;
  return $purchase;
}

// Instantiate the logger as a dependency
$container = $app->getContainer();
$container['logger'] = function ($c) {
  $settings = $c->get('settings')['logger'];
  $logger = new Monolog\Logger($settings['name']);
  $logger->pushProcessor(new Monolog\Processor\UidProcessor());
  $logger->pushHandler(new Monolog\Handler\StreamHandler(__DIR__ . '/logs/app.log', \Monolog\Logger::DEBUG));
  return $logger;
};

$app->add(function ($request, $response, $next) {
    Stripe::setApiKey(getenv('STRIPE_SECRET_KEY'));
    Stripe::setApiVersion(getenv('STRIPE_API_VERSION'));
    return $next($request, $response);
});

$app->get('/', function (Request $request, Response $response, array $args) {   
  // Display checkout page
  return $response->write(file_get_contents(getenv('STATIC_DIR') . '/index.html'));
});

$app->get('/config', function (Request $request, Response $response, array $args) {
  global $purchase;
  $pub_key = getenv('STRIPE_PUBLISHABLE_KEY');
  return $response->withJson([ 
    'publishableKey' => $pub_key, 
    'purchase' => $purchase
  ]);
});

$app->post('/create-payment-intent', function (Request $request, Response $response, array $args) {
  $body = json_decode($request->getBody());

  // Create the payment details based on your logic.
  $purchase = createPurchase($body->items);
  // Create a PaymentIntent with the purchase amount and currency.
  $payment_intent = \Stripe\PaymentIntent::create([
    'amount' => $purchase['amount'],
    'currency' => $purchase['currency']
  ]);
  
  // Send the PaymentIntent client_secret to the client.
  return $response->withJson(array('clientSecret' => $payment_intent->client_secret));
});

$app->post('/webhook', function(Request $request, Response $response) {
    $logger = $this->get('logger');
    $event = $request->getParsedBody();
    // Parse the message body (and check the signature if possible)
    $webhookSecret = getenv('STRIPE_WEBHOOK_SECRET');
    if ($webhookSecret) {
      try {
        $event = \Stripe\Webhook::constructEvent(
          $request->getBody(),
          $request->getHeaderLine('stripe-signature'),
          $webhookSecret
        );
      } catch (\Exception $e) {
        return $response->withJson([ 'error' => $e->getMessage() ])->withStatus(403);
      }
    } else {
      $event = $request->getParsedBody();
    }
    $type = $event['type'];
    $object = $event['data']['object'];
  
    $logger->info('🔔  Webhook received! ' . $type);

    return $response->withJson([ 'status' => 'success' ])->withStatus(200);
});

$app->run();

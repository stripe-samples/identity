<?php

require_once 'shared.php';
header('Content-Type: application/json');

$input = file_get_contents('php://input');
$body = json_decode($input);
$event = null;

try {
  // Make sure the event is coming from Stripe by checking the signature header
  $event = \Stripe\Webhook::constructEvent(
    $input,
    $_SERVER['HTTP_STRIPE_SIGNATURE'],
    $_ENV['STRIPE_WEBHOOK_SECRET']
  );
}
catch (Exception $e) {
  http_response_code(403);
  echo json_encode([ 'error' => $e->getMessage() ]);
  exit;
}

if ($event->type == 'identity.verification_session.verified') {
  // All the verification checks passed
  $verification_session = event->data->object;
} elseif ($event->type == 'identity.verification_session.requires_input') {
  # At least one of the verification checks failed
  $verification_session = event->data->object;

  if ($verification_session->last_error->code == 'document_unverified_other') {
    # The document was invalid
  } elseif ($verification_session->last_error->code == 'document_expired') {
    # The document was expired
  } elseif $verification_session->last_error->code == 'document_type_not_suported') {
    # The document type was not supported
  } else {
    # ...
  }
}

echo json_encode(['status' => 'success']);

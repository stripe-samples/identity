<?php

require './shared.php';

if ($_SERVER['REQUEST_METHOD'] != 'POST') {
  echo 'Invalid request';
  exit;
}

$verification_session = $stripe->identity->verificationSessions->create([
  'type' => 'document',
  'metadata' => [
    'user_id' => '{{USER_ID}}',
  ]
]);

echo json_encode(['client_secret' => $verification_session->client_secret]);

<?php

require './shared.php';

if ($_SERVER['REQUEST_METHOD'] != 'POST') {
  echo 'Invalid request';
  exit;
}

$verification_session = $stripe->identity->verificationSessions->create([
  'type' => 'document',
  'metadata' => [
    // Replace with the ID of the user in your database.
    'user_id' => '{{USER_ID}}',
  ]
]);

echo json_encode(['client_secret' => $verification_session->client_secret]);

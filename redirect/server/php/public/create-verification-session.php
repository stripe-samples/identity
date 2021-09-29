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

header("HTTP/1.1 303 See Other");
header("Location: " . $verification_session->url);

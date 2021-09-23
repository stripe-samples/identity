# frozen_string_literal: true

require 'stripe'
require 'sinatra'
require 'dotenv'

# Replace if using a different env file or config
Dotenv.load

# For sample support and debugging, not required for production:
Stripe.set_app_info(
  'stripe-samples/<name-of-sample>/[<name-of-integration-type>]',
  version: '0.0.1',
  url: 'https://github.com/stripe-samples'
)
Stripe.api_version = '2020-08-27'
Stripe.api_key = ENV['STRIPE_SECRET_KEY']

set :static, true
set :public_folder, File.join(File.dirname(__FILE__), ENV['STATIC_DIR'])
set :port, 4242

get '/' do
  content_type 'text/html'
  send_file File.join(settings.public_folder, 'index.html')
end

get '/config' do
  content_type 'application/json'
  {
    publishableKey: ENV['STRIPE_PUBLISHABLE_KEY'],
  }.to_json
end

post '/create-verification-session' do
  content_type 'application/json'

  # See https://stripe.com/docs/api/identity/verification_sessions/create
  # for the full list of accepted parameters.
  verification_session = Stripe::Identity::VerificationSession.create({
    type: 'document', # or 'id_number', or 'address'
    metadata: {
      user_id: '{{USER_ID}}', # Optionally pass the ID of the user in your system.
    },

    # Additional options for configuring the verification session:
    # options: {
    #   document: {
    #     # Array of strings of allowed identity document types.
    #     allowed_types: ['driving_license'], # passport | id_card
    #
    #     # Collect an ID number and perform an ID number check with the
    #     # document's extracted name and date of birth.
    #     require_id_number: true,
    #
    #     # Disable image uploads, identity document images have to be captured
    #     # using the device's camera.
    #     require_live_capture: true,
    #
    #     # Capture a face image and perform a selfie check comparing a photo
    #     # ID and a picture of your user’s face.
    #     require_matching_selfie: true,
    #   }
    # },
  })

  redirect verification_session.url, 303
end

post '/webhook' do
  # You can use webhooks to receive information about asynchronous payment events.
  # For more about our webhook events check out https://stripe.com/docs/webhooks.
  webhook_secret = ENV['STRIPE_WEBHOOK_SECRET']
  payload = request.body.read
  if !webhook_secret.empty?
    # Retrieve the event by verifying the signature using the raw body and secret if webhook signing is configured.
    sig_header = request.env['HTTP_STRIPE_SIGNATURE']
    event = nil

    begin
      event = Stripe::Webhook.construct_event(
        payload, sig_header, webhook_secret
      )
    rescue JSON::ParserError => e
      # Invalid payload
      status 400
      return
    rescue Stripe::SignatureVerificationError => e
      # Invalid signature
      puts '⚠️  Webhook signature verification failed.'
      status 400
      return
    end
  else
    data = JSON.parse(payload, symbolize_names: true)
    event = Stripe::Event.construct_from(data)
  end

  case event.type
  when 'identity.verification_session.requires_input'
    verification_session = event.data.object
    puts " ❌ Identity requires input from user: #{verification_session.id}"
  when 'identity.verification_session.verified'
    verification_session = event.data.object
    puts " ✅ Identity verified: #{verification_session.id}"
  when 'identity.verification_session.canceled', 'identity.verification_session.created', 'identity.verification_session.processing'
    verification_session = event.data.object
    puts " 🟡 #{event.type}: #{verification_session.id}"
  end

  content_type 'application/json'
  {
    status: 'success'
  }.to_json
end

require_relative './spec_helper.rb'

RSpec.describe "identity integration" do
  it "serves the index route" do
    # Get the index html page
    response = get("/")
    expect(response).not_to be_nil
  end

  it "serves config with publishableKey" do
    resp = get_json("/config")
    expect(resp).to have_key("publishableKey")
    expect(resp['publishableKey']).to start_with("pk_test")
  end

  describe "/create-verification-session" do
    it "creates a VerificationSession" do
      response = RestClient.post(
        "#{SERVER_URL}/create-verification-session",
        {},
        {max_redirects: 0}
      )
      # RestClient will follow the redirect, but we can get the first response
      # RestClient will follow the redirect, but we can get the first response
      # from the server from the `history`.
      redirect_response = response.history.first

      # Asserts the right HTTP status code for the redirect
      expect(redirect_response.code).to eq(303)

      # Pull's the Checkout session ID out of the Location header
      # to assert the right configuration on the created session.
      redirect_url = redirect_response.headers[:location]
      expect(redirect_url).to start_with("https://verify.stripe.com/start")
    end
  end
end

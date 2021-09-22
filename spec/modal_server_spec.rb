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
      resp, status = post_json("/create-verification-session", {})
      expect(status).to eq(200)
      expect(resp).to have_key("client_secret")
    end
  end
end

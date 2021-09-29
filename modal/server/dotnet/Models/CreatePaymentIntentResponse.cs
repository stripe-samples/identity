using Newtonsoft.Json;

public class CreateVerificationSessionResponse
{
  [JsonProperty("client_secret")]
  public string ClientSecret { get; set; }
}


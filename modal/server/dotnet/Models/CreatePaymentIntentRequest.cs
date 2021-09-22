using Newtonsoft.Json;

public class CreatePaymentIntentRequest
{
  [JsonProperty("currency")]
  public string Currency { get; set; }
}

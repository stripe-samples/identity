using System;
using System.Collections.Generic;
using System.IO;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using Stripe;
using Stripe.Identity;

namespace server.Controllers
{
    public class IdentityController : Controller
    {
        public readonly IOptions<StripeOptions> options;
        private readonly IStripeClient client;

        public IdentityController(IOptions<StripeOptions> options)
        {
            this.options = options;
            this.client = new StripeClient(this.options.Value.SecretKey);
        }

        [HttpGet("config")]
        public ConfigResponse GetConfig()
        {
            // return json: publishableKey (.env)
            return new ConfigResponse
            {
                PublishableKey = this.options.Value.PublishableKey,
            };
        }

        [HttpPost("create-verification-session")]
        public async Task<IActionResult> CreateVerificationSession()
        {
          var options = new VerificationSessionCreateOptions
          {
            Type = "document",
          };

          var service = new VerificationSessionService(this.client);

          try
          {
            var verificationSession = await service.CreateAsync(options);
            Response.Headers["Location"] = verificationSession.Url;
            return StatusCode(303);
          }
          catch (StripeException e)
          {
            return BadRequest(new { error = new { message = e.StripeError.Message}});
          }
          catch (System.Exception)
          {
            return BadRequest(new { error = new { message = "unknown failure: 500"}});
          }
        }

        [HttpPost("webhook")]
        public async Task<IActionResult> Webhook()
        {
            var json = await new StreamReader(HttpContext.Request.Body).ReadToEndAsync();
            Event stripeEvent;
            try
            {
                stripeEvent = EventUtility.ConstructEvent(
                    json,
                    Request.Headers["Stripe-Signature"],
                    this.options.Value.WebhookSecret
                );
                Console.WriteLine($"Webhook notification with type: {stripeEvent.Type} found for {stripeEvent.Id}");
            }
            catch (Exception e)
            {
                Console.WriteLine($"Something failed {e}");
                return BadRequest();
            }


            if (stripeEvent.Type == Events.IdentityVerificationSessionVerified) {
              var verificationSession = stripeEvent.Data.Object as VerificationSession;
              // All the verification checks passed

            } else if (stripeEvent.Type == Events.IdentityVerificationSessionRequiresInput) {
              var verificationSession = stripeEvent.Data.Object as VerificationSession;
              if (verificationSession.LastError.Code == "document_unverified_other") {
                // The document was invalid
              } else if (verificationSession.LastError.Code == "document_expired") {
                // The document was expired
              } else if (verificationSession.LastError.Code == "document_type_not_supported") {
                // The document type was not supported
              } else {
                // ...
              }
            }

            return Ok();
        }
    }
}

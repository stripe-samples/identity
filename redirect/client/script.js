// A reference to Stripe.js
let stripe;
let purchase;

fetch("/config")
  .then(function(result) {
    return result.json();
  })
  .then(function(data) {
    stripe = Stripe(data.publishableKey);
    purchase = data.purchase;
    // Show formatted price information.
    const price = (purchase.amount / 100).toFixed(2);
    const numberFormat = new Intl.NumberFormat(["en-US"], {
      style: "currency",
      currency: purchase.currency,
      currencyDisplay: "symbol"
    });
    document.getElementById("order-amount").innerText = numberFormat.format(
      price
    );

    // Set up Elements here

    // Handle form submission.
    const form = document.getElementById("payment-form");
    form.addEventListener("submit", function(event) {
      event.preventDefault();
      if (!document.getElementsByTagName("form")[0].reportValidity()) {
        // Form not valid, abort
        return;
      }
      // Create PaymentIntent
      // BACKEND CALL HERE
    });
  });

async function createPaymetIntent(purchase) {
  return await fetch(`/create-payment-intent`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      items: [purchase], // Replace with your own logic
      name: "Jenny Rosen", // Replace with value from form
      email: "jenny.rosen@example.com" // Replace with value from form
    })
  }).then(res => res.json());
}

async function pay() {
  changeLoadingState(true);

  // Implement payment action here, e.g. stripe.confirmCardPayment()

  // Show payment result
  orderComplete(clientSecret);
}

/* ------- Post-payment helpers ------- */

/* Shows a success / error message when the payment is complete */
function orderComplete(clientSecret) {
  // Just for the purpose of the sample, show the PaymentIntent response object
  stripe.retrievePaymentIntent(clientSecret).then(function(result) {
    const paymentIntent = result.paymentIntent;
    const paymentIntentJson = JSON.stringify(paymentIntent, null, 2);

    document.querySelector(".sr-payment-form").classList.add("hidden");
    document.querySelector("pre").textContent = paymentIntentJson;

    document.querySelector(".sr-result").classList.remove("hidden");
    setTimeout(function() {
      document.querySelector(".sr-result").classList.add("expand");
    }, 200);

    changeLoadingState(false);
  });
}

function showError(errorMsgText) {
  changeLoadingState(false);
  const errorMsg = document.querySelector(".sr-field-error");
  errorMsg.textContent = errorMsgText;
  setTimeout(function() {
    errorMsg.textContent = "";
  }, 4000);
}

// Show a spinner on payment submission
function changeLoadingState(isLoading) {
  if (isLoading) {
    document.querySelector("button").disabled = true;
    document.querySelector("#spinner").classList.remove("hidden");
    document.querySelector("#button-text").classList.add("hidden");
  } else {
    document.querySelector("button").disabled = false;
    document.querySelector("#spinner").classList.add("hidden");
    document.querySelector("#button-text").classList.remove("hidden");
  }
}

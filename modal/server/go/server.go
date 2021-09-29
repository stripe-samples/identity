package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"io/ioutil"
	"log"
	"net/http"
	"os"

	"github.com/joho/godotenv"
	"github.com/stripe/stripe-go/v72"
	"github.com/stripe/stripe-go/v72/identity/verificationsession"
	"github.com/stripe/stripe-go/v72/webhook"
)

func main() {
	err := godotenv.Load()
	if err != nil {
		log.Fatal("Error loading .env file")
	}

	stripe.Key = os.Getenv("STRIPE_SECRET_KEY")

	// For sample support and debugging, not required for production:
	stripe.SetAppInfo(&stripe.AppInfo{
		Name:    "stripe-samples/identity/modal",
		Version: "0.0.1",
		URL:     "https://github.com/stripe-samples",
	})

	http.Handle("/", http.FileServer(http.Dir(os.Getenv("STATIC_DIR"))))
	http.HandleFunc("/config", handleConfig)
	http.HandleFunc("/create-verification-session", handleCreateVerificationSession)
	http.HandleFunc("/webhook", handleWebhook)

	log.Println("server running at 0.0.0.0:4242")
	http.ListenAndServe("0.0.0.0:4242", nil)
}

// ErrorResponseMessage represents the structure of the error
// object sent in failed responses.
type ErrorResponseMessage struct {
	Message string `json:"message"`
}

// ErrorResponse represents the structure of the error object sent
// in failed responses.
type ErrorResponse struct {
	Error *ErrorResponseMessage `json:"error"`
}

func handleConfig(w http.ResponseWriter, r *http.Request) {
	if r.Method != "GET" {
		http.Error(w, http.StatusText(http.StatusMethodNotAllowed), http.StatusMethodNotAllowed)
		return
	}
	writeJSON(w, struct {
		PublishableKey string `json:"publishableKey"`
	}{
		PublishableKey: os.Getenv("STRIPE_PUBLISHABLE_KEY"),
	})
}

func handleCreateVerificationSession(w http.ResponseWriter, r *http.Request) {
	params := &stripe.IdentityVerificationSessionParams{
		Type: stripe.String("document"),

		// Additional options for configuring the verification session:
		// Options: &stripe.IdentityVerificationSessionOptionsParams{
		//   Document: &stripe.IdentityVerificationSessionOptionsDocumentParams{
		//     // Array of strings of allowed identity document types.
		//     AllowedTypes: stripe.StringSlice([]string{"driving_license"}), // passport | id_card
		//
		//     // Collect an ID number and perform an ID number check with the
		//     // document’s extracted name and date of birth.
		//     RequireIDNumber: stripe.Bool(true),
		//
		//     // Disable image uploads, identity document images have to be captured
		//     // using the device’s camera.
		//     RequireLiveCapture: stripe.Bool(true),
		//
		//     // Capture a face image and perform a selfie check comparing a photo
		//     // ID and a picture of your user’s face.
		//     RequireMatchingSelfie: stripe.Bool(true),
		//   }
		// },
	}
	params.AddMetadata("user_id", "{{USER_ID}}")
	vs, err := verificationsession.New(params)
	if err != nil {
		// Try to safely cast a generic error to a stripe.Error so that we can get at
		// some additional Stripe-specific information about what went wrong.
		if stripeErr, ok := err.(*stripe.Error); ok {
			fmt.Printf("Other Stripe error occurred: %v\n", stripeErr.Error())
			writeJSONErrorMessage(w, stripeErr.Error(), 400)
		} else {
			fmt.Printf("Other error occurred: %v\n", err.Error())
			writeJSONErrorMessage(w, "Unknown server error", 500)
		}

		return
	}

	writeJSON(w, struct {
		ClientSecret string `json:"client_secret"`
	}{
		ClientSecret: vs.ClientSecret,
	})
}

func handleWebhook(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		http.Error(w, http.StatusText(http.StatusMethodNotAllowed), http.StatusMethodNotAllowed)
		return
	}
	b, err := ioutil.ReadAll(r.Body)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		log.Printf("ioutil.ReadAll: %v", err)
		return
	}

	event, err := webhook.ConstructEvent(b, r.Header.Get("Stripe-Signature"), os.Getenv("STRIPE_WEBHOOK_SECRET"))
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		log.Printf("webhook.ConstructEvent: %v", err)
		return
	}

	switch event.Type {
	case "identity.verification_session.verified":
		fmt.Fprintf(os.Stdout, "All the verification checks passed\n")
		var verificationSession stripe.IdentityVerificationSession
		err := json.Unmarshal(event.Data.Raw, &verificationSession)
		if err != nil {
			fmt.Fprintf(os.Stderr, "Error parsing webhook JSON: %v\n", err)
			w.WriteHeader(http.StatusBadRequest)
			return
		}
	case "identity.verification_session.requires_input":
		fmt.Fprintf(os.Stdout, "At least one of the verification checks failed\n")
		var verificationSession stripe.IdentityVerificationSession
		err := json.Unmarshal(event.Data.Raw, &verificationSession)
		if err != nil {
			fmt.Fprintf(os.Stderr, "Error parsing webhook JSON: %v\n", err)
			w.WriteHeader(http.StatusBadRequest)
			return
		}
		switch verificationSession.LastError.Code {
		case "document_unverified_other":
			fmt.Fprintf(os.Stdout, "The document was invalid")
		case "document_expired":
			fmt.Fprintf(os.Stdout, "The document was expired")
		case "document_type_not_supported":
			fmt.Fprintf(os.Stdout, "The document type was not supported")
		default:
			fmt.Fprintf(os.Stdout, "Other document error code")
		}
	default:
		fmt.Fprintf(os.Stdout, "Unhandled event type: %v", event.Type)
	}
	writeJSON(w, nil)
}

func writeJSON(w http.ResponseWriter, v interface{}) {
	var buf bytes.Buffer
	if err := json.NewEncoder(&buf).Encode(v); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		log.Printf("json.NewEncoder.Encode: %v", err)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	if _, err := io.Copy(w, &buf); err != nil {
		log.Printf("io.Copy: %v", err)
		return
	}
}

func writeJSONError(w http.ResponseWriter, v interface{}, code int) {
	w.WriteHeader(code)
	writeJSON(w, v)
	return
}

func writeJSONErrorMessage(w http.ResponseWriter, message string, code int) {
	resp := &ErrorResponse{
		Error: &ErrorResponseMessage{
			Message: message,
		},
	}
	writeJSONError(w, resp, code)
}

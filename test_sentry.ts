import * as Sentry from "@sentry/node";

Sentry.init({
  dsn: "https://5f6e110ca2a8beccd009937ce4ed2533@o4511272419262464.ingest.de.sentry.io/4511272422932560",
});

console.log("Sending test error to Sentry...");
const transactionId = Sentry.captureException(new Error("This is an AI Agent automated test error!"));
console.log("Error sent! Event ID:", transactionId);

// Ensure all events are sent before process exits
Sentry.close(2000).then(() => {
  console.log("Sentry closed gracefully.");
});

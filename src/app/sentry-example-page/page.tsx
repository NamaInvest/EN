"use client";

import Head from "next/head";

export default function SentryExamplePage() {
  return (
    <div style={{ padding: "50px", textAlign: "center" }}>
      <Head>
        <title>Sentry Test Page</title>
      </Head>
      <h1>Sentry is Integrated!</h1>
      <p>Click the button below to simulate an error and send it to Sentry.</p>
      <button
        style={{ padding: "10px 20px", fontSize: "16px", cursor: "pointer", marginTop: "20px" }}
        onClick={() => {
          throw new Error("This is a test error for Sentry on Nama Invest!");
        }}
      >
        Trigger Error
      </button>
    </div>
  );
}

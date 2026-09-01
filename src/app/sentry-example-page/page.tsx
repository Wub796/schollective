"use client";

export default function SentryExamplePage() {
  return (
    <main style={{ padding: "3rem", fontFamily: "sans-serif" }}>
      <h1>Get Started with Sentry Issues</h1>
      <p>Click the button to send a test error to Sentry.</p>
      <button
        type="button"
        onClick={() => {
          throw new Error("Sentry example error");
        }}
      >
        Throw Sample Error
      </button>
    </main>
  );
}

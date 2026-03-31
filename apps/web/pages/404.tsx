export default function Legacy404Page() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: "2rem",
        background: "#f6f0e8",
        color: "#111111"
      }}
    >
      <div style={{ maxWidth: "32rem", textAlign: "center" }}>
        <p style={{ margin: "0 0 1rem", letterSpacing: "0.2em", textTransform: "uppercase" }}>404</p>
        <h1 style={{ margin: "0 0 1rem", fontSize: "3rem", lineHeight: 1 }}>Page not found.</h1>
        <p style={{ margin: 0 }}>Return to the home page and continue browsing the archive.</p>
      </div>
    </main>
  );
}

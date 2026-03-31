export default function Legacy500Page() {
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
        <p style={{ margin: "0 0 1rem", letterSpacing: "0.2em", textTransform: "uppercase" }}>500</p>
        <h1 style={{ margin: "0 0 1rem", fontSize: "3rem", lineHeight: 1 }}>Server error.</h1>
        <p style={{ margin: 0 }}>Something went wrong while rendering the page.</p>
      </div>
    </main>
  );
}

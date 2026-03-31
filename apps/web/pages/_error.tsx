import type { NextPageContext } from "next";

type ErrorPageProps = {
  statusCode: number;
};

function ErrorPage({ statusCode }: ErrorPageProps) {
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
        <p style={{ margin: "0 0 1rem", letterSpacing: "0.2em", textTransform: "uppercase" }}>
          {statusCode}
        </p>
        <h1 style={{ margin: "0 0 1rem", fontSize: "3rem", lineHeight: 1 }}>
          {statusCode === 404 ? "Page not found." : "Server error."}
        </h1>
        <p style={{ margin: 0 }}>
          {statusCode === 404
            ? "Return to the home page and continue browsing the archive."
            : "Something went wrong while rendering the page."}
        </p>
      </div>
    </main>
  );
}

ErrorPage.getInitialProps = ({ res, err }: NextPageContext): ErrorPageProps => {
  const statusCode = res?.statusCode ?? err?.statusCode ?? 500;
  return { statusCode };
};

export default ErrorPage;

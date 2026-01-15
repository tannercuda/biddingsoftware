import "./globals.css";

export const metadata = {
  title: "NCB Bid Portal (POC)",
  description: "Builder + Subcontractor bid portal proof of concept",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <div className="topbar">
          <div className="brand">
            <div className="logo">NCB</div>
            <div className="brandText">
              <div className="title">New Community Bid Portal</div>
              <div className="subtitle">POC • Trades • Templates • Docs • Bid Analysis • Chat</div>
            </div>
          </div>
          <div className="nav">
            <a className="navLink" href="/">Home</a>
            <a className="navLink" href="/builder">Builder</a>
            <a className="navLink" href="/sub">Subcontractor</a>
          </div>
        </div>
        <main className="container">{children}</main>
        <footer className="footer">
          <div><b>Demo only:</b> data is stored in your browser (localStorage).</div>
        </footer>
      </body>
    </html>
  );
}
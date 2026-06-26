import "./styles.css";

export function App() {
  return (
    <main className="app-shell">
      <header className="app-header">
        <div>
          <p className="app-kicker">Terminal proxy manager</p>
          <h1>Term Proxy</h1>
        </div>
        <span className="app-status">Not integrated</span>
      </header>

      <section className="proxy-tabs" aria-label="Proxy types">
        <button type="button">http_proxy</button>
        <button type="button">https_proxy</button>
        <button type="button">ALL_PROXY</button>
      </section>
    </main>
  );
}

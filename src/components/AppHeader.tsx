import { AccountBar } from './AccountBar';

export function AppHeader() {
  return (
    <header className="app-header">
      <div className="container">
        <div>
          <h1 className="app-header__wordmark">KHAN Collection Planner</h1>
          <p className="app-header__tagline">Plan your clothing collections, from first idea to ready.</p>
        </div>
        <AccountBar />
      </div>
    </header>
  );
}

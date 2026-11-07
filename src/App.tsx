import { AppHeader } from './components/AppHeader';
import { CollectionsPanel } from './components/CollectionsPanel';
import { ColourStudio } from './components/ColourStudio';
import { DataPanel } from './components/DataPanel';
import { ProductsOverview } from './components/ProductsOverview';
import { PRIVACY_PATH } from './components/PrivacyPage';
import { StorageNotice } from './components/StorageNotice';
import { useStore } from './components/useStore';

export default function App() {
  const { store, data, persistence } = useStore();
  return (
    <>
      <a className="skip-link" href="#main-content">
        Skip to main content
      </a>
      <AppHeader />
      <StorageNotice status={persistence} />
      <main id="main-content" tabIndex={-1} className="container stack">
        <section className="stack" aria-labelledby="welcome-title">
          <h2 id="welcome-title">Welcome</h2>
          <p>
            Group your product ideas into collections. Add products with a name, type, colour and design notes,
            move them between collections, and change their status (Idea, Design, Sample, Ready) with a quick
            selector. Filter all your products by collection, type and status from the overview. Use the Colour Studio to generate a five-colour palette from a seed colour and save it to a collection. Optional, clearly labelled demo data can be added or removed at any time. Your data stays in this
            browser only, with no account and no server.
          </p>
        </section>
        {data.onboarded && <CollectionsPanel store={store} data={data} />}
        {data.onboarded && <ColourStudio store={store} data={data} />}
        {data.onboarded && <ProductsOverview store={store} data={data} />}
        <DataPanel store={store} data={data} />
      </main>
      <footer className="app-footer container">
        <p>
          KHAN Collection Planner. A personal planning tool with no account and no server.{' '}
          <a href={PRIVACY_PATH}>Privacy</a>
        </p>
      </footer>
    </>
  );
}

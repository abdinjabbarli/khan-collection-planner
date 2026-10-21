import { AppHeader } from './components/AppHeader';
import { DataPanel } from './components/DataPanel';
import { StorageNotice } from './components/StorageNotice';
import { useStore } from './components/useStore';

export default function App() {
  const { store, data, persistence } = useStore();
  return (
    <>
      <AppHeader />
      <StorageNotice status={persistence} />
      <main className="container stack">
        <section className="stack" aria-labelledby="welcome-title">
          <h2 id="welcome-title">Welcome</h2>
          <p>
            Welcome. KHAN Collection Planner will let you group product ideas into collections, and track each
            product (type, colour, notes) through the stages Idea, Design, Sample and Ready. Collection and
            product tools are coming in the next milestones; for now you can set up your starting data.
          </p>
        </section>
        <DataPanel store={store} data={data} />
      </main>
      <footer className="app-footer container">
        <p>
          KHAN Collection Planner. A personal planning tool with no account and no server.
        </p>
      </footer>
    </>
  );
}

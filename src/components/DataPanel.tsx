import { useRef, useState } from 'react';
import type { AppData, PlannerStore } from '../domain';
import { ResetDialog } from './ResetDialog';

interface Props {
  store: PlannerStore;
  data: AppData;
}

export function DataPanel({ store, data }: Props) {
  const [confirming, setConfirming] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const collections = data.collections.length;
  const products = data.products.length;
  const hasDemo = data.collections.some((c) => c.isDemo) || data.products.some((p) => p.isDemo);

  if (!data.onboarded) {
    return (
      <section className="card stack" aria-labelledby="first-visit-title">
        <h2 id="first-visit-title">Get started</h2>
        <p>
          Explore the planner with sample content, or begin with a blank slate. You can remove the sample
          content at any time.
        </p>
        <div className="cluster">
          <button type="button" className="btn btn--primary" onClick={() => store.loadDemoData()}>
            Load demo data (clearly labelled sample content)
          </button>
          <button type="button" className="btn btn--secondary" onClick={() => store.startEmpty()}>
            Start empty
          </button>
        </div>
      </section>
    );
  }

  const close = () => {
    setConfirming(false);
    triggerRef.current?.focus();
  };

  return (
    <section className="card stack" aria-labelledby="summary-title">
      <h2 id="summary-title">Your data</h2>
      {collections === 0 && products === 0 && (
        <p className="empty-state">Nothing here yet. Collections and products will appear once you add them.</p>
      )}
      <ul>
        <li>Collections: {collections}</li>
        <li>Products: {products}</li>
      </ul>
      <div className="cluster">
        {hasDemo && (
          <div className="stack">
            <button type="button" className="btn btn--secondary" onClick={() => store.clearDemoData()}>
              Remove demo data
            </button>
            <p>Only sample content is removed. Your own items are kept.</p>
          </div>
        )}
        <button
          ref={triggerRef}
          type="button"
          className="btn btn--danger"
          onClick={() => setConfirming(true)}
        >
          Reset all data
        </button>
      </div>
      <ResetDialog
        open={confirming}
        collections={collections}
        products={products}
        onCancel={close}
        onConfirm={() => {
          store.resetAll();
          close();
        }}
      />
    </section>
  );
}

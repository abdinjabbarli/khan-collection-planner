import { useEffect, useRef, useState } from 'react';
import type { AppData, PlannerStore } from '../domain';
import { ResetDialog } from './ResetDialog';

interface Props {
  store: PlannerStore;
  data: AppData;
}

export function DataPanel({ store, data }: Props) {
  const [confirming, setConfirming] = useState(false);
  const [message, setMessage] = useState('');
  const [refocusHeading, setRefocusHeading] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const collections = data.collections.length;
  const products = data.products.length;
  const hasDemo = data.collections.some((c) => c.isDemo) || data.products.some((p) => p.isDemo);

  // After a change unmounts the control that had focus, move focus to the section heading.
  useEffect(() => {
    if (refocusHeading) {
      headingRef.current?.focus();
      setRefocusHeading(false);
    }
  }, [refocusHeading, data.onboarded]);

  if (!data.onboarded) {
    return (
      <section className="card stack" aria-labelledby="first-visit-title">
        <h2 id="first-visit-title" ref={headingRef} tabIndex={-1}>
          Get started
        </h2>
        {message && <p role="status">{message}</p>}
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
      <h2 id="summary-title" ref={headingRef} tabIndex={-1}>
        Your data
      </h2>
      {hasDemo && <p className="badge badge--idea">Includes demo data (sample content)</p>}
      {message && <p role="status">{message}</p>}
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
            <button type="button" className="btn btn--secondary" onClick={() => {
                store.clearDemoData();
                setMessage('Demo data removed. Your own items were kept.');
                setRefocusHeading(true);
              }}>
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
          setMessage('All data deleted.');
          setRefocusHeading(true);
          store.resetAll();
          close();
        }}
      />
    </section>
  );
}

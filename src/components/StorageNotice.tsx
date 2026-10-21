import type { PersistenceStatus } from '../domain';

const MESSAGES: Record<PersistenceStatus, string> = {
  persistent:
    'Your data is stored in this browser only (localStorage). It is not synced across devices or browsers, and clearing site data will erase it.',
  unavailable:
    'Browser storage is unavailable or blocked, so your changes are NOT saved and may be lost when the page closes.',
  failed: 'The latest change could not be saved and may be lost.',
  recovered: 'Previously stored data was unreadable and was ignored. Your next change will replace it.',
};

export function StorageNotice({ status }: { status: PersistenceStatus }) {
  const variant = status === 'persistent' ? 'ok' : 'warning';
  return (
    <div className="container">
      <p className={`storage-notice storage-notice--${variant}`} role="status">
        {MESSAGES[status]}
      </p>
    </div>
  );
}

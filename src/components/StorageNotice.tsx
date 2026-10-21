import type { PersistenceStatus } from '../domain';

const MESSAGES: Record<PersistenceStatus, string> = {
  persistent:
    'Saved in this browser only (localStorage). Not synced across devices or browsers. Clearing site data will erase it.',
  unavailable:
    'Browser storage is blocked, so your changes are NOT saved and may be lost when the page closes.',
  failed: 'The latest change could not be saved and may be lost.',
  recovered: 'Stored data was unreadable and was ignored.',
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

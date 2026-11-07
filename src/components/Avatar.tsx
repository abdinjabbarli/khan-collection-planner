import { useEffect, useState } from 'react';
import { initialsOf } from '../auth/profile';

/** Google profile image when available; otherwise (or if it fails to load) the user's initials. */
export function Avatar({ name, url }: { name: string; url: string | null }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [url]);
  if (url && !failed) {
    return (
      <img
        className="avatar"
        src={url}
        alt=""
        width={40}
        height={40}
        referrerPolicy="no-referrer"
        onError={() => setFailed(true)}
      />
    );
  }
  return (
    <span className="avatar avatar--initials" aria-hidden="true">
      {initialsOf(name)}
    </span>
  );
}

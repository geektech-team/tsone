interface OneDialogScrollLockRecord {
  count: number;
  previousOverflow: string;
}

const scrollLocks = new WeakMap<Document, OneDialogScrollLockRecord>();

export function lockOneDialogBody(targetDocument: Document): () => void {
  const existing = scrollLocks.get(targetDocument);
  if (existing) {
    existing.count += 1;
  } else {
    scrollLocks.set(targetDocument, {
      count: 1,
      previousOverflow: targetDocument.body.style.overflow,
    });
    targetDocument.body.style.overflow = 'hidden';
  }

  let released = false;
  return () => {
    if (released) {
      return;
    }
    released = true;
    unlockOneDialogBody(targetDocument);
  };
}

export function unlockOneDialogBody(targetDocument: Document): void {
  const record = scrollLocks.get(targetDocument);
  if (!record) {
    return;
  }
  record.count -= 1;
  if (record.count > 0) {
    return;
  }
  targetDocument.body.style.overflow = record.previousOverflow;
  scrollLocks.delete(targetDocument);
}

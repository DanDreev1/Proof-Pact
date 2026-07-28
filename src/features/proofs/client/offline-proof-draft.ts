"use client";

export type OfflineProofDraft = {
  id: "current";
  title: string;
  description: string;
  video: Blob;
  videoName: string;
  videoType: string;
  videoSize: number;
  createdAt: string;
  updatedAt: string;
};

const databaseName = "proof-pact-offline";
const databaseVersion = 1;
const storeName = "proof-drafts";
const currentDraftId = "current";

function openDraftDatabase() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(databaseName, databaseVersion);

    request.onupgradeneeded = () => {
      const database = request.result;

      if (!database.objectStoreNames.contains(storeName)) {
        database.createObjectStore(storeName, { keyPath: "id" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function withDraftStore<T>(mode: IDBTransactionMode, callback: (store: IDBObjectStore) => IDBRequest<T>) {
  const database = await openDraftDatabase();

  return new Promise<T>((resolve, reject) => {
    const transaction = database.transaction(storeName, mode);
    const store = transaction.objectStore(storeName);
    const request = callback(store);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    transaction.oncomplete = () => database.close();
    transaction.onerror = () => {
      database.close();
      reject(transaction.error);
    };
  });
}

export async function getOfflineProofDraft() {
  if (typeof indexedDB === "undefined") return null;

  return withDraftStore<OfflineProofDraft | undefined>("readonly", (store) => store.get(currentDraftId)).then(
    (draft) => draft ?? null,
  );
}

export async function saveOfflineProofDraft(input: {
  title: string;
  description: string;
  video: Blob;
  videoName: string;
  videoType: string;
  videoSize: number;
  createdAt?: string;
}) {
  if (typeof indexedDB === "undefined") return;

  const now = new Date().toISOString();
  const draft: OfflineProofDraft = {
    id: currentDraftId,
    title: input.title,
    description: input.description,
    video: input.video,
    videoName: input.videoName,
    videoType: input.videoType,
    videoSize: input.videoSize,
    createdAt: input.createdAt ?? now,
    updatedAt: now,
  };

  await withDraftStore<IDBValidKey>("readwrite", (store) => store.put(draft));
}

export async function deleteOfflineProofDraft() {
  if (typeof indexedDB === "undefined") return;

  await withDraftStore<undefined>("readwrite", (store) => store.delete(currentDraftId));
}

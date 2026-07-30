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

export type CachedDailyWord = {
  id: "latest";
  proofDate: string;
  word: string;
  cachedAt: string;
};

const databaseName = "proof-pact-offline";
const databaseVersion = 2;
const draftStoreName = "proof-drafts";
const dailyWordStoreName = "daily-word-cache";
const currentDraftId = "current";
const latestDailyWordId = "latest";

function openDraftDatabase() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(databaseName, databaseVersion);

    request.onupgradeneeded = () => {
      const database = request.result;

      if (!database.objectStoreNames.contains(draftStoreName)) {
        database.createObjectStore(draftStoreName, { keyPath: "id" });
      }

      if (!database.objectStoreNames.contains(dailyWordStoreName)) {
        database.createObjectStore(dailyWordStoreName, { keyPath: "id" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function withStore<T>(
  storeName: string,
  mode: IDBTransactionMode,
  callback: (store: IDBObjectStore) => IDBRequest<T>,
) {
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

  return withStore<OfflineProofDraft | undefined>(draftStoreName, "readonly", (store) => store.get(currentDraftId)).then(
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

  await withStore<IDBValidKey>(draftStoreName, "readwrite", (store) => store.put(draft));
}

export async function deleteOfflineProofDraft() {
  if (typeof indexedDB === "undefined") return;

  await withStore<undefined>(draftStoreName, "readwrite", (store) => store.delete(currentDraftId));
}

export async function getCachedDailyWord() {
  if (typeof indexedDB === "undefined") return null;

  return withStore<CachedDailyWord | undefined>(dailyWordStoreName, "readonly", (store) =>
    store.get(latestDailyWordId),
  ).then((dailyWord) => dailyWord ?? null);
}

export async function saveCachedDailyWord(input: { proofDate: string; word: string }) {
  if (typeof indexedDB === "undefined") return;

  const dailyWord: CachedDailyWord = {
    id: latestDailyWordId,
    proofDate: input.proofDate,
    word: input.word,
    cachedAt: new Date().toISOString(),
  };

  await withStore<IDBValidKey>(dailyWordStoreName, "readwrite", (store) => store.put(dailyWord));
}

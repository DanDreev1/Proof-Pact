"use client";

import { useEffect } from "react";
import { saveCachedDailyWord } from "@/features/proofs/client/offline-proof-draft";

type DailyWordCacheWriterProps = {
  proofDate: string;
  word: string;
};

export function DailyWordCacheWriter({ proofDate, word }: DailyWordCacheWriterProps) {
  useEffect(() => {
    void saveCachedDailyWord({ proofDate, word }).catch(() => undefined);
  }, [proofDate, word]);

  return null;
}

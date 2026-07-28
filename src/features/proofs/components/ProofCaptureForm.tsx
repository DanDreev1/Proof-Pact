"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { Trash2, UploadCloud, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import {
  deleteOfflineProofDraft,
  getOfflineProofDraft,
  type OfflineProofDraft,
  saveOfflineProofDraft,
} from "../client/offline-proof-draft";
import { createProofUploadIntent, finalizeProofRequest } from "../actions/create-proof-draft";

type ProofCaptureFormProps = {
  dailyWord: string;
};

const maxVideoSize = 200 * 1024 * 1024;

function formatFileSize(bytes: number) {
  const megabytes = bytes / (1024 * 1024);

  if (megabytes >= 1) {
    return `${megabytes.toFixed(1)} MB`;
  }

  return `${(bytes / 1024).toFixed(0)} KB`;
}

export function ProofCaptureForm({ dailyWord }: ProofCaptureFormProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [draft, setDraft] = useState<OfflineProofDraft | null>(null);
  const [file, setFile] = useState<File | Blob | null>(null);
  const [fileName, setFileName] = useState("");
  const [fileType, setFileType] = useState("");
  const [fileSize, setFileSize] = useState(0);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [pending, setPending] = useState(false);
  const [loadingDraft, setLoadingDraft] = useState(true);
  const [isOnline, setIsOnline] = useState(() => (typeof navigator === "undefined" ? true : navigator.onLine));
  const fileTooLarge = Boolean(file && fileSize > maxVideoSize);

  useEffect(() => {
    function handleOnline() {
      setIsOnline(true);
    }

    function handleOffline() {
      setIsOnline(false);
    }

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => {
    let active = true;

    getOfflineProofDraft()
      .then((savedDraft) => {
        if (!active || !savedDraft) return;

        setDraft(savedDraft);
        setFile(savedDraft.video);
        setFileName(savedDraft.videoName);
        setFileType(savedDraft.videoType);
        setFileSize(savedDraft.videoSize);
        setTitle(savedDraft.title);
        setDescription(savedDraft.description);
        setSuccess("Saved proof restored from this device.");
      })
      .catch(() => {
        if (active) setError("Could not restore saved proof from this device.");
      })
      .finally(() => {
        if (active) setLoadingDraft(false);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!file || loadingDraft) return;

    const timeout = window.setTimeout(() => {
      void saveOfflineProofDraft({
        title,
        description,
        video: file,
        videoName: fileName,
        videoType: fileType,
        videoSize: fileSize,
        createdAt: draft?.createdAt,
      }).catch(() => undefined);
    }, 500);

    return () => window.clearTimeout(timeout);
  }, [description, draft?.createdAt, file, fileName, fileSize, fileType, loadingDraft, title]);

  async function persistDraft(next: {
    title: string;
    description: string;
    video: File | Blob;
    videoName: string;
    videoType: string;
    videoSize: number;
    createdAt?: string;
  }) {
    await saveOfflineProofDraft(next);
    setDraft({
      id: "current",
      title: next.title,
      description: next.description,
      video: next.video,
      videoName: next.videoName,
      videoType: next.videoType,
      videoSize: next.videoSize,
      createdAt: next.createdAt ?? new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }

  async function updateSavedText(nextTitle: string, nextDescription: string) {
    if (!file) return;

    try {
      await persistDraft({
        title: nextTitle,
        description: nextDescription,
        video: file,
        videoName: fileName,
        videoType: fileType,
        videoSize: fileSize,
        createdAt: draft?.createdAt,
      });
    } catch {
      setError("Could not update saved proof on this device.");
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!file) {
      setError("Video proof is required.");
      return;
    }

    if (!fileType.startsWith("video/")) {
      setError("Only video files are allowed.");
      return;
    }

    if (fileSize > maxVideoSize) {
      setError(`Video is ${formatFileSize(fileSize)}. Maximum size is ${formatFileSize(maxVideoSize)}.`);
      return;
    }

    if (!isOnline) {
      await updateSavedText(title, description);
      setError("You are offline. Proof is saved on this device and can be uploaded when connection returns.");
      return;
    }

    setPending(true);

    try {
      await updateSavedText(title, description);

      const formData = new FormData();
      formData.set("title", title);
      formData.set("description", description);
      formData.set("videoName", fileName);
      formData.set("videoType", fileType);
      formData.set("videoSize", String(fileSize));

      const intent = await createProofUploadIntent(formData);

      if (!intent.ok) {
        setError(intent.error);
        return;
      }

      const supabase = createSupabaseBrowserClient();
      const { error: uploadError } = await supabase.storage
        .from("proof-videos")
        .uploadToSignedUrl(intent.data.videoPath, intent.data.uploadToken, file, {
          contentType: fileType || "video/webm",
          upsert: false,
        });

      if (uploadError) {
        setError(uploadError.message);
        return;
      }

      const finalized = await finalizeProofRequest(intent.data.requestId);

      if (!finalized.ok) {
        setError(finalized.error);
        return;
      }

      await deleteOfflineProofDraft();
      fileInputRef.current?.form?.reset();
      setDraft(null);
      setFile(null);
      setFileName("");
      setFileType("");
      setFileSize(0);
      setTitle("");
      setDescription("");
      setSuccess("Proof request submitted.");
    } finally {
      setPending(false);
    }
  }

  async function handleDeleteDraft() {
    setError("");
    setSuccess("");
    await deleteOfflineProofDraft();
    fileInputRef.current?.form?.reset();
    setDraft(null);
    setFile(null);
    setFileName("");
    setFileType("");
    setFileSize(0);
    setTitle("");
    setDescription("");
    setSuccess("Saved proof removed from this device.");
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Today&apos;s word: <span className="font-black tracking-wide">{dailyWord}</span></CardTitle>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="rounded-2xl bg-slate-900 p-3 text-sm text-slate-300">
            Record a short video near the gym/pool and say today&apos;s date and word.
          </div>

          {!isOnline ? (
            <div className="flex items-start gap-2 rounded-2xl border border-amber-300/20 bg-amber-300/10 p-3 text-sm text-amber-100">
              <WifiOff className="mt-0.5 h-4 w-4 shrink-0" />
              <p>You are offline. Choose or record a video now, then upload it when connection returns.</p>
            </div>
          ) : null}

          {loadingDraft ? (
            <div className="h-16 animate-pulse rounded-2xl bg-slate-900" />
          ) : draft ? (
            <div className="space-y-3 rounded-2xl border border-emerald-300/20 bg-emerald-300/10 p-3 text-sm">
              <div>
                <p className="font-semibold text-emerald-100">Saved proof ready</p>
                <p className="mt-1 text-emerald-100/70">
                  This video is stored on this device until it is submitted or removed.
                </p>
              </div>
              <Button className="w-full gap-2" disabled={pending || fileTooLarge || !isOnline} type="submit">
                <UploadCloud className="h-4 w-4" />
                {pending ? "Uploading..." : isOnline ? "Upload saved proof" : "Waiting for connection"}
              </Button>
              <Button className="w-full gap-2" onClick={handleDeleteDraft} type="button" variant="ghost">
                <Trash2 className="h-4 w-4" />
                Remove saved proof
              </Button>
            </div>
          ) : null}

          <label className="block space-y-2">
            <span className="text-sm font-medium">Video proof</span>
            <input
              className="block w-full rounded-2xl border border-white/10 bg-slate-900 p-3 text-sm"
              ref={fileInputRef}
              type="file"
              accept="video/*"
              capture="environment"
              onChange={async (event) => {
                const selectedFile = event.target.files?.[0] ?? null;
                setFile(selectedFile);
                setFileName(selectedFile?.name ?? "");
                setFileType(selectedFile?.type ?? "");
                setFileSize(selectedFile?.size ?? 0);
                setSuccess("");
                setError(
                  selectedFile && selectedFile.size > maxVideoSize
                    ? `Video is ${formatFileSize(selectedFile.size)}. Maximum size is ${formatFileSize(maxVideoSize)}.`
                    : "",
                );

                if (!selectedFile) return;

                try {
                  await persistDraft({
                    title,
                    description,
                    video: selectedFile,
                    videoName: selectedFile.name,
                    videoType: selectedFile.type,
                    videoSize: selectedFile.size,
                  });
                  setSuccess("Proof saved on this device. You can upload it later.");
                } catch {
                  setError("Could not save proof on this device.");
                }
              }}
            />
          </label>

          {file ? (
            <div className="rounded-2xl bg-slate-900 p-3 text-sm">
              <p className="text-slate-300">{fileName}</p>
              <p className={fileTooLarge ? "text-red-300" : "text-slate-500"}>
                {formatFileSize(fileSize)} / {formatFileSize(maxVideoSize)}
              </p>
            </div>
          ) : null}

          <Input
            name="title"
            onBlur={() => updateSavedText(title, description)}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Title, e.g. Gym session"
            value={title}
          />
          <Textarea
            name="description"
            onBlur={() => updateSavedText(title, description)}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Optional description"
            value={description}
          />

          {error ? <p className="text-sm text-red-300">{error}</p> : null}
          {success ? <p className="text-sm text-emerald-300">{success}</p> : null}

          <Button className="w-full" disabled={pending || fileTooLarge}>
            {pending ? "Uploading..." : draft ? "Submit saved proof" : "Submit proof"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

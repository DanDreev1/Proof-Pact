"use client";

import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
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
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [pending, setPending] = useState(false);
  const fileTooLarge = Boolean(file && file.size > maxVideoSize);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setError("");
    setSuccess("");

    if (!file) {
      setError("Video proof is required.");
      return;
    }

    if (!file.type.startsWith("video/")) {
      setError("Only video files are allowed.");
      return;
    }

    if (file.size > maxVideoSize) {
      setError(`Video is ${formatFileSize(file.size)}. Maximum size is ${formatFileSize(maxVideoSize)}.`);
      return;
    }

    setPending(true);

    try {
      const formData = new FormData(form);
      formData.set("videoName", file.name);
      formData.set("videoType", file.type);
      formData.set("videoSize", String(file.size));

      const intent = await createProofUploadIntent(formData);

      if (!intent.ok) {
        setError(intent.error);
        return;
      }

      const supabase = createSupabaseBrowserClient();
      const { error: uploadError } = await supabase.storage
        .from("proof-videos")
        .uploadToSignedUrl(intent.data.videoPath, intent.data.uploadToken, file, {
          contentType: file.type || "video/webm",
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

      form.reset();
      setFile(null);
      setSuccess("Proof request submitted.");
    } finally {
      setPending(false);
    }
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

          <label className="block space-y-2">
            <span className="text-sm font-medium">Video proof</span>
            <input
              className="block w-full rounded-2xl border border-white/10 bg-slate-900 p-3 text-sm"
              type="file"
              accept="video/*"
              capture="environment"
              onChange={(event) => {
                const selectedFile = event.target.files?.[0] ?? null;
                setFile(selectedFile);
                setSuccess("");
                setError(
                  selectedFile && selectedFile.size > maxVideoSize
                    ? `Video is ${formatFileSize(selectedFile.size)}. Maximum size is ${formatFileSize(maxVideoSize)}.`
                    : "",
                );
              }}
            />
          </label>

          {file ? (
            <div className="rounded-2xl bg-slate-900 p-3 text-sm">
              <p className="text-slate-300">{file.name}</p>
              <p className={fileTooLarge ? "text-red-300" : "text-slate-500"}>
                {formatFileSize(file.size)} / {formatFileSize(maxVideoSize)}
              </p>
            </div>
          ) : null}

          <Input name="title" placeholder="Title, e.g. Gym session" />
          <Textarea name="description" placeholder="Optional description" />

          {error ? <p className="text-sm text-red-300">{error}</p> : null}
          {success ? <p className="text-sm text-emerald-300">{success}</p> : null}

          <Button className="w-full" disabled={pending || fileTooLarge}>
            {pending ? "Uploading..." : "Submit proof"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

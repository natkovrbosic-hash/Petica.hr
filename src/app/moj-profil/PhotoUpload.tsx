"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { setPhoto } from "../actions/tutor";
import { Avatar } from "@/components/ui";

const MAX_MB = 3;

export function PhotoUpload({ tutorId, name, url }: { tutorId: string; name: string; url: string | null }) {
  const input = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onFile(file: File) {
    setErr(null);
    if (!file.type.startsWith("image/")) return setErr("Odaberite sliku (JPG, PNG ili WebP).");
    if (file.size > MAX_MB * 1024 * 1024) return setErr(`Slika smije imati najviše ${MAX_MB} MB.`);
    setBusy(true);
    try {
      const supabase = createClient();
      const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
      const path = `${tutorId}/profil-${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("avatars").upload(path, file, { contentType: file.type, upsert: false });
      if (error) throw error;
      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      const res = await setPhoto(data.publicUrl);
      if (res.error) throw new Error(res.error);
      router.refresh();
    } catch {
      setErr("Učitavanje slike nije uspjelo.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center gap-4">
      <Avatar name={name} src={url} size={88} />
      <div className="space-y-2">
        <input
          ref={input}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])}
        />
        <button type="button" className="btn-secondary btn-sm" disabled={busy} onClick={() => input.current?.click()}>
          {busy ? "Učitavam…" : url ? "Promijeni sliku" : "Dodaj sliku"}
        </button>
        {url && (
          <button
            type="button"
            className="btn-sm ml-2 text-sm text-slate-600 underline"
            disabled={busy}
            onClick={async () => {
              await setPhoto(null);
              router.refresh();
            }}
          >
            Ukloni
          </button>
        )}
        <p className="text-xs text-slate-500">Jasna fotografija lica povećava povjerenje. Najviše {MAX_MB} MB.</p>
        {err && <p className="text-sm text-red-600">{err}</p>}
      </div>
    </div>
  );
}

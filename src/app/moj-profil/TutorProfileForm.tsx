"use client";
import { useState } from "react";
import { saveTutorProfile } from "../actions/tutor";
import { FormMessage, useFormAction } from "@/components/forms";
import { COUNTIES, citiesInCounty, cityByName } from "@/lib/cities";
import { LEVELS, MODES, SUBJECTS } from "@/lib/subjects";
import type { Tutor } from "@/lib/types";

export function TutorProfileForm({ t }: { t: Tutor }) {
  const { state, onSubmit, pending } = useFormAction(saveTutorProfile);
  const [county, setCounty] = useState(t.county ?? "");
  const [modes, setModes] = useState<string[]>(t.modes);
  const [bioLen, setBioLen] = useState(t.bio?.length ?? 0);
  const canSubmit = t.status !== "odobren";

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="display_name">Ime na profilu</label>
          <input className="input" id="display_name" name="display_name" defaultValue={t.display_name} required maxLength={80} />
        </div>
        <div>
          <label className="label" htmlFor="price_eur">Cijena (€ po satu)</label>
          <input className="input" id="price_eur" name="price_eur" inputMode="decimal" defaultValue={t.price_eur ?? ""} placeholder="npr. 15" />
        </div>
      </div>
      <div>
        <label className="label" htmlFor="headline">Kratki naslov</label>
        <input className="input" id="headline" name="headline" maxLength={120} defaultValue={t.headline ?? ""} placeholder="npr. Prof. matematike — strpljivo i jasno" />
      </div>
      <div>
        <label className="label" htmlFor="bio">O meni</label>
        <textarea
          className="input min-h-32"
          id="bio"
          name="bio"
          maxLength={3000}
          defaultValue={t.bio ?? ""}
          onChange={(e) => setBioLen(e.target.value.length)}
          placeholder="Tko ste, kako radite, s kim najčešće radite…"
        />
        <p className="mt-1 text-xs text-slate-500">{bioLen}/3000 (najmanje 50 za odobrenje)</p>
      </div>

      <fieldset>
        <legend className="label">Predmeti</legend>
        <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
          {SUBJECTS.map((s) => (
            <label key={s.slug} className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="subjects" value={s.slug} defaultChecked={t.subjects.includes(s.slug)} className="size-4" />
              {s.name}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="label">Razine</legend>
        <div className="flex flex-wrap gap-1.5">
          {LEVELS.map((l) => (
            <label key={l.id} className="cursor-pointer">
              <input type="checkbox" name="levels" value={l.id} defaultChecked={t.levels.includes(l.id)} className="peer sr-only" />
              <span className="chip py-1.5 peer-checked:bg-brand-600 peer-checked:text-white peer-focus-visible:ring-2">{l.short}</span>
            </label>
          ))}
        </div>
        <p className="mt-1 text-xs text-slate-500">OŠ po razredima, srednja škola, državna matura, fakultet.</p>
      </fieldset>

      <fieldset>
        <legend className="label">Način održavanja</legend>
        <div className="space-y-1.5">
          {MODES.map((m) => (
            <label key={m.id} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="modes"
                value={m.id}
                checked={modes.includes(m.id)}
                onChange={(e) => setModes((cur) => (e.target.checked ? [...cur, m.id] : cur.filter((x) => x !== m.id)))}
                className="size-4"
              />
              {m.name}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="county">Županija</label>
          <select className="input" id="county" value={county} onChange={(e) => setCounty(e.target.value)}>
            <option value="">Odaberite…</option>
            {COUNTIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="city">Grad</label>
          <select
            key={county}
            className="input"
            id="city"
            name="city"
            defaultValue={t.city && cityByName(t.city)?.county === county ? t.city : ""}
            disabled={!county}
          >
            <option value="">Odaberite…</option>
            {citiesInCounty(county).map((c) => (
              <option key={c.name} value={c.name}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>
      {modes.includes("dolazim") ? (
        <div>
          <label className="label" htmlFor="travel_radius_km">Dolazim do (km od grada)</label>
          <input className="input sm:w-40" id="travel_radius_km" name="travel_radius_km" type="number" min={0} max={100} defaultValue={t.travel_radius_km} />
        </div>
      ) : (
        <input type="hidden" name="travel_radius_km" value={t.travel_radius_km} />
      )}

      <div className="grid gap-4 sm:grid-cols-[160px_1fr]">
        <div>
          <label className="label" htmlFor="experience_years">Godine iskustva</label>
          <input className="input" id="experience_years" name="experience_years" type="number" min={0} max={60} defaultValue={t.experience_years ?? ""} />
        </div>
        <div>
          <label className="label" htmlFor="experience">Iskustvo i obrazovanje</label>
          <textarea className="input min-h-20" id="experience" name="experience" maxLength={2000} defaultValue={t.experience ?? ""} placeholder="Diplome, škole, rezultati učenika…" />
        </div>
      </div>

      <FormMessage state={state} />
      <div className="flex flex-col gap-2 sm:flex-row">
        <button className="btn-secondary" name="intent" value="save" disabled={pending}>
          {pending ? "Spremam…" : "Spremi"}
        </button>
        {canSubmit && (
          <button className="btn-primary" name="intent" value="submit" disabled={pending}>
            {t.status === "odbijen" ? "Spremi i ponovno pošalji na odobrenje" : t.submitted_at ? "Spremi i ponovno pošalji" : "Spremi i pošalji na odobrenje"}
          </button>
        )}
      </div>
    </form>
  );
}

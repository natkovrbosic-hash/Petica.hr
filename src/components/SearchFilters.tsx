"use client";
import { useState } from "react";
import { COUNTIES, citiesInCounty, cityByName } from "@/lib/cities";
import { DAY_PARTS, LEVELS, MODES, SORTS, SUBJECTS, WEEKDAYS } from "@/lib/subjects";
import type { Filters } from "@/lib/search";

export function SearchFilters({ f }: { f: Filters }) {
  const [open, setOpen] = useState(false);
  const [county, setCounty] = useState(f.grad ? cityByName(f.grad)?.county ?? "" : f.zupanija ?? "");
  const cities = county ? citiesInCounty(county) : [];

  return (
    <div className="card p-4">
      <button
        type="button"
        className="flex w-full items-center justify-between text-left font-bold lg:hidden"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        Filteri <span className="text-sm font-semibold text-brand-700">{open ? "Sakrij" : "Prikaži"}</span>
      </button>
      <form action="/pretraga" className={`${open ? "mt-4 block" : "hidden"} space-y-4 lg:block`}>
        {f.q && <input type="hidden" name="q" value={f.q} />}
        <div>
          <label className="label" htmlFor="f-predmet">Predmet</label>
          <select id="f-predmet" name="predmet" defaultValue={f.predmet ?? ""} className="input">
            <option value="">Svi predmeti</option>
            {SUBJECTS.map((s) => (
              <option key={s.slug} value={s.slug}>{s.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="f-razina">Razina</label>
          <select id="f-razina" name="razina" defaultValue={f.razina ?? ""} className="input">
            <option value="">Sve razine</option>
            {LEVELS.map((l) => (
              <option key={l.id} value={l.id}>{l.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="f-zupanija">Županija</label>
          <select
            id="f-zupanija"
            name="zupanija"
            value={county}
            onChange={(e) => setCounty(e.target.value)}
            className="input"
          >
            <option value="">Cijela Hrvatska</option>
            {COUNTIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        {county && (
          <div>
            <label className="label" htmlFor="f-grad">Grad</label>
            <select
              key={county}
              id="f-grad"
              name="grad"
              defaultValue={f.grad && cityByName(f.grad)?.county === county ? f.grad : ""}
              className="input"
            >
              <option value="">Cijela županija</option>
              {cities.map((c) => (
                <option key={c.name} value={c.name}>{c.name}</option>
              ))}
            </select>
          </div>
        )}
        {county && (
          <div>
            <label className="label" htmlFor="f-radijus">Udaljenost od grada</label>
            <select id="f-radijus" name="radijus" defaultValue={String(f.radijus)} className="input">
              {[5, 10, 15, 25, 50].map((r) => (
                <option key={r} value={r}>do {r} km</option>
              ))}
            </select>
          </div>
        )}
        <fieldset>
          <legend className="label">Način održavanja</legend>
          <div className="space-y-1.5">
            {MODES.map((m) => (
              <label key={m.id} className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="nacin" value={m.id} defaultChecked={f.nacin.includes(m.id)} className="size-4" />
                {m.id === "kod_mene" ? "Kod instruktora" : m.id === "dolazim" ? "Instruktor dolazi kući" : "Online"}
              </label>
            ))}
          </div>
        </fieldset>
        <fieldset>
          <legend className="label">Cijena (€/h)</legend>
          <div className="flex items-center gap-2">
            <input name="min" type="number" min={0} inputMode="numeric" placeholder="od" defaultValue={f.min ?? ""} className="input" aria-label="Najniža cijena" />
            <span>–</span>
            <input name="max" type="number" min={0} inputMode="numeric" placeholder="do" defaultValue={f.max ?? ""} className="input" aria-label="Najviša cijena" />
          </div>
        </fieldset>
        <fieldset>
          <legend className="label">Dostupnost</legend>
          <div className="flex flex-wrap gap-1.5">
            {WEEKDAYS.map((d) => (
              <label key={d.id} className="cursor-pointer">
                <input type="checkbox" name="dani" value={d.id} defaultChecked={f.dani.includes(d.id)} className="peer sr-only" />
                <span className="chip peer-checked:bg-brand-600 peer-checked:text-white peer-focus-visible:ring-2">{d.short}</span>
              </label>
            ))}
          </div>
          <select name="doba" defaultValue={f.doba ?? ""} className="input mt-2" aria-label="Doba dana">
            <option value="">Bilo kada</option>
            {DAY_PARTS.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </fieldset>
        <div>
          <label className="label" htmlFor="f-sort">Poredaj</label>
          <select id="f-sort" name="sort" defaultValue={f.sort} className="input">
            {SORTS.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
        <div className="flex gap-2">
          <button className="btn-primary flex-1" type="submit">Primijeni</button>
          <a href="/pretraga" className="btn-secondary">Očisti</a>
        </div>
      </form>
    </div>
  );
}

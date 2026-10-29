import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link } from "wouter";
import { ArrowLeft, ArrowRight, Check, Eye, Loader2, Lock, Pencil, Plus, Trash2, Undo2 } from "lucide-react";
import GlobeVisualization from "@/components/GlobeVisualization";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useGlobeRoutes } from "@/hooks/use-globe-routes";
import {
  dateSortKey,
  dateToMonthInput,
  monthInputToDate,
  type GlobeData,
  type LngLat,
  type SimpleRoute,
} from "@/lib/globeData";
import { geocodePlace } from "@/lib/mapbox";

const PASSWORD_KEY = "love-letters-admin-password";

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

async function callApi(password: string, init?: RequestInit) {
  const res = await fetch("/api/routes", {
    ...init,
    headers: {
      Authorization: `Bearer ${password}`,
      "Content-Type": "application/json",
    },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ApiError(res.status, body.error || `Request failed (${res.status})`);
  }
  return body;
}

const routeKey = (r: SimpleRoute) => `${r.from}|${r.to}|${r.date}|${r.person}|${!!r.meetup}`;

function withUsedPlacesOnly(data: GlobeData): GlobeData {
  const used = new Set(data.routes.flatMap((r) => [r.from, r.to]));
  return {
    ...data,
    places: Object.fromEntries(Object.entries(data.places).filter(([name]) => used.has(name))),
  };
}

function describeChanges(before: GlobeData, after: GlobeData): string {
  const beforeKeys = new Set(before.routes.map(routeKey));
  const afterKeys = new Set(after.routes.map(routeKey));
  const added = after.routes.filter((r) => !beforeKeys.has(routeKey(r)));
  const removed = before.routes.filter((r) => !afterKeys.has(routeKey(r)));
  if (added.length === 1 && removed.length === 0) {
    const r = added[0];
    return `Add trip: ${r.from} → ${r.to} (${r.date})`;
  }
  if (added.length === 0 && removed.length === 1) {
    const r = removed[0];
    return `Remove trip: ${r.from} → ${r.to} (${r.date})`;
  }
  return `Update trips: ${added.length} added, ${removed.length} removed`;
}

export default function Admin() {
  const [password, setPassword] = useState(() => sessionStorage.getItem(PASSWORD_KEY) || "");
  const [unlocked, setUnlocked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [lockError, setLockError] = useState("");

  const [original, setOriginal] = useState<GlobeData | null>(null);
  const [draft, setDraft] = useState<GlobeData | null>(null);
  const [sha, setSha] = useState("");

  const [editing, setEditing] = useState<{ index: number | null; route: SimpleRoute } | null>(null);
  const [previewing, setPreviewing] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [publishError, setPublishError] = useState<{ message: string; conflict: boolean } | null>(null);
  const [published, setPublished] = useState<{ commitUrl?: string } | null>(null);

  const dirty = useMemo(
    () => !!original && !!draft && JSON.stringify(original.routes) !== JSON.stringify(draft.routes),
    [original, draft]
  );

  useEffect(() => {
    document.title = "Love Letters · Admin";
    const meta = document.createElement("meta");
    meta.name = "robots";
    meta.content = "noindex";
    document.head.appendChild(meta);
    return () => meta.remove();
  }, []);

  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const load = async (pw: string) => {
    setLoading(true);
    setLockError("");
    try {
      const body = await callApi(pw);
      sessionStorage.setItem(PASSWORD_KEY, pw);
      setOriginal(body.data);
      setDraft(body.data);
      setSha(body.sha);
      setPublishError(null);
      setUnlocked(true);
    } catch (error) {
      const err = error as ApiError;
      if (err.status === 401) sessionStorage.removeItem(PASSWORD_KEY);
      setLockError(err.message);
      setUnlocked(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (password) load(password);
    // Only auto-unlock once with a remembered password
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const lock = () => {
    sessionStorage.removeItem(PASSWORD_KEY);
    setPassword("");
    setUnlocked(false);
    setOriginal(null);
    setDraft(null);
  };

  const publish = async () => {
    if (!draft || !original) return;
    setPublishing(true);
    setPublishError(null);
    setPublished(null);
    try {
      const data = withUsedPlacesOnly(draft);
      const body = await callApi(password, {
        method: "PUT",
        body: JSON.stringify({ data, sha, message: describeChanges(original, data) }),
      });
      setOriginal(body.data);
      setDraft(body.data);
      setSha(body.sha);
      setPublished({ commitUrl: body.commitUrl });
    } catch (error) {
      const err = error as ApiError;
      setPublishError({ message: err.message, conflict: err.status === 409 });
    } finally {
      setPublishing(false);
    }
  };

  const saveRoute = (route: SimpleRoute, newPlaces: Record<string, LngLat>) => {
    if (!draft || !editing) return;
    const routes = [...draft.routes];
    if (editing.index === null) routes.push(route);
    else routes[editing.index] = route;
    setDraft({ ...draft, routes, places: { ...draft.places, ...newPlaces } });
    setEditing(null);
    setPublished(null);
  };

  const deleteRoute = (index: number) => {
    if (!draft) return;
    setDraft({ ...draft, routes: draft.routes.filter((_, i) => i !== index) });
    setPublished(null);
  };

  if (!unlocked || !draft) {
    return (
      <AdminShell>
        <form
          className="mx-auto mt-16 max-w-sm space-y-4 rounded-xl border border-white/10 bg-white/[0.03] p-6"
          onSubmit={(e) => {
            e.preventDefault();
            load(password);
          }}
        >
          <div className="space-y-1">
            <h1 className="text-xl font-medium">Love Letters admin</h1>
            <p className="text-sm text-muted-foreground">Enter the admin password to edit trips.</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
            />
          </div>
          {lockError && <p className="text-sm text-red-300">{lockError}</p>}
          <Button type="submit" className="w-full" disabled={!password || loading}>
            {loading ? <Loader2 className="animate-spin" /> : <Lock />}
            Unlock
          </Button>
        </form>
      </AdminShell>
    );
  }

  if (previewing) {
    return (
      <div className="relative">
        <PreviewGlobe data={draft} />
        <Button
          className="absolute left-4 top-4 z-[60]"
          variant="secondary"
          onClick={() => setPreviewing(false)}
        >
          <ArrowLeft /> Back to editing
        </Button>
      </div>
    );
  }

  const groups = groupByDate(draft.routes);

  return (
    <AdminShell>
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-medium">Trips</h1>
          <p className="text-sm text-muted-foreground">
            {draft.routes.length} trips ·{" "}
            <Link href="/" className="underline underline-offset-4">
              view site
            </Link>
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setPreviewing(true)}>
            <Eye /> Preview
          </Button>
          <Button variant="ghost" size="sm" onClick={lock} aria-label="Lock">
            <Lock />
          </Button>
        </div>
      </header>

      <Button
        className="mb-6 w-full"
        size="lg"
        onClick={() =>
          setEditing({
            index: null,
            route: {
              from: "",
              to: "",
              date: monthInputToDate(new Date().toISOString().slice(0, 7)),
              person: Object.keys(draft.people)[0] ?? "",
            },
          })
        }
      >
        <Plus /> Add a trip
      </Button>

      {published && (
        <Banner tone="success">
          Published. The live site updates in about a minute.
          {published.commitUrl && (
            <>
              {" "}
              <a href={published.commitUrl} target="_blank" rel="noreferrer" className="underline">
                See the change
              </a>
            </>
          )}
        </Banner>
      )}
      {publishError && (
        <Banner tone="error">
          {publishError.message}
          {publishError.conflict && (
            <Button size="sm" variant="secondary" className="ml-2" onClick={() => load(password)}>
              Reload
            </Button>
          )}
        </Banner>
      )}

      <div className="space-y-6 pb-32">
        {groups.map(([date, items]) => (
          <section key={date}>
            <h2 className="mb-2 text-xs uppercase tracking-wider text-muted-foreground">{date}</h2>
            <ul className="divide-y divide-white/5 overflow-hidden rounded-lg border border-white/10">
              {items.map(({ route, index }) => (
                <li key={index} className="flex items-center gap-3 bg-white/[0.02] px-3 py-2.5">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ background: draft.people[route.person]?.colors[0] ?? "#888" }}
                  />
                  <div className="min-w-0 flex-1" title={`${route.from} → ${route.to}`}>
                    <div className="flex items-center gap-1.5 text-sm">
                      <span className="truncate">{shortPlace(route.from)}</span>
                      <ArrowRight className="h-3 w-3 shrink-0 text-muted-foreground" />
                      <span className="truncate">{shortPlace(route.to)}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">{route.person}</div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Edit trip"
                    onClick={() => setEditing({ index, route })}
                  >
                    <Pencil />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Delete trip"
                    onClick={() => deleteRoute(index)}
                  >
                    <Trash2 />
                  </Button>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      {dirty && (
        <div
          className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-black/90 backdrop-blur"
          style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
        >
          <div className="mx-auto flex max-w-2xl items-center gap-2 px-4 py-3">
            <span className="flex-1 text-sm text-muted-foreground">Unpublished changes</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => original && setDraft(original)}
              disabled={publishing}
            >
              <Undo2 /> Discard
            </Button>
            <Button size="sm" onClick={publish} disabled={publishing}>
              {publishing ? <Loader2 className="animate-spin" /> : <Check />}
              Publish
            </Button>
          </div>
        </div>
      )}

      {editing && (
        <RouteDialog
          initial={editing.route}
          isNew={editing.index === null}
          data={draft}
          onCancel={() => setEditing(null)}
          onSave={saveRoute}
        />
      )}
    </AdminShell>
  );
}

function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[100dvh] bg-[#000005] text-white">
      <div className="mx-auto max-w-2xl px-4 py-6">{children}</div>
    </div>
  );
}

function Banner({ tone, children }: { tone: "success" | "error"; children: React.ReactNode }) {
  const styles =
    tone === "success"
      ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-100"
      : "border-red-400/30 bg-red-400/10 text-red-100";
  return <div className={`mb-6 rounded-lg border px-4 py-3 text-sm ${styles}`}>{children}</div>;
}

function PreviewGlobe({ data }: { data: GlobeData }) {
  const routes = useGlobeRoutes(data);
  return <GlobeVisualization routes={routes} />;
}

const shortPlace = (name: string) => name.split(",")[0];

function groupByDate(routes: SimpleRoute[]) {
  const groups = new Map<string, { route: SimpleRoute; index: number }[]>();
  routes
    .map((route, index) => ({ route, index }))
    .sort((a, b) => dateSortKey(b.route.date).localeCompare(dateSortKey(a.route.date)))
    .forEach((item) => {
      const list = groups.get(item.route.date) ?? [];
      list.push(item);
      groups.set(item.route.date, list);
    });
  return Array.from(groups.entries());
}

type Lookup =
  | { state: "idle" }
  | { state: "looking" }
  | { state: "found"; coords: LngLat; label: string }
  | { state: "missing" };

function RouteDialog({
  initial,
  isNew,
  data,
  onCancel,
  onSave,
}: {
  initial: SimpleRoute;
  isNew: boolean;
  data: GlobeData;
  onCancel: () => void;
  onSave: (route: SimpleRoute, newPlaces: Record<string, LngLat>) => void;
}) {
  const [route, setRoute] = useState(initial);
  const [lookups, setLookups] = useState<Record<string, Lookup>>({});
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const placeNames = useMemo(() => Object.keys(data.places).sort(), [data.places]);
  const people = Object.keys(data.people);

  const lookUp = async (name: string): Promise<Lookup> => {
    const trimmed = name.trim();
    if (!trimmed || data.places[trimmed]) return { state: "idle" };
    const existing = lookups[trimmed];
    if (existing?.state === "found" || existing?.state === "missing") return existing;

    setLookups((prev) => ({ ...prev, [trimmed]: { state: "looking" } }));
    const result = await geocodePlace(trimmed);
    const next: Lookup = result
      ? { state: "found", coords: result.coords, label: result.label }
      : { state: "missing" };
    setLookups((prev) => ({ ...prev, [trimmed]: next }));
    return next;
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    const from = route.from.trim();
    const to = route.to.trim();
    if (!from || !to || !route.date || !route.person) {
      setError("Fill in where from, where to, and when.");
      return;
    }
    if (from === to) {
      setError("From and to need to be different places.");
      return;
    }

    setSaving(true);
    const newPlaces: Record<string, LngLat> = {};
    for (const name of [from, to]) {
      if (data.places[name]) continue;
      const result = await lookUp(name);
      if (result.state !== "found") {
        setError(`Couldn't find "${name}" on the map. Try "City, Country".`);
        setSaving(false);
        return;
      }
      newPlaces[name] = result.coords;
    }
    setSaving(false);
    onSave({ ...route, from, to }, newPlaces);
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto border-white/10 bg-[#0a0a12] text-white">
        <form onSubmit={submit} className="space-y-5">
          <DialogHeader>
            <DialogTitle>{isNew ? "Add a trip" : "Edit trip"}</DialogTitle>
            <DialogDescription>
              Type any city. New places are found on the map automatically.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label>Who</Label>
            <div className="flex flex-wrap gap-2">
              {people.map((person) => (
                <button
                  key={person}
                  type="button"
                  onClick={() => setRoute({ ...route, person })}
                  className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition-colors ${
                    route.person === person
                      ? "border-white/60 bg-white/10"
                      : "border-white/15 text-white/70 hover:border-white/30"
                  }`}
                >
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ background: data.people[person].colors[0] }}
                  />
                  {person}
                </button>
              ))}
            </div>
          </div>

          <datalist id="known-places">
            {placeNames.map((name) => (
              <option key={name} value={name} />
            ))}
          </datalist>

          <PlaceField
            id="from"
            label="From"
            value={route.from}
            known={!!data.places[route.from.trim()]}
            lookup={lookups[route.from.trim()]}
            onChange={(from) => setRoute({ ...route, from })}
            onBlur={() => lookUp(route.from)}
          />
          <PlaceField
            id="to"
            label="To"
            value={route.to}
            known={!!data.places[route.to.trim()]}
            lookup={lookups[route.to.trim()]}
            onChange={(to) => setRoute({ ...route, to })}
            onBlur={() => lookUp(route.to)}
          />

          <div className="space-y-2">
            <Label htmlFor="when">When</Label>
            <Input
              id="when"
              type="month"
              value={dateToMonthInput(route.date)}
              onChange={(e) =>
                setRoute({ ...route, date: e.target.value ? monthInputToDate(e.target.value) : "" })
              }
              className="[color-scheme:dark]"
            />
          </div>

          {error && <p className="text-sm text-red-300">{error}</p>}

          <DialogFooter className="gap-2">
            <Button type="button" variant="ghost" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="animate-spin" />}
              {isNew ? "Add trip" : "Save trip"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function PlaceField({
  id,
  label,
  value,
  known,
  lookup,
  onChange,
  onBlur,
}: {
  id: string;
  label: string;
  value: string;
  known: boolean;
  lookup?: Lookup;
  onChange: (value: string) => void;
  onBlur: () => void;
}) {
  let hint: React.ReactNode = <span className="text-muted-foreground">e.g. Lisbon, Portugal</span>;
  if (known) hint = <span className="text-emerald-300">On the map</span>;
  else if (lookup?.state === "looking") hint = <span className="text-muted-foreground">Looking it up…</span>;
  else if (lookup?.state === "found")
    hint = <span className="text-emerald-300">New place · found {lookup.label}</span>;
  else if (lookup?.state === "missing")
    hint = <span className="text-red-300">Couldn't find this. Try "City, Country".</span>;

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        list="known-places"
        autoComplete="off"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        placeholder="City, Country"
      />
      <p className="text-xs">{hint}</p>
    </div>
  );
}

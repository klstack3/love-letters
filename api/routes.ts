import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createHash, timingSafeEqual } from "crypto";
import { promises as fs } from "fs";
import path from "path";

const DATA_PATH = "client/src/data/routes.json";
const GITHUB_REPO = process.env.GITHUB_REPO || "klstack3/love-letters";
const GITHUB_BRANCH = process.env.GITHUB_BRANCH || "main";

type LngLat = [number, number];

interface GlobeData {
  routes: {
    from: string;
    to: string;
    date: string;
    person: string;
    meetup?: boolean;
  }[];
  people: Record<string, { colors: [string, string] }>;
  places: Record<string, LngLat>;
}

class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

function checkPassword(req: VercelRequest) {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) {
    throw new HttpError(
      503,
      "The admin page isn't set up yet. Add an ADMIN_PASSWORD environment variable."
    );
  }
  const header = req.headers.authorization || "";
  const given = header.startsWith("Bearer ") ? header.slice(7) : "";
  const a = createHash("sha256").update(given).digest();
  const b = createHash("sha256").update(expected).digest();
  if (!timingSafeEqual(a, b)) {
    throw new HttpError(401, "Wrong password.");
  }
}

const isString = (v: unknown, max = 120): v is string =>
  typeof v === "string" && v.trim().length > 0 && v.length <= max;
const isHexColor = (v: unknown) =>
  typeof v === "string" && /^#[0-9a-fA-F]{6}$/.test(v);
const isLngLat = (v: unknown): v is LngLat =>
  Array.isArray(v) &&
  v.length === 2 &&
  typeof v[0] === "number" &&
  typeof v[1] === "number" &&
  Math.abs(v[0]) <= 180 &&
  Math.abs(v[1]) <= 90;

function validate(input: unknown): GlobeData {
  const data = input as GlobeData;
  if (!data || typeof data !== "object") throw new HttpError(400, "Missing data.");
  if (!Array.isArray(data.routes) || data.routes.length > 2000) {
    throw new HttpError(400, "Routes must be a list.");
  }
  if (!data.people || typeof data.people !== "object") {
    throw new HttpError(400, "People are missing.");
  }
  if (!data.places || typeof data.places !== "object") {
    throw new HttpError(400, "Places are missing.");
  }

  for (const [name, person] of Object.entries(data.people)) {
    if (!isString(name, 40) || !Array.isArray(person?.colors) || person.colors.length !== 2 || !person.colors.every(isHexColor)) {
      throw new HttpError(400, `Person "${name}" needs two #rrggbb colors.`);
    }
  }
  for (const [name, coords] of Object.entries(data.places)) {
    if (!isString(name) || !isLngLat(coords)) {
      throw new HttpError(400, `Place "${name}" has invalid coordinates.`);
    }
  }
  data.routes.forEach((route, i) => {
    const label = `Route ${i + 1}`;
    if (!isString(route?.from) || !isString(route?.to)) {
      throw new HttpError(400, `${label} needs a from and to place.`);
    }
    if (!isString(route.date, 40)) throw new HttpError(400, `${label} needs a date.`);
    if (!data.people[route.person]) {
      throw new HttpError(400, `${label} has an unknown person "${route.person}".`);
    }
    for (const place of [route.from, route.to]) {
      if (!data.places[place]) {
        throw new HttpError(400, `${label}: no location for "${place}".`);
      }
    }
    if (route.meetup !== undefined && typeof route.meetup !== "boolean") {
      throw new HttpError(400, `${label} has an invalid meetup value.`);
    }
  });

  // Rebuild with only known keys so nothing unexpected gets committed
  return {
    routes: data.routes.map((r) => ({
      from: r.from.trim(),
      to: r.to.trim(),
      date: r.date.trim(),
      person: r.person,
      ...(r.meetup ? { meetup: true } : {}),
    })),
    people: Object.fromEntries(
      Object.entries(data.people).map(([k, v]) => [k, { colors: v.colors }])
    ),
    places: Object.fromEntries(
      Object.keys(data.places)
        .sort((a, b) => a.localeCompare(b))
        .map((k) => [k, data.places[k]])
    ),
  };
}

function inline(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(inline).join(", ")}]`;
  if (value && typeof value === "object") {
    const entries = Object.entries(value).map(
      ([k, v]) => `${JSON.stringify(k)}: ${inline(v)}`
    );
    return `{ ${entries.join(", ")} }`;
  }
  return JSON.stringify(value);
}

/** One route / person / place per line so the file stays easy to hand-edit. */
export function formatGlobeData(data: GlobeData): string {
  const block = (lines: string[]) => lines.map((l) => `    ${l}`).join(",\n");
  return [
    "{",
    '  "routes": [',
    block(data.routes.map(inline)),
    "  ],",
    '  "people": {',
    block(Object.entries(data.people).map(([k, v]) => `${JSON.stringify(k)}: ${inline(v)}`)),
    "  },",
    '  "places": {',
    block(Object.entries(data.places).map(([k, v]) => `${JSON.stringify(k)}: ${inline(v)}`)),
    "  }",
    "}",
    "",
  ].join("\n");
}

interface Store {
  read(): Promise<{ data: GlobeData; sha: string }>;
  write(data: GlobeData, sha: string, message: string): Promise<{ sha: string; commitUrl?: string }>;
}

function githubStore(token: string): Store {
  const url = `https://api.github.com/repos/${GITHUB_REPO}/contents/${DATA_PATH}`;
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "love-letters-admin",
  };

  return {
    async read() {
      const res = await fetch(`${url}?ref=${encodeURIComponent(GITHUB_BRANCH)}`, { headers });
      if (!res.ok) {
        throw new HttpError(502, `Couldn't load routes from GitHub (${res.status}). Check GITHUB_TOKEN.`);
      }
      const body = await res.json();
      const text = Buffer.from(body.content, "base64").toString("utf8");
      return { data: JSON.parse(text), sha: body.sha };
    },
    async write(data, sha, message) {
      const res = await fetch(url, {
        method: "PUT",
        headers,
        body: JSON.stringify({
          message,
          content: Buffer.from(formatGlobeData(data)).toString("base64"),
          sha,
          branch: GITHUB_BRANCH,
        }),
      });
      if (res.status === 409 || res.status === 422) {
        throw new HttpError(409, "The routes changed somewhere else. Reload the page and try again.");
      }
      if (!res.ok) {
        throw new HttpError(502, `GitHub rejected the save (${res.status}). Check GITHUB_TOKEN permissions.`);
      }
      const body = await res.json();
      return { sha: body.content.sha, commitUrl: body.commit?.html_url };
    },
  };
}

function localFileStore(): Store {
  const file = path.resolve(process.cwd(), DATA_PATH);
  const hash = (text: string) => createHash("sha1").update(text).digest("hex");
  return {
    async read() {
      const text = await fs.readFile(file, "utf8");
      return { data: JSON.parse(text), sha: hash(text) };
    },
    async write(data, sha) {
      const current = await fs.readFile(file, "utf8");
      if (hash(current) !== sha) {
        throw new HttpError(409, "The routes file changed on disk. Reload the page and try again.");
      }
      const text = formatGlobeData(data);
      await fs.writeFile(file, text);
      return { sha: hash(text) };
    },
  };
}

function getStore(): Store {
  const token = process.env.GITHUB_TOKEN;
  if (token) return githubStore(token);
  if (process.env.VERCEL || process.env.NODE_ENV === "production") {
    throw new HttpError(
      503,
      "Saving isn't set up yet. Add a GITHUB_TOKEN environment variable so the admin page can commit changes."
    );
  }
  return localFileStore();
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Cache-Control", "no-store");

  try {
    checkPassword(req);
  } catch (error) {
    // Slow down password guessing a little
    await new Promise((r) => setTimeout(r, 400));
    const err = error as HttpError;
    return res.status(err.status || 500).json({ error: err.message });
  }

  try {
    const store = getStore();

    if (req.method === "GET") {
      const { data, sha } = await store.read();
      return res.status(200).json({ data, sha });
    }

    if (req.method === "PUT") {
      const { data, sha, message } = (req.body || {}) as {
        data?: unknown;
        sha?: string;
        message?: string;
      };
      if (!sha) throw new HttpError(400, "Missing file version. Reload and try again.");
      const clean = validate(data);
      const commitMessage = isString(message, 200) ? message : "Update globe routes";
      const result = await store.write(clean, sha, commitMessage);
      return res.status(200).json({ ...result, data: clean });
    }

    res.setHeader("Allow", "GET, PUT");
    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    const err = error as HttpError;
    if (!err.status) console.error(error);
    return res.status(err.status || 500).json({ error: err.message || "Something went wrong." });
  }
}

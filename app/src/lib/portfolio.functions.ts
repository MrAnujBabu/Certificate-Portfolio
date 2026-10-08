import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { REPO_BRANCH, REPO_NAME, REPO_OWNER, type Certificate } from "./portfolio";

const GATEWAY_URL = "https://connector-gateway.lovable.dev/github";
const GITHUB_API = "https://api.github.com";

// Writes (saving a certificate) need GitHub permission. Two ways to get it:
//   1. GITHUB_TOKEN — a GitHub token you create yourself. Used when the site is
//      hosted somewhere else (e.g. Vercel), where the Lovable connection isn't available.
//   2. The Lovable GitHub connection (LOVABLE_API_KEY + GITHUB_API_KEY) — used here
//      in the editor preview.
async function gh(path: string, init?: RequestInit) {
  const directToken = process.env["GITHUB_TOKEN"];
  const lovableKey = process.env["LOVABLE_API_KEY"];
  const ghKey = process.env["GITHUB_API_KEY"];

  let url = `${GATEWAY_URL}/repos/${REPO_OWNER}/${REPO_NAME}/${path}`;
  let headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "Content-Type": "application/json",
    Authorization: `Bearer ${lovableKey}`,
    "X-Connection-Api-Key": ghKey ?? "",
  };

  if (directToken) {
    url = `${GITHUB_API}/repos/${REPO_OWNER}/${REPO_NAME}/${path}`;
    headers = {
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${directToken}`,
    };
  } else if (!lovableKey || !ghKey) {
    throw new Error(
      "GitHub is not set up on this host — add GITHUB_TOKEN (a GitHub token with write access to the certificate repository) to the environment.",
    );
  }

  const res = await fetch(url, { ...init, headers: { ...headers, ...(init?.headers ?? {}) } });
  if (!res.ok) {
    const body = await res.text();
    console.error(`GitHub request failed [${res.status}]: ${body}`);
    throw new Error(`GitHub request failed [${res.status}]: ${body}`);
  }
  return res.json();
}

function decodeBase64Utf8(b64: string) {
  const bin = atob(b64.replace(/\n/g, ""));
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

function encodeUtf8Base64(text: string) {
  const bytes = new TextEncoder().encode(text);
  let bin = "";
  for (let i = 0; i < bytes.length; i += 0x8000) {
    bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(bin);
}

async function readData(): Promise<{ list: Certificate[]; sha: string }> {
  const file = await gh(`contents/data.json?ref=${REPO_BRANCH}`);
  const list = JSON.parse(decodeBase64Utf8(file.content)) as Certificate[];
  return { list, sha: file.sha };
}

async function writeData(list: Certificate[], sha: string, message: string) {
  await gh("contents/data.json", {
    method: "PUT",
    body: JSON.stringify({
      message,
      content: encodeUtf8Base64(JSON.stringify(list, null, 2) + "\n"),
      sha,
      branch: REPO_BRANCH,
    }),
  });
}

function checkPassword(password: string) {
  const expected = process.env['ADMIN_PASSWORD'];
  if (!expected) throw new Error("Admin password has not been set up yet");
  if (password !== expected) throw new Error("Wrong password");
}

export const getCertificates = createServerFn({ method: "GET" }).handler(async () => {
  // Public read: the repo is public, so fetch the list straight from GitHub's
  // file server. This works on any host (Lovable, Vercel, ...) with no keys.
  try {
    const res = await fetch(
      `https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME}/${REPO_BRANCH}/data.json?ts=${Date.now()}`,
      { headers: { "Cache-Control": "no-cache" } },
    );
    if (res.ok) return (await res.json()) as Certificate[];
  } catch {
    // fall back to the connected GitHub account below
  }
  const { list } = await readData();
  return list;
});

export const verifyAdmin = createServerFn({ method: "POST" })
  .validator((d: unknown) => z.object({ password: z.string().min(1).max(200) }).parse(d))
  .handler(async ({ data }) => {
    checkPassword(data.password);
    return { ok: true };
  });

const certSchema = z.object({
  id: z.string().trim().min(1).max(40).regex(/^[A-Za-z0-9_-]+$/),
  courseName: z.string().trim().min(1).max(200),
  platform: z.string().trim().min(1).max(100),
  completionDate: z.string().trim().max(40),
  image: z.string().max(500),
  description: z.string().max(5000),
  overview: z.string().max(10000).optional(),
  experience: z.string().max(5000).optional(),
  skills: z.array(z.string().max(60)).max(50),
  duration: z.string().max(60).optional(),
  status: z.string().max(40),
  projectLinks: z
    .array(z.object({ name: z.string().max(80), url: z.string().url().max(500) }))
    .max(10)
    .optional(),
});

export const saveCertificate = createServerFn({ method: "POST" })
  .validator((d: unknown) =>
    z
      .object({
        password: z.string().min(1).max(200),
        originalId: z.string().max(40).optional(),
        cert: certSchema,
        file: z
          .object({
            ext: z.string().regex(/^(png|jpg|jpeg|webp|gif|pdf)$/i),
            base64: z.string().max(14_000_000),
          })
          .optional(),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    checkPassword(data.password);
    const cert: Certificate = { ...data.cert };

    // New certificates never overwrite an existing one: pick the next free number on the server.
    if (!data.originalId) {
      const { list: current } = await readData();
      const taken = new Set(current.map((c) => c.id));
      if (taken.has(cert.id)) {
        let n = current.reduce((m, c) => Math.max(m, Number(c.id.match(/(\d+)$/)?.[1] ?? 0)), 0) + 1;
        while (taken.has(`DL-${String(n).padStart(3, "0")}`)) n++;
        cert.id = `DL-${String(n).padStart(3, "0")}`;
      }
    }

    if (data.file) {
      const path = `images/${cert.id}.${data.file.ext.toLowerCase()}`;
      let existingSha: string | undefined;
      try {
        const existing = await gh(`contents/${path}?ref=${REPO_BRANCH}`);
        existingSha = existing.sha;
      } catch {
        existingSha = undefined;
      }
      await gh(`contents/${path}`, {
        method: "PUT",
        body: JSON.stringify({
          message: `Upload certificate file for ${cert.id}`,
          content: data.file.base64,
          branch: REPO_BRANCH,
          ...(existingSha ? { sha: existingSha } : {}),
        }),
      });
      cert.image = path;
    }

    const { list, sha } = await readData();
    const idx = data.originalId ? list.findIndex((c) => c.id === data.originalId) : -1;
    if (idx === -1 && list.some((c) => c.id === cert.id)) {
      throw new Error(`A certificate with number ${cert.id} already exists`);
    }
    if (idx >= 0) list[idx] = cert;
    else list.push(cert);
    await writeData(list, sha, `${idx >= 0 ? "Update" : "Add"} certificate ${cert.id}`);
    return { ok: true };
  });

export const deleteCertificate = createServerFn({ method: "POST" })
  .validator((d: unknown) =>
    z.object({ password: z.string().min(1).max(200), id: z.string().min(1).max(40) }).parse(d),
  )
  .handler(async ({ data }) => {
    checkPassword(data.password);
    const { list, sha } = await readData();
    const removed = list.find((c) => c.id === data.id);
    if (!removed) throw new Error("That certificate no longer exists");
    const next = list.filter((c) => c.id !== data.id);
    await writeData(next, sha, `Remove certificate ${data.id}`);

    // Also remove the uploaded file when it lives in the repo and nothing else uses it.
    const img = removed.image?.replace(/^\//, "");
    const stillUsed = next.some((c) => c.image?.replace(/^\//, "") === img);
    if (img && /^images\/[A-Za-z0-9_.-]+$/.test(img) && !stillUsed) {
      try {
        const existing = await gh(`contents/${img}?ref=${REPO_BRANCH}`);
        await gh(`contents/${img}`, {
          method: "DELETE",
          body: JSON.stringify({ message: `Remove file for ${data.id}`, sha: existing.sha, branch: REPO_BRANCH }),
        });
      } catch (err) {
        console.error("Could not remove certificate file", err);
      }
    }
    return { ok: true };
  });

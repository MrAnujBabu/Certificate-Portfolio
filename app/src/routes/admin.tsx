import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { sortAndFilter } from "@/lib/cert-list";
import { toast } from "sonner";
import { ArrowLeft, Award, FileUp, Loader2, Lock, MessageSquare, Pencil, Plus, Trash2, X, Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { deleteCertificate, saveCertificate, verifyAdmin } from "@/lib/portfolio.functions";
import { deleteContactMessage, listContactMessages, markContactRead } from "@/lib/contact.functions";
import { extractCertificate } from "@/lib/extract.functions";
import { fileUrl, isPdf, type Certificate } from "@/lib/portfolio";
import { certificatesQuery } from "./index";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin - Manage Certificates" },
      { name: "description", content: "Add, edit or remove certificates and projects." },
      { property: "og:title", content: "Admin - Manage Certificates" },
      { property: "og:description", content: "Add, edit or remove certificates and projects." },
      { name: "robots", content: "noindex" },
    ],
  }),
  ssr: false,
  component: AdminPage,
});

const PW_KEY = "admin-pw";

function AdminPage() {
  const [password, setPassword] = useState<string | null>(null);
  useEffect(() => {
    setPassword(sessionStorage.getItem(PW_KEY));
  }, []);
  if (!password) return <Login onOk={(p) => { sessionStorage.setItem(PW_KEY, p); setPassword(p); }} />;
  return <Dashboard password={password} onLogout={() => { sessionStorage.removeItem(PW_KEY); setPassword(null); }} />;
}

function Login({ onOk }: { onOk: (p: string) => void }) {
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <div className="flex min-h-screen items-center justify-center bg-hero p-5">
      <form
        className="w-full max-w-sm rounded-2xl border border-border bg-card p-7 shadow-card"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          try {
            await verifyAdmin({ data: { password: pw } });
            onOk(pw);
          } catch (err) {
            toast.error(err instanceof Error ? err.message : "Could not sign in");
          } finally {
            setBusy(false);
          }
        }}
      >
        <Lock className="mx-auto h-9 w-9 text-primary" />
        <h1 className="mt-3 text-center text-2xl font-bold">Admin</h1>
        <p className="mt-1 text-center text-sm text-muted-foreground">Enter your password to manage certificates.</p>
        <Input className="mt-6" type="password" placeholder="Password" value={pw} onChange={(e) => setPw(e.target.value)} autoFocus />
        <Button className="mt-4 w-full" disabled={busy || !pw}>
          {busy && <Loader2 className="h-4 w-4 animate-spin" />} Open
        </Button>
      </form>
    </div>
  );
}

function Dashboard({ password, onLogout }: { password: string; onLogout: () => void }) {
  const { data, isLoading } = useQuery(certificatesQuery);
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Certificate | "new" | null>(null);
  const [tab, setTab] = useState<"certs" | "messages">("certs");
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("all");
  const [sort, setSort] = useState("newest");
  const shown = sortAndFilter(data ?? [], q, filter, sort);
  const messages = useQuery({
    queryKey: ["contact-messages", password],
    queryFn: () => listContactMessages({ data: { password } }),
  });
  const unread = (messages.data ?? []).filter((m) => !m.is_read).length;
  const refreshMessages = () => qc.invalidateQueries({ queryKey: ["contact-messages", password] });

  const nextId = () => {
    const nums = (data ?? []).map((c) => parseInt(c.id.replace(/\D/g, ""), 10)).filter((n) => !isNaN(n));
    return `DL-${String((nums.length ? Math.max(...nums) : 0) + 1).padStart(3, "0")}`;
  };

  if (editing) {
    return (
      <CertForm
        initial={editing === "new" ? null : editing}
        suggestedId={nextId()}
        password={password}
        onDone={async () => {
          setEditing(null);
          await qc.invalidateQueries({ queryKey: certificatesQuery.queryKey });
        }}
        onCancel={() => setEditing(null)}
      />
    );
  }

  return (
    <div className="mx-auto min-h-screen max-w-3xl px-5 py-8">
      <div className="flex items-center justify-between">
        <Link to="/" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> View site
        </Link>
        <Button size="sm" variant="ghost" onClick={onLogout}>Sign out</Button>
      </div>
      <h1 className="mt-6 text-3xl font-bold">Your site</h1>
      <p className="mt-1 text-muted-foreground">Certificates and messages, all in one place.</p>

      <div className="mt-5 flex flex-wrap gap-2">
        <Button size="sm" variant={tab === "certs" ? "default" : "secondary"} onClick={() => setTab("certs")}>
          <Award className="h-4 w-4" /> Certificates
        </Button>
        <Button size="sm" variant={tab === "messages" ? "default" : "secondary"} onClick={() => setTab("messages")}>
          <MessageSquare className="h-4 w-4" /> Messages
          {unread > 0 && (
            <span className="ml-1 rounded-full bg-primary px-1.5 text-xs font-bold text-primary-foreground">{unread}</span>
          )}
        </Button>
      </div>

      {tab === "certs" ? (
        <>
          <p className="mt-4 text-sm text-muted-foreground">
            Add a new one, or tap any card to change it. Changes go live in about a minute.
          </p>

          <Button size="lg" className="mt-6 h-14 w-full text-base" onClick={() => setEditing("new")}>
            <Plus className="h-5 w-5" /> Add a new certificate or project
          </Button>

          <div className="mt-6 grid gap-2 sm:grid-cols-3">
            <input
              aria-label="Search"
              placeholder="Search name or place…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="h-10 rounded-lg border border-border bg-card px-3 text-sm"
            />
            <select aria-label="Filter" value={filter} onChange={(e) => setFilter(e.target.value)} className="h-10 rounded-lg border border-border bg-card px-3 text-sm">
              <option value="all">All</option>
              <option value="Verified">Finished only</option>
              <option value="In Progress">Still learning only</option>
            </select>
            <select aria-label="Order" value={sort} onChange={(e) => setSort(e.target.value)} className="h-10 rounded-lg border border-border bg-card px-3 text-sm">
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="az">Name A–Z</option>
              <option value="za">Name Z–A</option>
              <option value="id">By number (DL-001…)</option>
            </select>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">Showing {shown.length} of {data?.length ?? 0}</p>

          <div className="mt-3 space-y-3">
            {isLoading && <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />}
            {!isLoading && shown.length === 0 && <p className="text-center text-sm text-muted-foreground">Nothing matches.</p>}
            {shown.map((c) => (
              <div key={c.id} className="flex items-center gap-3 rounded-xl border border-border bg-card p-4">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{c.courseName}</p>
                  <p className="text-sm text-muted-foreground">{c.platform} · {c.completionDate} · {c.status}</p>
                </div>
                <Button size="icon" variant="secondary" aria-label="Edit" onClick={() => setEditing(c)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  aria-label="Delete"
                  onClick={async () => {
                    if (!confirm(`Remove "${c.courseName}" from your site?`)) return;
                    const t = toast.loading("Removing…");
                    try {
                      await deleteCertificate({ data: { password, id: c.id } });
                      toast.success("Removed", { id: t });
                      await qc.invalidateQueries({ queryKey: certificatesQuery.queryKey });
                    } catch (err) {
                      toast.error(err instanceof Error ? err.message : "Failed", { id: t });
                    }
                  }}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        </>
      ) : (
        <MessagesPanel
          password={password}
          messages={messages.data ?? []}
          isLoading={messages.isLoading}
          onChanged={refreshMessages}
        />
      )}
    </div>
  );
}

function readAsBase64(file: File) {
  return new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result).split(",")[1] ?? "");
    r.onerror = () => reject(r.error);
    r.readAsDataURL(file);
  });
}

function toInputDate(s: string) {
  const d = new Date(s);
  return isNaN(d.getTime()) ? "" : d.toISOString().slice(0, 10);
}
function fromInputDate(s: string) {
  const d = new Date(s);
  return isNaN(d.getTime()) ? s : d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function CertForm({
  initial,
  suggestedId,
  password,
  onDone,
  onCancel,
}: {
  initial: Certificate | null;
  suggestedId: string;
  password: string;
  onDone: () => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initial?.courseName ?? "");
  const [platform, setPlatform] = useState(initial?.platform ?? "");
  const [date, setDate] = useState(initial ? toInputDate(initial.completionDate) : new Date().toISOString().slice(0, 10));
  const [status, setStatus] = useState(initial?.status ?? "Verified");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [skills, setSkills] = useState((initial?.skills ?? []).join(", "));
  const [links, setLinks] = useState(initial?.projectLinks?.length ? initial.projectLinks : [{ name: "", url: "" }]);
  const [file, setFile] = useState<File | null>(null);
  const [imageLink, setImageLink] = useState(/^https?:\/\//.test(initial?.image ?? "") ? initial!.image : "");
  const [preview, setPreview] = useState<string | null>(null);
  const [more, setMore] = useState(false);
  const [experience, setExperience] = useState(initial?.experience ?? "");
  const [duration, setDuration] = useState(initial?.duration ?? "");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!file) {
      setPreview(null);
      return;
    }
    const u = URL.createObjectURL(file);
    setPreview(u);
    return () => URL.revokeObjectURL(u);
  }, [file]);

  const [aiText, setAiText] = useState("");
  const [aiBusy, setAiBusy] = useState(false);
  const runAi = async () => {
    if (!file && !aiText.trim()) {
      toast.error("Choose your certificate in step 3 or paste its text first.");
      return;
    }
    if (file && file.size > 10 * 1024 * 1024) {
      toast.error("That file is too big. Please use one under 10 MB.");
      return;
    }
    setAiBusy(true);
    try {
      const r = await extractCertificate({
        data: {
          password,
          text: aiText.trim() || undefined,
          file: file ? { mime: file.type || "image/png", base64: await readAsBase64(file) } : undefined,
        },
      });
      if (r.title) setName(r.title);
      if (r.issuer) setPlatform(r.issuer);
      if (r.date) setDate(r.date);
      if (r.description && !description.trim()) setDescription(r.description);
      if (r.skills.length) {
        setSkills(r.skills.join(", "));
        setMore(true);
      }
      toast.success(r.title || r.issuer ? "Done! Please check the details below." : "Couldn't find much — please fill it in yourself.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not read it");
    } finally {
      setAiBusy(false);
    }
  };

  const save = async () => {
    if (!name.trim() || !platform.trim()) {
      toast.error("Please fill in the name and where you learned it.");
      return;
    }
    if (file && file.size > 10 * 1024 * 1024) {
      toast.error("That file is too big. Please use one under 10 MB.");
      return;
    }
    let linkImage = "";
    if (!file && imageLink.trim()) {
      linkImage = /^https?:\/\//i.test(imageLink.trim()) ? imageLink.trim() : `https://${imageLink.trim()}`;
      try {
        new URL(linkImage);
      } catch {
        toast.error("That certificate link doesn't look right. Please paste the full web address.");
        return;
      }
    }
    const cleanLinks = links
      .filter((l) => l.url.trim())
      .map((l) => {
        const url = /^https?:\/\//.test(l.url.trim()) ? l.url.trim() : `https://${l.url.trim()}`;
        return { name: l.name.trim() || "Open link", url };
      });
    setBusy(true);
    const t = toast.loading("Saving to your site…");
    try {
      const ext = file?.name.split(".").pop()?.toLowerCase();
      await saveCertificate({
        data: {
          password,
          originalId: initial?.id,
          cert: {
            id: initial?.id ?? suggestedId,
            courseName: name.trim(),
            platform: platform.trim(),
            completionDate: fromInputDate(date),
            image: linkImage || (/^https?:\/\//.test(initial?.image ?? "") && !imageLink.trim() ? "" : initial?.image ?? ""),
            description: description.trim(),
            overview: initial?.overview ?? "",
            experience: experience.trim(),
            skills: skills.split(",").map((s) => s.trim()).filter(Boolean),
            duration: duration.trim(),
            status,
            projectLinks: cleanLinks,
          },
          file: file && ext ? { ext: ext === "jpeg" ? "jpg" : ext, base64: await readAsBase64(file) } : undefined,
        },
      });
      toast.success("Saved! It will appear on your site in about a minute.", { id: t });
      onDone();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save", { id: t });
    } finally {
      setBusy(false);
    }
  };

  const currentFile = initial?.image ? fileUrl(initial.image) : null;

  return (
    <div className="mx-auto min-h-screen max-w-2xl px-5 py-8 pb-28">
      <button onClick={onCancel} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>
      <h1 className="mt-5 text-3xl font-bold">{initial ? "Change certificate" : "Add a new certificate"}</h1>
      <p className="mt-1 text-muted-foreground">Fill in what you know. Only the first two are required.</p>

      <div className="mt-6 rounded-2xl border border-primary/40 bg-card p-4">
        <p className="flex items-center gap-2 font-semibold"><Sparkles className="h-4 w-4 text-primary" /> Fill it in for me</p>
        <p className="mt-1 text-sm text-muted-foreground">Choose your certificate in step 3 below, or paste its text here, then tap the button. You can check and change everything after.</p>
        <Textarea className="mt-3" rows={3} value={aiText} onChange={(e) => setAiText(e.target.value)} placeholder="Paste certificate text here (optional)" />
        <Button type="button" className="mt-3 w-full" disabled={aiBusy} onClick={runAi}>
          {aiBusy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
          {aiBusy ? "Reading your certificate…" : "Read my certificate"}
        </Button>
      </div>

      <div className="mt-8 space-y-7">
        <Step n={1} title="What is it called?">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Machine Learning Basics" />
        </Step>

        <Step n={2} title="Where did you learn it?">
          <Input value={platform} onChange={(e) => setPlatform(e.target.value)} placeholder="e.g. Coursera, Google, Udemy" />
        </Step>

        <Step n={3} title="Upload the certificate" hint="Choose a photo, screenshot or PDF — or paste a link.">
          <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-muted/40 p-8 text-center transition hover:border-primary">
            {preview && file && !isPdf(file.name) ? (
              <img src={preview} alt="Preview" className="max-h-48 rounded-lg" />
            ) : (
              <FileUp className="h-8 w-8 text-primary" />
            )}
            <span className="font-medium">{file ? file.name : "Tap to choose a file"}</span>
            {!file && currentFile && <span className="text-xs text-muted-foreground">Leave empty to keep the current file</span>}
            <input
              type="file"
              accept="image/*,application/pdf"
              className="hidden"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </label>
          <div className="mt-4">
            <p className="mb-2 text-sm text-muted-foreground">Or paste a link to your certificate (e.g. from Coursera, Credly or Google Drive):</p>
            <Input
              value={imageLink}
              onChange={(e) => setImageLink(e.target.value)}
              placeholder="https://..."
              disabled={!!file}
              inputMode="url"
            />
            {file && <p className="mt-1 text-xs text-muted-foreground">You chose a file, so the link will be ignored.</p>}
          </div>
        </Step>

        <Step n={4} title="When did you finish?">
          <div className="flex flex-wrap gap-3">
            <Input type="date" className="max-w-48" value={date} onChange={(e) => setDate(e.target.value)} />
            {(["Verified", "In Progress"] as const).map((s) => (
              <Button key={s} type="button" variant={status === s ? "default" : "secondary"} onClick={() => setStatus(s)}>
                {status === s && <Check className="h-4 w-4" />} {s === "Verified" ? "Finished" : "Still learning"}
              </Button>
            ))}
          </div>
        </Step>

        <Step n={5} title="Say a few words about it" hint="What was it about? What did you build?">
          <Textarea rows={4} value={description} onChange={(e) => setDescription(e.target.value)} />
        </Step>

        <Step n={6} title="Links (optional)" hint="Your live project, source code, or verify link.">
          <div className="space-y-2">
            {links.map((l, i) => (
              <div key={i} className="flex gap-2">
                <Input
                  className="w-2/5"
                  placeholder="Button text, e.g. Live Demo"
                  value={l.name}
                  onChange={(e) => setLinks(links.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))}
                />
                <Input
                  placeholder="Paste link here"
                  value={l.url}
                  onChange={(e) => setLinks(links.map((x, j) => (j === i ? { ...x, url: e.target.value } : x)))}
                />
                <Button type="button" size="icon" variant="ghost" aria-label="Remove link" onClick={() => setLinks(links.filter((_, j) => j !== i))}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button type="button" size="sm" variant="secondary" onClick={() => setLinks([...links, { name: "", url: "" }])}>
              <Plus className="h-4 w-4" /> Add another link
            </Button>
          </div>
        </Step>

        {!more ? (
          <button type="button" className="text-sm text-primary hover:underline" onClick={() => setMore(true)}>
            + Add more details (skills, duration, your experience)
          </button>
        ) : (
          <div className="space-y-5 rounded-xl border border-border p-5">
            <Field label="Skills you learned" hint="Separate with commas">
              <Input value={skills} onChange={(e) => setSkills(e.target.value)} placeholder="Python, AI, Chatbots" />
            </Field>
            <Field label="How long did it take?">
              <Input value={duration} onChange={(e) => setDuration(e.target.value)} placeholder="e.g. 4 weeks" />
            </Field>
            <Field label="Your experience">
              <Textarea rows={3} value={experience} onChange={(e) => setExperience(e.target.value)} />
            </Field>
          </div>
        )}
      </div>

      <div className="fixed inset-x-0 bottom-0 border-t border-border bg-background/95 p-4 backdrop-blur">
        <div className="mx-auto flex max-w-2xl gap-3">
          <Button variant="secondary" className="h-12 flex-1" onClick={onCancel} disabled={busy}>Cancel</Button>
          <Button className="h-12 flex-[2] text-base" onClick={save} disabled={busy}>
            {busy && <Loader2 className="h-4 w-4 animate-spin" />} Save to my site
          </Button>
        </div>
      </div>
    </div>
  );
}

function Step({ n, title, hint, children }: { n: number; title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section>
      <div className="mb-2 flex items-center gap-3">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/15 text-sm font-bold text-primary">{n}</span>
        <div>
          <h2 className="font-semibold">{title}</h2>
          {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
        </div>
      </div>
      {children}
    </section>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      {children}
    </div>
  );
}

function MessagesPanel({
  password,
  messages,
  isLoading,
  onChanged,
}: {
  password: string;
  messages: { id: string; name: string; email: string; message: string; is_read: boolean; created_at: string }[];
  isLoading: boolean;
  onChanged: () => void;
}) {
  const [open, setOpen] = useState<string | null>(null);

  if (isLoading) return <Loader2 className="mx-auto mt-10 h-6 w-6 animate-spin text-muted-foreground" />;
  if (messages.length === 0)
    return (
      <div className="mt-6 rounded-2xl border border-dashed border-border py-12 text-center text-muted-foreground">
        No messages yet. When someone writes to you from the site, it will show up here.
      </div>
    );

  const markRead = async (id: string) => {
    try {
      await markContactRead({ data: { password, id } });
      onChanged();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not update that message.");
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this message?")) return;
    try {
      await deleteContactMessage({ data: { password, id } });
      toast.success("Message deleted");
      onChanged();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not delete that message.");
    }
  };

  return (
    <div className="mt-6 space-y-3">
      {messages.map((m) => {
        const expanded = open === m.id;
        return (
          <div key={m.id} className={`rounded-xl border bg-card p-4 ${m.is_read ? "border-border" : "border-primary/50"}`}>
            <div className="flex items-start gap-3">
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{m.name}</p>
                <a
                  className="break-all text-sm text-primary underline-offset-2 hover:underline"
                  href={`mailto:${m.email}`}
                >
                  {m.email}
                </a>
                <p className="mt-0.5 text-xs text-muted-foreground">{fmtMessageDate(m.created_at)}</p>
              </div>
              {!m.is_read && (
                <span className="shrink-0 rounded-full bg-primary/15 px-2 py-0.5 text-xs font-semibold text-primary">New</span>
              )}
            </div>
            <p className={`mt-3 whitespace-pre-line text-sm text-foreground/85 ${expanded ? "" : "line-clamp-3"}`}>
              {m.message}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button size="sm" variant="ghost" onClick={() => setOpen(expanded ? null : m.id)}>
                {expanded ? "Show less" : "Read more"}
              </Button>
              {!m.is_read && (
                <Button size="sm" variant="secondary" onClick={() => markRead(m.id)}>
                  <Check className="h-4 w-4" /> Mark as read
                </Button>
              )}
              <Button size="sm" variant="ghost" onClick={() => remove(m.id)}>
                <Trash2 className="h-4 w-4 text-destructive" /> Delete
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function fmtMessageDate(iso: string) {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

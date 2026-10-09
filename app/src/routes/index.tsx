// ============= Full file contents =============

import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import {
  GraduationCap,
  Award,
  BadgeCheck,
  Calendar,
  ExternalLink,
  Eye,
  Github,
  Clock,
  Flower2,
  Building2,
  Code,
  IdCard,
  ArrowDown,
  Layers,
  Loader,
  FileText,
  FolderGit2,
  Mail,
  Send,
} from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { getCertificates } from "@/lib/portfolio.functions";
import { submitContact } from "@/lib/contact.functions";
import { fileUrl, type Certificate } from "@/lib/portfolio";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export const certificatesQuery = queryOptions({
  queryKey: ["certificates"],
  queryFn: () => getCertificates(),
});

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Anuj Kumar Yadav - Certificates" },
      { name: "description", content: "Verified certificates, projects and skills of Anuj Kumar Yadav." },
      { property: "og:title", content: "Anuj Kumar Yadav - Certificates" },
      { property: "og:description", content: "Verified certificates, projects and skills of Anuj Kumar Yadav." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(certificatesQuery),
  component: Home,
  errorComponent: () => (
    <div className="flex min-h-screen items-center justify-center p-6 text-center text-muted-foreground">
      Couldn't load certificates right now. Please refresh.
    </div>
  ),
});

function Home() {
  const { data } = useSuspenseQuery(certificatesQuery);
  const [filter, setFilter] = useState<"all" | "Verified" | "In Progress">("all");
  const list = filter === "all" ? data : data.filter((c) => c.status === filter);
  const verified = data.filter((c) => c.status === "Verified").length;
  const platforms = new Set(data.map((c) => c.platform.trim())).size;
  const skills = Array.from(new Set(data.flatMap((c) => c.skills ?? []))).filter(Boolean);

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3">
          <a href="#top" className="flex items-center gap-2 font-display font-semibold">
            <Github className="h-5 w-5" /> <span className="hidden sm:inline">MrAnujBabu</span>
          </a>
          <nav className="flex items-center gap-1 sm:gap-2">
            <Button asChild size="sm" variant="secondary">
              <a href="#certifications">
                <Award className="h-4 w-4" /> <span className="hidden min-[400px]:inline">Certificates</span>
              </a>
            </Button>
            <Button asChild size="sm" variant="ghost">
              <a href="#skills">
                <Code className="h-4 w-4" /> Skills
              </a>
            </Button>
            <Button asChild size="sm" variant="ghost">
              <a href="#contact">
                <Mail className="h-4 w-4" /> <span className="hidden min-[400px]:inline">Contact</span>
              </a>
            </Button>
            <Button asChild size="sm">
              <a href="https://github.com/MrAnujBabu" target="_blank" rel="noreferrer">
                <Github className="h-4 w-4" /> <span className="hidden min-[400px]:inline">View Profile</span>
              </a>
            </Button>
          </nav>
        </div>
      </header>

      <section id="top" className="bg-hero">
        <div className="mx-auto max-w-6xl px-5 py-12 text-center md:py-24">
          <div className="relative mx-auto mb-6 w-fit">
            <div className="rounded-full border-2 border-primary/70 p-1 shadow-[0_0_70px_-5px_oklch(0.651_0.124_119.4)]">
              <div className="rounded-full bg-background p-1">
                <div className="flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/75 text-foreground">
                  <svg viewBox="0 0 64 64" className="h-14 w-14" fill="currentColor" aria-label="Graduate">
                    <path d="M32 4 6 13l26 9 26-9-26-9Z" />
                    <rect x="11" y="14" width="3" height="14" rx="1" />
                    <path d="M8 28h9l-1.5 7h-6L8 28Z" />
                    <path d="M19 19v6c0 7 6 13 13 13s13-6 13-13v-6l-13 4.5L19 19Z" />
                    <path d="M14 60c0-10 6-17 12-18l6 8 6-8c6 1 12 8 12 18H14Z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <h1 className="text-4xl font-bold leading-tight tracking-tight sm:text-5xl md:text-6xl">Anuj Kumar Yadav</h1>
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-3 py-1 text-sm font-medium text-primary">
              <BadgeCheck className="h-4 w-4" /> Verified
            </span>
          </div>
          <p className="mt-3 text-lg text-muted-foreground">AI is the new Electricity</p>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            Passionate about building intelligent systems and contributing to open-source projects. All certifications
            listed below are independently verified and linked to original credentials.
          </p>
          <div className="mx-auto mt-10 grid max-w-lg grid-cols-3 gap-3 sm:gap-4">
            <Stat n={data.length} label="Certificates" tone="text-chart-1" />
            <Stat n={verified} label="Verified" tone="text-chart-2" />
            <Stat n={platforms} label="Platforms" tone="text-chart-3" />
          </div>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="lg">
              <a href="https://github.com/MrAnujBabu" target="_blank" rel="noreferrer">
                <Github className="h-4 w-4" /> GitHub Profile
              </a>
            </Button>
            <Button asChild size="lg" variant="secondary">
              <a href="#certifications">
                <ArrowDown className="h-4 w-4" /> Browse Certificates
              </a>
            </Button>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-6xl px-5 pb-20">
        <div id="certifications" className="mb-6 flex scroll-mt-20 flex-wrap items-center justify-between gap-3 pt-12">
          <h2 className="flex items-center gap-2 text-2xl font-semibold">
            <Award className="h-6 w-6 text-accent" /> My Certifications
          </h2>
          <div className="flex flex-wrap gap-2">
            {(["all", "Verified", "In Progress"] as const).map((f) => (
              <Button key={f} size="sm" className="rounded-full" variant={filter === f ? "default" : "secondary"} onClick={() => setFilter(f)}>
                {f === "all" ? <Layers className="h-3.5 w-3.5" /> : f === "Verified" ? <BadgeCheck className="h-3.5 w-3.5" /> : <Loader className="h-3.5 w-3.5" />}
                {f === "all" ? "All" : f}
              </Button>
            ))}
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((c) => (
            <CertCard key={c.id} c={c} />
          ))}
          {list.length === 0 && <p className="col-span-full rounded-2xl border border-dashed border-border py-12 text-center text-muted-foreground">No certificates in this group yet.</p>}
        </div>

        {skills.length > 0 && (
          <section id="skills" className="mt-16 scroll-mt-20">
            <h2 className="mb-4 flex items-center gap-2 text-2xl font-semibold">
              <Code className="h-6 w-6 text-accent" /> Technical Skills
            </h2>
            <div className="flex flex-wrap gap-2">
              {skills.map((s) => (
                <span key={s} className="rounded-full border border-border bg-card px-3 py-1 text-sm">
                  {s}
                </span>
              ))}
            </div>
          </section>
        )}
      </main>

      <ContactSection />

      <footer className="border-t border-border py-8 text-center text-sm text-muted-foreground">
        <div className="mb-5 flex flex-wrap justify-center gap-3">
          <Button asChild size="sm" variant="secondary"><a href="https://github.com/MrAnujBabu/Certificate-Portfolio" target="_blank" rel="noreferrer"><Github className="h-4 w-4" /> Source Code</a></Button>
          <Button asChild size="sm" variant="secondary"><a href="https://github.com/MrAnujBabu" target="_blank" rel="noreferrer"><FileText className="h-4 w-4" /> Resume</a></Button>
          <Button asChild size="sm" variant="secondary"><a href="https://github.com/MrAnujBabu?tab=repositories" target="_blank" rel="noreferrer"><FolderGit2 className="h-4 w-4" /> Projects</a></Button>
        </div>
        <p>© {new Date().getFullYear()} Anuj Kumar Yadav | All Certificates are ✓ Verified</p>
        <p className="mt-1">Hosted on GitHub Pages | Last Updated: {new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</p>
      </footer>
    </div>
  );
}

function Stat({ n, label, tone }: { n: number; label: string; tone: string }) {
  return (
    <div className="rounded-2xl border border-border bg-secondary px-2 py-5 sm:px-6">
      <div className={`font-display text-3xl font-bold ${tone}`}>{n}</div>
      <div className="text-[10px] uppercase tracking-wider sm:text-xs text-muted-foreground">{label}</div>
    </div>
  );
}

function CertCard({ c }: { c: Certificate }) {
  const verified = c.status === "Verified";
  const extraSkills = Math.max((c.skills?.length ?? 0) - 3, 0);
  return (
    <article className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-card transition duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-glow">
      <div className="flex items-center gap-4 border-b border-border bg-secondary/50 p-5">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-background">
          <Flower2 className="h-6 w-6 text-accent" />
        </div>
        <div className="min-w-0">
          <h3 className="line-clamp-2 font-semibold leading-snug">{c.courseName}</h3>
          <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Building2 className="h-3.5 w-3.5" /> {c.platform}
          </p>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-chart-1" /> {fmtDate(c.completionDate)}
          </span>
          <span className="flex items-center gap-1 rounded-md bg-chart-1/15 px-2 py-0.5 font-medium text-chart-1">
            <IdCard className="h-3.5 w-3.5" /> {c.id}
          </span>
        </div>
        <span
          className={`mt-3 inline-flex w-fit items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold uppercase tracking-wide ${
            verified ? "bg-primary/15 text-primary" : "bg-accent/15 text-accent"
          }`}
        >
          {verified ? <BadgeCheck className="h-3.5 w-3.5" /> : <Clock className="h-3.5 w-3.5" />} {c.status}
        </span>
        <p className="mt-3 line-clamp-4 whitespace-pre-line text-sm text-foreground/85">{c.description}</p>
        {c.skills?.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {c.skills.slice(0, 3).map((s) => (
              <span key={s} className="rounded-md bg-secondary px-2 py-0.5 text-xs">
                {s}
              </span>
            ))}
            {extraSkills > 0 && <span className="rounded-md bg-secondary px-2 py-0.5 text-xs">+{extraSkills}</span>}
          </div>
        )}

        <div className="mt-auto border-t border-border pt-4">
          {c.projectLinks && c.projectLinks.length > 0 && (
            <div className="mb-2 grid gap-2" style={{ gridTemplateColumns: `repeat(${Math.min(c.projectLinks.length, 2)}, minmax(0, 1fr))` }}>
              {c.projectLinks.map((l) => (
                <Button key={l.url} asChild size="sm" variant="secondary">
                  <a href={l.url} target="_blank" rel="noreferrer">
                    <ExternalLink className="h-3.5 w-3.5" /> {l.name}
                  </a>
                </Button>
              ))}
            </div>
          )}
          {c.image && (
            <Button asChild size="sm" className="mt-2 w-full">
              <a href={fileUrl(c.image)} target="_blank" rel="noreferrer">
                <Eye className="h-3.5 w-3.5" /> View Certificate Image
              </a>
            </Button>
          )}
        </div>
      </div>
    </article>
  );
}

function fmtDate(d: string) {
  const t = new Date(d);
  return isNaN(t.getTime()) ? d : t.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function ContactSection() {
  const send = useServerFn(submitContact);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [company, setCompany] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) {
      toast.error("Please fill in your name, email and message.");
      return;
    }
    setBusy(true);
    try {
      await send({ data: { name: name.trim(), email: email.trim(), message: message.trim(), company } });
      toast.success("Thanks! Your message has been sent.");
      setName("");
      setEmail("");
      setMessage("");
      setCompany("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Your message could not be sent. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section id="contact" className="mx-auto max-w-3xl scroll-mt-20 px-5 pb-16">
      <div className="rounded-2xl border border-border bg-card p-6 shadow-card sm:p-8">
        <h2 className="flex items-center gap-2 text-2xl font-semibold">
          <Mail className="h-6 w-6 text-accent" /> Get in touch
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Question about a certificate, a project, or working together? Leave your details and I'll get back to you.
        </p>
        <form className="mt-5 grid gap-4" onSubmit={submit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium" htmlFor="ct-name">
                Your name
              </label>
              <Input
                id="ct-name"
                className="mt-1.5"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Priya Sharma"
                maxLength={100}
              />
            </div>
            <div>
              <label className="text-sm font-medium" htmlFor="ct-email">
                Your email
              </label>
              <Input
                id="ct-email"
                className="mt-1.5"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                maxLength={255}
              />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium" htmlFor="ct-msg">
              Your message
            </label>
            <Textarea
              id="ct-msg"
              className="mt-1.5"
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="What would you like to ask?"
              maxLength={2000}
            />
          </div>
          <input
            type="text"
            aria-hidden="true"
            tabIndex={-1}
            autoComplete="off"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            className="hidden"
          />
          <Button type="submit" className="w-full sm:w-auto" disabled={busy}>
            {busy ? <Loader className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Send message
          </Button>
        </form>
      </div>
    </section>
  );
}

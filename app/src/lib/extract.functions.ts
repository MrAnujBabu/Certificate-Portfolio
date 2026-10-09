import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export type Extracted = { title: string; issuer: string; date: string; skills: string[]; description: string };

const schema = {
  type: "object",
  additionalProperties: false,
  required: ["title", "issuer", "date", "skills", "description"],
  properties: {
    title: { type: "string", description: "Certificate or course title; empty if unknown" },
    issuer: { type: "string", description: "Issuing organisation or platform; empty if unknown" },
    date: { type: "string", description: "Completion date as YYYY-MM-DD; empty if unknown" },
    skills: { type: "array", items: { type: "string" } },
    description: { type: "string", description: "One or two sentence summary" },
  },
};

export const extractCertificate = createServerFn({ method: "POST" })
  .validator((d: unknown) =>
    z
      .object({
        password: z.string().min(1).max(200),
        text: z.string().max(20000).optional(),
        file: z.object({ mime: z.string().max(100), base64: z.string().max(15_000_000) }).optional(),
      })
      .refine((v) => v.text?.trim() || v.file, "Add a picture or paste some text first")
      .parse(d),
  )
  .handler(async ({ data }): Promise<Extracted> => {
    if (data.password !== process.env["ADMIN_PASSWORD"]) throw new Error("Wrong password");
    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) throw new Error("AI is not set up yet");

    const content: Record<string, unknown>[] = [
      {
        type: "input_text",
        text:
          "Read this certificate and extract its title, issuer, completion date (YYYY-MM-DD), up to 8 short skill names, and a 1-2 sentence description. Leave fields empty if not present; do not invent." +
          (data.text?.trim() ? `\n\nCertificate text:\n${data.text}` : ""),
      },
    ];
    if (data.file) {
      if (data.file.mime === "application/pdf")
        content.push({ type: "input_file", filename: "certificate.pdf", file_data: `data:application/pdf;base64,${data.file.base64}` });
      else if (data.file.mime.startsWith("image/"))
        content.push({ type: "input_image", image_url: `data:${data.file.mime};base64,${data.file.base64}` });
      else throw new Error("Please use a picture or a PDF");
    }

    const res = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "fetch" },
      body: JSON.stringify({
        model: "openai/gpt-6-astra",
        input: [{ role: "user", content }],
        stream: true,
        store: false,
        reasoning: { effort: "low", summary: "auto" },
        include: ["reasoning.encrypted_content"],
        text: { format: { type: "json_schema", name: "certificate", strict: true, schema } },
      }),
    });
    if (!res.ok || !res.body) {
      const body = await res.text().catch(() => "");
      let msg = "";
      try { msg = JSON.parse(body)?.error?.message ?? JSON.parse(body)?.message ?? ""; } catch { /* ignore */ }
      if (res.status === 429) throw new Error("Too many requests right now. Please wait a minute and try again.");
      if (res.status === 402) throw new Error(msg || "AI credits have run out. Please add credits to your workspace.");
      throw new Error(msg || `AI could not read it (error ${res.status})`);
    }

    const reader = res.body.getReader();
    const dec = new TextDecoder();
    let buf = "";
    let out = "";
    let failed = "";
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += dec.decode(value, { stream: true });
      const lines = buf.split("\n");
      buf = lines.pop() ?? "";
      for (const line of lines) {
        if (!line.startsWith("data:")) continue;
        const p = line.slice(5).trim();
        if (!p || p === "[DONE]") continue;
        try {
          const ev = JSON.parse(p);
          if (ev.type === "response.output_text.delta") out += ev.delta ?? "";
          else if (ev.type === "response.failed" || ev.type === "error")
            failed = ev.response?.error?.message ?? ev.message ?? "AI could not read it";
        } catch { /* partial */ }
      }
    }
    if (failed) throw new Error(failed);
    if (!out.trim()) throw new Error("The AI didn't return anything. Try a clearer picture or paste the text.");
    const r = JSON.parse(out) as Extracted;
    return {
      title: String(r.title ?? "").slice(0, 200),
      issuer: String(r.issuer ?? "").slice(0, 100),
      date: /^\d{4}-\d{2}-\d{2}$/.test(r.date ?? "") ? r.date : "",
      skills: (r.skills ?? []).map((s) => String(s).slice(0, 60)).filter(Boolean).slice(0, 8),
      description: String(r.description ?? "").slice(0, 1000),
    };
  });

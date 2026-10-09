import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";
import { checkPassword } from "./portfolio.functions";

// Messages come in from anyone visiting the site, so the write goes through the
// public database key — the database itself only allows "add a message" for
// visitors, and never lets them read the list. Reading messages needs the
// admin password, so those functions use the privileged key inside the handler.
function publicClient() {
  const url = process.env["SUPABASE_URL"];
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"] ?? process.env["SUPABASE_ANON_KEY"];
  if (!url || !key) throw new Error("The site is not connected to its database on this host.");
  return createClient<Database>(url, key, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
}

export const contactSchema = z.object({
  name: z.string().trim().min(1, "Please tell us your name").max(100),
  email: z
    .string()
    .trim()
    .email("That email address doesn't look right")
    .max(255, "That email address is too long"),
  message: z.string().trim().min(1, "Please write a message").max(2000, "Please keep your message under 2000 characters"),
  // Hidden field real people never fill in — bots do, so those submissions are dropped.
  company: z.string().max(200).optional(),
});

export const submitContact = createServerFn({ method: "POST" })
  .validator((d: unknown) => contactSchema.parse(d))
  .handler(async ({ data }) => {
    if (data.company) return { ok: true }; // looks like a bot: pretend it worked, save nothing
    const { error } = await publicClient().from("contact_messages").insert({
      name: data.name,
      email: data.email,
      message: data.message,
    });
    if (error) {
      console.error(`Message could not be saved [${error.code ?? "?"}]: ${error.message}`);
      throw new Error("Your message could not be sent. Please try again in a moment.");
    }
    return { ok: true };
  });

export const listContactMessages = createServerFn({ method: "POST" })
  .validator((d: unknown) => z.object({ password: z.string().min(1).max(200) }).parse(d))
  .handler(async ({ data }) => {
    checkPassword(data.password);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows, error } = await supabaseAdmin
      .from("contact_messages")
      .select("id, name, email, message, is_read, created_at")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) {
      console.error(`Messages could not be read [${error.code ?? "?"}]: ${error.message}`);
      throw new Error("Messages could not be loaded right now.");
    }
    return rows ?? [];
  });

export const markContactRead = createServerFn({ method: "POST" })
  .validator((d: unknown) => z.object({ password: z.string().min(1).max(200), id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    checkPassword(data.password);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("contact_messages").update({ is_read: true }).eq("id", data.id);
    if (error) {
      console.error(`Message could not be marked read [${error.code ?? "?"}]: ${error.message}`);
      throw new Error("Could not update that message.");
    }
    return { ok: true };
  });

export const deleteContactMessage = createServerFn({ method: "POST" })
  .validator((d: unknown) => z.object({ password: z.string().min(1).max(200), id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    checkPassword(data.password);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("contact_messages").delete().eq("id", data.id);
    if (error) {
      console.error(`Message could not be deleted [${error.code ?? "?"}]: ${error.message}`);
      throw new Error("Could not delete that message.");
    }
    return { ok: true };
  });

import { describe, expect, it } from "vitest";
import { contactSchema } from "@/lib/contact.functions";

// The rules the contact form on the site enforces before a message is saved.
describe("Contact form rules", () => {
  const good = { name: "Priya Sharma", email: "priya@example.com", message: "Hello there" };

  it("accepts a complete message", () => {
    expect(contactSchema.safeParse(good).success).toBe(true);
  });

  it("rejects a message with no name", () => {
    expect(contactSchema.safeParse({ ...good, name: "   " }).success).toBe(false);
  });

  it("rejects an email address with no @", () => {
    expect(contactSchema.safeParse({ ...good, email: "priya-at-example" }).success).toBe(false);
  });

  it("rejects a message longer than 2000 characters, and accepts exactly 2000", () => {
    expect(contactSchema.safeParse({ ...good, message: "a".repeat(2001) }).success).toBe(false);
    expect(contactSchema.safeParse({ ...good, message: "a".repeat(2000) }).success).toBe(true);
  });

  it("strips the extra spaces around a name before saving", () => {
    const parsed = contactSchema.parse({ ...good, name: "  Priya Sharma  " });
    expect(parsed.name).toBe("Priya Sharma");
  });
});

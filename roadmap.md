# Roadmap

New workspace setup — integrations from the previous workspace are no longer linked.

- [x] Connect GitHub API — new connection linked and verified (repo readable)
- [x] ADMIN_PASSWORD secret already present in this workspace
- [x] Certificates page and admin panel still load (build OK, page returns 200)
- [x] Supabase "My Portfolio" — KEEP (never remove). Powers the contact form + admin Messages tab; verified end to end.
- [x] Explain how site updates reach https://mranujbabu.github.io/Certificate-Portfolio/ — both sites read the same data.json; changes appear there in 1-2 minutes
- [x] Publish the site on Vercel — live at https://certificate-portfolio-three.vercel.app (all 7 certificates show)
- [x] Vercel environment values — ADMIN_PASSWORD, LOVABLE_API_KEY and GITHUB_API_KEY pushed via the Vercel API
- [x] Favicon — generated medal icon in the site colors, public/favicon.png + root head() updated, old favicon.ico removed, redeployed to Vercel
- [x] Empty "vdeploy" project — confirmed deleted from Vercel
- [x] Vercel admin writes — the connector key that was stored as GITHUB_TOKEN only worked inside the Lovable editor, so it was removed from Vercel and the site now saves through the Lovable GitHub connection instead. Verified live: a test file was written to the repo (HTTP 201) and deleted again, from the Vercel host. No personal GitHub token needed from the user.
- [x] Temporary save/read test endpoints — added only for the check above, then removed and republished; the one-off test key was deleted from Vercel
- [x] Site source code saved to the GitHub repo under app/ (original pages untouched, live site unchanged)
- [x] Contact form — visitors can send name/email/message from the site (saved in the Supabase contact_messages table, hidden honeypot field drops bots); the admin panel has a Messages tab to read, mark as read and delete. Verified in a real browser: submit saves, admin sees it, mark-read and delete work.
- [x] Contact form on Vercel — database settings added to the Vercel project (production + preview) and the site republished; a real message was sent on the live site, reached the database, then was cleared.
- [x] ChatGPT Prompt Engineering card (DL-001) — main project link changed to https://snapsolveanuj.vercel.app/ (saved to the GitHub repo, commit 9e0cd8a; only that one field changed)
- [x] Naveen Bharat card (DL-003) — second link https://navinbharat.vercel.app/ added (commit 44ed429)
- [x] New card DL-008 "Naveen Bharat Files — PDF & Notes Library" added with two links: https://github-storages-cdn.vercel.app/ (PDF by GitHub storage) and https://storage-naveenbharat-recording.vercel.app/ (PDF storage by Telegram bot); picture uploaded to images/DL-008.png; verified live in the preview
- [x] Split into two cards on request: DL-008 keeps only "PDF by GitHub storage" → https://github-storages-cdn.vercel.app/ (platform now "GitHub Storage CDN")
- [x] New card DL-009 "JSR Coaching Digital Library — Telegram File Storage" with "PDF storage by Telegram bot" → https://jsrstudy.vercel.app/ (the redirect target of storage-naveenbharat-recording.vercel.app); picture images/DL-009.png; verified live in the preview
- [x] New card DL-010 "JSR Coaching Institute" (platform "Education — Small Edtech Platform") with link → https://jsrcoaching.vercel.app/; picture images/DL-010.png from the site's own logo; verified live in the preview
- [x] New card DL-011 "Sadguru Classes" (platform "Offline Coaching — English", padhai RC Sir ke saath) with link → https://sadguruclasses.vercel.app/; picture images/DL-011.png from the site's own logo; verified live in the preview
- [x] New card DL-012 "Obsidian Plugins — Notion Toggle" with repo link https://github.com/RR-LIBRARY/obsidian-notion-toggle; text from its README; picture images/DL-012.png
- [x] New card DL-013 "Notion Expert — Second Brain 3.0" with the Notion Dashboard link; picture images/DL-013.png
- [x] New card DL-014 "WinWin Digital Agency" → https://winwinagency.vercel.app/; picture images/DL-014.jpg from the site
- [x] New card DL-015 "AI Field Expertise" (platform "AI Agent Tools & Platforms") with four links: Google AI Studio https://aistudio.google.com/, Lovable https://lovable.dev/, Dapple AI https://dappleai.com/, GitHub https://github.com/MrAnujBabu; picture images/DL-015.jpg (generated banner, no brand marks)
- [x] New card DL-016 "Apps & Skills" (platform "Everyday Apps & Tools") listing YouTube mod APK, Telegram mod APK, Document Scanner and Anki flashcards; picture images/DL-016.jpg (generated, no brand marks); no download links added for the mod apps; verified live in the preview
- [x] New card DL-017 "Productivity & Chatbot Skills" (platform "Productivity Tools & Chatbots") mentioning customized chatbot, ordering bot, no-code backend (user said "Noah Bankend" — reading to confirm), Obsidian note-taking, Brave browser and Firefox browser; picture images/DL-017.jpg; verified live in the preview
- [x] DL-015 "AI Field Expertise" — added Hugging Face, LLM Arena (lmarena.ai), Grok, ChatGPT playground (platform.openai.com/playground), DeepSeek, DeepSeek R1, ElevenLabs, Claude, OpenAI, DeepLearning.AI and Sarvam AI; card now has 15 buttons, all verified rendering and fitting in the preview; card link limit raised to 20 in src/lib/portfolio.functions.ts
- [x] Project moved to a new workspace — GitHub API connected fresh here; repo read + write access confirmed
- [x] Supabase "My Portfolio" reconnected in the new workspace — contact form tested on the site: a real message reached the database
- [x] ADMIN_PASSWORD re-added in the new workspace — admin login works; Messages tab tested end to end (test message seen, marked read, deleted; database empty again)
- [x] Live site certificateportfolio.vercel.app re-tested after the workspace move — contact form saves, admin login works with the same password, Messages tab read/mark-read/delete all work
- [x] Contact form shows a lasting "Message bhej diya gaya" note after sending — saved to GitHub app/ (commit 572a326); the live Vercel site rebuilt by itself from that and shows the note
- [x] Open questions (Notion text, "no-code backend" wording, stand-in pictures, old Vercel address, Claude/OpenAI buttons) — user said keep as is

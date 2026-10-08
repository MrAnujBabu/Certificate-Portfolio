# Roadmap

New workspace setup — integrations from the previous workspace are no longer linked.

- [x] Connect GitHub API — new connection linked and verified (repo readable)
- [x] ADMIN_PASSWORD secret already present in this workspace
- [x] Certificates page and admin panel still load (build OK, page returns 200)
- [ ] Supabase "My Portfolio" — blocked: only the user can switch it (Connectors → Supabase in the editor); app code currently reads certificates from the GitHub repo, not the database
- [x] Explain how site updates reach https://mranujbabu.github.io/Certificate-Portfolio/ — both sites read the same data.json; changes appear there in 1-2 minutes
- [x] Publish the site on Vercel — live at https://certificate-portfolio-three.vercel.app (all 7 certificates show)
- [x] Vercel environment values — ADMIN_PASSWORD, LOVABLE_API_KEY and GITHUB_API_KEY pushed via the Vercel API
- [x] Favicon — generated medal icon in the site colors, public/favicon.png + root head() updated, old favicon.ico removed, redeployed to Vercel
- [x] Empty "vdeploy" project — confirmed deleted from Vercel
- [x] Vercel admin writes — the connector key that was stored as GITHUB_TOKEN only worked inside the Lovable editor, so it was removed from Vercel and the site now saves through the Lovable GitHub connection instead. Verified live: a test file was written to the repo (HTTP 201) and deleted again, from the Vercel host. No personal GitHub token needed from the user.
- [x] Temporary save/read test endpoints — added only for the check above, then removed and republished; the one-off test key was deleted from Vercel
- [x] Site source code saved to the GitHub repo under app/ (original pages untouched, live site unchanged)

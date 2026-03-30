MyFridge Premium Vibe

Files:
- index.html
- style.css
- app.js

Notes:
- This version uses your Supabase project URL and publishable key already.
- Table name must be: Items
- Required columns:
  - name
  - expiry
  - fridge_code
  - timestamp (default now())
- RLS should be OFF for now.

If you previously used a service worker / PWA:
- remove old home screen app once
- open site with ?v=80
- refresh

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


Icon update:
- icon-192.png and icon-512.png added
- manifest.json added
- favicon and apple-touch-icon linked in index.html

After uploading:
- open the site with ?v=81
- for iPhone home screen icon, remove the old bookmark/app once and add it again

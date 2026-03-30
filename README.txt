MyFridge Final Polished Version

Included pages:
- index.html      : premium login/signup page
- dashboard.html  : main dashboard
- account.html    : account info page
- settings.html   : settings page

Included scripts:
- common.js
- auth.js
- dashboard.js
- account.js
- settings.js

PWA files:
- manifest.json
- sw.js
- icon-192.png
- icon-512.png

Already wired:
- Supabase URL
- Supabase publishable key

Required Supabase setup:
- Auth email provider enabled
- Email signup enabled
- Confirm email OFF for testing
- Table: Items
  Columns:
  - name
  - expiry
  - fridge_code
  - id (optional)
- Table: profiles
  Columns:
  - id
  - email

Recommended first open:
https://lcyvdkiovtychcfmwulv.supabase.co

Actual site base:
https://kiratveersinghralhan-hue.github.io/myfridge

After uploading to GitHub Pages:
- open index.html?v=301
- if you had older versions, hard refresh or remove old home-screen app once

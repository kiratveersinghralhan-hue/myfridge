MyFridge Complete Premium App

Included:
- index.html        -> Premium login / signup page
- dashboard.html    -> Main dashboard with slide menu
- account.html      -> Account info page
- settings.html     -> Settings page
- style.css
- auth.js
- dashboard.js
- account.js
- settings.js

Built with:
- 80% clean premium layout
- 20% accent color from MyFridge logo
- stronger premium green emphasis

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
- Table: profiles
  Columns:
  - id
  - email

How it works:
1. Open index.html
2. Sign up or log in
3. Redirect to dashboard.html
4. Use family fridge code
5. Add/search/delete products
6. Open account/settings from menu or account dropdown

# Sign-in with Supabase Auth

Relay uses Supabase Auth to prove who someone is: email and password, "Continue with Google", confirmation emails and password resets. Supabase holds **identities only**. People's names, organisations, roles, rosters, swaps and fairness stay in MongoDB, keyed by Relay's own user id.

The API checks each request's Supabase token itself, against the project's public keys. It needs only the project's URL and publishable key. The first request from a new sign-in creates that person's Relay account, or links an existing one with the same email (see [Existing accounts](#9-existing-accounts-sign-up-again)).

Everything here is free tier, and nothing in this file is done by the code. It is dashboard work, done once per project.

1. [Two projects](#1-two-projects)
2. [Auth settings](#2-auth-settings)
3. [Email: custom SMTP with Gmail](#3-email-custom-smtp-with-gmail)
4. [Redirect URLs](#4-redirect-urls)
5. [Google sign-in](#5-google-sign-in)
6. [Keys: which value goes where](#6-keys-which-value-goes-where)
7. [The demo accounts](#7-the-demo-accounts)
8. [Optional: the account webhook](#8-optional-the-account-webhook)
9. [Existing accounts: sign up again](#9-existing-accounts-sign-up-again)
10. [Pausing, and restoring a paused project](#10-pausing-and-restoring-a-paused-project)
11. [Limits to know](#11-limits-to-know)
12. [Troubleshooting](#12-troubleshooting)

## 1. Two projects

Create two projects at [supabase.com](https://supabase.com): one for development, one for production. The free plan allows two active projects, so this uses both.

**Each project goes with its own MongoDB database.** The development project goes with your development database, and the production project with the deployed one (`relay-live-demo`). The same person has a different Supabase user id in each project. A Relay database shared by two projects would refuse that person's second sign-in (409), because their account is already linked to the other project's id.

## 2. Auth settings

In each project, under *Authentication* → *Sign In / Providers* → *Email*:

| Setting | Value | Why |
| --- | --- | --- |
| Enable email provider | on | Email and password sign-in |
| **Confirm email** | **on - required in production** | See below |
| Secure email change | on | A changed email must be confirmed from the old address too. Without it, someone signed in to a shared demo account could move it to their own address |
| Minimum password length | 8 | What Relay's sign-up form asks for |
| Password requirements | letters and digits | The same |

Leave *Allow new users to sign up* on. Anonymous sign-ins and phone sign-in stay off: Relay refuses a sign-in that has no email.

**Why "Confirm email" must stay on.** With it on, Supabase emails a link to every new address, and the account works only once that link is followed, which proves the person owns the address. Relay relies on that proof in three places:

- linking an existing Relay account to a new sign-in by email
- copying a changed email onto the Relay account
- accepting an invite, which only works for the address it was sent to

With "Confirm email" off, Supabase marks every address confirmed without sending anything. No token tells the two cases apart, so the API asks the project directly: it reads `mailer_autoconfirm` from the project's public settings (`GET /auth/v1/settings`, cached for 10 minutes). When that says confirmation is off, the API refuses all three with `EMAIL_NOT_PROVEN`, and logs why. New people can still sign up and use their own organisations. Turning the setting on again lifts the refusals within 10 minutes.

**Check the signing keys.** *Project Settings* → *JWT Keys* should show an asymmetric current key (ECC P-256, or RSA). Projects created since 1 October 2025 start that way. If yours shows the legacy JWT secret, migrate it to asymmetric keys there. Relay accepts only ES256 and RS256 tokens, and never takes the legacy secret.

**Sessions.** On the free plan a session lasts until the person signs out: time-boxed sessions and inactivity timeouts are Pro features. So Relay keeps a limit of its own, and signs a browser out 7 days after it signed in. The README's *Sessions* section explains how, and what that limit cannot cover.

## 3. Email: custom SMTP with Gmail

Supabase's built-in sender only delivers to the members of your Supabase team, at 2 messages an hour. Real sign-ups need your own SMTP server. Supabase sends these emails from its own servers, so Render blocking SMTP does not matter. Relay's own invite emails are a separate matter and do not change.

Gmail works with any address, and needs no domain of your own:

1. **2-Step Verification** must be on for the Google account. App passwords only exist with it. They are not offered if 2-Step Verification uses only security keys, on work or school accounts, or with Advanced Protection.
2. Create an **app password** at <https://myaccount.google.com/apppasswords> (name it "Relay Supabase"). Google says app passwords "aren't recommended", but Supabase's SMTP settings cannot use Google sign-in, so this is the way Gmail works here. Treat it like a password: it goes in the Supabase dashboard and nowhere else.
3. Supabase → *Authentication* → *Emails* → *SMTP Settings* → enable custom SMTP:

   | Field | Value |
   | --- | --- |
   | Sender email | your full Gmail address |
   | Sender name | `Relay` |
   | Host | `smtp.gmail.com` |
   | Port | `587` |
   | Username | your full Gmail address |
   | Password | the app password |

4. *Authentication* → *Rate Limits*. With custom SMTP, Supabase allows **30 emails an hour** across the project. Raise it if you need to. A personal Gmail account is blocked for a day after about 500 messages, so stay well under that.

Do this in both projects, or at least in production. In development, the built-in sender is enough if you only sign up with your own address and are a member of the project's team.

## 4. Redirect URLs

Emailed links and Google sign-in come back to Relay at two paths:

- `/auth/callback`: sign-up confirmation and Google. It may carry `?next=`, such as an invite to return to.
- `/reset-password`: the password reset link.

*Authentication* → *URL Configuration*:

| | Development project | Production project |
| --- | --- | --- |
| Site URL | `http://localhost:5173` | `https://<project>.vercel.app` |
| Redirect URLs | `http://localhost:5173/**` | `https://<project>.vercel.app/auth/callback**`<br>`https://<project>.vercel.app/reset-password`<br>`https://*-<team-or-account-slug>.vercel.app/**` (Vercel previews) |

Supabase recommends exact paths in production. The `**` after `/auth/callback` lets the link carry `?next=`. A redirect that isn't on the list goes to the Site URL instead.

## 5. Google sign-in

**In Google Cloud** (<https://console.cloud.google.com>):

1. Create a project, then open *Google Auth Platform*:
   - *Branding*: app name "Relay", your support email.
   - *Audience*: External.
   - *Data Access*: `openid`, plus the email and profile scopes.
2. *Clients* → *Create client* → **Web application**:
   - **Authorized JavaScript origins:** `http://localhost:5173` and `https://<project>.vercel.app`.
   - **Authorized redirect URIs:** the callback URL from each Supabase project's Google provider page: `https://<project-ref>.supabase.co/auth/v1/callback`. One client can serve both projects, with both callback URLs listed.
3. Copy the client ID and client secret.
4. While the app is in *Testing*, only the test users you list can sign in. Publish it (*Audience* → *Publish app*) when you go live. With only these basic scopes, Google does not require app verification.

**In Supabase:** *Authentication* → *Sign In / Providers* → *Google* → enable it, and paste the client ID and secret. Do this in each project.

Google accounts arrive with emails Google has verified. A Google sign-in with an email that already has a Relay account links to it, as an email sign-up does.

## 6. Keys: which value goes where

Every key is on *Settings* → *API Keys*. Relay uses the new keys: **publishable** (`sb_publishable_...`) and **secret** (`sb_secret_...`). The legacy `anon` and `service_role` keys also work, and Supabase plans to retire them.

| Value | Where it goes | Notes |
| --- | --- | --- |
| Project URL `https://<project-ref>.supabase.co` | Render `SUPABASE_URL`; Vercel `VITE_SUPABASE_URL`; GitHub secret `SUPABASE_URL`; your local `backend/.env` and `frontend/.env` (the development project's) | Public |
| Publishable key | Render `SUPABASE_PUBLISHABLE_KEY`; Vercel `VITE_SUPABASE_PUBLISHABLE_KEY`; your local `.env` files | Public by design: it only lets a browser ask Supabase to sign someone in |
| **Secret key** | GitHub secret `SUPABASE_SERVICE_ROLE_KEY` (production project); your local `backend/.env` (development project), for `npm run seed:demo` | **Can do anything to every account.** Never on Render, never on Vercel, never in a `VITE_` variable, never committed. A production server refuses to start with it in its environment, and the frontend build refuses one in any `VITE_` variable |
| Webhook secret | Render `SUPABASE_WEBHOOK_SECRET`, and the trigger SQL (section 8) | Optional. Make one with `node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"` |

**The Content-Security-Policy** in `frontend/vercel.json` lets the page connect to its own origin and to the **production** project's origin only (`connect-src 'self' https://<production-ref>.supabase.co`). Vercel previews therefore use the production project too. If the production project ever changes, change `vercel.json`, and `npm test` will show `vercelConfig.test.js` the new value.

## 7. The demo accounts

The shared demo's accounts (`owner@relay.test` and the rest) are Supabase users too, with the password the login page shows. `npm run seed:demo -- --yes` creates them through Supabase's Admin API, already confirmed, and resets their passwords on every run. It needs `MONGODB_URI`, `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY` (it loads the server's own settings, which require it) and `SUPABASE_SERVICE_ROLE_KEY`. Locally, all four go in `backend/.env`.

It only ever touches the demo's own `.test` addresses, and among those only accounts carrying its marker (`app_metadata.relay_demo`). If an account with a demo address exists without the marker, the seed stops and changes nothing. The nightly workflow runs it with the production project's secrets (DEPLOY.md, step 6). Until the first run, the demo's sign-in buttons say the password is wrong.

## 8. Optional: the account webhook

Without it, Relay still keeps up: a changed email arrives with the person's next request, and a deleted Supabase user is locked out within the hour, when their last access token expires. The webhook makes deletion immediate and complete. The person is taken out of every organisation they belong to, as if a manager had deactivated them. Their history stays, and so does an organisation's last owner.

1. *Database* → *Extensions* → enable **pg_net**.
2. *SQL Editor* → run the following. Replace the two placeholders first: your Render address, and the webhook secret.

   ```sql
   -- Relay: tell the API when an account's email changes or it is deleted.
   -- Only the id and email are sent; the rest of the row never leaves.
   create or replace function public.relay_notify_auth_change()
   returns trigger
   language plpgsql
   security definer
   set search_path = ''
   as $$
   begin
     perform net.http_post(
       url := 'https://<service>.onrender.com/api/v1/webhooks/supabase-auth',
       body := jsonb_build_object(
         'type', tg_op,
         'record', case when tg_op = 'DELETE' then null else jsonb_build_object('id', new.id, 'email', new.email) end,
         'old_record', jsonb_build_object('id', old.id, 'email', old.email)
       ),
       headers := jsonb_build_object(
         'Content-Type', 'application/json',
         'Authorization', 'Bearer <SUPABASE_WEBHOOK_SECRET>'
       ),
       timeout_milliseconds := 30000
     );
     return null;
   exception when others then
     -- A webhook that cannot be sent must never block a sign-in or a deletion.
     return null;
   end;
   $$;

   create trigger relay_auth_email_changed
     after update of email on auth.users
     for each row
     when (old.email is distinct from new.email)
     execute function public.relay_notify_auth_change();

   create trigger relay_auth_user_deleted
     after delete on auth.users
     for each row
     execute function public.relay_notify_auth_change();
   ```

3. Render → *Environment* → set `SUPABASE_WEBHOOK_SECRET` to the same secret. Without it, the endpoint answers 404 and does nothing.

Delivery is best effort. pg_net sends asynchronously and does not retry, and Render's free service may be asleep when it calls (hence the 30-second timeout). The secret sits in the function's definition, so anyone with access to the project's database can read it. A Supabase *Database Webhook* on `auth.users` would send the whole row, password hash included, which is why this hand-written trigger is used instead.

## 9. Existing accounts: sign up again

Passwords from before the move stay behind: they were Relay's, and Supabase never had them. Each existing user:

1. Opens the login page and chooses **Create account**, with the same email they used before (or **Continue with Google**, if that is their Google address).
2. Follows the link in the confirmation email.
3. Is signed in to their old account, with the same organisations, roles and history. The first request linked the new sign-in to it by email.

Once everyone has moved, `npm run cleanup:legacy-auth` (in `backend/`) removes what the old sign-in left behind: password hashes, lockout counters, and the old session and reset-link collections. It shows what it would do and changes nothing until you add `-- --yes`.

## 10. Pausing, and restoring a paused project

A free project **pauses after 7 days without database activity**. In Supabase's words: "Typically a few user requests to the database each day over the previous week is enough." A paused project refuses every sign-in: the API answers 503, and nobody can sign in until the project is restored.

**Keeping production awake.** The nightly workflow's `keep-alive` job lists one user through the Admin API every night, a request that reads the project's database. A request to Relay's own API would not help, because Relay never asks Supabase anything on its own behalf. The Supabase docs do not say whether Auth requests count towards activity, only that requests to the database do. If the project pauses anyway, add a nightly read of a one-row table through the REST API.

**Being told.** If Supabase does not answer, the `keep-alive` job fails, and so does the run. GitHub emails failed scheduled runs to whoever created the workflow, or last changed its schedule. To make sure the email arrives: GitHub → *Settings* → *Notifications* → *System* → *Actions* → *Email*, and *Only notify for failed workflows*.

**Restoring.** Supabase dashboard → your organisation → the paused project → **Resume project**, and confirm. It takes a few minutes, and the project returns as it was, data and settings included. A paused project can be restored for up to a year. Afterwards, run the nightly workflow by hand (*Actions* → *Nightly* → *Run workflow*) so the demo is reset and the keep-alive passes again.

The development project pauses whenever you leave it for a week. Restore it the same way before working on Relay again.

## 11. Limits to know

Supabase counts these per IP address unless noted:

| What | Limit |
| --- | --- |
| Sign-ups, password reset requests, resends | 30 per 5 minutes |
| Sign-ins with a password, and session refreshes | 150 per 5 minutes |
| Following an emailed link | 30 per 5 minutes |
| Emails, project-wide, with custom SMTP | 30 an hour by default; adjustable |
| One address | one email a minute |
| Gmail, per day | about 500 messages (personal accounts) |
| Monthly active users, free plan | 50,000 |

Relay's API keeps its own limits on top: the address-wide limit, invites, organisations and swap searches.

## 12. Troubleshooting

| What you see | Likely cause | What to do |
| --- | --- | --- |
| "Sign-in is unavailable right now" (503 `AUTH_UNAVAILABLE`) | The API could not fetch the project's keys. The project is paused, or `SUPABASE_URL` is wrong | Restore the project (section 10), or fix the URL on Render |
| "...can only be linked once your email address is confirmed" (403 `EMAIL_NOT_PROVEN`) | "Confirm email" is off in this project | Turn it on (section 2). The API notices within 10 minutes |
| "This email already belongs to a Relay account with a different sign-in" (409) | Two Supabase projects share one Relay database, or a Supabase user was deleted and made again while the webhook was not set up | Give each project its own database. For a re-made user, either set up the webhook and delete the stale Supabase user again, or clear `supabaseUserId` on that account in MongoDB (and on nothing else) |
| A confirmation or reset email never arrives | Custom SMTP not set, a wrong app password, the hourly email limit, or the spam folder | Check section 3. Supabase's *Logs* → *Auth* shows send failures |
| A link opens the wrong site, or localhost in production | The Site URL or the redirect list | Section 4 |
| "Continue with Google" shows a Google error about the redirect | The callback URL is missing from the Google client | Section 5, step 2 |
| The demo's sign-in buttons say the password is wrong | The demo accounts don't exist in this project yet | Run the nightly workflow by hand, with its Supabase secrets set |
| The frontend build fails with "Refusing to build" | A secret key in a `VITE_` variable, or the test sign-in in a production build | Remove the variable the message names |

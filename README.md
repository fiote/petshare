# PetShare

Mobile-first app for shared pet custody management: register a pet, invite other tutors by email, and organize on a calendar who has the pet on each day.

## Stack

- **API**: NestJS + TypeORM + PostgreSQL, JWT authentication, email confirmation, password reset, and invitations via Resend.
- **Front**: React + Vite + TypeScript, mobile-first, served as static files via Nginx.
- **Database**: PostgreSQL, running in the same container.
- **Orchestration**: a single Docker container, with `supervisord` managing Postgres, the API (Node), and Nginx.
- **i18n**: English (default) and Portuguese (Brazil), covering the UI, API responses, and transactional emails — selectable on the profile page.

## How to run

1. Copy the environment variables file and adjust the values:

   ```sh
   cp .env.example .env
   ```

   - `JWT_SECRET`: replace with a strong secret in production.
   - `RESEND_API_KEY`: Resend API key. If left blank, emails (account confirmation and invitations) are just logged to the API console instead of actually being sent — useful for local testing without Resend configured.
   - `RESEND_FROM_EMAIL`: verified sender in Resend.
   - `WEB_BASE_URL`: public URL where the app will be accessible (used to build the links in emails).

2. Start the container:

   ```sh
   docker compose up --build
   ```

3. Access `http://localhost:5000`.

Postgres data persists in the `petshare_pgdata` volume, and pet photos in the `petshare_uploads` volume — both survive container restarts and rebuilds.

## Application flow

1. **Sign up**: user creates an account and receives a confirmation email (Resend). Login is only allowed after confirming the email. From the login screen, the user can also request a password reset email if they forgot their password.
2. **Pet registration**: an authenticated user registers a pet (with an optional photo) and automatically becomes its tutor (owner). The photo can be changed later on the pet's page.
3. **Tutor invitation**: any tutor of the pet can invite another email to also manage the pet's calendar. If the invitee already has an account, they see the pending invitation upon logging in; if not, the email link leads to sign-up already linked to the invitation.
4. **Manual tutor**: it's also possible to add a tutor without inviting anyone (name, with optional email) — useful when the other person (e.g. a family member) doesn't want to use the app, but you still need to record the days they had the pet.
5. **Active tutor**: on the pet's page, tap a tutor's name in the list to mark them as "active". The active tutor is the one assigned when tapping a day on the calendar — this lets a single logged-in person record days both under their own name and under manual/other tutors' names.
6. **Calendar**: any accepted tutor can mark past days ("I had the pet") or future days ("I will have the pet") on behalf of the selected active tutor — each day belongs to a single tutor at a time.
7. **Statistics**: for each pet, the app shows how many days each tutor (including manual ones) had the pet in the last 7/15/30/90 days, and how many days they're scheduled to have it in the next 7/15/30/90 days.
8. **Pet deletion**: only the pet's owner (whoever registered it) can delete it, with a confirmation prompt in the UI.
9. **Language**: the user can switch between English and Portuguese on the profile page; the choice is stored in the browser and also sent to the API so error messages and emails match the selected language.

## Local development (without Docker)

**API** (`api/`):

```sh
cd api
npm install
npm run start:dev
```

Requires a locally accessible Postgres (configurable via `DB_HOST` and `DB_PORT`, which default to `localhost:5432` and aren't in `.env.example` since they're only relevant in this no-Docker scenario, plus `DB_USERNAME`, `DB_PASSWORD`, `DB_NAME`).

**Front** (`web/`):

```sh
cd web
npm install
npm run dev
```

Vite is already configured to proxy `/api` to `http://localhost:5003` in development.

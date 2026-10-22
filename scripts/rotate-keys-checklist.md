Key rotation checklist

1. Supabase service role key
   - In Supabase: Project → Settings → API → Rotate service_role key.
   - Update server environment: set new `SUPABASE_SERVICE_ROLE_KEY` in hosting provider secret store.
   - Verify server-only code is using the new key and nothing exposes it to the client.

2. Resend API key (email provider)
   - Rotate key in Resend dashboard.
   - Update `RESEND_API_KEY` in hosting provider secret store.

3. Update local dev
   - Update your local `.env.local` with placeholder values or real keys locally (do NOT commit).

4. Verify
   - Test admin login and upload flows.
   - Confirm no service role or server-only keys are present in client bundle or public repo.

5. If keys were committed to a remote repo:
   - Purge git history (see scripts/purge-history-with-bfg.md) and rotate keys again.

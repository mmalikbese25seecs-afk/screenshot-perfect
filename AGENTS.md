<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->

## Project rules

- All data access goes through `src/lib/api.ts` / `src/lib/auth-api.ts`, which call `db()` from `src/lib/supabaseClient.ts`; without env config `db()` throws `BackendNotConfiguredError`. Why: the app must run with no backend and never fake data or success.
- Show missing-backend states with `src/components/shared/BackendNotice.tsx` (`QueryErrorState`, `DraftNotice`, `BackendPreviewBanner`) rather than ad-hoc messages. Why: one consistent honest message.
- Business details (contact, branches, wallet numbers, delivery fee, tax) live in `src/lib/store-config.ts` / `src/lib/pricing.ts` as `null` until published by the backend; UI must handle `null`. Why: no invented business values.
- Success toasts fire only after a real backend call resolves. Why: no fake save/send confirmations.
- Admin "local layout preview" (`src/lib/preview.ts`) is dev-only, sessionStorage-scoped and never touches `useAuth`. Why: inspect admin UI without fabricating auth.
- Backend contract and remaining work are documented in `docs/frontend-completion/`. Why: starting point for the backend phase.
- Homepage advertisements use validated product slugs or HTTPS external destinations; user-authored draft previews are development-only, one-use sessionStorage values separate from published offers. Why: exercise the real display without fabricated records or backend saves.

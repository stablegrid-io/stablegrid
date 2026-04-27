-- Cross-device track-essentials acknowledgement.
--
-- The track essentials interstitial (components/learn/theory/TrackEssentialsInterstitial.tsx)
-- previously gated on a `seenTrackEssentials` cookie. That meant signing in on
-- a new device or clearing cookies replayed the welcome screen — minor friction
-- but inconsistent with the cross-device guarantee we now hold for lesson and
-- checkpoint progress.
--
-- This column stores `${topic}:${trackSlug}` entries (matches the cookie
-- payload format). The cookie is retained as a best-effort fallback for
-- anonymous users and as a write-through cache for signed-in users so a brief
-- DB outage doesn't replay the interstitial.

alter table public.profiles
  add column if not exists seen_track_essentials text[] not null default '{}';

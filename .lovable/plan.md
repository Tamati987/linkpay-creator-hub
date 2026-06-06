# Follow System + Real-time Notifications

## 1. Database (single migration)

### `follows` table
- `id`, `follower_id`, `following_id`, `created_at`
- UNIQUE(`follower_id`, `following_id`), CHECK(`follower_id <> following_id`)
- RLS: SELECT public (so counts work for everyone), INSERT/DELETE only when `auth.uid() = follower_id`
- GRANTs: SELECT to anon+authenticated, INSERT/DELETE to authenticated, ALL to service_role

### `notifications` table
- `id`, `user_id` (recipient), `actor_id`, `type` ('new_link'|'new_product'|'new_follow'|'profile_update'), `message`, `link`, `is_read` (default false), `created_at`
- RLS: SELECT/UPDATE only where `auth.uid() = user_id`; no INSERT for clients (service role / SECURITY DEFINER triggers only)
- GRANTs: SELECT, UPDATE to authenticated; ALL to service_role
- Added to `supabase_realtime` publication; REPLICA IDENTITY FULL

### `notification_settings` table
- `user_id` PK, booleans: `new_link`, `new_product`, `new_follow`, `profile_update` (defaults true)
- RLS: owner can SELECT/INSERT/UPDATE own row

### Triggers (SECURITY DEFINER functions)
- `on_follow_insert` → notify `following_id` (type `new_follow`)
- `on_link_insert` → fan out to all followers of `links.user_id` (type `new_link`)
- `on_product_insert` → fan out to all followers of `products.user_id` (type `new_product`)
- `on_profile_update` → if `avatar_url` or `bio` changed, fan out (type `profile_update`)
- Each trigger respects recipient's `notification_settings`
- After insert: trim per-user notifications to most recent 50

## 2. Server functions (`src/lib/follow.functions.ts`, `src/lib/notifications.functions.ts`)

- `getFollowState({ profileId })` — returns `{ isFollowing, followerCount, followingCount }` (uses admin client for counts, no auth required)
- `followUser({ profileId })` / `unfollowUser({ profileId })` — `requireSupabaseAuth`
- `listNotifications()` — last 50 for current user
- `markAllRead()` / `markRead({ id })`
- `getNotificationSettings()` / `updateNotificationSettings({...})`

## 3. UI

### Public profile (`src/routes/$username.tsx`)
- Follower / following counts under header
- Follow / Following toggle button (hidden on own profile, prompts login when signed out)

### Notification panel (`src/components/NotificationPanel.tsx`)
- Rendered in `_authenticated/route.tsx` so it only shows for signed-in users in app pages (dashboard, admin, settings) — NOT on public profiles
- Fixed left bell button with unread badge; click expands panel
- List of 50, avatars, relative time, unread highlight, click → navigate + mark read
- "Mark all as read" header button
- Empty state
- Mobile: bottom-left floating bell (same component, responsive positioning)
- Supabase Realtime subscription on `notifications` filtered by `user_id=eq.<me>`: prepend new row, bump badge, sonner toast with "View" action

### Settings
- New section in `dashboard.tsx` (or settings area) with 4 toggles bound to `notification_settings`

## 4. Technical notes
- Counts via `head:true, count:'exact'` queries
- Realtime requires `ALTER PUBLICATION supabase_realtime ADD TABLE notifications`
- Trim-to-50 done in trigger via `DELETE ... WHERE id NOT IN (SELECT id ... ORDER BY created_at DESC LIMIT 50)`
- Profile update trigger compares OLD vs NEW to avoid spam on unrelated column changes

Proceed?
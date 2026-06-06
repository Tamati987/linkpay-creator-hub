
REVOKE EXECUTE ON FUNCTION public.notif_enabled(uuid, text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.trim_notifications(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.on_follow_created() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.on_link_created() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.on_product_created() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.on_profile_updated() FROM PUBLIC, anon, authenticated;

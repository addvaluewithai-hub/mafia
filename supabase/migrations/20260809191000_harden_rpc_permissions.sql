revoke execute on function public.can_access_room(uuid) from anon;
revoke execute on function public.emit_room_event(uuid, text) from anon;
revoke execute on function public.create_room(text, integer, text, text) from anon;
revoke execute on function public.join_room(text, text) from anon;
revoke execute on function public.room_snapshot(text) from anon;
revoke execute on function public.install_case(text, jsonb) from anon;
revoke execute on function public.cast_vote(text, uuid) from anon;
revoke execute on function public.resolve_vote(text) from anon;
revoke execute on function public.reveal_next_round(text) from anon;

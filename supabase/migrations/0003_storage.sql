-- Submissions bucket. Private: server issues signed URLs for downloads.
insert into storage.buckets (id, name, public)
values ('submissions', 'submissions', false)
on conflict (id) do nothing;

-- No client-side object policies needed: uploads and downloads are server-mediated.
-- The service_role client writes; signed URLs are produced server-side for reads.

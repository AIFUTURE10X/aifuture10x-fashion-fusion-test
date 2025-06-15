
-- Make sure the fashionfusion bucket is public (looks like it is, but setting explicitly)
update storage.buckets set public = true where id = 'fashionfusion';

-- Allow anyone (including unauthenticated users) to insert, read, update, and delete files in this bucket.
-- This is safe/typical for public buckets and required for image upload try-on workflows.

create policy "Anyone can upload to public fashionfusion bucket"
  on storage.objects
  for all
  using (bucket_id = 'fashionfusion');

-- (Optional) For clarity, you could restrict more in future, but public bucket should be open!

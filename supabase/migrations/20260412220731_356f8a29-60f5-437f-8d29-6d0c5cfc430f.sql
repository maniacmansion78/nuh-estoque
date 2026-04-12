ALTER TABLE profiles DISABLE TRIGGER trg_check_profile_update;
UPDATE profiles SET trial_ends_at = NOW() + INTERVAL '30 days' WHERE user_id = 'a3930c7f-22b3-4b6b-a694-55b87a4a25ec';
ALTER TABLE profiles ENABLE TRIGGER trg_check_profile_update;
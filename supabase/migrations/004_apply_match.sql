INSERT INTO match_attendance (match_id, player_id, attendance_status, responded_at)
SELECT 
    'ddc4a369-3557-4f95-8ced-1b1ead7890d1'::UUID, 
    id, 
    'attending', 
    NOW()
FROM players
-- Eğer daha önce eklenmiş olma ihtimali varsa hata almamak için:
ON CONFLICT (match_id, player_id) DO UPDATE 
SET attendance_status = 'attending';
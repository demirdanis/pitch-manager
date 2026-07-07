-- 1. YARDIMCI FONKSİYON
CREATE OR REPLACE FUNCTION get_random_score() RETURNS SMALLINT AS $$
DECLARE val SMALLINT;
BEGIN
    LOOP
        val := floor(random() * (99 - 70 + 1) + 70)::SMALLINT;
        EXIT WHEN val != 75;
    END LOOP;
    RETURN val;
END;
$$ LANGUAGE plpgsql;



-- 3. ANA MIGRATION SCRIPTİ
DO $$
DECLARE
    v_user_id UUID;
    v_player_id UUID;
    v_player JSON;
    v_name TEXT;
    v_pos TEXT;
    v_img TEXT;
    v_email TEXT;
    v_username TEXT;
    
    v_players_json JSON := $json$[
        {"name": "Manuel Neuer", "pos": "GK", "img": "https://cdn.sofifa.net/players/167/397/25_120.png"},
        {"name": "Alisson Becker", "pos": "GK", "img": "https://cdn.sofifa.net/players/212/831/25_120.png"},
        {"name": "Thibaut Courtois", "pos": "GK", "img": "https://cdn.sofifa.net/players/192/119/25_120.png"},
        {"name": "Ederson", "pos": "GK", "img": "https://cdn.sofifa.net/players/210/514/25_120.png"},
        {"name": "Virgil van Dijk", "pos": "CB", "img": "https://cdn.sofifa.net/players/203/376/25_120.png"},
        {"name": "Rúben Dias", "pos": "CB", "img": "https://cdn.sofifa.net/players/239/862/25_120.png"},
        {"name": "Marquinhos", "pos": "CB", "img": "https://cdn.sofifa.net/players/207/439/25_120.png"},
        {"name": "Antonio Rüdiger", "pos": "CB", "img": "https://cdn.sofifa.net/players/205/600/25_120.png"},
        {"name": "Alphonso Davies", "pos": "LB", "img": "https://cdn.sofifa.net/players/234/784/25_120.png"},
        {"name": "Theo Hernández", "pos": "LB", "img": "https://cdn.sofifa.net/players/227/928/25_120.png"},
        {"name": "Trent Alexander-Arnold", "pos": "RB", "img": "https://cdn.sofifa.net/players/231/281/25_120.png"},
        {"name": "Achraf Hakimi", "pos": "RB", "img": "https://cdn.sofifa.net/players/235/212/25_120.png"},
        {"name": "Kevin De Bruyne", "pos": "CM", "img": "https://cdn.sofifa.net/players/192/985/25_120.png"},
        {"name": "Jude Bellingham", "pos": "CM", "img": "https://cdn.sofifa.net/players/252/371/25_120.png"},
        {"name": "Rodri", "pos": "CM", "img": "https://cdn.sofifa.net/players/231/866/25_120.png"},
        {"name": "Luka Modrić", "pos": "CM", "img": "https://cdn.sofifa.net/players/177/003/25_120.png"},
        {"name": "Jamal Musiala", "pos": "LM", "img": "https://cdn.sofifa.net/players/256/630/25_120.png"},
        {"name": "Phil Foden", "pos": "LM", "img": "https://cdn.sofifa.net/players/237/692/25_120.png"},
        {"name": "Federico Valverde", "pos": "RM", "img": "https://cdn.sofifa.net/players/239/053/25_120.png"},
        {"name": "Bernardo Silva", "pos": "RM", "img": "https://cdn.sofifa.net/players/212/218/25_120.png"},
        {"name": "Erling Haaland", "pos": "ST", "img": "https://cdn.sofifa.net/players/239/085/25_120.png"},
        {"name": "Kylian Mbappé", "pos": "ST", "img": "https://cdn.sofifa.net/players/231/747/25_120.png"},
        {"name": "Vinícius Júnior", "pos": "LW", "img": "https://cdn.sofifa.net/players/238/794/25_120.png"},
        {"name": "Rafael Leão", "pos": "LW", "img": "https://cdn.sofifa.net/players/241/721/25_120.png"},
        {"name": "Mohamed Salah", "pos": "RW", "img": "https://cdn.sofifa.net/players/209/331/25_120.png"},
        {"name": "Bukayo Saka", "pos": "RW", "img": "https://cdn.sofifa.net/players/246/669/25_120.png"}
    ]$json$;

BEGIN
    FOR v_player IN SELECT * FROM json_array_elements(v_players_json)
    LOOP
        v_name := v_player->>'name';
        v_pos := v_player->>'pos';
        v_img := v_player->>'img';
        v_username := lower(regexp_replace(v_name, '\W+', '', 'g'));
        v_email := v_username || '@test.com';

        -- Auth kullanıcısını al veya oluştur
        SELECT id INTO v_user_id FROM auth.users WHERE email = v_email;
        IF v_user_id IS NULL THEN
            v_user_id := gen_random_uuid();
            INSERT INTO auth.users (id, aud, role, email, raw_user_meta_data)
            VALUES (v_user_id, 'authenticated', 'authenticated', v_email, 
                    json_build_object('username', v_username, 'display_name', v_name, 'avatar_url', v_img));
        END IF;

        -- Public Users'ı güncelle (Trigger'a rağmen manuel veri garantisi)
        INSERT INTO public.users (id, username, email, display_name, photo_url)
        VALUES (v_user_id, v_username, v_email, v_name, v_img)
        ON CONFLICT (id) DO UPDATE SET photo_url = EXCLUDED.photo_url;

        -- Players ekle
        INSERT INTO players (user_id, display_name)
        VALUES (v_user_id, v_name)
        ON CONFLICT (user_id) DO UPDATE SET display_name = EXCLUDED.display_name
        RETURNING id INTO v_player_id;

        -- Pozisyon Rating (Tüm oyuncular için rating ekle)
        INSERT INTO player_position_ratings (player_id, position, rating)
        VALUES (v_player_id, v_pos, get_random_score())
        ON CONFLICT (player_id, position) DO UPDATE SET rating = EXCLUDED.rating;

       
    END LOOP;
END $$;
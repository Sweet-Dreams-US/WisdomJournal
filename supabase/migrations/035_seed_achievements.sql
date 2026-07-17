-- 035: Seed additional achievement definitions (idempotent)

INSERT INTO achievements (slug, name, description, icon, achievement_type, requirement_value, sort_order) VALUES
('first_response', 'First Step', 'Wrote your first journal entry', 'pencil', 'milestone', 1, 100),
('streak_7_v2', 'Week Warrior', 'Maintained a 7-day streak', 'flame', 'streak', 7, 101),
('streak_30_v2', 'Monthly Master', 'Maintained a 30-day streak', 'trophy', 'streak', 30, 102),
('streak_100', 'Century Club', '100 consecutive days of journaling', 'star', 'streak', 100, 103),
('responses_10_v2', 'Getting Started', 'Wrote 10 journal entries', 'book', 'milestone', 10, 104),
('responses_50_v2', 'Prolific Writer', 'Wrote 50 journal entries', 'pen', 'milestone', 50, 105),
('responses_100_v2', 'Centurion', 'Wrote 100 journal entries', 'award', 'milestone', 100, 106),
('first_query_v2', 'Curious Mind', 'Asked your first wisdom question', 'search', 'special', 1, 107),
('first_friend', 'Connected', 'Added your first friend', 'users', 'special', 1, 108),
('categories_5', 'Well Rounded', 'Wrote in 5 different categories', 'grid', 'category', 5, 109),
('first_share', 'Generous', 'Shared your first response', 'share', 'special', 1, 110)
ON CONFLICT (slug) DO NOTHING;

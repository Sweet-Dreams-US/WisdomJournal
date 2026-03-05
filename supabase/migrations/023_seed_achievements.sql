-- 023: Seed achievement definitions

INSERT INTO achievements (slug, name, description, icon, achievement_type, requirement_value, sort_order) VALUES
-- Streak achievements
('streak_3', 'Getting Started', 'Respond 3 days in a row', 'flame', 'streak', 3, 1),
('streak_7', 'Week Warrior', 'Respond 7 days in a row', 'flame', 'streak', 7, 2),
('streak_14', 'Fortnight Focus', 'Respond 14 days in a row', 'flame', 'streak', 14, 3),
('streak_30', 'Monthly Master', 'Respond 30 days in a row', 'flame', 'streak', 30, 4),
('streak_60', 'Two-Month Titan', 'Respond 60 days in a row', 'flame', 'streak', 60, 5),
('streak_90', 'Quarter Champion', 'Respond 90 days in a row', 'flame', 'streak', 90, 6),
('streak_180', 'Half-Year Hero', 'Respond 180 days in a row', 'flame', 'streak', 180, 7),
('streak_365', 'Year of Wisdom', 'Respond every day for a full year', 'trophy', 'streak', 365, 8),

-- Milestone achievements (total responses)
('responses_1', 'First Words', 'Write your first journal response', 'pencil', 'milestone', 1, 10),
('responses_10', 'Finding Your Voice', 'Write 10 journal responses', 'pencil', 'milestone', 10, 11),
('responses_50', 'Storyteller', 'Write 50 journal responses', 'book', 'milestone', 50, 12),
('responses_100', 'Century of Wisdom', 'Write 100 journal responses', 'book', 'milestone', 100, 13),
('responses_250', 'Prolific Writer', 'Write 250 journal responses', 'book-open', 'milestone', 250, 14),
('responses_500', 'Wisdom Keeper', 'Write 500 journal responses', 'library', 'milestone', 500, 15),
('responses_1000', 'Legacy Builder', 'Write 1,000 journal responses', 'landmark', 'milestone', 1000, 16),

-- Category achievements
('cat_1', 'First Category', 'Respond to a question in 1 category', 'folder', 'category', 1, 20),
('cat_5', 'Well-Rounded', 'Respond to questions in 5 categories', 'folders', 'category', 5, 21),
('cat_10', 'Encyclopedia', 'Respond to questions in all 10 categories', 'globe', 'category', 10, 22),

-- Special achievements
('first_query', 'Wisdom Shared', 'Someone queried your encyclopedia for the first time', 'message-circle', 'special', 1, 30),
('first_group', 'Connected', 'Join or create your first group', 'users', 'special', 1, 31),
('first_voice', 'Voice Captured', 'Record your first voice response', 'mic', 'special', 1, 32),
('legacy_setup', 'Future Proof', 'Set up your first legacy contact', 'shield', 'special', 1, 33);

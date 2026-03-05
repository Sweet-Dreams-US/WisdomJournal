-- 005: Seed 10 categories + ~54 subcategories

-- 1. Medical & Health
INSERT INTO categories (slug, name, description, icon, sort_order)
VALUES ('medical_health', 'Medical & Health', 'Health history, conditions, medications, and wellness practices', 'heart-pulse', 1);

INSERT INTO subcategories (category_id, slug, name, sort_order)
SELECT c.id, s.slug, s.name, s.sort_order
FROM categories c,
(VALUES
  ('conditions', 'Conditions & Diagnoses', 1),
  ('medications', 'Medications & Treatments', 2),
  ('family_medical', 'Family Medical History', 3),
  ('wellness', 'Wellness & Prevention', 4),
  ('mental_health', 'Mental Health', 5)
) AS s(slug, name, sort_order)
WHERE c.slug = 'medical_health';

-- 2. Financial
INSERT INTO categories (slug, name, description, icon, sort_order)
VALUES ('financial', 'Financial', 'Financial wisdom, lessons learned, and practical money advice', 'banknote', 2);

INSERT INTO subcategories (category_id, slug, name, sort_order)
SELECT c.id, s.slug, s.name, s.sort_order
FROM categories c,
(VALUES
  ('money_lessons', 'Money Lessons', 1),
  ('career_financial', 'Career & Earnings', 2),
  ('investing', 'Investing & Savings', 3),
  ('big_purchases', 'Big Purchases & Decisions', 4),
  ('generosity', 'Generosity & Giving', 5)
) AS s(slug, name, sort_order)
WHERE c.slug = 'financial';

-- 3. Relationships
INSERT INTO categories (slug, name, description, icon, sort_order)
VALUES ('relationships', 'Relationships', 'Friendships, partnerships, and interpersonal wisdom', 'users', 3);

INSERT INTO subcategories (category_id, slug, name, sort_order)
SELECT c.id, s.slug, s.name, s.sort_order
FROM categories c,
(VALUES
  ('romantic', 'Romantic Relationships', 1),
  ('friendships', 'Friendships', 2),
  ('family_dynamics', 'Family Dynamics', 3),
  ('conflict', 'Conflict & Resolution', 4),
  ('community', 'Community & Belonging', 5),
  ('mentorship', 'Mentorship', 6)
) AS s(slug, name, sort_order)
WHERE c.slug = 'relationships';

-- 4. Deeply Personal
INSERT INTO categories (slug, name, description, icon, sort_order)
VALUES ('deeply_personal', 'Deeply Personal', 'Private reflections, fears, regrets, and innermost thoughts', 'lock', 4);

INSERT INTO subcategories (category_id, slug, name, sort_order)
SELECT c.id, s.slug, s.name, s.sort_order
FROM categories c,
(VALUES
  ('fears_anxieties', 'Fears & Anxieties', 1),
  ('regrets', 'Regrets & What-Ifs', 2),
  ('secrets', 'Secrets & Confessions', 3),
  ('dreams_aspirations', 'Dreams & Aspirations', 4),
  ('self_reflection', 'Self-Reflection', 5)
) AS s(slug, name, sort_order)
WHERE c.slug = 'deeply_personal';

-- 5. Life Lessons
INSERT INTO categories (slug, name, description, icon, sort_order)
VALUES ('life_lessons', 'Life Lessons', 'Hard-won wisdom, advice, and things you wish you knew sooner', 'lightbulb', 5);

INSERT INTO subcategories (category_id, slug, name, sort_order)
SELECT c.id, s.slug, s.name, s.sort_order
FROM categories c,
(VALUES
  ('mistakes', 'Mistakes & Growth', 1),
  ('turning_points', 'Turning Points', 2),
  ('advice_self', 'Advice to Younger Self', 3),
  ('principles', 'Guiding Principles', 4),
  ('resilience', 'Resilience & Overcoming', 5),
  ('gratitude', 'Gratitude & Appreciation', 6)
) AS s(slug, name, sort_order)
WHERE c.slug = 'life_lessons';

-- 6. Family & Traditions
INSERT INTO categories (slug, name, description, icon, sort_order)
VALUES ('family_traditions', 'Family & Traditions', 'Family stories, recipes, customs, and cultural heritage', 'home', 6);

INSERT INTO subcategories (category_id, slug, name, sort_order)
SELECT c.id, s.slug, s.name, s.sort_order
FROM categories c,
(VALUES
  ('family_stories', 'Family Stories', 1),
  ('recipes', 'Recipes & Food', 2),
  ('customs', 'Customs & Rituals', 3),
  ('heritage', 'Cultural Heritage', 4),
  ('holidays', 'Holidays & Celebrations', 5),
  ('heirlooms', 'Heirlooms & Objects', 6)
) AS s(slug, name, sort_order)
WHERE c.slug = 'family_traditions';

-- 7. Career & Work
INSERT INTO categories (slug, name, description, icon, sort_order)
VALUES ('career_work', 'Career & Work', 'Professional experiences, industry knowledge, and career advice', 'briefcase', 7);

INSERT INTO subcategories (category_id, slug, name, sort_order)
SELECT c.id, s.slug, s.name, s.sort_order
FROM categories c,
(VALUES
  ('career_path', 'Career Path & Decisions', 1),
  ('skills', 'Skills & Expertise', 2),
  ('leadership', 'Leadership & Management', 3),
  ('workplace', 'Workplace Experiences', 4),
  ('entrepreneurship', 'Entrepreneurship', 5)
) AS s(slug, name, sort_order)
WHERE c.slug = 'career_work';

-- 8. Hobbies & Interests
INSERT INTO categories (slug, name, description, icon, sort_order)
VALUES ('hobbies_interests', 'Hobbies & Interests', 'Passions, creative pursuits, and things that bring joy', 'palette', 8);

INSERT INTO subcategories (category_id, slug, name, sort_order)
SELECT c.id, s.slug, s.name, s.sort_order
FROM categories c,
(VALUES
  ('creative', 'Creative Pursuits', 1),
  ('sports_fitness', 'Sports & Fitness', 2),
  ('travel', 'Travel & Adventure', 3),
  ('learning', 'Learning & Education', 4),
  ('collections', 'Collections & Hobbies', 5),
  ('nature', 'Nature & Outdoors', 6)
) AS s(slug, name, sort_order)
WHERE c.slug = 'hobbies_interests';

-- 9. Values & Beliefs
INSERT INTO categories (slug, name, description, icon, sort_order)
VALUES ('values_beliefs', 'Values & Beliefs', 'Moral compass, faith, philosophy, and what matters most', 'compass', 9);

INSERT INTO subcategories (category_id, slug, name, sort_order)
SELECT c.id, s.slug, s.name, s.sort_order
FROM categories c,
(VALUES
  ('core_values', 'Core Values', 1),
  ('faith_spirituality', 'Faith & Spirituality', 2),
  ('philosophy', 'Philosophy & Worldview', 3),
  ('ethics', 'Ethics & Morals', 4),
  ('purpose', 'Purpose & Meaning', 5)
) AS s(slug, name, sort_order)
WHERE c.slug = 'values_beliefs';

-- 10. Memories & Stories
INSERT INTO categories (slug, name, description, icon, sort_order)
VALUES ('memories_stories', 'Memories & Stories', 'Cherished memories, funny moments, and stories worth preserving', 'book-open', 10);

INSERT INTO subcategories (category_id, slug, name, sort_order)
SELECT c.id, s.slug, s.name, s.sort_order
FROM categories c,
(VALUES
  ('childhood', 'Childhood Memories', 1),
  ('milestones', 'Milestones & Firsts', 2),
  ('funny_moments', 'Funny Moments', 3),
  ('pivotal_events', 'Pivotal Events', 4),
  ('places', 'Places & Settings', 5),
  ('people_met', 'People Who Shaped Me', 6)
) AS s(slug, name, sort_order)
WHERE c.slug = 'memories_stories';

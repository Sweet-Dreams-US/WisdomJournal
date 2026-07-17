-- 043: Business question bank
-- Seeds 120 questions (20 per category) across the 6 business categories added in 042:
--   decision_making, process_systems, stakeholders, crisis_challenges,
--   institutional_knowledge, leadership_management
-- All questions: context_type='business', is_active=true, is_daily_reflection=false, subcategory_id NULL.
-- Idempotency: questions.text has no unique constraint, so each block guards with
-- WHERE NOT EXISTS on identical text (safe to re-run).

-- ============================================================
-- CATEGORY: decision_making (20 questions)
-- ============================================================
INSERT INTO questions (text, category_id, subcategory_id, difficulty, emotional_weight, expected_length, is_daily_reflection, is_active, context_type)
SELECT q.text, c.id, NULL, q.difficulty::question_difficulty, q.ew::emotional_weight, q.el::expected_response_length, false, true, 'business'
FROM categories c
CROSS JOIN (VALUES
  ('Walk me through a decision you got wrong at work. What did the aftermath teach you?', 'deep', 'reflective', 'detailed'),
  ('Tell me about a time you had to decide with half the information you wanted. How did you fill the gap?', 'medium', 'neutral', 'medium'),
  ('What''s a decision you made quickly that turned out right? What told you it was safe to move fast?', 'medium', 'light', 'medium'),
  ('Describe a time you overruled the numbers or the report because something felt off. What happened?', 'deep', 'reflective', 'medium'),
  ('What''s the smallest decision you''ve seen snowball into the biggest consequence?', 'medium', 'neutral', 'medium'),
  ('Tell me about a decision you sat on too long. What did the waiting actually cost?', 'medium', 'reflective', 'medium'),
  ('How do you tell a risk worth taking from a gamble? Give an example from your own work.', 'deep', 'reflective', 'medium'),
  ('When two good options are on the table, how do you actually pick one? Walk me through a real case.', 'medium', 'neutral', 'medium'),
  ('Tell me about a decision where every option would upset someone. How did you choose?', 'deep', 'heavy', 'detailed'),
  ('What''s a rule of thumb you use for decisions that you learned the hard way?', 'medium', 'reflective', 'medium'),
  ('Describe a moment you said no to something that looked great on paper. What did you see?', 'medium', 'neutral', 'medium'),
  ('Tell me about the first big call you were trusted to make on your own. How did it go?', 'easy', 'light', 'medium'),
  ('When have you changed your mind late in a decision? What made you willing to reverse course?', 'deep', 'reflective', 'medium'),
  ('What''s a decision you handed off that you should have kept, or kept that you should have handed off?', 'deep', 'reflective', 'medium'),
  ('Tell me about a time the cheapest option turned out to be the most expensive.', 'easy', 'light', 'medium'),
  ('Tell me about a time you had to call something finished before it felt done. How did you make peace with it?', 'medium', 'neutral', 'medium'),
  ('What warning signs do you check before committing to something big? Where did you learn them?', 'medium', 'reflective', 'medium'),
  ('Describe a decision where the right answer was obvious but actually doing it was hard.', 'deep', 'heavy', 'detailed'),
  ('Tell me about being pressured to decide faster than you were comfortable with. What did you do?', 'medium', 'neutral', 'medium'),
  ('What work decision are you most proud of, and what nearly stopped you from making it?', 'deep', 'reflective', 'detailed')
) AS q(text, difficulty, ew, el)
WHERE c.slug = 'decision_making'
  AND NOT EXISTS (SELECT 1 FROM questions existing WHERE existing.text = q.text);

-- ============================================================
-- CATEGORY: process_systems (20 questions)
-- ============================================================
INSERT INTO questions (text, category_id, subcategory_id, difficulty, emotional_weight, expected_length, is_daily_reflection, is_active, context_type)
SELECT q.text, c.id, NULL, q.difficulty::question_difficulty, q.ew::emotional_weight, q.el::expected_response_length, false, true, 'business'
FROM categories c
CROSS JOIN (VALUES
  ('Tell me about a process you built from scratch. What problem forced it into existence?', 'medium', 'neutral', 'medium'),
  ('What step in your work looks pointless to outsiders but exists for a good reason? What''s the reason?', 'medium', 'light', 'medium'),
  ('Describe a shortcut that burned you. What do you do differently now?', 'medium', 'reflective', 'medium'),
  ('What''s the first thing you check when something isn''t working? How did that habit form?', 'easy', 'light', 'medium'),
  ('Tell me about a time you fixed something by simplifying it instead of adding to it.', 'medium', 'neutral', 'medium'),
  ('What tool or method do you swear by that others overlook? What convinced you?', 'easy', 'light', 'medium'),
  ('Walk me through how you catch your own mistakes before anyone else sees them.', 'medium', 'neutral', 'medium'),
  ('Tell me about a process everyone hated that turned out to matter. How did you learn its value?', 'medium', 'reflective', 'medium'),
  ('What do you always do in a specific order for a reason nobody ever wrote down?', 'medium', 'light', 'medium'),
  ('Describe the messiest handoff you''ve ever dealt with. What would have prevented it?', 'medium', 'neutral', 'medium'),
  ('Tell me about a time a checklist, log, or written note saved you.', 'easy', 'light', 'medium'),
  ('Which part of your daily work would break first if you left tomorrow, and why?', 'deep', 'reflective', 'medium'),
  ('How do you decide what to write down versus keep in your head? What changed your mind either way?', 'medium', 'reflective', 'medium'),
  ('Tell me about a workaround that quietly became the official way of doing things.', 'medium', 'light', 'medium'),
  ('What quality check do you refuse to skip even under deadline pressure? What taught you that?', 'medium', 'neutral', 'medium'),
  ('Describe inheriting someone else''s system or setup. How did you figure out how it really worked?', 'medium', 'neutral', 'detailed'),
  ('What''s the most useful thing you do before starting a big piece of work?', 'easy', 'light', 'brief'),
  ('Tell me about a new tool or system that made things worse before it made things better.', 'medium', 'neutral', 'medium'),
  ('When a problem keeps coming back, how do you find the real cause instead of the obvious one? Give an example.', 'deep', 'reflective', 'detailed'),
  ('What habit of yours prevents problems that nobody ever knows about?', 'deep', 'reflective', 'medium')
) AS q(text, difficulty, ew, el)
WHERE c.slug = 'process_systems'
  AND NOT EXISTS (SELECT 1 FROM questions existing WHERE existing.text = q.text);

-- ============================================================
-- CATEGORY: stakeholders (20 questions)
-- ============================================================
INSERT INTO questions (text, category_id, subcategory_id, difficulty, emotional_weight, expected_length, is_daily_reflection, is_active, context_type)
SELECT q.text, c.id, NULL, q.difficulty::question_difficulty, q.ew::emotional_weight, q.el::expected_response_length, false, true, 'business'
FROM categories c
CROSS JOIN (VALUES
  ('Tell me about the hardest client or customer you ever won over. What finally worked?', 'medium', 'neutral', 'detailed'),
  ('Describe a working relationship that started badly and became one of your best. What turned it?', 'medium', 'reflective', 'medium'),
  ('How do you deliver bad news to someone who''s paying you? Walk me through a time you had to.', 'deep', 'reflective', 'medium'),
  ('Tell me about a time you lost someone''s trust at work. What did rebuilding it take?', 'deep', 'heavy', 'detailed'),
  ('What''s the fastest way you''ve seen someone destroy a good business relationship?', 'medium', 'neutral', 'medium'),
  ('Tell me about a supplier, partner, or colleague who saved you in a pinch. How was that relationship built?', 'easy', 'light', 'medium'),
  ('How can you tell when someone across the table isn''t being straight with you? What taught you the signs?', 'deep', 'reflective', 'medium'),
  ('Describe a negotiation you''re still proud of. What did you do beforehand that mattered most?', 'medium', 'neutral', 'detailed'),
  ('Tell me about keeping a promise at work that cost you something.', 'deep', 'reflective', 'medium'),
  ('What do you do differently with a new customer or partner in the first month? Why?', 'medium', 'light', 'medium'),
  ('Tell me about a complaint that turned out to be a gift. What did it reveal?', 'medium', 'reflective', 'medium'),
  ('Have you ever walked away from a client, customer, or vendor? How did you know it was time?', 'deep', 'neutral', 'medium'),
  ('What small gesture has done more for your working relationships than any contract?', 'easy', 'light', 'brief'),
  ('Tell me about a misunderstanding that almost sank a deal or a project. How was it caught?', 'medium', 'neutral', 'medium'),
  ('How do you work with someone who matters to the business but is hard to deal with? Give a real example.', 'deep', 'reflective', 'detailed'),
  ('Who taught you the most about dealing with people at work, and what did they show you?', 'easy', 'reflective', 'medium'),
  ('Tell me about standing up for your team to someone more powerful. How did you make your case?', 'deep', 'neutral', 'detailed'),
  ('What request do you always push back on, and how do you say no without burning the bridge?', 'medium', 'neutral', 'medium'),
  ('Describe a time listening, not talking, won you the customer or the argument.', 'medium', 'light', 'medium'),
  ('Which working relationship do you wish you had handled differently, and what would you change?', 'deep', 'heavy', 'detailed')
) AS q(text, difficulty, ew, el)
WHERE c.slug = 'stakeholders'
  AND NOT EXISTS (SELECT 1 FROM questions existing WHERE existing.text = q.text);

-- ============================================================
-- CATEGORY: crisis_challenges (20 questions)
-- ============================================================
INSERT INTO questions (text, category_id, subcategory_id, difficulty, emotional_weight, expected_length, is_daily_reflection, is_active, context_type)
SELECT q.text, c.id, NULL, q.difficulty::question_difficulty, q.ew::emotional_weight, q.el::expected_response_length, false, true, 'business'
FROM categories c
CROSS JOIN (VALUES
  ('Tell me about the worst day you''ve had at work. What got you through it?', 'deep', 'heavy', 'detailed'),
  ('Describe a moment when everything went wrong at once. What did you deal with first, and why?', 'deep', 'reflective', 'detailed'),
  ('Tell me about a mistake of yours that cost real money or real time. What happened next?', 'deep', 'heavy', 'detailed'),
  ('When did you have to deliver news nobody wanted to hear? How did you prepare?', 'medium', 'reflective', 'medium'),
  ('Tell me about a time you were in over your head. Who or what pulled you out?', 'deep', 'reflective', 'medium'),
  ('What failure can you laugh about now that was not funny at the time?', 'easy', 'light', 'medium'),
  ('Describe a deadline you thought was impossible. What did you cut, and what did you protect?', 'medium', 'neutral', 'medium'),
  ('Tell me about a plan that fell apart in the first hour. What did you do?', 'medium', 'neutral', 'medium'),
  ('When has staying calm been your biggest contribution? What was happening around you?', 'medium', 'reflective', 'medium'),
  ('Tell me about a problem you kept quiet about too long. What finally made you speak up?', 'deep', 'heavy', 'detailed'),
  ('What near miss still makes you wince? How did it change the way you work?', 'deep', 'reflective', 'medium'),
  ('Describe keeping others steady during a rough stretch while you were worried yourself.', 'deep', 'heavy', 'medium'),
  ('Tell me about recovering after losing a big customer, contract, or opportunity.', 'medium', 'reflective', 'medium'),
  ('What''s the best decision you''ve made under real pressure? What made it possible?', 'medium', 'neutral', 'medium'),
  ('Tell me about a crisis that showed you who people really were, for better or worse.', 'deep', 'reflective', 'detailed'),
  ('When money, people, or time ran short, how did you make it work anyway? Tell me about one time.', 'medium', 'neutral', 'medium'),
  ('What''s the first thing you do when you realize you''ve made a serious mistake?', 'medium', 'reflective', 'medium'),
  ('Tell me about a time you had to apologize professionally. What made it land, or not?', 'medium', 'reflective', 'medium'),
  ('Describe the most stressful stretch of your working life. What kept you going?', 'deep', 'heavy', 'detailed'),
  ('What did a hard season at work teach you that the easy years never could?', 'deep', 'reflective', 'medium')
) AS q(text, difficulty, ew, el)
WHERE c.slug = 'crisis_challenges'
  AND NOT EXISTS (SELECT 1 FROM questions existing WHERE existing.text = q.text);

-- ============================================================
-- CATEGORY: institutional_knowledge (20 questions)
-- ============================================================
INSERT INTO questions (text, category_id, subcategory_id, difficulty, emotional_weight, expected_length, is_daily_reflection, is_active, context_type)
SELECT q.text, c.id, NULL, q.difficulty::question_difficulty, q.ew::emotional_weight, q.el::expected_response_length, false, true, 'business'
FROM categories c
CROSS JOIN (VALUES
  ('What''s something about how your workplace really operates that took you years to learn?', 'medium', 'reflective', 'medium'),
  ('Tell me about an unwritten rule at work that new people always trip over.', 'easy', 'light', 'medium'),
  ('What''s the story behind something at work that everyone uses but nobody questions?', 'medium', 'light', 'medium'),
  ('Who was the person everyone went to with questions? What did they know that never got written down?', 'medium', 'reflective', 'medium'),
  ('Tell me about a time old knowledge, like a story, a file, or someone''s memory, saved the day.', 'medium', 'light', 'medium'),
  ('What mistake does every new person make in your line of work? What do you tell them?', 'easy', 'light', 'medium'),
  ('What lesson did your workplace learn the hard way that''s now at risk of being forgotten?', 'deep', 'reflective', 'detailed'),
  ('Tell me about something that failed before your time and almost got tried again. How did you know?', 'medium', 'neutral', 'medium'),
  ('What do you know about why things are set up the way they are that nobody else remembers?', 'medium', 'reflective', 'medium'),
  ('What was your workplace or trade like when you started? What has changed the most?', 'easy', 'light', 'detailed'),
  ('Tell me about a coworker whose absence is still felt. What walked out the door with them?', 'deep', 'reflective', 'medium'),
  ('What question do people always bring to you because no file or manual can answer it?', 'medium', 'light', 'medium'),
  ('What''s the real story behind a big change that everyone misremembers or only half knows?', 'medium', 'neutral', 'detailed'),
  ('If you had one hour to brief your replacement, what would you cover that''s written down nowhere?', 'deep', 'reflective', 'detailed'),
  ('What tradition or habit at work has a purpose most people have forgotten?', 'easy', 'light', 'medium'),
  ('Tell me about a customer, project, or event from years ago that still shapes decisions today.', 'medium', 'neutral', 'medium'),
  ('What''s the most valuable thing you learned from someone who retired or moved on?', 'medium', 'reflective', 'medium'),
  ('Which past failure does your workplace never talk about but should? What''s the lesson?', 'deep', 'heavy', 'detailed'),
  ('What do you wish someone had told you in your first month? Who eventually told you, and how?', 'easy', 'reflective', 'medium'),
  ('What knowledge do you carry that would take years to rebuild if you never shared it?', 'deep', 'reflective', 'detailed')
) AS q(text, difficulty, ew, el)
WHERE c.slug = 'institutional_knowledge'
  AND NOT EXISTS (SELECT 1 FROM questions existing WHERE existing.text = q.text);

-- ============================================================
-- CATEGORY: leadership_management (20 questions)
-- ============================================================
INSERT INTO questions (text, category_id, subcategory_id, difficulty, emotional_weight, expected_length, is_daily_reflection, is_active, context_type)
SELECT q.text, c.id, NULL, q.difficulty::question_difficulty, q.ew::emotional_weight, q.el::expected_response_length, false, true, 'business'
FROM categories c
CROSS JOIN (VALUES
  ('Tell me about the best boss you ever had. What did they do that you''ve tried to copy?', 'easy', 'light', 'medium'),
  ('Describe the hardest conversation you''ve had with someone you managed or mentored.', 'deep', 'heavy', 'detailed'),
  ('Tell me about a hire that didn''t work out. What did you miss, and what do you look for now?', 'deep', 'reflective', 'detailed'),
  ('When did you give someone a chance others wouldn''t have? How did it turn out?', 'medium', 'reflective', 'medium'),
  ('Tell me about holding someone accountable when it hurt. What made you follow through?', 'deep', 'heavy', 'detailed'),
  ('How did you learn to delegate? Tell me about the first thing you truly let go of.', 'medium', 'reflective', 'medium'),
  ('Describe the moment you realized your mood was setting the tone for everyone else.', 'medium', 'reflective', 'medium'),
  ('Tell me about helping someone grow beyond what they thought they could do. What did you actually do?', 'deep', 'reflective', 'detailed'),
  ('What''s the worst leadership habit you''ve had to unlearn? What showed you it was a problem?', 'deep', 'reflective', 'medium'),
  ('Tell me about taking the blame for your team. What happened afterward?', 'deep', 'reflective', 'medium'),
  ('How do you tell someone their work isn''t good enough without crushing them? Walk me through a real time.', 'medium', 'neutral', 'medium'),
  ('When have you championed the quiet one everyone else overlooked? What did you see?', 'medium', 'light', 'medium'),
  ('Tell me about leading through a change you didn''t agree with. What did you say to your people?', 'deep', 'heavy', 'detailed'),
  ('What did becoming responsible for other people change about you?', 'deep', 'reflective', 'medium'),
  ('Tell me about the first time you led people older or more experienced than you.', 'medium', 'neutral', 'medium'),
  ('How do you spot burnout in someone before they say a word? What taught you the signs?', 'medium', 'reflective', 'medium'),
  ('Describe a time you had to let someone go. What did you learn about doing it right, or wrong?', 'deep', 'heavy', 'detailed'),
  ('What compliment or correction from a mentor changed how you work? Tell the story.', 'easy', 'reflective', 'medium'),
  ('Tell me about a team that just clicked. What did you or someone else do to build that?', 'medium', 'light', 'medium'),
  ('What do you know now about leading people that you wish you''d known your first year in charge?', 'deep', 'reflective', 'detailed')
) AS q(text, difficulty, ew, el)
WHERE c.slug = 'leadership_management'
  AND NOT EXISTS (SELECT 1 FROM questions existing WHERE existing.text = q.text);

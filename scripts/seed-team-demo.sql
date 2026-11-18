-- Local demo accounts created by recommendation/cmd/seeder only.
-- Run with psql against the local winx-db; existing academic edits are preserved.
BEGIN;
CREATE TEMP TABLE team_demo_users ON COMMIT DROP AS
SELECT id, row_number() OVER (ORDER BY id) AS seq FROM users WHERE email LIKE '%@seed.local';
INSERT INTO academic_profiles(user_id,skills,preferred_role)
SELECT id,
 CASE id%4 WHEN 0 THEN '["Figma","UX design","Presentations"]'::jsonb
 WHEN 1 THEN '["Go","PostgreSQL","API design"]'::jsonb
 WHEN 2 THEN '["Angular","TypeScript","CSS"]'::jsonb
 ELSE '["Python","Data analysis","Testing"]'::jsonb END,
 CASE id%4 WHEN 0 THEN 'Designer' WHEN 1 THEN 'Backend developer' WHEN 2 THEN 'Frontend developer' ELSE 'QA / Data analyst' END
FROM team_demo_users ON CONFLICT DO NOTHING;
INSERT INTO user_courses(user_id,course_id)
SELECT u.id,c.id FROM team_demo_users u JOIN courses c ON c.code='ALG201'
ON CONFLICT DO NOTHING;
INSERT INTO user_courses(user_id,course_id)
SELECT u.id,c.id FROM team_demo_users u JOIN courses c
ON c.code=CASE u.id%3 WHEN 0 THEN 'DBS202' WHEN 1 THEN 'WEB203' ELSE 'SWE204' END
ON CONFLICT DO NOTHING;
CREATE TEMP TABLE team_demo_groups(code,name,first_seq,member_count) ON COMMIT DROP AS
VALUES ('DEMA22','Algorithm Explorers',61,2),('DEMB33','Code Collective',63,3),('DEMC55','Big O Five',66,5);
CREATE TEMP TABLE team_demo_created ON COMMIT DROP AS
WITH inserted AS (
INSERT INTO teams(course_id,name,join_code,created_by)
SELECT c.id,g.name,g.code,u.id FROM team_demo_groups g
JOIN team_demo_users u ON u.seq=g.first_seq CROSS JOIN courses c
WHERE c.code='ALG201' ON CONFLICT(join_code) DO NOTHING
RETURNING id,join_code,course_id
) SELECT * FROM inserted;
INSERT INTO team_members(team_id,user_id,course_id)
SELECT t.id,u.id,t.course_id FROM team_demo_groups g JOIN team_demo_created t ON t.join_code=g.code
JOIN team_demo_users u ON u.seq>=g.first_seq AND u.seq<g.first_seq+g.member_count
ON CONFLICT DO NOTHING;
COMMIT;

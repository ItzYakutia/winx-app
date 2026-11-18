-- +goose Up
-- +goose StatementBegin
ALTER TABLE chats ALTER COLUMN match_id DROP NOT NULL;
ALTER TABLE chats ADD COLUMN course_id BIGINT REFERENCES courses(id) ON DELETE CASCADE;
ALTER TABLE chats ADD COLUMN status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','declined','joined'));
ALTER TABLE chats ADD COLUMN initiated_by BIGINT REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE chats ADD COLUMN closed_by BIGINT REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE chats ADD COLUMN team_id BIGINT REFERENCES teams(id) ON DELETE SET NULL;
ALTER TABLE chats ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE chats ADD CONSTRAINT chats_academic_shape CHECK
 (course_id IS NULL OR (match_id IS NULL AND user_one_id < user_two_id));
CREATE UNIQUE INDEX chats_academic_pair_key ON chats(course_id,user_one_id,user_two_id);

-- Bring previously saved classmates into the same conversation flow.
INSERT INTO chats(course_id,user_one_id,user_two_id,initiated_by,created_at,updated_at)
SELECT cc.course_id,LEAST(cc.user_id,cc.candidate_id),GREATEST(cc.user_id,cc.candidate_id),
       MIN(cc.user_id),MIN(cc.updated_at),MAX(cc.updated_at)
FROM course_choices cc
JOIN user_courses a ON a.user_id=cc.user_id AND a.course_id=cc.course_id
JOIN user_courses b ON b.user_id=cc.candidate_id AND b.course_id=cc.course_id
JOIN users ua ON ua.id=cc.user_id AND ua.deletion_requested_at IS NULL
JOIN users ub ON ub.id=cc.candidate_id AND ub.deletion_requested_at IS NULL
WHERE cc.choice='like' AND cc.user_id<>cc.candidate_id
GROUP BY cc.course_id,LEAST(cc.user_id,cc.candidate_id),GREATEST(cc.user_id,cc.candidate_id)
ON CONFLICT (course_id,user_one_id,user_two_id) DO NOTHING;
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
DELETE FROM chats WHERE course_id IS NOT NULL;
DROP INDEX chats_academic_pair_key;
ALTER TABLE chats DROP CONSTRAINT chats_academic_shape;
ALTER TABLE chats DROP COLUMN updated_at,DROP COLUMN team_id,DROP COLUMN closed_by,
 DROP COLUMN initiated_by,DROP COLUMN status,DROP COLUMN course_id;
ALTER TABLE chats ALTER COLUMN match_id SET NOT NULL;
-- +goose StatementEnd

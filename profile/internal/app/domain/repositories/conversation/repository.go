package conversation

import (
	"context"
	"crypto/rand"
	"encoding/json"
	"errors"
	"fmt"
	"github.com/jackc/pgx/v5/pgconn"
	"gorm.io/gorm"
	"strings"
	"unicode/utf8"
	"winx-profile/internal/app/models/models"
)

var (
	ErrNotFound  = errors.New("Диалог не найден.")
	ErrClosed    = errors.New("Общение уже завершено.")
	ErrCourse    = errors.New("У обоих участников должен быть выбран этот предмет.")
	ErrFull      = errors.New("В команде уже 5 участников.")
	ErrOtherTeam = errors.New("Собеседник уже состоит в другой команде по этому предмету.")
	ErrName      = errors.New("Введите название команды: от 2 до 50 символов.")
	ErrConflict  = errors.New("Состав команды изменился. Попробуйте ещё раз.")
)

type Repository struct{ db *gorm.DB }

func New(db *gorm.DB) *Repository { return &Repository{db: db} }

const roomQuery = `SELECT c.id,c.course_id,cr.code AS course_code,cr.title AS course_title,
 CASE WHEN c.user_one_id=@user THEN c.user_two_id ELSE c.user_one_id END AS peer_id,
 COALESCE(p.name,'Студент') AS peer_name,COALESCE(ap.preferred_role,'') AS preferred_role,
 COALESCE(ap.skills,'[]'::jsonb) AS skills,c.status,c.initiated_by,c.closed_by,c.team_id,c.created_at,
 mt.id AS my_team_id,COALESCE(mt.name,'') AS my_team_name,
 (SELECT COUNT(*) FROM team_members WHERE team_id=mt.id) AS my_team_size,pm.team_id AS peer_team_id,
 COALESCE(lm.content,'') AS last_message,lm.created_at AS last_message_at,
 (c.status<>'declined' AND EXISTS(SELECT 1 FROM user_courses WHERE user_id=c.user_one_id AND course_id=c.course_id)
 AND EXISTS(SELECT 1 FROM user_courses WHERE user_id=c.user_two_id AND course_id=c.course_id)) AS can_write
 FROM chats c JOIN courses cr ON cr.id=c.course_id
 JOIN users ua ON ua.id=c.user_one_id AND ua.deletion_requested_at IS NULL
 JOIN users ub ON ub.id=c.user_two_id AND ub.deletion_requested_at IS NULL
 LEFT JOIN profiles p ON p.user_id=CASE WHEN c.user_one_id=@user THEN c.user_two_id ELSE c.user_one_id END
 LEFT JOIN academic_profiles ap ON ap.user_id=CASE WHEN c.user_one_id=@user THEN c.user_two_id ELSE c.user_one_id END
 LEFT JOIN team_members me ON me.user_id=@user AND me.course_id=c.course_id
 LEFT JOIN teams mt ON mt.id=me.team_id
 LEFT JOIN team_members pm ON pm.user_id=CASE WHEN c.user_one_id=@user THEN c.user_two_id ELSE c.user_one_id END AND pm.course_id=c.course_id
 LEFT JOIN LATERAL(SELECT content,created_at FROM messages WHERE chat_id=c.id ORDER BY id DESC LIMIT 1) lm ON TRUE
 WHERE (c.user_one_id=@user OR c.user_two_id=@user) AND c.course_id IS NOT NULL `

func decode(room *models.Conversation) error {
	room.Skills = []string{}
	if len(room.SkillsJSON) > 0 {
		return json.Unmarshal(room.SkillsJSON, &room.Skills)
	}
	return nil
}
func (r *Repository) List(ctx context.Context, user, course int64, limit, offset int) ([]models.Conversation, error) {
	rooms := []models.Conversation{}
	err := r.db.WithContext(ctx).Raw(roomQuery+` AND c.course_id=@course AND c.status<>'declined'
 ORDER BY COALESCE(lm.created_at,c.created_at) DESC,c.id DESC LIMIT @limit OFFSET @offset`,
		map[string]interface{}{"user": user, "course": course, "limit": limit, "offset": offset}).Scan(&rooms).Error
	if err != nil {
		return nil, err
	}
	for i := range rooms {
		if err := decode(&rooms[i]); err != nil {
			return nil, err
		}
	}
	return rooms, nil
}
func (r *Repository) Get(ctx context.Context, user, id int64) (models.Conversation, error) {
	var room models.Conversation
	result := r.db.WithContext(ctx).Raw(roomQuery+` AND c.id=@id`, map[string]interface{}{"user": user, "id": id}).Scan(&room)
	if result.Error != nil {
		return room, result.Error
	}
	if result.RowsAffected == 0 {
		return room, ErrNotFound
	}
	return room, decode(&room)
}
func (r *Repository) Messages(ctx context.Context, user, id, before int64) ([]models.ConversationMessage, error) {
	if _, err := r.Get(ctx, user, id); err != nil {
		return nil, err
	}
	rows := []models.ConversationMessage{}
	err := r.db.WithContext(ctx).Raw(`SELECT * FROM(SELECT id,chat_id,sender_id,content,created_at FROM messages
 WHERE chat_id=? AND (?::bigint=0 OR id<?) ORDER BY id DESC LIMIT 50) m ORDER BY id`, id, before, before).Scan(&rows).Error
	return rows, err
}

type lockedRoom struct {
	ID, CourseID, UserOneID, UserTwoID int64
	Status                             string
	TeamID                             *int64
}

func (r *Repository) Decide(ctx context.Context, user, id int64, decision, name string) (models.Conversation, error) {
	err := r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		var room lockedRoom
		result := tx.Raw(`SELECT id,course_id,user_one_id,user_two_id,status,team_id FROM chats
   WHERE id=? AND course_id IS NOT NULL AND (user_one_id=? OR user_two_id=?) FOR UPDATE`, id, user, user).Scan(&room)
		if result.Error != nil {
			return result.Error
		}
		if result.RowsAffected == 0 {
			return ErrNotFound
		}
		if room.Status == "declined" {
			if decision == "decline" {
				return nil
			}
			return ErrClosed
		}
		if room.Status == "joined" {
			if decision == "add" {
				return nil
			}
			return ErrClosed
		}
		peer := room.UserOneID
		if peer == user {
			peer = room.UserTwoID
		}
		if decision == "decline" {
			if err := tx.Exec(`UPDATE chats SET status='declined',closed_by=?,updated_at=NOW() WHERE id=?`, user, id).Error; err != nil {
				return err
			}
			return tx.Exec(`INSERT INTO course_choices(user_id,candidate_id,course_id,choice)
    VALUES(?,?,?,'pass'),(?,?,?,'pass') ON CONFLICT(user_id,candidate_id,course_id)
    DO UPDATE SET choice='pass',updated_at=NOW()`, user, peer, room.CourseID, peer, user, room.CourseID).Error
		}
		// Hold course rows while adding, preventing enrollment removal mid-decision.
		var eligible []int64
		if err := tx.Raw(`SELECT uc.user_id FROM user_courses uc JOIN users u ON u.id=uc.user_id
    WHERE uc.user_id IN (?,?) AND uc.course_id=? AND u.deletion_requested_at IS NULL
    ORDER BY uc.user_id FOR SHARE OF uc,u`, user, peer, room.CourseID).Scan(&eligible).Error; err != nil {
			return err
		}
		if len(eligible) != 2 {
			return ErrCourse
		}
		var teamID int64
		if err := tx.Raw(`SELECT team_id FROM team_members WHERE user_id=? AND course_id=?`, user, room.CourseID).Scan(&teamID).Error; err != nil {
			return err
		}
		if teamID == 0 {
			name = strings.TrimSpace(name)
			n := utf8.RuneCountInString(name)
			if n < 2 || n > 50 {
				return ErrName
			}
			code, err := newCode()
			if err != nil {
				return err
			}
			if err = tx.Raw(`INSERT INTO teams(course_id,name,join_code,created_by) VALUES(?,?,?,?) RETURNING id`, room.CourseID, name, code, user).Scan(&teamID).Error; err != nil {
				return err
			}
			if err = tx.Exec(`INSERT INTO team_members(team_id,user_id,course_id) VALUES(?,?,?)`, teamID, user, room.CourseID).Error; err != nil {
				return err
			}
		} else {
			// Join-by-code uses the same team lock, so every add shares the five-person cap.
			var locked int64
			if err := tx.Raw(`SELECT id FROM teams WHERE id=? FOR UPDATE`, teamID).Scan(&locked).Error; err != nil {
				return err
			}
			if locked == 0 {
				return ErrConflict
			}
		}
		var peerTeam int64
		if err := tx.Raw(`SELECT team_id FROM team_members WHERE user_id=? AND course_id=?`, peer, room.CourseID).Scan(&peerTeam).Error; err != nil {
			return err
		}
		if peerTeam != 0 && peerTeam != teamID {
			return ErrOtherTeam
		}
		if peerTeam == 0 {
			var count int64
			if err := tx.Raw(`SELECT COUNT(*) FROM team_members WHERE team_id=?`, teamID).Scan(&count).Error; err != nil {
				return err
			}
			if count >= 5 {
				return ErrFull
			}
			if err := tx.Exec(`INSERT INTO team_members(team_id,user_id,course_id) VALUES(?,?,?)`, teamID, peer, room.CourseID).Error; err != nil {
				return err
			}
		}
		return tx.Exec(`UPDATE chats SET status='joined',team_id=?,updated_at=NOW() WHERE id=?`, teamID, id).Error
	})
	if err != nil {
		var pg *pgconn.PgError
		if errors.As(err, &pg) && pg.Code == "23505" {
			return models.Conversation{}, ErrConflict
		}
		return models.Conversation{}, err
	}
	return r.Get(ctx, user, id)
}
func newCode() (string, error) {
	const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
	var buf [6]byte
	if _, err := rand.Read(buf[:]); err != nil {
		return "", fmt.Errorf("generate join code: %w", err)
	}
	for i, v := range buf {
		buf[i] = alphabet[int(v)%len(alphabet)]
	}
	return string(buf[:]), nil
}

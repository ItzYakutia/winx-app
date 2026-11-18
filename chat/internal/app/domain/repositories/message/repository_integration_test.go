//go:build integration

package message

import (
	"context"
	"errors"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"os"
	"strings"
	"testing"
	chatdto "winx-chat/internal/app/domain/core/dto/repositories/chat"
	dto "winx-chat/internal/app/domain/core/dto/repositories/message"
	chatrepo "winx-chat/internal/app/domain/repositories/chat"
)

func TestAcademicMessagePermissionsAndSocialIsolation(t *testing.T) {
	dsn := os.Getenv("WINX_TEST_DSN")
	if dsn == "" {
		t.Skip("WINX_TEST_DSN is required")
	}
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		t.Fatal(err)
	}
	var database string
	db.Raw("SELECT current_database()").Scan(&database)
	if !strings.HasPrefix(database, "winx_conv_qa_") {
		t.Fatal("requires isolated winx_conv_qa_ database")
	}
	cleanup := func() {
		db.Exec("DELETE FROM chats WHERE user_one_id BETWEEN 9101 AND 9103 OR user_two_id BETWEEN 9101 AND 9103")
		db.Exec("DELETE FROM courses WHERE code='CHATMSGQA'")
		db.Exec("DELETE FROM users WHERE id BETWEEN 9101 AND 9103")
	}
	cleanup()
	t.Cleanup(cleanup)
	for id := int64(9101); id <= 9103; id++ {
		if err := db.Exec("INSERT INTO users(id,email,password) VALUES(?,'chat-'||?::bigint::text||'@example.test','x')", id, id).Error; err != nil {
			t.Fatal(err)
		}
	}
	var course, academic, social int64
	if err := db.Raw("INSERT INTO courses(code,title) VALUES('CHATMSGQA','Messages QA') RETURNING id").Scan(&course).Error; err != nil {
		t.Fatal(err)
	}
	db.Exec("INSERT INTO user_courses(user_id,course_id) VALUES(9101,?),(9102,?)", course, course)
	db.Raw("INSERT INTO chats(course_id,user_one_id,user_two_id,initiated_by) VALUES(?,9101,9102,9101) RETURNING id", course).Scan(&academic)
	db.Raw("INSERT INTO chats(match_id,user_one_id,user_two_id) VALUES(99101,9101,9102) RETURNING id").Scan(&social)
	repo := NewRepository(db)
	ctx := context.Background()
	for _, item := range []struct {
		name, status           string
		sender                 int64
		missingCourse, allowed bool
	}{
		{"open", "open", 9101, false, true}, {"joined", "joined", 9102, false, true},
		{"declined", "declined", 9101, false, false}, {"outsider", "open", 9103, false, false},
		{"course removed", "open", 9101, true, false},
	} {
		t.Run(item.name, func(t *testing.T) {
			db.Exec("UPDATE chats SET status=? WHERE id=?", item.status, academic)
			if item.missingCourse {
				db.Exec("DELETE FROM user_courses WHERE user_id=9102 AND course_id=?", course)
			}
			var before, after int64
			db.Table("messages").Count(&before)
			message, err := repo.Create(ctx, dto.CreateDTO{ChatID: academic, SenderID: item.sender, Content: "Academic message"})
			if item.allowed {
				if err != nil || message.ID == 0 {
					t.Fatalf("expected persisted message: %v", err)
				}
			} else if !errors.Is(err, ErrChatClosed) {
				t.Fatalf("expected blocked message: %v", err)
			}
			db.Table("messages").Count(&after)
			expected := before
			if item.allowed {
				expected++
			}
			if after != expected {
				t.Fatalf("message count %d != %d", after, expected)
			}
		})
	}
	if _, err := repo.Create(ctx, dto.CreateDTO{ChatID: social, SenderID: 9101, Content: "Social still works"}); err != nil {
		t.Fatal(err)
	}
	rooms, err := chatrepo.NewRepository(db).ListByUserID(ctx, chatdto.ListDTO{UserID: 9101, Limit: 20})
	if err != nil || len(rooms) != 1 || rooms[0].ID != social {
		t.Fatalf("academic chat leaked into Social: %v %v", rooms, err)
	}
}

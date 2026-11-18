//go:build integration

package conversation

import (
	"context"
	"errors"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"os"
	"strings"
	"sync"
	"testing"
	choice "winx-profile/internal/app/domain/repositories/choice"
	team "winx-profile/internal/app/domain/repositories/team"
)

type fixture struct {
	db      *gorm.DB
	repo    *Repository
	choices choice.Repository
	a, b    int64
}

func fresh(t *testing.T) fixture {
	t.Helper()
	dsn := os.Getenv("WINX_TEST_DSN")
	if dsn == "" {
		t.Skip("WINX_TEST_DSN is required")
	}
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		t.Fatal(err)
	}
	var name string
	db.Raw("SELECT current_database()").Scan(&name)
	if !strings.HasPrefix(name, "winx_conv_qa_") {
		t.Fatal("conversation tests require an isolated winx_conv_qa_ database")
	}
	cleanup := func() {
		db.Exec("DELETE FROM chats WHERE user_one_id BETWEEN 9001 AND 9008 OR user_two_id BETWEEN 9001 AND 9008")
		db.Exec("DELETE FROM courses WHERE code IN ('CONVA','CONVB')")
		db.Exec("DELETE FROM users WHERE id BETWEEN 9001 AND 9008")
	}
	cleanup()
	t.Cleanup(cleanup)
	for id := int64(9001); id <= 9008; id++ {
		if err := db.Exec("INSERT INTO users(id,email,password) VALUES(?,'conv-'||?::bigint::text||'@example.test','x')", id, id).Error; err != nil {
			t.Fatal(err)
		}
	}
	f := fixture{db: db, repo: New(db), choices: choice.NewRepository(db)}
	db.Raw("INSERT INTO courses(code,title) VALUES('CONVA','Course A') RETURNING id").Scan(&f.a)
	db.Raw("INSERT INTO courses(code,title) VALUES('CONVB','Course B') RETURNING id").Scan(&f.b)
	for id := int64(9001); id <= 9008; id++ {
		if id < 9008 {
			db.Exec("INSERT INTO user_courses(user_id,course_id) VALUES(?,?)", id, f.a)
		}
		db.Exec("INSERT INTO user_courses(user_id,course_id) VALUES(?,?)", id, f.b)
	}
	return f
}
func (f fixture) like(t *testing.T, user, peer, course int64) int64 {
	t.Helper()
	ok, err := f.choices.Upsert(context.Background(), user, peer, course, "like")
	if err != nil || !ok {
		t.Fatalf("like: %v %v", ok, err)
	}
	var id int64
	first, second := user, peer
	if first > second {
		first, second = second, first
	}
	f.db.Raw("SELECT id FROM chats WHERE course_id=? AND user_one_id=? AND user_two_id=?", course, first, second).Scan(&id)
	if id == 0 {
		t.Fatal("like did not create conversation")
	}
	return id
}
func TestConversationLikeAndAccess(t *testing.T) {
	f := fresh(t)
	ctx := context.Background()
	id := f.like(t, 9001, 9002, f.a)
	if second := f.like(t, 9002, 9001, f.a); second != id {
		t.Fatal("reciprocal like duplicated conversation")
	}
	var count int64
	f.db.Table("chats").Count(&count)
	if count != 1 {
		t.Fatal(count)
	}
	for _, user := range []int64{9001, 9002} {
		rooms, err := f.repo.List(ctx, user, f.a, 50, 0)
		if err != nil || len(rooms) != 1 {
			t.Fatalf("list %d: %v %v", user, rooms, err)
		}
	}
	if _, err := f.repo.Get(ctx, 9003, id); !errors.Is(err, ErrNotFound) {
		t.Fatalf("outsider read: %v", err)
	}
	if _, err := f.repo.Messages(ctx, 9003, id, 0); !errors.Is(err, ErrNotFound) {
		t.Fatalf("outsider history: %v", err)
	}
	if _, err := f.repo.Decide(ctx, 9003, id, "decline", ""); !errors.Is(err, ErrNotFound) {
		t.Fatalf("outsider decision: %v", err)
	}
	other := f.like(t, 9001, 9002, f.b)
	if other == id {
		t.Fatal("courses share a conversation")
	}
	if ok, err := f.choices.Upsert(ctx, 9001, 9008, f.a, "like"); ok || err != nil {
		t.Fatalf("outside course: %v %v", ok, err)
	}
}
func TestConversationDeclineKeepsHistoryAndIsFinal(t *testing.T) {
	f := fresh(t)
	ctx := context.Background()
	id := f.like(t, 9001, 9002, f.a)
	f.db.Exec("INSERT INTO messages(chat_id,sender_id,content) VALUES(?,9001,'Hello')", id)
	room, err := f.repo.Decide(ctx, 9002, id, "decline", "")
	if err != nil || room.Status != "declined" {
		t.Fatalf("%+v %v", room, err)
	}
	for _, user := range []int64{9001, 9002} {
		rooms, err := f.repo.List(ctx, user, f.a, 50, 0)
		if err != nil || len(rooms) != 0 {
			t.Fatalf("declined in list: %v", err)
		}
		history, err := f.repo.Messages(ctx, user, id, 0)
		if err != nil || len(history) != 1 {
			t.Fatalf("lost history: %v", err)
		}
	}
	if _, err = f.repo.Decide(ctx, 9001, id, "add", "No"); !errors.Is(err, ErrClosed) {
		t.Fatalf("reopened declined chat: %v", err)
	}
	f.like(t, 9001, 9002, f.a)
	room, _ = f.repo.Get(ctx, 9001, id)
	if room.CanWrite {
		t.Fatal("re-like reopened declined chat")
	}
}
func TestConversationCreateTeamIsAtomicAndIdempotent(t *testing.T) {
	f := fresh(t)
	ctx := context.Background()
	id := f.like(t, 9001, 9002, f.a)
	if _, err := f.repo.Decide(ctx, 9001, id, "add", "x"); !errors.Is(err, ErrName) {
		t.Fatal(err)
	}
	var count int64
	f.db.Table("teams").Count(&count)
	if count != 0 {
		t.Fatal("failed decision created a team")
	}
	room, err := f.repo.Decide(ctx, 9001, id, "add", "Course project")
	if err != nil || room.Status != "joined" || room.MyTeamSize != 2 {
		t.Fatalf("%+v %v", room, err)
	}
	again, err := f.repo.Decide(ctx, 9002, id, "add", "")
	if err != nil || again.TeamID == nil || *again.TeamID != *room.TeamID {
		t.Fatalf("not idempotent: %+v %v", again, err)
	}
	if _, err = f.repo.Decide(ctx, 9002, id, "decline", ""); !errors.Is(err, ErrClosed) {
		t.Fatal("decline removed existing membership")
	}
	var size int64
	f.db.Table("team_members").Count(&size)
	if size != 2 {
		t.Fatal(size)
	}
}
func TestConversationConcurrentAddsRespectFiveMembers(t *testing.T) {
	f := fresh(t)
	ctx := context.Background()
	created, err := team.NewRepository(f.db).Create(ctx, 9001, f.a, "Concurrent", "CQA234")
	if err != nil {
		t.Fatal(err)
	}
	ids := []int64{}
	for peer := int64(9002); peer <= 9007; peer++ {
		ids = append(ids, f.like(t, 9001, peer, f.a))
	}
	results := make(chan error, len(ids))
	var wg sync.WaitGroup
	for _, id := range ids {
		wg.Add(1)
		go func(id int64) { defer wg.Done(); _, err := f.repo.Decide(ctx, 9001, id, "add", ""); results <- err }(id)
	}
	wg.Wait()
	close(results)
	success, full := 0, 0
	for err := range results {
		if err == nil {
			success++
		} else if errors.Is(err, ErrFull) {
			full++
		} else {
			t.Error(err)
		}
	}
	if success != 4 || full != 2 {
		t.Fatalf("success=%d full=%d", success, full)
	}
	var size int64
	f.db.Raw("SELECT COUNT(*) FROM team_members WHERE team_id=?", created.ID).Scan(&size)
	if size != 5 {
		t.Fatal(size)
	}
}
func TestConversationCannotStealSomeoneFromAnotherTeam(t *testing.T) {
	f := fresh(t)
	ctx := context.Background()
	id := f.like(t, 9001, 9002, f.a)
	_, err := team.NewRepository(f.db).Create(ctx, 9002, f.a, "Other", "OQA234")
	if err != nil {
		t.Fatal(err)
	}
	if _, err = f.repo.Decide(ctx, 9001, id, "add", "New"); !errors.Is(err, ErrOtherTeam) {
		t.Fatalf("moved existing member: %v", err)
	}
	var own int64
	f.db.Raw("SELECT COUNT(*) FROM team_members WHERE user_id=9001").Scan(&own)
	if own != 0 {
		t.Fatal("failed add left creator in an orphan team")
	}
}
func TestConversationConcurrentLikeCreatesOneRow(t *testing.T) {
	f := fresh(t)
	ctx := context.Background()
	var wg sync.WaitGroup
	results := make(chan error, 8)
	for i := 0; i < 8; i++ {
		wg.Add(1)
		go func(i int) {
			defer wg.Done()
			a, b := int64(9001), int64(9002)
			if i%2 == 1 {
				a, b = b, a
			}
			_, err := f.choices.Upsert(ctx, a, b, f.a, "like")
			results <- err
		}(i)
	}
	wg.Wait()
	close(results)
	for err := range results {
		if err != nil {
			t.Fatal(err)
		}
	}
	var count int64
	f.db.Table("chats").Count(&count)
	if count != 1 {
		t.Fatal(count)
	}
}

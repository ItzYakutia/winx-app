package message

import (
	"context"
	"errors"
	"fmt"

	repodto "winx-chat/internal/app/domain/core/dto/repositories/message"
	"winx-chat/internal/app/models/models"

	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type Repository interface {
	Create(ctx context.Context, input repodto.CreateDTO) (models.Message, error)
	ListByChatID(ctx context.Context, input repodto.ListDTO) ([]models.Message, error)
}

var ErrChatClosed = errors.New("chat is closed")

type repository struct {
	db *gorm.DB
}

func NewRepository(db *gorm.DB) Repository {
	return &repository{db: db}
}

func (r *repository) Create(ctx context.Context, input repodto.CreateDTO) (models.Message, error) {
	msg := models.Message{
		ChatID:   input.ChatID,
		SenderID: input.SenderID,
		Content:  input.Content,
	}

	if err := r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		var room models.Chat
		if err := tx.Clauses(clause.Locking{Strength: "SHARE"}).First(&room, input.ChatID).Error; err != nil {
			return err
		}
		if room.UserOneID != input.SenderID && room.UserTwoID != input.SenderID {
			return ErrChatClosed
		}
		if room.CourseID != nil {
			if room.Status == "declined" {
				return ErrChatClosed
			}
			var eligible int64
			if err := tx.Raw(`SELECT COUNT(*) FROM user_courses uc JOIN users u ON u.id=uc.user_id WHERE uc.course_id=? AND uc.user_id IN (?,?) AND u.deletion_requested_at IS NULL`, *room.CourseID, room.UserOneID, room.UserTwoID).Scan(&eligible).Error; err != nil {
				return err
			}
			if eligible != 2 {
				return ErrChatClosed
			}
		}
		return tx.Create(&msg).Error
	}); err != nil {
		return models.Message{}, fmt.Errorf("failed to create message: %w", err)
	}

	return msg, nil
}

func (r *repository) ListByChatID(ctx context.Context, input repodto.ListDTO) ([]models.Message, error) {
	var messages []models.Message

	q := r.db.WithContext(ctx).
		Where("chat_id = ?", input.ChatID).
		Order("created_at ASC")

	if input.Limit > 0 {
		q = q.Limit(input.Limit)
	}
	if input.Offset > 0 {
		q = q.Offset(input.Offset)
	}

	if err := q.Find(&messages).Error; err != nil {
		return nil, fmt.Errorf("failed to list messages: %w", err)
	}

	return messages, nil
}

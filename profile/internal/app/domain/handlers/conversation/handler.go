package conversation

import (
	"errors"
	"github.com/gin-gonic/gin"
	"net/http"
	header "winx-profile/internal/app/core/contracts/microservices/header-contract"
	"winx-profile/internal/app/core/helpers/errorhandler"
	"winx-profile/internal/app/core/helpers/response"
	"winx-profile/internal/app/core/validation"
	repo "winx-profile/internal/app/domain/repositories/conversation"
)

type Handler struct {
	repo   *repo.Repository
	binder *validation.Binder
}

func NewHandler(r *repo.Repository, b *validation.Binder) *Handler {
	return &Handler{repo: r, binder: b}
}

type listQuery struct {
	CourseID int64 `form:"course_id" validate:"required,gt=0"`
	Limit    int   `form:"limit" validate:"omitempty,gte=0,lte=100"`
	Offset   int   `form:"offset" validate:"gte=0"`
}
type detailQuery struct {
	ChatID   int64 `form:"chat_id" validate:"required,gt=0"`
	BeforeID int64 `form:"before_id" validate:"gte=0"`
}
type decisionDTO struct {
	ChatID   int64  `json:"chat_id" validate:"required,gt=0"`
	Decision string `json:"decision" validate:"required,oneof=add decline"`
	TeamName string `json:"team_name" validate:"max=50"`
}

func user(ctx *gin.Context) (int64, bool) {
	u, err := header.GetAuthUser(ctx.Request.Context())
	if err != nil {
		ctx.JSON(401, response.ErrorResponse(response.Unauthorized))
		return 0, false
	}
	return u.ID, true
}
func fail(ctx *gin.Context, err error) {
	status := http.StatusInternalServerError
	switch {
	case errors.Is(err, repo.ErrNotFound):
		status = 404
	case errors.Is(err, repo.ErrName):
		status = 422
	case errors.Is(err, repo.ErrCourse):
		status = 403
	case errors.Is(err, repo.ErrFull), errors.Is(err, repo.ErrClosed), errors.Is(err, repo.ErrConflict), errors.Is(err, repo.ErrOtherTeam):
		status = 409
	}
	message := err.Error()
	if status == 500 {
		message = response.ServerError
		errorhandler.FailOnError(err, "academic conversation")
	}
	ctx.JSON(status, response.ErrorResponse(message))
}
func (h *Handler) List(ctx *gin.Context) {
	id, ok := user(ctx)
	if !ok {
		return
	}
	q, ok := validation.BindAndValidate[listQuery](h.binder, ctx)
	if !ok {
		return
	}
	if q.Limit == 0 {
		q.Limit = 50
	}
	rows, err := h.repo.List(ctx.Request.Context(), id, q.CourseID, q.Limit, q.Offset)
	if err != nil {
		fail(ctx, err)
		return
	}
	ctx.JSON(200, response.SuccessResponse(rows, response.OK))
}
func (h *Handler) Get(ctx *gin.Context) {
	id, ok := user(ctx)
	if !ok {
		return
	}
	q, ok := validation.BindAndValidate[detailQuery](h.binder, ctx)
	if !ok {
		return
	}
	room, err := h.repo.Get(ctx.Request.Context(), id, q.ChatID)
	if err != nil {
		fail(ctx, err)
		return
	}
	ctx.JSON(200, response.SuccessResponse(room, response.OK))
}
func (h *Handler) Messages(ctx *gin.Context) {
	id, ok := user(ctx)
	if !ok {
		return
	}
	q, ok := validation.BindAndValidate[detailQuery](h.binder, ctx)
	if !ok {
		return
	}
	rows, err := h.repo.Messages(ctx.Request.Context(), id, q.ChatID, q.BeforeID)
	if err != nil {
		fail(ctx, err)
		return
	}
	ctx.JSON(200, response.SuccessResponse(rows, response.OK))
}
func (h *Handler) Decide(ctx *gin.Context) {
	id, ok := user(ctx)
	if !ok {
		return
	}
	input, ok := validation.BindAndValidate[decisionDTO](h.binder, ctx)
	if !ok {
		return
	}
	room, err := h.repo.Decide(ctx.Request.Context(), id, input.ChatID, input.Decision, input.TeamName)
	if err != nil {
		fail(ctx, err)
		return
	}
	ctx.JSON(200, response.SuccessResponse(room, response.Updated))
}

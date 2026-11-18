FROM alpine:3.23
RUN apk add --no-cache ca-certificates tzdata
WORKDIR /app
COPY --chmod=0755 bin/ /app/bin/
COPY migrations/ /app/migrations/
COPY swagger/ /app/swagger/
USER 10001:10001
ENV GIN_MODE=release GOMAXPROCS=2 AWS_EC2_METADATA_DISABLED=true

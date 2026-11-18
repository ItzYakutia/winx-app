// Build from the auth module to use its pinned pq and goose dependencies.
package main

import (
	"database/sql"
	"flag"
	"log"
	"os"

	_ "github.com/lib/pq"
	"github.com/pressly/goose/v3"
)

func main() {
	directory := flag.String("dir", "/app/migrations", "directory containing all services' SQL migrations")
	flag.Parse()
	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		log.Fatal("DATABASE_URL is required")
	}
	db, err := sql.Open("postgres", dsn)
	if err != nil {
		log.Fatal("open migration database: ", err)
	}
	defer db.Close()
	if err := db.Ping(); err != nil {
		log.Fatal("connect migration database: ", err)
	}
	if err := goose.SetDialect("postgres"); err != nil {
		log.Fatal(err)
	}
	if err := goose.Up(db, *directory); err != nil {
		log.Fatal(err)
	}
}

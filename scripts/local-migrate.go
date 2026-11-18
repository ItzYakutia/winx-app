// Run from the auth module so this tool uses its pinned goose and pq dependencies.
package main

import (
	"database/sql"
	"flag"
	"log"

	_ "github.com/lib/pq"
	"github.com/pressly/goose/v3"
)

func main() {
	directory := flag.String("dir", "", "directory containing all local SQL migrations")
	flag.Parse()
	if *directory == "" {
		log.Fatal("-dir is required")
	}
	db, err := sql.Open("postgres", "postgres://winx:winx@127.0.0.1:55432/winx-db?sslmode=disable")
	if err != nil {
		log.Fatal(err)
	}
	defer db.Close()
	if err := db.Ping(); err != nil {
		log.Fatal(err)
	}
	if err := goose.SetDialect("postgres"); err != nil {
		log.Fatal(err)
	}
	if err := goose.Up(db, *directory); err != nil {
		log.Fatal(err)
	}
}

package api

import "testing"

func TestHub_StaleDisconnectKeepsReplacement(t *testing.T) {
	hub := NewHub()
	old := &Client{userID: 1, send: make(chan []byte, 2)}
	current := &Client{userID: 1, send: make(chan []byte, 2)}
	hub.Register(old)
	hub.Register(current)
	hub.Unregister(1, old)
	hub.Send(1, []byte("still connected"))
	select {
	case got := <-current.send:
		if string(got) != "still connected" {
			t.Fatal(string(got))
		}
	default:
		t.Fatal("old disconnect removed the renewed connection")
	}
	hub.Unregister(1, current)
	if len(hub.clients) != 0 {
		t.Fatal("current connection was not removed")
	}
}

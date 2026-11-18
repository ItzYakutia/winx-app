# Deploy Winx to emilkalimullin.com

This deployment runs the current local source, including uncommitted changes. It uses
an independent Compose project `winx` in `/opt/winx` on `13.140.164.62`.
The existing Nginx Proxy Manager container `npm` serves `winx.emilkalimullin.com`.
Only the frontend joins the existing `proxy` network. Databases, Kafka and Go services
have no published host ports. `127.0.0.1:14200` provides a local frontend check.

## Build on Windows

Requires Go 1.25+, Node/npm, Python with PyYAML, and tar. Existing frontend dependencies
must be installed (`cd frontend; npm ci`). From the repository root:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/build-server.ps1
```

The script checks all Go modules, runs frontend tests, builds the production frontend
and Linux/amd64 Go executables, and creates `.local/winx-server-<release>.tar.gz`.
All SQL migrations are combined and applied in version order against the shared database.
Local databases, `.local` sessions, passwords and local config files are not packaged.

## Upload and launch

Replace `<release>` with the release printed by the build script.

```powershell
scp -i C:\Users\emilv\.ssh\id_emil .local/winx-server-<release>.tar.gz emil@13.140.164.62:winx-release.tar.gz
ssh -i C:\Users\emilv\.ssh\id_emil emil@13.140.164.62
```

On the server:

```sh
cd /opt/winx
tar -xzf ~/winx-release.tar.gz -C /opt/winx
sh start.sh <release>
```

The startup script builds lightweight runtime images from compiled artifacts, waits for
infrastructure health checks, saves a PostgreSQL backup under `backups/`, applies pending
migrations and starts the application. Existing `.env`, `config/` and Docker data volumes
are retained. Backups contain application data; keep them private and copy required
backups off the server. Database dumps do not include MongoDB, Redis or Kafka data.

`configure.py` generates a random PostgreSQL password and internal API key on first launch.
The files are owned by the SSH user with restrictive permissions. Go containers use that
user's UID/GID to read mounted configuration. Re-running deployment preserves configuration;
merge any future template changes into existing config files explicitly.

## Domain and TLS

DNS has an A record `winx` pointing to `13.140.164.62` (Cloudflare proxy is also supported).
The NPM container includes `/data/nginx/custom/winx.conf` from its existing `http.conf`.
The shared config was backed up before the include was added. The Winx host is maintained
as custom Nginx configuration, not as an NPM UI Proxy Host.

`deploy/server/winx-proxy.conf` is its source. To update it after upload:

```sh
docker cp winx-proxy.conf npm:/data/nginx/custom/winx.conf
docker exec npm nginx -t && docker exec npm nginx -s reload
```

The certificate is stored in NPM's persistent Let's Encrypt volume at
`/etc/letsencrypt/live/winx.emilkalimullin.com/`. The SSH user's crontab runs
`/opt/winx/renew-certificate.sh` daily, renewing only the Winx certificate and
reloading Nginx on renewal. Output goes to `cert-renew.log`.

## Check and operate

```sh
cd /opt/winx
docker compose -p winx -f compose.yaml ps
docker compose -p winx -f compose.yaml logs --tail=100 auth-winx api-gateway-winx
curl -I https://winx.emilkalimullin.com/
```

Social and Team modes are enabled. `/ws` is proxied over the same HTTPS origin; local
Angular development proxies it to port 3006. Empty Graylog host settings keep service
logs on stderr; Docker rotates them. Graylog, OpenSearch and monitoring are omitted.
Memory limits and short Kafka retention are configured for this shared 8 GiB server.
Monitor available RAM, swap activity and disk usage as traffic grows.

Email delivery/password reset requires real SMTP or Resend settings in
`config/notification.yaml`. Photo uploads require S3 credentials in `config/profile.yaml`.
Neither service's credentials are bundled from unrelated projects. After editing settings,
recreate only the corresponding container:

```sh
docker compose -p winx -f compose.yaml up -d --force-recreate notification-winx profile-winx
```

Do not use `down -v` for normal deployments: it removes this project's database volumes.

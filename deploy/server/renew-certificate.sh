#!/bin/sh
set -eu
docker exec npm /opt/certbot/bin/certbot renew --cert-name winx.emilkalimullin.com --quiet --deploy-hook 'nginx -t && nginx -s reload'

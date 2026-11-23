#!/usr/bin/env bash
# Upload the site to altaybatraders.com (cPanel, SFTP with the local deploy key ~/.ssh/altayba_cpanel)
# Usage: ./deploy.sh            upload site + API
#        ./deploy.sh --install  also upload the one-time installer (then run it and remove it)
set -e
cd "$(dirname "$0")"
KEY=~/.ssh/altayba_cpanel
HOST=altaybat@s23.hosterpk.com
B=$(mktemp)
{
  for d in css js images api uploads; do echo "-mkdir public_html/$d"; done
  for f in index.html checkout.html dashboard.html .htaccess; do echo "put $f public_html/$f"; done
  for f in css/* js/* images/*; do echo "put $f public_html/$f"; done
  for f in api/_lib.php api/store.php api/order.php api/admin.php api/.htaccess; do echo "put $f public_html/$f"; done
  if [ "$1" = "--install" ]; then
    for f in api/install.php api/seed.json api/install.token; do echo "put $f public_html/$f"; done
  else
    for f in install.php seed.json install.token; do echo "-rm public_html/api/$f"; done
  fi
} > "$B"
sftp -q -i "$KEY" -o IdentitiesOnly=yes -b "$B" "$HOST" | grep -v '^sftp> put' || true
rm -f "$B"
echo "Deployed to https://altaybatraders.com"

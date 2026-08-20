# Deploy pe Contabo: `new.adamo.md`

## 1. DNS temporar

În Cloudflare creează înregistrarea `A`:

| Type | Name | IPv4 | Proxy |
| --- | --- | --- | --- |
| A | new | 169.58.54.111 | DNS only |

Păstrează `adamo.md` neschimbat până la finalul testelor.

## 2. Pregătire Ubuntu

Conectează-te prin cheie SSH, apoi rulează ca `root`:

```bash
apt update
apt upgrade -y
apt install -y ca-certificates curl git ufw debian-keyring debian-archive-keyring apt-transport-https gpg
curl -1sLf https://dl.cloudsmith.io/public/caddy/stable/gpg.key | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt > /etc/apt/sources.list.d/caddy-stable.list
apt update
apt install -y caddy
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt install -y nodejs
adduser --disabled-password --gecos "" adamo
adduser --disabled-password --gecos "" deploy
usermod -aG adamo deploy
mkdir -p /srv/adamo/releases /srv/adamo/shared
chown deploy:deploy /srv/adamo/releases
chown root:adamo /srv/adamo/shared
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable
```

## 3. Codul

Construiește prima versiune într-un director separat:

```bash
release=/srv/adamo/releases/$(date +%Y%m%d%H%M%S)
sudo -u deploy git clone --depth 1 --branch main https://github.com/alexlescinschi/adamo.git "$release"
ln -sfn "$release" /srv/adamo/pending
```

Pentru repository privat, configurează înainte un GitHub deploy key read-only.

## 4. Variabilele

Creează `/srv/adamo/shared/.env.production` după `.env.example`, apoi setează:

```dotenv
NODE_ENV=production
SITE_URL=https://new.adamo.md
DEPLOY_ENV=staging
```

Completează CRM, Upstash, Sanity, Google, curierii și 999. Generează secrete diferite pentru `SYNC_999_SECRET` și `CRON_SECRET`.

```bash
chown root:adamo /srv/adamo/shared/.env.production
chmod 640 /srv/adamo/shared/.env.production
```

## 5. Build și systemd

```bash
release=$(readlink -f /srv/adamo/pending)
sudo -u deploy ln -s /srv/adamo/shared/.env.production "$release/.env.production"
sudo -u deploy npm --prefix "$release" ci
sudo -u deploy npm --prefix "$release" run build
chown -R adamo:adamo "$release/.next"
ln -sfn "$release" /srv/adamo/current
chown -h root:root /srv/adamo/current
rm /srv/adamo/pending
cp /srv/adamo/current/deploy/adamo.service /etc/systemd/system/adamo.service
systemctl daemon-reload
systemctl enable --now adamo
curl --fail http://127.0.0.1:3000/ro
```

Loguri:

```bash
journalctl -u adamo -f
```

## 6. Caddy și HTTPS

Instalează configurația:

```bash
cp /srv/adamo/current/deploy/Caddyfile /etc/caddy/Caddyfile
caddy validate --config /etc/caddy/Caddyfile
systemctl reload caddy
```

După emiterea certificatului, schimbă în Cloudflare recordul `new` la `Proxied` și setează SSL/TLS la `Full (strict)`.

După activarea proxy-ului, limitează accesul direct la origin la rețelele Cloudflare:

```bash
ufw delete allow 80/tcp
ufw delete allow 443/tcp
for ip in $(curl -fsSL https://www.cloudflare.com/ips-v4); do ufw allow from "$ip" to any port 80 proto tcp; ufw allow from "$ip" to any port 443 proto tcp; done
for ip in $(curl -fsSL https://www.cloudflare.com/ips-v6); do ufw allow from "$ip" to any port 80 proto tcp; ufw allow from "$ip" to any port 443 proto tcp; done
```

Caddy folosește aceleași intervale pentru a transmite către Next.js IP-ul real al clientului. Actualizează lista când Cloudflare își schimbă intervalele.

## 7. Configurări externe

- Google OAuth Authorized JavaScript Origins: `https://new.adamo.md`
- Sanity CORS Origins: `https://new.adamo.md`
- Iute allowlist: `https://new.adamo.md`, dacă este necesar
- Apelantul 999: `Authorization: Bearer <SYNC_999_SECRET>`

### Sincronizare 999

Workerul separat sincronizează CRM cu 999. Pentru prima verificare, setează
`N999_SYNC_ENABLED=true` și `N999_SYNC_PRODUCT_IDS=<product_id>` în
`/srv/adamo/shared/.env.production`, apoi instalează timerul:

```bash
cp /srv/adamo/current/deploy/adamo-999-sync.service /etc/systemd/system/
cp /srv/adamo/current/deploy/adamo-999-sync.timer /etc/systemd/system/
systemctl daemon-reload
systemctl enable --now adamo-999-sync.timer
systemctl start adamo-999-sync.service
```

După validarea produsului de test, golește `N999_SYNC_PRODUCT_IDS` pentru a
sincroniza toate laptopurile storefront eligibile. Verifică execuțiile cu
`journalctl -u adamo-999-sync.service`.

Înainte de testarea linkurilor din footer, rulează seed-ul Studio și publică paginile aprobate. Drafturile nu sunt expuse de storefront.

Dacă o comandă este creată cu expedierea `failed` sau `pending`, nu repeta checkoutul. Verifică order ID-ul în CRM și creează sau reconciliază AWB-ul în portalul curierului.

Comenzile Iute rămân `pending_payment`; AWB-ul se creează numai după confirmarea finanțării în CRM, nu la pregătirea cererii.

## 8. Actualizare

```bash
release=/srv/adamo/releases/$(date +%Y%m%d%H%M%S)
sudo -u deploy git clone --depth 1 --branch main https://github.com/alexlescinschi/adamo.git "$release"
sudo -u deploy ln -s /srv/adamo/shared/.env.production "$release/.env.production"
sudo -u deploy npm --prefix "$release" ci
sudo -u deploy npm --prefix "$release" run build
chown -R adamo:adamo "$release/.next"
ln -sfn "$release" /srv/adamo/current
chown -h root:root /srv/adamo/current
systemctl restart adamo
```

## 9. Rollback

Listează `/srv/adamo/releases`, mută legătura `current` la versiunea anterioară și repornește serviciul. `adamo.md` nu este afectat cât timp DNS-ul principal rămâne neschimbat.

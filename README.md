# Portfolio Terminal

Portfolio façon terminal : frontend (HTML/CSS/JS), backend FastAPI, le tout dans Docker.

## Lancer en local avec Docker

```bash
docker compose up --build
```

- Site : **http://localhost:3036**
- API : http://localhost:3036/api/health

## Exposer avec ngrok

**Oui, tu peux utiliser ngrok pour donner une URL publique à ton site** (tant que Docker tourne sur ta machine).

### Ce que fait ngrok

- Ngrok crée un **tunnel** : une URL publique (ex. `https://abc123.ngrok-free.app`) redirige vers un service sur ta machine (ici le port 3036).
- **Gratuit** : tu obtiens un sous-domaine aléatoire type `xxxx.ngrok-free.app` (ou `.ngrok.io` selon la version). L’URL change à chaque démarrage de ngrok sauf si tu réserves un domaine.
- **Nom de domaine “fixe”** : avec un compte ngrok (gratuit), tu peux réserver un sous-domaine fixe (ex. `emile.ngrok-free.app`). Les vrais noms de domaine perso (ex. `emile.dev`) sur ngrok sont en général sur formules payantes.

### Étapes

1. Installer ngrok : https://ngrok.com/download (ou `snap install ngrok` / selon ton OS).
2. Lancer le portfolio : `docker compose up --build`.
3. Dans un autre terminal :
   ```bash
   ngrok http 3036
   ```
4. Ngrok affiche une URL du type `https://xxxx-xx-xx-xx-xx.ngrok-free.app` → c’est ton “nom de domaine” temporaire pour le site. Ouvre-la dans un navigateur.

Pour un sous-domaine fixe (gratuit) : crée un compte sur ngrok.com, réserve un domaine dans le dashboard, puis lance avec :

```bash
ngrok http 3036 --domain=ton-subdomain.ngrok-free.app
```

### Domaine réservé (ex. emile-portfolio.ngrok.io)

1. Une fois le domaine créé sur le dashboard ngrok, configure le token une seule fois (si pas déjà fait) :
   ```bash
   ngrok config add-authtoken TON_TOKEN
   ```
   (Token : https://dashboard.ngrok.com/get-started/your-authtoken)

2. Portfolio lancé (`docker compose up -d`), dans un autre terminal :
   ```bash
   ngrok http 3036 --domain=emile-portfolio.ngrok.io
   ```

3. Ouvre **https://emile-portfolio.ngrok.io** dans le navigateur.

## Structure

- `frontend/` : HTML, CSS, JS (terminal interactif), servi par nginx.
- `backend/` : FastAPI (health, contact).
- `docker-compose.yml` : frontend (port 3036 sur l’hôte) + backend (réseau interne) ; nginx proxy `/api/` vers le backend.

## Commandes du terminal

- `help` / `?` : liste des commandes
- `about`, `projects`, `skills`, `contact`, `clear`, `theme`, `exit`
- `history`, `ls`, `cat <fichier>`, `sudo`
- Alias : `a`, `p`, `h`, `c`, `s`, `cl`, `t`, `e`

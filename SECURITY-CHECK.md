# Vérification projet Portfolio — rapport

*Généré après revue manuelle du dépôt.*

---

## 1. Sécurité

### 1.1 Secrets et fichiers sensibles

| Élément | Statut |
|--------|--------|
| `.env` dans `.gitignore` | OK — pas commité |
| Aucun fichier `.env` dans le repo | OK |
| Pas de clés API / mots de passe en dur dans le code | OK |
| `.dockerignore` backend exclut `.env`, `*.pyc`, `.venv` | OK |

### 1.2 Exposition des services

| Élément | Statut |
|--------|--------|
| Backend (FastAPI) exposé sur l’hôte | OK — non exposé, uniquement via nginx en interne Docker |
| Frontend (nginx) sur port 3036 | OK — cohérent avec le README et ngrok |
| Proxy nginx → backend sur `backend:8000` | OK |

### 1.3 CORS (backend)

- **Actuel :** `allow_origins=["*"]` avec `allow_credentials=True`.
- **Risque :** En production, un site tiers pourrait faire des requêtes authentifiées vers ton API. Les navigateurs peuvent par ailleurs restreindre ce couple.
- **Recommandation :** En production, remplacer par une liste d’origines explicites, par exemple :
  ```python
  allow_origins=[
      "https://emile-portfolio.ngrok.io",
      "http://localhost:3036",
  ]
  ```
  (à adapter selon tes domaines réels).

### 1.4 Endpoint `/api/contact`

- Pas d’envoi d’email réel pour l’instant (simulation).
- **Recommandation :** Quand tu brancheras un vrai envoi (SMTP, SendGrid, etc.) :
  - Ne jamais mettre les identifiants SMTP / clés API dans le code : utiliser des variables d’environnement (lues par exemple avec `pydantic-settings`).
  - Ajouter un **rate limiting** (ex. 5 requêtes / minute / IP) pour limiter le spam et les abus.

### 1.5 XSS (frontend)

- Utilisation de `innerHTML` uniquement dans :
  - `runContact()` : HTML **en dur** (liens email, GitHub, LinkedIn) → pas d’injection.
  - `appendBlock(..., className)` : quand le 1er argument est une **chaîne**, le code utilise `textContent` → contenu échappé.
- Les entrées utilisateur (commandes, arguments) sont affichées via `textContent` ou des chaînes passées à `appendBlock` → **pas de XSS identifié**.
- **Recommandation :** Si plus tard tu affiches du HTML dynamique (ex. contenu venant de l’API), utiliser une sanitization (ex. lib dédiée) ou rester en `textContent` pour tout ce qui est utilisateur.

### 1.6 Dépendances

- `backend/requirements.txt` : versions fixées → reproductibilité et revue des mises à jour plus simples.
- **Recommandation :** Garder l’habitude de mettre à jour (ex. `pip list --outdated`, Dependabot si GitHub) pour corriger les CVE connues.

---

## 2. Structure et bonnes pratiques

| Élément | Statut |
|--------|--------|
| Séparation frontend / backend / Docker | OK |
| Backend uniquement sur réseau Docker | OK |
| Pas de `__pycache__` / `.venv` commités | OK (`.gitignore` + `.dockerignore`) |
| README à jour (Docker, ngrok, commandes) | OK |

---

## 3. Correctif appliqué pendant la revue

- **Lien « GitHub » dans la commande `contact` :** le libellé disait « GitHub » mais le lien pointait vers LinkedIn. Corrigé pour pointer vers `https://github.com/MrScrupulus` avec le bon libellé.

---

## 4. Résumé

- Aucun secret ni fichier sensible exposé dans le dépôt.
- Architecture Docker et exposition des ports cohérentes.
- CORS et rate limiting sur `/api/contact` à durcir dès que tu passes en « vraie » prod / formulaire actif.
- Pas de vulnérabilité XSS identifiée dans l’usage actuel du frontend.

Le projet est en bon état pour un portfolio ; les points listés ci‑dessus sont des renforcements recommandés pour la suite.

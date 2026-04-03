(function () {
  "use strict";

  const API_BASE = "/api";

  function getPrompt() {
    return "emile-portfolio@localhost:~$";
  }
  const THEMES = ["matrix", "amber", "blue"];
  const ALIASES = {
    a: "about",
    p: "projects",
    portfolio: "portfolio-terminal",
    h: "help",
    c: "contact",
    s: "skills",
    cv: "skills",
    "cv&skills": "skills",
    "cv-skills": "skills",
    cl: "clear",
    t: "theme",
    e: "exit",
    "?": "help",
  };

  const PROJECTS = [
    { name: "portfolio-terminal", desc: "Ce site (terminal en JS)" },
    { name: "stf", desc: "Écosystème web & mobile pour compétitions de pêche urbaine (inscriptions, scoring, photo+GPS, validation)." },
    { name: "autre-projet", desc: "Page en cours de développement" },
  ];

  const COMMANDS = {
    help: { args: "", desc: "Afficher cette aide" },
    about: { args: "", desc: "Qui je suis" },
    projects: { args: "[nom]", desc: "Liste des projets (ex: projects stf)" },
    skills: { args: "", desc: "" },
    contact: { args: "", desc: "Me contacter" },
    clear: { args: "", desc: "Nettoyer l'écran" },
    theme: { args: "[matrix|amber|blue]", desc: "Changer le thème (matrix, amber, blue)" },
    exit: { args: "", desc: "Fermer le terminal" },
    history: { args: "", desc: "Historique des commandes" },
    ls: { args: "", desc: "Lister les répertoires" },
    cat: { args: "<fichier>", desc: "Afficher un projet" },
    sudo: { args: "", desc: "(humour)" },
  };

  const LS_ITEMS = ["about", "projects", "skills", "contact", "README.txt"];

  const BOOT_LINES = [
    "Portfolio Terminal v1.0",
    "",
    "Bienvenue sur le Portfolio de Emile Deballon",
    "Appréciez mon profil par une expérience immersive dans ce terminal simulé.",
    "",
    "Tapez 'help' ou '?' pour afficher les commandes",
    "ou cliquez sur les commandes désirées.",
    "",
  ];

  let history = [];
  let historyIndex = -1;
  let themeIndex = 0;

  const el = {
    boot: document.getElementById("boot-output"),
    output: document.getElementById("output"),
    history: document.getElementById("history"),
    inputArea: document.getElementById("input-area"),
    inputWrapper: document.getElementById("input-wrapper"),
  };

  function getInputValue() {
    return (el.inputArea && el.inputArea.textContent) ? el.inputArea.textContent.trim() : "";
  }

  function setInputValue(val) {
    if (!el.inputArea) return;
    el.inputArea.textContent = val || "";
    placeCaretAtEnd(el.inputArea);
    requestAnimationFrame(updateCursor);
  }

  function placeCaretAtEnd(node) {
    if (!node) return;
    var range = document.createRange();
    var sel = window.getSelection();
    range.selectNodeContents(node);
    range.collapse(false);
    sel.removeAllRanges();
    sel.addRange(range);
  }

  function updateCursor() {
    if (!el.inputArea || !el.inputWrapper) return;
    var wrapperRect = el.inputWrapper.getBoundingClientRect();
    var areaRect = el.inputArea.getBoundingClientRect();
    var x = 0, y = 0;
    var isEmpty = !el.inputArea.textContent || el.inputArea.textContent.length === 0;
    if (isEmpty) {
      x = areaRect.left - wrapperRect.left;
      y = areaRect.top - wrapperRect.top;
    } else {
      var sel = window.getSelection();
      if (sel.rangeCount) {
        var range = sel.getRangeAt(0);
        if (el.inputArea.contains(range.startContainer)) {
          var rangeClone = range.cloneRange();
          rangeClone.collapse(true);
          var rect = rangeClone.getBoundingClientRect();
          if (rect.width > 0 || rect.height > 0) {
            x = rect.left - wrapperRect.left;
            y = rect.top - wrapperRect.top;
          } else {
            x = areaRect.left - wrapperRect.left;
            y = areaRect.top - wrapperRect.top;
          }
        }
      }
    }
    el.inputWrapper.style.setProperty("--cursor-x", x + "px");
    el.inputWrapper.style.setProperty("--cursor-y", y + "px");
  }

  function promptSpan() {
    const s = document.createElement("span");
    s.className = "prompt";
    s.textContent = getPrompt() + " ";
    return s;
  }

  function appendLine(cmd, isCommand = true) {
    const wrap = document.createElement("div");
    wrap.className = "line";
    wrap.appendChild(promptSpan());
    const text = document.createElement("span");
    text.className = isCommand ? "cmd-entered" : "output-block";
    text.textContent = cmd;
    wrap.appendChild(text);
    el.history.appendChild(wrap);
    return wrap;
  }

  function appendBlock(htmlOrText, className = "output-block") {
    const wrap = document.createElement("div");
    wrap.className = className;
    if (typeof htmlOrText === "string") {
      wrap.textContent = htmlOrText;
    } else {
      wrap.innerHTML = htmlOrText;
    }
    el.history.appendChild(wrap);
    return wrap;
  }

  function appendGuide() {
    const wrap = document.createElement("div");
    wrap.className = "output-block hint";

    const line = document.createElement("div");
    line.className = "help-line";

    const t1 = document.createTextNode("Tapez ");
    line.appendChild(t1);

    const help = document.createElement("span");
    help.className = "help-link";
    help.dataset.cmd = "help";
    help.textContent = "help";
    line.appendChild(help);

    line.appendChild(document.createTextNode(" ou "));

    const q = document.createElement("span");
    q.className = "help-link";
    q.dataset.cmd = "?";
    q.textContent = "?";
    line.appendChild(q);

    line.appendChild(document.createTextNode(" pour afficher les commandes. "));

    const t2 = document.createTextNode("Ou ");
    line.appendChild(t2);

    const projects = document.createElement("span");
    projects.className = "help-link";
    projects.dataset.cmd = "projects";
    projects.textContent = "projects";
    line.appendChild(projects);

    line.appendChild(document.createTextNode(" / "));

    const contact = document.createElement("span");
    contact.className = "help-link";
    contact.dataset.cmd = "contact";
    contact.textContent = "contact";
    line.appendChild(contact);

    line.appendChild(document.createTextNode("."));

    wrap.appendChild(line);
    el.history.appendChild(wrap);
  }

  function scrollBottom() {
    const container = el.output || document.scrollingElement || document.documentElement;
    try {
      container.scrollTop = container.scrollHeight;
    } catch (_) {
      window.scrollTo(0, document.body.scrollHeight);
    }
  }

  function runBoot() {
    const fragment = document.createDocumentFragment();
    BOOT_LINES.forEach((line) => {
      const div = document.createElement("div");
      if (line.includes("'help'") && line.includes("'?'")) {
        // Rendre "Tapez 'help' ou '?' ..." cliquable en conservant le texte exact
        const before = line.split("'help'")[0] + "'"; // inclut le premier '
        const afterHelp = line.split("'help'")[1] || "";
        const middle = (afterHelp.split("'?'")[0] || "") + "'"; // inclut le '
        const after = (afterHelp.split("'?'")[1] || "");

        div.appendChild(document.createTextNode(before));

        const help = document.createElement("span");
        help.className = "help-link";
        help.dataset.cmd = "help";
        help.textContent = "help";
        div.appendChild(help);

        div.appendChild(document.createTextNode(middle));

        const q = document.createElement("span");
        q.className = "help-link";
        q.dataset.cmd = "?";
        q.textContent = "?";
        div.appendChild(q);

        div.appendChild(document.createTextNode(after));
      } else {
        // Une ligne vide n'a pas de hauteur : on force un espace insécable
        div.textContent = (line === "") ? "\u00A0" : line;
        if (line.trim().toLowerCase() === "ou cliquez sur les commandes désirées.") {
          div.classList.add("boot-hint");
        }
      }
      div.id = "line-boot";
      fragment.appendChild(div);

      if (line.includes("'help'") && line.includes("'?'")) {
        const tip = document.createElement("div");
        tip.className = "boot-tip";
        tip.textContent = "Astuce : touchez une commande pour l’exécuter.";
        fragment.appendChild(tip);
      }
    });
    el.boot.appendChild(fragment);
    scrollBottom();
  }

  function runHelp() {
    const wrap = document.createElement("div");
    wrap.className = "output-block help-output";

    const title = document.createElement("div");
    title.className = "help-title";
    title.textContent = "Commandes disponibles";
    wrap.appendChild(title);

    const list = document.createElement("div");
    list.className = "help-list";

    Object.entries(COMMANDS).forEach(([name, { args, desc }]) => {
      const item = document.createElement("div");
      item.className = "help-item";

      const line = document.createElement("div");
      line.className = "help-line";

      const cmd = document.createElement("span");
      cmd.className = "help-link";
      const displayCmd = `${name}${args ? " " + args : ""}`.trim();
      const execCmd = (args && args.includes("[") && args.includes("]")) ? name : displayCmd;
      cmd.dataset.cmd = execCmd;
      cmd.textContent = `${name}${args ? " " + args : ""}`.trim();
      line.appendChild(cmd);

      item.appendChild(line);

      const subText =
        name === "skills"
          ? "CV & skills"
          : ((desc && String(desc).trim()) ? desc : "");
      if (subText) {
        const sub = document.createElement("div");
        sub.className = "help-sub";
        sub.textContent = subText;
        item.appendChild(sub);
      }

      list.appendChild(item);
    });

    wrap.appendChild(list);

    const alias = document.createElement("div");
    alias.className = "help-alias";
    alias.textContent = "Alias: a=about, p=projects, h=help, c=contact, s=skills, cv=skills, portfolio=portfolio-terminal";
    wrap.appendChild(alias);

    const tip = document.createElement("div");
    tip.className = "help-tip";
    tip.textContent = "Astuce : touchez une commande pour l’exécuter.";
    wrap.appendChild(tip);

    el.history.appendChild(wrap);
  }

  function runAbout() {
    const text = `
  Emile Deballon — Développeur

  Avant de me diriger vers le développement et la data, j’ai travaillé comme consultant en fiscalité puis comme croupier poker. Ces expériences m’ont appris à analyser rapidement des situations complexes, à garder mon calme et à développer un vrai sens des relations humaines.

J’ai obtenu les titres professionnels Développeur Web & Web Mobile et Concepteur Développeur d’Applications.
Je poursuis aujourd’hui mon parcours avec un Master Expert IA & Data Science à l’EPSI de Lille. 

Je suis à la recherche d’une alternance (rythme 2 semaines entreprise / 1 semaine école).

J’aime concevoir des systèmes fiables, propres et cohérents. J’ai déployé mon propre serveur Linux pour disposer d’un environnement de travail maîtrisé, et je progresse en autonomie sur Python et les fondamentaux de la data. Je travaille sur plusieurs projets professionnels, dont une application complète de gestion de compétitions de pêche mêlant API Symfony, Next.js et React Native.

En dehors du code, je cultive deux passions : l’observation astronomique et les plantes. Elles m’apprennent la patience, la précision et l’attention aux détails — des qualités que je retrouve dans mon travail de développeur.

Mon mantra, attribué à Oscar Wilde, guide ma progression :
« Je vise la lune, et même si je manque ma trajectoire, je retombe parmi les étoiles. »

Comme une plante qui perce la terre, je pousse, je persiste, je m’élève — lentement, sûrement, inarrêtable.


  Tapez 'projects' pour voir ce que je fais.
  Tapez 'contact' pour me joindre.
`.trim();
    appendBlock(text);
    appendGuide();
  }

  function runProjects(detail) {
    if (!detail) {
      const wrap = document.createElement("div");
      wrap.className = "output-block project-output";

      const title = document.createElement("div");
      title.className = "help-title";
      title.textContent = "Projets";
      wrap.appendChild(title);

      const list = document.createElement("div");
      list.className = "help-list";

      PROJECTS.forEach((p) => {
        const item = document.createElement("div");
        item.className = "help-item";

        const line = document.createElement("div");
        line.className = "help-line";

        const name = document.createElement("span");
        name.className = "help-link";
        name.dataset.cmd = p.name === "portfolio-terminal" ? "portfolio" : p.name;
        name.textContent = p.name === "portfolio-terminal" ? "portfolio" : p.name;
        line.appendChild(name);

        item.appendChild(line);

        const sub = document.createElement("div");
        sub.className = "help-sub";
        sub.textContent = p.desc;
        item.appendChild(sub);

        list.appendChild(item);
      });

      wrap.appendChild(list);
      el.history.appendChild(wrap);
      appendGuide();
      return;
    }
    const proj = PROJECTS.find((p) => p.name.toLowerCase() === detail.toLowerCase());
    if (proj) {
      if (proj.name.toLowerCase() === "stf") {
        runProjectSTF();
        return;
      }
      if (proj.name.toLowerCase() === "portfolio-terminal") {
        runProjectPortfolioTerminal();
        return;
      }
      appendBlock(`\n  ${proj.name}\n  ${proj.desc}\n\n  (Contenu à personnaliser.)\n`);
      appendGuide();
    } else {
      appendBlock(`cat: ${detail}: fichier ou projet inconnu.`, "output-block error");
      appendBlock("Essayez: projects", "output-block hint");
    }
  }

  function runProjectPortfolioTerminal() {
    const short = "Portfolio Terminal — site personnel présenté comme un terminal interactif : commandes, thèmes, historique et affichage des projets.";
    const stack = "Stack : HTML/CSS/JavaScript (frontend nginx), API FastAPI (backend) via Docker Compose, exposition possible via ngrok.";

    const html = `
<div class="project">
  <div class="project-card">
    <div class="project-title">Portfolio Terminal</div>
    <div class="project-lead">${short}</div>
    <div class="project-stack">${stack}</div>
    <div class="project-tags">
      <span class="tag">HTML</span>
      <span class="tag">CSS</span>
      <span class="tag">JavaScript</span>
      <span class="tag">nginx</span>
      <span class="tag">FastAPI</span>
      <span class="tag">Docker</span>
      <span class="tag">Docker Compose</span>
      <span class="tag">ngrok</span>
    </div>
  </div>

  <div class="project-section">
    <div class="project-h">Contexte</div>
    <div class="project-p">
      L’objectif est de présenter mon portfolio de façon mémorable : un terminal “jouable” qui guide la navigation via des commandes simples
      (<span class="label">help</span>, <span class="label">projects</span>, <span class="label">skills</span>…).
    </div>
  </div>

  <div class="project-section">
    <div class="project-h">Fonctionnalités</div>
    <ul class="project-list">
      <li>Terminal interactif : historique, autocomplétion, thèmes</li>
      <li>Affichage des projets en cartes + pages détaillées</li>
      <li>Assets servis par nginx (QR code, CV PDF)</li>
      <li>Backend minimal (health/contact) pour extension future</li>
    </ul>
  </div>

  <div class="project-section">
    <div class="project-h">Code</div>
    <div class="project-p">
      GitHub : <a href="https://github.com/MrScrupulus/portfolio" target="_blank" rel="noopener">github.com/MrScrupulus/portfolio</a>
    </div>
  </div>
</div>
`;
    const block = appendBlock("", "output-block project-output");
    block.innerHTML = html;
    appendGuide();
  }

  function runProjectSTF() {
    const short =
      "STF (Street Fishing) — Écosystème web & mobile pour la gestion complète de compétitions de pêche urbaine : inscriptions, scoring automatisé, déclaration de prises (photo + GPS), périmètres géographiques, workflow de validation et outils organisateurs.";
    const stack =
      "Stack : API Symfony (PHP), MariaDB, Next.js (dashboard), React Native / Expo (terrain), Docker, tests de charge k6.";

    const html = `
<div class="project">
  <div class="project-card">
    <div class="project-title">STF (Street Fishing)</div>
    <div class="project-lead">${short}</div>
    <div class="project-stack">${stack}</div>
    <div class="project-tags">
      <span class="tag">Symfony</span>
      <span class="tag">API REST</span>
      <span class="tag">Doctrine</span>
      <span class="tag">MariaDB</span>
      <span class="tag">Next.js</span>
      <span class="tag">React</span>
      <span class="tag">React Query</span>
      <span class="tag">React Native</span>
      <span class="tag">Expo</span>
      <span class="tag">Docker</span>
      <span class="tag">JWT</span>
      <span class="tag">Géolocalisation</span>
      <span class="tag">Upload</span>
      <span class="tag">k6</span>
    </div>
  </div>

  <div class="project-section">
    <div class="project-h">Contexte</div>
    <div class="project-p">
      STF est un écosystème applicatif modulaire conçu pour orchestrer l’ensemble du cycle d’une compétition : gestion des entités métier (équipes, espèces, règles, périmètres), collecte terrain des données (photos, GPS), scoring automatisé et validation par le staff.
      L’architecture repose sur une API REST centralisée, un dashboard web pour l’organisation et une application mobile optimisée pour les conditions réelles.
    </div>
  </div>

  <div class="project-section">
    <div class="project-h">Côté participants (mobile)</div>
    <ul class="project-list">
      <li>Authentification sécurisée (JWT)</li>
      <li>Consultation des compétitions, équipes et règles</li>
      <li>Déclaration de prises avec upload photo, géolocalisation et contrôles côté client</li>
      <li>Vérification automatique du respect des zones autorisées (matching GPS / polygones)</li>
      <li>Historique personnel, profil, suivi des prises</li>
      <li>Parcours administrateur pour la validation des prises en attente</li>
    </ul>
    <div class="project-note">Application développée en React Native / Expo, avec gestion fine des permissions, du cache et des formulaires dynamiques.</div>
  </div>

  <div class="project-section">
    <div class="project-h">Côté organisation (web)</div>
    <ul class="project-list">
      <li>Configuration complète des compétitions : calendrier, espèces, quotas, bonus, périmètres cartographiques</li>
      <li>Gestion des équipes, participants et déclarations</li>
      <li>Tableaux de bord (statistiques, heatmaps, scoring)</li>
      <li>Outils d’administration (validation, corrections, exports)</li>
    </ul>
    <div class="project-note">Dashboard développé en Next.js, avec rendu hybride (SSR/CSR), React Query et composants UI optimisés.</div>
  </div>

  <div class="project-section">
    <div class="project-h">Backend & architecture</div>
    <ul class="project-list">
      <li>API REST Symfony (architecture modulaire, services, DTO, validation serveur)</li>
      <li>Persistance via Doctrine / MariaDB (relations, indexation, optimisations de requêtes)</li>
      <li>Stockage structuré des médias (photos) sur disque : /uploads/{year}/{month}/{competition}/</li>
      <li>Authentification JWT, gestion des rôles (participant / staff / jury)</li>
      <li>Environnement Docker Compose (API, DB, volumes, reverse proxy optionnel)</li>
    </ul>
    <div class="project-note">Architecture pensée pour être reproductible, portable et maintenable.</div>
  </div>

  <div class="project-section">
    <div class="project-h">Qualité & performance</div>
    <div class="project-p">Tests de charge réalisés avec k6 sur les parcours critiques :</div>
    <ul class="project-list">
      <li>consultation des compétitions</li>
      <li>création de prises (upload + GPS)</li>
      <li>statistiques</li>
    </ul>
    <div class="project-note">Scénarios smoke + endurance, monitoring des temps de réponse, taux d’erreur nul sur les seuils définis.</div>
  </div>

  <div class="project-section">
    <div class="project-h">Positionnement honnête</div>
    <div class="project-p">
      La géolocalisation est utilisée comme aide au respect du règlement, mais ne constitue pas une preuve absolue (variabilité GPS côté client).
      L’outil structure les données, fluidifie le travail du staff et améliore la transparence, mais ne remplace pas l’arbitrage humain.
    </div>
  </div>

  <div class="project-section">
    <div class="project-h">Améliorations futures (IA)</div>
    <div class="project-p">Étude d’un module de ré-identification visuelle des brochets via Deep Learning.</div>
    <div class="project-p">Approche envisagée :</div>
    <ul class="project-list">
      <li>extraction d’embeddings (signatures vectorielles) depuis les photos via un modèle pré-entraîné (MobileNet / EfficientNet)</li>
      <li>matching par similarité (cosine / euclidienne) pour détecter les individus déjà observés</li>
      <li>analyse spatio-temporelle des observations (GPS + date) pour étudier déplacements, territoires et comportements</li>
    </ul>
    <div class="project-p">
      Ce module pourrait servir à la fois à la détection de doublons et à des usages scientifiques (traçabilité, migration, recaptures).
    </div>
    <div class="project-note">
      Les photos étant prises sur une toise, flanc visible, un recadrage automatique et un contrôle qualité sont envisageables. La validation finale reste humaine.
    </div>
  </div>

  <div class="project-section">
    <div class="project-h">Démo mobile (Expo)</div>
    <div class="qr-wrap">
      <img class="qr" src="/assets/stf-expo-qr.png" alt="QR code STF (Expo)" loading="lazy" />
      <div class="qr-caption">
        Pour tester : installe l’application <strong>Expo Go</strong> sur ton téléphone, puis scanne le QR code.
      </div>
    </div>
  </div>
</div>
`;
    const block = appendBlock("", "output-block project-output");
    block.innerHTML = html;
    appendGuide();
  }

  function runSkills() {
    const html = `
<div class="project">
  <div class="project-card">
    <div class="project-title">CV & skills</div>
    <div class="project-lead">Télécharge mon CV et retrouve un aperçu rapide de mes compétences.</div>
    <div class="project-tags">
      <span class="tag">Python</span>
      <span class="tag">JavaScript</span>
      <span class="tag">FastAPI</span>
      <span class="tag">Docker</span>
      <span class="tag">Git</span>
      <span class="tag">Web</span>
      <span class="tag">Data / IA</span>
    </div>
  </div>

  <div class="project-section">
    <div class="project-h">CV</div>
    <div class="cv-preview-wrap">
      <iframe class="cv-preview" src="/assets/cv-emile-deballon.pdf#page=1&view=FitH" title="Aperçu du CV" loading="lazy"></iframe>
    </div>
    <div class="project-p">
      <a class="cv-download" href="/assets/cv-emile-deballon.pdf" target="_blank" rel="noopener" download>Télécharger le CV (PDF)</a>
    </div>
  </div>

  <div class="project-section">
    <div class="project-h">Compétences </div>
    <ul class="project-list">
      <li>Backend : FastAPI, API REST</li>
      <li>Frontend : HTML/CSS/JS</li>
      <li>DevOps : Docker, nginx, Docker Compose</li>
      <li>Data/IA : notions ML (en consolidation)</li>
    </ul>
    
  </div>
</div>
`;
    const block = appendBlock("", "output-block project-output");
    block.innerHTML = html;
    appendGuide();
  }

  function runContact() {
    const html = `
  Email : <a href="mailto:emile.deballon@gmail.com">emile.deballon@gmail.com</a><br>
  GitHub : <a href="https://github.com/MrScrupulus" target="_blank" rel="noopener">github.com/MrScrupulus</a><br>
  LinkedIn : <a href="https://www.linkedin.com/in/emile-deballon-738a432b4/" target="_blank" rel="noopener">linkedin.com/in/emile</a>
`;
    const block = appendBlock("", "output-block");
    block.innerHTML = html;
    appendGuide();
  }

  function runClear() {
    el.history.innerHTML = "";
  }

  function runTheme(arg) {
    var name = (arg || "").trim().toLowerCase();
    if (name) {
      var idx = THEMES.indexOf(name);
      if (idx !== -1) {
        themeIndex = idx;
        document.documentElement.setAttribute("data-theme", THEMES[themeIndex]);
        appendBlock("Thème: " + THEMES[themeIndex] + ".");
        return;
      }
    }
    themeIndex = (themeIndex + 1) % THEMES.length;
    document.documentElement.setAttribute("data-theme", THEMES[themeIndex] || "");
    appendBlock("Thème: " + THEMES[themeIndex] + ". Ou tapez 'theme matrix', 'theme amber', 'theme blue'.");
  }

  function runExit() {
    appendBlock("Fermez l'onglet pour quitter. Sinon, tapez une commande.");
  }

  function runHistory() {
    if (history.length === 0) {
      appendBlock("Aucune commande dans l'historique.");
      return;
    }
    appendBlock(history.map((c, i) => `  ${i + 1}  ${c}`).join("\n"));
  }

  function runLs() {
    appendBlock("  " + LS_ITEMS.join("\n  "));
  }

  function runCat(arg) {
    if (!arg || !arg.trim()) {
      appendBlock("Usage: cat <fichier>", "output-block error");
      appendBlock("Ex: cat about, cat projects", "output-block hint");
      return;
    }
    const name = arg.trim().toLowerCase();
    if (["about", "contact", "skills"].includes(name)) {
      if (name === "about") runAbout();
      else if (name === "contact") runContact();
      else if (name === "skills") runSkills();
      return;
    }
    if (name === "projects" || name === "README.txt") {
      runProjects();
      return;
    }
    runProjects(name);
  }

  function runSudo() {
    appendBlock("Permission denied. (Ce terminal n'a pas besoin de sudo.)", "output-block error");
  }

  function suggestUnknown(cmd) {
    const lower = cmd.trim().toLowerCase();
    const known = Object.keys(COMMANDS);
    const aliasKeys = Object.keys(ALIASES);
    const all = [...known, ...aliasKeys];
    const close = all.find((k) => k.startsWith(lower) || lower.startsWith(k));
    if (close) {
      const resolved = ALIASES[close] || close;
      appendBlock(`Commande inconnue. Vouliez-vous '${resolved}' ? Tapez 'help' pour la liste.`, "output-block hint");
    } else {
      appendBlock("Commande inconnue. Tapez 'help' ou '?' pour la liste des commandes.", "output-block hint");
    }
  }

  function normalizeCmd(raw) {
    const t = raw.trim().toLowerCase();
    return ALIASES[t] || t;
  }

  function execute(input) {
    const trimmed = (input || "").trim();
    if (!trimmed) return;

    history.push(trimmed);
    historyIndex = history.length;

    const parts = trimmed.split(/\s+/);
    const cmd = normalizeCmd(parts[0]);
    const arg = parts.slice(1).join(" ");

    switch (cmd) {
      case "help":
      case "?":
        runHelp();
        break;
      case "about":
        runAbout();
        break;
      case "projects":
        runProjects(arg || null);
        break;
      case "skills":
        runSkills();
        break;
      case "contact":
        runContact();
        break;
      case "clear":
        runClear();
        break;
      case "theme":
        runTheme(arg);
        break;
      case "exit":
        runExit();
        break;
      case "history":
        runHistory();
        break;
      case "ls":
        runLs();
        break;
      case "cat":
        runCat(arg);
        break;
      case "sudo":
        runSudo();
        break;
      default:
        if (PROJECTS.some((p) => p.name.toLowerCase() === cmd)) {
          runProjects(cmd);
          break;
        }
        suggestUnknown(trimmed);
    }

    scrollBottom();
  }


  function commitLineAndRun(val) {
    var cmd = (val || "").trim();
    if (!cmd) return;
    var lineWrap = document.createElement("div");
    lineWrap.className = "line";
    lineWrap.appendChild(promptSpan());
    var cmdSpan = document.createElement("span");
    cmdSpan.className = "cmd-entered";
    cmdSpan.textContent = cmd;
    lineWrap.appendChild(cmdSpan);
    el.history.appendChild(lineWrap);
    execute(val);
    setInputValue("");
    el.inputArea.focus();
  }

  function handleKey(e) {
    if (e.key === "Enter") {
      e.preventDefault();
      commitLineAndRun(getInputValue());
    } else if (e.key === "Tab") {
      e.preventDefault();
      autocomplete();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (historyIndex > 0) {
        historyIndex--;
        setInputValue(history[historyIndex]);
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (historyIndex < history.length - 1) {
        historyIndex++;
        setInputValue(history[historyIndex]);
      } else if (historyIndex === history.length - 1) {
        historyIndex = history.length;
        setInputValue("");
      }
    }
  }

  function autocomplete() {
    var val = getInputValue().toLowerCase();
    if (!val) {
      setInputValue("help");
      return;
    }
    var parts = val.split(/\s+/);
    var first = parts[0];
    var all = [].concat(Object.keys(COMMANDS), Object.keys(ALIASES));
    var matches = all.filter(function (k) { return k.startsWith(first); });
    if (matches.length === 1) {
      parts[0] = matches[0];
      setInputValue(parts.join(" "));
    } else if (matches.length > 1) {
      var common = matches.reduce(function (a, b) {
        var i = 0;
        while (a[i] === b[i]) i++;
        return a.slice(0, i);
      }, matches[0]);
      if (common === first) {
        appendBlock("  " + matches.join("  "), "output-block hint");
      } else {
        setInputValue(common + (parts.length > 1 ? " " + parts.slice(1).join(" ") : ""));
      }
    }
  }

  function init() {
    document.documentElement.setAttribute("data-theme", THEMES[themeIndex] || "matrix");
    var initialPromptEl = document.getElementById("initial-prompt");
    if (initialPromptEl) initialPromptEl.textContent = getPrompt() + " ";
    var loader = document.getElementById("loader");
    var loaderPercent = loader ? loader.querySelector(".loader-percent") : null;
    if (loader) {
      var start = Date.now();
      var duration = 1000;
      var tick = function () {
        var elapsed = Date.now() - start;
        if (loaderPercent) loaderPercent.textContent = Math.min(100, Math.floor((elapsed / duration) * 100)) + "%";
        if (elapsed < duration) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
      setTimeout(function () {
        if (loaderPercent) loaderPercent.textContent = "100%";
        loader.classList.add("loaded");
        setTimeout(function () {
          loader.remove();
        }, 280);
      }, 1200);
    }
    runBoot();

    // Rendre tous les .help-link cliquables partout (boot, help, guide, projets...)
    document.addEventListener("click", function (e) {
      const link = e.target && e.target.closest ? e.target.closest(".help-link") : null;
      if (!link) return;
      // évite d'intercepter des liens/éléments interactifs
      if (link.closest("a") || link.closest("button")) return;
      const cmd = (link.dataset && link.dataset.cmd) ? link.dataset.cmd : (link.textContent || "").trim();
      if (!cmd) return;
      e.preventDefault();
      e.stopPropagation();
      commitLineAndRun(cmd);
      requestAnimationFrame(scrollBottom);
    });

    if (el.inputArea) {
      el.inputArea.addEventListener("keydown", function (e) {
        handleKey(e);
        updateCursor();
      });
      el.inputArea.addEventListener("input", updateCursor);
      el.inputArea.addEventListener("keyup", updateCursor);
      el.inputArea.addEventListener("click", updateCursor);
      document.addEventListener("selectionchange", function () {
        if (el.inputArea && document.activeElement === el.inputArea) updateCursor();
      });
      window.addEventListener("resize", function () {
        if (el.inputArea && document.activeElement === el.inputArea) requestAnimationFrame(updateCursor);
      });
      window.addEventListener("scroll", function () {
        if (el.inputArea && document.activeElement === el.inputArea) requestAnimationFrame(updateCursor);
      }, true);
      if (window.visualViewport) {
        window.visualViewport.addEventListener("resize", function () {
          if (el.inputArea && document.activeElement === el.inputArea) {
            requestAnimationFrame(updateCursor);
            requestAnimationFrame(scrollBottom);
          }
        });
      }
      el.inputArea.addEventListener("focusin", function () {
        var self = el.inputArea;
        setTimeout(function () { if (document.activeElement === self) updateCursor(); }, 100);
        requestAnimationFrame(updateCursor);
        requestAnimationFrame(scrollBottom);
      });
      el.inputArea.addEventListener("paste", function (e) {
        e.preventDefault();
        var text = (e.clipboardData || window.clipboardData).getData("text");
        if (text) document.execCommand("insertText", false, text.replace(/[\r\n]+/g, " "));
      });
      el.inputArea.focus();
      requestAnimationFrame(function () {
        updateCursor();
        scrollBottom();
      });
    }
    document.addEventListener("click", function (e) {
      if (!el.inputArea) return;
      if (e.target.closest("a") || e.target.closest("button")) return;
      el.inputArea.focus();
      updateCursor();
    });
  }

  init();
})();

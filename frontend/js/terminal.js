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
    { name: "stf", desc: "Plateforme web et mobile pour organiser des compétitions de pêche urbaine." },
    { name: "autre-projet", desc: "Description à personnaliser" },
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
    "Tapez 'help' ou '?' pour afficher les commandes.",
    "",
  ];

  let history = [];
  let historyIndex = -1;
  let themeIndex = 0;

  const el = {
    boot: document.getElementById("boot-output"),
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

  function scrollBottom() {
    window.scrollTo(0, document.body.scrollHeight);
  }

  function runBoot() {
    const fragment = document.createDocumentFragment();
    BOOT_LINES.forEach((line) => {
      const div = document.createElement("div");
      div.textContent = line;
      div.id = "line-boot";
      fragment.appendChild(div);
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
      cmd.dataset.cmd = `${name}${args ? " " + args : ""}`.trim();
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

    list.addEventListener("click", function (e) {
      const el = e.target && e.target.closest ? e.target.closest(".help-link") : null;
      if (!el) return;
      const cmd = el.dataset.cmd || "";
      if (!cmd) return;
      commitLineAndRun(cmd);
    });

    wrap.appendChild(list);

    const alias = document.createElement("div");
    alias.className = "help-alias";
    alias.textContent = "Alias: a=about, p=projects, h=help, c=contact, s=skills, cv=skills, portfolio=portfolio-terminal";
    wrap.appendChild(alias);

    el.history.appendChild(wrap);
  }

  function runAbout() {
    const text = `
  Emile — Développeur

  Passionné par les systèmes, le web et l'UX.
  Ce portfolio est un terminal : explore avec les commandes.

  Tapez 'projects' pour voir ce que je fais.
  Tapez 'contact' pour me joindre.
`.trim();
    appendBlock(text);
  }

  function runProjects(detail) {
    if (!detail) {
      let out = "Projets:\n\n";
      PROJECTS.forEach((p) => { out += `  ${p.name}\n    ${p.desc}\n\n`; });
      appendBlock(out);
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
  }

  function runProjectSTF() {
    const short = "STF (Street Fishing) — Plateforme web et mobile pour organiser des compétitions de pêche urbaine : inscriptions par équipes, déclaration de prises avec photo et position, périmètres de pêche, scores et bonus, espace organisateurs et validation des prises par le jury.";
    const stack = "Stack : API Symfony (PHP), MariaDB, applications Next.js (dashboard) et React Native / Expo (terrain), conteneurisées avec Docker, tests de charge k6.";

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
      STF est un écosystème applicatif pensé pour faciliter le déroulement des compétitions (participants, encadrement, jury) :
      suivi des compétitions et des équipes, saisie terrain des prises, règles de scoring (espèces, quotas, bonus) et workflow de validation des déclarations.
    </div>
  </div>

  <div class="project-section">
    <div class="project-h">Côté participants (mobile)</div>
    <ul class="project-list">
      <li>Authentification sécurisée</li>
      <li>Consultation des compétitions et des équipes</li>
      <li>Déclaration de prises avec photo et géolocalisation</li>
      <li>Vérification automatique du respect des zones autorisées</li>
      <li>Historique personnel et profil</li>
      <li>Parcours admin : validation des prises en attente</li>
    </ul>
    <div class="project-note">L’application terrain est développée en React Native / Expo, pensée pour être utilisable en conditions réelles.</div>
  </div>

  <div class="project-section">
    <div class="project-h">Côté organisation (web)</div>
    <ul class="project-list">
      <li>Configuration des compétitions (dates, espèces, règles, périmètres sur carte)</li>
      <li>Gestion des équipes et des participants</li>
      <li>Tableaux de bord et statistiques</li>
      <li>Outils d’administration et de validation</li>
    </ul>
    <div class="project-note">Le dashboard est développé en Next.js, avec une expérience fluide et réactive.</div>
  </div>

  <div class="project-section">
    <div class="project-h">Backend & architecture</div>
    <ul class="project-list">
      <li>API REST en Symfony</li>
      <li>Persistance via Doctrine / MariaDB</li>
      <li>Stockage structuré des médias (photos) sur disque</li>
      <li>Authentification JWT, rôles (participants / staff / jury)</li>
      <li>Environnement Docker Compose (API, base, volumes uploads)</li>
    </ul>
  </div>

  <div class="project-section">
    <div class="project-h">Qualité & performance</div>
    <div class="project-p">
      Scénarios de tests de charge k6 sur les parcours critiques (consultation, création de prises, statistiques) pour valider la stabilité sous charge.
    </div>
  </div>

  <div class="project-section">
    <div class="project-h">Positionnement honnête</div>
    <div class="project-p">
      La géolocalisation aide au respect du règlement, mais ne constitue pas une preuve absolue de présence (limites intrinsèques du GPS côté client).
      L’outil structure les déclarations et fluidifie le travail du staff ; il ne remplace pas l’arbitrage humain.
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
    <div class="project-note">Si tu veux, je peux détailler cette section avec des niveaux et des exemples de projets.</div>
  </div>
</div>
`;
    const block = appendBlock("", "output-block project-output");
    block.innerHTML = html;
  }

  function runContact() {
    const html = `
  Email : <a href="mailto:emile.deballon@gmail.com">emile.deballon@gmail.com</a><br>
  GitHub : <a href="https://github.com/MrScrupulus" target="_blank" rel="noopener">github.com/MrScrupulus</a><br>
  LinkedIn : <a href="https://www.linkedin.com/in/emile-deballon-738a432b4/" target="_blank" rel="noopener">linkedin.com/in/emile</a>
`;
    const block = appendBlock("", "output-block");
    block.innerHTML = html;
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
      el.inputArea.addEventListener("focusin", function () {
        var self = el.inputArea;
        setTimeout(function () { if (document.activeElement === self) updateCursor(); }, 100);
        requestAnimationFrame(updateCursor);
      });
      el.inputArea.addEventListener("paste", function (e) {
        e.preventDefault();
        var text = (e.clipboardData || window.clipboardData).getData("text");
        if (text) document.execCommand("insertText", false, text.replace(/[\r\n]+/g, " "));
      });
      el.inputArea.focus();
      requestAnimationFrame(function () {
        updateCursor();
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

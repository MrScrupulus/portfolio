(function () {
  "use strict";

  const API_BASE = "/api";

  function getPrompt() {
    return "emile-portfolio@localhost:~$";
  }
  const THEMES = ["matrix", "amber", "blue"];
  const ALIASES = { a: "about", p: "projects", h: "help", c: "contact", s: "skills", cl: "clear", t: "theme", e: "exit", "?": "help" };

  const COMMANDS = {
    help: { args: "", desc: "Afficher cette aide" },
    about: { args: "", desc: "Qui je suis" },
    projects: { args: "[nom]", desc: "Liste des projets (ou détail)" },
    skills: { args: "", desc: "Compétences" },
    contact: { args: "", desc: "Me contacter" },
    clear: { args: "", desc: "Effacer l'écran" },
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
    "Tapez 'help' ou '?' pour les commandes.",
    "",
  ];

  let history = [];
  let historyIndex = -1;
  let themeIndex = 0;

  const el = {
    boot: document.getElementById("boot-output"),
    history: document.getElementById("history"),
    input: document.getElementById("input"),
  };

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
    let out = "Commandes disponibles:\n\n";
    Object.entries(COMMANDS).forEach(([name, { args, desc }]) => {
      out += `  ${name} ${args}\n    ${desc}\n`;
    });
    out += "\nAlias: a=about, p=projects, h=help, c=contact, s=skills, cl=clear, t=theme, e=exit";
    appendBlock(out, "output-block help-output");
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
    const list = [
      { name: "portfolio-terminal", desc: "Ce site (terminal en JS)" },
      { name: "autre-projet", desc: "Description à personnaliser" },
    ];
    if (!detail) {
      let out = "Projets:\n\n";
      list.forEach((p) => { out += `  ${p.name}\n    ${p.desc}\n\n`; });
      appendBlock(out);
      return;
    }
    const proj = list.find((p) => p.name.toLowerCase() === detail.toLowerCase());
    if (proj) {
      appendBlock(`\n  ${proj.name}\n  ${proj.desc}\n\n  (Contenu à personnaliser.)\n`);
    } else {
      appendBlock(`cat: ${detail}: fichier ou projet inconnu.`, "output-block error");
      appendBlock("Essayez: projects", "output-block hint");
    }
  }

  function runSkills() {
    const text = `
  Langages : JavaScript, Python, (à compléter)
  Outils    : Docker, Git, (à compléter)
  En cours  : FastAPI, (à compléter)
`.trim();
    appendBlock(text);
  }

  function runContact() {
    const html = `
  Email : <a href="mailto:emile@example.com">emile@example.com</a><br>
  GitHub : <a href="https://github.com/emile" target="_blank" rel="noopener">github.com/emile</a><br>
  LinkedIn : <a href="https://linkedin.com/in/emile" target="_blank" rel="noopener">linkedin.com/in/emile</a>
  <span class="hint">(Remplacez par vos vrais liens.)</span>
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
        suggestUnknown(trimmed);
    }

    scrollBottom();
  }

  function addInputLine() {
    const line = document.createElement("div");
    line.className = "line input-line";
    line.appendChild(promptSpan());
    const inp = document.createElement("input");
    inp.type = "text";
    inp.className = "input";
    inp.autocomplete = "off";
    inp.spellcheck = false;
    inp.setAttribute("aria-label", "Commande");
    line.appendChild(inp);
    el.history.appendChild(line);
    inp.focus();
    inp.addEventListener("keydown", (e) => handleKey(e, inp, line));
    return inp;
  }

  function commitLineAndRun(inputEl, val) {
    var cmd = (val || "").trim();
    if (!cmd) return;
    // Ajouter la ligne "prompt + commande" dans #history (en haut), pas en modifiant la ligne de saisie
    var lineWrap = document.createElement("div");
    lineWrap.className = "line";
    lineWrap.appendChild(promptSpan());
    var cmdSpan = document.createElement("span");
    cmdSpan.className = "cmd-entered";
    cmdSpan.textContent = cmd;
    lineWrap.appendChild(cmdSpan);
    el.history.appendChild(lineWrap);
    execute(val);
    inputEl.value = "";
    inputEl.focus();
  }

  function handleKey(e, inputEl, lineEl) {
    if (e.key === "Enter") {
      e.preventDefault();
      commitLineAndRun(inputEl, inputEl.value);
    } else if (e.key === "Tab") {
      e.preventDefault();
      autocomplete(inputEl);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (historyIndex > 0) {
        historyIndex--;
        inputEl.value = history[historyIndex];
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (historyIndex < history.length - 1) {
        historyIndex++;
        inputEl.value = history[historyIndex];
      } else if (historyIndex === history.length - 1) {
        historyIndex = history.length;
        inputEl.value = "";
      }
    }
  }

  function autocomplete(inputEl) {
    const val = inputEl.value.trim().toLowerCase();
    if (!val) {
      inputEl.value = "help";
      return;
    }
    const parts = val.split(/\s+/);
    const first = parts[0];
    const all = [...Object.keys(COMMANDS), ...Object.keys(ALIASES)];
    const matches = all.filter((k) => k.startsWith(first));
    if (matches.length === 1) {
      parts[0] = matches[0];
      inputEl.value = parts.join(" ");
    } else if (matches.length > 1) {
      const common = matches.reduce((a, b) => {
        let i = 0;
        while (a[i] === b[i]) i++;
        return a.slice(0, i);
      }, matches[0]);
      if (common === first) {
        appendBlock("  " + matches.join("  "), "output-block hint");
      } else {
        inputEl.value = common + (parts.length > 1 ? " " + parts.slice(1).join(" ") : "");
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
      var duration = 2000;
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
        }, 550);
      }, 2500);
    }
    runBoot();
    el.input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        commitLineAndRun(el.input, el.input.value);
      } else if (e.key === "Tab") {
        e.preventDefault();
        autocomplete(el.input);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        if (historyIndex > 0) {
          historyIndex--;
          el.input.value = history[historyIndex];
        }
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        if (historyIndex < history.length - 1) {
          historyIndex++;
          el.input.value = history[historyIndex];
        } else if (historyIndex === history.length - 1) {
          historyIndex = history.length;
          el.input.value = "";
        }
      }
    });
    el.input.focus();
    document.getElementById("terminal").addEventListener("click", () => el.input.focus());
  }

  init();
})();

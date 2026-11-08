const REPOS_URL = "https://api.github.com/users/yuchen310/repos?sort=updated&per_page=12";
// Only these repos are shown in #repos; their data still comes from the API.
const FEATURED_REPOS = ["yuchen-site", "yuchen-site-tests"];

document.getElementById("year").textContent = new Date().getFullYear();

const themeToggle = document.getElementById("theme-toggle");

function syncThemeToggle() {
  themeToggle.setAttribute("aria-pressed", String(document.body.classList.contains("dark")));
}

themeToggle.addEventListener("click", () => {
  const dark = document.body.classList.toggle("dark");
  try {
    sessionStorage.setItem("theme", dark ? "dark" : "light");
  } catch {
    // Storage unavailable (e.g. blocked site data): the toggle still works for this page view.
  }
  syncThemeToggle();
});

syncThemeToggle();

const backToTop = document.getElementById("back-to-top");
const hero = document.getElementById("hero");

if (backToTop && hero) {
  // Show the button only once #hero has scrolled fully out of view.
  new IntersectionObserver(([entry]) => {
    backToTop.hidden = entry.isIntersecting;
  }).observe(hero);

  backToTop.addEventListener("click", () => {
    window.scrollTo({ top: 0 });
  });
}

// Project tracks: tabs filter and reorder the cards in #projects.
const projectTabList = document.querySelector(".project-tabs");

if (projectTabList) {
  const tabs = Array.from(projectTabList.querySelectorAll('[role="tab"]'));
  const panel = document.getElementById("projects-panel");
  const grid = panel.querySelector(".project-grid");
  const cards = Array.from(grid.querySelectorAll(".project-card"));
  const projectsSection = document.getElementById("projects");

  panel.setAttribute("role", "tabpanel");
  projectTabList.hidden = false;

  function tabForHash(hash) {
    return tabs.find((tab) => `#${tab.dataset.hash}` === hash);
  }

  function selectTab(tab, { focus = false, updateHash = false } = {}) {
    const track = tab.dataset.track;

    tabs.forEach((t) => {
      const selected = t === tab;
      t.setAttribute("aria-selected", String(selected));
      t.tabIndex = selected ? 0 : -1;
    });
    panel.setAttribute("aria-labelledby", tab.id);

    // "All" keeps the source order (Full-Stack first, then Frontend-only).
    // DOM order is changed (not CSS order) so keyboard and reading order match what is shown.
    const ordered =
      track === "all"
        ? cards
        : cards
            .filter((card) => card.dataset.tracks.split(" ").includes(track))
            .sort((a, b) => Number(a.dataset[`${track}Order`]) - Number(b.dataset[`${track}Order`]));

    cards.forEach((card) => {
      card.hidden = !ordered.includes(card);
    });
    grid.append(...ordered);

    if (focus) tab.focus();
    if (updateHash) {
      history.replaceState(null, "", `#${tab.dataset.hash}`);
    }
  }

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => selectTab(tab, { updateHash: true }));
  });

  projectTabList.addEventListener("keydown", (event) => {
    const current = tabs.indexOf(document.activeElement);
    if (current === -1) return;

    let next;
    if (event.key === "ArrowRight") next = (current + 1) % tabs.length;
    else if (event.key === "ArrowLeft") next = (current - 1 + tabs.length) % tabs.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = tabs.length - 1;
    else return;

    event.preventDefault();
    selectTab(tabs[next], { focus: true, updateHash: true });
  });

  function applyHash({ scroll }) {
    const tab = tabForHash(location.hash);
    if (tab) {
      selectTab(tab);
      if (scroll) projectsSection.scrollIntoView({ behavior: "instant", block: "start" });
    } else if (!location.hash || location.hash === "#") {
      selectTab(tabs.find((t) => t.dataset.track === "all"));
    }
  }

  // Deep links such as index.html#frontend select that tab and scroll to #projects.
  applyHash({ scroll: true });
  window.addEventListener("hashchange", () => applyHash({ scroll: true }));
}

function repoCard(repo) {
  const card = document.createElement("li");
  card.className = "card";

  const title = document.createElement("h3");
  const link = document.createElement("a");
  link.href = repo.html_url;
  link.target = "_blank";
  link.rel = "noopener";
  link.textContent = repo.name;
  title.append(link);

  const description = document.createElement("p");
  description.textContent = repo.description || "No description provided.";

  const meta = document.createElement("div");
  meta.className = "card-meta";
  if (repo.language) {
    const language = document.createElement("span");
    language.textContent = repo.language;
    meta.append(language);
  }
  const stars = document.createElement("span");
  stars.textContent = `★ ${repo.stargazers_count}`;
  stars.setAttribute("aria-label", `${repo.stargazers_count} stars`);
  meta.append(stars);

  card.append(title, description, meta);
  return card;
}

async function loadRepos() {
  const status = document.getElementById("repos-status");
  const list = document.getElementById("repos-list");

  try {
    const response = await fetch(REPOS_URL, {
      headers: { Accept: "application/vnd.github+json" },
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const data = await response.json();
    const repos = Array.isArray(data) ? data.filter((repo) => FEATURED_REPOS.includes(repo.name)) : [];
    if (repos.length === 0) {
      status.textContent = "No public repositories yet.";
      return;
    }

    list.append(...repos.map(repoCard));
    status.textContent = "";
  } catch {
    status.textContent = "Couldn't load repositories right now. See them on GitHub instead.";
  }
}

// Only the home page has a repo list.
if (document.getElementById("repos-list")) {
  loadRepos();
}

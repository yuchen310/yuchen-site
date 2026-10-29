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

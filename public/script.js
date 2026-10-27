const REPOS_URL = "https://api.github.com/users/yuchen310/repos?sort=updated&per_page=12";

document.getElementById("year").textContent = new Date().getFullYear();

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

    const repos = await response.json();
    if (!Array.isArray(repos) || repos.length === 0) {
      status.textContent = "No public repositories yet.";
      return;
    }

    list.append(...repos.map(repoCard));
    status.textContent = "";
  } catch {
    status.textContent = "Couldn't load repositories right now. See them on GitHub instead.";
  }
}

loadRepos();

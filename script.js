const sliders = {
  fta: document.querySelector("#fta"),
  coverage: document.querySelector("#coverage"),
  diff: document.querySelector("#diff"),
  churn: document.querySelector("#churn"),
};

const output = document.querySelector("#risk-output");
const routeCopy = document.querySelector("#route-copy");
const proofList = document.querySelector("#proof-list");

function setValue(id, value) {
  const target = document.querySelector(`[data-value-for="${id}"]`);
  if (!target) return;
  target.textContent = id === "coverage" ? `${value}%` : value;
}

function scoreInputs() {
  const fta = Number(sliders.fta.value);
  const coverage = Number(sliders.coverage.value);
  const diff = Number(sliders.diff.value);
  const churn = Number(sliders.churn.value);

  let score = 0;
  if (fta > 130) score += 2;
  if (fta > 170) score += 2;
  if (coverage < 80) score += 2;
  if (coverage < 65) score += 2;
  if (diff > 400) score += 1;
  if (diff > 800) score += 2;
  if (churn > 4) score += 2;
  if (churn > 7) score += 2;
  return score;
}

function updateRouting() {
  if (!output || !routeCopy || !proofList || Object.values(sliders).some((slider) => !slider)) return;
  Object.entries(sliders).forEach(([id, slider]) => setValue(id, slider.value));

  const score = scoreInputs();
  output.classList.remove("low", "high");

  if (score <= 2) {
    output.textContent = "Solo lane";
    output.classList.add("low");
    routeCopy.textContent = "Solo execute with standard verification. Keep the diff tight and show test output.";
    proofList.innerHTML = `
      <li>Typecheck passes.</li>
      <li>Relevant unit tests pass.</li>
      <li>Evidence matches the touched lifecycle stage.</li>
    `;
    return;
  }

  if (score <= 6) {
    output.textContent = "Review required";
    routeCopy.textContent = "Use an implementation lane plus an architecture or quality review before PR handoff.";
    proofList.innerHTML = `
      <li>Typecheck, lint, and focused tests pass.</li>
      <li>Unit, integration, or functional test layer matches the touched behavior.</li>
      <li>Coverage and manual evidence gaps are explained.</li>
      <li>Architecture boundary review has no blocking findings.</li>
    `;
    return;
  }

  output.textContent = "Split task";
  output.classList.add("high");
  routeCopy.textContent = "Split into smaller worktrees or add a planning pass before implementation.";
  proofList.innerHTML = `
    <li>Plan identifies independent slices and rollback points.</li>
    <li>Regression tests lock current behavior before cleanup.</li>
    <li>Reviewer signs off on test depth, boundary risk, and migration risk.</li>
  `;
}

if (Object.values(sliders).every(Boolean)) {
  Object.values(sliders).forEach((slider) => slider.addEventListener("input", updateRouting));
  updateRouting();
}

document.querySelectorAll("[data-tabs]").forEach((tabs) => {
  const buttons = tabs.querySelectorAll("[data-tab]");
  const panels = tabs.querySelectorAll("[data-panel]");

  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      const selected = button.dataset.tab;
      buttons.forEach((item) => {
        item.classList.toggle("active", item === button);
        item.setAttribute("aria-selected", item === button ? "true" : "false");
      });
      panels.forEach((panel) => {
        panel.classList.toggle("active", panel.dataset.panel === selected);
      });
    });
  });
});

const pageKey = window.location.pathname.split("/").pop() || "index.html";
const checklistKey = `ai-coding-guidance-checklist:${pageKey}`;
const checks = Array.from(document.querySelectorAll(".checklist input"));
const savedChecks = JSON.parse(localStorage.getItem(checklistKey) || "[]");
checks.forEach((check, index) => {
  check.checked = Boolean(savedChecks[index]);
  check.addEventListener("change", () => {
    localStorage.setItem(checklistKey, JSON.stringify(checks.map((item) => item.checked)));
  });
});

document.querySelectorAll("[data-store]").forEach((field) => {
  const key = `ai-coding-guidance-field:${pageKey}:${field.dataset.store}`;
  field.value = localStorage.getItem(key) || "";
  field.addEventListener("input", () => {
    localStorage.setItem(key, field.value);
  });
});

function checklistSummary() {
  const fieldValue = (name) => document.querySelector(`[data-store="${name}"]`)?.value.trim() || "Not set";
  const required = Array.from(document.querySelectorAll(".required-checks label")).map((label) => {
    const input = label.querySelector("input");
    return `${input?.checked ? "[x]" : "[ ]"} ${label.textContent.trim()}`;
  });
  const evidence = Array.from(document.querySelectorAll(".checklist-stage textarea"))
    .map((field) => field.value.trim())
    .filter(Boolean);

  return [
    "## Agentic SDLC checklist",
    `- Story / PR: ${fieldValue("story-pr")}`,
    `- Owner: ${fieldValue("owner")}`,
    `- Release risk: ${fieldValue("release-risk")}`,
    "",
    "## Required gates",
    ...required,
    "",
    "## Evidence notes",
    ...(evidence.length ? evidence.map((note) => `- ${note}`) : ["- Not added"]),
  ].join("\n");
}

document.querySelector("#copy-checklist-summary")?.addEventListener("click", async (event) => {
  const button = event.currentTarget;
  try {
    await navigator.clipboard.writeText(checklistSummary());
    button.textContent = "Copied summary";
    setTimeout(() => {
      button.textContent = "Copy PR summary";
    }, 1400);
  } catch {
    button.textContent = "Select manually";
  }
});

document.querySelector("#reset-checklist")?.addEventListener("click", () => {
  Object.keys(localStorage)
    .filter((key) => key === checklistKey || key.startsWith(`ai-coding-guidance-field:${pageKey}:`))
    .forEach((key) => localStorage.removeItem(key));
  window.location.reload();
});

document.querySelectorAll("[data-copy]").forEach((button) => {
  button.addEventListener("click", async () => {
    const target = document.querySelector(button.dataset.copy);
    if (!target) return;
    const text = target.textContent.trim();
    try {
      await navigator.clipboard.writeText(text);
      button.textContent = "Copied";
      setTimeout(() => {
        button.textContent = "Copy";
      }, 1400);
    } catch {
      button.textContent = "Select text";
    }
  });
});

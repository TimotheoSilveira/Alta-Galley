const BULLS_KEY = "alta-lineage-webapp-data-v4";
const USERS_KEY = "alta-lineage-users-v1";
const SESSION_KEY = "alta-lineage-session-v4";

const ROLES = {
  VIEWER: "viewer",
  EDITOR: "editor",
  ADMIN: "admin"
};

const initialBulls = [
  {
    id: 1,
    name: "Super Bull 001",
    code: "SB001",
    breed: "Holandês",
    category: "Leite",
    description: "Excelente produção de leite e conformação.",
    bullImage: "https://images.unsplash.com/photo-1517849845537-4d257902454a?auto=format&fit=crop&w=900&q=80",
    daughters: [
      {
        id: 101,
        cowName: "Vaca 4021",
        farm: "Fazenda Boa Vista",
        location: "Varginha / MG",
        milk: "42 kg/dia",
        lactation: "2ª lactação",
        image: "https://images.unsplash.com/photo-1516467508483-a7212febe31a?auto=format&fit=crop&w=1200&q=80"
      }
    ]
  },
  {
    id: 2,
    name: "Alta Prime 245",
    code: "AP245",
    breed: "Jersey",
    category: "Sólidos",
    description: "Destaque para sólidos, fertilidade e vacas funcionais.",
    bullImage: "https://images.unsplash.com/photo-1493962853295-0fd70327578a?auto=format&fit=crop&w=900&q=80",
    daughters: []
  }
];

const state = {
  loggedIn: false,
  email: "",
  userName: "",
  userRole: ROLES.VIEWER,
  query: "",
  breedFilter: "Todas as raças",
  selectedBullId: null,
  previewPhoto: null,
  showAddBull: false,
  showAddPhoto: false,
  showRegister: false,
  showEditBullPhoto: false,
  showExport: false,
  showManageUsers: false,
  mobileMenuOpen: false,
  exportSelection: [],
  bulls: loadBulls(),
  users: loadUsers()
};

init();

function init() {
  loadSession();
  render();
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function loadBulls() {
  try {
    const raw = localStorage.getItem(BULLS_KEY);
    return raw ? JSON.parse(raw) : clone(initialBulls);
  } catch {
    return clone(initialBulls);
  }
}

function saveBulls() {
  localStorage.setItem(BULLS_KEY, JSON.stringify(state.bulls));
}

function loadUsers() {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveUsers() {
  localStorage.setItem(USERS_KEY, JSON.stringify(state.users));
}

function loadSession() {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return;
    const session = JSON.parse(raw);
    state.loggedIn = !!session.loggedIn;
    state.email = session.email || "";
    state.userName = session.userName || "";
    state.userRole = session.userRole || ROLES.VIEWER;
  } catch {}
}

function saveSession() {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify({
    loggedIn: state.loggedIn,
    email: state.email,
    userName: state.userName,
    userRole: state.userRole
  }));
}

function canEdit() {
  return state.userRole === ROLES.EDITOR || state.userRole === ROLES.ADMIN;
}

function canManageUsers() {
  return state.userRole === ROLES.ADMIN;
}

function getSelectedBull() {
  return state.bulls.find((item) => item.id === state.selectedBullId) || null;
}

function getBreeds() {
  return ["Todas as raças", ...new Set(state.bulls.map((bull) => bull.breed))];
}

function getFilteredBulls() {
  return state.bulls.filter((bull) => {
    const haystack = `${bull.name} ${bull.code} ${bull.category} ${bull.breed}`.toLowerCase();
    const matchesQuery = haystack.includes(state.query.toLowerCase());
    const matchesBreed = state.breedFilter === "Todas as raças" || bull.breed === state.breedFilter;
    return matchesQuery && matchesBreed;
  });
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&")
    .replaceAll("<", "<")
    .replaceAll(">", ">")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttr(value) {
  return escapeHtml(value);
}

function render() {
  const app = document.getElementById("app");
  app.innerHTML = state.loggedIn ? renderDashboard() : renderLogin();
  bindEvents();
}

function renderLogin() {
  return `
    <div class="login-page compact-login-page">
      <div class="login-compact-card">
        <div class="login-compact-brand brand-lockup">
          <img src="assets/alta-symbol.png" alt="Alta symbol" />
          <div class="brand-title">
            <small>Alta Genetics</small>
            <strong>Alta Gallery</strong>
          </div>
        </div>
        <h1>Entrar no Alta Gallery</h1>
        <p class="subtext">Acesso liberado para e-mails com final @altagenetics.com</p>
        <form id="login-form" class="form-card compact-form-card">
          <div id="login-error"></div>
          <div class="field">
            <label>E-mail corporativo</label>
            <input name="email" type="email" placeholder="seu.nome@altagenetics.com" required />
          </div>
          <div class="field">
            <label>Senha</label>
            <input name="password" type="password" placeholder="Digite sua senha" required />
          </div>
          <button class="primary-btn full-width" type="submit">Acessar</button>
          <button class="link-btn" type="button" data-action="open-register">Criar cadastro</button>
        </form>
      </div>
      ${renderRegisterModal()}
    </div>
  `;
}

function renderRegisterModal() {
  return `
    <div class="modal-backdrop ${state.showRegister ? "show" : ""}" id="register-modal">
      <div class="modal small">
        <div class="modal-header">
          <h3 class="modal-title">Criar cadastro</h3>
          <button class="close-btn" data-action="close-register">×</button>
        </div>
        <div class="modal-body">
          <form id="register-form">
            <div id="register-error"></div>
            <div class="field">
              <label>Nome</label>
              <input name="name" placeholder="Seu nome" required />
            </div>
            <div class="field">
              <label>E-mail corporativo</label>
              <input name="email" type="email" placeholder="seu.nome@altagenetics.com" required />
            </div>
            <div class="grid-2">
              <div class="field">
                <label>Senha</label>
                <input name="password" type="password" required />
              </div>
              <div class="field">
                <label>Confirmar senha</label>
                <input name="confirmPassword" type="password" required />
              </div>
            </div>
            <button class="primary-btn full-width" type="submit">Salvar cadastro</button>
          </form>
        </div>
      </div>
    </div>
  `;
}

function renderDashboard() {
  const filteredBulls = getFilteredBulls();
  const breeds = getBreeds();
  const totalPhotos = state.bulls.reduce((acc, bull) => acc + (bull.daughters?.length || 0), 0);
  const selectedBull = getSelectedBull();
  const displayUser = state.userName || state.email || "Usuário Alta";

  return `
    <div class="page-shell">
      <header class="app-header">
        <div class="container">
          <div class="header-row">
            <div class="brand-lockup">
              <img src="assets/alta-symbol.png" alt="Alta symbol" />
              <div class="brand-title">
                <small>Alta Genetics</small>
                <strong>Alta Gallery</strong>
              </div>
            </div>
            <div class="header-actions">
              <div class="user-email">${escapeHtml(displayUser)} <span class="role-badge">${state.userRole.toUpperCase()}</span></div>
              ${canEdit() ? `<button class="primary-btn" data-action="open-add-bull">+ Adicionar Touro</button>` : ''}
              <button class="secondary-btn" data-action="open-export">Exportar</button>
              ${canManageUsers() ? `<button class="secondary-btn" data-action="open-manage-users">Gerenciar Usuários</button>` : ''}
              <button class="outline-btn" data-action="logout">Sair</button>
            </div>
            <button class="outline-btn mobile-actions-toggle" data-action="toggle-mobile-menu">☰</button>
          </div>
        </div>
      </header>

      <main class="container page-content">
        <section class="hero-row">
          <div>
            <h1>Touros Cadastrados</h1>
            <p>Gerencie e visualize a progênie dos touros Alta Genetics.</p>
          </div>
          <div class="stats-grid">
            <div class="stat-card"><span>Touros</span><strong>${state.bulls.length}</strong></div>
            <div class="stat-card"><span>Raças</span><strong>${Math.max(breeds.length - 1, 0)}</strong></div>
            <div class="stat-card"><span>Fotos</span><strong>${totalPhotos}</strong></div>
          </div>
        </section>

        <section class="filters-row">
          <div class="search-box">
            <span>🔎</span>
            <input id="search-input" type="text" placeholder="Buscar por nome ou código do touro..." value="${escapeAttr(state.query)}" />
          </div>
          <select id="breed-filter" class="filter-select">
            ${breeds.map(breed => `<option value="${escapeAttr(breed)}" ${breed === state.breedFilter ? "selected" : ""}>${escapeHtml(breed)}</option>`).join("")}
          </select>
        </section>

        <section class="cards-grid">
          ${filteredBulls.map(renderBullCard).join("")}
        </section>

        ${filteredBulls.length === 0 ? `<div class="empty-state">Nenhum touro encontrado com esse filtro.</div>` : ""}
      </main>

      ${canEdit() ? renderAddBullModal() : ''}
      ${renderBullModal(selectedBull)}
      ${canEdit() ? renderEditBullPhotoModal(selectedBull) : ''}
      ${canEdit() ? renderAddPhotoModal(selectedBull) : ''}
      ${renderPhotoPreviewModal()}
      ${renderExportModal()}
      ${canManageUsers() ? renderManageUsersModal() : ''}
    </div>
  `;
}

function renderBullCard(bull) {
  const actions = canEdit() ? `
    <button class="outline-btn" data-action="open-bull" data-id="${bull.id}">Abrir galeria</button>
    <button class="danger-btn" data-action="delete-bull" data-id="${bull.id}">Excluir</button>
  ` : `
    <button class="outline-btn" data-action="open-bull" data-id="${bull.id}">Abrir galeria</button>
  `;

  return `
    <article class="bull-card">
      <div class="bull-card-top with-image">
        <div class="bull-thumb ${bull.bullImage ? "" : "empty"}">
          ${bull.bullImage ? `<img src="${escapeAttr(bull.bullImage)}" alt="${escapeAttr(bull.name)}" />` : `<span>Sem foto</span>`}
        </div>
        <div class="bull-card-main">
          <div class="bull-card-headline">
            <div>
              <h3 class="bull-name">${escapeHtml(bull.name)}</h3>
              <div class="bull-code">Código: ${escapeHtml(bull.code)}</div>
            </div>
            <div class="badge">${escapeHtml(bull.breed)}</div>
          </div>
          <p class="bull-description">${escapeHtml(bull.description || "Sem descrição genética cadastrada.")}</p>
        </div>
      </div>
      <div class="card-divider"></div>
      <div class="bull-card-bottom">
        <span>${bull.daughters.length} fotos de filhas</span>
        <div class="card-actions">
          ${actions}
        </div>
      </div>
    </article>
  `;
}

function getBreeds() {
  return ["Todas as raças", ...new Set(state.bulls.map((bull) => bull.breed))];
}

function getFilteredBulls() {
  return state.bulls.filter((bull) => {
    const haystack = `${bull.name} ${bull.code} ${bull.category} ${bull.breed}`.toLowerCase();
    const matchesQuery = haystack.includes(state.query.toLowerCase());
    const matchesBreed = state.breedFilter === "Todas as raças" || bull.breed === state.breedFilter;
    return matchesQuery && matchesBreed;
  });
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&")
    .replaceAll("<", "<")
    .replaceAll(">", ">")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttr(value) {
  return escapeHtml(value);
}

function bindEvents() {
  const loginForm = document.getElementById("login-form");
  if (loginForm) loginForm.addEventListener("submit", handleLogin);

  const registerForm = document.getElementById("register-form");
  if (registerForm) registerForm.addEventListener("submit", handleRegister);

  const searchInput = document.getElementById("search-input");
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      state.query = e.target.value;
      render();
    });
  }

  const breedFilter = document.getElementById("breed-filter");
  if (breedFilter) {
    breedFilter.addEventListener("change", (e) => {
      state.breedFilter = e.target.value;
      render();
    });
  }

  const addBullForm = document.getElementById("add-bull-form");
  if (addBullForm) addBullForm.addEventListener("submit", handleAddBull);

  const bullFileInput = document.getElementById("bull-file-input");
  if (bullFileInput) bullFileInput.addEventListener("change", (e) => handleFileChange(e, "add-bull-form", "bull-file-preview", "uploadBullImage"));

  const editBullPhotoForm = document.getElementById("edit-bull-photo-form");
  if (editBullPhotoForm) editBullPhotoForm.addEventListener("submit", handleUpdateBullPhoto);

  const editBullFileInput = document.getElementById("edit-bull-file-input");
  if (editBullFileInput) editBullFileInput.addEventListener("change", (e) => handleFileChange(e, "edit-bull-photo-form", "edit-bull-file-preview", "uploadBullImage"));

  const addPhotoForm = document.getElementById("add-photo-form");
  if (addPhotoForm) addPhotoForm.addEventListener("submit", handleAddPhoto);

  const photoFileInput = document.getElementById("photo-file-input");
  if (photoFileInput) photoFileInput.addEventListener("change", (e) => handleFileChange(e, "add-photo-form", "photo-file-preview", "uploadImage"));

  document.querySelectorAll(".export-checkbox").forEach((checkbox) => {
    checkbox.addEventListener("change", handleExportSelectionChange);
  });

  const importForm = document.getElementById("import-form");
  if (importForm) importForm.addEventListener("submit", handleImport);

  document.querySelectorAll("[data-action]").forEach((el) => {
    el.addEventListener("click", handleActionClick);
  });
}

function handleLogin(event) {
  event.preventDefault();
  const formData = new FormData(event.target);
  const email = (formData.get("email") || "").toString().trim().toLowerCase();
  const password = (formData.get("password") || "").toString().trim();
  const errorBox = document.getElementById("login-error");

  if (!email.endsWith("@altagenetics.com") || !password) {
    errorBox.innerHTML = `<div class="error-box">Use um e-mail com final @altagenetics.com e qualquer senha preenchida.</div>`;
    return;
  }

  const registered = state.users.find((user) => user.email === email);
  if (registered && registered.password !== password) {
    errorBox.innerHTML = `<div class="error-box">Senha incorreta para este usuário cadastrado.</div>`;
    return;
  }

  state.loggedIn = true;
  state.email = email;
  state.userName = registered?.name || email.split("@")[0];
  saveSession();
  render();
}

function handleRegister(event) {
  event.preventDefault();
  const formData = new FormData(event.target);
  const name = (formData.get("name") || "").toString().trim();
  const email = (formData.get("email") || "").toString().trim().toLowerCase();
  const password = (formData.get("password") || "").toString().trim();
  const confirmPassword = (formData.get("confirmPassword") || "").toString().trim();
  const errorBox = document.getElementById("register-error");

  if (!name || !email.endsWith("@altagenetics.com") || !password) {
    errorBox.innerHTML = `<div class="error-box">Preencha nome, e-mail corporativo e senha.</div>`;
    return;
  }

  if (password !== confirmPassword) {
    errorBox.innerHTML = `<div class="error-box">As senhas não conferem.</div>`;
    return;
  }

  if (state.users.some((user) => user.email === email)) {
    errorBox.innerHTML = `<div class="error-box">Este e-mail já está cadastrado.</div>`;
    return;
  }

  state.users.push({ id: Date.now(), name, email, password });
  saveUsers();
  state.showRegister = false;
  alert("Cadastro salvo com sucesso. Agora você já pode entrar.");
  render();
}

function handleAddBull(event) {
  event.preventDefault();
  const formData = new FormData(event.target);
  const imageFromUrl = (formData.get("bullImageUrl") || "").toString().trim();
  const imageFromUpload = event.target.dataset.uploadBullImage || "";

  const bull = {
    id: Date.now(),
    name: (formData.get("name") || "").toString().trim(),
    code: (formData.get("code") || "").toString().trim(),
    breed: (formData.get("breed") || "Holandês").toString().trim(),
    category: (formData.get("category") || "").toString().trim(),
    description: (formData.get("description") || "").toString().trim(),
    bullImage: imageFromUpload || imageFromUrl,
    daughters: []
  };

  if (!bull.name || !bull.code) return;

  state.bulls.unshift(bull);
  state.showAddBull = false;
  saveBulls();
  render();
}

function handleUpdateBullPhoto(event) {
  event.preventDefault();
  const bull = getSelectedBull();
  if (!bull) return;

  const formData = new FormData(event.target);
  const imageFromUrl = (formData.get("bullImageUrl") || "").toString().trim();
  const imageFromUpload = event.target.dataset.uploadBullImage || "";
  const image = imageFromUpload || imageFromUrl;

  if (!image) {
    alert("Informe uma nova foto por URL ou upload.");
    return;
  }

  bull.bullImage = image;
  state.showEditBullPhoto = false;
  saveBulls();
  render();
}

function handleAddPhoto(event) {
  event.preventDefault();
  const formData = new FormData(event.target);
  const bull = getSelectedBull();
  if (!bull) return;

  const imageFromUrl = (formData.get("imageUrl") || "").toString().trim();
  const imageFromUpload = event.target.dataset.uploadImage || "";
  const image = imageFromUpload || imageFromUrl;

  const photo = {
    id: Date.now(),
    cowName: (formData.get("cowName") || "").toString().trim(),
    farm: (formData.get("farm") || "").toString().trim(),
    location: (formData.get("location") || "").toString().trim(),
    milk: (formData.get("milk") || "").toString().trim(),
    lactation: (formData.get("lactation") || "").toString().trim(),
    image
  };

  if (!photo.cowName || !photo.image) {
    alert("Preencha o nome da vaca e informe uma imagem.");
    return;
  }

  bull.daughters.unshift(photo);
  state.showAddPhoto = false;
  saveBulls();
  render();
}

function handleFileChange(event, formId, previewId, dataKey) {
  const file = event.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    const form = document.getElementById(formId);
    const preview = document.getElementById(previewId);
    if (form) form.dataset[dataKey] = reader.result;
    if (preview) {
      preview.src = reader.result;
      preview.classList.remove("hidden");
    }
  };
  reader.readAsDataURL(file);
}

function handleExportSelectionChange(event) {
  const bullId = Number(event.target.dataset.bullId || 0);
  if (!bullId) return;

  if (event.target.checked) {
    if (!state.exportSelection.includes(bullId)) state.exportSelection.push(bullId);
  } else {
    state.exportSelection = state.exportSelection.filter((id) => id !== bullId);
  }

  render();
}

function openExportModal() {
  const filteredIds = getFilteredBulls().map((bull) => bull.id);
  const hasActiveFilter = !!state.query.trim() || state.breedFilter !== "Todas as raças";
  state.exportSelection = hasActiveFilter ? filteredIds : state.bulls.map((bull) => bull.id);
  state.showExport = true;
  state.mobileMenuOpen = false;
  render();
}

function closeExportModal() {
  state.showExport = false;
  render();
}

function handleImport(event) {
  event.preventDefault();
  const file = event.target.elements.jsonFile.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(reader.result);
      if (!Array.isArray(parsed)) throw new Error();
      state.bulls = parsed;
      state.selectedBullId = null;
      state.previewPhoto = null;
      state.showEditBullPhoto = false;
      saveBulls();
      closeImport();
      render();
    } catch {
      alert("Arquivo JSON inválido.");
    }
  };
  reader.readAsText(file);
}

function handleActionClick(event) {
  const action = event.currentTarget.dataset.action;
  const id = Number(event.currentTarget.dataset.id || 0);
  const photoId = Number(event.currentTarget.dataset.photoId || 0);

  switch (action) {
    case "toggle-mobile-menu":
      state.mobileMenuOpen = !state.mobileMenuOpen;
      render();
      break;
    case "open-register":
      state.showRegister = true;
      render();
      break;
    case "close-register":
      state.showRegister = false;
      render();
      break;
    case "open-add-bull":
      state.showAddBull = true;
      state.mobileMenuOpen = false;
      render();
      break;
    case "close-add-bull":
      state.showAddBull = false;
      render();
      break;
    case "open-bull":
      state.selectedBullId = id;
      state.previewPhoto = null;
      state.showEditBullPhoto = false;
      render();
      break;
    case "delete-bull":
      deleteBullById(id);
      break;
    case "close-bull":
      state.selectedBullId = null;
      state.showAddPhoto = false;
      state.showEditBullPhoto = false;
      state.previewPhoto = null;
      render();
      break;
    case "open-edit-bull-photo":
      state.showEditBullPhoto = true;
      render();
      break;
    case "close-edit-bull-photo":
      state.showEditBullPhoto = false;
      render();
      break;
    case "remove-bull-photo":
      removeBullPhoto();
      break;
    case "open-add-photo":
      state.showAddPhoto = true;
      render();
      break;
    case "close-add-photo":
      state.showAddPhoto = false;
      render();
      break;
    case "preview-photo":
      openPhotoPreview(photoId);
      break;
    case "download-photo":
      downloadPhotoById(photoId);
      break;
    case "delete-photo":
      deletePhotoById(photoId);
      break;
    case "download-current-photo":
      if (state.previewPhoto) downloadPhoto(state.previewPhoto);
      break;
    case "delete-current-photo":
      if (state.previewPhoto) deletePhotoById(state.previewPhoto.id);
      break;
    case "close-preview":
      state.previewPhoto = null;
      render();
      break;
    case "export-json":
      exportJson();
      break;
    case "open-export":
      openExportModal();
      break;
    case "close-export":
      closeExportModal();
      break;
    case "select-all-export":
      state.exportSelection = state.bulls.map((bull) => bull.id);
      render();
      break;
    case "clear-export-selection":
      state.exportSelection = [];
      render();
      break;
    case "select-filtered-export":
      state.exportSelection = getFilteredBulls().map((bull) => bull.id);
      render();
      break;
    case "export-selected":
      exportSelectedJson();
      break;
    case "export-all-direct":
      exportJson(state.bulls, "alta-gallery-base-completa.json");
      closeExportModal();
      break;
    case "open-import":
      document.getElementById("import-modal")?.classList.add("show");
      state.mobileMenuOpen = false;
      break;
    case "close-import":
      closeImport();
      break;
    case "reset-data":
      if (confirm("Tem certeza que deseja resetar os dados do app?")) {
        state.bulls = clone(initialBulls);
        state.selectedBullId = null;
        state.previewPhoto = null;
        state.showEditBullPhoto = false;
        state.showExport = false;
        saveBulls();
        render();
      }
      break;
    case "logout":
      state.loggedIn = false;
      state.email = "";
      state.userName = "";
      state.mobileMenuOpen = false;
      state.showExport = false;
      sessionStorage.removeItem(SESSION_KEY);
      render();
      break;
  }
}

function deleteBullById(id) {
  const bull = state.bulls.find((item) => item.id === id);
  if (!bull) return;
  const ok = confirm(`Excluir o touro "${bull.name}"? Esta ação removerá também as fotos das filhas cadastradas.`);
  if (!ok) return;
  state.bulls = state.bulls.filter((item) => item.id !== id);
  state.exportSelection = state.exportSelection.filter((bullId) => bullId !== id);
  if (state.selectedBullId === id) {
    state.selectedBullId = null;
    state.showAddPhoto = false;
    state.showEditBullPhoto = false;
  }
  state.previewPhoto = null;
  saveBulls();
  render();
}

function removeBullPhoto() {
  const bull = getSelectedBull();
  if (!bull || !bull.bullImage) return;
  const ok = confirm(`Apagar a foto do touro "${bull.name}"?`);
  if (!ok) return;
  bull.bullImage = "";
  saveBulls();
  render();
}

function openPhotoPreview(photoId) {
  const bull = getSelectedBull();
  if (!bull) return;
  state.previewPhoto = bull.daughters.find((photo) => photo.id === photoId) || null;
  render();
}

function deletePhotoById(photoId) {
  const bull = getSelectedBull();
  if (!bull) return;
  const photo = bull.daughters.find((item) => item.id === photoId);
  if (!photo) return;

  const ok = confirm(`Apagar a foto da filha "${photo.cowName}"?`);
  if (!ok) return;

  bull.daughters = bull.daughters.filter((item) => item.id !== photoId);

  if (state.previewPhoto && state.previewPhoto.id === photoId) {
    state.previewPhoto = null;
  }

  saveBulls();
  render();
}

function downloadPhotoById(photoId) {
  const bull = getSelectedBull();
  if (!bull) return;
  const photo = bull.daughters.find((item) => item.id === photoId);
  if (!photo) return;
  downloadPhoto(photo);
}

async function downloadPhoto(photo) {
  const safeName = (photo.cowName || "foto-filha").toString().trim().replace(/[\\/:*?"<>|]+/g, "-").replace(/\s+/g, "-").toLowerCase();
  const filename = `${safeName || "foto-filha"}.jpg`;

  try {
    if (photo.image.startsWith("data:")) {
      triggerDownload(photo.image, filename);
      return;
    }

    const response = await fetch(photo.image, { mode: "cors" });
    if (!response.ok) throw new Error("download_failed");
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    triggerDownload(url, filename, true);
  } catch {
    triggerDownload(photo.image, filename);
  }
}

function triggerDownload(url, filename, revoke = false) {
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.target = "_blank";
  document.body.appendChild(a);
  a.click();
  a.remove();
  if (revoke) setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function closeImport() {
  document.getElementById("import-modal")?.classList.remove("show");
}

function exportSelectedJson() {
  const selectedBulls = state.bulls.filter((bull) => state.exportSelection.includes(bull.id));
  if (!selectedBulls.length) {
    alert("Selecione pelo menos um touro para exportar.");
    return;
  }

  const slug = selectedBulls.length === 1
    ? safeSlug(selectedBulls[0].name || selectedBulls[0].code || "selecao")
    : `${selectedBulls.length}-touros`;

  exportJson(selectedBulls, `alta-gallery-${slug}.json`);
  closeExportModal();
}

function exportJson(data = state.bulls, filename = "alta-gallery-dados.json") {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function safeSlug(value) {
  return String(value || "selecao")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/
^
-+|-+
$
/g, "") || "selecao";
}

// Config da ação
const CONFIG = {
  pricePerNumber: 0.07,        // R$ 0,07
  minQty: 50,
  maxQty: 10000,
  countdownHours: 18,
  raffleId: "bmw-x7-7motos-160",
  images: [
    { label: "IMAGEM 1", file: "imagem1.jpg" },
    { label: "IMAGEM 2", file: "imagem2.jpg" },
    { label: "IMAGEM 3", file: "imagem3.jpg" },
    { label: "IMAGEM 4", file: "imagem4.jpg" },
    { label: "IMAGEM 5", file: "imagem5.jpg" },
  ]
};

const $ = (q) => document.querySelector(q);

let qty = CONFIG.minQty;
let imgIndex = 0;

// Helpers
function brl(v){
  return v.toLocaleString("pt-BR", { style:"currency", currency:"BRL" });
}
function clamp(n, a, b){ return Math.max(a, Math.min(b, n)); }

function setQty(newQty){
  qty = clamp(newQty, CONFIG.minQty, CONFIG.maxQty);

  const qtyInput = $("#qtyInput");
  const priceText = $("#priceText");
  if (qtyInput) qtyInput.value = String(qty);
  if (priceText) priceText.textContent = brl(qty * CONFIG.pricePerNumber);
}

// Countdown (reinicia ao atualizar)
function startCountdown(){
  const el = $("#countdownTime");
  if (!el) return; // se não existir no HTML, não quebra

  const end = Date.now() + CONFIG.countdownHours * 60 * 60 * 1000;

  function tick(){
    const ms = Math.max(0, end - Date.now());
    const s = Math.floor(ms / 1000);
    const hh = String(Math.floor(s / 3600)).padStart(2,"0");
    const mm = String(Math.floor((s % 3600) / 60)).padStart(2,"0");
    const ss = String(s % 60).padStart(2,"0");
    el.textContent = `${hh}:${mm}:${ss}`;
  }

  tick();
  setInterval(tick, 1000);
}

// Gallery
function renderGallery(){
  const slide = $("#gallerySlide");
  if (!slide) return;

  const current = CONFIG.images[imgIndex];

  const img = new Image();
  img.src = current.file;

  img.onload = () => {
    slide.innerHTML = "";
    img.alt = current.label;
    img.style.width = "100%";
    img.style.height = "100%";
    img.style.objectFit = "cover";
    slide.appendChild(img);
  };

  img.onerror = () => {
    slide.innerHTML = `
      <div class="gallery__ph">
        <div class="ph__title">${current.label}</div>
        <div class="ph__sub">Troque depois (${current.file})</div>
      </div>
    `;
  };
}

function nextImg(){ imgIndex = (imgIndex + 1) % CONFIG.images.length; renderGallery(); }
function prevImg(){ imgIndex = (imgIndex - 1 + CONFIG.images.length) % CONFIG.images.length; renderGallery(); }

// storage demo
function readOrders(){
  try{ return JSON.parse(localStorage.getItem("rifa_orders") || "[]"); }
  catch(e){ return []; }
}
function findOrdersByUser(cpf, phone){
  const orders = readOrders();
  const cleanCpf = (cpf || "").replace(/\D/g,"");
  const cleanPhone = (phone || "").replace(/\D/g,"");
  return orders.filter(o =>
    (o.cpf || "").replace(/\D/g,"") === cleanCpf &&
    (o.phone || "").replace(/\D/g,"") === cleanPhone &&
    o.status === "paid"
  );
}

// Drawer + Modal
function openDrawer(){
  const d = $("#drawer");
  if(!d) return;
  d.classList.add("isOpen");
  d.setAttribute("aria-hidden","false");
}
function closeDrawer(){
  const d = $("#drawer");
  if(!d) return;
  d.classList.remove("isOpen");
  d.setAttribute("aria-hidden","true");
}

function openLogin(){
  const m = $("#loginModal");
  if(!m) return;
  m.classList.add("isOpen");
  m.setAttribute("aria-hidden","false");
}
function closeLogin(){
  const m = $("#loginModal");
  if(!m) return;
  m.classList.remove("isOpen");
  m.setAttribute("aria-hidden","true");
}

function renderTitles(list){
  const box = $("#myTitles");
  const out = $("#titlesList");
  if(!box || !out) return;

  if(!list.length){
    box.hidden = false;
    out.textContent = "Nenhum título encontrado para este CPF/telefone (ou pagamento ainda não confirmado).";
    return;
  }

  const allNumbers = list.flatMap(o => o.numbers || []);
  const chunks = [];
  for(let i=0;i<allNumbers.length;i+=20){
    chunks.push(allNumbers.slice(i, i+20).join(", "));
  }

  box.hidden = false;
  out.innerHTML = `
    <div><b>Pedidos pagos:</b> ${list.length}</div>
    <div><b>Total de números:</b> ${allNumbers.length}</div>
    <hr style="border:0;border-top:1px solid #d7d9dd;margin:10px 0;">
    ${chunks.map(c => `<div>${c}</div>`).join("")}
  `;
}

// Accordion
function toggleAccordion(){
  const btn = $("#accBtn");
  const body = $("#accBody");
  const chev = $("#accChev");
  if(!btn || !body || !chev) return;

  const expanded = btn.getAttribute("aria-expanded") === "true";
  btn.setAttribute("aria-expanded", String(!expanded));
  body.hidden = expanded;
  chev.textContent = expanded ? "▾" : "▴";
}

// checkout nav
function goCheckout(withQty){
  const q = clamp(withQty, CONFIG.minQty, CONFIG.maxQty);
  window.location.href = `./checkout.html?qty=${encodeURIComponent(q)}&rifa=${encodeURIComponent(CONFIG.raffleId)}`;
}

// Init
document.addEventListener("DOMContentLoaded", () => {
  startCountdown();
  renderGallery();
  setQty(CONFIG.minQty);

  // Promo 400 por 25,60
  const promoBtn = $("#promo400");
  if (promoBtn) {
    promoBtn.addEventListener("click", () => {
      window.location.href = `./checkout.html?promo=1&amount=25.60&qty=400&rifa=${encodeURIComponent(CONFIG.raffleId)}`;
    });
  }

  // drawer
  const btnMenu = $("#btnMenu");
  const drawerBackdrop = $("#drawerBackdrop");
  if (btnMenu) btnMenu.addEventListener("click", openDrawer);
  if (drawerBackdrop) drawerBackdrop.addEventListener("click", closeDrawer);

  // kebab
  const btnKebab = $("#btnKebab");
  if (btnKebab) btnKebab.addEventListener("click", openLogin);

  // drawer login
  const btnOpenLogin = $("#btnOpenLogin");
  if (btnOpenLogin) btnOpenLogin.addEventListener("click", () => { closeDrawer(); openLogin(); });

  // modal close
  const loginBackdrop = $("#loginBackdrop");
  const closeLoginBtn = $("#closeLogin");
  if (loginBackdrop) loginBackdrop.addEventListener("click", closeLogin);
  if (closeLoginBtn) closeLoginBtn.addEventListener("click", closeLogin);

  // login action
  const doLogin = $("#doLogin");
  if (doLogin) {
    doLogin.addEventListener("click", () => {
      const cpf = $("#loginCpf")?.value || "";
      const phone = $("#loginPhone")?.value || "";
      const list = findOrdersByUser(cpf, phone);
      const myTitles = $("#myTitles");
      if (myTitles) myTitles.hidden = false;
      renderTitles(list);
    });
  }

  // ver títulos
  const btnVer = $("#btnVerTitulosTop");
  if (btnVer) btnVer.addEventListener("click", openLogin);

  // gallery arrows
  const next = $("#nextImg");
  const prev = $("#prevImg");
  if (next) next.addEventListener("click", nextImg);
  if (prev) prev.addEventListener("click", prevImg);

  // packs add
  const packGrid = $("#packGrid");
  if (packGrid) {
    packGrid.addEventListener("click", (e) => {
      const btn = e.target.closest(".pack");
      if(!btn) return;
      const add = Number(btn.dataset.add || "0");
      setQty(qty + add);
    });
  }

  // stepper
  const plusBtn = $("#plusBtn");
  const minusBtn = $("#minusBtn");
  const qtyInput = $("#qtyInput");

  if (plusBtn) plusBtn.addEventListener("click", () => setQty(qty + 10));
  if (minusBtn) minusBtn.addEventListener("click", () => setQty(qty - 10));

  if (qtyInput) {
    qtyInput.addEventListener("input", () => {
      const n = Number((qtyInput.value || "").replace(/\D/g,"")) || CONFIG.minQty;
      setQty(n);
    });
  }

  // comprar agora / participar
  const btnComprarAgora = $("#btnComprarAgora");
  const btnParticipar = $("#btnParticipar");
  if (btnComprarAgora) btnComprarAgora.addEventListener("click", () => goCheckout(CONFIG.minQty));
  if (btnParticipar) btnParticipar.addEventListener("click", () => goCheckout(qty));

  // accordion
  const accBtn = $("#accBtn");
  if (accBtn) accBtn.addEventListener("click", toggleAccordion);
});

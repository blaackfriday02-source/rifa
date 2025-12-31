const CONFIG = {
  pricePerNumber: 0.07,
  minQty: 50,
  maxQty: 10000
};

const $ = (q) => document.querySelector(q);

function brl(v){
  return v.toLocaleString("pt-BR", { style:"currency", currency:"BRL" });
}
function clamp(n, a, b){ return Math.max(a, Math.min(b, n)); }

// Lê parâmetros
function getParams(){
  const u = new URL(location.href);
  return {
    qty: Number(u.searchParams.get("qty") || 0),
    rifa: u.searchParams.get("rifa") || "rifa",
    promo: u.searchParams.get("promo") === "1",
    amount: Number(u.searchParams.get("amount") || 0),
  };
}

// ===== Demo storage =====
function readOrders(){
  try{ return JSON.parse(localStorage.getItem("rifa_orders") || "[]"); }
  catch(e){ return []; }
}
function writeOrders(list){
  localStorage.setItem("rifa_orders", JSON.stringify(list));
}

function makeOrderId(){
  return "PED-" + Math.random().toString(16).slice(2,8).toUpperCase() + "-" + Date.now().toString().slice(-5);
}

// ===== Numero aleatório (DEMO) =====
function generateUniqueNumbersDemo(qty){
  const set = new Set();
  while(set.size < qty){
    const n = Math.floor(Math.random() * 10000000) + 1; // 1..10.000.000
    set.add(n);
  }
  return Array.from(set);
}

// ===== Estado =====
let qty = CONFIG.minQty;
let currentOrder = null;

// Promo
let isPromo = false;
let fixedAmount = null;

// ===== UI =====
function getTotal(){
  return (isPromo && fixedAmount != null) ? fixedAmount : (qty * CONFIG.pricePerNumber);
}

function renderTotals(){
  const totalEl = $("#totalText");
  const xEl = $("#xCotas");
  if (xEl) xEl.textContent = String(qty);
  if (totalEl) totalEl.textContent = brl(getTotal());
}

function setQty(newQty){
  qty = clamp(newQty, CONFIG.minQty, CONFIG.maxQty);
  const input = $("#qtyInput");
  if (input) input.value = String(qty);
  renderTotals();
}

function lockQtyControls(lock){
  const plus = $("#plusBtn");
  const minus = $("#minusBtn");
  const input = $("#qtyInput");
  if (plus) plus.disabled = lock;
  if (minus) minus.disabled = lock;
  if (input) input.disabled = lock;
}

function requireFields(){
  const name = ($("#name")?.value || "").trim();
  const phone = ($("#phone")?.value || "").trim();
  const cpf = ($("#cpf")?.value || "").trim();

  if(!name || !phone || !cpf){
    alert("Preencha nome, telefone e CPF.");
    return null;
  }
  return { name, phone, cpf };
}

// ===== Init =====
document.addEventListener("DOMContentLoaded", () => {
  const p = getParams();

  // ===== Promo: valor FIXO =====
  // Para o pack 400 por R$ 25,60, vamos fixar qty=400 e total=25,60.
  if (p.promo && p.amount > 0) {
    isPromo = true;
    fixedAmount = p.amount;

    // Se vier qty no link, usa; senão, usa 400 por padrão (promo 400)
    const promoQty = p.qty > 0 ? p.qty : 400;
    setQty(promoQty);

    lockQtyControls(true);

    const status = $("#statusText");
    if (status) status.textContent = "Promoção";

    const hint = $("#topHint");
    if (hint) hint.textContent = "promo aplicada: valor fixo (não altera no ajuste de quantidade)";

    const btnTitle = $("#btnTitle");
    if (btnTitle) btnTitle.textContent = "Criar pedido";
  } else {
    // ===== Normal =====
    isPromo = false;
    fixedAmount = null;

    const initialQty = p.qty > 0 ? p.qty : CONFIG.minQty;
    setQty(initialQty);
    lockQtyControls(false);
  }

  // Stepper (normal só funciona se não for promo)
  $("#plusBtn")?.addEventListener("click", () => { if(!isPromo) setQty(qty + 10); });
  $("#minusBtn")?.addEventListener("click", () => { if(!isPromo) setQty(qty - 10); });

  $("#qtyInput")?.addEventListener("input", () => {
    if(isPromo) return;
    const n = Number((($("#qtyInput")?.value || "")).replace(/\D/g,"")) || CONFIG.minQty;
    setQty(n);
  });

  // Criar pedido pendente
  $("#btnCriarPedido")?.addEventListener("click", () => {
    const user = requireFields();
    if(!user) return;

    const amount = getTotal();

    const order = {
      id: makeOrderId(),
      status: "pending",
      qty,
      amount,
      isPromo,
      rifa: p.rifa,
      name: user.name,
      phone: user.phone,
      cpf: user.cpf,
      createdAt: Date.now(),
      numbers: []
    };

    currentOrder = order;

    $("#pixBox").hidden = false;
    $("#orderId").textContent = order.id;
    $("#orderQty").textContent = String(order.qty);
    $("#orderAmount").textContent = brl(order.amount);
    $("#statusText").textContent = "Pendente";

    const orders = readOrders();
    orders.push(order);
    writeOrders(orders);

    window.scrollTo({ top: document.body.scrollHeight, behavior:"smooth" });
  });

  // Placeholder Kirvano
  $("#btnIrKirvano")?.addEventListener("click", () => {
    alert("Aqui você integra a Kirvano: cria pedido, redireciona pro checkout e aguarda webhook confirmar pagamento.");
  });

  // Simular pagamento confirmado
  $("#btnSimularPagamento")?.addEventListener("click", () => {
    if(!currentOrder){
      alert("Crie um pedido primeiro.");
      return;
    }

    const numbers = generateUniqueNumbersDemo(currentOrder.qty);
    currentOrder.status = "paid";
    currentOrder.numbers = numbers;

    const orders = readOrders().map(o => (o.id === currentOrder.id ? currentOrder : o));
    writeOrders(orders);

    $("#statusText").textContent = "Pago";
    $("#numbersBox").hidden = false;

    const out = $("#numbersList");
    const chunks = [];
    for(let i=0;i<numbers.length;i+=30){
      chunks.push(numbers.slice(i, i+30).join(", "));
    }

    out.innerHTML = `
      <div><b>Pedido:</b> ${currentOrder.id}</div>
      <div><b>Total:</b> ${numbers.length} números</div>
      <div><b>Valor:</b> ${brl(currentOrder.amount)}</div>
      <hr style="border:0;border-top:1px solid #d7d9dd;margin:10px 0;">
      ${chunks.map(c => `<div>${c}</div>`).join("")}
    `;

    window.scrollTo({ top: document.body.scrollHeight, behavior:"smooth" });
  });
});

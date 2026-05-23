const API = "https://rodrigopalmeida.pythonanywhere.com";

const grid = document.getElementById("rifa-grid");
const tooltip = document.getElementById("tooltip");
const modalOverlay = document.getElementById("modal-overlay");
const modalFechar = document.getElementById("modal-fechar");
const modalNumeroDisplay = document.getElementById("modal-numero-display");
const inputNome = document.getElementById("input-nome");
const inputTelefone = document.getElementById("input-telefone");
const btnConfirmar = document.getElementById("btn-confirmar");
const modalErro = document.getElementById("modal-erro");

const total = 250;
let numeroSelecionado = null;
let dadosStatus = {};


// ─── CARREGAR BILHETES ───────────────────────────────────────────
async function carregarBilhetes() {
    try {
        const resposta = await fetch(`${API}/api/status`);
        dadosStatus = await resposta.json();
        montarGrid(dadosStatus);
        atualizarContador(dadosStatus);
    } catch {
        mostrarErroGlobal("Não foi possível conectar à API.");
    }
}


// ─── MONTAR GRID ─────────────────────────────────────────────────
function montarGrid(status) {
    grid.innerHTML = "";

    for (let i = 1; i <= total; i++) {
        const info = status[i] || status[String(i)] || { status: "disponivel", nome: "" };
        const vendido = info.status === "vendido";

        const el = document.createElement("div");
        el.classList.add("numero");
        if (vendido) el.classList.add("inativo");
        el.innerText = i;
        el.dataset.numero = i;

        // Tooltip hover
        el.addEventListener("mouseenter", (e) => mostrarTooltip(e, i, info));
        el.addEventListener("mousemove", moverTooltip);
        el.addEventListener("mouseleave", esconderTooltip);

        // Clique
        if (!vendido) {
            el.addEventListener("click", () => abrirModal(i));
        }

        grid.appendChild(el);
    }
}


// ─── CONTADOR / PROGRESSO ────────────────────────────────────────
function atualizarContador(status) {
    let vendidos = 0;
    for (const key in status) {
        if (status[key].status === "vendido") vendidos++;
    }
    const disponiveis = total - vendidos;
    const pct = Math.round((vendidos / total) * 100);

    document.getElementById("vendidos-count").textContent = vendidos;
    document.getElementById("disponiveis-count").textContent = disponiveis;
    document.getElementById("barra-fill").style.width = pct + "%";
    document.getElementById("barra-pct").textContent = pct + "%";
}


// ─── TOOLTIP ─────────────────────────────────────────────────────
function mostrarTooltip(e, numero, info) {
    if (info.status === "vendido" && info.nome) {
        tooltip.innerHTML = `<span class="tt-label">Comprador</span><span class="tt-nome">${info.nome}</span>`;
        tooltip.classList.add("vendido-tt");
    } else {
        tooltip.innerHTML = `<span class="tt-disponivel">✅ Disponível</span>`;
        tooltip.classList.remove("vendido-tt");
    }
    tooltip.classList.add("visivel");
    moverTooltip(e);
}

function moverTooltip(e) {
    const offset = 14;
    let x = e.clientX + offset;
    let y = e.clientY + offset;
    // Evita sair da tela
    if (x + 160 > window.innerWidth) x = e.clientX - 160 - offset;
    if (y + 60 > window.innerHeight) y = e.clientY - 60 - offset;
    tooltip.style.left = x + "px";
    tooltip.style.top = y + "px";
}

function esconderTooltip() {
    tooltip.classList.remove("visivel");
    tooltip.classList.remove("vendido-tt");
}


// ─── MODAL ───────────────────────────────────────────────────────
function abrirModal(numero) {
    numeroSelecionado = numero;
    modalNumeroDisplay.textContent = numero;
    inputNome.value = "";
    inputTelefone.value = "";
    modalErro.textContent = "";
    modalOverlay.classList.add("visivel");
    setTimeout(() => inputNome.focus(), 100);
}

function fecharModal() {
    modalOverlay.classList.remove("visivel");
    numeroSelecionado = null;
}

modalFechar.addEventListener("click", fecharModal);

modalOverlay.addEventListener("click", (e) => {
    if (e.target === modalOverlay) fecharModal();
});

// Fechar com ESC
document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") fecharModal();
});

// Máscara simples de telefone
inputTelefone.addEventListener("input", () => {
    let v = inputTelefone.value.replace(/\D/g, "").slice(0, 11);
    if (v.length > 6) {
        v = `(${v.slice(0,2)}) ${v.slice(2,7)}-${v.slice(7)}`;
    } else if (v.length > 2) {
        v = `(${v.slice(0,2)}) ${v.slice(2)}`;
    } else if (v.length > 0) {
        v = `(${v}`;
    }
    inputTelefone.value = v;
});


// ─── CONFIRMAR COMPRA ─────────────────────────────────────────────
btnConfirmar.addEventListener("click", async () => {
    const nome = inputNome.value.trim();
    const telefone = inputTelefone.value.trim();

    if (!nome) {
        mostrarErroModal("Por favor, informe seu nome.");
        inputNome.focus();
        return;
    }
    if (!telefone || telefone.replace(/\D/g, "").length < 10) {
        mostrarErroModal("Por favor, informe um telefone válido.");
        inputTelefone.focus();
        return;
    }

    btnConfirmar.disabled = true;
    btnConfirmar.textContent = "Aguarde...";
    modalErro.textContent = "";

    try {
        const resposta = await fetch(`${API}/api/comprar`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ numero: numeroSelecionado, nome, telefone })
        });

        if (!resposta.ok) {
            const erro = await resposta.json();
            mostrarErroModal(erro.erro || "Erro ao reservar.");
            return;
        }

        fecharModal();
        await carregarBilhetes();

    } catch {
        mostrarErroModal("Erro de conexão com a API.");
    } finally {
        btnConfirmar.disabled = false;
        btnConfirmar.textContent = "Confirmar Compra";
    }
});

// Enter confirma no modal
[inputNome, inputTelefone].forEach(el => {
    el.addEventListener("keydown", (e) => {
        if (e.key === "Enter") btnConfirmar.click();
    });
});


// ─── HELPERS ─────────────────────────────────────────────────────
function mostrarErroModal(msg) {
    modalErro.textContent = msg;
}

function mostrarErroGlobal(msg) {
    grid.innerHTML = `<p style="color:#dc3545;text-align:center;grid-column:1/-1;padding:2rem;">${msg}</p>`;
}


// ─── INIT ─────────────────────────────────────────────────────────
carregarBilhetes();

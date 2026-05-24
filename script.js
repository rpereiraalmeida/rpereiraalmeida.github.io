// ─── CONFIGURAÇÃO ──────────────────────────────────────────────────────────
const API        = "https://rodrigopalmeida.pythonanywhere.com";
const TOTAL      = 250;
const COLS       = 10;
const ROWS       = 25;
const ROW_LABELS  = Array.from({ length: 25 }, (_, i) => String(i + 1));

// ─── REFS ──────────────────────────────────────────────────────────────────
const seatingArea  = document.getElementById("seating-area");
const colNumbers   = document.getElementById("col-numbers");
const tooltip      = document.getElementById("tooltip");
const ttInner      = tooltip.querySelector(".tt-inner");
const toast        = document.getElementById("toast");
const modalOverlay = document.getElementById("modal-overlay");
const modalBadge   = document.getElementById("modal-badge");
const modalClose   = document.getElementById("modal-close");
const inpNome      = document.getElementById("inp-nome");
const inpTel       = document.getElementById("inp-tel");
const btnBuy       = document.getElementById("btn-buy");
const modalErr     = document.getElementById("modal-err");
const dispCount    = document.getElementById("disp-count");
const vendCount    = document.getElementById("vend-count");
const progFill     = document.getElementById("prog-fill");
const progPct      = document.getElementById("prog-pct");

const cardSorteio   = document.getElementById("card-sorteio");
const btnSorteioSb  = document.getElementById("btn-sortear-sidebar");
const btnSorteioLbl = document.getElementById("btn-sortear-label");
const modalSorteio  = document.getElementById("modal-sorteio");
const btnSimSorteio = document.getElementById("btn-sim-sorteio");
const btnNaoSorteio = document.getElementById("btn-nao-sorteio");
const winnerOverlay = document.getElementById("winner-overlay");
const winnerNumber  = document.getElementById("winner-number");
const winnerName    = document.getElementById("winner-name");
const winnerClose   = document.getElementById("winner-close");

let dadosStatus       = {};
let numeroSelecionado = null;
let toastTimer        = null;
let sorteioOferecido  = false;

// ═══════════════════════════════════════════════════════════════════════════
// INICIALIZAÇÃO — busca dados da API
// ═══════════════════════════════════════════════════════════════════════════
async function carregarBilhetes() {
    try {
        const res   = await fetch(`${API}/api/status`);
        dadosStatus = await res.json();
        buildColHeaders();
        montarAssentos(dadosStatus);
        atualizarStats(dadosStatus);
    } catch {
        seatingArea.innerHTML =
            `<p style="color:#f87171;padding:2rem;text-align:center;grid-column:1/-1">
                ⚠ Erro ao conectar com a API.
             </p>`;
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// CABEÇALHOS DE COLUNA
// ═══════════════════════════════════════════════════════════════════════════
function buildColHeaders() {
    colNumbers.innerHTML = "";
    colNumbers.style.gridTemplateColumns = `repeat(${COLS}, var(--seat))`;
    for (let c = 1; c <= COLS; c++) {
        const el = document.createElement("div");
        el.className   = "col-num";
        el.textContent = c;
        colNumbers.appendChild(el);
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// MONTAR ASSENTOS
// ═══════════════════════════════════════════════════════════════════════════
function montarAssentos(status) {
    seatingArea.innerHTML = "";

    for (let r = 0; r < ROWS; r++) {
        const rowEl = document.createElement("div");
        rowEl.className = "seat-row";

        const lbl = document.createElement("div");
        lbl.className   = "row-label";
        lbl.textContent = ROW_LABELS[r];
        rowEl.appendChild(lbl);

        for (let c = 0; c < COLS; c++) {
            const numero  = r * COLS + c + 1;
            const info    = getInfo(numero, status);
            const vendido = info.status === "vendido";

            const seat = document.createElement("div");
            seat.className   = "seat" + (vendido ? " sold" : "");
            seat.textContent = numero;
            seat.dataset.numero = numero;
            seat.style.animationDelay = `${(r * COLS + c) * 3}ms`;

            seat.addEventListener("mouseenter", e => showTooltip(e, numero, info, r, c));
            seat.addEventListener("mousemove",  moveTooltip);
            seat.addEventListener("mouseleave", hideTooltip);

            if (vendido) {
                seat.addEventListener("click", () => mostrarIndisponivel(seat, numero, info));
            } else {
                seat.addEventListener("click", () => abrirModal(numero, r, c));
            }

            rowEl.appendChild(seat);
        }

        seatingArea.appendChild(rowEl);
    }
}

function getInfo(num, status) {
    return status[num] || status[String(num)] || { status: "disponivel", nome: "", telefone: "" };
}

// ═══════════════════════════════════════════════════════════════════════════
// STATS / CONTADORES
// ═══════════════════════════════════════════════════════════════════════════
function atualizarStats(status) {
    let vendidos = 0;
    for (const k in status) {
        if (status[k].status === "vendido") vendidos++;
    }
    const disp = TOTAL - vendidos;
    const pct  = Math.round((vendidos / TOTAL) * 100);

    dispCount.textContent = disp;
    vendCount.textContent = vendidos;
    progFill.style.width  = pct + "%";
    progPct.textContent   = pct + "%";

    // ── Botão de sorteio: sempre visível na sidebar ──────────────────────
    // Mostra o estado atual no rótulo do botão
    if (vendidos === 0) {
        // Nenhum número vendido — botão desabilitado
        btnSorteioSb.disabled = true;
        btnSorteioSb.textContent = "🏆 Sortear";
        cardSorteio.classList.remove("sorteio-pronto");
    } else if (vendidos === TOTAL) {
        // Rifa esgotada — destaque especial
        btnSorteioSb.disabled = false;
        btnSorteioSb.textContent = "🏆 Sortear Vencedor";
        cardSorteio.classList.add("sorteio-pronto");

        if (!sorteioOferecido) {
            setTimeout(() => {
                modalSorteio.classList.add("open");
                sorteioOferecido = true;
            }, 800);
        }
    } else {
        // Parcialmente vendida — permite sortear entre os vendidos
        btnSorteioSb.disabled = false;
        btnSorteioSb.textContent = `🏆 Sortear (${vendidos})`;
        cardSorteio.classList.remove("sorteio-pronto");
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// TOAST — ASSENTO INDISPONÍVEL
// ═══════════════════════════════════════════════════════════════════════════
function mostrarIndisponivel(seatEl, numero, info) {
    seatEl.classList.remove("shake");
    void seatEl.offsetWidth;
    seatEl.classList.add("shake");
    seatEl.addEventListener("animationend", () => seatEl.classList.remove("shake"), { once: true });

    const nome = info.nome ? ` — comprado por ${info.nome}` : "";
    showToast(`🚫 Número #${numero} já está vendido${nome}`);
}

function showToast(msg) {
    clearTimeout(toastTimer);
    toast.textContent = msg;
    toast.classList.add("show");
    toastTimer = setTimeout(() => toast.classList.remove("show"), 3200);
}

// ═══════════════════════════════════════════════════════════════════════════
// TOOLTIP
// ═══════════════════════════════════════════════════════════════════════════
function showTooltip(e, numero, info, r, c) {
    const vendido = info.status === "vendido";
    const col     = c + 1;
    const row     = ROW_LABELS[r];

    let html = `
        <div class="tt-row">Linha ${row} · Col ${col}</div>
        <div class="tt-number">Número #${numero}</div>
        <div class="tt-div"></div>
    `;
    if (vendido) {
        html += `<div class="tt-sold">🔴 ${info.nome || "Vendido"}</div>`;
        if (info.telefone) html += `<div class="tt-phone">📞 ${info.telefone}</div>`;
    } else {
        html += `<div class="tt-avail">🟢 Disponível · clique para comprar</div>`;
    }

    ttInner.innerHTML = html;
    tooltip.classList.add("show");
    positionTooltip(e);
}

function moveTooltip(e) { positionTooltip(e); }

function positionTooltip(e) {
    const pad = 14;
    const w   = tooltip.offsetWidth  || 180;
    const h   = tooltip.offsetHeight || 80;
    let x = e.clientX + pad;
    let y = e.clientY + pad;
    if (x + w > window.innerWidth)  x = e.clientX - w - pad;
    if (y + h > window.innerHeight) y = e.clientY - h - pad;
    tooltip.style.left = x + "px";
    tooltip.style.top  = y + "px";
}

function hideTooltip() { tooltip.classList.remove("show"); }

// ═══════════════════════════════════════════════════════════════════════════
// MODAL DE COMPRA
// ═══════════════════════════════════════════════════════════════════════════
function abrirModal(numero, r, c) {
    numeroSelecionado      = numero;
    modalBadge.textContent = `Linha ${ROW_LABELS[r]} · Col ${c + 1} · Número #${numero}`;
    inpNome.value          = "";
    inpTel.value           = "";
    modalErr.textContent   = "";
    modalOverlay.classList.add("open");
    setTimeout(() => inpNome.focus(), 80);
}

function fecharModal() {
    modalOverlay.classList.remove("open");
    numeroSelecionado = null;
}

modalClose.addEventListener("click", fecharModal);
modalOverlay.addEventListener("click", e => { if (e.target === modalOverlay) fecharModal(); });
document.addEventListener("keydown", e => { if (e.key === "Escape") fecharModal(); });

// Máscara de telefone
inpTel.addEventListener("input", () => {
    let v = inpTel.value.replace(/\D/g, "").slice(0, 11);
    if      (v.length > 6) v = `(${v.slice(0,2)}) ${v.slice(2,7)}-${v.slice(7)}`;
    else if (v.length > 2) v = `(${v.slice(0,2)}) ${v.slice(2)}`;
    else if (v.length > 0) v = `(${v}`;
    inpTel.value = v;
});

inpNome.addEventListener("keydown", e => { if (e.key === "Enter") inpTel.focus(); });
inpTel.addEventListener("keydown",  e => { if (e.key === "Enter") btnBuy.click(); });

// ═══════════════════════════════════════════════════════════════════════════
// CONFIRMAR COMPRA — POST para a API
// ═══════════════════════════════════════════════════════════════════════════
btnBuy.addEventListener("click", async () => {
    const nome     = inpNome.value.trim();
    const telefone = inpTel.value.trim();

    if (!nome) {
        modalErr.textContent = "Informe seu nome completo.";
        inpNome.focus(); return;
    }
    if (!telefone || telefone.replace(/\D/g, "").length < 10) {
        modalErr.textContent = "Informe um telefone válido.";
        inpTel.focus(); return;
    }

    btnBuy.disabled      = true;
    btnBuy.textContent   = "Aguarde...";
    modalErr.textContent = "";

    try {
        const res = await fetch(`${API}/api/comprar`, {
            method : "POST",
            headers: { "Content-Type": "application/json" },
            body   : JSON.stringify({ numero: numeroSelecionado, nome, telefone })
        });

        if (!res.ok) {
            const err = await res.json();
            modalErr.textContent = err.erro || "Erro ao reservar.";
            return;
        }

        fecharModal();
        await carregarBilhetes();

    } catch {
        modalErr.textContent = "Erro de conexão com a API.";
    } finally {
        btnBuy.disabled    = false;
        btnBuy.textContent = "✔ Confirmar Compra";
    }
});

// ═══════════════════════════════════════════════════════════════════════════
// LÓGICA DO SORTEIO
// ═══════════════════════════════════════════════════════════════════════════
btnNaoSorteio.addEventListener("click", () => {
    modalSorteio.classList.remove("open");
});

btnSimSorteio.addEventListener("click", () => {
    modalSorteio.classList.remove("open");
    iniciarSorteioAnimado();
});

// CORREÇÃO PRINCIPAL: listener direto no botão da sidebar
btnSorteioSb.addEventListener("click", () => {
    if (!btnSorteioSb.disabled) {
        iniciarSorteioAnimado();
    }
});

winnerClose.addEventListener("click", () => {
    winnerOverlay.classList.remove("open");
});

// Animação de números girando antes de mostrar o vencedor
function iniciarSorteioAnimado() {
    // Coleta apenas os números vendidos para sortear entre eles
    const vendidos = Object.keys(dadosStatus).filter(
        k => dadosStatus[k].status === "vendido"
    );

    if (vendidos.length === 0) {
        showToast("⚠ Nenhum número vendido para sortear!");
        return;
    }

    winnerOverlay.classList.add("open");
    winnerNumber.textContent = "??";
    winnerName.textContent   = "Sorteando...";

    let counter = 0;
    const tempoAnimacao = setInterval(() => {
        // Número aleatório visual (pode ser qualquer um do range)
        winnerNumber.textContent = Math.floor(Math.random() * TOTAL) + 1;
        counter++;

        if (counter > 30) {
            clearInterval(tempoAnimacao);
            finalizarSorteio(vendidos);
        }
    }, 50);
}

// Sorteia entre os números efetivamente vendidos
function finalizarSorteio(vendidos) {
    // Se não receber a lista, recalcula
    if (!vendidos) {
        vendidos = Object.keys(dadosStatus).filter(
            k => dadosStatus[k].status === "vendido"
        );
    }

    const idxAleatorio = Math.floor(Math.random() * vendidos.length);
    const sorteado     = Number(vendidos[idxAleatorio]);

    winnerNumber.textContent = sorteado;

    const info = getInfo(sorteado, dadosStatus);
    if (info.status === "vendido" && info.nome) {
        winnerName.textContent = `🎉 Parabéns, ${info.nome}! 🎉`;
    } else {
        winnerName.textContent = `Número #${sorteado} sorteado!`;
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════════════════════════════════════
carregarBilhetes();

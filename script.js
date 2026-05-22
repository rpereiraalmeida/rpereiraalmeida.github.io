const grid = document.getElementById('rifa-grid');
const totalNumeros = 250;

// 1. Função para carregar o estado salvo
const carregarEstado = () => {
    const salvos = JSON.parse(localStorage.getItem('rifa_selecionados')) || [];
    return salvos;
};

// 2. Função para salvar o estado
const salvarEstado = () => {
    const selecionados = [];
    document.querySelectorAll('.inativo').forEach(el => {
        selecionados.push(el.innerText);
    });
    localStorage.setItem('rifa_selecionados', JSON.stringify(selecionados));
};

const numerosSalvos = carregarEstado();

for (let i = 1; i <= totalNumeros; i++) {
    const celula = document.createElement('div');
    celula.classList.add('numero');
    celula.innerText = i;

    // Aplica o estado salvo ao carregar
    if (numerosSalvos.includes(i.toString())) {
        celula.classList.add('inativo');
    }

    celula.addEventListener('click', function() {
        this.classList.toggle('inativo');
        salvarEstado(); // Salva sempre que houver um clique
    });

    grid.appendChild(celula);
}

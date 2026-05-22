const grid = document.getElementById('rifa-grid');
const totalNumeros = 250;

// Lógica para criar os números de 1 a 250
for (let i = 1; i <= totalNumeros; i++) {
    const celula = document.createElement('div');
    celula.classList.add('numero');
    celula.innerText = i;

    // Evento de clique para alternar entre ativo e inativo
    celula.addEventListener('click', function() {
        this.classList.toggle('inativo');
    });

    grid.appendChild(celula);
}
const API =
"rodrigopalmeida.pythonanywhere.com";

const grid =
document.getElementById("rifa-grid");

const total = 250;


async function carregarBilhetes(){

    const resposta =
    await fetch(
        `${API}/api/status`
    );

    const dados =
    await resposta.json();

    montarGrid(dados);

}


function montarGrid(status){

    grid.innerHTML = "";

    for(let i=1;i<=total;i++){

        const numero =
        document.createElement("div");

        numero.classList.add("numero");

        numero.innerText=i;

        if(
            status[i]==="vendido"
        ){

            numero.classList.add(
                "inativo"
            );

        }

        numero.addEventListener(
            "click",
            ()=>comprar(i)
        );

        grid.appendChild(numero);

    }

}


async function comprar(numero){

    try{

        const resposta =
        await fetch(
            `${API}/api/comprar`,
            {
                method:"POST",

                headers:{
                  "Content-Type":
                  "application/json"
                },

                body:JSON.stringify({
                    numero
                })
            }
        );

        if(!resposta.ok){

            const erro =
            await resposta.json();

            alert(
                erro.erro
            );

            return;

        }

        carregarBilhetes();

    }

    catch{

        alert(
         "Erro na API"
        );

    }

}

carregarBilhetes();

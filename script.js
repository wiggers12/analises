/* ====================================
   NAVEGAÇÃO ENTRE SEÇÕES
==================================== */
const links = document.querySelectorAll('.footer-bar a');
const secoes = document.querySelectorAll('.secao');

links.forEach(link => {
  link.addEventListener('click', e => {
    e.preventDefault();
    // esconde todas
    secoes.forEach(sec => sec.classList.remove('ativo'));
    links.forEach(l => l.classList.remove('ativo'));
    // mostra só a escolhida
    const alvo = link.getAttribute('href').replace('#','');
    document.getElementById(alvo).classList.add('ativo');
    link.classList.add('ativo');
  });
});

/* ====================================
   CALLS INTELIGENTE
==================================== */
const minutosValidos = [
  1,4,7,9,11,14,17,19,21,24,27,29,
  31,34,37,39,41,44,47,49,51,54,57,59
];

const contadorElem = document.getElementById("contador");
const multElem = document.getElementById("multiplicador");
const listaHistorico = document.getElementById("lista-historico");

/* Gera multiplicador com probabilidade */
function gerarMultiplicador(){
  const chance = Math.random()*100;
  if(chance < 70) return (Math.random()*(3.5-1.8)+1.8).toFixed(2); // 70% até 3.5x
  if(chance < 95) return (Math.random()*(10-3.5)+3.5).toFixed(2); // 25% até 10x
  return (Math.random()*(100-10)+10).toFixed(2); // 5% até 100x
}

/* Define próximo horário fixo */
function proximoHorario(){
  const agora = new Date();
  let minutoAtual = agora.getMinutes();
  let horaAtual = agora.getHours();

  let proxMinuto = minutosValidos.find(m => m > minutoAtual);
  if(proxMinuto === undefined){
    proxMinuto = minutosValidos[0];
    horaAtual = (horaAtual+1)%24;
  }

  const alvo = new Date();
  alvo.setHours(horaAtual, proxMinuto, 0, 0);

  atualizarContador(alvo);
  const timer = setInterval(() => {
    const agora2 = new Date();
    let diff = Math.floor((alvo-agora2)/1000);

    if(diff <= 0){
      clearInterval(timer);
      gerarSinal(alvo);
      proximoHorario(); // recursivo para seguir rodando
    } else {
      const min = String(Math.floor(diff/60)).padStart(2,"0");
      const seg = String(diff%60).padStart(2,"0");
      contadorElem.innerText = `Próxima entrada em: ${min}:${seg}`;
    }
  },1000);
}

/* Mostra o sinal quando chega a hora */
function gerarSinal(horario){
  const mult = gerarMultiplicador();
  multElem.innerText = mult + "x";
  multElem.classList.remove("ativo");
  void multElem.offsetWidth; // hack reiniciar animação
  multElem.classList.add("ativo");

  // cor conforme valor
  if(mult >= 10) multElem.style.color = "#ff0000";   // vermelho
  else if(mult >= 5) multElem.style.color = "#00ff00"; // verde
  else multElem.style.color = "#ff4da6";             // rosa

  // adiciona no histórico
  const li = document.createElement("li");
  li.innerText = `${horario.getHours().toString().padStart(2,"0")}:${horario.getMinutes().toString().padStart(2,"0")} → ${mult}x`;

  if(mult < 3.5) li.classList.add("baixo");
  else if(mult < 10) li.classList.add("medio");
  else li.classList.add("alto");

  listaHistorico.prepend(li);
  if(listaHistorico.children.length > 5){
    listaHistorico.removeChild(listaHistorico.lastChild);
  }
}

/* Inicia o ciclo */
if(contadorElem && multElem){
  proximoHorario();
}
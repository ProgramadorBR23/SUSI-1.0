// BASE DE DADOS DOS MÉDICOS POR ÁREA
const medicosPorArea = {
    "Cardiologia": [
        { nome: "Dr. Roberto Silva", avatar: "👨‍⚕️" },
        { nome: "Dra. Ana Costa", avatar: "👩‍⚕️" }
    ],
    "Dermatologia": [
        { nome: "Dra. Patricia Lima", avatar: "👩‍⚕️" },
        { nome: "Dr. Carlos Andrade", avatar: "👨‍⚕️" }
    ],
    "Pediatria": [
        { nome: "Dr. Lucas Martins", avatar: "👨‍⚕️" },
        { nome: "Dra. Juliana Mendes", avatar: "👩‍⚕️" }
    ],
    "Ortopedia": [
        { nome: "Dr. Fernando Souza", avatar: "👨‍⚕️" }
    ]
};

// ESTADO DO FORMULÁRIO E APLICAÇÃO
let dadosFormulario = {
    paciente: "",
    especialidade: "",
    medico: "",
    prioridadeValor: 1,
    prioridadeTexto: "Tranquilo",
    dataHora: ""
};

let consultas = [];
let criterioOrdenacao = 'prioridade';

// CARREGAMENTO INICIAL
window.onload = function() {
    // Define data padrão como o momento atual
    const agora = new Date();
    agora.setMinutes(agora.getMinutes() - agora.getTimezoneOffset());
    document.getElementById('campo-data').value = agora.toISOString().slice(0, 16);

    // Carrega consultas salvas no navegador
    const dadosSalvos = localStorage.getItem('consultas_prototipo');
    if (dadosSalvos) {
        consultas = JSON.parse(dadosSalvos);
    }
    
    renderizarConsultas();
    iniciarSimulacaoTempoReal();
};

// LEITURA EM VOZ ALTA (WEB SPEECH API)
function falar(texto) {
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const mensagem = new SpeechSynthesisUtterance(texto);
        mensagem.lang = 'pt-BR';
        mensagem.rate = 0.95;
        window.speechSynthesis.speak(mensagem);
    } else {
        alert("Seu navegador não suporta leitura em voz.");
    }
}

// NAVEGAÇÃO DE PASSOS
function proximoPasso(numeroPasso) {
    if (numeroPasso === 2) {
        const nome = document.getElementById('campo-paciente').value.trim();
        if (!nome) {
            alert("Por favor, digite o nome do paciente antes de continuar.");
            falar("Digite o nome do paciente primeiro.");
            return;
        }
        dadosFormulario.paciente = nome;
    }

    if (numeroPasso === 3 && !dadosFormulario.especialidade) {
        alert("Selecione uma área médica para prosseguir.");
        falar("Escolha uma área médica para prosseguir.");
        return;
    }

    if (numeroPasso === 4 && !dadosFormulario.medico) {
        alert("Selecione um médico para continuar.");
        falar("Escolha um médico para continuar.");
        return;
    }

    document.querySelectorAll('.etapa').forEach(el => el.classList.remove('ativa'));
    document.getElementById(`etapa-${numeroPasso}`).classList.add('ativa');
}

// SELEÇÃO DE ESPECIALIDADE
function selecionarEspecialidade(especialidade, elemento) {
    dadosFormulario.especialidade = especialidade;
    dadosFormulario.medico = "";

    const grupo = elemento.parentElement;
    grupo.querySelectorAll('.card-opcao').forEach(el => el.classList.remove('selecionado'));
    elemento.classList.add('selecionado');

    const gridMedicos = document.getElementById('grid-medicos');
    gridMedicos.innerHTML = "";

    const medicos = medicosPorArea[especialidade] || [];
    medicos.forEach(m => {
        const card = document.createElement('div');
        card.className = 'card-opcao';
        card.onclick = function() { selecionarMedico(m.nome, this); };
        card.innerHTML = `<span class="icone">${m.avatar}</span><span class="texto">${m.nome}</span>`;
        gridMedicos.appendChild(card);
    });

    falar(`Área escolhida: ${especialidade}`);
}

// SELEÇÃO DE MÉDICO
function selecionarMedico(nomeMedico, elemento) {
    dadosFormulario.medico = nomeMedico;
    const grupo = elemento.parentElement;
    grupo.querySelectorAll('.card-opcao').forEach(el => el.classList.remove('selecionado'));
    elemento.classList.add('selecionado');

    falar(`Médico escolhido: ${nomeMedico}`);
}

// SELEÇÃO DE PRIORIDADE / URGÊNCIA
function selecionarPrioridade(valor, texto, elemento) {
    dadosFormulario.prioridadeValor = valor;
    dadosFormulario.prioridadeTexto = texto;

    const grupo = elemento.parentElement;
    grupo.querySelectorAll('.card-opcao').forEach(el => el.classList.remove('selecionado'));
    elemento.classList.add('selecionado');

    falar(`Urgência selecionada: ${texto}`);
}

// FINALIZAR E AGENDAR
function finalizarAgendamento() {
    const dataHoraVal = document.getElementById('campo-data').value;
    if (!dataHoraVal) {
        alert("Por favor, insira a data e hora.");
        return;
    }

    dadosFormulario.dataHora = dataHoraVal;

    const novaConsulta = {
        id: Date.now(),
        paciente: dadosFormulario.paciente,
        especialidade: dadosFormulario.especialidade,
        medico: dadosFormulario.medico,
        prioridadeValor: dadosFormulario.prioridadeValor,
        prioridadeTexto: dadosFormulario.prioridadeTexto,
        dataHora: dadosFormulario.dataHora
    };

    consultas.push(novaConsulta);
    salvarELatualizar();

    falar(`Consulta agendada com sucesso para ${novaConsulta.paciente}!`);
    alert("✅ Agendamento concluído com sucesso!");

    dadosFormulario = { paciente: "", especialidade: "", medico: "", prioridadeValor: 1, prioridadeTexto: "Tranquilo", dataHora: "" };
    document.getElementById('campo-paciente').value = "";
    document.querySelectorAll('.card-opcao').forEach(el => el.classList.remove('selecionado'));
    proximoPasso(1);
}

// ORDENAÇÃO E RENDERIZAÇÃO
function mudarOrdenacao(criterio) {
    criterioOrdenacao = criterio;
    document.getElementById('btn-ordem-prioridade').classList.toggle('ativo', criterio === 'prioridade');
    document.getElementById('btn-ordem-data').classList.toggle('ativo', criterio === 'data');
    renderizarConsultas();
}

function renderizarConsultas() {
    const container = document.getElementById('lista-consultas');
    container.innerHTML = "";

    if (consultas.length === 0) {
        container.innerHTML = `<p class="mensagem-vazia">Nenhuma consulta agendada no momento.</p>`;
        return;
    }

    // Ordenar lista
    consultas.sort((a, b) => {
        if (criterioOrdenacao === 'prioridade') {
            return b.prioridadeValor - a.prioridadeValor;
        } else {
            return new Date(a.dataHora) - new Date(b.dataHora);
        }
    });

    consultas.forEach(item => {
        const dataFmt = new Date(item.dataHora).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
        
        const card = document.createElement('div');
        card.className = `card-consulta p-${item.prioridadeValor}`;
        card.innerHTML = `
            <div class="consulta-header">
                <span class="consulta-paciente">👤 ${item.paciente}</span>
                <span class="consulta-tag tag-${item.prioridadeValor}">${item.prioridadeTexto}</span>
            </div>
            <div class="consulta-detalhe">🩺 <strong>Especialidade:</strong> ${item.especialidade}</div>
            <div class="consulta-detalhe">👨‍⚕️ <strong>Médico:</strong> ${item.medico}</div>
            <div class="consulta-detalhe">📅 <strong>Data/Hora:</strong> ${dataFmt}</div>
            <div class="consulta-acoes">
                <button class="btn-ouvir-card" onclick="falar('Consulta de ${item.paciente} com ${item.medico}. Gravidade: ${item.prioridadeTexto}')">🔊 Ouvir Dados</button>
                <button class="btn-cancelar-card" onclick="cancelarConsulta(${item.id})">🗑️ Cancelar</button>
            </div>
        `;
        container.appendChild(card);
    });
}

function cancelarConsulta(id) {
    if (confirm("Deseja mesmo cancelar esta consulta?")) {
        consultas = consultas.filter(c => c.id !== id);
        salvarELatualizar();
        falar("Consulta cancelada.");
    }
}

function salvarELatualizar() {
    localStorage.setItem('consultas_prototipo', JSON.stringify(consultas));
    renderizarConsultas();
}

// POLLING PARA SINCRONIZAÇÃO
function iniciarSimulacaoTempoReal() {
    setInterval(() => {
        const dados = localStorage.getItem('consultas_prototipo');
        if (dados) {
            const dadosNovos = JSON.parse(dados);
            if (JSON.stringify(dadosNovos) !== JSON.stringify(consultas)) {
                consultas = dadosNovos;
                renderizarConsultas();
            }
        }
    }, 3000);
}

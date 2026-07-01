const express = require('express');
const app = express();
app.use(express.json());

app.post('/calcular-lucro', (req, res) => {
    // 1. Puxa os valores acumulados anteriores
    let lucro25 = Number(req.body.lucro_acumulado_25) || 0;
    let lucro30 = Number(req.body.lucro_acumulado_30) || 0;
    let valorBruto = Number(req.body.valor_bruto) || 0;
    let tipoLavagem = req.body.tipo; 

    // 2. Soma o novo valor ao histórico acumulado
    if (tipoLavagem === 'parceiro') {
        lucro25 += (valorBruto * 0.25);
    } else if (tipoLavagem === 'nao_parceiro') {
        lucro30 += (valorBruto * 0.30);
    }

    // 3. Processa a matemática global do relatório
    let faturamentoCheio = (lucro25 * 4) + (lucro30 / 0.30);
    let lucroRealGeral = lucro25 + lucro30;
    let retido25 = lucro25 * 3;
    let retido30 = lucro30 * 2.3333;

    // Função interna para colocar os pontos no padrão brasileiro (ex: 2.000.000,00)
    const formatarBR = (num) => num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    // 4. Retorna os valores brutos para o BotGhost salvar E os valores com pontos para o texto
    res.json({
        // Guarda os números puros para o bloco "Set Variable" salvar no banco de dados sem quebrar
        lucro_puro_25: lucro25,
        lucro_puro_30: lucro30,
        
        // Envia os textos com pontos perfeitos para você exibir na mensagem do Discord
        lucro_acumulado_25: formatarBR(lucro25),
        lucro_acumulado_30: formatarBR(lucro30),
        faturamento_total: formatarBR(faturamentoCheio),
        lucro_total_misturado: formatarBR(lucroRealGeral),
        liquido_retido_25: formatarBR(retido25),
        liquido_retido_30: formatarBR(retido30)
    });
});

app.listen(3000, () => console.log('API Ollympyus com Pontuação BR Rodando!'));

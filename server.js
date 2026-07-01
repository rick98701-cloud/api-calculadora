const express = require('express');
const app = express();
app.use(express.json());

app.post('/calcular-lucro', (req, res) => {
    // 1. Limpa e converte os valores brutos recebidos para números reais
    let lucro25 = parseFloat(String(req.body.lucro_acumulado_25).replace(/[^\d.-]/g, '')) || 0;
    let lucro30 = parseFloat(String(req.body.lucro_acumulado_30).replace(/[^\d.-]/g, '')) || 0;
    let valorBruto = parseFloat(String(req.body.valor_bruto).replace(/[^\d.-]/g, '')) || 0;
    let tipoLavagem = req.body.tipo; 

    // 2. Acumula os valores somando o clique atual com o histórico
    if (tipoLavagem === 'parceiro') {
        lucro25 += (valorBruto * 0.25);
    } else if (tipoLavagem === 'nao_parceiro') {
        lucro30 += (valorBruto * 0.30);
    }

    // 3. Processa a matemática global do painel
    let faturamentoCheio = (lucro25 * 4) + (lucro30 / 0.30);
    let lucroRealGeral = lucro25 + lucro30;
    let retido25 = lucro25 * 3;
    let retido30 = lucro30 * 2.3333;

    // FUNÇÃO CORRIGIDA: Garante a conversão forçada para aplicar os pontos padrão BR
    const formatarBR = (num) => {
        return Number(num).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    // 4. Retorna as respostas limpas e tratadas para o BotGhost
    res.json({
        // Salva puro no banco de dados para os blocos azuis "Set Variable" continuarem somando
        lucro_puro_25: lucro25,
        lucro_puro_30: lucro30,
        
        // Formata com pontos para pular lindo e mastigado no texto do Discord
        lucro_acumulado_25: formatarBR(lucro25),
        lucro_acumulado_30: formatarBR(lucro30),
        faturamento_total: formatarBR(faturamentoCheio),
        lucro_total_misturado: formatarBR(lucroRealGeral),
        liquido_retido_25: formatarBR(retido25),
        liquido_retido_30: formatarBR(retido30)
    });
});

app.listen(3000, () => console.log('API Ollympyus Pontuação BR Definitiva!'));

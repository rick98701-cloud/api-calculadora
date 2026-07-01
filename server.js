const express = require('express');
const app = express();
app.use(express.json());

app.post('/calcular-lucro', (req, res) => {
    // 1. Converte as entradas do banco de dados e limpa os valores
    let lucro25 = parseFloat(String(req.body.lucro_acumulado_25).replace(/[^\d.-]/g, '')) || 0;
    let lucro30 = parseFloat(String(req.body.lucro_acumulado_30).replace(/[^\d.-]/g, '')) || 0;
    let valorBruto = parseFloat(String(req.body.valor_bruto).replace(/[^\d.-]/g, '')) || 0;
    let tipoLavagem = req.body.tipo; 

    // 2. Acumula os valores conforme a categoria escolhida no clique
    if (tipoLavagem === 'parceiro') {
        lucro25 += (valorBruto * 0.25);
    } else if (tipoLavagem === 'nao_parceiro') {
        lucro30 += (valorBruto * 0.30);
    }

    // 3. Processa a matemática geral do monitoramento
    let faturamentoCheio = (lucro25 * 4) + (lucro30 / 0.30);
    let lucroRealGeral = lucro25 + lucro30;
    let retido25 = lucro25 * 3;
    let retido30 = lucro30 * 2.3333;

    // Função interna para aplicar os pontos padrão brasileiro (ex: 2.000.000,00)
    const formatarBR = (num) => {
        return Number(num).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    // 4. Retorna os dados mapeados de forma inteligente
    res.json({
        // IMPORTANTE: Arredonda para número inteiro (Math.round) para o BotGhost aceitar salvar de primeira
        lucro_puro_25: Math.round(lucro25),
        lucro_puro_30: Math.round(lucro30),
        
        // Mantém a formatação completa com pontos e centavos para a mensagem do Discord
        lucro_acumulado_25: formatarBR(lucro25),
        lucro_acumulado_30: formatarBR(lucro30),
        faturamento_total: formatarBR(faturamentoCheio),
        lucro_total_misturado: formatarBR(lucroRealGeral),
        liquido_retido_25: formatarBR(retido25),
        liquido_retido_30: formatarBR(retido30)
    });
});

app.listen(3000, () => console.log('API Ollympyus Integrada com Sucesso!'));

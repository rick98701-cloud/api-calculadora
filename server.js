const express = require('express');
const app = express();
app.use(express.json());

app.post('/calcular-lucro', (req, res) => {
    // 1. Limpa e converte as entradas diretamente de texto para números decimais reais
    let lucro25 = parseFloat(String(req.body.lucro_acumulado_25).replace(/[^\d.-]/g, '')) || 0;
    let lucro30 = parseFloat(String(req.body.lucro_acumulado_30).replace(/[^\d.-]/g, '')) || 0;
    let valorBruto = parseFloat(String(req.body.valor_bruto).replace(/[^\d.-]/g, '')) || 0;
    let tipoLavagem = req.body.tipo; 

    // 2. Acumula os valores conforme o clique atual de registro
    if (tipoLavagem === 'parceiro') {
        lucro25 += (valorBruto * 0.25);
    } else if (tipoLavagem === 'nao_parceiro') {
        lucro30 += (valorBruto * 0.30);
    } else if (tipoLavagem === 'leitura') {
        // Modo leitura explícito: garante que as variáveis mantenham o valor original vindo do BotGhost
        lucro25 = lucro25;
        lucro30 = lucro30;
    }

    // 3. Processa a matemática global do monitoramento com precisão decimal exata
    let faturamentoCheio = (lucro25 * 4) + (lucro30 / 0.30);
    let lucroRealGeral = lucro25 + lucro30;
    
    // Fórmulas exatas baseadas nas taxas (75% retido para parceiros e 70% retido para não parceiros)
    let retido25 = lucro25 * 3; 
    let retido30 = (lucro30 / 0.30) * 0.70; // Substitui o 2.3333 por divisão/multiplicação real para evitar quebra de centavos

    // Função interna para aplicar os pontos padrão brasileiro (ex: 2.000.000,00)
    const formatarBR = (num) => {
        // Corrige flutuações decimais JavaScript antes de formatar o texto para o Discord
        const numeroArredondado = Math.round((num + Number.EPSILON) * 100) / 100;
        return numeroArredondado.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    // 4. Retorna os dados mapeados para o BotGhost
    res.json({
        // Envia o número decimal puro formatado como TEXTO fixo com duas casas decimais para o BotGhost salvar sem rejeição
        lucro_puro_25: lucro25.toFixed(2),
        lucro_puro_30: lucro30.toFixed(2),
        
        // Envia os textos com os pontos de milhar para a tela do Discord
        lucro_acumulado_25: formatarBR(lucro25),
        lucro_acumulado_30: formatarBR(lucro30),
        faturamento_total: formatarBR(faturamentoCheio),
        lucro_total_misturado: formatarBR(lucroRealGeral),
        liquido_retido_25: formatarBR(retido25),
        liquido_retido_30: formatarBR(retido30)
    });
});

app.listen(3000, () => console.log('API Ollympyus Decimal String Rodando!'));

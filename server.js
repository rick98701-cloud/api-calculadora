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
        lucro25 = lucro25;
        lucro30 = lucro30;
    }

    // 3. Processa a matemática global com precisão decimal exata
    let faturamentoCheio = (lucro25 * 4) + (lucro30 / 0.30);
    let lucroRealGeral = lucro25 + lucro30;
    let retido25 = lucro25 * 3; 
    let retido30 = (lucro30 / 0.30) * 0.70;

    // Função interna para aplicar os pontos padrão brasileiro
    const formatarBR = (num) => {
        const numeroArredondado = Math.round((num + Number.EPSILON) * 100) / 100;
        return numeroArredondado.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    // 4. GERAÇÃO AUTOMÁTICA DE GRÁFICOS VISUAIS (Formato Limpo e Escuro para o Discord)
    // Se ambos os lucros forem zero, define valores padrão (1, 1) para o gráfico não nascer quebrado
    let g25 = lucro25 === 0 && lucro30 === 0 ? 1 : lucro25;
    let g30 = lucro25 === 0 && lucro30 === 0 ? 1 : lucro30;
    
    const urlGraficoPizza = `https://quickchart.io{type:%27pie%27,data:{labels:[%27Parceiros%27,%27Nao%20Parceiros%27],datasets:[{data:[${g25},${g30}],backgroundColor:[%27%232ecc71%27,%27%23e74c3c%27]}]}}`;

    // 5. Retorna os dados mapeados para o BotGhost incluindo os links dos gráficos
    res.json({
        lucro_puro_25: lucro25.toFixed(2),
        lucro_puro_30: lucro30.toFixed(2),
        lucro_acumulado_25: formatarBR(lucro25),
        lucro_acumulado_30: formatarBR(lucro30),
        faturamento_total: formatarBR(faturamentoCheio),
        lucro_total_misturado: formatarBR(lucroRealGeral),
        liquido_retido_25: formatarBR(retido25),
        liquido_retido_30: formatarBR(retido30),
        // Tag gerada pela API para colocar no campo Image URL do BotGhost
        grafico_url: urlGraficoPizza
    });
});

app.listen(3000, () => console.log('API Ollympyus Decimal String + Gráficos Rodando!'));

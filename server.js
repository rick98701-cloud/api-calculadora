const express = require('express');
const ChartJsImage = require('chartjs-to-image');
const app = express();
app.use(express.json());

app.post('/calcular-lucro', async (req, res) => {
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

    // 4. GERAÇÃO DO GRÁFICO DIRETAMENTE NO SERVIDOR
    let g25 = lucro25 === 0 && lucro30 === 0 ? 1 : lucro25;
    let g30 = lucro25 === 0 && lucro30 === 0 ? 1 : lucro30;

    let urlGraficoPizza = "";
    try {
        const myChart = new ChartJsImage();
        myChart.setConfig({
            type: 'pie',
            data: {
                labels: ['Parceiros', 'Nao Parceiros'],
                datasets: [{
                    data: [g25, g30],
                    backgroundColor: ['#2ecc71', '#e74c3c']
                }]
            },
            options: {
                legend: { labels: { fontColor: '#ffffff', fontSize: 14 } },
                title: { display: true, text: 'Divisao de Lucros Ollympyus', fontColor: '#ffffff', fontSize: 18 }
            }
        });
        myChart.setBackgroundColor('#1b1c21');
        
        // Retorna uma URL curta e pré-renderizada estável para o BotGhost
        urlGraficoPizza = await myChart.getShortUrl();
    } catch (error) {
        console.log("Erro ao gerar gráfico:", error);
        // Fallback caso a API de renderização falhe
        urlGraficoPizza = "https://quickchart.io:[%27Erro%27],datasets:[%7Bdata:[1]%7D]%7D%7D";
    }

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
        grafico_url: urlGraficoPizza
    });
});

app.listen(3000, () => console.log('API Ollympyus Gráficos Estáticos Rodando!'));

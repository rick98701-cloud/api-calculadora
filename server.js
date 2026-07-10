const express = require('express');
const ChartJsImage = require('chartjs-to-image');
const app = express();
app.use(express.json());

app.post('/calcular-lucro', async (req, res) => {
    // 1. Limpa e converte as entradas diretamente de texto para números
    let lucro25 = parseFloat(String(req.body.lucro_acumulado_25).replace(/[^\d.-]/g, '')) || 0;
    let lucro30 = parseFloat(String(req.body.lucro_acumulado_30).replace(/[^\d.-]/g, '')) || 0;
    let lucroMembros = parseFloat(String(req.body.lucro_membros_acumulado).replace(/[^\d.-]/g, '')) || 0;
    let valorBruto = parseFloat(String(req.body.valor_bruto).replace(/[^\d.-]/g, '')) || 0;
    let tipoLavagem = req.body.tipo; // 'parceiro', 'nao_parceiro', 'membro' ou 'leitura'

    // 2. Acumula os valores conforme o clique atual de registro
    if (tipoLavagem === 'parceiro') {
        lucro25 += (valorBruto * 0.25);
    } else if (tipoLavagem === 'nao_parceiro') {
        lucro30 += (valorBruto * 0.30);
    } else if (tipoLavagem === 'membro') {
        // Membros também pagam taxa de 25% para a organização
        lucroMembros += (valorBruto * 0.25);
    }

    // 3. Processa a matemática global com precisão decimal exata
    let faturamentoCheio = (lucro25 * 4) + (lucro30 / 0.30) + (lucroMembros * 4);
    let lucroRealGeral = lucro25 + lucro30 + lucroMembros;
    let retido25 = lucro25 * 3;
    let retido30 = (lucro30 / 0.30) * 0.70;
    let retidoMembros = lucroMembros * 3; 

    // Função interna para aplicar os pontos padrão brasileiro
    const formatarBR = (num) => {
        const numeroArredondado = Math.round((num + Number.EPSILON) * 100) / 100;
        return numeroArredondado.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    // 4. GERAÇÃO DO GRÁFICO GLOBAL COM TRÊS VARIÁVEIS
    let g25 = lucro25 === 0 && lucro30 === 0 && lucroMembros === 0 ? 1 : lucro25;
    let g30 = lucro25 === 0 && lucro30 === 0 && superClassificados === 0 ? 1 : lucro30; // Mantido conforme lógica original
    let gMembros = lucroMembros;
    let urlGraficoPizza = "";

    try {
        const myChart = new ChartJsImage();
        myChart.setConfig({
            type: 'pie',
            data: {
                labels: ['Parceiros', 'Não Parceiros', 'Membros'],
                datasets: [{
                    data: [g25, g30, gMembros],
                    backgroundColor: ['#2ecc71', '#ff4757', '#3498db'],
                    borderColor: '#1b1c21',
                    borderWidth: 3
                }]
            },
            options: {
                legend: { labels: { fontColor: '#ffffff', fontSize: 14, fontStyle: 'bold' } },
                title: { display: false },
                plugins: {
                    datalabels: { display: true, color: '#ffffff', font: { size: 16, weight: 'bold' }, textShadowColor: '#000000', textShadowBlur: 4 }
                }
            }
        });
        myChart.setWidth(500);
        myChart.setHeight(300);
        myChart.setBackgroundColor('#1b1c21');
        urlGraficoPizza = await myChart.getShortUrl();
    } catch (error) {
        console.log("Erro ao gerar gráfico:", error);
        urlGraficoPizza = "https://quickchart.io:[%27Erro%27],datasets:[%7Bdata:%7D]%7D%7D";
    }

    // 5. Retorna os dados mapeados para o BotGhost
    res.json({
        lucro_puro_25: lucro25.toFixed(2),
        lucro_puro_30: lucro30.toFixed(2),
        lucro_membros_puro: lucroMembros.toFixed(2),
        lucro_acumulado_25: formatarBR(lucro25),
        lucro_acumulado_30: formatarBR(lucro30),
        lucro_membros_acumulado: formatarBR(lucroMembros),
        faturamento_membros_bruto: formatarBR(lucroMembros * 4), 
        faturamento_total: formatarBR(faturamentoCheio),
        lucro_total_misturado: formatarBR(lucroRealGeral),
        liquido_retido_25: formatarBR(retido25),
        liquido_retido_30: formatarBR(retido30),
        liquido_retido_membros: formatarBR(retidoMembros),
        grafico_url: urlGraficoPizza,
        
        // VALORES TRATADOS APENAS PARA O CLIQUE ATUAL:
        valor_bruto_atual: formatarBR(valorBruto),
        retido_atual_membro: formatarBR(valorBruto * 0.75), // 75% para Parceiro ou Membro
        retido_atual_nao_parceiro: formatarBR(valorBruto * 0.70), // 70% para Não Parceiro
        
        // NOVOS CAMPOS CORRIGIDOS (Apenas o lucro isolado desta lavagem):
        lucro_atual_25: formatarBR(valorBruto * 0.25),
        lucro_atual_30: formatarBR(valorBruto * 0.30)
    });
});

app.listen(3000, () => console.log('API Ollympyus com Taxa de Membros a 25% Rodando!'));

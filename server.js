const express = require('express');
const ChartJsImage = require('chartjs-to-image');
const app = express();

app.use(express.json());

app.post('/calcular-lucro', async (req, res) => {
    // 1. Resgata o histórico acumulado enviado pelo BotGhost (Trata texto para número)
    let lucro25 = parseFloat(String(req.body.lucro_acumulado_25).replace(/[^\d.-]/g, '')) || 0;
    let lucro30 = parseFloat(String(req.body.lucro_acumulado_30).replace(/[^\d.-]/g, '')) || 0;
    let lucroMembros = parseFloat(String(req.body.lucro_membros_acumulado).replace(/[^\d.-]/g, '')) || 0;
    
    // Valor enviado no clique atual
    let valorBruto = parseFloat(String(req.body.valor_bruto).replace(/[^\d.-]/g, '')) || 0;
    let tipoLavagem = req.body.tipo; // 'parceiro', 'nao_parceiro' ou 'membro'

    // Variáveis de controle para o clique atual (Retornos da embed)
    let lucroVigenteMembro = 0;
    let retidoVigenteMembro = 0;
    let ganhoBrutoMembroAtual = 0;
    
    let lucroAtualParceiro = 0;
    let lucroAtualNaoParceiro = 0;

    // 2. PROCESSAMENTO DO CLIQUE ATUAL (Garante que cada tipo calcule e acumule isoladamente)
    if (tipoLavagem === 'membro') {
        if (req.body.origem_dinheiro === 'repasse') {
            ganhoBrutoMembroAtual = valorBruto * 0.25; 
            lucroVigenteMembro = ganhoBrutoMembroAtual * 0.25; 
            retidoVigenteMembro = ganhoBrutoMembroAtual * 0.75;
        } else {
            ganhoBrutoMembroAtual = valorBruto;
            lucroVigenteMembro = valorBruto * 0.25;
            retidoVigenteMembro = valorBruto * 0.75;
        }
        lucroMembros += lucroVigenteMembro; // Soma ao acumulado global de membros
    } 
    
    else if (tipoLavagem === 'parceiro') {
        lucroAtualParceiro = valorBruto * 0.25; // Calcula 25% de lucro para a facção
        lucro25 += lucroAtualParceiro;          // Soma ao acumulado global de parceiros
    } 
    
    else if (tipoLavagem === 'nao_parceiro') {
        lucroAtualNaoParceiro = valorBruto * 0.30; // Calcula 30% de lucro para a facção
        lucro30 += lucroAtualNaoParceiro;          // Soma ao acumulado global de não parceiros
    }

    // 3. MATEMÁTICA GLOBAL ATUALIZADA (Reconstrução reversa exata)
    let faturamentoParceiros = lucro25 * 4;
    let faturamentoNaoParceiros = lucro30 / 0.30;
    let faturamentoMembros = lucroMembros * 4; 
    
    let faturamentoCheio = faturamentoParceiros + faturamentoNaoParceiros + faturamentoMembros;
    let lucroRealGeral = lucro25 + lucro30 + lucroMembros;

    // Valores totais devolvidos/retidos dos clientes
    let retido25 = lucro25 * 3;
    let retido30 = lucro30 * (0.70 / 0.30); 
    let retidoMembros = lucroMembros * 3;

    // Formatação padrão brasileiro (R$ 1.000,00)
    const formatarBR = (num) => {
        const numeroArredondado = Math.round((num + Number.EPSILON) * 100) / 100;
        return numeroArredondado.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    // 4. GERAÇÃO DO GRÁFICO (Evita valores zerados para não quebrar o Chart.js)
    let g25 = lucro25 === 0 ? 0.1 : lucro25;
    let g30 = lucro30 === 0 ? 0.1 : lucro30;
    let gMembros = lucroMembros === 0 ? 0.1 : lucroMembros;
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
                plugins: { datalabels: { display: true, color: '#ffffff', font: { size: 16, weight: 'bold' } } }
            }
        });
        myChart.setWidth(500); myChart.setHeight(300); myChart.setBackgroundColor('#1b1c21');
        urlGraficoPizza = await myChart.getShortUrl();
    } catch (error) {
        urlGraficoPizza = "https://unsplash.com"; 
    }

    // 5. RESPOSTA DO LABELS PARA O BOTGHOST
    res.json({
        // Envia de volta os novos acumulados brutos (Guarde em variáveis globais no BotGhost)
        lucro_puro_25: lucro25.toFixed(2),
        lucro_puro_30: lucro30.toFixed(2),
        lucro_membros_puro: lucroMembros.toFixed(2),
        
        // Strings formatadas para exibição direta em Embeds
        lucro_acumulado_25: formatarBR(lucro25),
        lucro_acumulado_30: formatarBR(lucro30),
        lucro_membros_acumulado: formatarBR(lucroMembros),
        
        faturamento_membros_bruto: formatarBR(faturamentoMembros),
        faturamento_total: formatarBR(faturamentoCheio),
        lucro_total_misturado: formatarBR(lucroRealGeral),
        
        liquido_retido_25: formatarBR(retido25),
        liquido_retido_30: formatarBR(retido30),
        liquido_retido_membros: formatarBR(retidoMembros),
        grafico_url: urlGraficoPizza,
        
        // VALORES INDIVIDUAIS DO CLIQUE ATUAL:
        valor_bruto_atual: formatarBR(valorBruto),
        ganho_bruto_membro: formatarBR(ganhoBrutoMembroAtual), 
        
        // Retornos dinâmicos para a resposta imediata da lavagem atual
        lucro_atual_25: tipoLavagem === 'parceiro' ? formatarBR(lucroAtualParceiro) : formatarBR(lucroVigenteMembro), 
        lucro_atual_30: formatarBR(lucroAtualNaoParceiro),
        retido_atual_membro: formatarBR(retidoVigenteMembro), 
        retido_atual_nao_parceiro: formatarBR(valorBruto * 0.70),
        retido_atual_parceiro: formatarBR(valorBruto * 0.75)
    });
});

app.listen(3000, () => console.log('API Ollympyus Rodando e Corrigida!'));

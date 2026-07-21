const express = require('express');
const ChartJsImage = require('chartjs-to-image');
const app = express();

app.use(express.json());

app.post('/calcular-lucro', async (req, res) => {
    // Tratamento inteligente para ler o padrão monetário do BotGhost sem quebrar números
    const converterMoedaParaNumero = (valor) => {
        if (!valor) return 0;
        let texto = String(valor).replace(/R\$\s?/g, '').trim(); // Remove o símbolo "R$" se houver
        
        // Se contiver pontos e vírgulas (Ex: 30.000,00 ou 1.250.500,00)
        if (texto.includes(',') && texto.includes('.')) {
            texto = texto.replace(/\./g, '').replace(',', '.');
        } else if (texto.includes(',')) {
            // Se contiver apenas a vírgula decimal (Ex: 30000,00)
            texto = texto.replace(',', '.');
        }
        return parseFloat(texto) || 0;
    };

    // 1. Captura as entradas enviadas pelo painel do seu bot
    let lucro25 = converterMoedaParaNumero(req.body.lucro_acumulado_25);
    let lucro30 = converterMoedaParaNumero(req.body.lucro_acumulado_30);
    let lucroMembros = converterMoedaParaNumero(req.body.lucro_membros_acumulado);
    let valorBruto = converterMoedaParaNumero(req.body.valor_bruto);
    let tipoLavagem = req.body.tipo; 

    // Variáveis de controle para o clique atual de registro
    let lucroVigenteMembro = 0;
    let retidoVigenteMembro = 0;
    let ganhoBrutoMembroAtual = 0;

    let lucroAtualParceiro = 0;
    let lucroAtualNaoParceiro = 0;

    // 2. Processamento do cálculo com base no tipo selecionado no Request Body
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
        lucroMembros += lucroVigenteMembro;
    } 
    else if (tipoLavagem === 'parceiro') {
        lucroAtualParceiro = valorBruto * 0.25; // 25% de lucro da facção
        lucro25 += lucroAtualParceiro;          // Soma ao histórico acumulado de parceiros
    } 
    else if (tipoLavagem === 'nao_parceiro') {
        lucroAtualNaoParceiro = valorBruto * 0.30; // 30% de lucro da facção
        lucro30 += lucroAtualNaoParceiro;          // Soma ao histórico acumulado de não parceiros
    }

    // 3. Processa a matemática global com precisão decimal exata
    let faturamentoParceiros = lucro25 * 4;
    let faturamentoNaoParceiros = lucro30 / 0.30;
    let faturamentoMembros = lucroMembros * 4;

    let faturamentoCheio = faturamentoParceiros + faturamentoNaoParceiros + faturamentoMembros;
    let lucroRealGeral = lucro25 + lucro30 + lucroMembros;
    
    let retido25 = lucro25 * 3;
    let retido30 = lucro30 * (0.70 / 0.30);
    let retidoMembros = lucroMembros * 3;

    // Função interna para aplicar os pontos padrão brasileiro (R$ 1.000,00)
    const formatarBR = (num) => {
        const numeroArredondado = Math.round((num + Number.EPSILON) * 100) / 100;
        return numeroArredondado.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    // 4. GERAÇÃO DO GRÁFICO GLOBAL (Evita valores zerados usando fallback seguro de 0.1)
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

    // 5. Retorna os dados mapeados mantendo compatibilidade com suas chaves de Embed
    res.json({
        lucro_puro_25: lucro25.toFixed(2),
        lucro_puro_30: lucro30.toFixed(2),
        lucro_membros_puro: lucroMembros.toFixed(2),
        
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
        
        // VALORES TRATADOS APENAS PARA O CLIQUE ATUAL:
        valor_bruto_atual: formatarBR(valorBruto),
        ganho_bruto_membro: formatarBR(ganhoBrutoMembroAtual), 
        
        // Valores dinâmicos que alimentam sua Embed de Parceiro/Não Parceiro/Membro
        lucro_atual_25: tipoLavagem === 'parceiro' ? formatarBR(lucroAtualParceiro) : formatarBR(lucroVigenteMembro),
        lucro_atual_30: formatarBR(lucroAtualNaoParceiro),
        retido_atual_membro: formatarBR(retidoVigenteMembro), 
        retido_atual_nao_parceiro: formatarBR(valorBruto * 0.70),
        retido_atual_parceiro: formatarBR(valorBruto * 0.75) // Adicionado para calcular os 75% do parceiro (Ex: R$ 22,50)
    });
});

app.listen(3000, () => console.log('API Ollympyus Rodando e Totalmente Preservada!'));

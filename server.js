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

    // 2. Variáveis de controle para o clique atual de registro
    let lucroVigenteMembro = 0;
    let retidoVigenteMembro = 0;
    let ganhoBrutoMembroAtual = 0;

    if (tipoLavagem === 'membro') {
        if (req.body.origem_dinheiro === 'repasse') {
            // Se valorBruto for 30 -> Ganho base da pessoa = 7,50 (25%)
            let ganhoPessoa = valorBruto * 0.25;
            ganhoBrutoMembroAtual = ganhoPessoa; // Salva os 7,50 para exibir na embed
            
            // O lucro da facção é 25% em cima dos 7,50 da pessoa (Ex: 1,88)
            lucroVigenteMembro = ganhoPessoa * 0.25;
            // O que sobra líquido para o membro (75% dos 7,50 -> Ex: 5,63)
            retidoVigenteMembro = ganhoPessoa * 0.75;
        } else {
            // CASO PADRÃO (DINHEIRO PESSOAL): Conta normal sobre o valor bruto cheio
            ganhoBrutoMembroAtual = valorBruto;
            lucroVigenteMembro = valorBruto * 0.25;
            retidoVigenteMembro = valorBruto * 0.75;
        }
        // Acumula o lucro calculado no histórico global de membros
        lucroMembros += lucroVigenteMembro;
    } else if (tipoLavagem === 'parceiro') {
        lucro25 += (valorBruto * 0.25);
    } else if (tipoLavagem === 'nao_parceiro') {
        lucro30 += (valorBruto * 0.30);
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
    let g25 = (lucro25 === 0 && lucro30 === 0 && lucroMembros === 0) ? 1 : lucro25;
    let g30 = lucro30;
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
                legend: {
                    labels: { fontColor: '#ffffff', fontSize: 14, fontStyle: 'bold' }
                },
                title: { display: false },
                plugins: {
                    datalabels: {
                        display: true,
                        color: '#ffffff',
                        font: { size: 16, weight: 'bold' },
                        textShadowColor: '#000000',
                        textShadowBlur: 4
                    }
                }
            }
        });

        myChart.setWidth(500);
        myChart.setHeight(300);
        myChart.setBackgroundColor('#1b1c21');
        urlGraficoPizza = await myChart.getShortUrl();
    } catch (error) {
        console.log("Erro ao gerar gráfico:", error);
        urlGraficoPizza = "https://quickchart.io{type:'pie',data:{labels:['Erro'],datasets:[{data:}]}}";
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
        
        // VALORES TRATADOS APENAS PARA O CLIQUE ATUAL (Membro1):
        valor_bruto_atual: formatarBR(valorBruto),
        ganho_bruto_membro: formatarBR(ganhoBrutoMembroAtual), // Exibe os 7,50 com base nos 30,00 inseridos
        lucro_atual_25: formatarBR(lucroVigenteMembro),       // Exibe os 1,88 (lucro da facção)
        retido_atual_membro: formatarBR(retidoVigenteMembro),  // Exibe os 5,63 (valor líquido do membro)
        retido_atual_nao_parceiro: formatarBR(valorBruto * 0.70)
    });
});

app.listen(3000, () => console.log('API Ollympyus com Taxa de Membros a 25% Rodando!'));

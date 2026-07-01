const express = require('express');
const app = express();
app.use(express.json());

app.post('/calcular-lucro', (req, res) => {
    // 1. Puxa os valores e divide por 100 para recuperar os centavos reais que o bot salvou como inteiro
    let lucro25 = (parseFloat(String(req.body.lucro_acumulado_25).replace(/[^\d.-]/g, '')) || 0);
    let lucro30 = (parseFloat(String(req.body.lucro_acumulado_30).replace(/[^\d.-]/g, '')) || 0);
    let valorBruto = parseFloat(String(req.body.valor_bruto).replace(/[^\d.-]/g, '')) || 0;
    let tipoLavagem = req.body.tipo; 

    // Se a entrada veio do banco de dados do bot, ela veio multiplicada por 100, então ajustamos de volta
    if (tipoLavagem === 'leitura') {
        lucro25 = lucro25 / 100;
        lucro30 = lucro30 / 100;
    }

    // 2. Acumula os valores conforme o clique atual de registro
    if (tipoLavagem === 'parceiro') {
        lucro25 += (valorBruto * 0.25);
    } else if (tipoLavagem === 'nao_parceiro') {
        lucro30 += (valorBruto * 0.30);
    }

    // 3. Processa a matemática global do monitoramento com precisão milimétrica
    let faturamentoCheio = (lucro25 * 4) + (lucro30 / 0.30);
    let lucroRealGeral = lucro25 + lucro30;
    let retido25 = lucro25 * 3;
    let retido30 = lucro30 * 2.3333;

    // Função interna para aplicar os pontos padrão brasileiro (ex: 2.000.000,00)
    const formatarBR = (num) => {
        return Number(num).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    // 4. Retorna os dados mapeados para o BotGhost
    res.json({
        // Multiplica por 100 e arredonda para virar um número inteiro gigante que o BotGhost aceita salvar sem rejeitar os decimais
        lucro_puro_25: Math.round(lucro25 * 100),
        lucro_puro_30: Math.round(lucro30 * 100),
        
        // Envia os textos com os pontos e centavos reais e intocados para a tela do Discord
        lucro_acumulado_25: formatarBR(lucro25),
        lucro_acumulado_30: formatarBR(lucro30),
        faturamento_total: formatarBR(faturamentoCheio),
        lucro_total_misturado: formatarBR(lucroRealGeral),
        liquido_retido_25: formatarBR(retido25),
        liquido_retido_30: formatarBR(retido30)
    });
});

app.listen(3000, () => console.log('API Ollympyus Multi-Milionária Pronta!'));

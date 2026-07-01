const express = require('express');
const app = express();
app.use(express.json());

app.post('/calcular-lucro', (req, res) => {
    let lucro25 = Number(req.body.lucro_acumulado_25) || 0;
    let lucro30 = Number(req.body.lucro_acumulado_30) || 0;
    let valorBruto = Number(req.body.valor_bruto) || 0;
    let tipoLavagem = req.body.tipo;

    if (tipoLavagem === 'parceiro') {
        lucro25 += (valorBruto * 0.25);
    } else if (tipoLavagem === 'nao_parceiro') {
        lucro30 += (valorBruto * 0.30);
    }

    let faturamento = (lucro25 * 4) + (lucro30 / 0.30);
    let lucroTotal = lucro25 + lucro30;
    let retido25 = lucro25 * 3;
    let retido30 = lucro30 * 2.3333;

    res.json({
        lucro_acumulado_25: lucro25.toFixed(2),
        lucro_acumulado_30: lucro30.toFixed(2),
        faturamento_total: faturamento.toFixed(2),
        lucro_total_misturado: lucroTotal.toFixed(2),
        liquido_retido_25: retido25.toFixed(2),
        liquido_retido_30: retido30.toFixed(2)
    });
});

app.listen(3000, () => console.log('API Rodando!'));

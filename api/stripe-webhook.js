// Recebe o aviso do Stripe quando alguém paga e guarda a encomenda
// (com morada de faturação e de envio) no Supabase.
const Stripe = require('stripe');
const { createClient } = require('@supabase/supabase-js');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// O Stripe assina o corpo exato do pedido, por isso não pode ser pré-processado.
function readRaw(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

const morada = (a = {}) => ({
  linha1: a.line1 || null,
  linha2: a.line2 || null,
  cidade: a.city || null,
  codigo_postal: a.postal_code || null,
  regiao: a.state || null,
  pais: a.country || null,
});

async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Método não permitido');

  let event;
  try {
    const raw = await readRaw(req);
    event = stripe.webhooks.constructEvent(
      raw,
      req.headers['stripe-signature'],
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    return res.status(400).send(`Assinatura inválida: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const s = event.data.object;
    const cliente = s.customer_details || {};
    // O Stripe mudou o sítio onde vem a morada de envio em versões recentes da API.
    const envio =
      (s.collected_information && s.collected_information.shipping_details) ||
      s.shipping_details ||
      {};
    const fatura = morada(cliente.address);
    const entrega = morada(envio.address);
    const nif = (cliente.tax_ids && cliente.tax_ids[0] && cliente.tax_ids[0].value) || null;

    const { error } = await supabase.from('encomendas').upsert(
      {
        stripe_session_id: s.id,
        criado_em: new Date(s.created * 1000).toISOString(),
        estado_pagamento: s.payment_status,
        valor_total: s.amount_total,
        moeda: s.currency,
        nome: cliente.name || null,
        email: cliente.email || null,
        telefone: cliente.phone || null,
        nif,
        fatura_linha1: fatura.linha1,
        fatura_linha2: fatura.linha2,
        fatura_cidade: fatura.cidade,
        fatura_codigo_postal: fatura.codigo_postal,
        fatura_regiao: fatura.regiao,
        fatura_pais: fatura.pais,
        envio_nome: envio.name || null,
        envio_linha1: entrega.linha1,
        envio_linha2: entrega.linha2,
        envio_cidade: entrega.cidade,
        envio_codigo_postal: entrega.codigo_postal,
        envio_regiao: entrega.regiao,
        envio_pais: entrega.pais,
      },
      { onConflict: 'stripe_session_id' }
    );

    // Se falhar, devolvemos erro para o Stripe voltar a tentar mais tarde.
    if (error) return res.status(500).send(`Erro ao guardar: ${error.message}`);
  }

  return res.status(200).json({ received: true });
}

handler.config = { api: { bodyParser: false } };
module.exports = handler;

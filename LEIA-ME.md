# Santa Mail Studio — passo a passo

O que está nesta pasta:

- `index.html` — a landing page (o botão "Comprar o kit" aponta para o teu Payment Link)
- `obrigado.html` — página para onde o Stripe leva o cliente depois de pagar
- `api/stripe-webhook.js` — guarda cada compra, com moradas, no Supabase
- `supabase/schema.sql` — cria a tabela `encomendas`
- `assets/` — logo e fotos
- `.env.example` — nomes das chaves a configurar na Vercel

Ordem recomendada: **1 Supabase → 2 GitHub → 3 Vercel → 4 Stripe → 5 Testar → 6 Domínio**.

---

## 1. Supabase (base de dados das encomendas)

1. Em supabase.com, cria uma conta e um projeto novo (guarda a palavra-passe da base de dados).
2. Abre **SQL Editor**, cola o conteúdo de `supabase/schema.sql` e carrega em **Run**.
3. Vai a **Project Settings > API** e copia dois valores:
   - **Project URL** (vai ser o `SUPABASE_URL`)
   - **service_role key** (vai ser o `SUPABASE_SERVICE_ROLE_KEY`). Esta chave é secreta: nunca a coloques no GitHub nem na página.

## 2. GitHub (guardar o código)

**Sem terminal (mais fácil):**
1. Em github.com, cria uma conta e carrega em **New repository**. Nome: `santa-mail-studio`. Deixa **Private** (ou Public, tanto faz) e cria.
2. No repositório vazio, carrega em **uploading an existing file**.
3. Descompacta o zip no teu computador e arrasta para a janela **todo o conteúdo da pasta** `santa-mail-studio` (incluindo as pastas `api`, `assets`, `supabase`). Em **Commit changes**, confirma.

**Com terminal:**
```
cd santa-mail-studio
git init
git add .
git commit -m "Santa Mail Studio: primeira versão"
git branch -M main
git remote add origin https://github.com/O-TEU-UTILIZADOR/santa-mail-studio.git
git push -u origin main
```

Antes de carregares, abre o `index.html` e troca `https://buy.stripe.com/COLA-AQUI-O-TEU-PAYMENT-LINK` pelo link real (podes fazê-lo depois no passo 4 e gravar a alteração no GitHub). Troca também o preço `00,00 €` e o email `o-teu-email@exemplo.pt` (em `index.html` e `obrigado.html`).

## 3. Vercel (pôr online)

1. Em vercel.com, entra com a conta do GitHub (**Continue with GitHub**).
2. **Add New > Project**, escolhe o repositório `santa-mail-studio` e carrega em **Import**.
3. Em **Framework Preset** deixa **Other**. Não mudes mais nada.
4. Abre **Environment Variables** e cria as quatro variáveis do ficheiro `.env.example`. Por agora podes pôr `STRIPE_WEBHOOK_SECRET` com um valor qualquer, que trocas no passo 4.
5. Carrega em **Deploy**. No fim, a Vercel dá-te um endereço do tipo `santa-mail-studio.vercel.app`. A partir daqui, cada alteração gravada no GitHub publica-se sozinha.

## 4. Stripe (pagamento e moradas)

**Criar o Payment Link:** em Stripe > **Payment Links > Criar**:
1. Adiciona o produto e o preço do kit.
2. Ativa **Recolher moradas de faturação** (obrigatório).
3. Ativa **Recolher moradas de envio** e escolhe os países para onde envias. Sem esta opção, o Stripe não pede a morada de entrega.
4. Opcional: pedir telefone e **NIF/ID fiscal** para a fatura.
5. Em **Depois do pagamento**, escolhe **Não mostrar página de confirmação** e redireciona para `https://O-TEU-ENDERECO/obrigado.html`.
6. Cria o link, copia-o e cola-o no botão do `index.html`.

Os nomes dos botões podem variar um pouco no Stripe, mas as opções são estas.

**Ligar o Stripe ao Supabase (webhook):**
1. Em Stripe > **Programadores > Webhooks > Adicionar endpoint**.
2. URL: `https://O-TEU-ENDERECO/api/stripe-webhook`
3. Evento a escutar: `checkout.session.completed`.
4. Cria e copia o **Segredo de assinatura** (`whsec_...`).
5. Na Vercel, **Settings > Environment Variables**, atualiza `STRIPE_WEBHOOK_SECRET` com esse valor.
6. Na Vercel, **Deployments**, abre o último deploy e escolhe **Redeploy** para as variáveis ficarem ativas.

Usa o modo de teste do Stripe primeiro, com as chaves de teste (`sk_test_...`) na Vercel.

## 5. Testar antes de vender

1. Abre a página e carrega em **Comprar o kit**.
2. No modo de teste, paga com o cartão `4242 4242 4242 4242`, qualquer data futura e qualquer CVC.
3. Preenche as moradas de faturação e de envio.
4. Confirma que apareces na página `obrigado.html`.
5. No Supabase, abre **Table Editor > encomendas**. Deve estar lá uma linha com nome, email e as duas moradas.
6. Se não aparecer, vê em Stripe > Webhooks se o envio falhou e em Vercel > **Logs** a mensagem de erro.
7. Quando estiver tudo bem, repete o passo 4 com o Payment Link e as chaves reais (`sk_live_...`) e atualiza as variáveis na Vercel.

## 6. Domínio próprio (opcional)

Na Vercel, **Settings > Domains**, adiciona o teu domínio e segue as instruções para apontar o DNS. Depois atualiza o URL do webhook e o redirecionamento do Payment Link para o novo endereço.

## Dia a dia

- **Ver quem comprou e para onde enviar:** Supabase > Table Editor > encomendas. Podes exportar para CSV.
- **Marcar como enviado:** na mesma tabela, muda `enviado` para `true` e escreve o `codigo_rastreio`.
- **Mudar textos ou preço:** edita o `index.html` no GitHub e grava. A Vercel publica em poucos segundos.
- **Faturação:** confirma com o teu contabilista como emitir faturas certificadas em Portugal, porque o Stripe não substitui um programa de faturação certificado.

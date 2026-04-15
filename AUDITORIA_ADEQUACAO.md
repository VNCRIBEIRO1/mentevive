## Auditoria de Adequacao para Clonagem e Venda

### Objetivo

Este documento consolida, de forma didatica, o status real da auditoria do portal admin/cliente.
Ele responde 3 perguntas:

1. O que ja foi corrigido no codigo
2. O que ainda precisa de acao manual da operacao
3. O que ainda precisa de evolucao tecnica para white-label e venda fixa

---

## 1. Resumo Executivo

O sistema esta funcional e estavel para uso da marca atual.
Hoje ele:

- passa em testes automatizados
- passa em lint
- gera build de producao com sucesso
- tem os fluxos centrais de admin, portal, agenda, pagamentos e sala de espera funcionando

Mas ele ainda nao esta 100% pronto para clonagem comercial em escala sem ajustes adicionais.

Os principais grupos de risco sao:

- seguranca operacional
- acoplamento forte com a marca atual
- dependencia de operacao manual em alguns fluxos
- ausencia de camada clara de configuracao multi-cliente

---

## 2. O que ja foi aplicado no codigo

### 2.1. Webhook Stripe mais seguro

Status: corrigido

O que foi feito:

- o webhook agora falha fechado em producao
- se a assinatura do Stripe nao for valida, a rota rejeita a chamada
- o fallback sem assinatura ficou restrito ao ambiente de desenvolvimento

Impacto:

- reduz risco de atualizacao fraudulenta de pagamento e confirmacao indevida de sessoes

Arquivos:

- [route.ts](C:\Users\Usuario\Desktop\bia\psicolobia\src\app\api\stripe\webhook\route.ts)

### 2.2. Preco presencial configuravel

Status: corrigido

O que foi feito:

- a tela de configuracoes do admin passou a incluir `individual_presencial`
- a chave procurada na leitura agora existe no fluxo de configuracao

Impacto:

- o valor de sessao presencial deixa de cair silenciosamente no default

Arquivos:

- [page.tsx](C:\Users\Usuario\Desktop\bia\psicolobia\src\app\admin\configuracoes\page.tsx)
- [session-pricing.ts](C:\Users\Usuario\Desktop\bia\psicolobia\src\lib\session-pricing.ts)

### 2.3. Perfil do admin agora persiste

Status: corrigido

O que foi feito:

- `name` e `phone` passaram a ser salvos de verdade
- foi criado o endpoint `PUT /api/profile`
- `phone` passou a ser propagado na sessao do NextAuth

Impacto:

- elimina o problema de "salvei e nao mudou"

Arquivos:

- [route.ts](C:\Users\Usuario\Desktop\bia\psicolobia\src\app\api\profile\route.ts)
- [auth.ts](C:\Users\Usuario\Desktop\bia\psicolobia\src\lib\auth.ts)
- [next-auth.d.ts](C:\Users\Usuario\Desktop\bia\psicolobia\src\types\next-auth.d.ts)
- [page.tsx](C:\Users\Usuario\Desktop\bia\psicolobia\src\app\admin\configuracoes\page.tsx)

### 2.4. Salvamento de disponibilidade ficou atomico

Status: corrigido

O que foi feito:

- o fluxo batch de disponibilidade deixou de depender de `delete + insert` solto
- agora o salvamento roda dentro de transacao

Impacto:

- reduz risco de perder todos os horarios em caso de falha intermediaria

Arquivos:

- [route.ts](C:\Users\Usuario\Desktop\bia\psicolobia\src\app\api\availability\route.ts)

### 2.5. Warnings da sala de espera foram reduzidos

Status: corrigido

O que foi feito:

- os efeitos do componente foram reorganizados
- as dependencias ficaram mais estaveis

Impacto:

- reduz renderizacao extra e ruido de lint

Arquivos:

- [WaitingRoomView.tsx](C:\Users\Usuario\Desktop\bia\psicolobia\src\components\waiting-room\WaitingRoomView.tsx)

### 2.6. `homolog-report.json` saiu do Git

Status: corrigido

O que foi feito:

- o arquivo foi removido do rastreamento do Git
- ele foi adicionado ao `.gitignore`

Impacto:

- novos relatarios locais nao devem mais subir para o repositorio

Arquivos:

- [.gitignore](C:\Users\Usuario\Desktop\bia\psicolobia\.gitignore)

### 2.7. Senhas fixas sairam dos scripts versionados

Status: corrigido agora

O que foi feito:

- os scripts de seed/homolog deixaram de usar senhas hardcoded
- agora eles aceitam variaveis de ambiente
- quando a variavel nao existe, geram senha aleatoria localmente

Impacto:

- evita que senhas fixas de homologacao fiquem perpetuadas no codigo versionado

Arquivos:

- [seed-lia-test.ts](C:\Users\Usuario\Desktop\bia\psicolobia\scripts\seed-lia-test.ts)
- [reset-and-seed-homolog.ts](C:\Users\Usuario\Desktop\bia\psicolobia\scripts\reset-and-seed-homolog.ts)

Variaveis novas:

- `SEED_LIA_ADMIN_EMAIL`
- `SEED_LIA_ADMIN_PASSWORD`
- `SEED_LIA_PATIENT_EMAIL`
- `SEED_LIA_PATIENT_PASSWORD`
- `HOMOLOG_ADMIN_EMAIL`
- `HOMOLOG_ADMIN_PASSWORD`
- `HOMOLOG_THERAPIST_EMAIL`
- `HOMOLOG_THERAPIST_PASSWORD`
- `HOMOLOG_PATIENT_1_EMAIL`
- `HOMOLOG_PATIENT_1_PASSWORD`
- `HOMOLOG_PATIENT_2_EMAIL`
- `HOMOLOG_PATIENT_2_PASSWORD`
- `HOMOLOG_PATIENT_3_EMAIL`
- `HOMOLOG_PATIENT_3_PASSWORD`

### 2.8. Reset de senha nao vaza mais token em producao

Status: corrigido agora

O que foi feito:

- o token continua sendo logado em desenvolvimento
- fora de desenvolvimento, o sistema nao imprime mais a URL com token
- em producao ele apenas avisa que falta um provedor transacional

Impacto:

- reduz exposicao de token em observabilidade e logs

Arquivos:

- [route.ts](C:\Users\Usuario\Desktop\bia\psicolobia\src\app\api\auth\forgot-password\route.ts)

---

## 3. O que ainda nao esta resolvido

### 3.1. Rotacao real de credenciais expostas

Status: pendente manual

Mesmo com as correcoes no repositorio, a rotacao real das credenciais antigas ainda precisa ser feita fora do codigo.

Voce precisa:

1. trocar senhas de usuarios de homolog/producao que possam ter sido reutilizadas
2. regenerar connection string e credenciais do banco no Neon
3. revisar segredos no Vercel e atualizar:
   - `DATABASE_URL`
   - `NEXTAUTH_SECRET` ou `AUTH_SECRET`
   - `STRIPE_SECRET_KEY`
   - `STRIPE_WEBHOOK_SECRET`
   - `CRON_SECRET`
   - `SETUP_SECRET`
   - `TURNSTILE_SECRET_KEY`
4. invalidar qualquer credencial compartilhada em relatorios antigos, prints ou chats

### 3.2. Historico Git ainda pode conter material sensivel antigo

Status: pendente manual

Tirar o arquivo do estado atual do repo ajuda, mas nao limpa o historico antigo.

Se este repositorio foi compartilhado publicamente ou com terceiros, ainda e recomendado:

1. revisar o historico
2. decidir se vale reescrever historico
3. tratar o caso como credencial comprometida independentemente de limpar ou nao o Git

### 3.3. Recuperacao de senha ainda nao envia email real

Status: pendente de infraestrutura

Hoje o fluxo:

- gera token
- responde de forma neutra
- nao entrega o link por email

O que ainda precisa ser feito:

1. escolher um provedor transacional
   - Resend
   - SendGrid
   - Postmark
   - Amazon SES
2. criar template de email
3. enviar o link de reset por email real
4. registrar falha de envio com monitoramento claro

### 3.4. White-label ainda nao existe como camada de produto

Status: pendente de desenvolvimento maior

O sistema ainda esta fortemente acoplado a:

- nome da marca
- dominio
- dados da profissional atual
- CRP atual
- textos de SEO
- mensagens de WhatsApp
- prefixos do Jitsi
- metadata do Stripe

Isso significa que a clonagem continua manual.

O que precisa ser desenvolvido:

1. uma camada central de configuracao da marca
2. leitura dessa configuracao em layout, SEO, landing, portal e mensagens
3. separacao entre configuracao global do sistema e configuracao do cliente
4. idealmente, estrutura por tenant

### 3.5. Documentos juridicos ainda estao fixos para a profissional atual

Status: pendente

O termo do portal cita diretamente nome e CRP da psicologa atual.

Arquivo:

- [page.tsx](C:\Users\Usuario\Desktop\bia\psicolobia\src\app\portal\consentimento\page.tsx)

Para vender/clonar isso com seguranca, o termo precisa ser dinamico por cliente.

---

## 4. O que eu revisei no resumo anterior

O resumo anterior estava bom, mas precisava de 3 ajustes de precisao:

1. `homolog-report.json` ter saido do Git nao resolvia sozinho o problema
   - os scripts versionados ainda tinham senhas fixas
   - isso foi corrigido agora

2. o reset de senha ainda estava exposto demais
   - o resumo dizia que era um backlog
   - agora pelo menos o token nao vaza mais em producao

3. o problema de branding white-label continua aberto
   - isso nao e bug pontual
   - e uma evolucao estrutural do produto

---

## 5. Validacao tecnica executada

Resultado atual:

- `npm run test:run`: 21 arquivos, 290 testes, tudo aprovado
- `npm run lint`: aprovado
- `npm run build`: aprovado

---

## 6. O que fazer agora, em ordem pratica

### Etapa 1. Seguranca imediata

Fazer agora:

1. rotacionar todas as credenciais antigas
2. revisar segredos no Vercel e Neon
3. confirmar que `STRIPE_WEBHOOK_SECRET` esta presente em producao
4. confirmar que `SETUP_SECRET` esta forte e nao compartilhado

### Etapa 2. Operacao minima segura

Fazer em seguida:

1. escolher e integrar provedor de email transacional
2. ativar fluxo real de recuperacao de senha
3. revisar quem tem acesso aos ambientes de homolog e producao

### Etapa 3. Preparacao para venda fixa

Fazer antes de oferecer como produto replicavel:

1. criar modulo central de branding/configuracao
2. tirar nome, dominio, CRP e redes sociais do codigo espalhado
3. tornar consentimento, SEO, landing e mensagens configuraveis
4. decidir se a estrategia sera:
   - uma instancia por cliente
   - multi-tenant real

### Etapa 4. Padronizacao comercial

Fazer junto da estrategia de venda:

1. definir checklist de onboarding de novo cliente
2. definir quais dados sao obrigatorios por cliente:
   - nome da marca
   - nome profissional
   - registro profissional
   - dominio
   - WhatsApp
   - Stripe
   - textos juridicos
3. documentar processo de setup em um playbook

---

## 7. Conclusao

Hoje o sistema esta tecnicamente saudavel para continuar operando a marca atual.

Para clonagem e venda, o que faltava como correcao direta mais urgente foi aplicado.
O que ainda resta agora esta concentrado em 3 frentes:

- rotacao manual de credenciais
- integracao real de email transacional
- criacao da camada white-label/multi-cliente

Se a proxima etapa for evoluir para produto replicavel, o caminho mais correto e abrir um novo ciclo focado em:

1. seguranca e operacao
2. branding configuravel
3. arquitetura de clonagem


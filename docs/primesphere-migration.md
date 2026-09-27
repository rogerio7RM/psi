# Migração PrimeSphere: Vite + Wrangler

Preparação iniciada em 27/09/2026. **Esta branch é um ensaio seguro; não publica e não troca DNS.**

## Estado verificado

- Repositório `rogerio7RM/psi`: público, possui Vite + React + Wrangler + Cloudflare Workers. O frontend existente (`src/react-app/App.tsx`) ainda é a demonstração do template. Preservar `indicadores/` até decidir sua integração.
- AppDeploy `primesphere-intelligence-wwpb6o`: site real, frontend Vite/React, com edições `260917` até `260925` e arquivos separados para intraday/afterclose.
- AppDeploy mostra `primesphereintelligence.com` ativo e `www.primesphereintelligence.com` pendente em 27/09/2026.

## Decisão de arquitetura

**Reaproveitar Workers com Static Assets** no repositório psi é possível: já existem `wrangler.json`, `@cloudflare/vite-plugin`, `src/worker/index.ts` e `wrangler deploy`. Como a PrimeSphere atual é essencialmente frontend estático, também pode usar Pages Direct Upload. Não configurar os dois destinos para o domínio de produção simultaneamente.

**Antes de copiar o código real para cá:** este repositório é público. Criar um repositório privado específico para a PrimeSphere ou alterar conscientemente a visibilidade; não publicar código comercial por acidente. O código e os conteúdos das edições atuais **não** foram adicionados por esta PR.

## Validar a infraestrutura atual

Este PR acrescenta `.github/workflows/verify-vite-wrangler.yml`, executado em pull requests ou manualmente. Ele roda `npm ci` e `npm run check`, isto é: TypeScript → Vite → `wrangler deploy --dry-run`. Não requer token Cloudflare, não faz deploy e não modifica o domínio. O workflow valida a infraestrutura EXISTENTE, ainda não a versão migrada da PrimeSphere.

## Etapas para a migração real

1. Faça backup do código AppDeploy e de todos os backgrounds aprovados. Copie o frontend real, arquivos de edição e assets para o repositório autorizado (preferencialmente privado). Preserve os arquivos `indicadores/` caso faça parte do produto.
2. Consolide o frontend e ajuste os caminhos de entrada (`src/react-app` do template versus `src` do AppDeploy). Revise `tailwind.config.js`, `postcss.config.js` e as dependências Tailwind: o frontend AppDeploy usa essas configurações, enquanto o template psi não as instala.
3. Na `src/App.tsx` do site atual, elimine o fallback fixo da edição `260925` e derive a última edição publicada do registro de edições; mantenha URLs históricas por `?YYMMDD`. Não deixe o fallback transformar uma edição velha em notícia atual.
4. Execute localmente `npm ci && npm run check`, confira links, mobile, desktop, imagens e edição mais recente. Acrescente testes Playwright de navegação antes de publicar automaticamente.
5. Crie credenciais limitadas de Cloudflare (API Token + Account ID) como **GitHub Actions Secrets**, nunca no código; configure workflow de deploy **somente após** a validação da versão migrada.
6. Faça primeiro deploy de preview (`*.workers.dev` no Workers ou `*.pages.dev` no Pages), mantendo o AppDeploy atual intacto.
7. Mude DNS de `primesphereintelligence.com` e `www` só depois dos testes, respeitando MX/SPF/DKIM/TXT preexistentes. Confirme certificado SSL e links; conserve rollback para o destino antigo até estabilizar.
8. Automação de conteúdo: Morning Brief e edição das 10h devem atualizar o mesmo dia; commit único por atualização; lock de concorrência na publicação e registro das versões para rollback.

## Comandos do template Workers que já está no psi

```bash
npm ci
npm run check             # tsc + vite build + wrangler deploy --dry-run
npm run deploy            # publicar no Workers: NÃO executar até migrar o site e aprovar
```

## Alternativa Cloudflare Pages

Se decidir usar Pages em vez do Workers já configurado, o kit separadamente entregue contém:
- `vite.config.ts` com `outDir: 'dist'`;
- workflow GitHub Actions para `wrangler pages deploy dist --project-name=primesphere-intelligence`;
- script de verificação de artefatos.

Documentação: https://developers.cloudflare.com/pages/how-to/use-direct-upload-with-continuous-integration/

**Atenção:** não reutilizar cegamente o `dist/client` do template Workers no comando Pages que espera `dist`. Ajustar build e destino à arquitetura escolhida.

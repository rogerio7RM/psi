# PrimeSphere Intelligence

Site da **PrimeSphere Intelligence** para leitores brasileiros que acompanham Wall Street. Migração de React + Vite do AppDeploy para **Cloudflare Workers com Wrangler**, aproveitando a infraestrutura já existente deste repositório.

## Rodar localmente

```sh
npm ci
npm run dev
npm run check
```

**Importante:** `npm run check` faz typecheck, build e simulação do deploy (não publica). O Worker de produção se chama `primesphere-intelligence`, distinto do projeto legado `psi`. O deploy real está em `Actions → Publicar PrimeSphere (manual)`, exige segredos Cloudflare no ambiente `production` e só roda a partir da branch principal.

O repositório mantém a pasta `indicadores/` e todas as edições importadas do antigo frontend em `src/react-app/editions/`. A página inicial detecta a última data compilada, preferindo `afterclose` quando existe; links históricos `?YYMMDD` e `?date=YYMMDD` continuam funcionando.

Veja [docs/primesphere-migration.md](docs/primesphere-migration.md) para plano de migração de domínio, proteção de credenciais e rollback. O domínio de produção ainda aponta para AppDeploy até o corte DNS.

**Este repositório é público:** nunca coloque credenciais ou conteúdo restrito em commits. Os arquivos de edições incluídos são apenas conteúdos editoriais do snapshot do site.

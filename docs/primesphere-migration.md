# Migração real da PrimeSphere para Vite + Wrangler

**Situação:** arquivos de edição do AppDeploy copiados para \`src/react-app/editions/\`; Tailwind e CSS restaurados; a página principal renderiza automaticamente a data mais recente, priorizando \`afterclose\` em vez de \`final\` e da edição inicial. Preservados \`indicadores/\` e Worker Hono já existentes no \`psi\`.

**Atenção:** o repositório \`rogerio7RM/psi\` é público. Não armazene chaves de Bigdata, Cloudflare ou outras credenciais nele. Os arquivos importados de AppDeploy são atualmente páginas editoriais TSX, não incluem assets binários. Os fundos Instagram aprovados em OneDrive não faziam parte da versão inspecionada no AppDeploy e precisam ser importados separadamente se forem usados na web.

## Workflow seguro
1. Pull request \`migration/primesphere-vite-wrangler\` executa \`npm install\`, \`npm run check\` e smoke test sobre \`dist/client/index.html\`. Na branch, a ação atualiza automaticamente \`package-lock.json\` quando necessário.
2. Verifique a renderização real em desktop e celular em Cloudflare preview. O workflow CI só compila; não valida layout nem dados de mercado.
3. Somente depois dos testes, integre a PR em \`main\`; o deploy é **manual** por \`Actions → Publicar PrimeSphere (manual) → Run workflow\`, condicionado ao ambiente protegido \`production\`.
4. Em \`Settings → Secrets and variables → Actions\`, configure \`CLOUDFLARE_ACCOUNT_ID\` e \`CLOUDFLARE_API_TOKEN\`. Idealmente salve os segredos no ambiente GitHub \`production\` e crie regra de aprovação. Nunca os coloque no chat nem no repositório.
5. O novo Worker usa o nome \`primesphere-intelligence\` para não sobrescrever o antigo \`psi\`. Após publicar, confirme o \`*.workers.dev\` e realize smoke test ao vivo.
6. Só após conferência, associe \`primesphereintelligence.com\` e \`www\` ao novo Worker nas rotas/custom domains Cloudflare, revisando DNS, SSL, MX, SPF, DKIM e outras entradas para não afetar e-mail. **O domínio atual continua no AppDeploy até essa etapa.**

### Comandos
\`\`\`sh
npm ci
npm run check        # TypeScript → Vite → Wrangler deploy --dry-run
npm run deploy       # Publicação real; requer credenciais Cloudflare
\`\`\`

### Política de edições
- Arquivos \`YYMMDD.tsx\`, \`YYMMDD-final.tsx\`, \`YYMMDD-afterclose.tsx\` são compilados automaticamente via Vite \`import.meta.glob\`.
- Para cada data, o app serve \`afterclose > final > edição base\`. Se não houver data solicitada, usa a última data disponível.
- Consulta histórica: \`?260925\` ou \`?date=260925\`.
- **Importante:** edição mais recente publicada no histórico acessível ainda é 25/09/2026; a migração **não cria** edição nova nem atualiza automaticamente dados financeiros. Não confundir última edição publicada com cotação ao vivo.

Documentação Cloudflare: https://developers.cloudflare.com/workers/ci-cd/external-cicd/github-actions/

# PrimeSphere: Cloudflare como único destino de publicação

O código do site fica em `rogerio7RM/psi` (branch `main`). O workflow `.github/workflows/primesphere-cloudflare-auto.yml` faz automaticamente `npm ci`, typecheck, build e `wrangler deploy` a cada push em `main`, além de permitir disparo manual. O AppDeploy não faz parte do fluxo de publicação.

## Configuração obrigatória (uma única vez)

Em GitHub → Settings → Secrets and variables → Actions, configure os secrets `CLOUDFLARE_API_TOKEN` (token com permissão Workers Scripts Edit para a conta correta) e `CLOUDFLARE_ACCOUNT_ID`. Opcionalmente, defina a variável `PRIMESPHERE_SITE_URL` como a URL pública do site para o smoke test HTTP após o deploy. Nunca armazene tokens no repositório.

No Cloudflare, vincule `primesphereintelligence.com` e `www.primesphereintelligence.com` ao Worker `primesphere-intelligence`, revise DNS e SSL e preserve os registros de e-mail. Confirme o domínio e o funcionamento do Worker antes de desativar a infraestrutura antiga. A criação do workflow não configura automaticamente DNS, segredos nem confirma que o deploy já concluiu.

## Edições e conteúdo

`src/react-app/editions/YYMMDD.tsx`: Morning Brief; `YYMMDD-final.tsx`: atualização final; `YYMMDD-afterclose.tsx`: fechamento. O app seleciona automaticamente a edição mais recente e prioriza afterclose > final > morning. Cada nova edição publicada via commit em main dispara o deploy automático.

A geração editorial diária ainda exige um processo de ingestão de dados, verificação de fontes e geração de arquivos. O workflow de deploy **não** inventa notícias, não busca cotações e não cria edições sozinho. Antes de habilitar publicação editorial sem supervisão, adicionar validação de data, proveniência de cotações, controle de duplicidade e bloqueio em caso de falha.

## Instagram automático (arquitetura)

Pipeline separado: dados verificados → roteiro PT-BR → oito imagens independentes 4:5 com backgrounds aprovados → validação de dimensões/contraste/legibilidade → hospedagem HTTPS dos oito arquivos → Meta Graph API ou agendador com autoPublish → conferência do ID e estado de publicação → alerta em caso de erro. Credenciais Meta devem ficar nos secrets do GitHub ou Cloudflare; não no código. Não publicar se faltar dado confirmado, imagem ou autorização. O workflow de deploy do site não publica no Instagram.

## Verificação

GitHub → Actions → PrimeSphere Cloudflare Auto Deploy deve mostrar build e deploy concluídos. Conferir a URL do Worker, o domínio principal e a última edição. Se o workflow falhar, consultar o log e corrigir o erro; não considerar o commit como publicação concluída.

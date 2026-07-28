# Deploy em produção — Railway

Guia para colocar o sistema no ar 24h, em `https://www.drgustavoamaralagenda.com.br`,
sem depender do computador de ninguém estar ligado. O código já está pronto para isso
(um único serviço serve a API e a interface na mesma porta); os passos abaixo são só de
configuração, feitos no site da Railway e no painel do registro.br.

## 1. Criar o projeto na Railway

1. Entre em https://railway.app e crie uma conta (dá para usar login do GitHub).
2. "New Project" → "Deploy from GitHub repo" → escolha
   `pedroads002/sistema-agenda-dr-gustavo`.
3. A Railway vai detectar o `railway.json` na raiz e usar `npm run build` para construir e
   `npm run start` para iniciar. Não precisa mexer em nada aqui.

## 2. Criar o volume persistente (banco de dados e fotos)

Sem isso, os dados dos pacientes e as fotos somem a cada novo deploy — **não pule esta
etapa**.

1. No serviço criado, aba "Settings" → "Volumes" → "New Volume".
2. Ponto de montagem (mount path): `/data`.
3. Isso cria um disco que sobrevive a reinícios e a novos deploys.

## 3. Variáveis de ambiente

No serviço, aba "Variables", adicione:

| Variável | Valor |
|---|---|
| `DATABASE_URL` | `file:/data/consultorio.db` |
| `UPLOADS_DIR` | `/data/uploads` |
| `JWT_SECRET` | um valor aleatório e secreto (gere um novo, não reaproveite senha de outro lugar) |
| `SEED_ADMIN_EMAIL` | e-mail de login do Dr. Gustavo |
| `SEED_ADMIN_SENHA` | senha inicial (dá para trocar depois, já logado, em "Trocar senha") |

Sugestão de `JWT_SECRET` gerado agora (aleatório, use este ou gere outro com
`openssl rand -hex 32`):
```
c73f816b29dea9447ecf0cca6f58b02a896a34ba563b6ec4ab13291ca415b6fa
```

Não precisa mexer em `PORT` nem em `COOKIE_SECURE` — a Railway define a porta sozinha, e o
servidor já detecta HTTPS automaticamente.

## 4. Primeiro deploy

Salvar as variáveis já dispara um deploy. Acompanhe em "Deployments" até aparecer
"Success". No primeiro boot, o sistema cria sozinho o banco (dentro do volume) e o usuário
administrador com o e-mail/senha definidos acima.

## 5. Domínio próprio (`drgustavoamaralagenda.com.br`)

1. No serviço, aba "Settings" → "Networking" → "Custom Domain" → adicione
   `www.drgustavoamaralagenda.com.br`.
2. A Railway mostra um destino do tipo `algumacoisa.up.railway.app` — copie.
3. No painel do registro.br, na área de DNS do domínio, crie um registro:
   - Tipo `CNAME`, nome `www`, valor = o destino copiado no passo 2.
4. Como domínio (sem `www`) não aceita `CNAME` por regra técnica de DNS, configure também
   um redirecionamento do domínio raiz para `www` — o próprio painel do registro.br tem uma
   opção de "redirecionamento web" para isso (raiz → `https://www.drgustavoamaralagenda.com.br`).
5. Propagação de DNS pode levar de alguns minutos a algumas horas. A Railway emite o
   certificado HTTPS sozinha assim que o domínio aponta corretamente para lá.

> Os nomes exatos dos campos no painel do registro.br podem variar um pouco. Se travar
> nessa parte, me chama com a tela aberta que eu vejo com você e indico o clique certo.

## 6. Testar

- Acesse `https://www.drgustavoamaralagenda.com.br` de um dispositivo fora da rede do
  consultório (ex.: 4G do celular) — se abrir, não depende mais de nenhum computador ligado.
- Faça login, cadastre um paciente de teste, suba uma foto, confira se tudo persiste depois
  de recarregar a página.
- Peça para o Dr. Gustavo acessar do computador dele e do celular.

## 7. Backup

O botão de backup (Configurações → Backup) continua funcionando igual — baixa o banco e as
fotos direto do servidor em produção. Combine uma rotina (ex.: semanal) de baixar e guardar
esse backup em outro lugar (ex.: seu computador ou um Drive pessoal), já que o volume da
Railway é seguro contra deploy, mas não substitui um backup à parte.

## 8. Atualizações futuras

Qualquer novo `git push` para `main` no GitHub dispara um novo deploy automático na Railway,
usando o mesmo volume (dados preservados). Nenhum passo manual extra é necessário depois do
primeiro deploy.

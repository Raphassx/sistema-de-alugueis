# Sistema de aluguéis

Aplicação Node.js, sem dependências externas. Requer Node 22 ou superior.

## Publicar

[Criar hospedagem no Render](https://dashboard.render.com/select-repo?type=blueprint)

Selecione `Raphassx/sistema-de-alugueis` como Blueprint. O arquivo
`render.yaml` configura o servidor e um disco persistente. O plano Starter e o
disco têm custo: confira o valor apresentado pelo Render antes de contratar.
Preencha `ADMIN_USER` e `ADMIN_PASSWORD` no painel; escolha uma senha forte e
exclusiva. Após a implantação, o Render fornece a URL HTTPS do sistema.
O GitHub armazena o código; GitHub Pages não executa este servidor Node.

## Executar localmente

Copie `.env.example` para `.env`, preencha a senha e execute:

```sh
node --env-file=.env server.js
```

Acesse http://localhost:3000 e use a opção Administrador com as credenciais
configuradas. Para cadastrar acesso de funcionário, entre como administrador
e salve o cadastro do funcionário com uma senha de pelo menos 8 caracteres.
Cadastros antigos precisam ser salvos novamente para criar acesso no servidor.
Para redefinir uma senha de funcionário, edite esse cadastro. Para redefinir
a senha administrativa, altere `ADMIN_PASSWORD` na hospedagem e reinicie.

## Dados e sessões

Senhas de funcionários são armazenadas com scrypt no diretório `DATA_DIR`
(padrão `data/`), que não é enviado ao Git. Sessões usam cookie HttpOnly e
expiram após 8 horas. Reiniciar o servidor encerra as sessões.

Os demais cadastros e dados financeiros da aplicação existente continuam no
armazenamento local de cada navegador. Eles não são compartilhados entre
dispositivos. A restrição por perfil dessas telas é aplicada na interface;
o login de servidor protege as operações de credenciais e a publicação de
notificações. Migrar os demais dados para um banco no servidor é necessário
para controle de acesso completo e trabalho compartilhado.

## Verificação

```sh
node --test
```

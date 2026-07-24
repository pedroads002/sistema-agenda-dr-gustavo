# Adendo 03 — Anamnese, Consentimento e Fotos (Fase 7)

Complemento ao `DOCUMENTACAO-SISTEMA-DR-GUSTAVO.md`. Define a **anamnese**, o **termo de
consentimento** e as **fotos antes/depois**. Onde divergir do documento original, **vale este
adendo**.

> ⚠️ **Atenção — dados altamente sensíveis.** Esta fase lida com fotos íntimas e informações de
> saúde. As regras de segurança da seção final são **obrigatórias**, não opcionais.

Os modelos `Anamnese`, `Consentimento` e `Foto` já existem (Fase 1). Ajustar conforme abaixo e
gerar migração quando necessário.

## Parte A — Anamnese
Ficha de anamnese (questionário de saúde) vinculada ao paciente, com data.

- Armazenar as respostas em formato estruturado (JSON) no campo `respostas` do modelo `Anamnese`.
- Oferecer um **modelo padrão de perguntas** (abaixo), que o Dr. Gustavo pode ajustar depois. As
  perguntas clínicas são domínio dele — deixar fácil de editar/expandir.
- Cada pergunta com resposta Sim/Não + um campo de detalhe/observação quando "Sim".
- Um campo de observações gerais no fim.
- Poder criar mais de uma anamnese por paciente (histórico por data); listar, ver, editar.

**Modelo inicial de perguntas (ajustável pelo profissional):**
alergias (quais); uso de medicamentos contínuos (quais); doenças crônicas (quais); gestante ou
amamentando; uso de anticoagulantes; histórico de herpes; tendência a queloide; procedimentos
estéticos anteriores (quais/quando); cirurgias recentes; e um campo de observações livres.
*(Estas perguntas são um ponto de partida; o Dr. Gustavo revisa e adapta ao protocolo dele.)*

## Parte B — Termo de Consentimento
Registro do consentimento por procedimento.

- Vinculado ao paciente, com: procedimento, data, "assinado" (sim/não) e **anexo do documento
  assinado** (PDF ou imagem) no campo `arquivoPath`.
- Listar/ver/excluir; indicar visualmente na ficha quando um procedimento ainda **não** tem termo
  assinado.
- (Opcional, se sobrar espaço) permitir imprimir um modelo de termo em branco com o cabeçalho da
  marca, para o paciente assinar e depois anexar digitalizado.

## Parte C — Fotos antes/depois
- Upload de fotos vinculadas ao **paciente** e, opcionalmente, ao **procedimento realizado**.
- Cada foto marcada como **"antes"** ou **"depois"**, com data e descrição opcional.
- Visualização em galeria na ficha do paciente, com comparação antes/depois lado a lado.
- Poder excluir uma foto.

## 🔒 Segurança dos arquivos (OBRIGATÓRIO)
Estes arquivos são o ponto mais sensível do sistema. Implementar assim:

1. **Armazenamento local:** salvar os arquivos em `backend/uploads/` (já está no `.gitignore`;
   nunca vão para o GitHub). Guardar com **nome aleatório** (não usar o nome original do arquivo).
2. **Servir SOMENTE com autenticação:** as imagens/documentos **não podem** ficar numa pasta
   pública/estática acessível por URL direta. Todo acesso a um arquivo deve passar por uma rota
   que **exige login** e verifica se o usuário tem permissão. Nada de URL "adivinhável" que abra a
   foto sem login.
3. **Validação de upload:** aceitar apenas tipos esperados (imagens para fotos; imagem ou PDF para
   consentimento) e impor **limite de tamanho**. Rejeitar o resto.
4. **Backup:** a pasta `uploads/` NÃO está no Git, então precisa entrar na rotina de backup junto
   com o banco (lembrar disso na Fase 8 / configurações).
5. **LGPD:** acesso sempre atrás do login; registrar o consentimento; não expor nada em logs.

## Critérios de aceite (Fase 7)
- Consigo criar uma anamnese para um paciente, responder as perguntas e salvar; e ver o histórico.
- Consigo registrar um consentimento com anexo (PDF/imagem) e ver na ficha quando falta assinar.
- Consigo subir fotos antes/depois e vê-las na galeria comparativa.
- **Ao tentar abrir a URL de um arquivo sem estar logado, o acesso é negado.** (teste de segurança)
- Nenhuma foto/arquivo/anexo vai para o Git.

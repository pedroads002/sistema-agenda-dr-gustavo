import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'
import readline from 'node:readline'
import { stdin, stdout } from 'node:process'

try {
  process.loadEnvFile()
} catch {
  // Sem arquivo .env — o Prisma CLI já pode ter carregado as variáveis sozinho
}

const prisma = new PrismaClient()

const CUSTO_HASH = 12

/** Catálogo inicial, na ordem de prioridade definida pelo cliente (ver ADENDO-02).
 * Preço e duração ficam com o valor padrão (0 / 60min) para o Dr. Gustavo preencher. */
const procedimentosIniciais = [
  { nome: 'Harmonização íntima masculina (preenchimento peniano)', categoria: 'intima_masculina', ordem: 1 },
  { nome: 'Harmonização íntima feminina', categoria: 'intima_feminina', ordem: 2 },
  { nome: 'Harmonização corporal', categoria: 'corporal', ordem: 3 },
  { nome: 'Lipo pubiana masculina', categoria: 'intima_masculina', ordem: 4 },
  { nome: 'Harmonização facial', categoria: 'facial', ordem: 5 },
  { nome: 'Lipo pubiana feminina', categoria: 'intima_feminina', ordem: 6 },
]

/** Sem SEED_ADMIN_EMAIL/SEED_ADMIN_SENHA no .env, pergunta no terminal (uso: npm run setup).
 * Lê as respostas por iteração assíncrona (não com múltiplos `question()` em sequência):
 * se as linhas digitadas chegarem juntas num único bloco (comum quando o texto é colado),
 * um segundo `question()` pode nunca receber a linha que já havia chegado. */
async function perguntarCredenciais(): Promise<{ email: string; senha: string }> {
  console.log('Vamos criar o usuário administrador do sistema.')

  const rl = readline.createInterface({ input: stdin, output: stdout })
  const comAcessoInterno = rl as unknown as {
    _writeToOutput: (str: string) => void
    output: NodeJS.WritableStream
  }
  const escritaOriginal = comAcessoInterno._writeToOutput.bind(rl)
  const linhas = rl[Symbol.asyncIterator]()

  async function perguntar(pergunta: string, mascarar = false): Promise<string> {
    stdout.write(pergunta)
    if (mascarar) {
      comAcessoInterno._writeToOutput = (str) => {
        comAcessoInterno.output.write(str.includes('\n') ? str : '*')
      }
    }
    const { value, done } = await linhas.next()
    if (mascarar) {
      comAcessoInterno._writeToOutput = escritaOriginal
      stdout.write('\n')
    }
    return done ? '' : value.trim()
  }

  try {
    let email = ''
    while (!email.includes('@')) {
      email = await perguntar('E-mail do administrador: ')
    }
    let senha = ''
    while (senha.length < 8) {
      senha = await perguntar('Senha (mínimo 8 caracteres): ', true)
    }
    return { email, senha }
  } finally {
    rl.close()
  }
}

async function main() {
  let emailAdmin = process.env.SEED_ADMIN_EMAIL
  let senhaAdmin = process.env.SEED_ADMIN_SENHA

  if (!emailAdmin || !senhaAdmin) {
    const resposta = await perguntarCredenciais()
    emailAdmin = resposta.email
    senhaAdmin = resposta.senha
  }

  const senhaHash = await bcrypt.hash(senhaAdmin, CUSTO_HASH)

  await prisma.usuario.upsert({
    where: { email: emailAdmin },
    update: {},
    create: {
      nome: 'Dr. Gustavo Amaral',
      email: emailAdmin,
      senhaHash,
    },
  })

  for (const procedimento of procedimentosIniciais) {
    const existente = await prisma.procedimento.findFirst({ where: { nome: procedimento.nome } })
    if (existente) {
      await prisma.procedimento.update({
        where: { id: existente.id },
        data: { categoria: procedimento.categoria, ordem: procedimento.ordem },
      })
    } else {
      await prisma.procedimento.create({ data: procedimento })
    }
  }

  console.log('Seed concluído: usuário administrador e catálogo de procedimentos prontos.')
}

main()
  .catch((erro) => {
    console.error(erro)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

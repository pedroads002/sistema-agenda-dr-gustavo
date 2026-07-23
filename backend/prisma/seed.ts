import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

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

async function main() {
  const emailAdmin = process.env.SEED_ADMIN_EMAIL
  const senhaAdmin = process.env.SEED_ADMIN_SENHA

  if (!emailAdmin || !senhaAdmin) {
    throw new Error(
      'Defina SEED_ADMIN_EMAIL e SEED_ADMIN_SENHA no arquivo backend/.env antes de rodar o seed.',
    )
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

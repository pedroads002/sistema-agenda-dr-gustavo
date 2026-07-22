import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

try {
  process.loadEnvFile()
} catch {
  // Sem arquivo .env — o Prisma CLI já pode ter carregado as variáveis sozinho
}

const prisma = new PrismaClient()

const CUSTO_HASH = 12

const procedimentosIniciais = [
  { nome: 'Harmonização facial', categoria: 'facial' },
  { nome: 'Harmonização íntima masculina', categoria: 'intima_masculina' },
  { nome: 'Harmonização íntima feminina', categoria: 'intima_feminina' },
  { nome: 'Harmonização corporal', categoria: 'corporal' },
  { nome: 'Toxina botulínica', categoria: 'outros' },
  { nome: 'Preenchimento com ácido hialurônico', categoria: 'outros' },
  { nome: 'Bioestimulador de colágeno', categoria: 'outros' },
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
    if (!existente) {
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

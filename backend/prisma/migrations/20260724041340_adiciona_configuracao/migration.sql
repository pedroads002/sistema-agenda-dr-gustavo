-- CreateTable
CREATE TABLE "Configuracao" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nomeConsultorio" TEXT NOT NULL,
    "nomeProfissional" TEXT NOT NULL,
    "registroProfissional" TEXT,
    "telefone" TEXT,
    "email" TEXT,
    "endereco" TEXT,
    "cidade" TEXT,
    "uf" TEXT,
    "atualizadoEm" DATETIME NOT NULL
);

/*
  Warnings:

  - You are about to drop the column `lote` on the `ProcedimentoRealizado` table. All the data in the column will be lost.
  - You are about to drop the column `produto` on the `ProcedimentoRealizado` table. All the data in the column will be lost.
  - You are about to drop the column `quantidade` on the `ProcedimentoRealizado` table. All the data in the column will be lost.
  - You are about to drop the column `regioes` on the `ProcedimentoRealizado` table. All the data in the column will be lost.
  - You are about to drop the column `validade` on the `ProcedimentoRealizado` table. All the data in the column will be lost.

*/
-- CreateTable
CREATE TABLE "ProdutoAplicado" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "procedimentoRealizadoId" TEXT NOT NULL,
    "produto" TEXT,
    "lote" TEXT,
    "validade" DATETIME,
    "quantidade" TEXT,
    "regiao" TEXT,
    CONSTRAINT "ProdutoAplicado_procedimentoRealizadoId_fkey" FOREIGN KEY ("procedimentoRealizadoId") REFERENCES "ProcedimentoRealizado" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Procedimento" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nome" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "valorBase" REAL NOT NULL DEFAULT 0,
    "duracaoMin" INTEGER NOT NULL DEFAULT 60,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Procedimento" ("ativo", "categoria", "criadoEm", "duracaoMin", "id", "nome", "valorBase") SELECT "ativo", "categoria", "criadoEm", "duracaoMin", "id", "nome", "valorBase" FROM "Procedimento";
DROP TABLE "Procedimento";
ALTER TABLE "new_Procedimento" RENAME TO "Procedimento";
CREATE TABLE "new_ProcedimentoRealizado" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "pacienteId" TEXT NOT NULL,
    "agendamentoId" TEXT,
    "data" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "procedimento" TEXT NOT NULL,
    "observacoes" TEXT,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProcedimentoRealizado_pacienteId_fkey" FOREIGN KEY ("pacienteId") REFERENCES "Paciente" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ProcedimentoRealizado_agendamentoId_fkey" FOREIGN KEY ("agendamentoId") REFERENCES "Agendamento" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_ProcedimentoRealizado" ("criadoEm", "data", "id", "observacoes", "pacienteId", "procedimento") SELECT "criadoEm", "data", "id", "observacoes", "pacienteId", "procedimento" FROM "ProcedimentoRealizado";
DROP TABLE "ProcedimentoRealizado";
ALTER TABLE "new_ProcedimentoRealizado" RENAME TO "ProcedimentoRealizado";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

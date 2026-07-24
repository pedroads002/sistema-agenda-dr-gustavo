/*
  Warnings:

  - You are about to drop the column `procedimento` on the `Foto` table. All the data in the column will be lost.
  - Added the required column `mimeType` to the `Foto` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Consentimento" ADD COLUMN "mimeType" TEXT;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Foto" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "pacienteId" TEXT NOT NULL,
    "procedimentoRealizadoId" TEXT,
    "tipo" TEXT NOT NULL,
    "descricao" TEXT,
    "data" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "caminho" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Foto_pacienteId_fkey" FOREIGN KEY ("pacienteId") REFERENCES "Paciente" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Foto_procedimentoRealizadoId_fkey" FOREIGN KEY ("procedimentoRealizadoId") REFERENCES "ProcedimentoRealizado" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Foto" ("caminho", "criadoEm", "data", "id", "pacienteId", "tipo") SELECT "caminho", "criadoEm", "data", "id", "pacienteId", "tipo" FROM "Foto";
DROP TABLE "Foto";
ALTER TABLE "new_Foto" RENAME TO "Foto";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

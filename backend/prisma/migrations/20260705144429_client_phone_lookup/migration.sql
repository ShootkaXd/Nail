-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Appointment" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "clientName" TEXT NOT NULL,
    "clientPhone" TEXT NOT NULL,
    "clientPhoneDigits" TEXT NOT NULL DEFAULT '',
    "clientEmail" TEXT,
    "masterId" INTEGER NOT NULL,
    "serviceId" INTEGER NOT NULL,
    "startAt" DATETIME NOT NULL,
    "endAt" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "notes" TEXT,
    "totalPrice" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Appointment_masterId_fkey" FOREIGN KEY ("masterId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Appointment_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Appointment" ("clientEmail", "clientName", "clientPhone", "createdAt", "endAt", "id", "masterId", "notes", "serviceId", "startAt", "status", "totalPrice") SELECT "clientEmail", "clientName", "clientPhone", "createdAt", "endAt", "id", "masterId", "notes", "serviceId", "startAt", "status", "totalPrice" FROM "Appointment";
DROP TABLE "Appointment";
ALTER TABLE "new_Appointment" RENAME TO "Appointment";
CREATE INDEX "Appointment_clientPhoneDigits_idx" ON "Appointment"("clientPhoneDigits");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- Backfill clientPhoneDigits for rows that existed before this column, so
-- "my bookings" lookup works for appointments created before this migration.
UPDATE "Appointment" SET "clientPhoneDigits" =
  CASE
    WHEN LENGTH(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE("clientPhone", '+', ''), ' ', ''), '(', ''), ')', ''), '-', '')) = 11
      AND SUBSTR(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE("clientPhone", '+', ''), ' ', ''), '(', ''), ')', ''), '-', ''), 1, 1) IN ('7', '8')
    THEN SUBSTR(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE("clientPhone", '+', ''), ' ', ''), '(', ''), ')', ''), '-', ''), 2)
    ELSE SUBSTR(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE("clientPhone", '+', ''), ' ', ''), '(', ''), ')', ''), '-', ''), -10)
  END
WHERE "clientPhoneDigits" = '';

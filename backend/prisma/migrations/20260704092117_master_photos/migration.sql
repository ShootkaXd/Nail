-- CreateTable
CREATE TABLE "MasterPhoto" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "masterId" INTEGER NOT NULL,
    "url" TEXT NOT NULL,
    "caption" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MasterPhoto_masterId_fkey" FOREIGN KEY ("masterId") REFERENCES "MasterProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

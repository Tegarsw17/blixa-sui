-- CreateTable
CREATE TABLE "documents" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "hashSha256" TEXT NOT NULL,
    "storagePath" TEXT NOT NULL,
    "encryptedKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "print_sessions" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'CREATED',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "oneTimeToken" TEXT NOT NULL,
    "suiObjectId" TEXT,
    "suiTxCreate" TEXT,
    "suiTxPrint" TEXT,
    "suiTxDestroy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "printedAt" TIMESTAMP(3),

    CONSTRAINT "print_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "print_events" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "agentId" TEXT,
    "eventType" TEXT NOT NULL,
    "result" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "print_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "print_sessions_oneTimeToken_key" ON "print_sessions"("oneTimeToken");

-- AddForeignKey
ALTER TABLE "print_sessions" ADD CONSTRAINT "print_sessions_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "documents"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "print_events" ADD CONSTRAINT "print_events_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "print_sessions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

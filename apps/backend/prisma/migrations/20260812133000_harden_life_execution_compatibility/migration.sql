ALTER TABLE "LifeTask" ADD COLUMN IF NOT EXISTS "energy" TEXT NOT NULL DEFAULT 'medium';
CREATE TABLE IF NOT EXISTS "TaskDependency" ("id" TEXT NOT NULL,"taskId" TEXT NOT NULL,"dependsOnTaskId" TEXT NOT NULL,CONSTRAINT "TaskDependency_pkey" PRIMARY KEY ("id"));
CREATE TABLE IF NOT EXISTS "TaskEvent" ("id" TEXT NOT NULL,"taskId" TEXT NOT NULL,"userId" TEXT NOT NULL,"event" TEXT NOT NULL,"reason" TEXT,"metadata" JSONB,"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,CONSTRAINT "TaskEvent_pkey" PRIMARY KEY ("id"));
CREATE UNIQUE INDEX IF NOT EXISTS "TaskDependency_taskId_dependsOnTaskId_key" ON "TaskDependency"("taskId","dependsOnTaskId");
CREATE INDEX IF NOT EXISTS "TaskEvent_taskId_createdAt_idx" ON "TaskEvent"("taskId","createdAt");
CREATE INDEX IF NOT EXISTS "TaskEvent_userId_createdAt_idx" ON "TaskEvent"("userId","createdAt");
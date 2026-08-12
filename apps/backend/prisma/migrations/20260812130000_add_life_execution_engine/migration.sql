CREATE TABLE "LifeTask" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "source" TEXT NOT NULL DEFAULT 'manual',
  "goalId" TEXT,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "priority" INTEGER NOT NULL DEFAULT 2,
  "energy" TEXT NOT NULL DEFAULT 'medium',
  "scheduledAt" TIMESTAMP(3),
  "dueAt" TIMESTAMP(3),
  "estimatedMinutes" INTEGER,
  "completedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "LifeTask_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "LifeTask_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "TaskDependency" (
  "taskId" TEXT NOT NULL,
  "dependsOnTaskId" TEXT NOT NULL,
  CONSTRAINT "TaskDependency_pkey" PRIMARY KEY ("taskId","dependsOnTaskId"),
  CONSTRAINT "TaskDependency_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "LifeTask"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "TaskDependency_dependsOnTaskId_fkey" FOREIGN KEY ("dependsOnTaskId") REFERENCES "LifeTask"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "TaskEvent" (
  "id" TEXT NOT NULL,
  "taskId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "event" TEXT NOT NULL,
  "reason" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TaskEvent_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "TaskEvent_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "LifeTask"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "TaskEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "LifeTask_userId_status_dueAt_idx" ON "LifeTask"("userId","status","dueAt");
CREATE INDEX "LifeTask_userId_scheduledAt_idx" ON "LifeTask"("userId","scheduledAt");
CREATE INDEX "LifeTask_userId_priority_status_idx" ON "LifeTask"("userId","priority","status");
CREATE INDEX "TaskEvent_userId_createdAt_idx" ON "TaskEvent"("userId","createdAt");

CREATE TABLE "FitnessProgram" (
  "id" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "nameFa" TEXT,
  "description" TEXT NOT NULL,
  "discipline" TEXT NOT NULL,
  "goal" TEXT NOT NULL,
  "level" TEXT NOT NULL,
  "durationWeeks" INTEGER NOT NULL,
  "sessionsPerWeek" INTEGER NOT NULL,
  "sessionDurationMin" INTEGER NOT NULL,
  "equipment" JSONB NOT NULL DEFAULT '[]',
  "targetAreas" JSONB NOT NULL DEFAULT '["full_body"]',
  "tags" JSONB NOT NULL DEFAULT '[]',
  "coverMediaUrl" TEXT,
  "contentStatus" TEXT NOT NULL DEFAULT 'published',
  "sourceProvider" TEXT,
  "sourceLicense" TEXT,
  "sourceAttribution" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "FitnessProgram_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "FitnessProgram_slug_key" ON "FitnessProgram"("slug");
CREATE INDEX "FitnessProgram_discipline_goal_level_idx" ON "FitnessProgram"("discipline","goal","level");
CREATE INDEX "FitnessProgram_contentStatus_idx" ON "FitnessProgram"("contentStatus");

CREATE TABLE "FitnessProgramVersion" (
  "id" TEXT NOT NULL,
  "programId" TEXT NOT NULL,
  "version" INTEGER NOT NULL,
  "changeSummary" TEXT,
  "publishedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "FitnessProgramVersion_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "FitnessProgramVersion_programId_fkey" FOREIGN KEY ("programId") REFERENCES "FitnessProgram"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "FitnessProgramVersion_programId_version_key" ON "FitnessProgramVersion"("programId","version");
CREATE INDEX "FitnessProgramVersion_programId_publishedAt_idx" ON "FitnessProgramVersion"("programId","publishedAt");

CREATE TABLE "FitnessProgramSession" (
  "id" TEXT NOT NULL,
  "programVersionId" TEXT NOT NULL,
  "weekNumber" INTEGER NOT NULL,
  "dayNumber" INTEGER NOT NULL,
  "title" TEXT NOT NULL,
  "focus" TEXT NOT NULL,
  "durationMin" INTEGER NOT NULL,
  "sessionPayload" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "FitnessProgramSession_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "FitnessProgramSession_programVersionId_fkey" FOREIGN KEY ("programVersionId") REFERENCES "FitnessProgramVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "FitnessProgramSession_programVersionId_weekNumber_dayNumber_key" ON "FitnessProgramSession"("programVersionId","weekNumber","dayNumber");
CREATE INDEX "FitnessProgramSession_programVersionId_weekNumber_dayNumber_idx" ON "FitnessProgramSession"("programVersionId","weekNumber","dayNumber");

CREATE TABLE "FitnessPlanAssignment" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "programVersionId" TEXT NOT NULL,
  "startedOn" TIMESTAMP(3) NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'active',
  "currentWeek" INTEGER NOT NULL DEFAULT 1,
  "currentDay" INTEGER NOT NULL DEFAULT 1,
  "completedSessions" INTEGER NOT NULL DEFAULT 0,
  "lastSessionAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "FitnessPlanAssignment_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "FitnessPlanAssignment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "FitnessPlanAssignment_programVersionId_fkey" FOREIGN KEY ("programVersionId") REFERENCES "FitnessProgramVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "FitnessPlanAssignment_userId_programVersionId_key" ON "FitnessPlanAssignment"("userId","programVersionId");
CREATE INDEX "FitnessPlanAssignment_userId_status_updatedAt_idx" ON "FitnessPlanAssignment"("userId","status","updatedAt");

INSERT INTO "FitnessProgram" ("id","slug","name","nameFa","description","discipline","goal","level","durationWeeks","sessionsPerWeek","sessionDurationMin","equipment","targetAreas","tags","contentStatus","sourceProvider","sourceLicense") VALUES
('f0a1b2c3-d4e5-4f60-8172-90a1b2c3d4e5','strength-foundation-8w','Strength Foundation — 8 Weeks','پایه قدرت — ۸ هفته','Progressive full-body strength plan with equipment-aware compound movements.','gym','strength','beginner',8,3,45,'["barbell","bench","dumbbells"]','["full_body","legs","chest","back","shoulders"]','["strength","beginner","progressive"]','published','MYPA Curated','MYPA-owned program content'),
('f1a2b3c4-d5e6-4f71-9283-a1b2c3d4e5f6','hypertrophy-sculpt-8w','Hypertrophy & Sculpt — 8 Weeks','عضله‌سازی و فرم‌دهی — ۸ هفته','Balanced resistance plan for muscle development with manageable volume.','gym','hypertrophy','intermediate',8,4,50,'["dumbbells","barbell","bench","cable_machine"]','["full_body","glutes","thighs","shoulders","back","arms"]','["hypertrophy","sculpt","intermediate"]','published','MYPA Curated','MYPA-owned program content'),
('f2b3c4d5-e6f7-4082-a394-b2c3d4e5f607','fat-loss-home-6w','Fat Loss Home — 6 Weeks','چربی‌سوزی در خانه — ۶ هفته','Low-equipment conditioning and resistance plan with short, efficient sessions.','gym','fat_loss','beginner',6,4,30,'["dumbbells","resistance_band","yoga_mat"]','["full_body","core","legs"]','["fat_loss","home","short_sessions"]','published','MYPA Curated','MYPA-owned program content'),
('f3c4d5e6-f708-4193-a4b5-c3d4e5f60718','calisthenics-foundation-8w','Calisthenics Foundation — 8 Weeks','پایه کالیستنیکس — ۸ هفته','Progressive bodyweight training with scalable regressions and skill work.','calisthenics','skill','beginner',8,3,40,'["pull_up_bar","parallel_bars","resistance_band"]','["full_body","chest","back","core","arms"]','["calisthenics","skills","progression"]','published','MYPA Curated','MYPA-owned program content'),
('f4d5e6f7-0819-42a4-b5c6-d4e5f6071829','mobility-yoga-reset-4w','Mobility & Yoga Reset — 4 Weeks','ریست موبیلیتی و یوگا — ۴ هفته','Accessible mobility, balance and recovery sessions for the whole body.','yoga','mobility','beginner',4,4,25,'["yoga_mat"]','["full_body","hips","back","shoulders"]','["mobility","recovery","yoga"]','published','MYPA Curated','MYPA-owned program content'),
('f5e6f708-192a-43b5-c6d7-e5f60718293a','general-fitness-6w','General Fitness — 6 Weeks','آمادگی عمومی — ۶ هفته','Balanced strength, conditioning and mobility for consistent general fitness.','gym','general_fitness','foundation',6,3,40,'["dumbbells","bench","resistance_band"]','["full_body"]','["general_fitness","balanced"]','published','MYPA Curated','MYPA-owned program content');

INSERT INTO "FitnessProgramVersion" ("id","programId","version","changeSummary","publishedAt") SELECT gen_random_uuid()::text, "id", 1, 'Initial curated program version', CURRENT_TIMESTAMP FROM "FitnessProgram";

INSERT INTO "FitnessProgramSession" ("id","programVersionId","weekNumber","dayNumber","title","focus","durationMin","sessionPayload")
SELECT gen_random_uuid()::text, v."id", w.week, d.day,
  CASE d.day WHEN 1 THEN 'Session A' WHEN 2 THEN 'Session B' ELSE 'Session C' END,
  CASE p."goal" WHEN 'strength' THEN CASE d.day WHEN 1 THEN 'Lower + Push' WHEN 2 THEN 'Pull + Core' ELSE 'Full Body Strength' END WHEN 'hypertrophy' THEN CASE d.day WHEN 1 THEN 'Lower Body' WHEN 2 THEN 'Push + Shoulders' ELSE 'Pull + Arms' END WHEN 'fat_loss' THEN CASE d.day WHEN 1 THEN 'Full Body Circuit' WHEN 2 THEN 'Lower + Core' ELSE 'Upper + Conditioning' END WHEN 'skill' THEN CASE d.day WHEN 1 THEN 'Push Skill' WHEN 2 THEN 'Pull Skill' ELSE 'Core + Legs' END WHEN 'mobility' THEN CASE d.day WHEN 1 THEN 'Hips + Spine' WHEN 2 THEN 'Shoulders + Balance' ELSE 'Recovery Flow' END ELSE 'Balanced Full Body' END,
  p."sessionDurationMin",
  jsonb_build_object('goal',p."goal",'discipline',p."discipline",'week',w.week,'day',d.day,'prescription',CASE p."goal" WHEN 'strength' THEN jsonb_build_array(jsonb_build_object('exerciseKey','squat','sets',4,'reps','5-6','restSec',150),jsonb_build_object('exerciseKey','bench-press','sets',4,'reps','5-6','restSec',150),jsonb_build_object('exerciseKey','row','sets',3,'reps','6-8','restSec',120)) WHEN 'hypertrophy' THEN jsonb_build_array(jsonb_build_object('exerciseKey','squat','sets',3,'reps','8-12','restSec',90),jsonb_build_object('exerciseKey','shoulder-press','sets',3,'reps','8-12','restSec',90),jsonb_build_object('exerciseKey','lat-pulldown','sets',3,'reps','8-12','restSec',90)) WHEN 'fat_loss' THEN jsonb_build_array(jsonb_build_object('exerciseKey','squat','sets',3,'reps','10-15','restSec',45),jsonb_build_object('exerciseKey','push-up','sets',3,'reps','8-15','restSec',45),jsonb_build_object('exerciseKey','lunge','sets',3,'reps','10-12','restSec',45)) WHEN 'skill' THEN jsonb_build_array(jsonb_build_object('exerciseKey','push-up','sets',3,'reps','6-12','restSec',90),jsonb_build_object('exerciseKey','pull-up','sets',4,'reps','assisted 4-8','restSec',120),jsonb_build_object('exerciseKey','hollow-hold','sets',3,'reps','20-40 sec','restSec',60)) WHEN 'mobility' THEN jsonb_build_array(jsonb_build_object('exerciseKey','cat-cow','sets',2,'reps','8-10','restSec',30),jsonb_build_object('exerciseKey','hip-flexor-stretch','sets',2,'reps','30-45 sec','restSec',30),jsonb_build_object('exerciseKey','spine-twist','sets',2,'reps','8-10','restSec',30)) ELSE jsonb_build_array(jsonb_build_object('exerciseKey','squat','sets',3,'reps','8-12','restSec',90),jsonb_build_object('exerciseKey','push-up','sets',3,'reps','8-15','restSec',75),jsonb_build_object('exerciseKey','row','sets',3,'reps','8-12','restSec',90)) END)
FROM "FitnessProgram" p JOIN "FitnessProgramVersion" v ON v."programId"=p."id" AND v.version=1
CROSS JOIN LATERAL generate_series(1,p."durationWeeks") AS w(week)
CROSS JOIN LATERAL generate_series(1,p."sessionsPerWeek") AS d(day);

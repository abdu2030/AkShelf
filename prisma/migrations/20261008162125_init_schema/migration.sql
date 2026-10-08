-- CreateEnum
CREATE TYPE "MediaType" AS ENUM ('MOVIE', 'TV', 'ANIME');

-- CreateEnum
CREATE TYPE "WatchStatus" AS ENUM ('WATCHED', 'WATCHING', 'PLAN_TO_WATCH', 'ON_HOLD', 'DROPPED');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "image" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "titles" (
    "id" TEXT NOT NULL,
    "external_source" TEXT NOT NULL,
    "external_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" "MediaType" NOT NULL,
    "year" INTEGER,
    "overview" TEXT,
    "poster_url" TEXT,
    "backdrop_url" TEXT,
    "genres" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "titles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seasons" (
    "id" TEXT NOT NULL,
    "title_id" TEXT NOT NULL,
    "season_number" INTEGER NOT NULL,
    "name" TEXT,
    "episode_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "seasons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "episodes" (
    "id" TEXT NOT NULL,
    "season_id" TEXT NOT NULL,
    "external_id" TEXT,
    "episode_number" INTEGER NOT NULL,
    "name" TEXT,
    "air_date" TEXT,
    "runtime" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "episodes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_titles" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "title_id" TEXT NOT NULL,
    "status" "WatchStatus" NOT NULL,
    "rating" DOUBLE PRECISION,
    "watched_at" TIMESTAMP(3),
    "started_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_titles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_episodes" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "episode_id" TEXT NOT NULL,
    "watched_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_episodes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "watch_history" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "title_id" TEXT NOT NULL,
    "episode_id" TEXT,
    "action" TEXT NOT NULL,
    "occurred_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "watch_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "titles_external_source_external_id_idx" ON "titles"("external_source", "external_id");

-- CreateIndex
CREATE INDEX "titles_type_idx" ON "titles"("type");

-- CreateIndex
CREATE UNIQUE INDEX "titles_external_source_external_id_key" ON "titles"("external_source", "external_id");

-- CreateIndex
CREATE INDEX "seasons_title_id_idx" ON "seasons"("title_id");

-- CreateIndex
CREATE UNIQUE INDEX "seasons_title_id_season_number_key" ON "seasons"("title_id", "season_number");

-- CreateIndex
CREATE INDEX "episodes_season_id_idx" ON "episodes"("season_id");

-- CreateIndex
CREATE UNIQUE INDEX "episodes_season_id_episode_number_key" ON "episodes"("season_id", "episode_number");

-- CreateIndex
CREATE INDEX "user_titles_user_id_status_idx" ON "user_titles"("user_id", "status");

-- CreateIndex
CREATE INDEX "user_titles_user_id_idx" ON "user_titles"("user_id");

-- CreateIndex
CREATE INDEX "user_titles_title_id_idx" ON "user_titles"("title_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_titles_user_id_title_id_key" ON "user_titles"("user_id", "title_id");

-- CreateIndex
CREATE INDEX "user_episodes_user_id_idx" ON "user_episodes"("user_id");

-- CreateIndex
CREATE INDEX "user_episodes_episode_id_idx" ON "user_episodes"("episode_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_episodes_user_id_episode_id_key" ON "user_episodes"("user_id", "episode_id");

-- CreateIndex
CREATE INDEX "watch_history_user_id_occurred_at_idx" ON "watch_history"("user_id", "occurred_at");

-- CreateIndex
CREATE INDEX "watch_history_user_id_idx" ON "watch_history"("user_id");

-- CreateIndex
CREATE INDEX "watch_history_title_id_idx" ON "watch_history"("title_id");

-- AddForeignKey
ALTER TABLE "seasons" ADD CONSTRAINT "seasons_title_id_fkey" FOREIGN KEY ("title_id") REFERENCES "titles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "episodes" ADD CONSTRAINT "episodes_season_id_fkey" FOREIGN KEY ("season_id") REFERENCES "seasons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_titles" ADD CONSTRAINT "user_titles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_titles" ADD CONSTRAINT "user_titles_title_id_fkey" FOREIGN KEY ("title_id") REFERENCES "titles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_episodes" ADD CONSTRAINT "user_episodes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_episodes" ADD CONSTRAINT "user_episodes_episode_id_fkey" FOREIGN KEY ("episode_id") REFERENCES "episodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "watch_history" ADD CONSTRAINT "watch_history_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "watch_history" ADD CONSTRAINT "watch_history_title_id_fkey" FOREIGN KEY ("title_id") REFERENCES "titles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "watch_history" ADD CONSTRAINT "watch_history_episode_id_fkey" FOREIGN KEY ("episode_id") REFERENCES "episodes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

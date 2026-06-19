-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- CreateIndex
CREATE INDEX "Node_name_idx" ON "Node" USING GIN ("name" gin_trgm_ops);

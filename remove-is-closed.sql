-- Drop the isClosed column from AcademicYear table
ALTER TABLE "AcademicYear" DROP COLUMN IF EXISTS "isClosed";

-- Drop the index on isClosed if it exists
DROP INDEX IF EXISTS "AcademicYear_isClosed_idx";

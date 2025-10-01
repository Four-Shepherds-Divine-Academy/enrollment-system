-- Fix enrollment sections by extracting the section name from the full string
UPDATE "Enrollment"
SET section = CASE
    WHEN section::text LIKE '%Enthusiasm%' THEN 'Enthusiasm'::"Section"
    WHEN section::text LIKE '%Generosity%' THEN 'Generosity'::"Section"
    WHEN section::text LIKE '%Obedience%' THEN 'Obedience'::"Section"
    WHEN section::text LIKE '%Hospitality%' THEN 'Hospitality'::"Section"
    WHEN section::text LIKE '%Simplicity%' THEN 'Simplicity'::"Section"
    WHEN section::text LIKE '%Benevolence%' THEN 'Benevolence'::"Section"
    WHEN section::text LIKE '%Sincerity%' THEN 'Sincerity'::"Section"
    WHEN section::text LIKE '%Responsibility%' THEN 'Responsibility'::"Section"
    WHEN section::text LIKE '%Perseverance%' THEN 'Perseverance'::"Section"
    WHEN section::text LIKE '%Integrity%' THEN 'Integrity'::"Section"
    WHEN section::text LIKE '%Optimism%' THEN 'Optimism'::"Section"
    WHEN section::text LIKE '%Dependability%' THEN 'Dependability'::"Section"
    ELSE section
END
WHERE section::text LIKE '% - %';

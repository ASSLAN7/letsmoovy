-- Move btree_gist extension to extensions schema
DROP EXTENSION IF EXISTS btree_gist CASCADE;
CREATE EXTENSION btree_gist SCHEMA extensions;
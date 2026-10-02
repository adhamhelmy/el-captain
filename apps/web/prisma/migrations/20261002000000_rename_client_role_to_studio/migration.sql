-- Rename the CLIENT role to STUDIO; existing rows keep their role.
ALTER TYPE "Role" RENAME VALUE 'CLIENT' TO 'STUDIO';

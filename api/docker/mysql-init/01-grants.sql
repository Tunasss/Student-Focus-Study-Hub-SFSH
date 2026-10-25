-- Allow the app user to create Prisma's shadow database during `prisma migrate dev`.
GRANT ALL PRIVILEGES ON *.* TO 'sfsh'@'%';
FLUSH PRIVILEGES;

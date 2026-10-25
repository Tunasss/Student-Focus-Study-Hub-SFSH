// Minimal in-memory stand-in for the Prisma user model used by auth routes.
function createFakePrisma() {
  const users = [];
  let nextId = 1;

  return {
    users,
    user: {
      async findUnique({ where }) {
        return users.find((u) => (where.id !== undefined ? u.id === where.id : u.email === where.email)) ?? null;
      },
      async create({ data }) {
        const user = { id: nextId++, createdAt: new Date(), ...data };
        users.push(user);
        return user;
      },
    },
  };
}

module.exports = { createFakePrisma };

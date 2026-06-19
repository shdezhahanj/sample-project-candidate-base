import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  await prisma.node.deleteMany();
  await prisma.user.deleteMany();

  const alice = await prisma.user.create({ data: { email: 'alice@example.com', name: 'Alice' } });
  const bob = await prisma.user.create({ data: { email: 'bob@example.com', name: 'Bob' } });
  const charlie = await prisma.user.create({ data: { email: 'charlie@example.com', name: 'Charlie' } });

  const root = await prisma.node.create({
    data: {
      name: 'Root',
      type: 'FOLDER',
      owners: { connect: [{ id: alice.id }, { id: bob.id }] },
    },
  });

  const documents = await prisma.node.create({
    data: {
      name: 'Documents',
      type: 'FOLDER',
      parentId: root.id,
      owners: { connect: [{ id: alice.id }] },
    },
  });

  const projects = await prisma.node.create({
    data: {
      name: 'Projects',
      type: 'FOLDER',
      parentId: root.id,
      owners: { connect: [{ id: bob.id }, { id: charlie.id }] },
    },
  });

  await prisma.node.create({
    data: {
      name: 'Resume.pdf',
      type: 'FILE',
      parentId: documents.id,
      owners: { connect: [{ id: alice.id }] },
    },
  });

  await prisma.node.create({
    data: {
      name: 'App',
      type: 'FOLDER',
      parentId: projects.id,
      owners: { connect: [{ id: charlie.id }] },
    },
  });

  console.log('Seed completed.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

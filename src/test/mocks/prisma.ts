export const createMockPrisma = () => {
  return {
    $executeRaw: async () => {},
    $disconnect: async () => {},
    // Stub other prisma methods
  };
};

const { PrismaClient } = require('@prisma/client');
const client = new PrismaClient();

const withRLS = client.$extends({
    query: {
        $allModels: {
            async $allOperations({ model, operation, args, query }) {
                if (['findUnique'].includes(operation)) {
                    args.where = { ...args.where, tenantId: 'test' };
                }
                return query(args);
            }
        }
    }
});

async function main() {
    try {
        await withRLS.product.findUnique({ where: { id: 1 } });
        console.log("SUCCESS");
    } catch (e) {
        console.error("ERROR:", e.message);
    }
}
main();

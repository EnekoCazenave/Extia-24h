import { buildApp } from '../../src/app.js';
export async function buildTestApp() {
    // Silence logs in tests
    const app = await buildApp({ logger: false });
    await app.ready();
    return app;
}
//# sourceMappingURL=buildApp.js.map
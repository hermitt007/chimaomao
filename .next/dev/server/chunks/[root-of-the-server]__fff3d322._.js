module.exports = [
"[externals]/next/dist/compiled/next-server/app-route-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-route-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/@opentelemetry/api [external] (next/dist/compiled/@opentelemetry/api, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/@opentelemetry/api", () => require("next/dist/compiled/@opentelemetry/api"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-unit-async-storage.external.js [external] (next/dist/server/app-render/work-unit-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-unit-async-storage.external.js", () => require("next/dist/server/app-render/work-unit-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-async-storage.external.js [external] (next/dist/server/app-render/work-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-async-storage.external.js", () => require("next/dist/server/app-render/work-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/after-task-async-storage.external.js [external] (next/dist/server/app-render/after-task-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/after-task-async-storage.external.js", () => require("next/dist/server/app-render/after-task-async-storage.external.js"));

module.exports = mod;
}),
"[project]/app/api/youtube/download/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// app/api/youtube/download/route.ts
__turbopack_context__.s([
    "POST",
    ()=>POST
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/server.js [app-route] (ecmascript)");
;
// Lista de instancias de Cobalt (si una falla, prueba la siguiente)
const COBALT_INSTANCES = [
    "https://api.cobalt.tools",
    "https://cobalt.wuk.sh",
    "https://cobalt.tools"
];
async function POST(req) {
    try {
        const { url } = await req.json();
        if (!url) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: 'Falta la URL'
            }, {
                status: 400
            });
        }
        console.log(`[Cobalt Proxy] Procesando: ${url}`);
        let downloadUrl = '';
        let usedInstance = '';
        // 1. Intentar obtener el link de descarga de alguna instancia
        for (const instance of COBALT_INSTANCES){
            try {
                console.log(`Trying instance: ${instance}`);
                const apiResponse = await fetch(`${instance}/api/json`, {
                    method: 'POST',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        url: url,
                        vCodec: "h264",
                        vQuality: "720",
                        filenamePattern: "basic"
                    })
                });
                const data = await apiResponse.json();
                if (data.url) {
                    downloadUrl = data.url;
                    usedInstance = instance;
                    break; // ¡Éxito! Salimos del bucle
                }
            } catch (e) {
                console.warn(`Fallo en instancia ${instance}, probando siguiente...`);
            }
        }
        if (!downloadUrl) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: 'Ninguna instancia de descarga respondió. Intenta más tarde.'
            }, {
                status: 503
            });
        }
        console.log(`[Cobalt Proxy] Descargando túnel desde: ${downloadUrl}`);
        // 2. Descargar el archivo real desde el túnel
        const videoResponse = await fetch(downloadUrl);
        if (!videoResponse.ok) {
            throw new Error(`Error descargando el archivo final: ${videoResponse.status}`);
        }
        // 3. Devolver el stream al frontend (sin cargar la RAM)
        const headers = new Headers();
        headers.set('Content-Type', 'video/mp4');
        headers.set('Content-Disposition', 'attachment; filename="video.mp4"');
        // Si podemos saber el tamaño, lo pasamos para la barra de progreso
        const size = videoResponse.headers.get('content-length');
        if (size) headers.set('Content-Length', size);
        return new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"](videoResponse.body, {
            status: 200,
            headers
        });
    } catch (error) {
        console.error("[Cobalt Error]:", error);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: error.message || 'Error interno'
        }, {
            status: 500
        });
    }
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__fff3d322._.js.map
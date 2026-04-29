import { Lexer } from "./src/lexer.ts";
import { Parser } from "./src/parser.ts";
import { Interpreter, Environment } from "./src/interpreter.ts";
import { kToString } from "./src/types.ts";

const serveOptions = {
    port: 8000,
};

async function handleEval(req: Request): Promise<Response> {
    const { code } = await req.json();
    try {
        const lexer = new Lexer(code);
        const tokens = lexer.tokenize();
        const parser = new Parser(tokens);
        const ast = parser.parse();
        const env = new Environment();
        const interpreter = new Interpreter(env);
        
        let lastResult = "";
        for (const node of ast.body) {
            const res = interpreter.eval(node);
            lastResult = kToString(res);
        }
        
        return new Response(JSON.stringify({ result: lastResult }), {
            headers: { "Content-Type": "application/json" },
        });
    } catch (e: any) {
        return new Response(JSON.stringify({ error: e.message }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
        });
    }
}

async function handleStatic(req: Request): Promise<Response> {
    const url = new URL(req.url);
    let path = url.pathname;
    if (path === "/") path = "/index.html";
    
    try {
        const content = await Deno.readFile(`./public${path}`);
        let contentType = "text/plain";
        if (path.endsWith(".html")) contentType = "text/html";
        else if (path.endsWith(".js")) contentType = "application/javascript";
        else if (path.endsWith(".css")) contentType = "text/css";
        
        return new Response(content, {
            headers: { "Content-Type": contentType },
        });
    } catch {
        return new Response("Not Found", { status: 404 });
    }
}

console.log(`Server running at http://localhost:${serveOptions.port}`);
Deno.serve(serveOptions, (req) => {
    const url = new URL(req.url);
    if (url.pathname === "/api/eval" && req.method === "POST") {
        return handleEval(req);
    }
    return handleStatic(req);
});

import { Lexer } from "./src/lexer.ts";
import { Parser } from "./src/parser.ts";
import { Interpreter, Environment } from "./src/interpreter.ts";
import { kToString } from "./src/types.ts";

function repl() {
    const interpreter = new Interpreter();
    console.log("K-like compiler/interpreter REPL");
    console.log("Type 'exit' to quit");

    const decoder = new TextDecoder();
    
    // Simple REPL loop
    async function loop() {
        while (true) {
            try {
                // Assuming deno, print prompt
                await Deno.stdout.write(new TextEncoder().encode("  "));
                
                const buffer = new Uint8Array(1024);
                const n = await Deno.stdin.read(buffer);
                if (n === null) break;
                
                const input = decoder.decode(buffer.subarray(0, n)).trim();
                
                if (input === 'exit' || input === 'quit') {
                    break;
                }
                if (input === '') continue;

                const lexer = new Lexer(input);
                const tokens = lexer.tokenize();
                
                const parser = new Parser(tokens);
                const ast = parser.parse();

                const result = interpreter.eval(ast);
                console.log(kToString(result));
            } catch (error: any) {
                console.error("Error:", error.message);
            }
        }
    }
    loop();
}

function runFile(filename: string) {
    try {
        const source = Deno.readTextFileSync(filename);
        const lexer = new Lexer(source);
        const tokens = lexer.tokenize();
        const parser = new Parser(tokens);
        const ast = parser.parse();
        const env = new Environment();
        const interpreter = new Interpreter(env);
        
        for (const node of ast.body) {
            const res = interpreter.eval(node);
            console.log(kToString(res));
        }
    } catch (error: any) {
        console.error(`Error running ${filename}:`, error.message);
        Deno.exit(1);
    }
}

if (Deno.args.length > 0) {
    runFile(Deno.args[0]);
} else {
    repl();
}

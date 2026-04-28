import { assertEquals } from "https://deno.land/std@0.208.0/assert/mod.ts";
import { Lexer } from "./src/lexer.ts";
import { Parser } from "./src/parser.ts";
import { Interpreter } from "./src/interpreter.ts";
import { kToString, kInt, kList } from "./src/types.ts";

function evalSrc(src: string): string {
    const lexer = new Lexer(src);
    const parser = new Parser(lexer.tokenize());
    const ast = parser.parse();
    const interpreter = new Interpreter();
    return kToString(interpreter.eval(ast));
}

Deno.test("Evaluates simple arithmetic", () => {
    assertEquals(evalSrc("2 + 3"), "5");
    assertEquals(evalSrc("2 * 3 + 4"), "14"); // right-to-left
});

Deno.test("Evaluates array arithmetic", () => {
    assertEquals(evalSrc("1 2 3 + 10"), "11 12 13");
    assertEquals(evalSrc("10 * 1 2 3"), "10 20 30");
    assertEquals(evalSrc("1 2 3 + 4 5 6"), "5 7 9");
});

Deno.test("Evaluates assignment and variables", () => {
    const lexer = new Lexer("a: 10; a * 2");
    const parser = new Parser(lexer.tokenize());
    const interpreter = new Interpreter();
    const result = interpreter.eval(parser.parse());
    assertEquals(kToString(result), "20");
});

Deno.test("Evaluates iota (!)", () => {
    assertEquals(evalSrc("!5"), "0 1 2 3 4");
});

Deno.test("Evaluates count (#)", () => {
    assertEquals(evalSrc("#!5"), "5");
    assertEquals(evalSrc("#10"), "1");
});

Deno.test("Evaluates indexing", () => {
    assertEquals(evalSrc("a: 10 20 30; a[1]"), "20");
    assertEquals(evalSrc("a: 10 20 30; a[0 2]"), "10 30");
});

Deno.test("Evaluates functions", () => {
    assertEquals(evalSrc("f: {x + y}; f[10; 20]"), "30");
    assertEquals(evalSrc("f: {x * 2}; f 5"), "10"); // Adjacency application
});

Deno.test("Evaluates min/max", () => {
    assertEquals(evalSrc("10 & 20"), "10");
    assertEquals(evalSrc("10 | 20"), "20");
});

Deno.test("Evaluates find/index of (?)", () => {
    assertEquals(evalSrc("10 20 30 ? 20"), "1");
    assertEquals(evalSrc("10 20 30 ? 40"), "3");
});

Deno.test("Evaluates type (@)", () => {
    assertEquals(evalSrc("@10"), "`i");
    assertEquals(evalSrc("@10.5"), "`f");
    assertEquals(evalSrc("@10 20"), "`L");
});

Deno.test("Evaluates cast to string ($)", () => {
    assertEquals(evalSrc("$10"), '"10"');
    assertEquals(evalSrc("$10 20"), '"10 20"');
});

Deno.test("Evaluates adverbs (+/)", () => {
    assertEquals(evalSrc("+/ 1 2 3 4"), "10");
    assertEquals(evalSrc("*/ 1 2 3 4"), "24");
});

Deno.test("Evaluates Take (#)", () => {
    assertEquals(evalSrc("2 # 10 20 30"), "10 20");
    assertEquals(evalSrc("-2 # 10 20 30"), "20 30");
});

Deno.test("Evaluates Drop (_)", () => {
    assertEquals(evalSrc("1 _ 10 20 30"), "20 30");
});

Deno.test("Evaluates Where (&)", () => {
    assertEquals(evalSrc("& 1 0 1 1"), "0 2 3");
});

Deno.test("Evaluates Match (~)", () => {
    assertEquals(evalSrc("1 2 3 ~ 1 2 3"), "1");
    assertEquals(evalSrc("1 2 3 ~ 1 2"), "0");
});

Deno.test("Evaluates Conditional ($[])", () => {
    assertEquals(evalSrc("$[1; 10; 20]"), "10");
    assertEquals(evalSrc("$[0; 10; 20]"), "20");
});

Deno.test("Evaluates Dictionaries (!)", () => {
    assertEquals(evalSrc("d: `a`b!10 20; d[`a]"), "10");
    assertEquals(evalSrc("d: `a`b!10 20; d[`b]"), "20");
});

Deno.test("Evaluates Scan (\\)", () => {
    assertEquals(evalSrc("+\\ 1 2 3"), "1 3 6");
});

Deno.test("Evaluates Each (')", () => {
    assertEquals(evalSrc("! ' 2 3"), "(0 1; 0 1 2)");
});

Deno.test("Evaluates Reshape (#)", () => {
    assertEquals(evalSrc("2 3 # !6"), "(0 1 2; 3 4 5)");
    assertEquals(evalSrc("5 # 1 2"), "1 2 1 2 1");
});

Deno.test("Evaluates Reverse and Rotate (|)", () => {
    assertEquals(evalSrc("| 1 2 3"), "3 2 1");
    assertEquals(evalSrc("1 | 1 2 3"), "2 3 1");
    assertEquals(evalSrc("-1 | 1 2 3"), "3 1 2");
});

Deno.test("Evaluates Each Left (\\:)", () => {
    assertEquals(evalSrc("1 2 3 +\\: 10"), "11 12 13");
});

Deno.test("Evaluates Each Right (/:)", () => {
    assertEquals(evalSrc("10 +/: 1 2 3"), "11 12 13");
});

Deno.test("Evaluates Flip / Transpose (+)", () => {
    assertEquals(evalSrc("+ (1 2; 3 4)"), "(1 3; 2 4)");
    // Dict flip into table
    assertEquals(evalSrc("+ `a`b!(1 2; 3 4)"), "(`a `b!1 3; `a `b!2 4)");
});

Deno.test("Evaluates Key (!) and Value (.)", () => {
    assertEquals(evalSrc("! `a`b!1 2"), "`a `b");
    assertEquals(evalSrc(". `a`b!1 2"), "1 2");
});

Deno.test("Evaluates Deep Indexing (.)", () => {
    assertEquals(evalSrc("(1 2; 3 4) . 0 1"), "2");
    assertEquals(evalSrc("(1 2; 3 4) . 1 0"), "3");
});

Deno.test("Evaluates Grade Up (<) and Down (>)", () => {
    assertEquals(evalSrc("< 30 10 20"), "1 2 0");
    assertEquals(evalSrc("> 30 10 20"), "0 2 1");
});

Deno.test("Evaluates Group (=)", () => {
    // Note: dictionary output format keys!values
    assertEquals(evalSrc("= 1 0 1 1"), "1 0!(0 2 3; (1))");
});

Deno.test("Evaluates Enlist (,) and Floor (_)", () => {
    assertEquals(evalSrc(", 10"), "(10)");
    assertEquals(evalSrc("_ 10.5"), "10");
    assertEquals(evalSrc("_ 1.2 2.9"), "1 2");
});

Deno.test("Evaluates Built-in Math Functions", () => {
    assertEquals(evalSrc("abs -10"), "10");
    assertEquals(evalSrc("sqrt 16"), "4");
    assertEquals(evalSrc("floor 10.5"), "10");
    assertEquals(evalSrc("abs -1 -2 3"), "1 2 3");
});

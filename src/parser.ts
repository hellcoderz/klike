import { Token, TokenType } from "./lexer.ts";

export type ASTNode = 
    | ProgramNode
    | NumberNode
    | IdentifierNode
    | StringNode
    | SymbolNode
    | ArrayNode
    | FunctionCallNode
    | AssignmentNode
    | BinaryOpNode
    | UnaryOpNode
    | IndexNode
    | FunctionNode
    | AdverbNode
    | ConditionalNode
    | AmendedAssignmentNode
    | OperatorNode;

export interface ProgramNode { type: 'Program'; body: ASTNode[]; }
export interface NumberNode { type: 'Number'; value: number; }
export interface IdentifierNode { type: 'Identifier'; name: string; }
export interface StringNode { type: 'String'; value: string; }
export interface SymbolNode { type: 'Symbol'; value: string; }
export interface ArrayNode { type: 'Array'; elements: ASTNode[]; }
export interface FunctionCallNode { type: 'FunctionCall'; func: ASTNode; args: ASTNode[]; }
export interface AssignmentNode { type: 'Assignment'; name: string; value: ASTNode; }
export interface BinaryOpNode { type: 'BinaryOp'; op: string; left: ASTNode; right: ASTNode; adverb?: string; }
export interface UnaryOpNode { type: 'UnaryOp'; op: string; right: ASTNode; adverb?: string; }
export interface IndexNode { type: 'Index'; target: ASTNode; indices: ASTNode[]; }
export interface FunctionNode { type: 'Function'; params: string[]; body: ASTNode[]; }
export interface AdverbNode { type: 'Adverb'; adverb: string; verb: ASTNode; }
export interface ConditionalNode { type: 'Conditional'; cond: ASTNode; trueBranch: ASTNode; falseBranch: ASTNode; }
export interface AmendedAssignmentNode { type: 'AmendedAssignment'; target: ASTNode; indices: ASTNode[]; value: ASTNode; }
export interface OperatorNode { type: 'Operator'; value: string; }

export class Parser {
    private tokens: Token[];
    private current: number = 0;

    constructor(tokens: Token[]) {
        this.tokens = tokens;
    }

    private peek(): Token {
        return this.tokens[this.current];
    }

    private previous(): Token {
        return this.tokens[this.current - 1];
    }

    private advance(): Token {
        if (!this.isAtEnd()) this.current++;
        return this.previous();
    }

    private isAtEnd(): boolean {
        return this.peek().type === TokenType.EOF;
    }

    private match(...types: TokenType[]): boolean {
        for (const type of types) {
            if (this.check(type)) {
                this.advance();
                return true;
            }
        }
        return false;
    }

    private check(type: TokenType): boolean {
        if (this.isAtEnd()) return false;
        return this.peek().type === type;
    }

    private consume(type: TokenType, message: string): Token {
        if (this.check(type)) return this.advance();
        const token = this.peek();
        throw new Error(`Parse error at line ${token.line}, col ${token.col}: ${message}`);
    }

    public parse(): ProgramNode {
        const body: ASTNode[] = [];
        while (!this.isAtEnd()) {
            if (this.check(TokenType.SEMI)) { this.advance(); continue; }
            body.push(this.parseExpression());
            while (!this.isAtEnd() && this.check(TokenType.SEMI)) this.advance();
        }
        return { type: 'Program', body };
    }

    private parseExpression(): ASTNode {
        if (this.check(TokenType.IDENTIFIER) && this.peekNext()?.type === TokenType.COLON) {
            const name = this.advance().value;
            this.advance(); // consume :
            return { type: 'Assignment', name, value: this.parseExpression() };
        }
        const left = this.parseBinary();
        if (this.match(TokenType.COLON)) {
            if (left.type === 'Index') {
                return { type: 'AmendedAssignment', target: left.target, indices: left.indices, value: this.parseExpression() };
            }
            throw new Error("Invalid assignment target");
        }
        return left;
    }

    private peekNext(): Token | null {
        if (this.current + 1 >= this.tokens.length) return null;
        return this.tokens[this.current + 1];
    }

    private parseBinary(): ASTNode {
        let left = this.parseUnary();
        if (this.check(TokenType.OPERATOR)) {
            const op = this.advance().value;
            let adverb: string | undefined;
            if (this.check(TokenType.OPERATOR)) {
                const a = this.peek().value;
                if (a === '/' || a === '\\' || a === "'") {
                    this.advance();
                    adverb = a;
                    if (this.match(TokenType.COLON)) adverb += ':';
                }
            }
            return { type: 'BinaryOp', op, left, right: this.parseBinary(), adverb };
        } 
        // Noun Verb Noun (Infix function application)
        else if (this.checkAtom() && !this.isNounAdjacency(left)) {
             const verb = this.parseUnary();
             if (this.isVerb(verb) || (verb.type === 'Index' && this.isVerb(verb.target))) {
                 if (verb.type === 'Index' && verb.indices.length === 1) {
                     verb.indices = [left, verb.indices[0]];
                     return verb;
                 }
                 const right = this.parseBinary();
                 return { type: 'Index', target: verb, indices: [left, right] };
             }
        }
        return left;
    }

    private isNounAdjacency(left: ASTNode): boolean {
        return this.isNoun(left) && this.checkAtom() && !this.isVerbAtom(this.peek());
    }

    private isVerbAtom(token: Token): boolean {
        return token.type === TokenType.LBRACE || token.type === TokenType.IDENTIFIER;
    }

    private parseUnary(): ASTNode {
        if (this.check(TokenType.OPERATOR)) {
            if (this.peek().value === '$' && this.peekNext()?.type === TokenType.LBRACKET) {
                return this.parsePostfix();
            }
            const op = this.advance().value;
            let adverb: string | undefined;
            if (this.check(TokenType.OPERATOR)) {
                const a = this.peek().value;
                if (a === '/' || a === '\\' || a === "'") {
                    this.advance();
                    adverb = a;
                    if (this.match(TokenType.COLON)) adverb += ':';
                }
            }
            return { type: 'UnaryOp', op, right: this.parseBinary(), adverb };
        }
        return this.parsePostfix();
    }

    private parsePostfix(): ASTNode {
        let expr = this.parsePrimary();
        while (true) {
            if (this.match(TokenType.LBRACKET)) {
                const indices: ASTNode[] = [];
                if (!this.check(TokenType.RBRACKET)) {
                    do {
                        indices.push(this.parseExpression());
                    } while (this.match(TokenType.SEMI));
                }
                this.consume(TokenType.RBRACKET, "Expected ']' after indices.");
                expr = { type: 'Index', target: expr, indices };
            } else if (this.check(TokenType.OPERATOR)) {
                const a = this.peek().value;
                if ((a === '/' || a === '\\' || a === "'") && (expr.type === 'Function' || expr.type === 'Adverb')) {
                    this.advance();
                    let adverb = a;
                    if (this.match(TokenType.COLON)) adverb += ':';
                    expr = { type: 'Adverb', adverb, verb: expr };
                } else {
                    break;
                }
            } else if (this.checkAtom()) {
                if (this.check(TokenType.IDENTIFIER) && this.peekNext()?.type === TokenType.COLON) break;

                if (this.isVerb(expr)) {
                    const arg = this.parsePostfix();
                    expr = { type: 'Index', target: expr, indices: [arg] };
                } else if (this.checkPrimitive() && this.isNoun(expr)) {
                    const elements: ASTNode[] = [expr];
                    while (this.checkPrimitive()) {
                        elements.push(this.parsePrimary());
                    }
                    expr = { type: 'Array', elements };
                } else {
                    break;
                }
            } else {
                break;
            }
        }
        return expr;
    }

    private isVerb(node: ASTNode): boolean {
        return node.type === 'Function' || node.type === 'Adverb' || node.type === 'Identifier' || (node.type === 'BinaryOp' && !!node.adverb);
    }

    private isNoun(node: ASTNode): boolean {
        return node.type === 'Number' || node.type === 'String' || node.type === 'Symbol' || node.type === 'Array';
    }

    private checkAtom(): boolean {
        return this.checkPrimitive() || this.check(TokenType.LPAREN) || this.check(TokenType.LBRACE) || this.check(TokenType.IDENTIFIER);
    }

    private checkPrimitive(): boolean {
        return this.check(TokenType.NUMBER) || this.check(TokenType.STRING) || this.check(TokenType.SYMBOL);
    }

    private parsePrimary(): ASTNode {
        if (this.check(TokenType.OPERATOR) && this.peek().value === '$' && this.peekNext()?.type === TokenType.LBRACKET) {
            this.advance(); this.advance();
            const cond = this.parseExpression();
            this.consume(TokenType.SEMI, "Exp ';' after cond.");
            const trueBranch = this.parseExpression();
            this.consume(TokenType.SEMI, "Exp ';' after true.");
            const falseBranch = this.parseExpression();
            this.consume(TokenType.RBRACKET, "Exp ']' after cond.");
            return { type: 'Conditional', cond, trueBranch, falseBranch };
        }
        if (this.match(TokenType.NUMBER)) return { type: 'Number', value: parseFloat(this.previous().value) };
        if (this.match(TokenType.IDENTIFIER)) return { type: 'Identifier', name: this.previous().value };
        if (this.match(TokenType.STRING)) return { type: 'String', value: this.previous().value };
        if (this.match(TokenType.SYMBOL)) return { type: 'Symbol', value: this.previous().value };
        if (this.match(TokenType.LBRACE)) {
            let params: string[] = ['x', 'y', 'z'];
            if (this.check(TokenType.LBRACKET)) {
                this.advance(); params = [];
                if (!this.check(TokenType.RBRACKET)) {
                    do { params.push(this.consume(TokenType.IDENTIFIER, "Exp param name.").value); } while (this.match(TokenType.SEMI));
                }
                this.consume(TokenType.RBRACKET, "Exp ']' after params.");
            }
            const body: ASTNode[] = [];
            while (!this.check(TokenType.RBRACE) && !this.isAtEnd()) {
                body.push(this.parseExpression());
                if (this.check(TokenType.SEMI)) this.advance();
            }
            this.consume(TokenType.RBRACE, "Exp '}' after function body.");
            return { type: 'Function', params, body };
        }
        if (this.match(TokenType.LPAREN)) {
            const exprs: ASTNode[] = [];
            while (!this.check(TokenType.RPAREN) && !this.isAtEnd()) {
                exprs.push(this.parseExpression());
                if (this.check(TokenType.SEMI)) this.advance();
            }
            this.consume(TokenType.RPAREN, "Exp ')' after expression.");
            return exprs.length === 1 ? exprs[0] : { type: 'Array', elements: exprs };
        }
        throw new Error(`Unexpected token ${this.peek().type} ('${this.peek().value}') at line ${this.peek().line}, col ${this.peek().col}`);
    }
}

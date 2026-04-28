export enum TokenType {
    NUMBER = 'NUMBER',
    IDENTIFIER = 'IDENTIFIER',
    OPERATOR = 'OPERATOR',
    COLON = 'COLON',
    SEMI = 'SEMI',
    LPAREN = 'LPAREN',
    RPAREN = 'RPAREN',
    LBRACE = 'LBRACE',
    RBRACE = 'RBRACE',
    LBRACKET = 'LBRACKET',
    RBRACKET = 'RBRACKET',
    STRING = 'STRING',
    SYMBOL = 'SYMBOL',
    EOF = 'EOF'
}

export interface Token {
    type: TokenType;
    value: string;
    line: number;
    col: number;
}

export class Lexer {
    private source: string;
    private pos: number = 0;
    private line: number = 1;
    private col: number = 1;

    constructor(source: string) {
        this.source = source;
    }

    private peek(): string {
        return this.pos < this.source.length ? this.source[this.pos] : '\0';
    }

    private advance(): string {
        const char = this.peek();
        this.pos++;
        if (char === '\n') {
            this.line++;
            this.col = 1;
        } else {
            this.col++;
        }
        return char;
    }

    private match(char: string): boolean {
        if (this.peek() === char) {
            this.advance();
            return true;
        }
        return false;
    }

    private skipWhitespace() {
        while (true) {
            const char = this.peek();
            if (char === ' ' || char === '\t' || char === '\r') {
                this.advance();
            } else if (char === '/') {
                const prev = this.pos > 0 ? this.source[this.pos - 1] : '\n';
                if (prev === '\n' || prev === ' ' || prev === '\t') {
                    while (this.peek() !== '\n' && this.peek() !== '\0') this.advance();
                } else {
                    break;
                }
            } else {
                break;
            }
        }
    }

    private isDigit(char: string): boolean {
        return char >= '0' && char <= '9';
    }

    private isAlpha(char: string): boolean {
        return (char >= 'a' && char <= 'z') || (char >= 'A' && char <= 'Z');
    }

    public nextToken(): Token {
        this.skipWhitespace();

        if (this.pos >= this.source.length) {
            return { type: TokenType.EOF, value: '', line: this.line, col: this.col };
        }

        const startCol = this.col;
        const char = this.peek();

        if (char === '\n') {
            this.advance();
            return { type: TokenType.SEMI, value: ';', line: this.line, col: startCol };
        }

        if (this.isDigit(char) || (char === '-' && this.isDigit(this.source[this.pos + 1]))) {
            let value = '';
            if (char === '-') {
                value += this.advance();
            }
            while (this.isDigit(this.peek())) {
                value += this.advance();
            }
            if (this.peek() === '.') {
                value += this.advance();
                while (this.isDigit(this.peek())) {
                    value += this.advance();
                }
            }
            return { type: TokenType.NUMBER, value, line: this.line, col: startCol };
        }

        if (this.isAlpha(char)) {
            let value = '';
            while (this.isAlpha(this.peek()) || this.isDigit(this.peek())) {
                value += this.advance();
            }
            return { type: TokenType.IDENTIFIER, value, line: this.line, col: startCol };
        }

        if (char === '`') {
            this.advance(); // consume `
            let value = '';
            while (this.isAlpha(this.peek()) || this.isDigit(this.peek())) {
                value += this.advance();
            }
            return { type: TokenType.SYMBOL, value, line: this.line, col: startCol };
        }

        if (char === '"') {
            this.advance(); // consume "
            let value = '';
            while (this.peek() !== '"' && this.peek() !== '\0') {
                if (this.peek() === '\\') {
                    this.advance(); // consume \
                    const esc = this.advance();
                    if (esc === 'n') value += '\n';
                    else if (esc === 't') value += '\t';
                    else if (esc === 'r') value += '\r';
                    else if (esc === '"') value += '"';
                    else if (esc === '\\') value += '\\';
                    else value += esc;
                } else {
                    value += this.advance();
                }
            }
            if (this.peek() === '"') this.advance();
            return { type: TokenType.STRING, value, line: this.line, col: startCol };
        }

        const opChars = "+-*/%^!&#|<>~=,@$.?_\\'.";
        if (opChars.includes(char)) {
            this.advance();
            return { type: TokenType.OPERATOR, value: char, line: this.line, col: startCol };
        }

        switch (char) {
            case ':': this.advance(); return { type: TokenType.COLON, value: ':', line: this.line, col: startCol };
            case ';': this.advance(); return { type: TokenType.SEMI, value: ';', line: this.line, col: startCol };
            case '(': this.advance(); return { type: TokenType.LPAREN, value: '(', line: this.line, col: startCol };
            case ')': this.advance(); return { type: TokenType.RPAREN, value: ')', line: this.line, col: startCol };
            case '[': this.advance(); return { type: TokenType.LBRACKET, value: '[', line: this.line, col: startCol };
            case ']': this.advance(); return { type: TokenType.RBRACKET, value: ']', line: this.line, col: startCol };
            case '{': this.advance(); return { type: TokenType.LBRACE, value: '{', line: this.line, col: startCol };
            case '}': this.advance(); return { type: TokenType.RBRACE, value: '}', line: this.line, col: startCol };
        }

        throw new Error(`Unexpected character '${char}' at line ${this.line}, col ${this.col}`);
    }

    public tokenize(): Token[] {
        const tokens: Token[] = [];
        let token = this.nextToken();
        while (token.type !== TokenType.EOF) {
            tokens.push(token);
            token = this.nextToken();
        }
        tokens.push(token); // EOF
        return tokens;
    }
}

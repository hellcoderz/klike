# klike

`klike` is a lightweight, high-performance compiler and interpreter for a K-like array programming language, built with TypeScript and Deno. It brings the power of vector processing, functional adverbs, and concise array syntax to the Deno ecosystem.

## Features

### 🚀 Core Language Concepts
- **Right-to-Left Evaluation:** Expressions are evaluated from right to left (e.g., `2 * 3 + 4` is `2 * (3 + 4) = 14`).
- **Scalar Extension:** Primitive operations automatically apply element-wise to lists (e.g., `1 2 3 + 10` -> `11 12 13`).
- **First-Class Functions:** Define closures with `{[x;y] x+y}`. Implicit arguments `x`, `y`, and `z` are supported (e.g., `{x+1}`).
- **Dictionaries & Tables:** Create dictionaries with `keys!values` and flip them into columnar tables with `+`.

### 🛠 Supported Primitives

| Operator | Unary (Monadic) | Binary (Dyadic) |
| :--- | :--- | :--- |
| `+` | **Flip / Transpose** (Matrix or Dict) | **Add** |
| `-` | **Negate** | **Subtract** |
| `*` | **First** (planned) | **Multiply** |
| `%` | **Reciprocal** (planned) | **Divide** |
| `!` | **Iota** (enumerate) / **Keys** (dict) | **Key** (create dict) |
| `#` | **Count** | **Take / Reshape** |
| `_` | **Floor** / **Drop** (planned unary) | **Drop** |
| `,` | **Enlist** (wrap in list) | **Join / Concat** |
| `&` | **Where** (indices of non-zero) | **Min / And** |
| `\|` | **Reverse** | **Max / Or / Rotate** |
| `<` | **Grade Up** (sort indices ASC) | **Less Than** |
| `>` | **Grade Down** (sort indices DESC) | **Greater Than** |
| `=` | **Group By** (returns dict) | **Equals** |
| `~` | **Not** (planned unary) | **Match** (deep equality) |
| `?` | **Unique** (planned unary) | **Find / Index Of** |
| `@` | **Type Of** | **At / Apply** (planned binary) |
| `.` | **Values** (dict) | **Deep Indexing / Apply** |
| `$` | **String Cast** | **Cast** (planned binary) |

### ⚡️ Adverbs (Higher-Order Functions)
Adverbs modify verbs (operators or functions) to change their behavior over arrays:
- **Over (`/`):** Fold/Reduce (e.g., `+/ 1 2 3` -> `6`).
- **Scan (`\`):** Cumulative Fold (e.g., `+\ 1 2 3` -> `1 3 6`).
- **Each (`'`):** Map (e.g., `! ' 2 3` -> `(0 1; 0 1 2)`).
- **Each-Left (`\:`):** Fix right, iterate left (e.g., `1 2 3 +\: 10`).
- **Each-Right (`/:`):** Fix left, iterate right (e.g., `10 +/: 1 2 3`).

### 📊 Built-in Math Functions
Standard math functions are pre-loaded and support scalar extension:
`abs`, `sqrt`, `sin`, `cos`, `exp`, `log`, `floor`, `ceil`.

### 🎮 Control Flow
- **Conditional:** `$[condition; true_expr; false_expr]` (e.g., `$[x>0; `pos; `neg]`).

---

## Getting Started

### Prerequisites
- [Deno](https://deno.land/) installed on your machine.

### Installation
Clone the repository and navigate to the project folder:
```bash
git clone <repo-url>
cd klike
```

### Running the REPL
Start the interactive Read-Eval-Print Loop:
```bash
deno task run
```

### Executing a Script
Run any `.k` file:
```bash
deno run -A main.ts examples/01_basics.k
```

### Running Tests
Execute the comprehensive test suite:
```bash
deno task test
```

## Examples
The `examples/` directory contains various scripts demonstrating the language:
1. `01_basics.k`: Arithmetic and simple arrays.
2. `02_functions.k`: Closures and implicit arguments.
3. `03_advanced.k`: Vector indexing and type inspection.
4. `04_advanced_features.k`: Adverbs, Take/Drop, and Conditionals.
5. `05_dicts_and_adverbs.k`: Dictionary manipulation and Scans.
6. `06_matrix_and_tables.k`: Matrix transpose and Table operations.
7. `07_primitives_math.k`: Sorting (Grade Up/Down) and Math library.

## License
MIT

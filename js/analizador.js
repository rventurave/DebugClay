// Variables globales
const TokenType = Object.freeze({
  IDENTIFIER: 1,
  NUMBER: 2,
  OPERATOR: 3,
  POINTER: 4,
  DEREFERENCE: 5,
  MULTIPLICATION: 6,
  REFERENCE: 7,
  MALLOC: 8,
  CALLOC: 9,
  REALLOC: 10,
  FREE: 11,
  INT: 12,
  FLOAT: 13,
  DOUBLE: 14,
  CHAR: 15,
  VOID: 16,
  SHORT: 17,
  LONG: 18,
  SIGNED: 19,
  UNSIGNED: 20,
  IF: 21,
  ELSE: 22,
  FOR: 23,
  WHILE: 24,
  DO: 25,
  SWITCH: 26,
  RETURN: 27
});

const keywords = {
  "int": TokenType.INT,
  "float": TokenType.FLOAT,
  "double": TokenType.DOUBLE,
  "char": TokenType.CHAR,
  "void": TokenType.VOID,
  "short": TokenType.SHORT,
  "long": TokenType.LONG,
  "signed": TokenType.SIGNED,
  "unsigned": TokenType.UNSIGNED,
  "if": TokenType.IF,
  "else": TokenType.ELSE,
  "for": TokenType.FOR,
  "while": TokenType.WHILE,
  "do": TokenType.DO,
  "switch": TokenType.SWITCH,
  "return": TokenType.RETURN
};

export function lexerLine(lineText) {
  const tokens = [];
  const regex = /(\*\*+|\*|&&|&|[A-Za-z_]\w*|\d+|==|!=|<=|>=|[+\-*/=;(),{}])/g;
  const parts = lineText.match(regex) || [];

  let lastToken = null;

  for (let i = 0; i < parts.length; i++) {
    const t = parts[i];

    if (t === "malloc") {
      tokens.push([t, TokenType.MALLOC]);
    }
    else if (t === "calloc") {
      tokens.push([t, TokenType.CALLOC]);
    }
    else if (t === "realloc") {
      tokens.push([t, TokenType.REALLOC]);
    }
    else if (t === "free") {
      tokens.push([t, TokenType.FREE]);
    }
    else if (keywords[t]) {
      // ✅ Asigna el tipo exacto de palabra reservada
      tokens.push([t, keywords[t]]);
    }
    else if (/^[A-Za-z_]\w*$/.test(t)) {
      tokens.push([t, TokenType.IDENTIFIER]);
    }
    else if (/^\d+$/.test(t)) {
      tokens.push([t, TokenType.NUMBER]);
    }
    else if (t.startsWith("**")) {
      const level = t.length;
      tokens.push([t, `${TokenType.POINTER} nivel ${level}`]);
    }
    else if (t === "*") {
      if (lastToken && Object.values(keywords).includes(lastToken[1])) {
        tokens.push([t, TokenType.POINTER]);
      } else if (lastToken && lastToken[1] === TokenType.OPERATOR && lastToken[0] === "(") {
        tokens.push([t, TokenType.DEREFERENCE]);
      } else if (lastToken && lastToken[1] === TokenType.OPERATOR && lastToken[0] === "=") {
        tokens.push([t, TokenType.DEREFERENCE]);
      } else if (lastToken && lastToken[1] === TokenType.IDENTIFIER) {
        tokens.push([t, TokenType.MULTIPLICATION]);
      } else {
        tokens.push([t, TokenType.DEREFERENCE]);
      }
    }
    else if (t === "&") {
      tokens.push([t, TokenType.REFERENCE]);
    }
    else if (t === "&&") {
      tokens.push([t, `${TokenType.REFERENCE} doble`]);
    }
    else {
      tokens.push([t, TokenType.OPERATOR]);
    }

    lastToken = tokens[tokens.length - 1];
  }

  return tokens;
}

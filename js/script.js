const editor = CodeMirror.fromTextArea(document.getElementById("codeInput"), {
    lineNumbers: true,
    mode: "text/x-csrc", // o el lenguaje que prefieras
    theme: "default"
});
 
let currentLine = 0;
const arrow = document.getElementById("arrowIndicator");

// Estado global del ciclo for (¡mueve esto fuera de la función!)
let forState = null;

// Mueve la flecha a la línea indicada
function moveArrowToLine(line) {
    const lineHeight = editor.defaultTextHeight();
    const scrollInfo = editor.getScrollInfo();
    const visibleLines = Math.floor(scrollInfo.clientHeight / lineHeight);
    const firstVisible = editor.lineAtHeight(scrollInfo.top, "local");
    const lastVisible = firstVisible + visibleLines - 1;

    // Si la línea está fuera de la vista, haz scroll
    if (line < firstVisible) {
        editor.scrollTo(null, editor.heightAtLine(line, "local"));
    } else if (line > lastVisible) {
        editor.scrollTo(null, editor.heightAtLine(line - visibleLines + 1, "local"));
    }

    // Calcula la posición de la flecha solo dentro del área visible
    const relativeLine = Math.max(0, Math.min(line - firstVisible, visibleLines - 1));
    const codeMirrorTop = editor.getWrapperElement().getBoundingClientRect().top -
                          editor.getWrapperElement().parentElement.getBoundingClientRect().top;
    const offsetTop = codeMirrorTop + 4 + relativeLine * lineHeight; // 4px para alinear mejor
    arrow.style.top = offsetTop + "px";
}

// Inicializa la flecha en la primera línea
editor.on("refresh", () => moveArrowToLine(currentLine));
editor.on("changes", () => moveArrowToLine(currentLine));
moveArrowToLine(currentLine);

// Función para analizar la línea actual
function lexLine(lineText) {
    const tokensArray = new Array(100).fill(null);
    const regex = /\b[_a-zA-Z][_a-zA-Z0-9]*\b|\d+|==|!=|<=|>=|&&|\|\||[+\-*/%=<>{}()[\],;.]|"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'/g;
    let match;
    let i = 0;
    while ((match = regex.exec(lineText)) !== null && i < 100) {
        tokensArray[i++] = match[0];
    }
    return tokensArray;
}

// Ejemplo de uso: analizar la línea actual
function analyzeCurrentLine() {
    const stackVariables = [];
    const heapVariables = [];
    let argValues = [];

    // Obtiene los valores de entrada
    const entrada = document.getElementById("outputArea").value
        .split('\n')
        .map(v => v.trim())
        .filter(v => v.length > 0);

    // Detecta argumentos de función en la primera línea
    const firstLine = editor.getLine(0);
    let argNames = [];
    const funcArgsMatch = firstLine.match(/\(([^)]*)\)/);
    if (funcArgsMatch) {
        const argsStr = funcArgsMatch[1];
        argNames = argsStr.split(',')
            .map(s => s.trim())
            .map(s => {
                const parts = s.split(/\s+/);
                return parts[parts.length - 1];
            })
            .filter(name => /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name));
        argValues = entrada.slice(0, argNames.length).map(v => Number(v));
    }

    // Mapa de valores de variables
    const variableValues = {};
    // Asigna valores de argumentos
    argNames.forEach((arg, idx) => {
        variableValues[arg] = argValues[idx];
    });

    // Detecta el for en el código
    let forLine = -1, forVar, forInit, forCond, forInc;
    for (let i = 0; i <= currentLine; i++) {
        const lineText = editor.getLine(i);

        // Detecta el for
        const forMatch = lineText.match(/for\s*\(\s*(int\s+)?([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*(\d+)\s*;\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*<\s*([a-zA-Z_][a-zA-Z0-9_]*|\d+)\s*;\s*([a-zA-Z_][a-zA-Z0-9_]*)\+\+\s*\)/);
        if (forMatch) {
            forLine = i;
            forVar = forMatch[2];
            forInit = Number(forMatch[3]);
            forCond = forMatch[5];
            forInc = forMatch[6];
            // Inicializa el estado del for solo la primera vez
            if (!forState || forState.line !== forLine) {
                forState = {
                    line: forLine,
                    i: forInit,
                    done: false
                };
                variableValues[forVar] = forInit;
            }
        }

        // Heap: si la línea contiene 'malloc' o 'new'
        if (/malloc|new/.test(lineText)) {
            const match = lineText.match(/([a-zA-Z_][a-zA-Z0-9_]*)\s*=/);
            if (match && !heapVariables.includes(match[1])) heapVariables.push(match[1]);
        }
        // Stack: si la línea contiene declaración de tipo
        else if (/\b(int|float|double|char|bool)\b/.test(lineText)) {
            const declRegex = /\b(int|float|double|char|bool)\b\s+([a-zA-Z_][a-zA-Z0-9_]*)/g;
            let declMatch;
            while ((declMatch = declRegex.exec(lineText)) !== null) {
                if (!stackVariables.includes(declMatch[2])) stackVariables.push(declMatch[2]);
                // Inicializa en undefined si no tiene valor
                if (variableValues[declMatch[2]] === undefined) variableValues[declMatch[2]] = undefined;
            }
        }

        // Operaciones básicas de asignación (solo suma y resta de dos variables o valores)
        // Ejemplo: result = a + b;
        const assignMatch = lineText.match(/([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*([a-zA-Z_][a-zA-Z0-9_]*|\d+)\s*([\+\-\*\/])\s*([a-zA-Z_][a-zA-Z0-9_]*|\d+)/);
        if (assignMatch) {
            const varName = assignMatch[1];
            let left = assignMatch[2];
            let op = assignMatch[3];
            let right = assignMatch[4];
            left = variableValues[left] !== undefined ? variableValues[left] : Number(left);
            right = variableValues[right] !== undefined ? variableValues[right] : Number(right);
            let result;
            switch (op) {
                case '+': result = left + right; break;
                case '-': result = left - right; break;
                case '*': result = left * right; break;
                case '/': result = left / right; break;
            }
            variableValues[varName] = result;
        }
        // Asignación directa: result = 7;
        const directAssignMatch = lineText.match(/([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*(\d+)/);
        if (directAssignMatch) {
            const varName = directAssignMatch[1];
            variableValues[varName] = Number(directAssignMatch[2]);
        }

        // Simulación del ciclo for
        if (forState && !forState.done && i > forLine && i <= currentLine) {
            let condLimit = isNaN(Number(forCond)) ? variableValues[forCond] : Number(forCond);
            if (forState.i < condLimit) {
                variableValues[forVar] = forState.i;
                // Ejecuta el cuerpo del for (puedes agregar aquí la lógica de suma, etc.)
                // ...asignaciones y operaciones...
                // Si estamos en la última línea del cuerpo del for
                if (i === currentLine) {
                    forState.i++;
                    // Si aún cumple la condición, regresa el apuntador al inicio del for
                    if (forState.i < condLimit) {
                        variableValues[forVar] = forState.i; // Actualiza el valor en el stack
                        currentLine = forLine;
                        moveArrowToLine(currentLine);
                        editor.setCursor({line: currentLine, ch: 0});
                    } else {
                        forState.done = true;
                    }
                }
            } else {
                forState.done = true;
            }
        }
    }

    // Agrega los argumentos al stack si no están ya
    argNames.forEach(arg => {
        if (!stackVariables.includes(arg)) stackVariables.unshift(arg);
    });

    // Los valores para graficar
    const stackValues = stackVariables.map(v => variableValues[v]);

    renderVariables(stackVariables, "stackVisual", stackValues);
    renderVariables(heapVariables, "heapVisual");
}

// Puedes llamar a analyzeCurrentLine() cuando cambie la línea apuntada por la flecha
editor.on("cursorActivity", analyzeCurrentLine);
window.next = function() {
    // Si estamos en un ciclo for y faltan iteraciones, repite el ciclo
    if (forState && !forState.done) {
        let condLimit = isNaN(Number(forState.cond)) ? forState.condValue : Number(forState.cond);
        if (forState.i < condLimit) {
            // Ejecuta la iteración y actualiza el valor de la variable del ciclo
            forState.i++;
            if (forState.i < condLimit) {
                currentLine = forState.line; // Vuelve al inicio del for
                moveArrowToLine(currentLine);
                editor.setCursor({line: currentLine, ch: 0});
            } else {
                forState.done = true;
                currentLine++; // Sale del for
                moveArrowToLine(currentLine);
                editor.setCursor({line: currentLine, ch: 0});
            }
            analyzeCurrentLine();
            return;
        }
    }
    // Comportamiento normal si no está en for
    if (currentLine < editor.lineCount() - 1) {
        currentLine++;
        moveArrowToLine(currentLine);
        editor.setCursor({line: currentLine, ch: 0});
    } else {
        editor.replaceRange("\n", {line: editor.lineCount()});
        currentLine++;
        moveArrowToLine(currentLine);
        editor.setCursor({line: currentLine, ch: 0});
    }
    analyzeCurrentLine();
};

window.previus = function() {
    if (currentLine > 0) {
        currentLine--;
        moveArrowToLine(currentLine);
        editor.setCursor({line: currentLine, ch: 0});
    }
    analyzeCurrentLine();
};

function renderVariables(variables, containerId, values = []) {
    const container = document.getElementById(containerId);
    container.innerHTML = ""; // Limpia el contenido anterior
    variables.forEach((variable, idx) => {
        if (!variable) return;
        const box = document.createElement("div");
        box.className = "variable-box";

        // Dirección de memoria ficticia
        const address = document.createElement("div");
        address.style.fontSize = "12px";
        address.style.color = "#888";
        address.style.marginBottom = "2px";
        address.textContent = ((idx + 1) * 10);

        // Valor dentro del cuadrado (solo para argumentos)
        const square = document.createElement("div");
        square.className = "variable-square";
        if (values[idx] !== undefined) {
            square.textContent = values[idx];
            square.style.display = "flex";
            square.style.alignItems = "center";
            square.style.justifyContent = "center";
            square.style.fontWeight = "bold";
            square.style.fontSize = "18px";
            square.style.color = "#7200b0";
        }
        box.appendChild(address);
        box.appendChild(square);

        const name = document.createElement("div");
        name.className = "variable-name";
        name.textContent = variable;
        box.appendChild(name);

        container.appendChild(box);
    });
}
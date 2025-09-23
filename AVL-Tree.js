// ================== Nodo AVL ==================
class NodoAVL {
    constructor(clave) {
        this.clave = clave;
        this.izquierdo = null;
        this.derecho = null;
        this.altura = 1;
    }
}

// ================== Árbol AVL ==================
class ArbolAVL {
    constructor() {
        this.raiz = null;
    }

    obtenerAltura(nodo) {
        return nodo === null ? 0 : nodo.altura;
    }

    obtenerBalance(nodo) {
        return nodo === null ? 0 : this.obtenerAltura(nodo.izquierdo) - this.obtenerAltura(nodo.derecho);
    }

    rotarDerecha(y) {
        let x = y.izquierdo;
        let T2 = x.derecho;

        x.derecho = y;
        y.izquierdo = T2;

        y.altura = Math.max(this.obtenerAltura(y.izquierdo), this.obtenerAltura(y.derecho)) + 1;
        x.altura = Math.max(this.obtenerAltura(x.izquierdo), this.obtenerAltura(x.derecho)) + 1;

        return x;
    }

    rotarIzquierda(x) {
        let y = x.derecho;
        let T2 = y.izquierdo;

        y.izquierdo = x;
        x.derecho = T2;

        x.altura = Math.max(this.obtenerAltura(x.izquierdo), this.obtenerAltura(x.derecho)) + 1;
        y.altura = Math.max(this.obtenerAltura(y.izquierdo), this.obtenerAltura(y.derecho)) + 1;

        return y;
    }

    insertarNodo(nodo, clave) {
        if (nodo === null) return new NodoAVL(clave);

        if (clave < nodo.clave) {
            nodo.izquierdo = this.insertarNodo(nodo.izquierdo, clave);
        } else if (clave > nodo.clave) {
            nodo.derecho = this.insertarNodo(nodo.derecho, clave);
        } else {
            return nodo; // duplicados no se permiten
        }

        nodo.altura = 1 + Math.max(this.obtenerAltura(nodo.izquierdo), this.obtenerAltura(nodo.derecho));
        let balance = this.obtenerBalance(nodo);

        if (balance > 1 && clave < nodo.izquierdo.clave) return this.rotarDerecha(nodo);
        if (balance < -1 && clave > nodo.derecho.clave) return this.rotarIzquierda(nodo);

        if (balance > 1 && clave > nodo.izquierdo.clave) {
            nodo.izquierdo = this.rotarIzquierda(nodo.izquierdo);
            return this.rotarDerecha(nodo);
        }

        if (balance < -1 && clave < nodo.derecho.clave) {
            nodo.derecho = this.rotarDerecha(nodo.derecho);
            return this.rotarIzquierda(nodo);
        }

        return nodo;
    }

    insertar(clave) {
        this.raiz = this.insertarNodo(this.raiz, clave);
    }

    nodoMinimo(nodo) {
        let actual = nodo;
        while (actual.izquierdo !== null) {
            actual = actual.izquierdo;
        }
        return actual;
    }

    eliminarNodo(nodo, clave) {
        if (nodo === null) return nodo;

        if (clave < nodo.clave) {
            nodo.izquierdo = this.eliminarNodo(nodo.izquierdo, clave);
        } else if (clave > nodo.clave) {
            nodo.derecho = this.eliminarNodo(nodo.derecho, clave);
        } else {
            if (nodo.izquierdo === null || nodo.derecho === null) {
                let temp = nodo.izquierdo ? nodo.izquierdo : nodo.derecho;
                if (temp === null) {
                    nodo = null;
                } else {
                    nodo = temp;
                }
            } else {
                let temp = this.nodoMinimo(nodo.derecho);
                nodo.clave = temp.clave;
                nodo.derecho = this.eliminarNodo(nodo.derecho, temp.clave);
            }
        }

        if (nodo === null) return nodo;

        nodo.altura = 1 + Math.max(this.obtenerAltura(nodo.izquierdo), this.obtenerAltura(nodo.derecho));
        let balance = this.obtenerBalance(nodo);

        if (balance > 1 && this.obtenerBalance(nodo.izquierdo) >= 0) return this.rotarDerecha(nodo);
        if (balance > 1 && this.obtenerBalance(nodo.izquierdo) < 0) {
            nodo.izquierdo = this.rotarIzquierda(nodo.izquierdo);
            return this.rotarDerecha(nodo);
        }

        if (balance < -1 && this.obtenerBalance(nodo.derecho) <= 0) return this.rotarIzquierda(nodo);
        if (balance < -1 && this.obtenerBalance(nodo.derecho) > 0) {
            nodo.derecho = this.rotarDerecha(nodo.derecho);
            return this.rotarIzquierda(nodo);
        }

        return nodo;
    }

    eliminar(clave) {
        this.raiz = this.eliminarNodo(this.raiz, clave);
    }

    buscarNodo(nodo, clave) {
        if (nodo === null) return false;
        if (clave === nodo.clave) return true;
        if (clave < nodo.clave) return this.buscarNodo(nodo.izquierdo, clave);
        return this.buscarNodo(nodo.derecho, clave);
    }

    buscar(clave) {
        return this.buscarNodo(this.raiz, clave);
    }

    recorrerPreorden(nodo) {
        if (nodo !== null) {
            process.stdout.write(nodo.clave + " ");
            this.recorrerPreorden(nodo.izquierdo);
            this.recorrerPreorden(nodo.derecho);
        }
    }

    imprimirPreorden() {
        this.recorrerPreorden(this.raiz);
        console.log();
    }
}

// ================== Función para normalizar números ==================
function normalizarNumero(n) {
    return String(n).padStart(3, "0");
}

// ================== Ejemplo de uso ==================
//function main() {
//    let arbol = new ArbolAVL();
//
//    arbol.insertar(normalizarNumero(1));
//    arbol.insertar(normalizarNumero(2));
//    arbol.insertar(normalizarNumero(3));
//    arbol.insertar(normalizarNumero(4));
//    arbol.insertar(normalizarNumero(200));
//    arbol.insertar("z");
//    arbol.insertar("Z");
//
//    process.stdout.write("Recorrido preorden: ");
//    arbol.imprimirPreorden();
//
//    console.log(arbol.buscar("Z") ? "Encontrado Z" : "No encontrado Z");
//    console.log(arbol.buscar(normalizarNumero(200)) ? "Encontrado 200" : "No encontrado 200");
//
//    arbol.eliminar("Z");
//    process.stdout.write("Tras eliminar Z, preorden: ");
//    arbol.imprimirPreorden();
//}

//main();
export { ArbolAVL, normalizarNumero };
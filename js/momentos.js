export class Operacion {
    constructor(tipo, clave, valorAnterior = null, valorNuevo = null) {
        this.tipo = tipo; // "insertar", "eliminar", "actualizar"
        this.clave = clave;
        this.valorAnterior = valorAnterior;
        this.valorNuevo = valorNuevo;
    }
}

export class Momento {
    constructor(estadoArbol, operacionesDesdeUltimoPunto = []) {
        // Copia del estado completo del arbol (solo en puntos de control)
        this.estado = estadoArbol ? JSON.stringify(estadoArbol) : null;
        // Lista de operaciones realizadas desde el ultimo punto
        this.operaciones = operacionesDesdeUltimoPunto;
    }
}

export class AdministradorMomentos {
    constructor(instanciaArbol, intervaloPuntoControl = 5) {
        this.arbol = instanciaArbol;
        this.intervaloPuntoControl = intervaloPuntoControl;

        this.historial = [];        // pila de momentos (para deshacer)
        this.futuro = [];           // pila para rehacer
        this.operacionesPendientes = []; // operaciones no guardadas aun
        this.contadorOperaciones = 0;
    }

    // Registra una operacion (insertar, eliminar, actualizar)
    registrarOperacion(tipo, clave, valorAnterior = null, valorNuevo = null) {
        const operacion = new Operacion(tipo, clave, valorAnterior, valorNuevo);
        this.operacionesPendientes.push(operacion);
        this.contadorOperaciones++;

        // Si llegamos al intervalo configurado, guardamos un punto de control
        if (this.contadorOperaciones % this.intervaloPuntoControl === 0) {
            this.guardarPuntoControl();
        }
    }

    // Guarda un punto de control (snapshot completo del arbol)
    guardarPuntoControl() {
        const estado = this.arbol.serializar(); // el arbol debe tener esta funcion
        const momento = new Momento(estado, this.operacionesPendientes);
        this.historial.push(momento);
        this.operacionesPendientes = [];
        this.futuro = []; // limpiar pila de rehacer
    }

    // Deshacer la ultima accion
    deshacer() {
        if (this.operacionesPendientes.length > 0) {
            // Si hay operaciones pendientes sin guardar, revertimos la ultima
            const ultima = this.operacionesPendientes.pop();
            this.aplicarOperacionInversa(ultima);
            this.futuro.push(ultima);
            this.contadorOperaciones--;
            return;
        }

        if (this.historial.length === 0) {
            console.log("No hay acciones para deshacer");
            return;
        }

        const ultimoMomento = this.historial.pop();
        // Restaurar el estado anterior del arbol
        this.arbol.cargarDesdeSerializado(JSON.parse(ultimoMomento.estado));
        // Mover las operaciones al stack de rehacer
        this.futuro.push(...ultimoMomento.operaciones.reverse());
    }

    // Rehacer una accion previamente deshecha
    rehacer() {
        if (this.futuro.length === 0) {
            console.log("No hay acciones para rehacer");
            return;
        }

        const operacion = this.futuro.pop();
        this.aplicarOperacion(operacion);
        this.operacionesPendientes.push(operacion);
        this.contadorOperaciones++;
    }

    // Aplica una operacion normal al arbol
    aplicarOperacion(operacion) {
        switch (operacion.tipo) {
            case "insertar":
                this.arbol.insertar(operacion.clave, operacion.valorNuevo);
                break;
            case "eliminar":
                this.arbol.eliminar(operacion.clave);
                break;
            case "actualizar":
                this.arbol.actualizar(operacion.clave, operacion.valorNuevo);
                break;
        }
    }

    // Aplica la operacion inversa (para deshacer)
    aplicarOperacionInversa(operacion) {
        switch (operacion.tipo) {
            case "insertar":
                this.arbol.eliminar(operacion.clave);
                break;
            case "eliminar":
                this.arbol.insertar(operacion.clave, operacion.valorAnterior);
                break;
            case "actualizar":
                this.arbol.actualizar(operacion.clave, operacion.valorAnterior);
                break;
        }
    }
    // Restaura el arbol a un momento especifico del historial
    restaurarMomento(indice) {
        if (indice < 0 || indice >= this.historial.length) {
            console.log("Indice de momento invalido");
            return;
        }

        const momento = this.historial[indice];
        // Cargar el estado completo del arbol
        this.arbol.cargarDesdeSerializado(JSON.parse(momento.estado));

        // Ajustar el historial hasta ese punto
        this.historial = this.historial.slice(0, indice + 1);
        this.operacionesPendientes = [];
        this.futuro = [];
        this.contadorOperaciones = this.historial.length * this.intervaloPuntoControl;

        console.log(`Arbol restaurado al momento #${indice}`);
    }
}
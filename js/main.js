import { BTree } from './B-Tree.js';
import { ArbolAVL } from './AVL-Tree.js';
import { AdministradorMomentos } from "./momentos.js";
import { lexerLine } from './analizador.js';
import { moveArrowToLine } from './dom.js';

// ================== Generador de direciones de memoria ==================
function Memoria() {
  return Math.floor(Math.random() * 999);
}
// ================== Definicion de arboles ==================
const avl = new ArbolAVL();
const btree = new BTree(3);
// ================== patron de momentos ==================
const administradorAVL = new AdministradorMomentos(ArbolAVL, 7);
const administradorBTree = new AdministradorMomentos(BTree, 7);

// ================== Función para normalizar números ==================
function normalizarNumero(n) {
  return String(n).padStart(3, "0");
}

// ================== Funcion para insertar la variable consus 3 datos ==================
function generarDirection(variable, valor) {
  let insertado = false;

  while (!insertado) {
    let direc = Memoria();
    if (!avl.buscar(direc)) {
      let nDirec = normalizarNumero(direc);
      avl.insertar(nDirec);
      btree.insert(variable, nDirec, valor);
      insertado = true;
    }
  }
}

let currentLine = 0;

function analizadorLine(){
  
}

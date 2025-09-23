import { BTree} from './B-Tree.js';
import { ArbolAVL } from './AVL-Tree.js';

function Memoria() {
    return Math.floor(Math.random() * 1000); 
}
const avl = new ArbolAVL();
const btree = new BTree(3);

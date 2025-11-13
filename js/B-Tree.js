// ================== Comparador personalizado ==================
function normalizeKey(k) {
  if (typeof k === "number") {
    return k.toString().padStart(3, "0"); // normaliza números
  }
  return k;
}

function priority(ch) {
  if (/^[0-9]/.test(ch)) return 0;   // números primero
  if (/^[A-Z]/.test(ch)) return 1;   // mayúsculas
  if (/^[a-z]/.test(ch)) return 2;   // minúsculas
  return 3;
}

function customCompare(a, b) {
  a = normalizeKey(a);
  b = normalizeKey(b);
  const pa = priority(a[0]);
  const pb = priority(b[0]);
  if (pa !== pb) return pa - pb;
  return a.localeCompare(b);
}

// ================== Clase Entry ==================
class Entry {
  constructor(key, dMemoria = null, value = null) {
    this.key = normalizeKey(key);
    this.dMemoria = dMemoria;
    this.value = value;
  }
}

// ================== Clase Nodo ==================
class BTreeNode {
  constructor(t, leaf = false) {
    this.t = t;
    this.leaf = leaf;
    this.keys = [];        // ← array de Entry
    this.children = [];
  }

  findKey(k) {
    let idx = 0;
    while (idx < this.keys.length && customCompare(this.keys[idx].key, k) < 0) {
      idx++;
    }
    return idx;
  }

  search(k) {
    k = normalizeKey(k);
    let i = 0;
    while (i < this.keys.length && customCompare(k, this.keys[i].key) > 0) i++;
    if (i < this.keys.length && this.keys[i].key === k) return this.keys[i];
    if (this.leaf) return null;
    return this.children[i].search(k);
  }
}

// ================== Clase Árbol B ==================
class BTree {
  constructor(m) {
    this.t = Math.ceil(m / 2);
    this.root = new BTreeNode(this.t, true);
  }

  insert(key, dMemoria = null, value = null) {
    const entry = new Entry(key, dMemoria, value);
    let root = this.root;
    if (root.keys.length === 2 * this.t - 1) {
      let s = new BTreeNode(this.t, false);
      s.children.push(root);
      this.splitChild(s, 0);
      this.root = s;
      this.insertNonFull(s, entry);
    } else {
      this.insertNonFull(root, entry);
    }
  }

  insertNonFull(node, entry) {
    let i = node.keys.length - 1;
    if (node.leaf) {
      while (i >= 0 && customCompare(entry.key, node.keys[i].key) < 0) i--;
      node.keys.splice(i + 1, 0, entry);
    } else {
      while (i >= 0 && customCompare(entry.key, node.keys[i].key) < 0) i--;
      i++;
      if (node.children[i].keys.length === 2 * this.t - 1) {
        this.splitChild(node, i);
        if (customCompare(entry.key, node.keys[i].key) > 0) i++;
      }
      this.insertNonFull(node.children[i], entry);
    }
  }

  splitChild(parent, i) {
    let t = this.t;
    let y = parent.children[i];
    let z = new BTreeNode(t, y.leaf);

    let middle = y.keys[t - 1];

    z.keys = y.keys.splice(t, t - 1);
    y.keys.splice(t - 1, 1);

    if (!y.leaf) {
      z.children = y.children.splice(t, t);
    }

    parent.children.splice(i + 1, 0, z);
    parent.keys.splice(i, 0, middle);
  }

  // ================== Recorridos ==================
  printInOrder(node = this.root) {
    if (!node) return;
    if (node.leaf) {
      for (let e of node.keys) process.stdout.write(`${e.key}(${e.dMemoria}) `);
    } else {
      for (let i = 0; i < node.keys.length; i++) {
        this.printInOrder(node.children[i]);
        process.stdout.write(`${node.keys[i].key}(${node.keys[i].dMemoria}) `);
      }
      this.printInOrder(node.children[node.keys.length]);
    }
  }

  printPreOrder(node = this.root) {
    if (!node) return;
    for (let e of node.keys) process.stdout.write(`${e.key}(${e.dMemoria}) `);
    if (!node.leaf) for (let c of node.children) this.printPreOrder(c);
  }

  printPostOrder(node = this.root) {
    if (!node) return;
    if (!node.leaf) for (let c of node.children) this.printPostOrder(c);
    for (let e of node.keys) process.stdout.write(`${e.key}(${e.dMemoria}) `);
  }

  // ================== Eliminación ==================
  remove(k) {
    k = normalizeKey(k);
    this._remove(this.root, k);
    if (this.root.keys.length === 0 && !this.root.leaf) {
      this.root = this.root.children[0];
    }
  }

  _remove(node, k) {
    let idx = node.findKey(k);
    if (idx < node.keys.length && node.keys[idx].key === k) {
      if (node.leaf) {
        node.keys.splice(idx, 1);
      } else {
        this._removeInternal(node, k, idx);
      }
    } else {
      if (node.leaf) return;
      let flag = idx === node.keys.length;
      if (node.children[idx].keys.length < this.t) this._fill(node, idx);
      if (flag && idx > node.keys.length) this._remove(node.children[idx - 1], k);
      else this._remove(node.children[idx], k);
    }
  }

  _removeInternal(node, k, idx) {
    let t = this.t;
    let child = node.children[idx];
    let sibling = node.children[idx + 1];
    if (child.keys.length >= t) {
      let pred = this._getPred(child);
      node.keys[idx] = pred;
      this._remove(child, pred.key);
    } else if (sibling.keys.length >= t) {
      let succ = this._getSucc(sibling);
      node.keys[idx] = succ;
      this._remove(sibling, succ.key);
    } else {
      this._merge(node, idx);
      this._remove(child, k);
    }
  }

  _getPred(node) {
    while (!node.leaf) node = node.children[node.keys.length];
    return node.keys[node.keys.length - 1];
  }
  _getSucc(node) {
    while (!node.leaf) node = node.children[0];
    return node.keys[0];
  }

  _fill(node, idx) {
    if (idx !== 0 && node.children[idx - 1].keys.length >= this.t) this._borrowPrev(node, idx);
    else if (idx !== node.keys.length && node.children[idx + 1].keys.length >= this.t) this._borrowNext(node, idx);
    else {
      if (idx !== node.keys.length) this._merge(node, idx);
      else this._merge(node, idx - 1);
    }
  }

  _borrowPrev(node, idx) {
    let child = node.children[idx];
    let sib = node.children[idx - 1];
    child.keys.unshift(node.keys[idx - 1]);
    if (!child.leaf) child.children.unshift(sib.children.pop());
    node.keys[idx - 1] = sib.keys.pop();
  }
  _borrowNext(node, idx) {
    let child = node.children[idx];
    let sib = node.children[idx + 1];
    child.keys.push(node.keys[idx]);
    if (!child.leaf) child.children.push(sib.children.shift());
    node.keys[idx] = sib.keys.shift();
  }

  _merge(node, idx) {
    let child = node.children[idx];
    let sib = node.children[idx + 1];
    child.keys.push(node.keys[idx]);
    child.keys = child.keys.concat(sib.keys);
    if (!child.leaf) child.children = child.children.concat(sib.children);
    node.keys.splice(idx, 1);
    node.children.splice(idx + 1, 1);
  }
  // ================== Búsqueda ==================
  search(k, opc = 0) {
    const entry = this.root.search(k);
    if (!entry) return null;

    switch (opc) {
      case 0: return entry.key;
      case 1: return entry.dMemoria;
      case 2: return entry.value;
      default: return entry; // por si se pasa otra cosa
    }
  }
  updateValue(key, newValue) {
    const entry = this.root.search(key);
    if (!entry) {
      console.log(`La llave ${key} no existe en el arbol.`);
      return false;
    }

    entry.value = newValue; // solo se actualiza el valor
    console.log(`Valor de la llave ${key} modificado correctamente.`);
    return true;
  }
  // ================== Serialización ==================
  serializar() {
    // Devuelve una copia completa del arbol en formato JSON
    return JSON.parse(JSON.stringify(this.root));
  }

  cargarDesdeSerializado(objeto) {
    // Restaura el estado completo del arbol desde un objeto serializado
    this.root = objeto;
  }
}

export { BTree };

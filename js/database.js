// ============================================
// DATABASE.JS - Gestión de IndexedDB
// ============================================

class Database {
    constructor() {
        this.dbName = 'MiPymeDB';
        this.dbVersion = 4;
        this.db = null;
        this.inicializado = false;
    }

    async init() {
        if (this.inicializado && this.db) {
            console.log('✅ DB ya inicializada');
            return;
        }

        return new Promise((resolve, reject) => {
            console.log('🔄 Inicializando DB...');
            const request = indexedDB.open(this.dbName, this.dbVersion);
            
            request.onerror = function() {
                console.error('❌ Error al abrir DB:', request.error);
                reject(request.error);
            };
            
            request.onsuccess = function() {
                this.db = request.result;
                this.inicializado = true;
                console.log('✅ DB inicializada correctamente');
                resolve();
            }.bind(this);
            
            request.onupgradeneeded = function(event) {
                const db = event.target.result;
                console.log('🔄 Actualizando DB a versión', this.dbVersion);
                
                if (!db.objectStoreNames.contains('categorias')) {
                    const store = db.createObjectStore('categorias', { 
                        keyPath: 'id', 
                        autoIncrement: true 
                    });
                    store.createIndex('nombre', 'nombre', { unique: true });
                    console.log('✅ Tabla categorías creada');
                }
                
                if (!db.objectStoreNames.contains('productos')) {
                    const store = db.createObjectStore('productos', { 
                        keyPath: 'id', 
                        autoIncrement: true 
                    });
                    store.createIndex('categoriaId', 'categoriaId', { unique: false });
                    store.createIndex('unidad', 'unidad', { unique: false });
                    console.log('✅ Tabla productos creada');
                }
                
                if (!db.objectStoreNames.contains('ventas')) {
                    const store = db.createObjectStore('ventas', { 
                        keyPath: 'id', 
                        autoIncrement: true 
                    });
                    store.createIndex('fecha', 'fecha', { unique: false });
                    store.createIndex('productoId', 'productoId', { unique: false });
                    console.log('✅ Tabla ventas creada');
                }
            }.bind(this);
        });
    }

    // ========== CATEGORÍAS ==========
    async agregarCategoria(nombre) {
        await this.init();
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction(['categorias'], 'readwrite');
            const store = tx.objectStore('categorias');
            const request = store.add({ nombre });
            request.onsuccess = function() {
                console.log('✅ Categoría agregada:', nombre);
                resolve(request.result);
            };
            request.onerror = function() {
                console.error('❌ Error al agregar categoría:', request.error);
                reject(request.error);
            };
        });
    }

    async obtenerCategorias() {
        await this.init();
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction(['categorias'], 'readonly');
            const store = tx.objectStore('categorias');
            const request = store.getAll();
            request.onsuccess = function() {
                resolve(request.result);
            };
            request.onerror = function() {
                reject(request.error);
            };
        });
    }

    async editarCategoria(id, nombre) {
        await this.init();
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction(['categorias'], 'readwrite');
            const store = tx.objectStore('categorias');
            const request = store.put({ id, nombre });
            request.onsuccess = function() {
                console.log('✅ Categoría editada:', nombre);
                resolve(request.result);
            };
            request.onerror = function() {
                reject(request.error);
            };
        });
    }

    async eliminarCategoria(id) {
        await this.init();
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction(['categorias'], 'readwrite');
            const store = tx.objectStore('categorias');
            const request = store.delete(id);
            request.onsuccess = function() {
                console.log('✅ Categoría eliminada ID:', id);
                resolve();
            };
            request.onerror = function() {
                reject(request.error);
            };
        });
    }

    // ========== PRODUCTOS ==========
    async agregarProducto(producto) {
        await this.init();
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction(['productos'], 'readwrite');
            const store = tx.objectStore('productos');
            const request = store.add(producto);
            request.onsuccess = function() {
                console.log('✅ Producto agregado:', producto.nombre);
                resolve(request.result);
            };
            request.onerror = function() {
                reject(request.error);
            };
        });
    }

    async obtenerProductos() {
        await this.init();
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction(['productos'], 'readonly');
            const store = tx.objectStore('productos');
            const request = store.getAll();
            request.onsuccess = function() {
                resolve(request.result);
            };
            request.onerror = function() {
                reject(request.error);
            };
        });
    }

    async obtenerProducto(id) {
        await this.init();
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction(['productos'], 'readonly');
            const store = tx.objectStore('productos');
            const request = store.get(id);
            request.onsuccess = function() {
                resolve(request.result);
            };
            request.onerror = function() {
                reject(request.error);
            };
        });
    }

    async editarProducto(producto) {
        await this.init();
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction(['productos'], 'readwrite');
            const store = tx.objectStore('productos');
            const request = store.put(producto);
            request.onsuccess = function() {
                console.log('✅ Producto editado:', producto.nombre);
                resolve(request.result);
            };
            request.onerror = function() {
                reject(request.error);
            };
        });
    }

    async eliminarProducto(id) {
        await this.init();
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction(['productos'], 'readwrite');
            const store = tx.objectStore('productos');
            const request = store.delete(id);
            request.onsuccess = function() {
                console.log('✅ Producto eliminado ID:', id);
                resolve();
            };
            request.onerror = function() {
                reject(request.error);
            };
        });
    }

    // ========== VENTAS ==========
    async agregarVenta(venta) {
        await this.init();
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction(['ventas'], 'readwrite');
            const store = tx.objectStore('ventas');
            const request = store.add(venta);
            request.onsuccess = function() {
                console.log('✅ Venta agregada:', venta.productoNombre);
                resolve(request.result);
            };
            request.onerror = function() {
                reject(request.error);
            };
        });
    }

    async obtenerVentas() {
        await this.init();
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction(['ventas'], 'readonly');
            const store = tx.objectStore('ventas');
            const request = store.getAll();
            request.onsuccess = function() {
                resolve(request.result);
            };
            request.onerror = function() {
                reject(request.error);
            };
        });
    }

    async eliminarVenta(id) {
        await this.init();
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction(['ventas'], 'readwrite');
            const store = tx.objectStore('ventas');
            const request = store.delete(id);
            request.onsuccess = function() {
                console.log('✅ Venta eliminada ID:', id);
                resolve();
            };
            request.onerror = function() {
                reject(request.error);
            };
        });
    }
}

const db = new Database();
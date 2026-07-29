// ============================================
// INVENTARIO.JS - Gestión del inventario
// ============================================

let categorias = [];
let productos = [];

// ========== CARGA DE DATOS ==========

async function cargarInventario() {
    try {
        console.log('📦 Cargando inventario...');
        await db.init();
        await cargarCategorias();
        await cargarProductos();
        renderizarInventario();
        console.log('✅ Inventario cargado correctamente');
    } catch (error) {
        console.error('❌ Error al cargar inventario:', error);
        alert('Error al cargar inventario: ' + error.message);
    }
}

async function cargarCategorias() {
    categorias = await db.obtenerCategorias();
    console.log('Categorías cargadas:', categorias);
}

async function cargarProductos() {
    productos = await db.obtenerProductos();
    console.log('Productos cargados:', productos.length);
}

// ========== RENDERIZADO ==========

function renderizarInventario() {
    const container = document.getElementById('inventario-lista');
    if (!container) return;
    container.innerHTML = '';
    
    console.log('Renderizando inventario, categorías:', categorias.length);
    
    if (!categorias || categorias.length === 0) {
        container.innerHTML = `
            <div style="text-align:center;padding:60px 20px;background:white;border-radius:12px;box-shadow:0 2px 10px rgba(0,0,0,0.06);">
                <div style="font-size:48px;margin-bottom:16px;">📂</div>
                <h3 style="color:#2d3436;margin-bottom:8px;">No hay categorías</h3>
                <p style="color:#636e72;margin-bottom:20px;">Crea tu primera categoría para empezar a organizar tus productos</p>
                <button onclick="agregarCategoria()" class="btn-primary" style="padding:12px 24px;font-size:16px;">
                    ➕ Crear primera categoría
                </button>
            </div>
        `;
        return;
    }
    
    categorias.sort((a, b) => a.nombre.localeCompare(b.nombre));
    
    for (const categoria of categorias) {
        const productosCat = productos.filter(p => p.categoriaId === categoria.id);
        console.log(`Categoría ${categoria.nombre}: ${productosCat.length} productos`);
        
        const wrapper = document.createElement('div');
        wrapper.className = 'categoria-wrapper';
        
        const header = document.createElement('div');
        header.className = 'categoria-header';
        header.innerHTML = `
            <div class="categoria-info">
                <span class="icon">📂</span>
                <span class="nombre">${categoria.nombre}</span>
                <span class="count">${productosCat.length}</span>
            </div>
            <div style="display:flex;align-items:center;gap:8px;">
                <div class="categoria-actions">
                    <button onclick="editarCategoria(${categoria.id})" title="Editar categoría">✏️</button>
                    <button onclick="eliminarCategoria(${categoria.id})" title="Eliminar categoría">🗑️</button>
                </div>
                <span class="toggle-icon">▼</span>
            </div>
        `;
        header.onclick = function(e) {
            if (e.target.tagName === 'BUTTON') return;
            const body = this.parentElement.querySelector('.categoria-body');
            const icon = this.querySelector('.toggle-icon');
            body.classList.toggle('collapsed');
            icon.classList.toggle('collapsed');
        };
        
        const body = document.createElement('div');
        body.className = 'categoria-body';
        
        if (productosCat.length === 0) {
            const empty = document.createElement('div');
            empty.className = 'categoria-body-empty';
            empty.textContent = 'No hay productos en esta categoría';
            body.appendChild(empty);
        } else {
            productosCat.sort((a, b) => a.nombre.localeCompare(b.nombre));
            for (const producto of productosCat) {
                body.appendChild(crearProductoCard(producto));
            }
        }
        
        wrapper.appendChild(header);
        wrapper.appendChild(body);
        container.appendChild(wrapper);
    }
}

// ========== TARJETA DE PRODUCTO CON IMAGEN ==========

function crearProductoCard(producto) {
    const card = document.createElement('div');
    card.className = 'producto-card';
    
    const simbolosUnidad = {
        'unidad': 'uds',
        'libra': 'lb',
        'kilogramo': 'kg',
        'litro': 'L',
        'galon': 'gal',
        'docena': 'doc',
        'metro': 'm',
        'yarda': 'yd',
        'onza': 'oz'
    };
    const unidadSimbolo = simbolosUnidad[producto.unidad] || 'uds';
    
    const costoTotal = producto.cantidad * producto.precioCompra;
    const ingresoTotal = producto.cantidad * producto.precioVenta;
    const gananciaTotal = ingresoTotal - costoTotal;
    const gananciaClase = gananciaTotal >= 0 ? 'positiva' : 'negativa';
    
    let stockClase = '';
    if (producto.cantidad === 0) stockClase = 'out';
    else if (producto.cantidad < 5) stockClase = 'low';
    
    const tieneImagen = producto.imagen && producto.imagen.length > 100;
    const imagenSrc = tieneImagen ? producto.imagen : 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"%3E%3Crect width="100" height="100" fill="%23f0f2f5"/%3E%3Ctext x="50" y="55" font-size="30" text-anchor="middle" fill="%23999"%3E📦%3C/text%3E%3C/svg%3E';
    
    card.innerHTML = `
        <div style="display:flex;gap:12px;align-items:flex-start;">
            <div style="flex-shrink:0;width:80px;height:80px;border-radius:8px;overflow:hidden;cursor:pointer;border:2px solid #dfe6e9;background:#f8f9fa;display:flex;align-items:center;justify-content:center;" 
                 onclick="verImagenProducto(${producto.id})" title="Haz clic para ver imagen ampliada">
                <img src="${imagenSrc}" alt="${producto.nombre}" 
                     style="width:100%;height:100%;object-fit:cover;" 
                     onerror="this.src='data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'100\' height=\'100\' viewBox=\'0 0 100 100\'%3E%3Crect width=\'100\' height=\'100\' fill=\'%23f0f2f5\'/%3E%3Ctext x=\'50\' y=\'55\' font-size=\'30\' text-anchor=\'middle\' fill=\'%23999\'%3E📦%3C/text%3E%3C/svg%3E'" />
            </div>
            <div style="flex:1;min-width:0;">
                <div class="producto-header">
                    <h3>${producto.nombre}</h3>
                    <span class="stock-badge ${stockClase}">${producto.cantidad} ${unidadSimbolo}</span>
                </div>
                <div class="producto-precios">
                    <span>Compra: ${producto.precioCompra.toFixed(2)} CUP/${unidadSimbolo}</span>
                    <span class="precio-venta">Venta: ${producto.precioVenta.toFixed(2)} CUP/${unidadSimbolo}</span>
                </div>
                <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:4px;">
                    <div>
                        <span style="font-size:12px;color:#636e72;">Costo: ${costoTotal.toFixed(2)} CUP</span>
                        <span style="font-size:12px;color:#636e72;margin-left:8px;">Ingreso: ${ingresoTotal.toFixed(2)} CUP</span>
                    </div>
                    <span class="producto-ganancia ${gananciaClase}">
                        ${gananciaTotal >= 0 ? '📈' : '📉'} ${gananciaTotal.toFixed(2)} CUP
                    </span>
                </div>
                <div class="producto-acciones">
                    <div class="cantidad-control">
                        <button class="btn-cantidad minus" onclick="decrementarCantidad(${producto.id})" title="Disminuir cantidad (abre opciones)">−</button>
                        <span class="cantidad-text" id="cantidad-${producto.id}">${producto.cantidad}</span>
                        <button class="btn-cantidad" onclick="incrementarCantidad(${producto.id})">+</button>
                        <span style="font-size:11px;color:#999;margin-left:4px;">${unidadSimbolo}</span>
                    </div>
                    <button onclick="editarProducto(${producto.id})" class="btn-primary btn-small">✏️</button>
                    <button onclick="eliminarProducto(${producto.id})" class="btn-danger btn-small">🗑️</button>
                </div>
            </div>
        </div>
    `;
    
    return card;
}

// ========== VER IMAGEN AMPLIADA ==========

function verImagenProducto(id) {
    const producto = productos.find(p => p.id === id);
    if (!producto) return;
    
    const tieneImagen = producto.imagen && producto.imagen.length > 100;
    const imagenSrc = tieneImagen ? producto.imagen : 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400"%3E%3Crect width="400" height="400" fill="%23f0f2f5"/%3E%3Ctext x="200" y="220" font-size="80" text-anchor="middle" fill="%23999"%3E📦%3C/text%3E%3Ctext x="200" y="280" font-size="24" text-anchor="middle" fill="%23999"%3ESin imagen%3C/text%3E%3C/svg%3E';
    
    const modal = document.createElement('div');
    modal.className = 'modal show';
    modal.style.display = 'flex';
    modal.style.zIndex = '9999';
    modal.innerHTML = `
        <div class="modal-content" style="max-width:600px;text-align:center;">
            <span class="close" onclick="this.parentElement.parentElement.remove()">&times;</span>
            <h3>${producto.nombre}</h3>
            <img src="${imagenSrc}" alt="${producto.nombre}" 
                 style="max-width:100%;max-height:500px;border-radius:8px;margin:10px 0;object-fit:contain;" 
                 onerror="this.src='data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'400\' height=\'400\' viewBox=\'0 0 400 400\'%3E%3Crect width=\'400\' height=\'400\' fill=\'%23f0f2f5\'/%3E%3Ctext x=\'200\' y=\'220\' font-size=\'80\' text-anchor=\'middle\' fill=\'%23999\'%3E📦%3C/text%3E%3Ctext x=\'200\' y=\'280\' font-size=\'24\' text-anchor=\'middle\' fill=\'%23999\'%3ESin imagen%3C/text%3E%3C/svg%3E'" />
            <p style="color:#636e72;font-size:14px;">Haz clic en la X para cerrar</p>
        </div>
    `;
    
    modal.addEventListener('click', function(e) {
        if (e.target === this) {
            this.remove();
        }
    });
    
    document.body.appendChild(modal);
}

// ========== MANEJO DE CANTIDADES ==========

function mostrarOpcionesDisminuir(id) {
    const producto = productos.find(p => p.id === id);
    if (!producto) return;
    
    if (producto.cantidad === 0) {
        alert('Este producto ya tiene 0 unidades');
        return;
    }
    
    const modal = document.createElement('div');
    modal.className = 'modal show';
    modal.style.display = 'flex';
    modal.style.zIndex = '9999';
    
    modal.innerHTML = `
        <div class="modal-content" style="max-width:450px;">
            <span class="close" onclick="this.parentElement.parentElement.remove()">&times;</span>
            <h3 style="margin-bottom:16px;">📦 Disminuir Cantidad</h3>
            <p style="color:var(--color-text-secondary);margin-bottom:16px;">
                Producto: <strong>${producto.nombre}</strong><br>
                Stock actual: <strong>${producto.cantidad}</strong>
            </p>
            <div style="display:flex;flex-direction:column;gap:10px;">
                <button onclick="disminuirCantidadProducto(${id}, this)" 
                        class="btn-primary" 
                        style="width:100%;justify-content:center;padding:12px;">
                    ✏️ Disminuir cantidad
                </button>
                <button onclick="marcarComoVendido(${id})" 
                        class="btn-success" 
                        style="width:100%;justify-content:center;padding:12px;">
                    💰 Marcar como vendido
                </button>
                <button onclick="eliminarProductoDirecto(${id})" 
                        class="btn-danger" 
                        style="width:100%;justify-content:center;padding:12px;">
                    🗑️ Eliminar producto
                </button>
                <button onclick="this.closest('.modal').remove()" 
                        class="btn-secondary" 
                        style="width:100%;justify-content:center;padding:12px;">
                    Cancelar
                </button>
            </div>
        </div>
    `;
    
    modal.addEventListener('click', function(e) {
        if (e.target === this) {
            this.remove();
        }
    });
    
    document.body.appendChild(modal);
}

function disminuirCantidadProducto(id, btn) {
    const producto = productos.find(p => p.id === id);
    if (!producto) return;
    
    const modalAnterior = btn.closest('.modal');
    if (modalAnterior) modalAnterior.remove();
    
    const modal = document.createElement('div');
    modal.className = 'modal show';
    modal.style.display = 'flex';
    modal.style.zIndex = '9999';
    
    modal.innerHTML = `
        <div class="modal-content" style="max-width:400px;">
            <span class="close" onclick="this.parentElement.parentElement.remove()">&times;</span>
            <h3 style="margin-bottom:8px;">✏️ Disminuir cantidad</h3>
            <p style="color:var(--color-text-secondary);margin-bottom:16px;">
                Producto: <strong>${producto.nombre}</strong><br>
                Stock actual: <strong>${producto.cantidad}</strong>
            </p>
            <label for="cantidad-disminuir">¿Cuántas unidades quieres quitar?</label>
            <input type="number" id="cantidad-disminuir" 
                   min="1" max="${producto.cantidad}" 
                   value="1" step="1"
                   style="width:100%;padding:10px 12px;border:1px solid var(--color-border);border-radius:8px;font-size:16px;margin:8px 0;" />
            <div style="display:flex;gap:8px;margin-top:8px;">
                <button onclick="confirmarDisminuir(${id})" 
                        class="btn-primary" 
                        style="flex:1;justify-content:center;padding:12px;">
                    ✅ Aceptar
                </button>
                <button onclick="this.closest('.modal').remove()" 
                        class="btn-secondary" 
                        style="flex:1;justify-content:center;padding:12px;">
                    Cancelar
                </button>
            </div>
        </div>
    `;
    
    modal.addEventListener('click', function(e) {
        if (e.target === this) {
            this.remove();
        }
    });
    
    document.body.appendChild(modal);
}

async function confirmarDisminuir(id) {
    const input = document.getElementById('cantidad-disminuir');
    if (!input) return;
    
    const cantidad = parseInt(input.value);
    if (isNaN(cantidad) || cantidad < 1) {
        alert('La cantidad debe ser al menos 1');
        return;
    }
    
    const producto = await db.obtenerProducto(id);
    if (!producto) return;
    
    if (cantidad > producto.cantidad) {
        alert(`Solo hay ${producto.cantidad} unidades disponibles`);
        return;
    }
    
    try {
        producto.cantidad -= cantidad;
        await db.editarProducto(producto);
        
        const modal = input.closest('.modal');
        if (modal) modal.remove();
        
        await cargarProductos();
        renderizarInventario();
        
        alert(`✅ Se quitaron ${cantidad} unidades de "${producto.nombre}"\nStock restante: ${producto.cantidad}`);
        
    } catch (error) {
        console.error('Error al disminuir cantidad:', error);
        alert('Error al disminuir cantidad');
    }
}

function marcarComoVendido(id) {
    const producto = productos.find(p => p.id === id);
    if (!producto) {
        console.error('Producto no encontrado:', id);
        return;
    }
    
    console.log('💰 Marcando como vendido:', producto.nombre, 'ID:', id);
    
    document.querySelectorAll('.modal').forEach(m => m.remove());
    
    const btnVentas = document.querySelector('.nav-btn[data-tab="ventas"]');
    if (btnVentas) {
        btnVentas.click();
        
        setTimeout(() => {
            const input = document.getElementById(`venta-input-${id}`);
            if (input) {
                console.log('📝 Input encontrado para:', producto.nombre);
                
                const cantidad = parseFloat(input.value) || 1;
                console.log('Cantidad a agregar:', cantidad);
                
                const productoVenta = productosVenta.find(p => p.id === id);
                if (productoVenta && cantidad <= productoVenta.cantidad) {
                    agregarAlCarrito(id);
                    
                    setTimeout(() => {
                        actualizarCarrito();
                        console.log('🔄 Carrito actualizado después de agregar');
                    }, 500);
                    
                    const card = input.closest('.producto-venta-card');
                    if (card) {
                        card.style.borderColor = 'var(--color-primary)';
                        card.style.boxShadow = '0 0 20px var(--color-shadow)';
                        setTimeout(() => {
                            card.style.borderColor = '';
                            card.style.boxShadow = '';
                        }, 3000);
                    }
                    
                    console.log('🛒 Carrito actual:', carrito);
                    
                    alert(`✅ "${producto.nombre}" (${cantidad} ${producto.unidad || 'uds'}) agregado al carrito.\n\nAhora puedes finalizar la venta desde el botón "Finalizar Venta".`);
                } else {
                    alert(`💡 El producto "${producto.nombre}" no tiene suficiente stock.`);
                }
            } else {
                console.error('❌ Input no encontrado para producto:', id);
                alert(`💡 El producto "${producto.nombre}" no aparece en ventas.`);
            }
        }, 700);
    } else {
        console.error('❌ Botón de ventas no encontrado');
    }
}

async function eliminarProductoDirecto(id) {
    if (!confirm('¿Eliminar este producto permanentemente?')) return;
    
    try {
        await db.eliminarProducto(id);
        document.querySelectorAll('.modal').forEach(m => m.remove());
        await cargarProductos();
        renderizarInventario();
        console.log('Producto eliminado');
    } catch (error) {
        console.error('Error al eliminar producto:', error);
        alert('Error al eliminar producto');
    }
}

async function decrementarCantidad(id) {
    const producto = productos.find(p => p.id === id);
    if (!producto) return;
    
    if (producto.cantidad === 0) {
        alert('Este producto ya tiene 0 unidades');
        return;
    }
    
    mostrarOpcionesDisminuir(id);
}

async function incrementarCantidad(id) {
    try {
        const producto = await db.obtenerProducto(id);
        if (producto) {
            producto.cantidad += 1;
            await db.editarProducto(producto);
            await cargarProductos();
            renderizarInventario();
        }
    } catch (error) {
        console.error('Error al incrementar cantidad:', error);
    }
}

// ========== CRUD PRODUCTOS ==========

function agregarProducto() {
    document.getElementById('modal-producto-title').textContent = 'Agregar Producto';
    document.getElementById('producto-id').value = '';
    document.getElementById('prod-nombre').value = '';
    document.getElementById('prod-cantidad').value = '0';
    document.getElementById('prod-unidad').value = 'unidad';
    document.getElementById('prod-precio-compra').value = '';
    document.getElementById('prod-precio-venta').value = '';
    
    document.getElementById('prod-imagen').value = '';
    document.getElementById('preview-imagen').style.display = 'none';
    document.getElementById('preview-img').src = '#';
    
    const select = document.getElementById('prod-categoria');
    if (!select) return;
    select.innerHTML = '';
    if (categorias.length === 0) {
        const option = document.createElement('option');
        option.value = '';
        option.textContent = '⚠️ Primero crea una categoría';
        option.disabled = true;
        option.selected = true;
        select.appendChild(option);
    } else {
        for (const cat of categorias) {
            const option = document.createElement('option');
            option.value = cat.id;
            option.textContent = cat.nombre;
            select.appendChild(option);
        }
    }
    
    mostrarModal('modal-producto');
}

// Vista previa de imagen
document.addEventListener('DOMContentLoaded', function() {
    const input = document.getElementById('prod-imagen');
    if (input) {
        input.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(event) {
                    const preview = document.getElementById('preview-imagen');
                    const img = document.getElementById('preview-img');
                    if (preview && img) {
                        img.src = event.target.result;
                        preview.style.display = 'block';
                    }
                };
                reader.readAsDataURL(file);
            }
        });
    }
});

function limpiarImagen() {
    document.getElementById('prod-imagen').value = '';
    document.getElementById('preview-imagen').style.display = 'none';
    document.getElementById('preview-img').src = '#';
}

async function guardarProducto(e) {
    e.preventDefault();
    
    try {
        const id = document.getElementById('producto-id').value;
        const nombre = document.getElementById('prod-nombre').value.trim();
        const categoriaId = parseInt(document.getElementById('prod-categoria').value);
        const cantidad = parseFloat(document.getElementById('prod-cantidad').value) || 0;
        const unidad = document.getElementById('prod-unidad').value;
        const precioCompra = parseFloat(document.getElementById('prod-precio-compra').value) || 0;
        const precioVenta = parseFloat(document.getElementById('prod-precio-venta').value) || 0;
        
        const fileInput = document.getElementById('prod-imagen');
        let imagen = '';
        if (fileInput && fileInput.files && fileInput.files[0]) {
            const reader = new FileReader();
            imagen = await new Promise((resolve) => {
                reader.onload = function(e) {
                    resolve(e.target.result);
                };
                reader.readAsDataURL(fileInput.files[0]);
            });
        } else if (id) {
            const productoExistente = productos.find(p => p.id === parseInt(id));
            if (productoExistente && productoExistente.imagen) {
                imagen = productoExistente.imagen;
            }
        }
        
        if (!nombre) {
            alert('El nombre es obligatorio');
            return;
        }
        
        if (!categoriaId) {
            alert('La categoría es obligatoria');
            return;
        }
        
        const producto = { 
            nombre, 
            categoriaId, 
            cantidad, 
            unidad,
            precioCompra, 
            precioVenta,
            imagen: imagen
        };
        
        if (id) {
            producto.id = parseInt(id);
            await db.editarProducto(producto);
            console.log('Producto editado:', producto.nombre);
        } else {
            await db.agregarProducto(producto);
            console.log('Producto agregado:', producto.nombre);
        }
        
        cerrarModal();
        await cargarProductos();
        renderizarInventario();
        cargarConfiguracion();
    } catch (error) {
        console.error('Error al guardar producto:', error);
        alert('Error al guardar producto');
    }
}

async function editarProducto(id) {
    try {
        const producto = await db.obtenerProducto(id);
        if (!producto) return;
        
        document.getElementById('modal-producto-title').textContent = 'Editar Producto';
        document.getElementById('producto-id').value = producto.id;
        document.getElementById('prod-nombre').value = producto.nombre;
        document.getElementById('prod-cantidad').value = producto.cantidad;
        document.getElementById('prod-unidad').value = producto.unidad || 'unidad';
        document.getElementById('prod-precio-compra').value = producto.precioCompra;
        document.getElementById('prod-precio-venta').value = producto.precioVenta;
        
        if (producto.imagen && producto.imagen.length > 100) {
            const preview = document.getElementById('preview-imagen');
            const img = document.getElementById('preview-img');
            if (preview && img) {
                img.src = producto.imagen;
                preview.style.display = 'block';
            }
        } else {
            document.getElementById('preview-imagen').style.display = 'none';
        }
        document.getElementById('prod-imagen').value = '';
        
        const select = document.getElementById('prod-categoria');
        if (!select) return;
        select.innerHTML = '';
        for (const cat of categorias) {
            const option = document.createElement('option');
            option.value = cat.id;
            option.textContent = cat.nombre;
            if (cat.id === producto.categoriaId) option.selected = true;
            select.appendChild(option);
        }
        
        mostrarModal('modal-producto');
    } catch (error) {
        console.error('Error al editar producto:', error);
        alert('Error al cargar producto');
    }
}

async function eliminarProducto(id) {
    try {
        await db.eliminarProducto(id);
        await cargarProductos();
        renderizarInventario();
        console.log('Producto eliminado');
    } catch (error) {
        console.error('Error al eliminar producto:', error);
        alert('Error al eliminar producto');
    }
}

// ========== CRUD CATEGORÍAS ==========

function agregarCategoria() {
    document.getElementById('categoria-id').value = '';
    document.getElementById('cat-nombre').value = '';
    document.getElementById('modal-categoria-title').textContent = 'Nueva Categoría';
    mostrarModal('modal-categoria');
}

async function guardarCategoria(e) {
    e.preventDefault();
    e.stopPropagation();
    
    const id = document.getElementById('categoria-id').value;
    const nombre = document.getElementById('cat-nombre').value.trim();
    
    console.log('Guardando categoría:', { id, nombre });
    
    if (!nombre) {
        alert('El nombre es obligatorio');
        return;
    }
    
    try {
        await db.init();
        
        if (id) {
            await db.editarCategoria(parseInt(id), nombre);
            console.log('Categoría editada');
        } else {
            const existe = categorias.some(c => c.nombre.toLowerCase() === nombre.toLowerCase());
            if (existe) {
                alert('Ya existe una categoría con ese nombre');
                return;
            }
            await db.agregarCategoria(nombre);
            console.log('Categoría agregada');
        }
        
        cerrarModal();
        await cargarCategorias();
        await cargarProductos();
        renderizarInventario();
        cargarConfiguracion();
        console.log('Todo actualizado correctamente');
    } catch (error) {
        console.error('Error al guardar categoría:', error);
        alert('Error al guardar categoría: ' + error.message);
    }
}

async function editarCategoria(id) {
    const categoria = categorias.find(c => c.id === id);
    if (!categoria) return;
    
    document.getElementById('categoria-id').value = categoria.id;
    document.getElementById('cat-nombre').value = categoria.nombre;
    document.getElementById('modal-categoria-title').textContent = 'Editar Categoría';
    mostrarModal('modal-categoria');
}

async function eliminarCategoria(id) {
    const categoria = categorias.find(c => c.id === id);
    if (!categoria) {
        console.error('Categoría no encontrada:', id);
        return;
    }
    
    const productosCat = productos.filter(p => p.categoriaId === id);
    
    let mensaje = `¿Eliminar la categoría "${categoria.nombre}"?`;
    
    if (productosCat.length > 0) {
        mensaje += `\n\n⚠️ Esta categoría tiene ${productosCat.length} productos.`;
        mensaje += `\n\n¿Qué quieres hacer?`;
        mensaje += `\n• "Aceptar" → Eliminar categoría Y TODOS sus productos`;
        mensaje += `\n• "Cancelar" → No eliminar nada`;
        
        if (!confirm(mensaje)) return;
        
        if (!confirm(`⚠️ ¿Estás SEGURO? Se eliminarán ${productosCat.length} productos permanentemente.`)) return;
        
        for (const p of productosCat) {
            await db.eliminarProducto(p.id);
            console.log(`Producto eliminado: ${p.nombre}`);
        }
    } else {
        if (!confirm(`¿Eliminar la categoría "${categoria.nombre}"?`)) return;
    }
    
    try {
        await db.eliminarCategoria(id);
        await cargarCategorias();
        await cargarProductos();
        renderizarInventario();
        cargarConfiguracion();
        console.log('Categoría y sus productos eliminados');
        alert(`✅ Categoría "${categoria.nombre}" eliminada correctamente`);
    } catch (error) {
        console.error('Error al eliminar categoría:', error);
        alert('Error al eliminar: ' + error.message);
    }
}

// ========== FUNCIONES DE DEPURACIÓN ==========

function recargarInventario() {
    console.log('Recargando inventario manualmente...');
    cargarInventario();
}

async function debugInventario() {
    await db.init();
    const cats = await db.obtenerCategorias();
    const prods = await db.obtenerProductos();
    console.log('=== DATOS DE INVENTARIO ===');
    console.log('Categorías:', cats);
    console.log('Productos:', prods);
    console.log('Total productos:', prods.length);
    return { categorias: cats, productos: prods };
}
// ============================================
// VENTAS.JS - Carrito de compras (Soporte decimal)
// ============================================

let productosVenta = [];
let carrito = [];
let categoriasVenta = [];

async function cargarVentas() {
    console.log('🔄 Cargando ventas...');
    await db.init();
    await cargarCategoriasVenta();
    await cargarProductosVenta();
    renderizarVentas();
    
    setTimeout(function() {
        actualizarCarrito();
        console.log('🔄 Carrito actualizado');
    }, 300);
}

async function cargarCategoriasVenta() {
    categoriasVenta = await db.obtenerCategorias();
}

async function cargarProductosVenta() {
    productosVenta = await db.obtenerProductos();
    productosVenta = productosVenta.filter(p => p.cantidad > 0);
}

function renderizarVentas() {
    const container = document.getElementById('ventas-lista');
    if (!container) return;
    container.innerHTML = '';
    
    if (productosVenta.length === 0) {
        container.innerHTML = '<div class="loading-spinner">No hay productos con stock disponible</div>';
        return;
    }
    
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
    
    const categoriasConProductos = categoriasVenta.filter(function(cat) {
        return productosVenta.some(function(p) {
            return p.categoriaId === cat.id;
        });
    });
    
    if (categoriasConProductos.length === 0) {
        container.innerHTML = '<div class="loading-spinner">No hay productos disponibles</div>';
        return;
    }
    
    for (const categoria of categoriasConProductos) {
        const productosCat = productosVenta.filter(function(p) {
            return p.categoriaId === categoria.id;
        });
        
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
            <span class="toggle-icon">▼</span>
        `;
        header.onclick = function() {
            const body = this.parentElement.querySelector('.categoria-body');
            const icon = this.querySelector('.toggle-icon');
            body.classList.toggle('collapsed');
            icon.classList.toggle('collapsed');
        };
        
        const body = document.createElement('div');
        body.className = 'categoria-body ventas-grid';
        
        for (const producto of productosCat) {
            const card = document.createElement('div');
            card.className = 'producto-venta-card';
            const enCarrito = carrito.find(function(c) {
                return c.productoId === producto.id;
            });
            const cantidadEnCarrito = enCarrito ? enCarrito.cantidad : 0;
            const unidadSimbolo = simbolosUnidad[producto.unidad] || 'uds';
            
            card.innerHTML = `
                <div class="producto-venta-info">
                    <h4>${producto.nombre}</h4>
                    <span class="stock">Stock: ${producto.cantidad} ${unidadSimbolo}</span>
                </div>
                <div class="producto-venta-precio">${producto.precioVenta.toFixed(2)} CUP/${unidadSimbolo}</div>
                <div class="venta-control">
                    <input type="number" id="venta-input-${producto.id}" 
                           min="0.1" step="0.1" max="${producto.cantidad - cantidadEnCarrito}" 
                           value="${cantidadEnCarrito > 0 ? cantidadEnCarrito : 1}" />
                    <button onclick="agregarAlCarrito(${producto.id})" 
                            class="btn-agregar-carrito" 
                            id="btn-carrito-${producto.id}">
                        ${cantidadEnCarrito > 0 ? `🛒 ${cantidadEnCarrito}` : '➕ Agregar'}
                    </button>
                </div>
            `;
            body.appendChild(card);
        }
        
        wrapper.appendChild(header);
        wrapper.appendChild(body);
        container.appendChild(wrapper);
    }
}

// ========== AGREGAR AL CARRITO ==========

function agregarAlCarrito(productoId) {
    const producto = productosVenta.find(p => p.id === productoId);
    if (!producto) {
        console.error('Producto no encontrado:', productoId);
        return;
    }
    
    const input = document.getElementById(`venta-input-${productoId}`);
    if (!input) {
        console.error('Input no encontrado para producto:', productoId);
        return;
    }
    
    let cantidad = parseFloat(input.value) || 1;
    
    if (cantidad <= 0) {
        alert('La cantidad debe ser mayor a 0');
        return;
    }
    
    const enCarrito = carrito.find(c => c.productoId === productoId);
    const cantidadActual = enCarrito ? enCarrito.cantidad : 0;
    const cantidadDisponible = producto.cantidad - cantidadActual;
    
    // Redondear a 1 decimal para evitar problemas de precisión
    cantidad = Math.round(cantidad * 10) / 10;
    
    if (cantidad > cantidadDisponible) {
        alert(`Solo hay ${cantidadDisponible} disponibles de este producto`);
        return;
    }
    
    if (enCarrito) {
        enCarrito.cantidad = Math.round((enCarrito.cantidad + cantidad) * 10) / 10;
    } else {
        const nuevoItem = {
            productoId: producto.id,
            nombre: producto.nombre,
            unidad: producto.unidad || 'unidad',
            precioVenta: producto.precioVenta,
            precioCompra: producto.precioCompra,
            cantidad: cantidad,
            categoriaId: producto.categoriaId,
            categoriaNombre: categoriasVenta.find(c => c.id === producto.categoriaId)?.nombre || 'Sin categoría'
        };
        carrito.push(nuevoItem);
        console.log(`Producto agregado al carrito: ${producto.nombre} (${cantidad})`);
    }
    
    const btn = document.getElementById(`btn-carrito-${productoId}`);
    if (btn) {
        const nuevoTotal = carrito.find(c => c.productoId === productoId).cantidad;
        btn.textContent = `🛒 ${nuevoTotal}`;
        btn.classList.add('agregado');
    }
    
    actualizarCarrito();
}

// ========== ACTUALIZAR CARRITO (CON CONTROLES + y - y DECIMALES) ==========

function actualizarCarrito() {
    const total = carrito.reduce((sum, item) => sum + (item.precioVenta * item.cantidad), 0);
    const ganancia = carrito.reduce((sum, item) => sum + ((item.precioVenta - item.precioCompra) * item.cantidad), 0);
    const count = carrito.reduce((sum, item) => sum + item.cantidad, 0);
    
    const countEl = document.getElementById('carrito-count');
    const totalEl = document.getElementById('carrito-total');
    const gananciaEl = document.getElementById('carrito-ganancia');
    const btnFinalizar = document.getElementById('btn-finalizar-venta');
    const btnVaciar = document.getElementById('btn-vaciar-carrito');
    const listaCarrito = document.getElementById('carrito-lista');
    
    if (countEl) countEl.textContent = count.toFixed(1);
    if (totalEl) totalEl.textContent = total.toFixed(2) + ' CUP';
    if (gananciaEl) gananciaEl.textContent = ganancia.toFixed(2) + ' CUP';
    
    // Mostrar productos en el carrito con controles + y -
    if (listaCarrito) {
        if (carrito.length === 0) {
            listaCarrito.innerHTML = '<p style="color:var(--color-text-secondary);text-align:center;padding:10px 0;font-size:14px;">No hay productos en el carrito</p>';
        } else {
            let html = '';
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
            for (const item of carrito) {
                const unidadSimbolo = simbolosUnidad[item.unidad] || 'uds';
                const precioTotal = (item.precioVenta * item.cantidad).toFixed(2);
                
                // Verificar stock disponible para aumentar
                const productoOriginal = productosVenta.find(p => p.id === item.productoId);
                const stockDisponible = productoOriginal ? productoOriginal.cantidad : 0;
                const maxPermitido = stockDisponible;
                
                html += `
                    <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 12px;background:var(--color-bg);border-radius:8px;margin-bottom:6px;flex-wrap:wrap;gap:8px;">
                        <div style="display:flex;align-items:center;gap:8px;flex:1;min-width:120px;">
                            <span style="color:var(--color-text);font-size:14px;font-weight:600;">${item.nombre}</span>
                            <span style="color:var(--color-text-secondary);font-size:12px;">${unidadSimbolo}</span>
                        </div>
                        <div style="display:flex;align-items:center;gap:6px;">
                            <button onclick="cambiarCantidadCarrito(${item.productoId}, -0.1)" 
                                    style="background:#e17055;color:white;border:none;border-radius:50%;width:28px;height:28px;cursor:pointer;font-size:16px;font-weight:700;transition:all 0.3s ease;display:flex;align-items:center;justify-content:center;"
                                    onmouseover="this.style.transform='scale(1.1)'"
                                    onmouseout="this.style.transform='scale(1)'"
                                    title="Disminuir 0.1">−</button>
                            <span style="color:var(--color-text);font-size:16px;font-weight:700;min-width:45px;text-align:center;">${item.cantidad.toFixed(1)}</span>
                            <button onclick="cambiarCantidadCarrito(${item.productoId}, 0.1)" 
                                    style="background:#00b894;color:white;border:none;border-radius:50%;width:28px;height:28px;cursor:pointer;font-size:16px;font-weight:700;transition:all 0.3s ease;display:flex;align-items:center;justify-content:center;"
                                    onmouseover="this.style.transform='scale(1.1)'"
                                    onmouseout="this.style.transform='scale(1)'"
                                    title="Aumentar 0.1">+</button>
                            <button onclick="cambiarCantidadCarrito(${item.productoId}, -1)" 
                                    style="background:#e17055;color:white;border:none;border-radius:50%;width:28px;height:28px;cursor:pointer;font-size:14px;font-weight:700;transition:all 0.3s ease;display:flex;align-items:center;justify-content:center;"
                                    onmouseover="this.style.transform='scale(1.1)'"
                                    onmouseout="this.style.transform='scale(1)'"
                                    title="Disminuir 1">--</button>
                            <button onclick="cambiarCantidadCarrito(${item.productoId}, 1)" 
                                    style="background:#00b894;color:white;border:none;border-radius:50%;width:28px;height:28px;cursor:pointer;font-size:14px;font-weight:700;transition:all 0.3s ease;display:flex;align-items:center;justify-content:center;"
                                    onmouseover="this.style.transform='scale(1.1)'"
                                    onmouseout="this.style.transform='scale(1)'"
                                    title="Aumentar 1">++</button>
                        </div>
                        <div style="display:flex;align-items:center;gap:12px;">
                            <span style="color:var(--color-text);font-size:14px;font-weight:600;min-width:70px;text-align:right;">${precioTotal} CUP</span>
                            <button onclick="eliminarDelCarrito(${item.productoId})" 
                                    style="background:#d63031;color:white;border:none;border-radius:50%;width:28px;height:28px;cursor:pointer;font-size:14px;font-weight:700;transition:all 0.3s ease;display:flex;align-items:center;justify-content:center;"
                                    onmouseover="this.style.transform='scale(1.1)'"
                                    onmouseout="this.style.transform='scale(1)'"
                                    title="Eliminar ${item.nombre} del carrito">✕</button>
                        </div>
                    </div>
                `;
            }
            listaCarrito.innerHTML = html;
        }
    }
    
    if (btnFinalizar) {
        if (carrito.length > 0) {
            btnFinalizar.disabled = false;
            btnFinalizar.removeAttribute('disabled');
            btnFinalizar.style.opacity = '1';
            btnFinalizar.style.cursor = 'pointer';
            btnFinalizar.style.pointerEvents = 'auto';
            btnFinalizar.textContent = `✅ Finalizar Venta (${carrito.length} productos)`;
            btnFinalizar.onclick = function() {
                console.log('🖱️ Botón Finalizar Venta CLICKEADO');
                finalizarVenta();
            };
        } else {
            btnFinalizar.disabled = true;
            btnFinalizar.setAttribute('disabled', 'disabled');
            btnFinalizar.style.opacity = '0.5';
            btnFinalizar.style.cursor = 'not-allowed';
            btnFinalizar.style.pointerEvents = 'none';
            btnFinalizar.textContent = '✅ Finalizar Venta';
        }
    }
    
    if (btnVaciar) {
        if (carrito.length > 0) {
            btnVaciar.disabled = false;
            btnVaciar.removeAttribute('disabled');
            btnVaciar.style.opacity = '1';
            btnVaciar.style.cursor = 'pointer';
            btnVaciar.style.pointerEvents = 'auto';
        } else {
            btnVaciar.disabled = true;
            btnVaciar.setAttribute('disabled', 'disabled');
            btnVaciar.style.opacity = '0.5';
            btnVaciar.style.cursor = 'not-allowed';
            btnVaciar.style.pointerEvents = 'none';
        }
    }
}

// ========== CAMBIAR CANTIDAD EN EL CARRITO (CON DECIMALES) ==========

function cambiarCantidadCarrito(productoId, cambio) {
    const item = carrito.find(c => c.productoId === productoId);
    if (!item) return;
    
    // Calcular nueva cantidad con precisión decimal
    let nuevaCantidad = Math.round((item.cantidad + cambio) * 10) / 10;
    
    // Validar que no sea menor a 0.1
    if (nuevaCantidad < 0.1) {
        // Si llega a 0, preguntar si quiere eliminar
        if (confirm(`¿Eliminar "${item.nombre}" del carrito?`)) {
            eliminarDelCarrito(productoId);
        }
        return;
    }
    
    // Verificar stock disponible
    const productoOriginal = productosVenta.find(p => p.id === productoId);
    if (productoOriginal && nuevaCantidad > productoOriginal.cantidad) {
        alert(`❌ No hay suficiente stock de "${item.nombre}".\nDisponible: ${productoOriginal.cantidad}`);
        return;
    }
    
    // Actualizar cantidad
    item.cantidad = nuevaCantidad;
    
    // Actualizar el botón en la lista de productos
    const btn = document.getElementById(`btn-carrito-${productoId}`);
    if (btn) {
        btn.textContent = `🛒 ${nuevaCantidad}`;
    }
    
    // Actualizar input max
    const input = document.getElementById(`venta-input-${productoId}`);
    if (input) {
        if (productoOriginal) {
            input.max = productoOriginal.cantidad - nuevaCantidad;
        }
        input.value = 0.1;
    }
    
    actualizarCarrito();
    console.log(`✅ Cantidad de "${item.nombre}" actualizada a: ${nuevaCantidad}`);
}

// ========== ELIMINAR PRODUCTO DEL CARRITO (INDIVIDUAL) ==========

function eliminarDelCarrito(productoId) {
    const index = carrito.findIndex(c => c.productoId === productoId);
    if (index === -1) return;
    
    const producto = carrito[index];
    
    // Actualizar el botón del producto en la lista de productos
    const btn = document.getElementById(`btn-carrito-${productoId}`);
    if (btn) {
        btn.textContent = '➕ Agregar';
        btn.classList.remove('agregado');
    }
    
    // Actualizar input max
    const input = document.getElementById(`venta-input-${productoId}`);
    if (input) {
        const productoOriginal = productosVenta.find(p => p.id === productoId);
        if (productoOriginal) {
            input.max = productoOriginal.cantidad;
            input.value = 0.1;
        }
    }
    
    carrito.splice(index, 1);
    actualizarCarrito();
    console.log(`✅ Producto eliminado del carrito: ${producto.nombre}`);
}

// ========== VACIAR/CANCELAR CARRITO ==========

function vaciarCarrito() {
    if (carrito.length === 0) {
        alert('El carrito ya está vacío');
        return;
    }
    
    if (!confirm('⚠️ ¿Cancelar toda la compra?\n\nSe eliminarán todos los productos del carrito.')) {
        return;
    }
    
    const productosEliminados = carrito.map(item => `${item.nombre} (${item.cantidad})`).join(', ');
    
    // Restaurar todos los botones
    document.querySelectorAll('.btn-agregar-carrito').forEach(function(btn) {
        btn.textContent = '➕ Agregar';
        btn.classList.remove('agregado');
    });
    
    // Restaurar todos los inputs
    document.querySelectorAll('.venta-control input[type="number"]').forEach(function(input) {
        const productoId = parseInt(input.id.replace('venta-input-', ''));
        const productoOriginal = productosVenta.find(p => p.id === productoId);
        if (productoOriginal) {
            input.max = productoOriginal.cantidad;
            input.value = 0.1;
        }
    });
    
    carrito = [];
    actualizarCarrito();
    
    alert(`✅ Carrito cancelado\n\nProductos eliminados: ${productosEliminados}`);
    console.log('✅ Carrito vaciado');
}

// ========== FINALIZAR VENTA ==========

function finalizarVenta() {
    console.log('🔄 Finalizando venta... Carrito:', carrito);
    
    if (carrito.length === 0) {
        alert('El carrito está vacío');
        return;
    }
    
    const total = carrito.reduce((sum, item) => sum + (item.precioVenta * item.cantidad), 0);
    const ganancia = carrito.reduce((sum, item) => sum + ((item.precioVenta - item.precioCompra) * item.cantidad), 0);
    
    console.log('Total:', total, 'Ganancia:', ganancia);
    
    // Crear el modal de resumen directamente
    mostrarResumenVenta(carrito, total, ganancia);
}

// ========== MOSTRAR RESUMEN DE VENTA ==========

function mostrarResumenVenta(items, total, ganancia) {
    console.log('🔄 Mostrando resumen de venta...');
    
    const modalExistente = document.getElementById('modal-resumen-venta');
    if (modalExistente) modalExistente.remove();
    
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
    
    const isDarkMode = document.body.classList.contains('dark-mode');
    
    const bgColor = isDarkMode ? '#2D3748' : '#FFFFFF';
    const textColor = isDarkMode ? '#F7FAFC' : '#2D3748';
    const borderColor = isDarkMode ? '#4A5568' : '#E2E8F0';
    const accentColor = isDarkMode ? '#55EFC4' : '#FF6B6B';
    const shadowColor = isDarkMode ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.2)';
    const primaryColor = isDarkMode ? '#6C5CE7' : '#0F4C81';
    const closeColor = isDarkMode ? '#A0AEC0' : '#b2bec3';
    const closeHoverColor = isDarkMode ? '#F7FAFC' : '#2d3436';
    const btnCancelBg = isDarkMode ? '#4A5568' : '#dfe6e9';
    const btnConfirmBg = isDarkMode ? '#6C5CE7' : '#FF6B6B';
    
    let itemsHTML = '';
    for (const item of items) {
        const unidadSimbolo = simbolosUnidad[item.unidad] || 'uds';
        const precioTotal = (item.precioVenta * item.cantidad).toFixed(2);
        itemsHTML += `
            <div style="display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid ${borderColor};">
                <span style="color:${textColor};font-size:15px;">${item.nombre} × ${item.cantidad.toFixed(1)} ${unidadSimbolo}</span>
                <span style="color:${textColor};font-size:15px;font-weight:600;">${precioTotal} CUP</span>
            </div>
        `;
    }
    
    const modal = document.createElement('div');
    modal.id = 'modal-resumen-venta';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.6);
        backdrop-filter: blur(4px);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 9999;
        padding: 16px;
        animation: modalFadeIn 0.3s ease;
    `;
    
    modal.innerHTML = `
        <div style="
            background: ${bgColor};
            padding: 28px 24px 24px 24px;
            border-radius: 16px;
            max-width: 500px;
            width: 100%;
            max-height: 80vh;
            overflow-y: auto;
            position: relative;
            box-shadow: 0 10px 40px ${shadowColor};
            color: ${textColor};
        ">
            <span onclick="this.parentElement.parentElement.remove()" 
                  style="position:absolute;top:12px;right:16px;font-size:28px;cursor:pointer;color:${closeColor};transition:all 0.3s ease;line-height:1;"
                  onmouseover="this.style.color='${closeHoverColor}'"
                  onmouseout="this.style.color='${closeColor}'">&times;</span>
            
            <h2 style="margin-bottom:20px;color:${textColor};font-size:22px;font-weight:700;">🛒 Resumen de Venta</h2>
            
            <div id="resumen-items" style="margin-bottom:16px;max-height:300px;overflow-y:auto;">
                ${itemsHTML}
            </div>
            
            <div style="margin-top:16px;padding-top:16px;border-top:2px solid ${primaryColor};">
                <p style="font-size:18px;display:flex;justify-content:space-between;color:${textColor};margin-bottom:8px;">
                    <strong style="color:${textColor};">Total:</strong>
                    <span style="color:${textColor};font-weight:700;">${total.toFixed(2)} CUP</span>
                </p>
                <p style="font-size:18px;display:flex;justify-content:space-between;color:${textColor};">
                    <strong style="color:${textColor};">Ganancia:</strong>
                    <span style="color:${accentColor};font-weight:700;">${ganancia.toFixed(2)} CUP</span>
                </p>
            </div>
            
            <div style="display:flex;gap:10px;margin-top:20px;">
                <button onclick="confirmarVentaFinalDirecto()" 
                        style="flex:1;justify-content:center;padding:14px;border-radius:50px;border:none;font-weight:700;cursor:pointer;background:${btnConfirmBg};color:white;font-size:16px;transition:all 0.3s ease;"
                        onmouseover="this.style.transform='scale(1.02)'"
                        onmouseout="this.style.transform='scale(1)'">
                    ✅ Confirmar Venta
                </button>
                <button onclick="this.closest('#modal-resumen-venta').remove()" 
                        style="flex:1;justify-content:center;padding:14px;border-radius:50px;border:none;font-weight:600;cursor:pointer;background:${btnCancelBg};color:${textColor};font-size:16px;transition:all 0.3s ease;"
                        onmouseover="this.style.transform='scale(1.02)'"
                        onmouseout="this.style.transform='scale(1)'">
                    Cancelar
                </button>
            </div>
        </div>
    `;
    
    if (!document.getElementById('modal-styles')) {
        const style = document.createElement('style');
        style.id = 'modal-styles';
        style.textContent = `
            @keyframes modalFadeIn {
                from { opacity: 0; transform: scale(0.95) translateY(10px); }
                to { opacity: 1; transform: scale(1) translateY(0); }
            }
        `;
        document.head.appendChild(style);
    }
    
    document.body.appendChild(modal);
    console.log('✅ Resumen de venta mostrado - Modo oscuro:', isDarkMode);
}

// ========== CONFIRMAR VENTA FINAL ==========

async function confirmarVentaFinalDirecto() {
    console.log('✅ Confirmando venta final directo...');
    
    const modal = document.getElementById('modal-resumen-venta');
    if (modal) modal.remove();
    
    const ventasRegistradas = [];
    
    for (const item of carrito) {
        const producto = await db.obtenerProducto(item.productoId);
        if (!producto) continue;
        
        if (item.cantidad > producto.cantidad) {
            alert(`No hay suficiente stock de ${item.nombre}`);
            return;
        }
        
        const venta = {
            productoId: item.productoId,
            productoNombre: item.nombre,
            categoriaId: item.categoriaId,
            categoriaNombre: item.categoriaNombre,
            cantidad: item.cantidad,
            precioVentaHistorico: item.precioVenta,
            precioCompraHistorico: item.precioCompra,
            ingresoTotal: item.precioVenta * item.cantidad,
            costoTotal: item.precioCompra * item.cantidad,
            gananciaReal: (item.precioVenta - item.precioCompra) * item.cantidad,
            fecha: new Date().toISOString().slice(0, 10),
            timestamp: new Date().toISOString()
        };
        
        await db.agregarVenta(venta);
        
        producto.cantidad -= item.cantidad;
        await db.editarProducto(producto);
        
        ventasRegistradas.push(venta);
    }
    
    carrito = [];
    actualizarCarrito();
    
    await cargarProductosVenta();
    renderizarVentas();
    
    const totalVentas = ventasRegistradas.reduce((sum, v) => sum + v.cantidad, 0);
    const totalIngresos = ventasRegistradas.reduce((sum, v) => sum + v.ingresoTotal, 0);
    const totalGanancia = ventasRegistradas.reduce((sum, v) => sum + v.gananciaReal, 0);
    
    alert(`✅ Venta completada!\n\nProductos: ${ventasRegistradas.length}\nUnidades: ${totalVentas.toFixed(1)}\nIngresos: ${totalIngresos.toFixed(2)} CUP\nGanancia: ${totalGanancia.toFixed(2)} CUP`);
}
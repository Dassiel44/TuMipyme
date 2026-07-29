// ============================================
// HISTORIAL.JS - Gestión del historial (Versión Tabla)
// ============================================

let todasVentas = [];
let ventasFiltradas = [];

async function cargarHistorial() {
    await db.init();
    await cargarCategoriasHistorial();
    todasVentas = await db.obtenerVentas();
    ventasFiltradas = [...todasVentas];
    renderizarHistorial();
}

async function cargarCategoriasHistorial() {
    const categorias = await db.obtenerCategorias();
    const select = document.getElementById('filtro-categoria');
    if (!select) return;
    select.innerHTML = '<option value="">Todas</option>';
    for (const cat of categorias) {
        const option = document.createElement('option');
        option.value = cat.id;
        option.textContent = cat.nombre;
        select.appendChild(option);
    }
}

function renderizarHistorial() {
    const container = document.getElementById('historial-lista');
    if (!container) return;
    
    const totalVentas = ventasFiltradas.reduce((sum, v) => sum + v.cantidad, 0);
    const totalIngresos = ventasFiltradas.reduce((sum, v) => sum + v.ingresoTotal, 0);
    const totalGanancia = ventasFiltradas.reduce((sum, v) => sum + v.gananciaReal, 0);
    const totalRegistros = ventasFiltradas.length;
    
    let html = `
        <div class="historial-total">
            <div class="historial-total-item">
                📊 <span>Total Ventas:</span>
                <span>${totalRegistros}</span>
            </div>
            <div class="historial-total-item">
                📦 <span>Unidades:</span>
                <span>${totalVentas.toFixed(1)}</span>
            </div>
            <div class="historial-total-item">
                💰 <span>Ingresos:</span>
                <span>${totalIngresos.toFixed(2)} CUP</span>
            </div>
            <div class="historial-total-item">
                📈 <span>Ganancia:</span>
                <span class="total-ganancia">${totalGanancia.toFixed(2)} CUP</span>
            </div>
        </div>
    `;
    
    if (ventasFiltradas.length === 0) {
        container.innerHTML = html + '<div class="loading-spinner">No hay ventas registradas</div>';
        return;
    }
    
    ventasFiltradas.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    html += `
        <div class="historial-container">
            <table class="historial-tabla">
                <thead>
                    <tr>
                        <th>📅 Fecha</th>
                        <th>🕐 Hora</th>
                        <th>📦 Producto</th>
                        <th>📂 Categoría</th>
                        <th>🔢 Cantidad</th>
                        <th>💰 Precio</th>
                        <th>💵 Ingreso</th>
                        <th>📈 Ganancia</th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    for (const venta of ventasFiltradas) {
        const fecha = new Date(venta.timestamp);
        const fechaStr = fecha.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
        const horaStr = fecha.toLocaleTimeString('es-ES', {
            hour: '2-digit',
            minute: '2-digit'
        });
        
        const gananciaClase = venta.gananciaReal >= 0 ? 'positiva' : 'negativa';
        const gananciaSimbolo = venta.gananciaReal >= 0 ? '📈' : '📉';
        
        html += `
            <tr>
                <td>${fechaStr}</td>
                <td>${horaStr}</td>
                <td><strong>${venta.productoNombre}</strong></td>
                <td><span class="historial-badge">${venta.categoriaNombre || 'Sin categoría'}</span></td>
                <td>${venta.cantidad}</td>
                <td>${venta.precioVentaHistorico.toFixed(2)} CUP</td>
                <td>${venta.ingresoTotal.toFixed(2)} CUP</td>
                <td class="historial-ganancia ${gananciaClase}">
                    ${gananciaSimbolo} ${venta.gananciaReal.toFixed(2)} CUP
                </td>
            </tr>
        `;
    }
    
    html += `
                </tbody>
            </table>
        </div>
    `;
    
    container.innerHTML = html;
}

function aplicarFiltros() {
    const fechaSeleccionada = document.getElementById('filtro-fecha').value;
    const categoriaId = document.getElementById('filtro-categoria').value;
    
    console.log('🔍 Aplicando filtros - Fecha:', fechaSeleccionada, 'Categoría:', categoriaId);
    
    ventasFiltradas = [...todasVentas];
    
    if (fechaSeleccionada && fechaSeleccionada !== '') {
        ventasFiltradas = ventasFiltradas.filter(v => v.fecha === fechaSeleccionada);
        console.log('📅 Ventas encontradas para', fechaSeleccionada, ':', ventasFiltradas.length);
    }
    
    if (categoriaId && categoriaId !== '') {
        const catId = parseInt(categoriaId);
        ventasFiltradas = ventasFiltradas.filter(v => v.categoriaId === catId);
        console.log('📂 Filtrado por categoría ID:', catId, 'Resultados:', ventasFiltradas.length);
    }
    
    renderizarHistorial();
}

function limpiarFiltros() {
    console.log('🧹 Limpiando filtros...');
    
    const fechaInput = document.getElementById('filtro-fecha');
    const categoriaSelect = document.getElementById('filtro-categoria');
    
    if (fechaInput) fechaInput.value = '';
    if (categoriaSelect) categoriaSelect.value = '';
    
    ventasFiltradas = [...todasVentas];
    console.log('📋 Mostrando todas las ventas:', ventasFiltradas.length);
    
    renderizarHistorial();
}

// ========== ELIMINAR HISTORIAL POR FECHA ==========

function eliminarHistorialPorFecha() {
    // Crear modal para seleccionar fecha
    const modal = document.createElement('div');
    modal.className = 'modal show';
    modal.style.display = 'flex';
    modal.style.position = 'fixed';
    modal.style.top = '0';
    modal.style.left = '0';
    modal.style.width = '100%';
    modal.style.height = '100%';
    modal.style.background = 'rgba(0,0,0,0.5)';
    modal.style.backdropFilter = 'blur(4px)';
    modal.style.justifyContent = 'center';
    modal.style.alignItems = 'center';
    modal.style.zIndex = '9999';
    modal.style.padding = '16px';
    
    const isDarkMode = document.body.classList.contains('dark-mode');
    const bgColor = isDarkMode ? '#2D3748' : '#FFFFFF';
    const textColor = isDarkMode ? '#F7FAFC' : '#2D3748';
    const borderColor = isDarkMode ? '#4A5568' : '#E2E8F0';
    const primaryColor = isDarkMode ? '#6C5CE7' : '#0F4C81';
    const dangerColor = isDarkMode ? '#FF7675' : '#e17055';
    
    // Obtener fecha actual en formato YYYY-MM-DD
    const hoy = new Date().toISOString().slice(0, 10);
    
    modal.innerHTML = `
        <div style="background:${bgColor};padding:24px;border-radius:16px;max-width:450px;width:100%;position:relative;box-shadow:0 10px 40px rgba(0,0,0,0.2);">
            <span onclick="this.parentElement.parentElement.remove()" 
                  style="position:absolute;top:12px;right:16px;font-size:28px;cursor:pointer;color:${isDarkMode ? '#A0AEC0' : '#b2bec3'};line-height:1;">&times;</span>
            
            <h2 style="margin-bottom:16px;color:${textColor};font-size:20px;">🗑️ Eliminar Historial</h2>
            
            <p style="color:${textColor};margin-bottom:16px;font-size:14px;">
                Selecciona una fecha para eliminar todas las ventas <strong>desde esa fecha</strong> en adelante.
            </p>
            
            <label style="display:block;margin-bottom:8px;font-weight:600;color:${textColor};">
                📅 Eliminar desde:
            </label>
            <input type="date" id="fecha-eliminar-historial" 
                   value="${hoy}" 
                   max="${hoy}"
                   style="width:100%;padding:10px 12px;border:1px solid ${borderColor};border-radius:8px;font-size:16px;background:${isDarkMode ? '#1A202C' : '#f8f9fa'};color:${textColor};margin-bottom:16px;" />
            
            <div style="display:flex;gap:8px;margin-top:8px;">
                <button onclick="confirmarEliminarHistorialDesdeFecha()" 
                        style="flex:1;padding:12px;border-radius:50px;border:none;font-weight:600;cursor:pointer;background:${dangerColor};color:white;font-size:15px;transition:all 0.3s ease;">
                    🗑️ Eliminar
                </button>
                <button onclick="this.closest('.modal').remove()" 
                        style="flex:1;padding:12px;border-radius:50px;border:none;font-weight:600;cursor:pointer;background:${borderColor};color:${textColor};font-size:15px;transition:all 0.3s ease;">
                    Cancelar
                </button>
            </div>
            
            <p style="font-size:11px;color:${isDarkMode ? '#A0AEC0' : '#999'};margin-top:12px;text-align:center;">
                ⚠️ Esta acción no se puede deshacer. Se eliminarán todas las ventas desde la fecha seleccionada.
            </p>
        </div>
    `;
    
    document.body.appendChild(modal);
}

// ========== CONFIRMAR Y EJECUTAR ELIMINACIÓN ==========

async function confirmarEliminarHistorialDesdeFecha() {
    const input = document.getElementById('fecha-eliminar-historial');
    if (!input) return;
    
    const fecha = input.value;
    if (!fecha) {
        alert('❌ Por favor selecciona una fecha');
        return;
    }
    
    // Verificar cuántas ventas serán eliminadas
    const ventasAEliminar = todasVentas.filter(v => v.fecha >= fecha);
    
    if (ventasAEliminar.length === 0) {
        alert('📭 No hay ventas desde la fecha seleccionada');
        const modal = input.closest('.modal');
        if (modal) modal.remove();
        return;
    }
    
    // Confirmación con detalles
    const confirmar = confirm(
        `⚠️ ¿Estás SEGURO?\n\n` +
        `Se eliminarán ${ventasAEliminar.length} ventas\n` +
        `Desde: ${new Date(fecha).toLocaleDateString('es-ES')}\n\n` +
        `Ingresos: ${ventasAEliminar.reduce((sum, v) => sum + v.ingresoTotal, 0).toFixed(2)} CUP\n` +
        `Ganancia: ${ventasAEliminar.reduce((sum, v) => sum + v.gananciaReal, 0).toFixed(2)} CUP\n\n` +
        `⚠️ Esta acción no se puede deshacer.`
    );
    
    if (!confirmar) return;
    
    try {
        // Eliminar ventas una por una
        for (const venta of ventasAEliminar) {
            await db.eliminarVenta(venta.id);
        }
        
        // Cerrar modal
        const modal = input.closest('.modal');
        if (modal) modal.remove();
        
        // Recargar historial
        await cargarHistorial();
        
        alert(`✅ ${ventasAEliminar.length} ventas eliminadas correctamente desde ${new Date(fecha).toLocaleDateString('es-ES')}`);
        
    } catch (error) {
        console.error('Error al eliminar historial:', error);
        alert('❌ Error al eliminar el historial: ' + error.message);
    }
}
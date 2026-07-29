// ============================================
// EXPORTAR.JS - Exportación e Importación de datos
// ============================================

// ========== MOSTRAR ALERTA ==========

function mostrarAlerta(mensaje, tipo = 'info') {
    const mensajeLimpio = mensaje.replace(/https?:\/\/[^\s]+/g, '').trim();
    alert(mensajeLimpio);
}

// ========== EXPORTAR DATOS COMPLETOS ==========

async function exportarDatos() {
    try {
        await db.init();
        
        const categorias = await db.obtenerCategorias();
        const productos = await db.obtenerProductos();
        const ventas = await db.obtenerVentas();
        
        if (categorias.length === 0 && productos.length === 0 && ventas.length === 0) {
            mostrarAlerta('No hay datos para exportar', 'info');
            return;
        }
        
        const datos = {
            version: '1.0',
            fechaExportacion: new Date().toISOString(),
            totalCategorias: categorias.length,
            totalProductos: productos.length,
            totalVentas: ventas.length,
            categorias: categorias,
            productos: productos,
            ventas: ventas,
            resumen: {
                totalIngresos: ventas.reduce((sum, v) => sum + v.ingresoTotal, 0),
                totalGanancia: ventas.reduce((sum, v) => sum + v.gananciaReal, 0),
                totalUnidades: ventas.reduce((sum, v) => sum + v.cantidad, 0)
            }
        };
        
        const json = JSON.stringify(datos, null, 2);
        const nombreArchivo = `miPyme_backup_${new Date().toISOString().slice(0, 10)}.json`;
        
        // Descarga directa
        const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = nombreArchivo;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        
        setTimeout(() => {
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        }, 500);
        
        // Guardar copia en localStorage para "Ver exportación"
        localStorage.setItem('miPyme_export_backup', json);
        localStorage.setItem('miPyme_export_nombre', nombreArchivo);
        localStorage.setItem('miPyme_export_tipo', 'json');
        localStorage.setItem('miPyme_export_fecha', new Date().toISOString());
        localStorage.setItem('miPyme_export_ubicacion', '📁 Carpeta de Descargas');
        
        mostrarAlerta(
            `✅ Datos exportados correctamente\n\n` +
            `📄 Archivo: ${nombreArchivo}\n` +
            `📦 Tamaño: ${(json.length / 1024).toFixed(2)} KB\n` +
            `📁 Ubicación: Carpeta de Descargas\n\n` +
            `💡 Usa el botón "Ver exportación" en Configuración para ver el contenido.`,
            'success'
        );
        
    } catch (error) {
        console.error('Error al exportar:', error);
        mostrarAlerta('Error al exportar: ' + error.message, 'error');
    }
}

// ========== EXPORTAR HISTORIAL ==========

function exportarHistorial() {
    const datos = typeof ventasFiltradas !== 'undefined' ? ventasFiltradas : [];
    
    if (datos.length === 0) {
        mostrarAlerta('No hay datos para exportar', 'info');
        return;
    }
    
    const datosOrdenados = [...datos].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    let csv = 'Fecha,Hora,Producto,Categoría,Cantidad,Precio,Ingreso,Ganancia\n';
    
    for (const v of datosOrdenados) {
        const fecha = new Date(v.timestamp);
        const fechaStr = fecha.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
        const horaStr = fecha.toLocaleTimeString('es-ES', {
            hour: '2-digit',
            minute: '2-digit'
        });
        
        csv += `${fechaStr},${horaStr},${v.productoNombre},${v.categoriaNombre || 'Sin categoría'},${v.cantidad},${v.precioVentaHistorico.toFixed(2)},${v.ingresoTotal.toFixed(2)},${v.gananciaReal.toFixed(2)}\n`;
    }
    
    const totalVentas = datosOrdenados.reduce((sum, v) => sum + v.cantidad, 0);
    const totalIngresos = datosOrdenados.reduce((sum, v) => sum + v.ingresoTotal, 0);
    const totalGanancia = datosOrdenados.reduce((sum, v) => sum + v.gananciaReal, 0);
    
    csv += '\n=== RESUMEN ===\n';
    csv += `Total Ventas,${datosOrdenados.length}\n`;
    csv += `Total Unidades,${totalVentas.toFixed(1)}\n`;
    csv += `Total Ingresos,${totalIngresos.toFixed(2)}\n`;
    csv += `Total Ganancia,${totalGanancia.toFixed(2)}\n`;
    
    const nombreArchivo = `historial_${new Date().toISOString().slice(0, 10)}.csv`;
    const contenido = '\uFEFF' + csv;
    
    const blob = new Blob([contenido], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = nombreArchivo;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    
    setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }, 500);
    
    mostrarAlerta(`✅ Historial exportado correctamente\n\n📄 Archivo: ${nombreArchivo}`, 'success');
}

// ========== VER EXPORTACIÓN GUARDADA ==========

function verExportacionGuardada() {
    const contenido = localStorage.getItem('miPyme_export_backup');
    const nombre = localStorage.getItem('miPyme_export_nombre') || 'No hay archivo';
    const tipo = localStorage.getItem('miPyme_export_tipo') || 'txt';
    const fecha = localStorage.getItem('miPyme_export_fecha') || 'No disponible';
    const ubicacion = localStorage.getItem('miPyme_export_ubicacion') || 'Memoria interna de la app';
    
    if (!contenido) {
        mostrarAlerta('📭 No hay ningún archivo exportado guardado.\n\nExporta datos primero usando el botón "Exportar".', 'info');
        return;
    }
    
    const isDarkMode = document.body.classList.contains('dark-mode');
    const bgColor = isDarkMode ? '#2D3748' : '#FFFFFF';
    const textColor = isDarkMode ? '#F7FAFC' : '#2D3748';
    const borderColor = isDarkMode ? '#4A5568' : '#E2E8F0';
    const primaryColor = isDarkMode ? '#6C5CE7' : '#0F4C81';
    const successColor = isDarkMode ? '#55EFC4' : '#00b894';
    const dangerColor = isDarkMode ? '#FF7675' : '#e74c3c';
    
    const preview = contenido.length > 5000 ? contenido.substring(0, 5000) + '\n\n... (archivo truncado)' : contenido;
    const previewEscapado = preview
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    
    const modal = document.createElement('div');
    modal.id = 'modal-ver-exportacion';
    modal.className = 'modal show';
    modal.style.cssText = `
        display: flex !important;
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.6);
        backdrop-filter: blur(4px);
        justify-content: center;
        align-items: center;
        z-index: 9999;
        padding: 16px;
        animation: modalFadeIn 0.3s ease;
    `;
    
    modal.innerHTML = 
        '<div style="background:' + bgColor + ';padding:24px;border-radius:16px;max-width:600px;width:100%;max-height:85vh;overflow-y:auto;position:relative;box-shadow:0 10px 40px rgba(0,0,0,0.3);color:' + textColor + ';">' +
            '<span onclick="cerrarModalExportacion()" style="position:absolute;top:12px;right:16px;font-size:28px;cursor:pointer;color:' + (isDarkMode ? '#A0AEC0' : '#b2bec3') + ';line-height:1;transition:all 0.3s ease;" onmouseover="this.style.color=\'' + textColor + '\'" onmouseout="this.style.color=\'' + (isDarkMode ? '#A0AEC0' : '#b2bec3') + '\'">&times;</span>' +
            '<h2 style="margin-bottom:16px;color:' + textColor + ';font-size:22px;font-weight:700;">📄 Archivo Exportado</h2>' +
            '<div style="margin-bottom:16px;color:' + textColor + ';font-size:14px;background:' + (isDarkMode ? '#1A202C' : '#f8f9fa') + ';padding:12px;border-radius:8px;border:1px solid ' + borderColor + ';">' +
                '<p style="margin:4px 0;"><strong>📛 Nombre:</strong> ' + nombre + '</p>' +
                '<p style="margin:4px 0;"><strong>📅 Fecha:</strong> ' + new Date(fecha).toLocaleString('es-ES') + '</p>' +
                '<p style="margin:4px 0;"><strong>📦 Tamaño:</strong> ' + (contenido.length / 1024).toFixed(2) + ' KB</p>' +
                '<p style="margin:4px 0;"><strong>📂 Tipo:</strong> ' + tipo.toUpperCase() + '</p>' +
                '<p style="margin:4px 0;color:' + primaryColor + ';font-weight:600;font-size:15px;">📁 Ubicación: ' + ubicacion + '</p>' +
            '</div>' +
            '<div style="background:' + (isDarkMode ? '#1A202C' : '#f8f9fa') + ';padding:12px;border-radius:8px;max-height:200px;overflow-y:auto;margin-bottom:16px;font-family:\'Courier New\',monospace;font-size:12px;color:' + textColor + ';border:1px solid ' + borderColor + ';">' +
                '<pre style="white-space:pre-wrap;word-wrap:break-word;margin:0;font-size:11px;line-height:1.5;">' + previewEscapado + '</pre>' +
            '</div>' +
            '<div style="display:flex;flex-wrap:wrap;gap:8px;">' +
                '<button onclick="copiarTextoExportado()" style="flex:1;padding:12px;border-radius:50px;border:none;font-weight:600;cursor:pointer;background:' + primaryColor + ';color:white;min-width:80px;transition:all 0.3s ease;font-size:13px;">📋 Copiar</button>' +
                '<button onclick="compartirExportacion()" style="flex:1;padding:12px;border-radius:50px;border:none;font-weight:600;cursor:pointer;background:' + successColor + ';color:white;min-width:80px;transition:all 0.3s ease;font-size:13px;">📤 Compartir</button>' +
                '<button onclick="eliminarExportacionGuardada()" style="flex:1;padding:12px;border-radius:50px;border:none;font-weight:600;cursor:pointer;background:' + dangerColor + ';color:white;min-width:80px;transition:all 0.3s ease;font-size:13px;">🗑️ Eliminar</button>' +
            '</div>' +
            '<div style="margin-top:12px;text-align:center;font-size:11px;color:' + (isDarkMode ? '#A0AEC0' : '#999') + ';">💡 Los datos están guardados en la memoria interna de la app.</div>' +
        '</div>';
    
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
}

// ========== CERRAR MODAL EXPORTACIÓN ==========

function cerrarModalExportacion() {
    const modal = document.getElementById('modal-ver-exportacion');
    if (modal) modal.remove();
}

// ========== COPIAR TEXTO EXPORTADO ==========

function copiarTextoExportado() {
    const contenido = localStorage.getItem('miPyme_export_backup');
    if (!contenido) {
        mostrarAlerta('No hay datos exportados para copiar', 'info');
        return;
    }
    
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(contenido).then(() => {
            mostrarAlerta('✅ Texto copiado al portapapeles', 'success');
        }).catch(() => {
            copiarTextoAlternativo(contenido);
        });
    } else {
        copiarTextoAlternativo(contenido);
    }
}

function copiarTextoAlternativo(texto) {
    const textarea = document.createElement('textarea');
    textarea.value = texto;
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    textarea.style.top = '-9999px';
    document.body.appendChild(textarea);
    textarea.select();
    try {
        document.execCommand('copy');
        mostrarAlerta('✅ Texto copiado al portapapeles', 'success');
    } catch (e) {
        mostrarAlerta('❌ No se pudo copiar el texto', 'error');
    }
    document.body.removeChild(textarea);
}

// ========== COMPARTIR EXPORTACIÓN ==========

function compartirExportacion() {
    const contenido = localStorage.getItem('miPyme_export_backup');
    const nombre = localStorage.getItem('miPyme_export_nombre') || 'archivo.txt';
    const tipo = localStorage.getItem('miPyme_export_tipo') || 'txt';
    
    if (!contenido) {
        mostrarAlerta('No hay datos exportados para compartir', 'info');
        return;
    }
    
    if (navigator.share) {
        const blob = new Blob([contenido], { 
            type: tipo === 'json' ? 'application/json' : 'text/csv' 
        });
        const file = new File([blob], nombre, { 
            type: tipo === 'json' ? 'application/json' : 'text/csv' 
        });
        
        navigator.share({
            title: 'MiPyme Exportación',
            text: 'Archivo exportado de MiPyme Inventario',
            files: [file]
        }).catch((error) => {
            if (error.name !== 'AbortError') {
                console.error('Error al compartir:', error);
                mostrarAlerta('❌ Error al compartir: ' + error.message, 'error');
            }
        });
    } else {
        mostrarAlerta(
            '📤 Para compartir el archivo:\n\n' +
            '1. Copia el contenido (botón "Copiar")\n' +
            '2. Pega en WhatsApp, correo o cualquier otra app',
            'info'
        );
    }
}

// ========== ELIMINAR EXPORTACIÓN GUARDADA ==========

function eliminarExportacionGuardada() {
    if (!confirm('¿Eliminar el archivo exportado guardado?')) return;
    
    localStorage.removeItem('miPyme_export_backup');
    localStorage.removeItem('miPyme_export_nombre');
    localStorage.removeItem('miPyme_export_tipo');
    localStorage.removeItem('miPyme_export_fecha');
    localStorage.removeItem('miPyme_export_ubicacion');
    
    cerrarModalExportacion();
    
    mostrarAlerta('✅ Archivo exportado eliminado', 'success');
}

// ========== IMPORTAR DATOS ==========

function importarDatos() {
    console.log('📥 Iniciando importación...');
    
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.style.display = 'none';
    document.body.appendChild(input);
    
    input.onchange = async function(e) {
        const file = e.target.files[0];
        if (!file) {
            mostrarAlerta('No se seleccionó ningún archivo', 'info');
            document.body.removeChild(input);
            return;
        }
        
        console.log('📄 Archivo seleccionado:', file.name);
        
        try {
            const reader = new FileReader();
            reader.onload = async function(event) {
                try {
                    const contenido = event.target.result;
                    const datos = JSON.parse(contenido);
                    
                    if (!datos.categorias || !datos.productos || !datos.ventas) {
                        mostrarAlerta('❌ Archivo inválido. No contiene la estructura correcta.', 'error');
                        document.body.removeChild(input);
                        return;
                    }
                    
                    const confirmar = confirm(
                        '⚠️ ¿Importar estos datos?\n\n' +
                        'Categorías: ' + datos.categorias.length + '\n' +
                        'Productos: ' + datos.productos.length + '\n' +
                        'Ventas: ' + datos.ventas.length + '\n\n' +
                        'Los datos actuales serán REEMPLAZADOS.'
                    );
                    
                    if (!confirmar) {
                        document.body.removeChild(input);
                        return;
                    }
                    
                    if (!confirm('⚠️ ¿Estás SEGURO? Esta acción no se puede deshacer.')) {
                        document.body.removeChild(input);
                        return;
                    }
                    
                    await procesarImportacion(datos);
                    document.body.removeChild(input);
                    
                } catch (error) {
                    console.error('❌ Error al procesar archivo:', error);
                    mostrarAlerta('Error al procesar archivo: ' + error.message, 'error');
                    document.body.removeChild(input);
                }
            };
            reader.readAsText(file);
        } catch (error) {
            console.error('❌ Error al leer archivo:', error);
            mostrarAlerta('Error al leer archivo: ' + error.message, 'error');
            document.body.removeChild(input);
        }
    };
    
    input.oncancel = function() {
        console.log('Usuario canceló la selección');
        document.body.removeChild(input);
    };
    
    input.click();
}

// ========== PROCESAR IMPORTACIÓN ==========

async function procesarImportacion(datos) {
    try {
        await db.init();
        
        // 1. Limpiar datos actuales
        console.log('🧹 Limpiando datos actuales...');
        
        const ventasActuales = await db.obtenerVentas();
        for (const v of ventasActuales) {
            await db.eliminarVenta(v.id);
        }
        
        const productosActuales = await db.obtenerProductos();
        for (const p of productosActuales) {
            await db.eliminarProducto(p.id);
        }
        
        const categoriasActuales = await db.obtenerCategorias();
        for (const c of categoriasActuales) {
            await db.eliminarCategoria(c.id);
        }
        
        // 2. Importar categorías
        console.log('📂 Importando categorías...');
        for (const cat of datos.categorias) {
            await db.agregarCategoria(cat.nombre);
        }
        
        const nuevasCategorias = await db.obtenerCategorias();
        console.log('✅ Categorías importadas:', nuevasCategorias.length);
        
        // 3. Importar productos
        console.log('📦 Importando productos...');
        for (const prod of datos.productos) {
            const categoriaOriginal = datos.categorias.find(c => c.id === prod.categoriaId);
            if (!categoriaOriginal) continue;
            
            const nuevaCategoria = nuevasCategorias.find(c => c.nombre === categoriaOriginal.nombre);
            if (!nuevaCategoria) continue;
            
            const nuevoProducto = {
                nombre: prod.nombre,
                categoriaId: nuevaCategoria.id,
                cantidad: prod.cantidad,
                unidad: prod.unidad || 'unidad',
                precioCompra: prod.precioCompra,
                precioVenta: prod.precioVenta,
                imagen: prod.imagen || ''
            };
            await db.agregarProducto(nuevoProducto);
        }
        
        const nuevosProductos = await db.obtenerProductos();
        console.log('✅ Productos importados:', nuevosProductos.length);
        
        // 4. Importar ventas
        console.log('💰 Importando ventas...');
        for (const venta of datos.ventas) {
            const productoOriginal = datos.productos.find(p => p.id === venta.productoId);
            if (!productoOriginal) continue;
            
            const nuevoProducto = nuevosProductos.find(p => p.nombre === productoOriginal.nombre);
            if (!nuevoProducto) continue;
            
            const nuevaVenta = {
                productoId: nuevoProducto.id,
                productoNombre: nuevoProducto.nombre,
                categoriaId: nuevoProducto.categoriaId,
                categoriaNombre: venta.categoriaNombre || 'Sin categoría',
                cantidad: venta.cantidad,
                precioVentaHistorico: venta.precioVentaHistorico,
                precioCompraHistorico: venta.precioCompraHistorico,
                ingresoTotal: venta.ingresoTotal,
                costoTotal: venta.costoTotal,
                gananciaReal: venta.gananciaReal,
                fecha: venta.fecha,
                timestamp: venta.timestamp || new Date().toISOString()
            };
            await db.agregarVenta(nuevaVenta);
        }
        
        const nuevasVentas = await db.obtenerVentas();
        console.log('✅ Ventas importadas:', nuevasVentas.length);
        
        mostrarAlerta('✅ Datos importados correctamente', 'success');
        recargarTodo();
        
    } catch (error) {
        console.error('❌ Error al importar:', error);
        mostrarAlerta('Error al importar: ' + error.message, 'error');
    }
}

// ========== LIMPIAR TODOS LOS DATOS ==========

async function limpiarDatos() {
    if (!confirm('⚠️ ¿Eliminar TODOS los datos de la app?')) return;
    if (!confirm('¿Estás SEGURO? Esta acción no se puede deshacer.')) return;
    
    try {
        await db.init();
        
        const ventas = await db.obtenerVentas();
        for (const v of ventas) {
            await db.eliminarVenta(v.id);
        }
        
        const productos = await db.obtenerProductos();
        for (const p of productos) {
            await db.eliminarProducto(p.id);
        }
        
        const categorias = await db.obtenerCategorias();
        for (const c of categorias) {
            await db.eliminarCategoria(c.id);
        }
        
        // Limpiar exportaciones guardadas
        localStorage.removeItem('miPyme_export_backup');
        localStorage.removeItem('miPyme_export_nombre');
        localStorage.removeItem('miPyme_export_tipo');
        localStorage.removeItem('miPyme_export_fecha');
        localStorage.removeItem('miPyme_export_ubicacion');
        
        mostrarAlerta('✅ Todos los datos eliminados', 'success');
        recargarTodo();
    } catch (error) {
        console.error('Error al limpiar datos:', error);
        mostrarAlerta('Error al limpiar datos: ' + error.message, 'error');
    }
}

function recargarTodo() {
    console.log('🔄 Recargando todo...');
    cargarInventario();
    cargarVentas();
    cargarHistorial();
    cargarConfiguracion();
}

// ========== CARGAR CONFIGURACIÓN ==========

async function cargarConfiguracion() {
    console.log('⚙️ Cargando configuración...');
    await db.init();
    const categorias = await db.obtenerCategorias();
    const container = document.getElementById('lista-categorias-config');
    if (!container) return;
    container.innerHTML = '';
    
    if (categorias.length === 0) {
        container.innerHTML = '<p style="color:#999;text-align:center;padding:20px 0;">No hay categorías</p>';
        return;
    }
    
    for (const cat of categorias.sort((a, b) => a.nombre.localeCompare(b.nombre))) {
        const div = document.createElement('div');
        div.className = 'categoria-config-item';
        div.style.cssText = 'display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid #eee;';
        div.innerHTML = `
            <span>${cat.nombre}</span>
            <div>
                <button onclick="editarCategoria(${cat.id})" class="btn-primary" style="padding:4px 10px;font-size:12px;">✏️</button>
                <button onclick="eliminarCategoria(${cat.id})" class="btn-danger" style="padding:4px 10px;font-size:12px;">🗑️</button>
            </div>
        `;
        container.appendChild(div);
    }
}
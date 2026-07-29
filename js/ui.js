// ============================================
// UI.JS - Funciones de interfaz de usuario
// ============================================

// ========== INICIALIZACIÓN ==========

document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Inicializando UI...');
    
    db.init().then(function() {
        console.log('✅ DB lista para usar');
        
        cargarPreferenciaModo();
        cargarNombreNegocio();
        cargarTema();
        configurarNavegacion();
        cargarInventario();
        cargarConfiguracion();
    }).catch(function(error) {
        console.error('❌ Error al inicializar DB:', error);
        alert('Error al inicializar la base de datos. Recarga la página.');
    });
});

function configurarNavegacion() {
    document.querySelectorAll('.nav-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.nav-btn').forEach(function(b) {
                b.classList.remove('active');
            });
            this.classList.add('active');
            
            document.querySelectorAll('.tab-content').forEach(function(c) {
                c.classList.remove('active');
            });
            document.getElementById(this.dataset.tab).classList.add('active');
            
            const tab = this.dataset.tab;
            console.log('📱 Cambiando a pestaña:', tab);
            
            if (tab === 'inventario') {
                cargarInventario();
            } else if (tab === 'ventas') {
                cargarVentas();
                setTimeout(function() {
                    actualizarCarrito();
                    console.log('🔄 Carrito actualizado en navegación');
                }, 500);
            } else if (tab === 'historial') {
                cargarHistorial();
            } else if (tab === 'configuracion') {
                cargarNombreNegocioInput();
                actualizarBotonTema();
                cargarConfiguracion();
            }
        });
    });
}

// ========== MODALES ==========

function cerrarModal() {
    document.querySelectorAll('.modal').forEach(function(m) {
        m.classList.remove('show');
    });
}

function mostrarModal(id) {
    const modal = document.getElementById(id);
    if (modal) modal.classList.add('show');
}

function formatearFecha(fecha) {
    const d = new Date(fecha);
    return d.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}

document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') cerrarModal();
});

document.addEventListener('click', function(e) {
    if (e.target.classList.contains('modal')) cerrarModal();
});

// ========== MODO OSCURO ==========

function toggleDarkMode() {
    const isDark = document.getElementById('darkModeToggle').checked;
    
    if (isDark) {
        document.body.classList.add('dark-mode');
        document.getElementById('modo-texto').textContent = 'Activado 🌙';
    } else {
        document.body.classList.remove('dark-mode');
        document.getElementById('modo-texto').textContent = 'Desactivado ☀️';
    }
    
    localStorage.setItem('darkMode', isDark ? 'true' : 'false');
    console.log('🌓 Modo oscuro:', isDark ? 'Activado' : 'Desactivado');
}

function cargarPreferenciaModo() {
    const isDark = localStorage.getItem('darkMode') === 'true';
    const toggle = document.getElementById('darkModeToggle');
    
    if (toggle) {
        toggle.checked = isDark;
    }
    
    if (isDark) {
        document.body.classList.add('dark-mode');
        document.getElementById('modo-texto').textContent = 'Activado 🌙';
    } else {
        document.body.classList.remove('dark-mode');
        document.getElementById('modo-texto').textContent = 'Desactivado ☀️';
    }
    
    console.log('🌓 Modo oscuro cargado:', isDark ? 'Activado' : 'Desactivado');
}

// ========== NOMBRE DEL NEGOCIO ==========

function cargarNombreNegocio() {
    const nombreGuardado = localStorage.getItem('nombreNegocio');
    const titulo = document.querySelector('.nav-header h1');
    
    if (titulo) {
        if (nombreGuardado && nombreGuardado.trim() !== '') {
            titulo.textContent = '🏪 ' + nombreGuardado.trim();
            console.log('🏪 Nombre cargado:', nombreGuardado);
        } else {
            titulo.textContent = '🏪 MiPyme';
            console.log('🏪 Nombre cargado: MiPyme (defecto)');
        }
    }
}

function cargarNombreNegocioInput() {
    const nombreGuardado = localStorage.getItem('nombreNegocio');
    const input = document.getElementById('nombre-negocio');
    
    if (input) {
        if (nombreGuardado && nombreGuardado.trim() !== '') {
            input.value = nombreGuardado.trim();
        } else {
            input.value = '';
        }
    }
}

function guardarNombreNegocio() {
    const input = document.getElementById('nombre-negocio');
    if (!input) {
        console.error('❌ Input de nombre no encontrado');
        return;
    }
    
    const nuevoNombre = input.value.trim();
    
    if (nuevoNombre === '') {
        localStorage.removeItem('nombreNegocio');
        cargarNombreNegocio();
        alert('✅ Nombre restaurado a "MiPyme"');
        console.log('🏪 Nombre restaurado a MiPyme');
    } else {
        localStorage.setItem('nombreNegocio', nuevoNombre);
        cargarNombreNegocio();
        alert('✅ Nombre actualizado a: "' + nuevoNombre + '"');
        console.log('🏪 Nombre guardado:', nuevoNombre);
    }
}

function resetearNombreNegocio() {
    if (confirm('¿Restaurar el nombre por defecto "MiPyme"?')) {
        localStorage.removeItem('nombreNegocio');
        const input = document.getElementById('nombre-negocio');
        if (input) input.value = '';
        cargarNombreNegocio();
        alert('✅ Nombre restaurado a "MiPyme"');
        console.log('🏪 Nombre restaurado');
    }
}

// ========== TEMAS DE APARIENCIA ==========

const nombresTemas = {
    'servicios': 'Servicios 🏢',
    'salud': 'Salud 💚',
    'gastronomia': 'Gastronomía ☕',
    'tecnologia': 'Tecnología 💻',
    'ferreteria': 'Ferretería 🔧',
    'clasico': 'Clásico ⭐'
};

function aplicarTema(tema) {
    console.log('🎨 Aplicando tema:', tema);
    
    document.documentElement.removeAttribute('data-theme');
    document.documentElement.setAttribute('data-theme', tema);
    localStorage.setItem('temaApp', tema);
    
    const temaTexto = document.getElementById('tema-actual-texto');
    if (temaTexto) {
        temaTexto.textContent = nombresTemas[tema] || 'Clásico ⭐';
    }
    
    actualizarBotonTema();
    console.log('🎨 Tema aplicado:', tema);
}

function cargarTema() {
    const temaGuardado = localStorage.getItem('temaApp');
    console.log('🎨 Tema guardado:', temaGuardado);
    
    if (temaGuardado && temaGuardado !== 'clasico') {
        document.documentElement.setAttribute('data-theme', temaGuardado);
        const temaTexto = document.getElementById('tema-actual-texto');
        if (temaTexto) {
            temaTexto.textContent = nombresTemas[temaGuardado] || 'Clásico ⭐';
        }
        actualizarBotonTema();
        console.log('🎨 Tema cargado:', temaGuardado);
    } else {
        document.documentElement.setAttribute('data-theme', 'clasico');
        const temaTexto = document.getElementById('tema-actual-texto');
        if (temaTexto) {
            temaTexto.textContent = 'Clásico ⭐';
        }
        actualizarBotonTema();
        console.log('🎨 Tema cargado: Clásico (defecto)');
    }
}

function actualizarBotonTema() {
    const temaActual = document.documentElement.getAttribute('data-theme') || 'clasico';
    const botones = document.querySelectorAll('.btn-tema');
    
    botones.forEach(function(btn) {
        const tema = btn.getAttribute('data-tema');
        if (tema === temaActual) {
            btn.style.borderColor = 'white';
            btn.style.boxShadow = '0 0 0 3px ' + getComputedStyle(document.documentElement).getPropertyValue('--color-primary').trim();
            btn.style.transform = 'scale(1.05)';
        } else {
            btn.style.borderColor = 'transparent';
            btn.style.boxShadow = 'none';
            btn.style.transform = 'scale(1)';
        }
    });
}

// ========== RECARGAR TODO ==========

function recargarTodo() {
    console.log('🔄 Recargando todo...');
    cargarInventario();
    cargarVentas();
    cargarHistorial();
    cargarConfiguracion();
}
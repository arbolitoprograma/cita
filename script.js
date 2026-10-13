
const botonCorrelon = document.getElementById('btn-no');
const botonSi = document.getElementById('btn-si');


let currentX = 0;
let currentY = 0;
let lastMoveTime = 0;


const COOLDOWN_MS = 220;     
const UMBRAL = 120;          
const FLEE_DISTANCE = 170;   
const PADDING = 24;          

let lastMouseX = null;
let lastMouseY = null;

function huirDelMouse(mouseX, mouseY) {
    if (!botonCorrelon) return;

    lastMouseX = mouseX;
    lastMouseY = mouseY;

    const now = Date.now();
    if (now - lastMoveTime < COOLDOWN_MS) return;

    const rect = botonCorrelon.getBoundingClientRect();
    const btnWidth = rect.width;
    const btnHeight = rect.height;

  
    const centerX = rect.left + btnWidth / 2;
    const centerY = rect.top + btnHeight / 2;

    const dx = centerX - mouseX;
    const dy = centerY - mouseY;
    const dist = Math.hypot(dx, dy);

    if (dist > UMBRAL) return;

    lastMoveTime = now;

    const untranslatedLeft = rect.left - currentX;
    const untranslatedTop = rect.top - currentY;

    const minLeft = PADDING;
    const maxLeft = Math.max(minLeft, window.innerWidth - btnWidth - PADDING);
    const minTop = PADDING;
    const maxTop = Math.max(minTop, window.innerHeight - btnHeight - PADDING);

  
    let baseAngle = (dist === 0)
        ? Math.random() * Math.PI * 2
        : Math.atan2(dy, dx);

    
    baseAngle += (Math.random() - 0.5) * 0.7;

   
    const angleOffsets = [0, 0.45, -0.45, 0.9, -0.9, 1.4, -1.4, Math.PI];
    let bestX = null;
    let bestY = null;
    let maxDistFound = -1;

    for (const offset of angleOffsets) {
        const testAngle = baseAngle + offset;
        const targetLeft = rect.left + Math.cos(testAngle) * FLEE_DISTANCE;
        const targetTop = rect.top + Math.sin(testAngle) * FLEE_DISTANCE;

        
        if (targetLeft >= minLeft && targetLeft <= maxLeft &&
            targetTop >= minTop && targetTop <= maxTop) {
            
            const targetCenterX = targetLeft + btnWidth / 2;
            const targetCenterY = targetTop + btnHeight / 2;
            const targetDist = Math.hypot(targetCenterX - mouseX, targetCenterY - mouseY);

            if (targetDist > maxDistFound) {
                maxDistFound = targetDist;
                bestX = targetLeft - untranslatedLeft;
                bestY = targetTop - untranslatedTop;

             
                if (targetDist > UMBRAL + 60) break;
            }
        }
    }

   
    if (bestX === null) {
        const targetLeft = mouseX < window.innerWidth / 2
            ? window.innerWidth * 0.65 + (Math.random() * 80)
            : window.innerWidth * 0.2 + (Math.random() * 80);
        const targetTop = mouseY < window.innerHeight / 2
            ? window.innerHeight * 0.65 + (Math.random() * 60)
            : window.innerHeight * 0.25 + (Math.random() * 60);

        const clampedLeft = Math.max(minLeft, Math.min(maxLeft, targetLeft));
        const clampedTop = Math.max(minTop, Math.min(maxTop, targetTop));

        bestX = clampedLeft - untranslatedLeft;
        bestY = clampedTop - untranslatedTop;
    }

    currentX = bestX;
    currentY = bestY;

   
    botonCorrelon.style.transform = `translate(${currentX}px, ${currentY}px)`;

    
    setTimeout(() => {
        if (lastMouseX !== null && lastMouseY !== null && botonCorrelon) {
            const newRect = botonCorrelon.getBoundingClientRect();
            const newDist = Math.hypot(
                (newRect.left + newRect.width / 2) - lastMouseX,
                (newRect.top + newRect.height / 2) - lastMouseY
            );
            if (newDist < UMBRAL) {
                huirDelMouse(lastMouseX, lastMouseY);
            }
        }
    }, 280);
}


document.addEventListener('mousemove', (e) => {
    huirDelMouse(e.clientX, e.clientY);
});

// Eventos específicos para el botón que huye (si existe en la página actual)
if (botonCorrelon) {
    botonCorrelon.addEventListener('mouseenter', (e) => {
        huirDelMouse(e.clientX, e.clientY);
    });

    // Soporte para pantallas táctiles (móvil y tablet)
    botonCorrelon.addEventListener('touchstart', (e) => {
        e.preventDefault();
        if (e.touches && e.touches[0]) {
            huirDelMouse(e.touches[0].clientX, e.touches[0].clientY);
        } else {
            const rect = botonCorrelon.getBoundingClientRect();
            huirDelMouse(rect.left + rect.width / 2, rect.top + rect.height / 2);
        }
    }, { passive: false });

    // Si intentan hacer clic (por ejemplo, con tabulador y teclado)
    botonCorrelon.addEventListener('click', (e) => {
        e.preventDefault();
        huirDelMouse(e.clientX || (window.innerWidth / 2), e.clientY || (window.innerHeight / 2));
    });
}

window.addEventListener('resize', () => {
    if (!botonCorrelon) return;
    const rect = botonCorrelon.getBoundingClientRect();
    const untranslatedLeft = rect.left - currentX;
    const untranslatedTop = rect.top - currentY;

    const minLeft = PADDING;
    const maxLeft = Math.max(minLeft, window.innerWidth - rect.width - PADDING);
    const minTop = PADDING;
    const maxTop = Math.max(minTop, window.innerHeight - rect.height - PADDING);

    const clampedTargetLeft = Math.max(minLeft, Math.min(maxLeft, rect.left));
    const clampedTargetTop = Math.max(minTop, Math.min(maxTop, rect.top));

    currentX = clampedTargetLeft - untranslatedLeft;
    currentY = clampedTargetTop - untranslatedTop;

    botonCorrelon.style.transform = `translate(${currentX}px, ${currentY}px)`;
});

if (botonSi) {
    botonSi.addEventListener("click", function() {
        window.location.href = "./pagina2.html";
    });
}

// Botones de opciones en pagina2.html
const botonesActividad = document.querySelectorAll('#btn-cine, #btn-comer, #btn-prado, #btn-cocino');
if (botonesActividad.length > 0) {
    botonesActividad.forEach(boton => {
        boton.addEventListener('click', () => {
            const span = boton.querySelector('span');
            const textoActividad = span ? span.textContent.trim() : boton.textContent.trim();
            localStorage.setItem('actividadSeleccionada', textoActividad);
            window.location.href = `./fechas.html?actividad=${encodeURIComponent(textoActividad)}`;
        });
    });
}

// =============================================
// LÓGICA DE FECHAS (fechas.html)
// =============================================
const inputFecha = document.getElementById('fecha-evento');
const btnMandar = document.getElementById('btn-mandar');
const badgePlanTexto = document.getElementById('plan-texto');

if (inputFecha && btnMandar) {
    // Obtener la actividad guardada de la URL o localStorage
    const urlParams = new URLSearchParams(window.location.search);
    const actividadGuardada = urlParams.get('actividad') || 
                              localStorage.getItem('actividadSeleccionada') || 
                              'Una cita especial ✨';

    // Mostrar el plan en la tarjeta principal
    if (badgePlanTexto) {
        badgePlanTexto.textContent = actividadGuardada;
    }

    // Asegurar que la fecha mínima sea hoy si no está fijada
    const hoy = new Date().toISOString().split('T')[0];
    if (!inputFecha.getAttribute('min')) {
        inputFecha.min = hoy;
    }

    // El botón sólo sirve si hay una fecha seleccionada
    const validarFecha = () => {
        if (inputFecha.value && inputFecha.value.trim() !== '') {
            btnMandar.disabled = false;
        } else {
            btnMandar.disabled = true;
        }
    };

    inputFecha.addEventListener('input', validarFecha);
    inputFecha.addEventListener('change', validarFecha);
    validarFecha(); // Comprobación inicial al cargar

    // Al hacer clic en Mandar
    btnMandar.addEventListener('click', (e) => {
        e.preventDefault();
        const valorFecha = inputFecha.value;
        if (!valorFecha) return;

        // Formatear la fecha amigablemente (ej. Sábado, 17 de octubre de 2026)
        let fechaFormateada = valorFecha;
        const partes = valorFecha.split('-');
        if (partes.length === 3) {
            const anio = parseInt(partes[0], 10);
            const mes = parseInt(partes[1], 10) - 1;
            const dia = parseInt(partes[2], 10);
            const fechaObj = new Date(anio, mes, dia);
            const opciones = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
            const textoFecha = fechaObj.toLocaleDateString('es-ES', opciones);
            fechaFormateada = textoFecha.charAt(0).toUpperCase() + textoFecha.slice(1);
        }

        // Estado de carga en el botón
        const textoOriginalBtn = btnMandar.innerHTML;
        btnMandar.disabled = true;
        btnMandar.innerHTML = '<span>Enviando... ⏳</span>';

        // ── Enviar a FastAPI ──────────────────────────────────────
        fetch('http://127.0.0.1:8000/api/guardar-cita', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                plan: actividadGuardada,
                fecha: valorFecha   // YYYY-MM-DD que MySQL entiende
            })
        })
        .then(res => {
            if (!res.ok) return res.json().then(err => { throw new Error(err.detail || 'Error del servidor'); });
            return res.json();
        })
        .then(data => {
            console.log(' Guardado en BD:', data);
            mostrarTarjetica(actividadGuardada, fechaFormateada, valorFecha, true, data.id);
        })
        .catch(err => {
            console.warn('⚠️ No se pudo guardar en BD:', err.message);
            // Muestra la tarjetica igual pero sin confirmación de BD
            mostrarTarjetica(actividadGuardada, fechaFormateada, valorFecha, false, null);
        })
        .finally(() => {
            btnMandar.innerHTML = textoOriginalBtn;
            // El botón queda desactivado para evitar doble envío
        });
    });
}


function mostrarTarjetica(plan, fechaFormateada, fechaRaw, guardadoEnBD, idBD) {
    const contenedor = document.querySelector('.pagina') || document.body;
    let tarjetica = document.getElementById('tarjetica-datos');

    if (!tarjetica) {
        tarjetica = document.createElement('section');
        tarjetica.id = 'tarjetica-datos';
        tarjetica.className = 'tarjetica-resultado';
        contenedor.appendChild(tarjetica);
    }

    const badgeDB = guardadoEnBD
        ? `<p class="resultado-badge-bd ok"> Guardado en la base de datos${idBD ? ` <span style="opacity:0.6;font-size:0.8rem">(ID: ${idBD})</span>` : ''}</p>`
        : `<p class="resultado-badge-bd error">⚠️ Cita mostrada, pero no se pudo guardar en BD. ¿El servidor está corriendo?</p>`;

    tarjetica.innerHTML = `
        <div class="resultado-icono"></div>
        <h2 class="resultado-titulo">¡Cita Confirmada!</h2>
        <div class="resultado-caja">
            <div class="resultado-fila">
                <span class="resultado-etiqueta">Plan seleccionado:</span>
                <span class="resultado-valor">${plan}</span>
            </div>
            <div class="resultado-fila">
                <span class="resultado-etiqueta">Fecha elegida:</span>
                <span class="resultado-valor"> ${fechaFormateada}</span>
            </div>
        </div>
        ${badgeDB}
        
    `;

    setTimeout(() => {
        tarjetica.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 80);
}
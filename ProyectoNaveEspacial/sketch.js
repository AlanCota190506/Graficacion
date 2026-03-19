/**
 * PROYECTO INTEGRADOR — UNIDAD 2
 * Graficación 2D con p5.js
 * Escena Espacial Interactiva: Nave, Cometas, Nebulosa y Satélite Fractal
 * * Autor: Cota Estrada Alan Daniel
 * Curso: GRAFICACION - Ingeniería en Sistemas Computacionales
 * Docente: Dr. Juan Gabriel Loaiza
 */

// === VARIABLES GLOBALES ===

// A) Variables para Transformaciones de la NAVE
let navePos;      // Posición (pVector)
let naveEscala = 1.0;
let naveAngulo = 0; // En radianes
let naveShearX = 0;
let arrastrandoNave = false;
let offsetMouseNave; // Para arrastrar suavemente

// B) Variables para la CURVA (Nebulosa)
let cpViento; // Punto de control central de Bézier (interactivo)

// C) Variables para el FRACTAL (Satélite Modular)
let fractalProfundidad = 5;
let fractalAngulo = 0.52; // PI/6 aprox
let sliderProf, sliderAng; // Sliders GUI

// D) Variables para Ambiente (Estrellas y Cometas)
let estrellas = [];
let numEstrellas = 100;
let cometas = [];
let numCometas = 4;

function setup() {
  // Crear canvas y colocarlo en el contenedor HTML
  let canvas = createCanvas(800, 600);
  canvas.parent('canvas-container');
  
  // Inicializar estado
  navePos = createVector(width * 0.4, height * 0.5); // Nave más centrada
  cpViento = createVector(width * 0.5, height * 0.3); // Punto control nebulosa inicial
  offsetMouseNave = createVector(0, 0);

  // Crear Sliders para el Fractal (UI básica de p5)
  // createSlider(min, max, valorInicial, paso)
  createDiv('CONTROLES SATÉLITE:').position(width + 20, 10).style('color', 'white');
  
  createSpan('Módulos: ').position(width + 20, 40).style('color', 'white');
  sliderProf = createSlider(0, 7, fractalProfundidad, 1);
  sliderProf.position(width + 120, 40);
  sliderProf.style('width', '80px');

  createSpan('Ángulo Antena: ').position(width + 20, 70).style('color', 'white');
  sliderAng = createSlider(0, PI/2, fractalAngulo, 0.01);
  sliderAng.position(width + 120, 70);
  sliderAng.style('width', '80px');

  // Inicializar Estrellas (Fondo fijo)
  for (let i = 0; i < numEstrellas; i++) {
    estrellas.push({
      x: random(width),
      y: random(height),
      s: random(0.5, 2.5) // Tamaño variable
    });
  }

  // Inicializar Cometas
  for (let i = 0; i < numCometas; i++) {
    cometas.push(crearCometa());
  }

  rectMode(CENTER); // Dibujar rectángulos desde el centro
  angleMode(RADIANS); // Asegurar uso de radianes
}

function draw() {
  // Espacio profundo (Azul muy oscuro)
  background(5, 5, 20); 

  // --- Dibujar elementos estáticos/fondo ---
  dibujarEstrellas();
  actualizarY_DibujarCometas(); // NUEVO: Animación automática de cometas
  dibujarSuperficieLunar();
  
  // --- D) TEXTO 2D (Instrucciones, Título y Nombre) ---
  dibujarInterfazTexto();

  // --- B) CURVAS (Nebulosa Magnética Interactiva) ---
  dibujarNebulosaInteractiva();

  // --- C) FRACTAL RECURSIVO (Satélite Modular Espacial) ---
  // Actualizar valores desde sliders
  fractalProfundidad = sliderProf.value();
  fractalAngulo = sliderAng.value();
  
  push();
  // Posición base del satélite (arriba a la derecha)
  translate(width * 0.82, height * 0.2); 
  // Rotación lenta automática para darle vida
  rotate(frameCount * 0.01); 
  dibujarSateliteFractal(50, fractalProfundidad); // Llamada recursiva (mínimo nivel 4)
  pop();

  // --- A) TRANSFORMACIONES 2D (Objeto Nave Principal) ---
  aplicarTransformacionesNave();
  dibujarNaveEspacial();
  pop(); // Cierra el push de aplicarTransformacionesNave
}

// --- FUNCIONES DE APOYO Y ANIMACIÓN (AMBIENTE) ---

function dibujarEstrellas() {
  fill(255); noStroke();
  for (let e of estrellas) {
    // Parpadeo sutil aleatorio usando sin()
    if (random(1) > 0.98) fill(255, 255, 150); else fill(255);
    ellipse(e.x, e.y, e.s);
  }
}

function crearCometa() {
  return {
    x: random(width, width * 1.5), // Empiezan fuera de la pantalla a la derecha
    y: random(0, height * 0.6),    // Solo en la mitad superior
    vel: random(3, 8),
    tam: random(2, 6)
  };
}

function actualizarY_DibujarCometas() {
  for (let c of cometas) {
    // Dibujar estela (cola del cometa) - Larga y suave
    for (let i = 0; i < 15; i++) {
      let alpha = map(i, 0, 15, 200, 0); // Desvanecimiento
      stroke(255, 255, 200, alpha);
      strokeWeight(map(i, 0, 15, c.tam, 0)); // Adelgazamiento
      line(c.x + i * 8, c.y, c.x + (i + 1) * 8, c.y);
    }
    // Cabeza del cometa
    fill(255); noStroke();
    ellipse(c.x, c.y, c.tam);

    // Movimiento hacia la izquierda
    c.x -= c.vel;
    // Si sale por la izquierda, reaparece a la derecha
    if (c.x < -150) {
      // Re-asignar valores nuevos aleatorios
      Object.assign(c, crearCometa());
    }
  }
}

function dibujarSuperficieLunar() {
  noStroke();
  fill(50, 50, 55); // Gris lunar
  rectMode(CORNER);
  rect(0, height * 0.88, width, height * 0.12);
  
  // Cráteres
  fill(70); ellipse(150, height - 30, 80, 20);
  ellipse(550, height - 20, 120, 30);
  ellipse(750, height - 45, 50, 15);
  rectMode(CENTER); // Restaurar
}

// ==========================================
// SECCIÓN A: TRANSFORMACIONES (NAVE)
// ==========================================

function aplicarTransformacionesNave() {
  push(); // Aislar estado de matriz
  
  // 1. TRASLACIÓN (Mover el pivote al centro de la nave)
  translate(navePos.x, navePos.y);
  
  // IMPORTANTE: El orden de las transformaciones importa (TRS).
  
  // 3. ROTACIÓN (Alrededor del punto trasladado)
  rotate(naveAngulo);
  
  // 2. ESCALAMIENTO Uniforme
  scale(naveEscala);
  
  // 4. SHEAR (Sesgado en X)
  shearX(naveShearX);
}

function dibujarNaveEspacial() {
  // Dibujamos relativo al centro (0,0) definido por TRS anterior
  stroke(0);
  strokeWeight(2);

  // Fuego de los propulsores (Animación simple con sin())
  noStroke();
  fill(255, 100, 0); // Naranja
  let llamaMain = sin(frameCount * 0.6) * 10;
  let llamaSide = sin(frameCount * 0.6 + 2) * 5;
  ellipse(-20, 45, 15, 30 + llamaMain); // Llama izquierda
  ellipse(20, 45, 15, 30 + llamaMain); // Llama derecha
  fill(255, 200, 0); // Amarillo (centro llama)
  ellipse(-20, 42, 8, 20 + llamaMain);
  ellipse(20, 42, 8, 20 + llamaMain);

  // --- Cuerpo Central (Fusilaje) ---
  stroke(0); fill(180); // Gris metálico
  rect(0, 0, 60, 90, 10); // x, y, ancho, alto, radio_borde
  
  // Punta (Triángulo superior)
  fill(220, 20, 60); // Carmesí
  triangle(-30, -45, 30, -45, 0, -90);

  // --- Alas (Aletas Laterales) ---
  fill(100, 100, 120);
  triangle(-30, 0, -30, 45, -60, 45); // Ala Izquierda
  triangle(30, 0, 30, 45, 60, 45); // Ala Derecha

  // --- Cabina (Ventana) ---
  fill(0, 150, 255, 200); // Azul semi-transparente
  // Usamos un arco para la ventana
  arc(0, -25, 30, 40, PI, TWO_PI);
  
  // Luz de navegación (Titilante con frameCount)
  if (frameCount % 40 < 20) {
    fill(255, 0, 0); // Rojo brillante
  } else {
    fill(80, 0, 0); // Rojo apagado
  }
  noStroke();
  ellipse(0, -75, 8, 8);
  
  // Feedback visual si se está arrastrando
  if (arrastrandoNave) {
    noFill(); stroke(0, 255, 255, 150); strokeWeight(1);
    ellipse(0, -10, 140, 180); // Círculo de selección
  }
}

// ==========================================
// SECCIÓN B: CURVAS (NEBULOSA BÉZIER)
// ==========================================

function dibujarNebulosaInteractiva() {
  // Puntos fijos de inicio y fin de la ráfaga
  let start = createVector(0, height * 0.2);
  let end = createVector(width, height * 0.1);
  // Punto de control 2 (CP2) oscila automáticamente para dar movimiento
  let cp2 = createVector(width * 0.75, height * 0.4 + sin(frameCount * 0.02) * 60);

  noFill();
  strokeWeight(6);
  
  // Dibujar curva Bézier (Nebulosa) - bezier(start, cp1, cp2, end)
  // Brillo externo
  stroke(100, 0, 255, 50); // Morado suave
  bezier(start.x, start.y, cpViento.x, cpViento.y, cp2.x, cp2.y, end.x, end.y);
  // Núcleo brillante
  strokeWeight(3);
  stroke(150, 255, 255, 180); // Cian brillante
  bezier(start.x, start.y, cpViento.x, cpViento.y, cp2.x, cp2.y, end.x, end.y);

  // --- Interacción y Visualización del Punto de Control (CP1) ---
  // Dibujar punto de control interactivo (Círculo cian movible)
  fill(0, 255, 255); noStroke();
  ellipse(cpViento.x, cpViento.y, 12, 12);
  
  // Feedback visual al pasar el mouse cerca
  if (dist(mouseX, mouseY, cpViento.x, cpViento.y) < 20) {
    fill(0, 255, 255, 100);
    ellipse(cpViento.x, cpViento.y, 25, 25);
  }
}

// ==========================================
// SECCIÓN C: FRACTAL (SATÉLITE MODULAR)
// ==========================================

/**
 * Función Recursiva para dibujar un satélite modular.
 * Representa una estación modular alienígena.
 * @param {number} len - Longitud de la rama/módulo actual
 * @param {number} depth - Nivel de recursión restante (Mínimo 4)
 */
function dibujarSateliteFractal(len, depth) {
  // Condición de parada (Base case)
  if (depth === 0 || len < 3) {
    // Dibujar una "antena" o "panel solar" en la punta
    fill(0, 200, 255, 180); noStroke();
    rect(0, 0, 4, 15); // Panel pequeño
    fill(255); ellipse(0, -5, 3, 3); // Punta de antena
    return;
  }

  // Estilo de la rama (Módulo)
  // Grosor y color dependen de la profundidad
  stroke(180, 220, 255); // Azul metálico claro
  strokeWeight(map(depth, 0, 7, 1, 4));
  
  // Dibujar módulo central (rectángulo largo)
  rectMode(CENTER);
  noFill(); fill(50, 50, 80, 100); // Relleno azulado
  rect(0, -len/2, len/4, len, 3); // Módulo estructural
  
  // Moverse al final de la rama dibujada para las siguientes
  translate(0, -len);

  // Factor de escala (cada módulo es 0.72 del anterior)
  let newLen = len * 0.72;

  // --- RECURSIÓN (Bifurcación simétrica) ---
  
  // Módulo / Antena Derecha
  push();
  rotate(fractalAngulo); // Rotar ángulo positivo
  line(0, 0, 0, -newLen/2); // Conector
  translate(0, -newLen/2);
  dibujarSateliteFractal(newLen, depth - 1); // Llamada recursiva
  pop();

  // Módulo / Antena Izquierda
  push();
  rotate(-fractalAngulo); // Rotar ángulo negativo
  line(0, 0, 0, -newLen/2); // Conector
  translate(0, -newLen/2);
  dibujarSateliteFractal(newLen, depth - 1); // Llamada recursiva
  pop();
}

// ==========================================
// SECCIÓN D: INTERFAZ Y TEXTO (ALAN)
// ==========================================

function dibujarInterfazTexto() {
  fill(255); noStroke();
  
  // 1. Título del proyecto
  textSize(18); textStyle(BOLD);
  text("EXPLORADOR COSMOS - MISIÓN ALAN", 20, 35);
  
  // 2. Instrucciones detalladas
  textSize(12); textStyle(NORMAL);
  let instruc = "CONTROLES:\n" +
                "• Nave: Arrastrar Mouse | Rueda MOUSE: Escala.\n" +
                "       Rotar: Teclas 'R'/'E' | Shear (Sesgar): Teclas 'A'/'D'.\n" +
                "• Nebulosa: Arrastra el punto CELESTE con el MOUSE.\n" +
                "• Satélite Fractal: Usa los Sliders laterales.";
  text(instruc, 20, 60);
  
  // 3. Nombre del autor (Cota Estrada Alan Daniel)
  push();
  fill(0, 255, 255); // Cian brillante para resaltar
  textSize(14); textStyle(BOLD);
  text("Autor: Cota Estrada Alan Daniel", 20, height - 30);
  // Texto rotado (opcional requerido)
  translate(width - 60, height * 0.5);
  rotate(HALF_PI);
  fill(150); textSize(10); textStyle(NORMAL);
  text("Ingeniería en Sistemas 2026", 0, 0);
  pop();
}

// ==========================================
// INTERACCIÓN (MOUSE Y TECLADO)
// ==========================================

// --- MOUSE ---

function mousePressed() {
  // 1. Check interactivo Curva Nebulosa (CP1 celeste)
  if (dist(mouseX, mouseY, cpViento.x, cpViento.y) < 25) {
    // Si cliqueas cerca, no hacemos nada especial, mouseDragged se encarga
    return; 
  }

  // 2. Check interactivo Nave (A) Traslación)
  // Calculamos límites aproximados de la nave
  let d = dist(mouseX, mouseY, navePos.x, navePos.y);
  if (d < 65 * naveEscala) {
    arrastrandoNave = true;
    // Calcular offset para que no salte el centro al mouse
    offsetMouseNave.x = navePos.x - mouseX;
    offsetMouseNave.y = navePos.y - mouseY;
  }
}

function mouseDragged() {
  // Mover punto de control de la curva Nebulosa
  if (dist(mouseX, mouseY, cpViento.x, cpViento.y) < 50 && !arrastrandoNave) {
    cpViento.x = mouseX;
    cpViento.y = mouseY;
  }
  
  // A) Mover Nave (Traslación)
  if (arrastrandoNave) {
    navePos.x = mouseX + offsetMouseNave.x;
    navePos.y = mouseY + offsetMouseNave.y;
  }
}

function mouseReleased() {
  arrastrandoNave = false;
}

// A) ESCALAMIENTO Uniforme con Rueda del Mouse
function mouseWheel(event) {
  // Solo escalar si el mouse está cerca de la nave
  if (dist(mouseX, mouseY, navePos.x, navePos.y) < 120) {
    // event.delta es positivo scroll abajo (achicar), negativo arriba (agrandar)
    naveEscala -= event.delta * 0.001;
    // Limitar escala (constrain)
    naveEscala = constrain(naveEscala, 0.3, 3.5);
    // Bloquear scroll de la página web para que no se mueva el fondo
    return false;
  }
}

// --- TECLADO ---

function keyPressed() {
  let stepAng = 0.1; // radianes (aprox 5.7 grados)
  let stepShear = 0.05;

  // A) ROTACIÓN (Teclas R y E)
  if (key === 'r' || key === 'R') {
    naveAngulo += stepAng;
  }
  if (key === 'e' || key === 'E') {
    naveAngulo -= stepAng;
  }

  // A) SHEAR (Sesgado) (Teclas A y D)
  if (key === 'a' || key === 'A') {
    naveShearX -= stepShear;
  }
  if (key === 'd' || key === 'D') {
    naveShearX += stepShear;
  }
  
  // Limitar Shear para que no se deforme demasiado
  naveShearX = constrain(naveShearX, -1.2, 1.2);
}
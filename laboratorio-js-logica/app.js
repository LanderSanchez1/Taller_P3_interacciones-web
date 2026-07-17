// Global historial de estudiantes
const historial = [];

// Umbrales
const UMBRAL_APROBADO = 14;
const UMBRAL_RECUP = 10;

// Helpers
const getNotas = () => [
	parseFloat(document.getElementById('nota1').value) || 0,
	parseFloat(document.getElementById('nota2').value) || 0,
	parseFloat(document.getElementById('nota3').value) || 0,
	parseFloat(document.getElementById('nota4').value) || 0,
];

const promedio = notas => notas.reduce((a,b)=>a+b,0)/notas.length;
const notaMayor = notas => Math.max(...notas);
const notaMenor = notas => Math.min(...notas);
const promedioSinMenor = notas => {
	if (notas.length <=1) return promedio(notas);
	const min = notaMenor(notas);
	const restantes = notas.slice();
	const idx = restantes.indexOf(min);
	if (idx !== -1) restantes.splice(idx,1);
	return promedio(restantes);
};

const contarEstadosNotas = notas => {
	let aprob=0, rec=0, rep=0;
	notas.forEach(n=>{
		if (n >= UMBRAL_APROBADO) aprob++;
		else if (n >= UMBRAL_RECUP) rec++;
		else rep++;
	});
	return {aprob, rec, rep};
};

const clasificarRendimiento = prom => {
	if (prom >= 18) return 'Alto';
	if (prom >= 14) return 'Medio';
	if (prom >= 10) return 'Básico';
	return 'Bajo';
};

const recomendacionPorPromedio = prom => {
	if (prom >= 18) return 'Mantener el desempeño y apoyar a compañeros.';
	if (prom >= 14) return 'Reforzar temas específicos.';
	if (prom >= 10) return 'Asistir a tutorías y practicar ejercicios.';
	return 'Repetir contenidos base y solicitar acompañamiento.';
};

const calcularBeca = (carrera, prom) => {
	if (!carrera) return {porcentaje:0, clase:'secondary', texto:'Sin beca'};
	if (carrera === 'TI' && prom > 18) return {porcentaje:100, clase:'success', texto:'Beca 100%'};
	if (carrera === 'Software' && prom > 17) return {porcentaje:80, clase:'primary', texto:'Beca 80%'};
	if (carrera === 'Sistemas' && prom > 16) return {porcentaje:60, clase:'warning', texto:'Beca 60%'};
	return {porcentaje:0, clase:'secondary', texto:'Sin beca'};
};

// UI elements
const resultadoEl = document.getElementById('resultado');
const salidaJSON = document.getElementById('salidaJSON');
const becaEl = document.getElementById('beca');
const notasInfo = document.getElementById('notasInfo');
const recomendacionEl = document.getElementById('recomendacion');
const rendimientoEl = document.getElementById('rendimiento');
const estadisticas = document.getElementById('estadisticas');
const cursoInfo = document.getElementById('cursoInfo');
const totalEstudiantesEl = document.getElementById('totalEstudiantes');
const cursoResumen = document.getElementById('cursoResumen');
const rankingInfo = document.getElementById('rankingInfo');
const mejoresEl = document.getElementById('mejores');
const tablaContenedor = document.getElementById('tablaContenedor');
const tablaBody = document.querySelector('#tablaEstudiantes tbody');

const limpiarUI = ()=>{
	resultadoEl.className = 'alert mt-4 d-none';
	salidaJSON.className = 'bg-dark text-white p-3 rounded d-none';
	becaEl.className = 'alert mt-2 d-none';
	estadisticas.classList.add('d-none');
	cursoInfo.classList.add('d-none');
	tablaContenedor.classList.add('d-none');
};

const limpiarFormulario = ()=>{
	document.getElementById('nombre').value = '';
	document.getElementById('carrera').value = '';
	document.getElementById('nota1').value = '';
	document.getElementById('nota2').value = '';
	document.getElementById('nota3').value = '';
	document.getElementById('nota4').value = '';
	limpiarUI();
};

const validarYCrearObjeto = () => {
	const nombre = document.getElementById('nombre').value.trim();
	const carrera = document.getElementById('carrera').value;
	if (!nombre || !carrera) {
		resultadoEl.className = 'alert mt-4 alert-danger';
		resultadoEl.innerText = 'Por favor ingrese nombre y carrera.';
		return null;
	}
	const notas = getNotas();
	if (notas.some(n => n < 0 || n > 20 || isNaN(n))) {
		resultadoEl.className = 'alert mt-4 alert-danger';
		resultadoEl.innerText = 'Ingrese notas válidas entre 0 y 20.';
		return null;
	}

	const prom = promedio(notas);
	const promEspecial = promedioSinMenor(notas);
	const mayor = notaMayor(notas);
	const menor = notaMenor(notas);
	const estadosNotas = contarEstadosNotas(notas);
	const estado = prom >= UMBRAL_APROBADO ? 'Aprobado' : prom >= UMBRAL_RECUP ? 'Recuperación' : 'Reprobado';
	const rendimiento = clasificarRendimiento(prom);
	const recomendacion = recomendacionPorPromedio(prom);
	const beca = calcularBeca(carrera, prom);

	return {
		nombre,
		carrera,
		notas,
		promedio: Number(prom.toFixed(2)),
		promedioEspecial: Number(promEspecial.toFixed(2)),
		notaMayor: mayor,
		notaMenor: menor,
		estadosNotas,
		estado,
		rendimiento,
		beca,
		recomendacion
	};
};

const renderResultado = (obj)=>{
	resultadoEl.className = 'alert mt-4 alert-success';
	resultadoEl.innerText = `El estudiante ${obj.nombre} está: ${obj.estado}. Promedio: ${obj.promedio.toFixed(2)}`;

	// Beca
	becaEl.className = `alert mt-2 alert-${obj.beca.clase}`;
	becaEl.innerText = obj.beca.texto + (obj.beca.porcentaje>0 ? ` (${obj.beca.porcentaje}%)` : '');

	// Estadísticas por estudiante
	notasInfo.innerText = `Notas: ${obj.notas.join(', ')} | Mayor: ${obj.notaMayor} | Menor: ${obj.notaMenor} | Prom. esp.: ${obj.promedioEspecial.toFixed(2)}`;
	recomendacionEl.innerText = `Recomendación: ${obj.recomendacion}`;
	rendimientoEl.innerText = `Rendimiento: ${obj.rendimiento}`;
	estadisticas.classList.remove('d-none');

	salidaJSON.className = 'bg-dark text-white p-3 rounded';
	salidaJSON.innerText = JSON.stringify(obj, null, 2);
};

const agregarHistorial = (estudiante) => {
	// Validar duplicados por nombre (case-insensitive)
	const existe = historial.some(e => e.nombre.toLowerCase() === estudiante.nombre.toLowerCase());
	if (existe) {
		resultadoEl.className = 'alert mt-4 alert-warning';
		resultadoEl.innerText = 'Ya existe un estudiante con ese nombre en el historial.';
		return false;
	}
	historial.push(estudiante);
	return true;
};

const renderCursoInfo = ()=>{
	if (historial.length === 0) {
		cursoInfo.classList.add('d-none');
		return;
	}
	cursoInfo.classList.remove('d-none');
	totalEstudiantesEl.innerText = `Total estudiantes: ${historial.length}`;

	// Contar estados del curso
	let aprob=0, rec=0, rep=0;
	let sumaProm=0;
	historial.forEach(e=>{
		if (e.promedio >= UMBRAL_APROBADO) aprob++;
		else if (e.promedio >= UMBRAL_RECUP) rec++;
		else rep++;
		sumaProm += e.promedio;
	});
	cursoResumen.innerText = `Aprobados: ${aprob} | Recuperación: ${rec} | Reprobados: ${rep}`;
	const promGeneral = sumaProm / historial.length;
	rankingInfo.innerText = `Promedio general del curso: ${promGeneral.toFixed(2)}`;

	// Ranking
	const ranking = historial.slice().sort((a,b)=>b.promedio - a.promedio);
	rankingInfo.innerText += ` | Top: ${ranking[0].nombre} (${ranking[0].promedio.toFixed(2)})`;
	mejoresEl.innerText = `Mejor promedio: ${ranking[0].nombre} (${ranking[0].promedio.toFixed(2)}) — Peor promedio: ${ranking[ranking.length-1].nombre} (${ranking[ranking.length-1].promedio.toFixed(2)})`;
};

const renderTabla = ()=>{
	if (historial.length === 0) {
		tablaContenedor.classList.add('d-none');
		return;
	}
	tablaContenedor.classList.remove('d-none');
	tablaBody.innerHTML = '';
	historial.forEach(e=>{
		const tr = document.createElement('tr');
		tr.innerHTML = `
			<td>${e.nombre}</td>
			<td>${e.carrera}</td>
			<td>${e.notas.join(', ')}</td>
			<td>${e.promedio.toFixed(2)}</td>
			<td>${e.promedioEspecial.toFixed(2)}</td>
			<td>${e.notaMayor}</td>
			<td>${e.notaMenor}</td>
			<td>${e.estado}</td>
			<td>${e.rendimiento}</td>
			<td>${e.beca.texto}</td>
		`;
		tablaBody.appendChild(tr);
	});
};

// Event listeners
document.getElementById('btnEvaluar').addEventListener('click', function(){
	limpiarUI();
	const obj = validarYCrearObjeto();
	if (!obj) return;
	renderResultado(obj);
	const agregado = agregarHistorial(obj);
	if (agregado) renderCursoInfo();
});

document.getElementById('btnLimpiar').addEventListener('click', function(){
	limpiarFormulario();
});

document.getElementById('btnListar').addEventListener('click', function(){
	renderTabla();
	renderCursoInfo();
});

document.getElementById('btnBuscar').addEventListener('click', function(){
	const q = document.getElementById('buscarNombre').value.trim().toLowerCase();
	if (!q) return;
	const encontrado = historial.find(e => e.nombre.toLowerCase() === q);
	if (!encontrado) {
		resultadoEl.className = 'alert mt-4 alert-info';
		resultadoEl.innerText = 'Estudiante no encontrado en el historial.';
		return;
	}
	renderResultado(encontrado);
});

// Inicialización: ocultar elementos
limpiarUI();


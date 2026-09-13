// Comprueba en produccion que los datos de la base casan con lo que la app
// movil (y el panel) esperan: que cada registro apunte a otro que exista
// (la base no tiene claves foraneas que lo impidan), que los estados y tipos
// sean los que las pantallas conocen y que las fotos guardadas existan.
//
// Solo LEE. Nunca imprime tokens, contrasenas ni datos personales: solo ids.
//
// Uso:
//   node scripts/verificar-datos-app.mjs            -> solo lo publico
//   node scripts/verificar-datos-app.mjs --sesion   -> pide usuario y contrasena y revisa todo

const BASE = process.env.API_URL || 'https://bakendultimo-production.up.railway.app/';
const conSesion = process.argv.includes('--sesion');

let ok = 0;
let revisar = 0;
let saltados = 0;

const verde = (t) => `\x1b[32m${t}\x1b[0m`;
const amarillo = (t) => `\x1b[33m${t}\x1b[0m`;
const gris = (t) => `\x1b[90m${t}\x1b[0m`;

/** Anota una comprobacion: `malos` son los ids que no la cumplen. */
function comprobar(nombre, total, malos, nota = '') {
  if (!malos.length) {
    ok++;
    console.log(`  ${verde('[OK]')}      ${nombre} ${gris(`(${total})`)}`);
  } else {
    revisar++;
    const ids = malos.slice(0, 15).join(', ') + (malos.length > 15 ? ', ...' : '');
    console.log(`  ${amarillo('[REVISAR]')} ${nombre}: ${malos.length} de ${total} -> ids ${ids}${nota ? gris(`  ${nota}`) : ''}`);
  }
}

const bajo = (v) => String(v ?? '').trim().toLowerCase();
const enLista = (v, lista) => lista.map(bajo).includes(bajo(v));
const fechaValida = (v) => !!v && !Number.isNaN(new Date(v).getTime());
const ruta = (foto) => String(foto).replace(/\\/g, '/').replace(/^\/+/, '').split('/').map(encodeURIComponent).join('/');

async function llamar(metodo, camino, { cuerpo, token } = {}) {
  const headers = {};
  if (cuerpo !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;
  const r = await fetch(BASE + camino, { method: metodo, headers, body: cuerpo !== undefined ? JSON.stringify(cuerpo) : undefined });
  let json = null;
  try {
    json = await r.json();
  } catch {}
  return { status: r.status, json };
}

/** Fotos que no se pueden descargar (HEAD al archivo en /uploads), de 6 en 6. */
async function fotosRotas(filas, idDe, fotoDe) {
  const conFoto = filas.filter((f) => fotoDe(f));
  const rotas = [];
  for (let i = 0; i < conFoto.length; i += 6) {
    await Promise.all(
      conFoto.slice(i, i + 6).map(async (f) => {
        const foto = String(fotoDe(f));
        const url = /^https?:\/\//.test(foto) ? foto : BASE + ruta(foto);
        try {
          const r = await fetch(url, { method: 'HEAD' });
          if (!r.ok) rotas.push(idDe(f));
        } catch {
          rotas.push(idDe(f));
        }
      })
    );
  }
  return { total: conFoto.length, rotas };
}

function preguntar(texto, oculto = false) {
  return new Promise((resolver) => {
    process.stdout.write(texto);
    const entrada = process.stdin;
    let valor = '';
    if (!oculto || !entrada.isTTY) {
      entrada.resume();
      entrada.once('data', (d) => {
        entrada.pause();
        resolver(String(d).trim());
      });
      return;
    }
    entrada.setRawMode(true);
    entrada.resume();
    const alTeclear = (d) => {
      for (const c of String(d)) {
        if (c === '\r' || c === '\n') {
          entrada.setRawMode(false);
          entrada.pause();
          entrada.off('data', alTeclear);
          process.stdout.write('\n');
          return resolver(valor);
        }
        if (c === '') process.exit(1);
        if (c === '\b' || c === '') valor = valor.slice(0, -1);
        else valor += c;
      }
    };
    entrada.on('data', alTeclear);
  });
}

// ---------------------------------------------------------------- publico

const ESTADOS_COLITA = ['En refugio', 'proceso', 'adoptado', 'Fallecido', 'De baja'];
const TAMANOS = ['pequeño', 'mediano', 'grande'];

console.log(`\nVerificacion de datos app <-> base  (${BASE})\n`);
console.log('1. Datos publicos');

const salud = await llamar('GET', '');
comprobar('el servidor responde', 1, salud.status === 200 ? [] : [`HTTP ${salud.status}`]);

const colitas = (await llamar('POST', 'colitas/list', { cuerpo: {} })).json?.data || [];
const idC = (c) => c.idanimal;
comprobar('colitas: tipo 1=Gato / 2=Perro coincide con su descripcion', colitas.length,
  colitas.filter((c) => !({ 1: 'gato', 2: 'perro' }[c.idtipoanimal] && bajo(c.tipo_descripcion?.descripcion).includes({ 1: 'gato', 2: 'perro' }[c.idtipoanimal]))).map(idC));
comprobar('colitas: genero 1=Macho / 2=Hembra coincide con su descripcion', colitas.length,
  colitas.filter((c) => !({ 1: 'macho', 2: 'hembra' }[c.idgenero] && bajo(c.genero?.descripcion).includes({ 1: 'macho', 2: 'hembra' }[c.idgenero]))).map(idC));
comprobar('colitas: estado es uno de los que muestra la app', colitas.length, colitas.filter((c) => !enLista(c.estado, ESTADOS_COLITA)).map(idC));
comprobar('colitas: De baja / Fallecido tienen motivo', colitas.length,
  colitas.filter((c) => enLista(c.estado, ['De baja', 'Fallecido']) && !String(c.motivo_estado || '').trim()).map(idC));
comprobar('colitas: tamano pequeño/mediano/grande', colitas.length, colitas.filter((c) => !enLista(c.tamano, TAMANOS)).map(idC));
comprobar('colitas: esterilizacion Si/No', colitas.length, colitas.filter((c) => !['s', 'n'].includes(bajo(c.esterelizacion).charAt(0))).map(idC));
comprobar('colitas: fecha de ingreso valida', colitas.length, colitas.filter((c) => !fechaValida(c.Fecha_Ingreso)).map(idC));
let f = await fotosRotas(colitas, idC, (c) => c.foto);
comprobar('colitas: la foto existe en el servidor', f.total, f.rotas);
comprobar('colitas: tienen foto', colitas.length, colitas.filter((c) => !c.foto).map(idC));

const perdidosPub = (await llamar('GET', 'perdidos/publicas')).json?.data || [];
const idP = (p) => p.idmascotaperdida;
comprobar('perdidos publicos: tipo coincide con su descripcion', perdidosPub.length,
  perdidosPub.filter((p) => p.tipo && !bajo(p.tipo.descripcion).includes({ 1: 'gato', 2: 'perro' }[p.idtipoanimal] || '?')).map(idP));
comprobar('perdidos publicos: estado P/E', perdidosPub.length, perdidosPub.filter((p) => !['P', 'E'].includes(p.status)).map(idP));
comprobar('perdidos publicos: su dueno existe', perdidosPub.length, perdidosPub.filter((p) => p.iddueno && !p.dueno).map(idP));
f = await fotosRotas(perdidosPub, idP, (p) => p.foto);
comprobar('perdidos publicos: la foto existe', f.total, f.rotas);

const noticiasPub = (await llamar('GET', 'noticias/publicas')).json?.data || [];
f = await fotosRotas(noticiasPub, (n) => n.idnoticia, (n) => n.imagen);
comprobar('noticias publicas: la imagen existe', f.total, f.rotas);

const canales = (await llamar('GET', 'plan-mensual/list')).json?.data || [];
f = await fotosRotas(canales, (c) => c.idplanmensual, (c) => (/^https?:\/\//.test(String(c.cantidad || '')) ? c.cantidad : null));
comprobar('canales de donacion: el logo (url) carga', f.total, f.rotas);

// ---------------------------------------------------------------- con sesion

if (!conSesion) {
  console.log(gris('\n  (Para revisar adopciones, donaciones, veterinaria, etc.: node scripts/verificar-datos-app.mjs --sesion)'));
} else {
  console.log('\n2. Relaciones con sesion');
  const usuario = await preguntar('  Usuario del panel: ');
  const pass = await preguntar('  Contrasena (no se ve): ', true);
  const login = await llamar('POST', 'session-user', { cuerpo: { usuario, pass } });
  if (login.json?.code !== '000' || !login.json?.token) {
    console.log(amarillo(`  No se pudo iniciar sesion: ${login.json?.message || `HTTP ${login.status}`}`));
    process.exit(1);
  }
  const token = login.json.token;
  const esAdmin = login.json.rol === 'Administrador';
  console.log(gris(`  Sesion como ${login.json.rol}.`));

  async function lista(nombre, metodo, camino, cuerpo) {
    const r = await llamar(metodo, camino, { cuerpo, token });
    if (r.status === 403) {
      saltados++;
      console.log(gris(`  [--]      ${nombre}: tu rol no tiene permiso, se salta`));
      return null;
    }
    if (r.status !== 200 || !Array.isArray(r.json?.data)) {
      revisar++;
      console.log(amarillo(`  [REVISAR] ${nombre}: la ruta ${camino} respondio HTTP ${r.status}`));
      return null;
    }
    return r.json.data;
  }

  const [adopciones, adoptantes, entrevistas, seguimientos, ingresos, donantes, tiposPersona, apadrinados, atenciones, visitas, usuarios, perdidos, duenos, egresos, tiposAnimal, generos, permisos] =
    await Promise.all([
      lista('adopciones', 'POST', 'adopciones/list', {}),
      lista('adoptantes', 'POST', 'adoptante/list', {}),
      lista('entrevistas', 'POST', 'entrevistas/list', {}),
      lista('seguimientos', 'POST', 'seguimientos/list', {}),
      lista('ingresos', 'GET', 'ingresos/list'),
      lista('donantes', 'GET', 'donante/list'),
      lista('tipos de persona', 'GET', 'tipo-persona/list'),
      lista('apadrinamientos', 'POST', 'apadrinado/list', {}),
      lista('veterinaria', 'POST', 'veterinaria/list', {}),
      lista('visitas', 'POST', 'voluntario-visita/list', {}),
      esAdmin ? lista('usuarios', 'GET', 'usuario/list') : null,
      lista('perdidos', 'POST', 'perdidos/list', {}),
      lista('duenos', 'POST', 'amo/list', { busqueda: '' }),
      lista('egresos', 'GET', 'egreso/list'),
      lista('tipos de animal', 'GET', 'tipo-animal/list'),
      lista('generos', 'GET', 'genero/list'),
      esAdmin ? lista('permisos', 'GET', 'permisos/list') : null,
    ]);

  const ids = (filas, campo) => new Set((filas || []).map((x) => x[campo]));
  const idsColitas = ids(colitas, 'idanimal');

  if (tiposAnimal) {
    const t = Object.fromEntries(tiposAnimal.map((x) => [x.idtipoanimal, bajo(x.descripcion)]));
    comprobar('catalogo tipo de animal: 1=Gato, 2=Perro (lo que usa la app)', tiposAnimal.length, [1, 2].filter((i) => !String(t[i] || '').includes(i === 1 ? 'gato' : 'perro')));
  }
  if (generos) {
    const g = Object.fromEntries(generos.map((x) => [x.idgenero, bajo(x.descripcion)]));
    comprobar('catalogo genero: 1=Macho, 2=Hembra (lo que usa la app)', generos.length, [1, 2].filter((i) => !String(g[i] || '').includes(i === 1 ? 'macho' : 'hembra')));
  }

  if (adopciones) {
    const idA = (a) => a.idadopcion;
    if (adoptantes) comprobar('adopciones: su adoptante existe', adopciones.length, adopciones.filter((a) => !ids(adoptantes, 'idadoptante').has(a.idadoptante)).map(idA));
    comprobar('adopciones: su colita existe', adopciones.length, adopciones.filter((a) => !idsColitas.has(a.idanimal)).map(idA));
    comprobar('adopciones: estado proceso/adoptado/rechazado', adopciones.length, adopciones.filter((a) => !enLista(a.Estado, ['proceso', 'adoptado', 'rechazado'])).map(idA));
    comprobar('adopciones: fecha valida', adopciones.length, adopciones.filter((a) => !fechaValida(a.Fecha_Adopcion)).map(idA));
    const colitaDe = new Map(colitas.map((c) => [c.idanimal, c]));
    comprobar('adopciones adoptadas: la colita figura como adoptado', adopciones.filter((a) => bajo(a.Estado) === 'adoptado').length,
      adopciones.filter((a) => bajo(a.Estado) === 'adoptado' && colitaDe.has(a.idanimal) && bajo(colitaDe.get(a.idanimal).estado) !== 'adoptado').map(idA),
      'la adopcion dice adoptado pero la ficha de la colita no');
    const adoptadas = new Set(adopciones.filter((a) => bajo(a.Estado) === 'adoptado').map((a) => a.idanimal));
    const enProceso = new Set(adopciones.filter((a) => bajo(a.Estado) === 'proceso').map((a) => a.idanimal));
    comprobar('colitas "adoptado": tienen una adopcion adoptada', colitas.filter((c) => bajo(c.estado) === 'adoptado').length,
      colitas.filter((c) => bajo(c.estado) === 'adoptado' && !adoptadas.has(c.idanimal)).map(idC));
    comprobar('colitas "en proceso": tienen una solicitud en proceso', colitas.filter((c) => bajo(c.estado) === 'proceso').length,
      colitas.filter((c) => bajo(c.estado) === 'proceso' && !enProceso.has(c.idanimal)).map(idC));
    const porColita = {};
    adopciones.filter((a) => bajo(a.Estado) === 'adoptado').forEach((a) => (porColita[a.idanimal] = (porColita[a.idanimal] || 0) + 1));
    comprobar('colitas: como mucho una adopcion adoptada', Object.keys(porColita).length, Object.entries(porColita).filter(([, n]) => n > 1).map(([id]) => id));

    const idsAdopciones = ids(adopciones, 'idadopcion');
    if (entrevistas) {
      comprobar('entrevistas: su adopcion existe', entrevistas.length, entrevistas.filter((e) => !idsAdopciones.has(e.idadopcion)).map((e) => e.identrevista));
      comprobar('entrevistas: estado pendiente/realizada', entrevistas.length, entrevistas.filter((e) => !['pendiente', 'realizada'].includes(e.Estado)).map((e) => e.identrevista),
        'la app compara exacto en minusculas');
    }
    if (seguimientos) {
      comprobar('seguimientos: su adopcion existe', seguimientos.length, seguimientos.filter((s) => !idsAdopciones.has(s.idadopcion)).map((s) => s.idseguimiento));
      comprobar('seguimientos: estado pendiente/realizado', seguimientos.length, seguimientos.filter((s) => !['pendiente', 'realizado'].includes(s.Estado)).map((s) => s.idseguimiento),
        'la app compara exacto en minusculas');
      f = await fotosRotas(seguimientos, (s) => s.idseguimiento, (s) => s.Evidencia);
      comprobar('seguimientos: la evidencia existe', f.total, f.rotas);
    }
  }

  if (ingresos) {
    const idI = (i) => i.idtblingreso;
    if (donantes) comprobar('ingresos: su donante existe', ingresos.length, ingresos.filter((i) => !ids(donantes, 'iddonantes').has(i.iddonantes)).map(idI));
    comprobar('ingresos: suministro Si/No', ingresos.length, ingresos.filter((i) => !enLista(i.suministro, ['Sí', 'Si', 'No'])).map(idI));
    comprobar('ingresos: pago yape/plin/tarjeta/ninguna', ingresos.length, ingresos.filter((i) => !enLista(i.pago, ['yape', 'plin', 'tarjeta', 'ninguna'])).map(idI));
    comprobar('ingresos: tipo monetaria/comida/otros', ingresos.length, ingresos.filter((i) => !enLista(i.donacion, ['monetaria', 'comida', 'otros'])).map(idI));
    comprobar('ingresos: monto es un numero', ingresos.length, ingresos.filter((i) => Number.isNaN(Number(i.monto))).map(idI));
    comprobar('ingresos: fecha valida', ingresos.length, ingresos.filter((i) => !fechaValida(i.fecha_registro)).map(idI));
    f = await fotosRotas(ingresos, idI, (i) => i.evidencia);
    comprobar('ingresos: la evidencia existe', f.total, f.rotas);
  }
  if (donantes && tiposPersona) {
    comprobar('donantes: su tipo de persona existe', donantes.length, donantes.filter((d) => d.idtipopersona != null && !ids(tiposPersona, 'idtipopersona').has(d.idtipopersona)).map((d) => d.iddonantes));
  }
  if (egresos) {
    comprobar('egresos: monto numerico y fecha valida', egresos.length, egresos.filter((e) => Number.isNaN(Number(e.Monto)) || !fechaValida(e.fechato)).map((e) => e.idregistroegreso));
  }
  if (apadrinados) {
    const idAp = (a) => a.idapadrinado;
    comprobar('apadrinamientos: su colita existe', apadrinados.length, apadrinados.filter((a) => !idsColitas.has(a.idanimal)).map(idAp));
    comprobar('apadrinamientos: estado Activo/Finalizado', apadrinados.length, apadrinados.filter((a) => !enLista(a.estado, ['Activo', 'Finalizado'])).map(idAp));
    comprobar('apadrinamientos activos: la colita sigue en el albergue', apadrinados.filter((a) => bajo(a.estado) === 'activo').length,
      apadrinados.filter((a) => bajo(a.estado) === 'activo' && colitas.find((c) => c.idanimal === a.idanimal && !enLista(c.estado, ['En refugio', 'proceso']))).map(idAp));
  }
  if (atenciones) {
    const idV = (r) => r.idveterinaria;
    comprobar('veterinaria: su colita existe', atenciones.length, atenciones.filter((r) => !idsColitas.has(r.idanimal)).map(idV));
    comprobar('veterinaria: tipo es uno de los de la app', atenciones.length,
      atenciones.filter((r) => !enLista(r.tipo, ['Diagnóstico', 'Vacuna', 'Tratamiento', 'Esterilización', 'Control médico'])).map(idV));
    comprobar('veterinaria: estado Pendiente/Realizado', atenciones.length, atenciones.filter((r) => r.Estado != null && !['Pendiente', 'Realizado'].includes(r.Estado)).map(idV),
      'la app compara exacto');
    comprobar('veterinaria: proximo control no es anterior a la atencion', atenciones.filter((r) => r.proxima_fecha).length,
      atenciones.filter((r) => r.proxima_fecha && String(r.proxima_fecha).slice(0, 10) < String(r.fecha).slice(0, 10)).map(idV));
    if (usuarios) comprobar('veterinaria: el veterinario asignado existe', atenciones.length, atenciones.filter((r) => r.iduser != null && !ids(usuarios, 'iduser').has(r.iduser)).map(idV));
  }
  if (visitas && usuarios) {
    const rolDe = new Map(usuarios.map((u) => [u.iduser, u.rol]));
    comprobar('visitas: el usuario existe y es Voluntario', visitas.length, visitas.filter((v) => rolDe.get(v.iduser) !== 'Voluntario').map((v) => v.idvisita));
    comprobar('visitas: estado Pendiente/Realizado', visitas.length, visitas.filter((v) => v.Estado != null && !['Pendiente', 'Realizado'].includes(v.Estado)).map((v) => v.idvisita));
  }
  if (perdidos) {
    const idPe = (p) => p.idmascotaperdida;
    if (duenos) comprobar('perdidos: su dueno existe', perdidos.length, perdidos.filter((p) => p.iddueno != null && !ids(duenos, 'iddueno').has(p.iddueno)).map(idPe));
    comprobar('perdidos: tipo 1/2 y genero 1/2', perdidos.length, perdidos.filter((p) => ![1, 2].includes(Number(p.idtipoanimal)) || ![1, 2].includes(Number(p.idgenero))).map(idPe));
    comprobar('perdidos: estado P/E', perdidos.length, perdidos.filter((p) => !['P', 'E'].includes(p.status)).map(idPe));
  }
  if (usuarios) {
    comprobar('usuarios: rol Administrador/Voluntario/Veterinario', usuarios.length, usuarios.filter((u) => !['Administrador', 'Voluntario', 'Veterinario'].includes(u.rol)).map((u) => u.iduser));
    f = await fotosRotas(usuarios, (u) => u.iduser, (u) => u.foto);
    comprobar('usuarios: la foto de perfil existe', f.total, f.rotas);
  }
  if (permisos) {
    const secciones = ['refugio', 'colitas', 'perdidos', 'veterinaria', 'adopcion', 'donaciones', 'voluntariado', 'reportes'];
    const faltan = [];
    for (const rol of ['Voluntario', 'Veterinario']) for (const s of secciones) if (!permisos.some((p) => p.rol === rol && p.seccion === s)) faltan.push(`${rol}/${s}`);
    comprobar('permisos: cada rol tiene fila para cada seccion', 16, faltan,
      'sin fila el servidor deja pasar pero la app oculta la seccion');
  }

  // Sin tokens en memoria mas de lo necesario.
  login.json.token = null;
}

console.log(`\nResultado: ${verde(`${ok} bien`)}, ${revisar ? amarillo(`${revisar} para revisar`) : '0 para revisar'}${saltados ? gris(`, ${saltados} sin permiso`) : ''}.\n`);
process.exit(0);

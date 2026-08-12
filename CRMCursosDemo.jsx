// ============================================================================
// CRM CURSOS — Demo interactiva completa
// ----------------------------------------------------------------------------
// Incluye:
//  1) Login de administrador (email + contraseña)
//  2) Catálogo de cursos con precio (crear / eliminar)
//  3) Alta de alumnos con simulación de pago tipo Stripe (formulario de tarjeta)
//  4) Tablero de ventas (Kanban) conectado al catálogo de cursos
//  5) Panel de métricas (ingresos, alumnos activos, conversión)
//
// Los datos se guardan con window.storage, así que sobreviven si recargas
// la página dentro de este entorno. Si copias este archivo a tu propio
// proyecto Vite/Next.js, reemplaza las funciones "guardarCursos" /
// "guardarLeads" por llamadas a tu propia API (ver comentarios "BACKEND REAL").
//
// Credenciales de la demo (mostradas también en pantalla de login):
//   admin@escuela.com / admin123
// ============================================================================

import React, { useState, useEffect } from "react";
import {
  LogIn,
  LogOut,
  Lock,
  Mail,
  User,
  BookOpen,
  DollarSign,
  Users,
  TrendingUp,
  CreditCard,
  Plus,
  Trash2,
  CheckCircle2,
  X,
  ArrowRight,
  Loader2,
  ShieldCheck,
} from "lucide-react";

// --- CREDENCIALES DE ADMIN (solo para esta demo) ----------------------------
const ADMIN_EMAIL = "admin@escuela.com";
const ADMIN_PASSWORD = "admin123";

// --- DATOS INICIALES (se usan solo la primera vez, luego se guardan) -------
const CURSOS_INICIALES = [
  { id: "c1", nombre: "Curso de React", precio: 120 },
  { id: "c2", nombre: "Curso de Python", precio: 95 },
  { id: "c3", nombre: "Data Science", precio: 150 },
  { id: "c4", nombre: "Marketing Digital", precio: 80 },
];

const LEADS_INICIALES = [
  { id: 1, nombre: "Juan Pérez", email: "juan.perez@mail.com", cursoId: "c1", etapa: "interesado", fecha: null },
  { id: 2, nombre: "María Gómez", email: "maria.gomez@mail.com", cursoId: "c2", etapa: "interesado", fecha: null },
  { id: 3, nombre: "Carlos Ruiz", email: "carlos.ruiz@mail.com", cursoId: "c3", etapa: "contacto", fecha: null },
  { id: 4, nombre: "Ana Torres", email: "ana.torres@mail.com", cursoId: "c1", etapa: "contacto", fecha: null },
  { id: 5, nombre: "Luis Medina", email: "luis.medina@mail.com", cursoId: "c4", etapa: "comprado", fecha: "10/08/2026" },
  { id: 6, nombre: "Sofía Castro", email: "sofia.castro@mail.com", cursoId: "c2", etapa: "comprado", fecha: "11/08/2026" },
];

const ETAPAS = [
  { key: "interesado", titulo: "Interesado", descripcion: "Dejó sus datos en la landing page", barra: "bg-slate-400", chip: "bg-slate-100 text-slate-600" },
  { key: "contacto", titulo: "En Contacto", descripcion: "El equipo de ventas está conversando", barra: "bg-amber-400", chip: "bg-amber-100 text-amber-700" },
  { key: "comprado", titulo: "Compró Curso", descripcion: "Pago confirmado y acceso otorgado", barra: "bg-emerald-500", chip: "bg-emerald-100 text-emerald-700" },
];

function iniciales(nombre) {
  return nombre.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
}
function hoyFormateado() {
  return new Date().toLocaleDateString("es-ES");
}

// --- HELPERS DE ALMACENAMIENTO (persisten los datos entre recargas) --------
// BACKEND REAL: reemplaza el contenido de estas dos funciones por
// llamadas fetch() a tu propia API (ej. POST /api/leads, POST /api/cursos).
async function leerStorage(clave, valorPorDefecto) {
  try {
    const res = await window.storage.get(clave, false);
    return res ? JSON.parse(res.value) : valorPorDefecto;
  } catch {
    return valorPorDefecto;
  }
}
async function escribirStorage(clave, valor) {
  try {
    await window.storage.set(clave, JSON.stringify(valor), false);
  } catch {
    // Si el almacenamiento falla, la demo sigue funcionando solo en memoria.
  }
}

export default function CRMCursosDemo() {
  // ---- SESIÓN / LOGIN -------------------------------------------------
  const [autenticado, setAutenticado] = useState(false);

  // ---- DATOS PRINCIPALES ------------------------------------------------
  const [cargando, setCargando] = useState(true);
  const [cursos, setCursos] = useState([]);
  const [leads, setLeads] = useState([]);

  // ---- UI ----------------------------------------------------------------
  const [vista, setVista] = useState("pipeline"); // pipeline | cursos | alumnos
  const [toast, setToast] = useState(null);
  const [modalPago, setModalPago] = useState(null); // { nombre, email, curso, onExito }

  // Carga inicial desde el almacenamiento persistente
  useEffect(() => {
    (async () => {
      const cursosGuardados = await leerStorage("crm-cursos", CURSOS_INICIALES);
      const leadsGuardados = await leerStorage("crm-leads", LEADS_INICIALES);
      setCursos(cursosGuardados);
      setLeads(leadsGuardados);
      setCargando(false);
    })();
  }, []);

  function mostrarToast(mensaje) {
    setToast(mensaje);
    setTimeout(() => setToast(null), 3200);
  }

  async function actualizarCursos(nuevos) {
    setCursos(nuevos);
    await escribirStorage("crm-cursos", nuevos);
  }
  async function actualizarLeads(nuevos) {
    setLeads(nuevos);
    await escribirStorage("crm-leads", nuevos);
  }

  function cursoPorId(id) {
    return cursos.find((c) => c.id === id) || { nombre: "Curso eliminado", precio: 0 };
  }

  // ---- MÉTRICAS ------------------------------------------------------------
  const alumnos = leads.filter((l) => l.etapa === "comprado");
  const totalFacturado = alumnos.reduce((suma, l) => suma + cursoPorId(l.cursoId).precio, 0);
  const tasaConversion = leads.length ? Math.round((alumnos.length / leads.length) * 100) : 0;

  // ---- ACCIONES DEL PIPELINE ------------------------------------------------
  function contactarLead(lead) {
    actualizarLeads(leads.map((l) => (l.id === lead.id ? { ...l, etapa: "contacto" } : l)));
    mostrarToast(`✉️ Email de seguimiento enviado automáticamente a ${lead.nombre}`);
  }

  function abrirPagoParaLead(lead) {
    const curso = cursoPorId(lead.cursoId);
    setModalPago({
      nombre: lead.nombre,
      email: lead.email,
      curso,
      onExito: () => {
        actualizarLeads(
          leads.map((l) => (l.id === lead.id ? { ...l, etapa: "comprado", fecha: hoyFormateado() } : l))
        );
        mostrarToast(`✅ Pago confirmado — acceso y correo de bienvenida enviados a ${lead.nombre}`);
      },
    });
  }

  function agregarLeadDemo() {
    if (cursos.length === 0) return mostrarToast("⚠️ Primero crea un curso en la pestaña Cursos");
    const nombresDemo = ["Pedro Salinas", "Valentina Rojas", "Diego Fernández", "Camila Vidal", "Andrés León"];
    const nombre = nombresDemo[Math.floor(Math.random() * nombresDemo.length)];
    const curso = cursos[Math.floor(Math.random() * cursos.length)];
    const nuevo = {
      id: Date.now(),
      nombre,
      email: nombre.toLowerCase().replace(" ", ".") + "@mail.com",
      cursoId: curso.id,
      etapa: "interesado",
      fecha: null,
    };
    actualizarLeads([nuevo, ...leads]);
    mostrarToast(`🆕 Nuevo interesado capturado desde la landing page: ${nombre}`);
  }

  // ---- ACCIONES DE CURSOS ------------------------------------------------
  function crearCurso(nombre, precio) {
    const nuevo = { id: "c" + Date.now(), nombre, precio: Number(precio) };
    actualizarCursos([...cursos, nuevo]);
    mostrarToast(`📚 Curso "${nombre}" agregado al catálogo`);
  }
  function eliminarCurso(id) {
    const tieneAlumnos = leads.some((l) => l.cursoId === id && l.etapa === "comprado");
    if (tieneAlumnos) {
      return mostrarToast("⚠️ No puedes eliminar un curso con alumnos inscritos");
    }
    actualizarCursos(cursos.filter((c) => c.id !== id));
  }

  // ---- ACCIONES DE ALUMNOS (alta directa + pago) ---------------------------
  function abrirPagoParaNuevoAlumno({ nombre, email, cursoId }) {
    const curso = cursoPorId(cursoId);
    setModalPago({
      nombre,
      email,
      curso,
      onExito: () => {
        const nuevo = { id: Date.now(), nombre, email, cursoId, etapa: "comprado", fecha: hoyFormateado() };
        actualizarLeads([nuevo, ...leads]);
        mostrarToast(`✅ Alumno registrado — ${nombre} ya tiene acceso a "${curso.nombre}"`);
      },
    });
  }

  // ---------------------------------------------------------------------------
  // PANTALLA DE LOGIN
  // ---------------------------------------------------------------------------
  if (!autenticado) {
    return <LoginScreen onLogin={() => setAutenticado(true)} />;
  }

  if (cargando) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex items-center gap-2 text-slate-500 text-sm">
          <Loader2 className="animate-spin" size={18} /> Cargando datos del CRM…
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // APP PRINCIPAL
  // ---------------------------------------------------------------------------
  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {/* ---------- BARRA SUPERIOR ---------- */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 md:px-8 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-slate-900 tracking-tight">CRM · Venta de Cursos</h1>
            <p className="text-xs text-slate-400">Sesión: {ADMIN_EMAIL}</p>
          </div>
          <button
            onClick={() => setAutenticado(false)}
            className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors"
          >
            <LogOut size={15} /> Cerrar sesión
          </button>
        </div>
        {/* Navegación entre secciones */}
        <div className="max-w-6xl mx-auto px-4 md:px-8 flex gap-1">
          {[
            { key: "pipeline", label: "Pipeline de ventas" },
            { key: "cursos", label: "Cursos" },
            { key: "alumnos", label: "Alumnos" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setVista(tab.key)}
              className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
                vista === tab.key
                  ? "border-indigo-600 text-indigo-600"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-4 md:p-8">
        {/* ---------- PANEL DE MÉTRICAS (visible siempre) ---------- */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <StatCard icon={<DollarSign size={20} />} color="emerald" label="Total facturado" value={`$${totalFacturado.toLocaleString()}`} />
          <StatCard icon={<Users size={20} />} color="indigo" label="Alumnos activos" value={alumnos.length} />
          <StatCard icon={<TrendingUp size={20} />} color="amber" label="Tasa de conversión" value={`${tasaConversion}%`} />
        </div>

        {vista === "pipeline" && (
          <PipelineView
            leads={leads}
            cursoPorId={cursoPorId}
            onContactar={contactarLead}
            onSimularCompra={abrirPagoParaLead}
            onNuevoLead={agregarLeadDemo}
          />
        )}

        {vista === "cursos" && (
          <CoursesView cursos={cursos} leads={leads} onCrear={crearCurso} onEliminar={eliminarCurso} />
        )}

        {vista === "alumnos" && (
          <StudentsView
            alumnos={alumnos}
            cursos={cursos}
            cursoPorId={cursoPorId}
            onRegistrar={abrirPagoParaNuevoAlumno}
          />
        )}
      </div>

      {/* ---------- MODAL DE PAGO (simulación tipo Stripe) ---------- */}
      {modalPago && (
        <PaymentModal
          datos={modalPago}
          onCerrar={() => setModalPago(null)}
          onExito={() => {
            modalPago.onExito();
            setModalPago(null);
          }}
        />
      )}

      {/* ---------- NOTIFICACIÓN FLOTANTE ---------- */}
      {toast && (
        <div className="fixed bottom-4 right-4 left-4 md:left-auto md:max-w-sm bg-slate-900 text-white text-sm px-4 py-3 rounded-lg shadow-lg flex items-start gap-2 z-50">
          <Mail size={16} className="mt-0.5 shrink-0" />
          <span>{toast}</span>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// PANTALLA DE LOGIN
// ============================================================================
function LoginScreen({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [verificando, setVerificando] = useState(false);

  function manejarSubmit(e) {
    e.preventDefault();
    setError("");
    setVerificando(true);
    // Simula una validación real contra un servidor de autenticación
    setTimeout(() => {
      if (email.trim().toLowerCase() === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
        onLogin();
      } else {
        setError("Correo o contraseña incorrectos");
        setVerificando(false);
      }
    }, 600);
  }

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 font-sans">
      <div className="bg-white w-full max-w-sm rounded-2xl shadow-lg border border-slate-200 p-8">
        <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-600 text-white mb-4 mx-auto">
          <ShieldCheck size={22} />
        </div>
        <h1 className="text-xl font-bold text-slate-900 text-center">Acceso administrador</h1>
        <p className="text-sm text-slate-500 text-center mt-1 mb-6">Inicia sesión para gestionar tu CRM de cursos</p>

        <form onSubmit={manejarSubmit} className="space-y-3">
          <div>
            <label className="text-xs font-medium text-slate-600">Correo</label>
            <div className="relative mt-1">
              <Mail size={16} className="absolute left-3 top-2.5 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@escuela.com"
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600">Contraseña</label>
            <div className="relative mt-1">
              <Lock size={16} className="absolute left-3 top-2.5 text-slate-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {error && <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">{error}</p>}

          <button
            type="submit"
            disabled={verificando}
            className="w-full inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-70 text-white text-sm font-medium py-2.5 rounded-lg transition-colors"
          >
            {verificando ? <Loader2 size={16} className="animate-spin" /> : <LogIn size={16} />}
            {verificando ? "Verificando…" : "Iniciar sesión"}
          </button>
        </form>

        <p className="text-xs text-slate-400 text-center mt-5">
          Demo — usa <span className="font-mono text-slate-600">{ADMIN_EMAIL}</span> / <span className="font-mono text-slate-600">{ADMIN_PASSWORD}</span>
        </p>
      </div>
    </div>
  );
}

// ============================================================================
// TARJETA DE MÉTRICA
// ============================================================================
function StatCard({ icon, color, label, value }) {
  const estilos = {
    emerald: "bg-emerald-100 text-emerald-600",
    indigo: "bg-indigo-100 text-indigo-600",
    amber: "bg-amber-100 text-amber-600",
  };
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3 shadow-sm">
      <div className={`rounded-lg p-2.5 ${estilos[color]}`}>{icon}</div>
      <div>
        <p className="text-slate-500 text-xs">{label}</p>
        <p className="text-xl font-bold text-slate-900">{value}</p>
      </div>
    </div>
  );
}

// ============================================================================
// VISTA: PIPELINE DE VENTAS (KANBAN)
// ============================================================================
function PipelineView({ leads, cursoPorId, onContactar, onSimularCompra, onNuevoLead }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-slate-800">Tablero de ventas</h2>
        <button
          onClick={onNuevoLead}
          className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg shadow-sm transition-colors"
        >
          <Plus size={16} /> Nuevo interesado (demo)
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {ETAPAS.map((etapa) => {
          const leadsDeEtapa = leads.filter((l) => l.etapa === etapa.key);
          return (
            <div key={etapa.key} className="bg-slate-100/70 rounded-xl p-3">
              <div className="flex items-center justify-between mb-1 px-1">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${etapa.barra}`} />
                  <h3 className="font-semibold text-slate-800 text-sm">{etapa.titulo}</h3>
                </div>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${etapa.chip}`}>{leadsDeEtapa.length}</span>
              </div>
              <p className="text-xs text-slate-400 px-1 mb-3">{etapa.descripcion}</p>

              <div className="space-y-3 min-h-[80px]">
                {leadsDeEtapa.length === 0 && (
                  <div className="text-xs text-slate-400 border border-dashed border-slate-300 rounded-lg p-4 text-center">
                    Sin registros en esta etapa
                  </div>
                )}
                {leadsDeEtapa.map((lead) => {
                  const curso = cursoPorId(lead.cursoId);
                  return (
                    <div key={lead.id} className="bg-white rounded-lg border border-slate-200 p-3 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 rounded-full bg-indigo-600 text-white text-xs font-semibold flex items-center justify-center shrink-0">
                          {iniciales(lead.nombre)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-slate-900 truncate">{lead.nombre}</p>
                          <p className="text-xs text-slate-500 truncate">{curso.nombre}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-sm font-semibold text-slate-700">${curso.precio}</span>
                        {etapa.key === "interesado" && (
                          <button onClick={() => onContactar(lead)} className="text-xs font-medium text-indigo-600 hover:text-indigo-800 inline-flex items-center gap-1">
                            Contactar <ArrowRight size={12} />
                          </button>
                        )}
                        {etapa.key === "contacto" && (
                          <button
                            onClick={() => onSimularCompra(lead)}
                            className="text-xs font-medium text-white bg-amber-500 hover:bg-amber-600 px-2.5 py-1.5 rounded-md inline-flex items-center gap-1"
                          >
                            <CreditCard size={12} /> Cobrar
                          </button>
                        )}
                        {etapa.key === "comprado" && (
                          <span className="text-xs font-medium text-emerald-600 inline-flex items-center gap-1">
                            <CheckCircle2 size={12} /> Alumno activo
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================================
// VISTA: CATÁLOGO DE CURSOS
// ============================================================================
function CoursesView({ cursos, leads, onCrear, onEliminar }) {
  const [nombre, setNombre] = useState("");
  const [precio, setPrecio] = useState("");

  function manejarSubmit(e) {
    e.preventDefault();
    if (!nombre.trim() || !precio) return;
    onCrear(nombre.trim(), precio);
    setNombre("");
    setPrecio("");
  }

  function alumnosDelCurso(cursoId) {
    return leads.filter((l) => l.cursoId === cursoId && l.etapa === "comprado").length;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Lista de cursos */}
      <div className="lg:col-span-2">
        <h2 className="font-semibold text-slate-800 mb-4">Catálogo de cursos</h2>
        <div className="space-y-2">
          {cursos.map((curso) => (
            <div key={curso.id} className="bg-white border border-slate-200 rounded-lg p-4 flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-3">
                <div className="bg-indigo-100 text-indigo-600 rounded-lg p-2">
                  <BookOpen size={18} />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900">{curso.nombre}</p>
                  <p className="text-xs text-slate-500">{alumnosDelCurso(curso.id)} alumno(s) inscrito(s)</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-slate-700">${curso.precio}</span>
                <button onClick={() => onEliminar(curso.id)} className="text-slate-400 hover:text-red-600 transition-colors">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
          {cursos.length === 0 && <p className="text-sm text-slate-400">Aún no hay cursos. Crea el primero →</p>}
        </div>
      </div>

      {/* Formulario nuevo curso */}
      <div>
        <h2 className="font-semibold text-slate-800 mb-4">Agregar curso</h2>
        <form onSubmit={manejarSubmit} className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-sm">
          <div>
            <label className="text-xs font-medium text-slate-600">Nombre del curso</label>
            <input
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej. Curso de Diseño UX"
              className="w-full mt-1 px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600">Precio (USD)</label>
            <input
              type="number"
              min="0"
              value={precio}
              onChange={(e) => setPrecio(e.target.value)}
              placeholder="99"
              className="w-full mt-1 px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <button type="submit" className="w-full inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium py-2.5 rounded-lg transition-colors">
            <Plus size={16} /> Agregar al catálogo
          </button>
        </form>
      </div>
    </div>
  );
}

// ============================================================================
// VISTA: ALUMNOS
// ============================================================================
function StudentsView({ alumnos, cursos, cursoPorId, onRegistrar }) {
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [cursoId, setCursoId] = useState(cursos[0]?.id || "");

  useEffect(() => {
    if (!cursoId && cursos.length) setCursoId(cursos[0].id);
  }, [cursos]);

  function manejarSubmit(e) {
    e.preventDefault();
    if (!nombre.trim() || !email.trim() || !cursoId) return;
    onRegistrar({ nombre: nombre.trim(), email: email.trim(), cursoId });
    setNombre("");
    setEmail("");
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Lista de alumnos */}
      <div className="lg:col-span-2">
        <h2 className="font-semibold text-slate-800 mb-4">Alumnos activos ({alumnos.length})</h2>
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm divide-y divide-slate-100">
          {alumnos.map((a) => (
            <div key={a.id} className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-700 text-xs font-semibold flex items-center justify-center">
                  {iniciales(a.nombre)}
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900">{a.nombre}</p>
                  <p className="text-xs text-slate-500">{a.email}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-slate-800">{cursoPorId(a.cursoId).nombre}</p>
                <p className="text-xs text-slate-400">Desde {a.fecha}</p>
              </div>
            </div>
          ))}
          {alumnos.length === 0 && <p className="text-sm text-slate-400 p-4">Todavía no hay alumnos registrados.</p>}
        </div>
      </div>

      {/* Formulario nuevo alumno */}
      <div>
        <h2 className="font-semibold text-slate-800 mb-4">Registrar alumno</h2>
        <form onSubmit={manejarSubmit} className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-sm">
          <div>
            <label className="text-xs font-medium text-slate-600">Nombre</label>
            <div className="relative mt-1">
              <User size={15} className="absolute left-3 top-2.5 text-slate-400" />
              <input
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Nombre completo"
                className="w-full pl-8 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600">Correo</label>
            <div className="relative mt-1">
              <Mail size={15} className="absolute left-3 top-2.5 text-slate-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="correo@ejemplo.com"
                className="w-full pl-8 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600">Curso</label>
            <select
              value={cursoId}
              onChange={(e) => setCursoId(e.target.value)}
              className="w-full mt-1 px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {cursos.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre} — ${c.precio}
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            disabled={cursos.length === 0}
            className="w-full inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm font-medium py-2.5 rounded-lg transition-colors"
          >
            <CreditCard size={16} /> Registrar y cobrar
          </button>
        </form>
      </div>
    </div>
  );
}

// ============================================================================
// MODAL DE PAGO — simula el checkout de Stripe
// ============================================================================
function PaymentModal({ datos, onCerrar, onExito }) {
  const [paso, setPaso] = useState("formulario"); // formulario | procesando | exito
  const [numero, setNumero] = useState("");
  const [nombreTarjeta, setNombreTarjeta] = useState("");
  const [vencimiento, setVencimiento] = useState("");
  const [cvc, setCvc] = useState("");
  const [error, setError] = useState("");

  function formatearNumero(valor) {
    return valor
      .replace(/\D/g, "")
      .slice(0, 16)
      .replace(/(.{4})/g, "$1 ")
      .trim();
  }
  function formatearVencimiento(valor) {
    const limpio = valor.replace(/\D/g, "").slice(0, 4);
    if (limpio.length <= 2) return limpio;
    return `${limpio.slice(0, 2)}/${limpio.slice(2)}`;
  }

  function manejarSubmit(e) {
    e.preventDefault();
    const digitos = numero.replace(/\s/g, "");
    if (digitos.length < 12 || !nombreTarjeta.trim() || vencimiento.length < 4 || cvc.length < 3) {
      setError("Revisa los datos de la tarjeta");
      return;
    }
    setError("");
    setPaso("procesando");
    // Simula la llamada real a Stripe (Payment Intent + confirmación)
    setTimeout(() => {
      setPaso("exito");
      setTimeout(() => onExito(), 1100);
    }, 1500);
  }

  return (
    <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 relative">
        {paso === "formulario" && (
          <button onClick={onCerrar} className="absolute top-4 right-4 text-slate-400 hover:text-slate-700">
            <X size={18} />
          </button>
        )}

        {paso === "formulario" && (
          <>
            <div className="flex items-center gap-2 mb-1">
              <CreditCard size={18} className="text-indigo-600" />
              <h3 className="font-semibold text-slate-900">Pago con tarjeta</h3>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              {datos.nombre} — {datos.curso.nombre}
            </p>
            <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 mb-4 flex items-center justify-between">
              <span className="text-xs text-slate-500">Total a cobrar</span>
              <span className="text-lg font-bold text-slate-900">${datos.curso.precio}</span>
            </div>

            <form onSubmit={manejarSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-600">Número de tarjeta</label>
                <input
                  value={numero}
                  onChange={(e) => setNumero(formatearNumero(e.target.value))}
                  placeholder="4242 4242 4242 4242"
                  className="w-full mt-1 px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600">Nombre en la tarjeta</label>
                <input
                  value={nombreTarjeta}
                  onChange={(e) => setNombreTarjeta(e.target.value)}
                  placeholder="Como aparece en la tarjeta"
                  className="w-full mt-1 px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="text-xs font-medium text-slate-600">Vencimiento</label>
                  <input
                    value={vencimiento}
                    onChange={(e) => setVencimiento(formatearVencimiento(e.target.value))}
                    placeholder="MM/AA"
                    className="w-full mt-1 px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-xs font-medium text-slate-600">CVC</label>
                  <input
                    value={cvc}
                    onChange={(e) => setCvc(e.target.value.replace(/\D/g, "").slice(0, 3))}
                    placeholder="123"
                    className="w-full mt-1 px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                  />
                </div>
              </div>

              {error && <p className="text-xs text-red-600">{error}</p>}

              <button type="submit" className="w-full inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium py-2.5 rounded-lg transition-colors">
                <Lock size={14} /> Pagar ${datos.curso.precio}
              </button>
              <p className="text-[10px] text-slate-400 text-center">Pago simulado — no se realiza ningún cargo real</p>
            </form>
          </>
        )}

        {paso === "procesando" && (
          <div className="py-10 flex flex-col items-center gap-3">
            <Loader2 size={28} className="animate-spin text-indigo-600" />
            <p className="text-sm text-slate-600">Procesando pago con Stripe…</p>
          </div>
        )}

        {paso === "exito" && (
          <div className="py-10 flex flex-col items-center gap-3">
            <CheckCircle2 size={32} className="text-emerald-500" />
            <p className="text-sm font-medium text-slate-800">¡Pago aprobado!</p>
            <p className="text-xs text-slate-500">Enviando acceso y correo de bienvenida…</p>
          </div>
        )}
      </div>
    </div>
  );
}

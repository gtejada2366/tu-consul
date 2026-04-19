import { Link } from "react-router";
import { useAuth } from "../contexts/auth-context";
import { Navigate } from "react-router";
import {
  Calendar, Users, FileCheck, BarChart3, MessageCircle,
  Globe, Shield, Check, ArrowRight, Star, Stethoscope, ChevronRight,
  ClipboardX, CalendarX, Receipt,
} from "lucide-react";
import { SUBSCRIPTION_PLANS } from "../lib/constants";

export function Landing() {
  const { session, loading } = useAuth();

  // If already logged in, go to agenda
  if (!loading && session) {
    return <Navigate to="/agenda" replace />;
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center">
              <span className="text-white font-bold text-sm">TC</span>
            </div>
            <span className="text-xl font-bold text-gray-900">Tu Consul</span>
          </div>
          <div className="flex items-center gap-3">
            <a href="#precios" className="hidden sm:inline-block text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
              Precios
            </a>
            <a href="#funciones" className="hidden sm:inline-block text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
              Funciones
            </a>
            <Link
              to="/login"
              className="text-sm font-medium text-gray-700 hover:text-gray-900 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Iniciar Sesión
            </Link>
            <Link
              to="/login"
              className="text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 px-5 py-2.5 rounded-xl transition-colors"
            >
              Prueba Gratis
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-indigo-50"></div>
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-16 sm:pt-24 pb-16 sm:pb-20">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-full px-4 py-1.5 mb-6">
              <Star className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-700">Software #1 para clínicas dentales en Perú</span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 leading-tight mb-6">
              Factura más y pierde menos pacientes
            </h1>
            <p className="text-lg sm:text-xl text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed">
              Agenda inteligente, facturación SUNAT integrada y reservas online.
              Todo lo que tu clínica dental necesita en un solo lugar.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/login"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 text-base font-semibold text-white bg-blue-600 hover:bg-blue-700 px-8 py-4 rounded-2xl transition-all shadow-lg shadow-blue-600/25 hover:shadow-blue-600/40"
              >
                Empieza Gratis <ArrowRight className="w-5 h-5" />
              </Link>
              <a
                href="#funciones"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 text-base font-medium text-gray-700 bg-white hover:bg-gray-50 px-8 py-4 rounded-2xl transition-all border border-gray-200"
              >
                Ver funciones
              </a>
            </div>
            <p className="mt-5 text-sm text-gray-500">
              Sin tarjeta de crédito. Configuración en 3 minutos.
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 max-w-lg mx-auto mt-16">
            {[
              { n: "500+", label: "Citas gestionadas" },
              { n: "99.9%", label: "Disponibilidad" },
              { n: "3 min", label: "Para configurar" },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-2xl sm:text-3xl font-bold text-gray-900">{s.n}</p>
                <p className="text-xs sm:text-sm text-gray-500 mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pain Points */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
              ¿Te suena familiar?
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {[
              {
                icon: ClipboardX,
                title: "Agendas en papel o Excel",
                desc: "Pacientes que se cruzan, horarios que no cuadran, citas que se pierden.",
              },
              {
                icon: CalendarX,
                title: "Pacientes que no llegan",
                desc: "Sin recordatorios automáticos, el 30% de citas se pierden por inasistencia.",
              },
              {
                icon: Receipt,
                title: "SUNAT es un dolor de cabeza",
                desc: "Emitir boletas electrónicas con otro sistema que no se conecta con nada.",
              },
            ].map((p) => (
              <div key={p.title} className="p-6 rounded-2xl bg-white border border-gray-200">
                <div className="w-10 h-10 rounded-lg bg-red-50 text-red-600 flex items-center justify-center mb-4">
                  <p.icon className="w-5 h-5" />
                </div>
                <h3 className="text-base font-semibold text-gray-900 mb-2">{p.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="funciones" className="py-16 sm:py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
              Todo lo que necesitas, nada que no
            </h2>
            <p className="text-base text-gray-600 max-w-xl mx-auto">
              Diseñado específicamente para clínicas dentales en Perú.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: Calendar,
                title: "Agenda Inteligente",
                desc: "Gestiona citas de múltiples doctores. Vista diaria con estados en tiempo real.",
                color: "bg-blue-100 text-blue-600",
              },
              {
                icon: Globe,
                title: "Reserva Online",
                desc: "Link público para que tus pacientes reserven desde Instagram o WhatsApp. 24/7.",
                color: "bg-green-100 text-green-600",
              },
              {
                icon: FileCheck,
                title: "Facturación SUNAT",
                desc: "Emite boletas y facturas electrónicas directo desde el sistema. 100% integrado.",
                color: "bg-violet-100 text-violet-600",
              },
              {
                icon: Users,
                title: "Historia Clínica Digital",
                desc: "Odontograma interactivo, recetas, resultados de lab. Todo en un perfil.",
                color: "bg-amber-100 text-amber-600",
              },
              {
                icon: BarChart3,
                title: "Reportes Financieros",
                desc: "Sabe cuánto facturas, qué servicio rinde más y qué doctor produce más.",
                color: "bg-emerald-100 text-emerald-600",
              },
              {
                icon: MessageCircle,
                title: "Campañas WhatsApp",
                desc: "Envía promociones segmentadas a tus pacientes por WhatsApp.",
                color: "bg-pink-100 text-pink-600",
              },
            ].map((f) => (
              <div key={f.title} className="bg-white rounded-2xl p-6 border border-gray-100 hover:shadow-md transition-shadow">
                <div className={`w-12 h-12 rounded-xl ${f.color} flex items-center justify-center mb-4`}>
                  <f.icon className="w-6 h-6" />
                </div>
                <h3 className="text-base font-semibold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
              Configura tu clínica en 3 minutos
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-3xl mx-auto">
            {[
              { step: "1", title: "Crea tu cuenta", desc: "Regístrate gratis. Sin tarjeta de crédito." },
              { step: "2", title: "Configura tu clínica", desc: "El asistente te guía: horarios, servicios y precios." },
              { step: "3", title: "Empieza a atender", desc: "Agenda citas, comparte tu link de reservas y factura." },
            ].map((s) => (
              <div key={s.step} className="text-center">
                <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center text-xl font-bold mx-auto mb-4">
                  {s.step}
                </div>
                <h3 className="text-base font-semibold text-gray-900 mb-2">{s.title}</h3>
                <p className="text-sm text-gray-600">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="precios" className="py-16 sm:py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
              Planes simples, sin sorpresas
            </h2>
            <p className="text-base text-gray-600">
              Empieza gratis. Escala cuando lo necesites.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {SUBSCRIPTION_PLANS.map((plan) => (
              <div
                key={plan.key}
                className={`relative rounded-2xl p-6 bg-white ${
                  plan.key === "premium"
                    ? "border-2 border-blue-600 shadow-lg shadow-blue-600/10"
                    : "border border-gray-200"
                }`}
              >
                {plan.key === "premium" && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-blue-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
                      Más Popular
                    </span>
                  </div>
                )}
                <h3 className="text-lg font-semibold mb-1 text-gray-900">
                  {plan.name}
                </h3>
                <div className="mb-5">
                  <span className="text-4xl font-extrabold text-gray-900">
                    S/{plan.price}
                  </span>
                  <span className="text-sm text-gray-500">/mes</span>
                </div>
                <ul className="space-y-3 mb-6">
                  {plan.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <Check className="w-4 h-4 mt-0.5 shrink-0 text-blue-600" />
                      <span className="text-gray-600">{f}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  to="/login"
                  className={`block w-full text-center text-sm font-semibold py-3 rounded-xl transition-colors ${
                    plan.key === "premium"
                      ? "bg-blue-600 text-white hover:bg-blue-700"
                      : plan.key === "basic"
                      ? "bg-gray-900 text-white hover:bg-gray-800"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {plan.key === "free" ? "Empieza Gratis" : `Elegir ${plan.name}`}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonial / Social Proof */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="max-w-2xl mx-auto text-center">
            <Stethoscope className="w-10 h-10 text-blue-600 mx-auto mb-6" />
            <blockquote className="text-xl sm:text-2xl font-medium text-gray-900 leading-relaxed mb-6">
              "Antes perdía 3-4 pacientes por semana porque se olvidaban de su cita.
              Con Tu Consul y las reservas online, mi agenda está siempre llena."
            </blockquote>
            <div>
              <p className="text-sm font-semibold text-gray-900">Dra. María López</p>
              <p className="text-sm text-gray-500">Clínica Dental Sonrisa, Lima</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 sm:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="bg-blue-600 rounded-3xl p-8 sm:p-14 text-center">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
              Empieza hoy. Es gratis.
            </h2>
            <p className="text-base text-blue-200 mb-8 max-w-lg mx-auto">
              Configura tu clínica en 3 minutos y empieza a agendar citas hoy mismo.
              Sin compromiso, sin tarjeta de crédito.
            </p>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-base font-semibold text-blue-600 bg-white hover:bg-blue-50 px-8 py-4 rounded-2xl transition-colors"
            >
              Crear mi cuenta gratis <ChevronRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-8 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center">
              <span className="text-white font-bold text-xs">TC</span>
            </div>
            <span className="text-sm font-semibold text-gray-900">Tu Consul</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-gray-500">
            <a href="#funciones" className="hover:text-gray-700 transition-colors">Funciones</a>
            <a href="#precios" className="hover:text-gray-700 transition-colors">Precios</a>
            <Link to="/login" className="hover:text-gray-700 transition-colors">Iniciar Sesión</Link>
          </div>
          <p className="text-xs text-gray-400">© 2026 Tu Consul. Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  );
}

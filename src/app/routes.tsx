import { lazy, Suspense } from "react";
import { createBrowserRouter } from "react-router";
import { RootLayout } from "./layouts/root-layout";
import { Login } from "./pages/auth/login";
import { Loading } from "./components/ui/loading";

const Landing = lazy(() => import("./pages/landing").then(m => ({ default: m.Landing })));
const Agenda = lazy(() => import("./pages/agenda").then(m => ({ default: m.Agenda })));
const Doctors = lazy(() => import("./pages/doctors").then(m => ({ default: m.Doctors })));
const DoctorDetail = lazy(() => import("./pages/doctors/doctor-detail").then(m => ({ default: m.DoctorDetail })));
const Patients = lazy(() => import("./pages/patients").then(m => ({ default: m.Patients })));
const PatientDetail = lazy(() => import("./pages/patients/patient-detail").then(m => ({ default: m.PatientDetail })));
const MedicalHistory = lazy(() => import("./pages/medical-history").then(m => ({ default: m.MedicalHistory })));
const Laboratory = lazy(() => import("./pages/laboratory").then(m => ({ default: m.Laboratory })));
const Campaigns = lazy(() => import("./pages/campaigns").then(m => ({ default: m.Campaigns })));
const Billing = lazy(() => import("./pages/billing").then(m => ({ default: m.Billing })));
const Comprobantes = lazy(() => import("./pages/comprobantes").then(m => ({ default: m.Comprobantes })));
const Reports = lazy(() => import("./pages/reports").then(m => ({ default: m.Reports })));
const Settings = lazy(() => import("./pages/settings").then(m => ({ default: m.Settings })));
const Booking = lazy(() => import("./pages/booking").then(m => ({ default: m.Booking })));
const NotFound = lazy(() => import("./pages/not-found").then(m => ({ default: m.NotFound })));

function LazyPage({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<Loading />}>{children}</Suspense>;
}

export const router = createBrowserRouter([
  // Public routes
  {
    path: "/",
    element: <LazyPage><Landing /></LazyPage>,
  },
  {
    path: "/login",
    Component: Login,
  },
  {
    path: "/reservar/:clinicId",
    element: <LazyPage><Booking /></LazyPage>,
  },
  // Protected app routes (with sidebar + topbar)
  {
    Component: RootLayout,
    children: [
      { path: "/agenda", element: <LazyPage><Agenda /></LazyPage> },
      { path: "/doctores", element: <LazyPage><Doctors /></LazyPage> },
      { path: "/doctores/:id", element: <LazyPage><DoctorDetail /></LazyPage> },
      { path: "/pacientes", element: <LazyPage><Patients /></LazyPage> },
      { path: "/pacientes/:id", element: <LazyPage><PatientDetail /></LazyPage> },
      { path: "/historia-clinica/:id", element: <LazyPage><MedicalHistory /></LazyPage> },
      { path: "/laboratorio", element: <LazyPage><Laboratory /></LazyPage> },
      { path: "/campanas", element: <LazyPage><Campaigns /></LazyPage> },
      { path: "/facturacion", element: <LazyPage><Billing /></LazyPage> },
      { path: "/comprobantes", element: <LazyPage><Comprobantes /></LazyPage> },
      { path: "/reportes", element: <LazyPage><Reports /></LazyPage> },
      { path: "/configuracion", element: <LazyPage><Settings /></LazyPage> },
    ],
  },
  {
    path: "*",
    element: <LazyPage><NotFound /></LazyPage>,
  },
]);

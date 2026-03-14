import { createBrowserRouter } from "react-router";
import { RootLayout } from "./layouts/root-layout";
import { Login } from "./pages/auth/login";
import { Dashboard } from "./pages/dashboard";
import { Agenda } from "./pages/agenda";
import { Doctors } from "./pages/doctors";
import { DoctorDetail } from "./pages/doctors/doctor-detail";
import { Patients } from "./pages/patients";
import { PatientDetail } from "./pages/patients/patient-detail";
import { MedicalHistory } from "./pages/medical-history";
import { Laboratory } from "./pages/laboratory";
import { Campaigns } from "./pages/campaigns";
import { Billing } from "./pages/billing";
import { Settings } from "./pages/settings";
import { NotFound } from "./pages/not-found";

export const router = createBrowserRouter([
  {
    path: "/login",
    Component: Login,
  },
  {
    path: "/",
    Component: RootLayout,
    children: [
      { index: true, Component: Dashboard },
      { path: "agenda", Component: Agenda },
      { path: "doctores", Component: Doctors },
      { path: "doctores/:id", Component: DoctorDetail },
      { path: "pacientes", Component: Patients },
      { path: "pacientes/:id", Component: PatientDetail },
      { path: "historia-clinica/:id", Component: MedicalHistory },
      { path: "laboratorio", Component: Laboratory },
      { path: "campanas", Component: Campaigns },
      { path: "facturacion", Component: Billing },
      { path: "configuracion", Component: Settings },
    ],
  },
  {
    path: "*",
    Component: NotFound,
  },
]);

import { createBrowserRouter } from "react-router";
import { RootLayout } from "./layouts/root-layout";
import { Login } from "./pages/auth/login";
import { Dashboard } from "./pages/dashboard";
import { Agenda } from "./pages/agenda";
import { Patients } from "./pages/patients";
import { PatientDetail } from "./pages/patients/patient-detail";
import { MedicalHistory } from "./pages/medical-history";
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
      { path: "pacientes", Component: Patients },
      { path: "pacientes/:id", Component: PatientDetail },
      { path: "historia-clinica/:id", Component: MedicalHistory },
      { path: "facturacion", Component: Billing },
      { path: "configuracion", Component: Settings },
    ],
  },
  {
    path: "*",
    Component: NotFound,
  },
]);

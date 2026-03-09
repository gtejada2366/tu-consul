import { useState } from "react";
import { toast } from "sonner";
import { Card, CardHeader, CardContent, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Loading } from "../components/ui/loading";
import {
  Building2,
  Users,
  Clock,
  Bell,
  CreditCard,
  Shield,
  Save
} from "lucide-react";
import { useAuth } from "../contexts/auth-context";
import { useClinicUsers, useClinicSchedules, useNotificationPreferences, useClinicMutations } from "../hooks/use-clinic";
import { supabase } from "../lib/supabase";

const settingsTabs = [
  { id: "clinic", label: "Clínica", icon: Building2 },
  { id: "users", label: "Usuarios", icon: Users },
  { id: "schedule", label: "Horarios", icon: Clock },
  { id: "notifications", label: "Notificaciones", icon: Bell },
  { id: "billing", label: "Facturación", icon: CreditCard },
  { id: "security", label: "Seguridad", icon: Shield },
];

const dayNames = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

export function Settings() {
  const { clinic, user } = useAuth();
  const { users: clinicUsers, loading: usersLoading } = useClinicUsers();
  const { schedules, loading: schedulesLoading, saveSchedules } = useClinicSchedules();
  const { prefs, loading: prefsLoading, updatePrefs } = useNotificationPreferences();
  const { updateClinic } = useClinicMutations();
  const [activeTab, setActiveTab] = useState("clinic");

  // Clinic form state
  const [clinicName, setClinicName] = useState(clinic?.name || "");
  const [clinicEmail, setClinicEmail] = useState(clinic?.email || "");
  const [clinicPhone, setClinicPhone] = useState(clinic?.phone || "");
  const [clinicAddress, setClinicAddress] = useState(clinic?.address || "");

  // Password form state
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  async function handleSaveClinic() {
    const { error } = await updateClinic({
      name: clinicName,
      email: clinicEmail,
      phone: clinicPhone,
      address: clinicAddress,
    });
    if (error) {
      toast.error("Error al guardar: " + error);
    } else {
      toast.success("Cambios guardados correctamente");
    }
  }

  async function handleChangePassword() {
    if (newPassword !== confirmPassword) {
      toast.error("Las contraseñas no coinciden");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("La contraseña debe tener al menos 6 caracteres");
      return;
    }
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      toast.error("Error: " + error.message);
    } else {
      toast.success("Contraseña actualizada correctamente");
      setNewPassword("");
      setConfirmPassword("");
    }
  }

  const roleLabels: Record<string, string> = {
    admin: "Administrador",
    doctor: "Médico",
    receptionist: "Recepción",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-[1.5rem] md:text-[1.75rem] font-semibold text-foreground">
          Configuración
        </h1>
        <p className="text-[0.875rem] text-foreground-secondary mt-1">
          Gestiona la configuración de tu clínica
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Tabs - horizontal scroll on mobile, vertical on desktop */}
        <Card className="lg:col-span-1 h-fit">
          <CardContent className="p-2 lg:p-3">
            <nav className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-x-visible pb-1 lg:pb-0 scrollbar-hide">
              {settingsTabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                      flex items-center gap-2 lg:gap-3 px-3 py-2 lg:py-2.5 rounded-[10px]
                      transition-all duration-150 text-left whitespace-nowrap flex-shrink-0 lg:w-full
                      ${activeTab === tab.id
                        ? "bg-primary text-white"
                        : "text-foreground-secondary hover:bg-surface-alt hover:text-foreground"
                      }
                    `}
                  >
                    <Icon className="w-4 h-4 lg:w-5 lg:h-5" />
                    <span className="text-[0.8125rem] lg:text-[0.875rem] font-medium">
                      {tab.label}
                    </span>
                  </button>
                );
              })}
            </nav>
          </CardContent>
        </Card>

        {/* Content */}
        <div className="lg:col-span-3 space-y-6">
          {activeTab === "clinic" && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Información de la Clínica</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Input
                    label="Nombre de la Clínica"
                    value={clinicName}
                    onChange={(e) => setClinicName(e.target.value)}
                  />
                  <Input
                    label="Email de Contacto"
                    type="email"
                    value={clinicEmail}
                    onChange={(e) => setClinicEmail(e.target.value)}
                  />
                  <Input
                    label="Teléfono"
                    type="tel"
                    value={clinicPhone}
                    onChange={(e) => setClinicPhone(e.target.value)}
                  />
                  <Input
                    label="Dirección"
                    value={clinicAddress}
                    onChange={(e) => setClinicAddress(e.target.value)}
                  />
                  <div className="pt-4">
                    <Button variant="primary" onClick={handleSaveClinic}>
                      <Save className="w-4 h-4 mr-2" />
                      Guardar Cambios
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Especialidades</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 mb-4">
                    {(clinic?.specialties || []).map((specialty) => (
                      <div
                        key={specialty}
                        className="flex items-center justify-between p-3 bg-surface-alt rounded-[10px]"
                      >
                        <span className="text-[0.875rem] text-foreground">{specialty}</span>
                        <Button variant="ghost" size="sm" onClick={() => toast.info(`Editando: ${specialty}`)}>
                          Editar
                        </Button>
                      </div>
                    ))}
                  </div>
                  <Button variant="tertiary" onClick={() => toast.info("Próximamente: Agregar especialidad")}>
                    Agregar Especialidad
                  </Button>
                </CardContent>
              </Card>
            </>
          )}

          {activeTab === "users" && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Usuarios y Roles</CardTitle>
                  <Button variant="primary" size="sm" onClick={() => toast.info("Próximamente: Invitar usuario")}>
                    Invitar Usuario
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {usersLoading ? (
                  <Loading />
                ) : (
                  <div className="space-y-3">
                    {clinicUsers.map((u) => (
                      <div
                        key={u.id}
                        className="flex items-center justify-between p-4 bg-surface-alt rounded-[10px]"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-sm font-semibold text-primary">
                              {u.full_name.split(' ').map(n => n[0]).join('')}
                            </span>
                          </div>
                          <div>
                            <p className="font-semibold text-foreground text-[0.875rem]">
                              {u.full_name}
                            </p>
                            <p className="text-[0.75rem] text-foreground-secondary">
                              {u.email} • {roleLabels[u.role] || u.role}
                            </p>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => toast.info(`Editando usuario: ${u.full_name}`)}>
                          Editar
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {activeTab === "schedule" && (
            <Card>
              <CardHeader>
                <CardTitle>Horarios de Atención</CardTitle>
              </CardHeader>
              <CardContent>
                {schedulesLoading ? (
                  <Loading />
                ) : (
                  <div className="space-y-4">
                    {dayNames.map((day, index) => {
                      const schedule = schedules.find(s => s.day_of_week === index);
                      return (
                        <div key={day} className="flex items-center gap-4">
                          <div className="w-32">
                            <label className="text-[0.875rem] font-medium text-foreground">
                              {day}
                            </label>
                          </div>
                          <div className="flex items-center gap-2 flex-1">
                            <input
                              type="time"
                              defaultValue={schedule?.start_time?.slice(0, 5) || "09:00"}
                              className="h-10 px-3 bg-surface border border-border rounded-[10px]
                                text-[0.875rem] text-foreground
                                focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                            />
                            <span className="text-foreground-secondary">a</span>
                            <input
                              type="time"
                              defaultValue={schedule?.end_time?.slice(0, 5) || "18:00"}
                              className="h-10 px-3 bg-surface border border-border rounded-[10px]
                                text-[0.875rem] text-foreground
                                focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                            />
                          </div>
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              defaultChecked={schedule?.is_active ?? true}
                              className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                            />
                            <span className="text-[0.75rem] text-foreground-secondary">Activo</span>
                          </label>
                        </div>
                      );
                    })}
                    <div className="pt-4">
                      <Button variant="primary" onClick={() => toast.success("Horarios guardados correctamente")}>
                        <Save className="w-4 h-4 mr-2" />
                        Guardar Horarios
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {activeTab === "notifications" && (
            <Card>
              <CardHeader>
                <CardTitle>Preferencias de Notificaciones</CardTitle>
              </CardHeader>
              <CardContent>
                {prefsLoading ? (
                  <Loading />
                ) : (
                  <div className="space-y-4">
                    {[
                      { key: "new_appointments", label: "Nuevas citas", description: "Recibir notificación cuando se agenda una nueva cita" },
                      { key: "appointment_reminders", label: "Recordatorios de citas", description: "Recordatorios 24 horas antes de cada cita" },
                      { key: "appointment_changes", label: "Cambios en citas", description: "Notificar cuando se modifica o cancela una cita" },
                      { key: "patient_messages", label: "Mensajes de pacientes", description: "Alertas de nuevos mensajes de pacientes" },
                      { key: "system_updates", label: "Actualizaciones del sistema", description: "Novedades y mejoras de Tu Consul" },
                    ].map((item) => (
                      <div
                        key={item.key}
                        className="flex items-start justify-between p-4 bg-surface-alt rounded-[10px]"
                      >
                        <div className="flex-1">
                          <p className="font-semibold text-foreground text-[0.875rem] mb-1">
                            {item.label}
                          </p>
                          <p className="text-[0.75rem] text-foreground-secondary">
                            {item.description}
                          </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            defaultChecked={prefs ? (prefs as unknown as Record<string, boolean>)[item.key] : false}
                            onChange={(e) => updatePrefs({ [item.key]: e.target.checked })}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-border peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                        </label>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {activeTab === "billing" && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Plan Actual</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="p-6 bg-gradient-to-r from-primary/10 to-primary/5 rounded-[12px] border border-primary/20">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-[1.375rem] font-semibold text-foreground mb-1">
                          {clinic?.plan === "premium" ? "Plan Premium" : clinic?.plan === "basic" ? "Plan Básico" : "Plan Gratuito"}
                        </h3>
                        <p className="text-[0.875rem] text-foreground-secondary">
                          Acceso completo a todas las funcionalidades
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[1.75rem] font-semibold text-primary">
                          {clinic?.plan === "premium" ? "$99" : clinic?.plan === "basic" ? "$49" : "$0"}
                        </p>
                        <p className="text-[0.75rem] text-foreground-secondary">
                          por mes
                        </p>
                      </div>
                    </div>
                    <div className="space-y-2 mb-4">
                      {[
                        "Usuarios ilimitados",
                        "Pacientes ilimitados",
                        "Agenda avanzada",
                        "Reportes y analytics",
                        "Soporte prioritario"
                      ].map((feature, index) => (
                        <div key={index} className="flex items-center gap-2 text-[0.875rem] text-foreground">
                          <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>
                    {clinic?.plan_expires_at && (
                      <p className="text-[0.75rem] text-foreground-secondary">
                        Próximo cobro: {new Date(clinic.plan_expires_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Métodos de Pago</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 mb-4">
                    <div className="flex items-center justify-between p-4 bg-surface-alt rounded-[10px]">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-[8px] bg-primary/10 flex items-center justify-center">
                          <CreditCard className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-semibold text-foreground text-[0.875rem]">
                            •••• •••• •••• 4242
                          </p>
                          <p className="text-[0.75rem] text-foreground-secondary">
                            Vence 12/2027
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[0.75rem] font-medium text-success bg-success/10 px-2 py-1 rounded-[999px]">
                          Por defecto
                        </span>
                        <Button variant="ghost" size="sm" onClick={() => toast.info("Próximamente: Editar método de pago")}>
                          Editar
                        </Button>
                      </div>
                    </div>
                  </div>
                  <Button variant="tertiary" onClick={() => toast.info("Próximamente: Agregar método de pago")}>
                    Agregar Método de Pago
                  </Button>
                </CardContent>
              </Card>
            </>
          )}

          {activeTab === "security" && (
            <Card>
              <CardHeader>
                <CardTitle>Seguridad</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  label="Nueva Contraseña"
                  type="password"
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
                <Input
                  label="Confirmar Nueva Contraseña"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
                <div className="pt-4 flex items-center gap-3">
                  <Button variant="primary" onClick={handleChangePassword}>
                    Cambiar Contraseña
                  </Button>
                  <Button variant="tertiary" onClick={() => toast.info("Próximamente: Autenticación de dos factores")}>
                    Habilitar 2FA
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

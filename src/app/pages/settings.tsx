import { useState } from "react";
import { toast } from "sonner";
import { Card, CardHeader, CardContent, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import { Loading } from "../components/ui/loading";
import { Modal } from "../components/ui/modal";
import {
  Building2,
  Users,
  Clock,
  Bell,
  CreditCard,
  Shield,
  Save,
  Plus,
  User as UserIcon,
} from "lucide-react";
import { useAuth } from "../contexts/auth-context";
import { useClinicUsers, useClinicSchedules, useNotificationPreferences, useClinicMutations, useUserMutations } from "../hooks/use-clinic";
import { supabase } from "../lib/supabase";
import { inputClass, labelClass } from "../components/modals/form-classes";

// Tabs for admin
const adminTabs = [
  { id: "clinic", label: "Clínica", icon: Building2 },
  { id: "users", label: "Usuarios", icon: Users },
  { id: "schedule", label: "Horarios", icon: Clock },
  { id: "notifications", label: "Notificaciones", icon: Bell },
  { id: "billing", label: "Facturación", icon: CreditCard },
];

// Tabs for non-admin (doctor, receptionist)
const userTabs = [
  { id: "profile", label: "Perfil", icon: UserIcon },
  { id: "notifications", label: "Notificaciones", icon: Bell },
  { id: "security", label: "Seguridad", icon: Shield },
];

const dayNames = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

const roleLabels: Record<string, string> = {
  admin: "Administrador",
  doctor: "Médico",
  receptionist: "Recepción",
};

export function Settings() {
  const { clinic, user, refreshUser } = useAuth();
  const isAdmin = user?.role === "admin";
  const tabs = isAdmin ? adminTabs : userTabs;

  const { users: clinicUsers, loading: usersLoading, refetch: refetchUsers } = useClinicUsers();
  const { schedules, loading: schedulesLoading, saveSchedules } = useClinicSchedules();
  const { prefs, loading: prefsLoading, updatePrefs } = useNotificationPreferences();
  const { updateClinic } = useClinicMutations();
  const { createUser, updateUserRole, toggleUserActive } = useUserMutations();

  const [activeTab, setActiveTab] = useState(isAdmin ? "clinic" : "profile");

  // Clinic form state
  const [clinicName, setClinicName] = useState(clinic?.name || "");
  const [clinicEmail, setClinicEmail] = useState(clinic?.email || "");
  const [clinicPhone, setClinicPhone] = useState(clinic?.phone || "");
  const [clinicAddress, setClinicAddress] = useState(clinic?.address || "");

  // Schedule form state
  const [scheduleEdits, setScheduleEdits] = useState<Record<number, { start_time: string; end_time: string; is_active: boolean }>>({});

  function getScheduleValue(dayIndex: number, field: "start_time" | "end_time" | "is_active") {
    const edit = scheduleEdits[dayIndex];
    const schedule = schedules.find(s => s.day_of_week === dayIndex);
    if (edit && field in edit) return edit[field];
    if (field === "start_time") return schedule?.start_time?.slice(0, 5) || "09:00";
    if (field === "end_time") return schedule?.end_time?.slice(0, 5) || "18:00";
    return schedule?.is_active ?? true;
  }

  function updateScheduleField(dayIndex: number, field: string, value: string | boolean) {
    setScheduleEdits(prev => ({
      ...prev,
      [dayIndex]: { ...prev[dayIndex] || {}, [field]: value }
    }));
  }

  // Password form state
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Profile form state
  const [profileName, setProfileName] = useState(user?.full_name || "");
  const [profileSpecialty, setProfileSpecialty] = useState(user?.specialty || "");

  // Create user modal state
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [userForm, setUserForm] = useState({ full_name: "", email: "", password: "", role: "doctor" as "admin" | "doctor" | "receptionist", specialty: "" });
  const [saving, setSaving] = useState(false);

  async function handleSaveClinic() {
    const { error } = await updateClinic({
      name: clinicName, email: clinicEmail, phone: clinicPhone, address: clinicAddress,
    });
    if (error) toast.error("Error al guardar: " + error);
    else toast.success("Cambios guardados correctamente");
  }

  async function handleChangePassword() {
    if (newPassword !== confirmPassword) { toast.error("Las contraseñas no coinciden"); return; }
    if (newPassword.length < 6) { toast.error("La contraseña debe tener al menos 6 caracteres"); return; }
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) toast.error("Error: " + error.message);
    else { toast.success("Contraseña actualizada"); setNewPassword(""); setConfirmPassword(""); }
  }

  async function handleSaveProfile() {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("users")
      .update({ full_name: profileName, specialty: profileSpecialty || null, updated_at: new Date().toISOString() } as Record<string, unknown>)
      .eq("id", user.id);
    setSaving(false);
    if (error) toast.error("Error: " + error.message);
    else { toast.success("Perfil actualizado"); refreshUser(); }
  }

  async function handleCreateUser(e: React.FormEvent) {
    e.preventDefault();
    if (!userForm.full_name.trim() || !userForm.email.trim() || !userForm.password) {
      toast.error("Nombre, email y contraseña son obligatorios"); return;
    }
    if (userForm.password.length < 6) { toast.error("La contraseña debe tener al menos 6 caracteres"); return; }
    setSaving(true);
    const { error } = await createUser({
      full_name: userForm.full_name.trim(),
      email: userForm.email.trim().toLowerCase(),
      password: userForm.password,
      role: userForm.role,
      specialty: userForm.role === "doctor" ? userForm.specialty.trim() || undefined : undefined,
    });
    setSaving(false);
    if (error) toast.error(error);
    else {
      toast.success(`Usuario "${userForm.full_name}" creado`);
      setShowCreateUser(false);
      setUserForm({ full_name: "", email: "", password: "", role: "doctor", specialty: "" });
      refetchUsers();
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[1.5rem] md:text-[1.75rem] font-semibold text-foreground">
          Configuración
        </h1>
        <p className="text-[0.875rem] text-foreground-secondary mt-1">
          {isAdmin ? "Gestiona la configuración de tu clínica" : "Gestiona tu perfil y preferencias"}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Tabs */}
        <Card className="lg:col-span-1 h-fit">
          <CardContent className="p-2 lg:p-3">
            <nav className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-x-visible pb-1 lg:pb-0 scrollbar-hide">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 lg:gap-3 px-3 py-2 lg:py-2.5 rounded-[10px]
                      transition-all duration-150 text-left whitespace-nowrap flex-shrink-0 lg:w-full
                      ${activeTab === tab.id ? "bg-primary text-white" : "text-foreground-secondary hover:bg-surface-alt hover:text-foreground"}`}>
                    <Icon className="w-4 h-4 lg:w-5 lg:h-5" />
                    <span className="text-[0.8125rem] lg:text-[0.875rem] font-medium">{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </CardContent>
        </Card>

        {/* Content */}
        <div className="lg:col-span-3 space-y-6">

          {/* ===== PROFILE TAB (non-admin) ===== */}
          {activeTab === "profile" && (
            <>
              <Card>
                <CardHeader><CardTitle>Datos Personales</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <Input label="Nombre Completo" value={profileName} onChange={(e) => setProfileName(e.target.value)} />
                  <Input label="Email" value={user?.email || ""} disabled />
                  <Input label="Rol" value={roleLabels[user?.role || ""] || user?.role || ""} disabled />
                  {user?.role === "doctor" && (
                    <Input label="Especialidad" value={profileSpecialty} onChange={(e) => setProfileSpecialty(e.target.value)} placeholder="Ej: Odontología General" />
                  )}
                  <div className="pt-4">
                    <Button variant="primary" onClick={handleSaveProfile} disabled={saving}>
                      <Save className="w-4 h-4 mr-2" />{saving ? "Guardando..." : "Guardar Cambios"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {/* ===== CLINIC TAB (admin) ===== */}
          {activeTab === "clinic" && isAdmin && (
            <>
              <Card>
                <CardHeader><CardTitle>Información de la Clínica</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <Input label="Nombre de la Clínica" value={clinicName} onChange={(e) => setClinicName(e.target.value)} />
                  <Input label="Email de Contacto" type="email" value={clinicEmail} onChange={(e) => setClinicEmail(e.target.value)} />
                  <Input label="Teléfono" type="tel" value={clinicPhone} onChange={(e) => setClinicPhone(e.target.value)} />
                  <Input label="Dirección" value={clinicAddress} onChange={(e) => setClinicAddress(e.target.value)} />
                  <div className="pt-4">
                    <Button variant="primary" onClick={handleSaveClinic}><Save className="w-4 h-4 mr-2" />Guardar Cambios</Button>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle>Especialidades</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-2 mb-4">
                    {(clinic?.specialties || []).map((specialty) => (
                      <div key={specialty} className="flex items-center justify-between p-3 bg-surface-alt rounded-[10px]">
                        <span className="text-[0.875rem] text-foreground">{specialty}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {/* ===== USERS TAB (admin) ===== */}
          {activeTab === "users" && isAdmin && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Usuarios y Roles</CardTitle>
                  <Button variant="primary" size="sm" onClick={() => setShowCreateUser(true)}>
                    <Plus className="w-4 h-4 mr-1" />Agregar Usuario
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {usersLoading ? <Loading /> : (
                  <div className="space-y-3">
                    {clinicUsers.map((u) => (
                      <div key={u.id} className="flex items-center justify-between p-4 bg-surface-alt rounded-[10px]">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-sm font-semibold text-primary">
                              {u.full_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                            </span>
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-foreground text-[0.875rem]">{u.full_name}</p>
                              {!u.is_active && <Badge variant="danger">Inactivo</Badge>}
                            </div>
                            <p className="text-[0.75rem] text-foreground-secondary">
                              {u.email} • {roleLabels[u.role] || u.role}
                              {u.specialty ? ` • ${u.specialty}` : ""}
                            </p>
                          </div>
                        </div>
                        {u.id !== user?.id && (
                          <div className="flex items-center gap-2">
                            <select
                              className="h-8 px-2 text-[0.75rem] bg-surface border border-border rounded-[8px] text-foreground"
                              value={u.role}
                              onChange={async (e) => {
                                const { error } = await updateUserRole(u.id, e.target.value);
                                if (error) toast.error(error);
                                else { toast.success("Rol actualizado"); refetchUsers(); }
                              }}>
                              <option value="admin">Admin</option>
                              <option value="doctor">Médico</option>
                              <option value="receptionist">Recepción</option>
                            </select>
                            <Button variant={u.is_active ? "tertiary" : "primary"} size="sm"
                              onClick={async () => {
                                const { error } = await toggleUserActive(u.id, !u.is_active);
                                if (error) toast.error(error);
                                else { toast.success(u.is_active ? "Usuario desactivado" : "Usuario activado"); refetchUsers(); }
                              }}>
                              {u.is_active ? "Desactivar" : "Activar"}
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* ===== SCHEDULE TAB (admin) ===== */}
          {activeTab === "schedule" && isAdmin && (
            <Card>
              <CardHeader><CardTitle>Horarios de Atención</CardTitle></CardHeader>
              <CardContent>
                {schedulesLoading ? <Loading /> : (
                  <div className="space-y-4">
                    {dayNames.map((day, index) => (
                      <div key={day} className="flex items-center gap-4">
                        <div className="w-32">
                          <label className="text-[0.875rem] font-medium text-foreground">{day}</label>
                        </div>
                        <div className="flex items-center gap-2 flex-1">
                          <input type="time" value={getScheduleValue(index, "start_time") as string}
                            onChange={e => updateScheduleField(index, "start_time", e.target.value)}
                            className="h-10 px-3 bg-surface border border-border rounded-[10px] text-[0.875rem] text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" />
                          <span className="text-foreground-secondary">a</span>
                          <input type="time" value={getScheduleValue(index, "end_time") as string}
                            onChange={e => updateScheduleField(index, "end_time", e.target.value)}
                            className="h-10 px-3 bg-surface border border-border rounded-[10px] text-[0.875rem] text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" />
                        </div>
                        <label className="flex items-center gap-2">
                          <input type="checkbox" checked={getScheduleValue(index, "is_active") as boolean}
                            onChange={e => updateScheduleField(index, "is_active", e.target.checked)}
                            className="w-4 h-4 rounded border-border text-primary focus:ring-primary" />
                          <span className="text-[0.75rem] text-foreground-secondary">Activo</span>
                        </label>
                      </div>
                    ))}
                    <div className="pt-4">
                      <Button variant="primary" onClick={async () => {
                        const updated = dayNames.map((_, index) => {
                          const existing = schedules.find(s => s.day_of_week === index);
                          return {
                            ...(existing || {}),
                            day_of_week: index,
                            start_time: getScheduleValue(index, "start_time") as string,
                            end_time: getScheduleValue(index, "end_time") as string,
                            is_active: getScheduleValue(index, "is_active") as boolean,
                          };
                        });
                        const { error } = await saveSchedules(updated as any);
                        if (error) toast.error("Error al guardar: " + error);
                        else toast.success("Horarios guardados correctamente");
                      }}>
                        <Save className="w-4 h-4 mr-2" />Guardar Horarios
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* ===== NOTIFICATIONS TAB (everyone) ===== */}
          {activeTab === "notifications" && (
            <Card>
              <CardHeader><CardTitle>Preferencias de Notificaciones</CardTitle></CardHeader>
              <CardContent>
                {prefsLoading ? <Loading /> : (
                  <div className="space-y-4">
                    {[
                      { key: "new_appointments", label: "Nuevas citas", description: "Recibir notificación cuando se agenda una nueva cita" },
                      { key: "appointment_reminders", label: "Recordatorios de citas", description: "Recordatorios 24 horas antes de cada cita" },
                      { key: "appointment_changes", label: "Cambios en citas", description: "Notificar cuando se modifica o cancela una cita" },
                      { key: "patient_messages", label: "Mensajes de pacientes", description: "Alertas de nuevos mensajes de pacientes" },
                      { key: "system_updates", label: "Actualizaciones del sistema", description: "Novedades y mejoras de Tu Consul" },
                    ].map((item) => (
                      <div key={item.key} className="flex items-start justify-between p-4 bg-surface-alt rounded-[10px]">
                        <div className="flex-1">
                          <p className="font-semibold text-foreground text-[0.875rem] mb-1">{item.label}</p>
                          <p className="text-[0.75rem] text-foreground-secondary">{item.description}</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox"
                            defaultChecked={prefs ? (prefs as unknown as Record<string, boolean>)[item.key] : false}
                            onChange={async (e) => {
                              const { error } = await updatePrefs({ [item.key]: e.target.checked });
                              if (error) toast.error("Error al guardar preferencia");
                            }}
                            className="sr-only peer" />
                          <div className="w-11 h-6 bg-border peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                        </label>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* ===== BILLING TAB (admin) ===== */}
          {activeTab === "billing" && isAdmin && (
            <>
              <Card>
                <CardHeader><CardTitle>Plan Actual</CardTitle></CardHeader>
                <CardContent>
                  <div className="p-6 bg-gradient-to-r from-primary/10 to-primary/5 rounded-[12px] border border-primary/20">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-[1.375rem] font-semibold text-foreground mb-1">
                          {clinic?.plan === "premium" ? "Plan Premium" : clinic?.plan === "basic" ? "Plan Básico" : "Plan Gratuito"}
                        </h3>
                        <p className="text-[0.875rem] text-foreground-secondary">Acceso completo a todas las funcionalidades</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[1.75rem] font-semibold text-primary">
                          {clinic?.plan === "premium" ? "S/99" : clinic?.plan === "basic" ? "S/49" : "S/0"}
                        </p>
                        <p className="text-[0.75rem] text-foreground-secondary">por mes</p>
                      </div>
                    </div>
                    <div className="space-y-2 mb-4">
                      {["Usuarios ilimitados", "Pacientes ilimitados", "Agenda avanzada", "Reportes y analytics", "Soporte prioritario"].map((feature, index) => (
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
                <CardHeader><CardTitle>Métodos de Pago</CardTitle></CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <CreditCard className="w-12 h-12 text-foreground-secondary mx-auto mb-4 opacity-50" />
                    <p className="text-[0.875rem] text-foreground-secondary mb-1">No hay métodos de pago configurados</p>
                    <p className="text-[0.75rem] text-foreground-secondary mb-4">Los cobros se registran manualmente desde Facturación</p>
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {/* ===== SECURITY TAB (non-admin, password change) ===== */}
          {activeTab === "security" && (
            <Card>
              <CardHeader><CardTitle>Cambiar Contraseña</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <Input label="Nueva Contraseña" type="password" placeholder="••••••••" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                <Input label="Confirmar Nueva Contraseña" type="password" placeholder="••••••••" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                <div className="pt-4">
                  <Button variant="primary" onClick={handleChangePassword}>Cambiar Contraseña</Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Create User Modal */}
      <Modal open={showCreateUser} onClose={() => setShowCreateUser(false)} title="Agregar Usuario" size="md">
        <form onSubmit={handleCreateUser} className="space-y-4">
          <div>
            <label className={labelClass}>Nombre Completo *</label>
            <input className={inputClass} placeholder="Dr. Juan Pérez" value={userForm.full_name}
              onChange={e => setUserForm({ ...userForm, full_name: e.target.value })} />
          </div>
          <div>
            <label className={labelClass}>Email *</label>
            <input className={inputClass} type="email" placeholder="doctor@tuconsul.com" value={userForm.email}
              onChange={e => setUserForm({ ...userForm, email: e.target.value })} />
          </div>
          <div>
            <Input label="Contraseña *" type="password" placeholder="Mínimo 6 caracteres" value={userForm.password}
              onChange={e => setUserForm({ ...userForm, password: e.target.value })} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Rol *</label>
              <select className={inputClass} value={userForm.role}
                onChange={e => setUserForm({ ...userForm, role: e.target.value as "admin" | "doctor" | "receptionist" })}>
                <option value="doctor">Médico</option>
                <option value="receptionist">Recepción</option>
                <option value="admin">Administrador</option>
              </select>
            </div>
            {userForm.role === "doctor" && (
              <div>
                <label className={labelClass}>Especialidad</label>
                <input className={inputClass} placeholder="Ej: Ortodoncia" value={userForm.specialty}
                  onChange={e => setUserForm({ ...userForm, specialty: e.target.value })} />
              </div>
            )}
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button variant="tertiary" size="md" onClick={() => setShowCreateUser(false)} type="button">Cancelar</Button>
            <Button variant="primary" size="md" type="submit" disabled={saving}>{saving ? "Creando..." : "Crear Usuario"}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

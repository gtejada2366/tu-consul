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
  MapPin,
  Pencil,
  Tag,
  DollarSign,
  FileCheck,
  Upload,
  Check,
  Link2,
  Copy,
} from "lucide-react";
import { useAuth } from "../contexts/auth-context";
import { useClinicUsers, useClinicSchedules, useNotificationPreferences, useClinicMutations, useUserMutations, useClinicBranches, useClinicServices } from "../hooks/use-clinic";
import { supabase } from "../lib/supabase";
import { inputClass, labelClass } from "../components/modals/form-classes";
import type { ClinicBranch, ClinicService, ClinicSchedule, ClinicSunatConfig } from "../lib/types";
import { sunatApi } from "../lib/sunat-api";
import { paymentsApi } from "../lib/payments-api";
import { SUBSCRIPTION_PLANS } from "../lib/constants";

// Tabs for admin
const adminTabs = [
  { id: "clinic", label: "Clínica", icon: Building2 },
  { id: "services", label: "Servicios y Precios", icon: Tag },
  { id: "branches", label: "Sedes", icon: MapPin },
  { id: "users", label: "Usuarios", icon: Users },
  { id: "schedule", label: "Horarios", icon: Clock },
  { id: "notifications", label: "Notificaciones", icon: Bell },
  { id: "billing", label: "Facturación", icon: CreditCard },
  { id: "sunat", label: "SUNAT", icon: FileCheck },
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
  const { branches, loading: branchesLoading, refetch: refetchBranches, createBranch, updateBranch, toggleBranchActive } = useClinicBranches();
  const { services, loading: servicesLoading, refetch: refetchServices, createService, updateService, toggleServiceActive } = useClinicServices();

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

  // Branch modal state
  const [showBranchModal, setShowBranchModal] = useState(false);
  const [editingBranch, setEditingBranch] = useState<ClinicBranch | null>(null);
  const [branchForm, setBranchForm] = useState({ name: "", address: "", phone: "", email: "", is_main: false });

  // SUNAT config state
  const [sunatConfig, setSunatConfig] = useState<Partial<ClinicSunatConfig> | null>(null);
  const [sunatLoading, setSunatLoading] = useState(false);
  const [sunatForm, setSunatForm] = useState({
    ruc: "", razon_social: "", nombre_comercial: "", direccion_fiscal: "", ubigeo: "",
    sol_user: "", sol_password: "",
    serie_boleta: "B001", serie_factura: "F001",
    is_production: false, is_active: false,
  });
  const [certFile, setCertFile] = useState<File | null>(null);
  const [certPassword, setCertPassword] = useState("");

  async function loadSunatConfig() {
    setSunatLoading(true);
    try {
      const { config } = await sunatApi.getConfig();
      if (config) {
        setSunatConfig(config);
        setSunatForm({
          ruc: config.ruc || "",
          razon_social: config.razon_social || "",
          nombre_comercial: config.nombre_comercial || "",
          direccion_fiscal: config.direccion_fiscal || "",
          ubigeo: config.ubigeo || "",
          sol_user: config.sol_user || "",
          sol_password: config.sol_password || "",
          serie_boleta: config.serie_boleta || "B001",
          serie_factura: config.serie_factura || "F001",
          is_production: config.is_production || false,
          is_active: config.is_active || false,
        });
      }
    } catch { /* no config yet */ }
    setSunatLoading(false);
  }

  async function handleSaveSunat() {
    if (!sunatForm.ruc || !sunatForm.razon_social || !sunatForm.sol_user) {
      toast.error("RUC, Razón Social y Usuario SOL son obligatorios"); return;
    }
    setSaving(true);
    try {
      await sunatApi.saveConfig(sunatForm);
      toast.success("Configuración SUNAT guardada");
      loadSunatConfig();
    } catch (e: any) { toast.error(e.message); }
    setSaving(false);
  }

  async function handleUploadCert() {
    if (!certFile) { toast.error("Selecciona un archivo .pfx"); return; }
    setSaving(true);
    try {
      await sunatApi.uploadCertificate(certFile, certPassword);
      toast.success("Certificado validado y guardado");
      setCertFile(null);
      setCertPassword("");
      loadSunatConfig();
    } catch (e: any) { toast.error(e.message); }
    setSaving(false);
  }

  // Service modal state
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [editingService, setEditingService] = useState<ClinicService | null>(null);
  const [serviceForm, setServiceForm] = useState({ name: "", price: "", min_price: "", category: "" });

  async function handleSaveClinic() {
    const { error } = await updateClinic({
      name: clinicName, email: clinicEmail, phone: clinicPhone, address: clinicAddress,
    });
    if (error) toast.error("Error al guardar los datos de la clínica");
    else toast.success("Cambios guardados correctamente");
  }

  async function handleChangePassword() {
    if (newPassword !== confirmPassword) { toast.error("Las contraseñas no coinciden"); return; }
    if (newPassword.length < 8) { toast.error("La contraseña debe tener al menos 8 caracteres"); return; }
    if (!/[A-Z]/.test(newPassword)) { toast.error("La contraseña debe contener al menos una mayúscula"); return; }
    if (!/[0-9]/.test(newPassword)) { toast.error("La contraseña debe contener al menos un número"); return; }
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) toast.error("Error al cambiar la contraseña. Intente nuevamente.");
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
    if (error) toast.error("Error al actualizar el perfil");
    else { toast.success("Perfil actualizado"); refreshUser(); }
  }

  async function handleCreateUser(e: React.FormEvent) {
    e.preventDefault();
    if (!userForm.full_name.trim() || !userForm.email.trim() || !userForm.password) {
      toast.error("Nombre, email y contraseña son obligatorios"); return;
    }
    if (userForm.password.length < 8 || !/[A-Z]/.test(userForm.password) || !/\d/.test(userForm.password)) {
      toast.error("La contraseña debe tener al menos 8 caracteres, una mayúscula y un número"); return;
    }
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

  function openServiceModal(service?: ClinicService) {
    if (service) {
      setEditingService(service);
      setServiceForm({ name: service.name, price: String(service.price), min_price: String(service.min_price), category: service.category || "" });
    } else {
      setEditingService(null);
      setServiceForm({ name: "", price: "", min_price: "", category: "" });
    }
    setShowServiceModal(true);
  }

  async function handleSaveService(e: React.FormEvent) {
    e.preventDefault();
    if (!serviceForm.name.trim()) { toast.error("El nombre del servicio es obligatorio"); return; }
    const price = parseFloat(serviceForm.price);
    if (isNaN(price) || price < 0) { toast.error("El precio debe ser un número válido"); return; }
    const minPrice = parseFloat(serviceForm.min_price) || 0;
    if (minPrice > price) { toast.error("El precio mínimo no puede ser mayor al precio"); return; }
    setSaving(true);
    if (editingService) {
      const { error } = await updateService(editingService.id, {
        name: serviceForm.name.trim(),
        price,
        min_price: minPrice,
        category: serviceForm.category.trim() || undefined,
      });
      setSaving(false);
      if (error) toast.error("Error al actualizar el servicio");
      else { toast.success("Servicio actualizado"); setShowServiceModal(false); refetchServices(); }
    } else {
      const { error } = await createService({
        name: serviceForm.name.trim(),
        price,
        min_price: minPrice,
        category: serviceForm.category.trim() || undefined,
      });
      setSaving(false);
      if (error) toast.error("Error al crear el servicio");
      else { toast.success("Servicio creado"); setShowServiceModal(false); refetchServices(); }
    }
  }

  function openBranchModal(branch?: ClinicBranch) {
    if (branch) {
      setEditingBranch(branch);
      setBranchForm({
        name: branch.name,
        address: branch.address || "",
        phone: branch.phone || "",
        email: branch.email || "",
        is_main: branch.is_main,
      });
    } else {
      setEditingBranch(null);
      setBranchForm({ name: "", address: "", phone: "", email: "", is_main: false });
    }
    setShowBranchModal(true);
  }

  async function handleSaveBranch(e: React.FormEvent) {
    e.preventDefault();
    if (!branchForm.name.trim()) {
      toast.error("El nombre de la sede es obligatorio");
      return;
    }
    setSaving(true);
    if (editingBranch) {
      const { error } = await updateBranch(editingBranch.id, {
        name: branchForm.name.trim(),
        address: branchForm.address.trim() || undefined,
        phone: branchForm.phone.trim() || undefined,
        email: branchForm.email.trim() || undefined,
        is_main: branchForm.is_main,
      });
      setSaving(false);
      if (error) toast.error("Error al actualizar la sede");
      else {
        toast.success("Sede actualizada");
        setShowBranchModal(false);
        refetchBranches();
      }
    } else {
      const { error } = await createBranch({
        name: branchForm.name.trim(),
        address: branchForm.address.trim() || undefined,
        phone: branchForm.phone.trim() || undefined,
        email: branchForm.email.trim() || undefined,
        is_main: branchForm.is_main,
      });
      setSaving(false);
      if (error) toast.error("Error al crear la sede");
      else {
        toast.success("Sede creada correctamente");
        setShowBranchModal(false);
        refetchBranches();
      }
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
                  <button key={tab.id} onClick={() => { setActiveTab(tab.id); if (tab.id === "sunat") loadSunatConfig(); }}
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
              {/* Booking Link */}
              <Card>
                <CardHeader><CardTitle>Reserva Online</CardTitle></CardHeader>
                <CardContent>
                  <p className="text-[0.8125rem] text-foreground-secondary mb-3">
                    Comparte este link con tus pacientes para que reserven citas desde su celular.
                    Ponlo en tu Instagram, Facebook o Google.
                  </p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 flex items-center gap-2 px-3 py-2.5 bg-surface-alt border border-border rounded-[10px]">
                      <Link2 className="w-4 h-4 text-primary shrink-0" />
                      <span className="text-[0.8125rem] text-foreground truncate">
                        {`${window.location.origin}/reservar/${clinic?.id}`}
                      </span>
                    </div>
                    <Button
                      variant="secondary"
                      size="md"
                      onClick={() => {
                        navigator.clipboard.writeText(`${window.location.origin}/reservar/${clinic?.id}`);
                        toast.success("Link copiado al portapapeles");
                      }}
                    >
                      <Copy className="w-4 h-4 mr-1" />Copiar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {/* ===== SERVICES TAB (admin) ===== */}
          {activeTab === "services" && isAdmin && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Servicios y Precios</CardTitle>
                  <Button variant="primary" size="sm" onClick={() => openServiceModal()}>
                    <Plus className="w-4 h-4 mr-1" />Agregar Servicio
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {servicesLoading ? <Loading /> : services.length === 0 ? (
                  <div className="text-center py-8">
                    <Tag className="w-12 h-12 text-foreground-secondary mx-auto mb-4 opacity-50" />
                    <p className="text-[0.875rem] text-foreground-secondary mb-1">No hay servicios registrados</p>
                    <p className="text-[0.75rem] text-foreground-secondary mb-4">Agrega los servicios que ofrece tu clínica con sus precios</p>
                    <Button variant="primary" size="sm" onClick={() => openServiceModal()}>
                      <Plus className="w-4 h-4 mr-1" />Agregar Primer Servicio
                    </Button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left text-[0.75rem] font-medium text-foreground-secondary py-3 px-4">Servicio</th>
                          <th className="text-right text-[0.75rem] font-medium text-foreground-secondary py-3 px-4">Precio</th>
                          <th className="text-right text-[0.75rem] font-medium text-foreground-secondary py-3 px-4">Precio Mínimo</th>
                          <th className="text-left text-[0.75rem] font-medium text-foreground-secondary py-3 px-4">Categoría</th>
                          <th className="text-right text-[0.75rem] font-medium text-foreground-secondary py-3 px-4">Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {services.map((service) => (
                          <tr key={service.id} className="border-b border-border last:border-0 hover:bg-surface-alt transition-colors">
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2">
                                <span className="text-[0.875rem] font-medium text-foreground">{service.name}</span>
                                {!service.is_active && <Badge variant="danger">Inactivo</Badge>}
                              </div>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <span className="text-[0.875rem] font-semibold text-primary">S/{Number(service.price).toFixed(2)}</span>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <span className="text-[0.875rem] text-foreground-secondary">S/{Number(service.min_price).toFixed(2)}</span>
                            </td>
                            <td className="py-3 px-4">
                              {service.category ? (
                                <Badge variant="secondary">{service.category}</Badge>
                              ) : (
                                <span className="text-[0.75rem] text-foreground-secondary">—</span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <Button variant="tertiary" size="sm" onClick={() => openServiceModal(service)}>
                                  <Pencil className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant={service.is_active ? "tertiary" : "primary"}
                                  size="sm"
                                  onClick={async () => {
                                    const { error } = await toggleServiceActive(service.id, !service.is_active);
                                    if (error) toast.error(error);
                                    else { toast.success(service.is_active ? "Servicio desactivado" : "Servicio activado"); refetchServices(); }
                                  }}
                                >
                                  {service.is_active ? "Desactivar" : "Activar"}
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* ===== BRANCHES TAB (admin) ===== */}
          {activeTab === "branches" && isAdmin && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Sedes / Sucursales</CardTitle>
                  <Button variant="primary" size="sm" onClick={() => openBranchModal()}>
                    <Plus className="w-4 h-4 mr-1" />Agregar Sede
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {branchesLoading ? <Loading /> : branches.length === 0 ? (
                  <div className="text-center py-8">
                    <MapPin className="w-12 h-12 text-foreground-secondary mx-auto mb-4 opacity-50" />
                    <p className="text-[0.875rem] text-foreground-secondary mb-1">No hay sedes registradas</p>
                    <p className="text-[0.75rem] text-foreground-secondary mb-4">Agrega la sede principal y sucursales de tu clínica</p>
                    <Button variant="primary" size="sm" onClick={() => openBranchModal()}>
                      <Plus className="w-4 h-4 mr-1" />Agregar Primera Sede
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {branches.map((branch) => (
                      <div key={branch.id} className="flex items-center justify-between p-4 bg-surface-alt rounded-[10px]">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <MapPin className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-foreground text-[0.875rem]">{branch.name}</p>
                              {branch.is_main && <Badge variant="primary">Principal</Badge>}
                              {!branch.is_active && <Badge variant="danger">Inactiva</Badge>}
                            </div>
                            <p className="text-[0.75rem] text-foreground-secondary">
                              {[branch.address, branch.phone, branch.email].filter(Boolean).join(" • ") || "Sin datos de contacto"}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="tertiary" size="sm" onClick={() => openBranchModal(branch)}>
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant={branch.is_active ? "tertiary" : "primary"}
                            size="sm"
                            onClick={async () => {
                              const { error } = await toggleBranchActive(branch.id, !branch.is_active);
                              if (error) toast.error(error);
                              else {
                                toast.success(branch.is_active ? "Sede desactivada" : "Sede activada");
                                refetchBranches();
                              }
                            }}
                          >
                            {branch.is_active ? "Desactivar" : "Activar"}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
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
                        const { error } = await saveSchedules(updated as ClinicSchedule[]);
                        if (error) toast.error("Error al guardar los horarios");
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

          {/* ===== BILLING / SUBSCRIPTION TAB (admin) ===== */}
          {activeTab === "billing" && isAdmin && (
            <SubscriptionTab clinic={clinic} refreshUser={refreshUser} />
          )}

          {/* ===== SUNAT TAB (admin) ===== */}
          {activeTab === "sunat" && isAdmin && (
            <>
              {sunatLoading ? <Loading /> : (
                <>
                  <Card>
                    <CardHeader><CardTitle>Datos del Emisor</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className={labelClass}>RUC *</label>
                          <input className={inputClass} placeholder="20123456789" maxLength={11} value={sunatForm.ruc}
                            onChange={e => setSunatForm({ ...sunatForm, ruc: e.target.value })} />
                        </div>
                        <div>
                          <label className={labelClass}>Razón Social *</label>
                          <input className={inputClass} placeholder="Mi Clínica S.A.C." value={sunatForm.razon_social}
                            onChange={e => setSunatForm({ ...sunatForm, razon_social: e.target.value })} />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className={labelClass}>Nombre Comercial</label>
                          <input className={inputClass} placeholder="Tu Consul" value={sunatForm.nombre_comercial}
                            onChange={e => setSunatForm({ ...sunatForm, nombre_comercial: e.target.value })} />
                        </div>
                        <div>
                          <label className={labelClass}>Ubigeo</label>
                          <input className={inputClass} placeholder="150101" maxLength={6} value={sunatForm.ubigeo}
                            onChange={e => setSunatForm({ ...sunatForm, ubigeo: e.target.value })} />
                        </div>
                      </div>
                      <div>
                        <label className={labelClass}>Dirección Fiscal</label>
                        <input className={inputClass} placeholder="Av. Principal 1234, Lima" value={sunatForm.direccion_fiscal}
                          onChange={e => setSunatForm({ ...sunatForm, direccion_fiscal: e.target.value })} />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader><CardTitle>Clave SOL</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className={labelClass}>Usuario SOL *</label>
                          <input className={inputClass} placeholder="MODDATOS" value={sunatForm.sol_user}
                            onChange={e => setSunatForm({ ...sunatForm, sol_user: e.target.value })} />
                        </div>
                        <div>
                          <label className={labelClass}>Contraseña SOL *</label>
                          <input className={inputClass} type="password" placeholder="••••••" value={sunatForm.sol_password}
                            onChange={e => setSunatForm({ ...sunatForm, sol_password: e.target.value })} />
                        </div>
                      </div>
                      <p className="text-[0.6875rem] text-foreground-secondary">
                        Credenciales de SUNAT Online. Para pruebas usa: MODDATOS / moddatos
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader><CardTitle>Certificado Digital (.pfx)</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                      {sunatConfig?.certificate_path ? (
                        <div className="flex items-center gap-3 p-3 bg-success/5 border border-success/20 rounded-[10px]">
                          <Check className="w-5 h-5 text-success" />
                          <div>
                            <p className="text-[0.875rem] font-medium text-foreground">Certificado cargado</p>
                            <p className="text-[0.6875rem] text-foreground-secondary">Puedes reemplazarlo subiendo uno nuevo</p>
                          </div>
                        </div>
                      ) : (
                        <div className="p-3 bg-warning/5 border border-warning/20 rounded-[10px]">
                          <p className="text-[0.875rem] text-warning font-medium">Sin certificado</p>
                          <p className="text-[0.6875rem] text-foreground-secondary">Sube tu certificado .pfx para poder emitir comprobantes</p>
                        </div>
                      )}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className={labelClass}>Archivo .pfx</label>
                          <input type="file" accept=".pfx,.p12" className={inputClass}
                            onChange={e => setCertFile(e.target.files?.[0] || null)} />
                        </div>
                        <div>
                          <label className={labelClass}>Contraseña del certificado</label>
                          <input className={inputClass} type="password" placeholder="••••••" value={certPassword}
                            onChange={e => setCertPassword(e.target.value)} />
                        </div>
                      </div>
                      {certFile && (
                        <Button variant="tertiary" size="sm" onClick={handleUploadCert} disabled={saving}>
                          <Upload className="w-4 h-4 mr-1" />{saving ? "Subiendo..." : "Subir Certificado"}
                        </Button>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader><CardTitle>Series y Entorno</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className={labelClass}>Serie Boleta</label>
                          <input className={inputClass} placeholder="B001" maxLength={4} value={sunatForm.serie_boleta}
                            onChange={e => setSunatForm({ ...sunatForm, serie_boleta: e.target.value.toUpperCase() })} />
                        </div>
                        <div>
                          <label className={labelClass}>Serie Factura</label>
                          <input className={inputClass} placeholder="F001" maxLength={4} value={sunatForm.serie_factura}
                            onChange={e => setSunatForm({ ...sunatForm, serie_factura: e.target.value.toUpperCase() })} />
                        </div>
                      </div>
                      <div className="space-y-3">
                        <label className="flex items-center gap-3 p-3 bg-surface-alt rounded-[10px] cursor-pointer">
                          <input type="checkbox" checked={sunatForm.is_production}
                            onChange={e => setSunatForm({ ...sunatForm, is_production: e.target.checked })}
                            className="w-4 h-4 rounded border-border text-primary focus:ring-primary" />
                          <div>
                            <p className="text-[0.875rem] font-medium text-foreground">Modo Producción</p>
                            <p className="text-[0.6875rem] text-foreground-secondary">Desactivado = Beta (pruebas). Activar solo cuando estés listo para emitir comprobantes reales.</p>
                          </div>
                        </label>
                        <label className="flex items-center gap-3 p-3 bg-surface-alt rounded-[10px] cursor-pointer">
                          <input type="checkbox" checked={sunatForm.is_active}
                            onChange={e => setSunatForm({ ...sunatForm, is_active: e.target.checked })}
                            className="w-4 h-4 rounded border-border text-primary focus:ring-primary" />
                          <div>
                            <p className="text-[0.875rem] font-medium text-foreground">Facturación Electrónica Activa</p>
                            <p className="text-[0.6875rem] text-foreground-secondary">Habilita la emisión de boletas y facturas electrónicas</p>
                          </div>
                        </label>
                      </div>
                    </CardContent>
                  </Card>

                  <div className="flex justify-end">
                    <Button variant="primary" size="md" onClick={handleSaveSunat} disabled={saving}>
                      <Save className="w-4 h-4 mr-2" />{saving ? "Guardando..." : "Guardar Configuración SUNAT"}
                    </Button>
                  </div>
                </>
              )}
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

      {/* Service Modal */}
      <Modal open={showServiceModal} onClose={() => setShowServiceModal(false)} title={editingService ? "Editar Servicio" : "Agregar Servicio"} size="md">
        <form onSubmit={handleSaveService} className="space-y-4">
          <div>
            <label className={labelClass}>Nombre del Servicio *</label>
            <input className={inputClass} placeholder="Ej: Limpieza Dental" value={serviceForm.name}
              onChange={e => setServiceForm({ ...serviceForm, name: e.target.value })} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>Precio (S/) *</label>
              <input className={inputClass} type="number" step="0.01" min="0" placeholder="0.00" value={serviceForm.price}
                onChange={e => setServiceForm({ ...serviceForm, price: e.target.value })} />
            </div>
            <div>
              <label className={labelClass}>Precio Mínimo (S/)</label>
              <input className={inputClass} type="number" step="0.01" min="0" placeholder="0.00" value={serviceForm.min_price}
                onChange={e => setServiceForm({ ...serviceForm, min_price: e.target.value })} />
            </div>
            <div>
              <label className={labelClass}>Categoría</label>
              <input className={inputClass} placeholder="Ej: Preventivo" value={serviceForm.category}
                onChange={e => setServiceForm({ ...serviceForm, category: e.target.value })} />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button variant="tertiary" size="md" onClick={() => setShowServiceModal(false)} type="button">Cancelar</Button>
            <Button variant="primary" size="md" type="submit" disabled={saving}>
              {saving ? "Guardando..." : editingService ? "Guardar Cambios" : "Crear Servicio"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Branch Modal */}
      <Modal open={showBranchModal} onClose={() => setShowBranchModal(false)} title={editingBranch ? "Editar Sede" : "Agregar Sede"} size="md">
        <form onSubmit={handleSaveBranch} className="space-y-4">
          <div>
            <label className={labelClass}>Nombre de la Sede *</label>
            <input className={inputClass} placeholder="Ej: Sede Central" value={branchForm.name}
              onChange={e => setBranchForm({ ...branchForm, name: e.target.value })} />
          </div>
          <div>
            <label className={labelClass}>Dirección</label>
            <input className={inputClass} placeholder="Ej: Av. Principal 1234" value={branchForm.address}
              onChange={e => setBranchForm({ ...branchForm, address: e.target.value })} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Teléfono</label>
              <input className={inputClass} type="tel" placeholder="Ej: +51 999 999 999" value={branchForm.phone}
                onChange={e => setBranchForm({ ...branchForm, phone: e.target.value })} />
            </div>
            <div>
              <label className={labelClass}>Email</label>
              <input className={inputClass} type="email" placeholder="Ej: sede@tuconsul.com" value={branchForm.email}
                onChange={e => setBranchForm({ ...branchForm, email: e.target.value })} />
            </div>
          </div>
          <label className="flex items-center gap-3 p-3 bg-surface-alt rounded-[10px] cursor-pointer">
            <input type="checkbox" checked={branchForm.is_main}
              onChange={e => setBranchForm({ ...branchForm, is_main: e.target.checked })}
              className="w-4 h-4 rounded border-border text-primary focus:ring-primary" />
            <div>
              <p className="text-[0.875rem] font-medium text-foreground">Sede Principal</p>
              <p className="text-[0.75rem] text-foreground-secondary">Marcar esta sede como la ubicación principal de la clínica</p>
            </div>
          </label>
          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button variant="tertiary" size="md" onClick={() => setShowBranchModal(false)} type="button">Cancelar</Button>
            <Button variant="primary" size="md" type="submit" disabled={saving}>
              {saving ? "Guardando..." : editingBranch ? "Guardar Cambios" : "Crear Sede"}
            </Button>
          </div>
        </form>
      </Modal>

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
            <Input label="Contraseña *" type="password" placeholder="Mínimo 8 caracteres, 1 mayúscula y 1 número" value={userForm.password}
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

// ============================================================
// Subscription Tab Component
// ============================================================

function SubscriptionTab({ clinic, refreshUser }: { clinic: import("../lib/types").Clinic | null; refreshUser: () => void }) {
  const [loading, setLoading] = useState(false);
  const [transactions, setTransactions] = useState<import("../lib/types").SubscriptionTransaction[]>([]);
  const [txLoading, setTxLoading] = useState(true);
  const currentPlan = clinic?.plan || "free";

  // Load transaction history
  useState(() => {
    if (!clinic?.id) return;
    supabase
      .from("subscription_transactions")
      .select("*")
      .eq("clinic_id", clinic.id)
      .order("created_at", { ascending: false })
      .limit(10)
      .then(({ data }) => {
        setTransactions((data || []) as import("../lib/types").SubscriptionTransaction[]);
        setTxLoading(false);
      });
  });

  async function handleSubscribe(plan: "basic" | "premium") {
    setLoading(true);
    try {
      const result = await paymentsApi.createPreference(plan);
      // Redirect to Mercado Pago checkout
      window.location.href = result.init_point;
    } catch (e: any) {
      toast.error(e.message || "Error al crear el pago");
      setLoading(false);
    }
  }

  // Check for payment callback in URL
  useState(() => {
    const params = new URLSearchParams(window.location.search);
    const paymentStatus = params.get("payment");
    const txId = params.get("tx");
    if (paymentStatus && txId) {
      if (paymentStatus === "success") {
        toast.success("Pago procesado exitosamente. Tu plan se actualizará en breves momentos.");
        refreshUser();
      } else if (paymentStatus === "failure") {
        toast.error("El pago fue rechazado. Intenta nuevamente.");
      } else if (paymentStatus === "pending") {
        toast("Tu pago está pendiente de confirmación.");
      }
      // Clean URL
      window.history.replaceState({}, "", window.location.pathname);
    }
  });

  const planOrder = { free: 0, basic: 1, premium: 2 };

  return (
    <>
      {/* Current Plan Banner */}
      <Card>
        <CardHeader><CardTitle>Tu Suscripción</CardTitle></CardHeader>
        <CardContent>
          <div className="p-5 bg-gradient-to-r from-primary/10 to-primary/5 rounded-[12px] border border-primary/20">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="text-[1.25rem] font-semibold text-foreground">
                    Plan {currentPlan === "premium" ? "Premium" : currentPlan === "basic" ? "Básico" : "Gratuito"}
                  </h3>
                  <Badge variant={currentPlan === "free" ? "default" : "success"}>
                    {currentPlan === "free" ? "Activo" : "Suscrito"}
                  </Badge>
                </div>
                {clinic?.plan_expires_at && (
                  <p className="text-[0.8125rem] text-foreground-secondary">
                    Vigente hasta: {new Date(clinic.plan_expires_at).toLocaleDateString("es-PE", { day: "numeric", month: "long", year: "numeric" })}
                  </p>
                )}
              </div>
              <div className="text-right">
                <p className="text-[1.75rem] font-bold text-primary">
                  S/{SUBSCRIPTION_PLANS.find(p => p.key === currentPlan)?.price || 0}
                </p>
                <p className="text-[0.75rem] text-foreground-secondary">/mes</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Plans Comparison */}
      <Card>
        <CardHeader><CardTitle>Planes Disponibles</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {SUBSCRIPTION_PLANS.map((plan) => {
              const isCurrent = plan.key === currentPlan;
              const isUpgrade = planOrder[plan.key] > planOrder[currentPlan];
              const isDowngrade = planOrder[plan.key] < planOrder[currentPlan];

              return (
                <div
                  key={plan.key}
                  className={`relative rounded-[12px] border-2 p-5 transition-all ${
                    isCurrent
                      ? "border-primary bg-primary/5"
                      : plan.key === "premium"
                      ? "border-amber-300 bg-amber-50/50 hover:border-amber-400"
                      : "border-border hover:border-primary/40"
                  }`}
                >
                  {plan.key === "premium" && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="bg-amber-500 text-white text-[0.6875rem] font-semibold px-3 py-0.5 rounded-full">
                        Recomendado
                      </span>
                    </div>
                  )}

                  <h4 className="text-[1.125rem] font-semibold text-foreground mb-1">{plan.name}</h4>
                  <div className="mb-4">
                    <span className="text-[1.75rem] font-bold text-foreground">S/{plan.price}</span>
                    <span className="text-[0.8125rem] text-foreground-secondary">/mes</span>
                  </div>

                  <ul className="space-y-2 mb-5">
                    {plan.features.map((f, i) => (
                      <li key={i} className="flex items-start gap-2 text-[0.8125rem] text-foreground">
                        <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>

                  {isCurrent ? (
                    <Button variant="tertiary" size="md" className="w-full" disabled>
                      Plan Actual
                    </Button>
                  ) : isUpgrade ? (
                    <Button
                      variant={plan.key === "premium" ? "primary" : "secondary"}
                      size="md"
                      className="w-full"
                      onClick={() => handleSubscribe(plan.key as "basic" | "premium")}
                      disabled={loading}
                    >
                      {loading ? "Procesando..." : `Upgrade a ${plan.name}`}
                    </Button>
                  ) : isDowngrade ? (
                    <Button variant="tertiary" size="md" className="w-full" disabled>
                      Contactar soporte
                    </Button>
                  ) : null}
                </div>
              );
            })}
          </div>

          <div className="mt-4 flex items-center gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <Shield className="w-4 h-4 text-blue-600 shrink-0" />
            <p className="text-[0.8125rem] text-blue-800">
              Pagos seguros con Mercado Pago. Puedes cancelar en cualquier momento.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Transaction History */}
      <Card>
        <CardHeader><CardTitle>Historial de Pagos</CardTitle></CardHeader>
        <CardContent>
          {txLoading ? (
            <Loading />
          ) : transactions.length === 0 ? (
            <div className="text-center py-8">
              <CreditCard className="w-10 h-10 text-foreground-secondary mx-auto mb-3 opacity-50" />
              <p className="text-[0.875rem] text-foreground-secondary">Sin transacciones aún</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {transactions.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-[0.875rem] font-medium text-foreground">
                      Plan {tx.plan === "premium" ? "Premium" : "Básico"}
                    </p>
                    <p className="text-[0.75rem] text-foreground-secondary">
                      {new Date(tx.created_at).toLocaleDateString("es-PE", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[0.875rem] font-medium text-foreground">
                      S/{Number(tx.amount).toFixed(2)}
                    </span>
                    <Badge
                      variant={
                        tx.status === "approved" ? "success" :
                        tx.status === "rejected" ? "danger" :
                        "warning"
                      }
                    >
                      {tx.status === "approved" ? "Aprobado" :
                       tx.status === "rejected" ? "Rechazado" :
                       tx.status === "refunded" ? "Reembolsado" :
                       "Pendiente"}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}

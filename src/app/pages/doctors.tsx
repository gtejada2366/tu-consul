import { Link } from "react-router";
import { Card, CardContent } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Loading } from "../components/ui/loading";
import { EmptyState } from "../components/ui/empty-state";
import {
  Stethoscope, Calendar, Users as UsersIcon, Clock, ChevronRight, Search
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { useDoctors } from "../hooks/use-doctors";
import { to12h } from "../lib/constants";

export function Doctors() {
  const { doctors, loading } = useDoctors();
  const [search, setSearch] = useState("");

  const filtered = doctors.filter(d => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return d.full_name.toLowerCase().includes(q) || (d.specialty || "").toLowerCase().includes(q);
  });

  const activeDoctors = filtered.filter(d => d.is_active);
  const inactiveDoctors = filtered.filter(d => !d.is_active);

  if (loading) return <Loading />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-[1.5rem] md:text-[1.75rem] font-semibold text-foreground">Doctores</h1>
          <p className="text-[0.875rem] text-foreground-secondary mt-1">Equipo médico y sus agendas</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-2 bg-surface border border-border rounded-[10px]">
            <Stethoscope className="w-4 h-4 text-primary" />
            <span className="text-[0.875rem] font-semibold text-foreground">{doctors.filter(d => d.is_active).length}</span>
            <span className="text-[0.75rem] text-foreground-secondary">activos</span>
          </div>
        </div>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-3">
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-foreground-secondary" />
            <input
              type="text"
              placeholder="Buscar doctor por nombre o especialidad..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="flex-1 bg-transparent text-[0.875rem] text-foreground placeholder:text-foreground-secondary focus:outline-none"
            />
          </div>
        </CardContent>
      </Card>

      {doctors.length === 0 ? (
        <EmptyState
          icon={Stethoscope}
          title="No hay doctores registrados"
          description="Agrega doctores desde Configuración → Equipo"
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Search}
          title="Sin resultados"
          description="No se encontraron doctores con ese criterio"
        />
      ) : (
        <>
          {/* Active Doctors */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {activeDoctors.map((doc, i) => (
              <motion.div
                key={doc.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: i * 0.05 }}
              >
                <Link to={`/doctores/${doc.id}`}>
                  <Card className="hover:shadow-md hover:border-primary/30 transition-all duration-150 cursor-pointer group">
                    <CardContent className="p-5">
                      {/* Doctor info */}
                      <div className="flex items-start justify-between gap-3 mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                            {doc.avatar_url ? (
                              <img src={doc.avatar_url} alt="" className="w-12 h-12 rounded-full object-cover" />
                            ) : (
                              <span className="text-primary font-semibold text-[1rem]">
                                {doc.full_name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                              </span>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-foreground text-[0.9375rem] truncate">
                              Dr. {doc.full_name}
                            </p>
                            <p className="text-[0.75rem] text-foreground-secondary truncate">
                              {doc.specialty || "General"}
                            </p>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-foreground-secondary opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-1" />
                      </div>

                      {/* Stats */}
                      <div className="grid grid-cols-3 gap-3 mb-4">
                        <div className="text-center p-2 rounded-[8px] bg-surface-alt">
                          <div className="flex items-center justify-center gap-1 mb-0.5">
                            <Calendar className="w-3 h-3 text-primary" />
                            <span className="text-[1.125rem] font-semibold text-foreground">{doc.appointments_today}</span>
                          </div>
                          <p className="text-[0.625rem] text-foreground-secondary">Hoy</p>
                        </div>
                        <div className="text-center p-2 rounded-[8px] bg-surface-alt">
                          <div className="flex items-center justify-center gap-1 mb-0.5">
                            <Clock className="w-3 h-3 text-success" />
                            <span className="text-[1.125rem] font-semibold text-foreground">{doc.appointments_week}</span>
                          </div>
                          <p className="text-[0.625rem] text-foreground-secondary">Semana</p>
                        </div>
                        <div className="text-center p-2 rounded-[8px] bg-surface-alt">
                          <div className="flex items-center justify-center gap-1 mb-0.5">
                            <UsersIcon className="w-3 h-3 text-warning" />
                            <span className="text-[1.125rem] font-semibold text-foreground">{doc.patients_total}</span>
                          </div>
                          <p className="text-[0.625rem] text-foreground-secondary">Pacientes</p>
                        </div>
                      </div>

                      {/* Next appointment */}
                      {doc.next_appointment ? (
                        <div className="flex items-center gap-2 p-2.5 rounded-[8px] border border-border bg-surface">
                          <Clock className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-[0.75rem] text-foreground font-medium truncate">
                              {doc.next_appointment.patient_name}
                            </p>
                            <p className="text-[0.6875rem] text-foreground-secondary">
                              {(() => {
                                const [y, m, d] = doc.next_appointment!.date.split("-");
                                const months = ["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"];
                                return `${d} ${months[parseInt(m) - 1]}`;
                              })()} • {to12h(doc.next_appointment.start_time)}
                            </p>
                          </div>
                          <Badge variant="warning">Próxima</Badge>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 p-2.5 rounded-[8px] bg-surface-alt">
                          <Calendar className="w-3.5 h-3.5 text-foreground-secondary" />
                          <p className="text-[0.75rem] text-foreground-secondary">Sin citas próximas</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>

          {/* Inactive doctors */}
          {inactiveDoctors.length > 0 && (
            <div>
              <p className="text-[0.75rem] font-medium text-foreground-secondary mb-3 px-1">
                Inactivos ({inactiveDoctors.length})
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {inactiveDoctors.map(doc => (
                  <Card key={doc.id} className="opacity-60">
                    <CardContent className="p-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-surface-alt flex items-center justify-center flex-shrink-0">
                          <span className="text-foreground-secondary font-medium text-[0.875rem]">
                            {doc.full_name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-foreground text-[0.875rem] truncate">Dr. {doc.full_name}</p>
                          <p className="text-[0.75rem] text-foreground-secondary">{doc.specialty || "General"}</p>
                        </div>
                        <Badge variant="default">Inactivo</Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

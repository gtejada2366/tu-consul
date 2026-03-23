import { useState, useMemo } from "react";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Loading } from "../components/ui/loading";
import {
  MessageCircle,
  Search,
  Users,
  Send,
  Check,
  ExternalLink,
} from "lucide-react";
import { usePatients } from "../hooks/use-patients";
import { labelClass, textareaClass } from "../components/modals/form-classes";
import { INTEREST_TAGS, getTagColor } from "../lib/constants";
import type { PatientWithStats } from "../lib/types";

const MESSAGE_TEMPLATES = [
  {
    name: "Recordatorio de cita",
    text: "Hola {nombre}, te recordamos que tienes una cita programada en nuestra clínica. Te esperamos. Saludos!",
  },
  {
    name: "Promoción",
    text: "Hola {nombre}, tenemos una promoción especial para ti. Contáctanos para más información. Saludos!",
  },
  {
    name: "Seguimiento",
    text: "Hola {nombre}, queremos saber cómo te encuentras después de tu última visita. Si tienes alguna consulta no dudes en escribirnos. Saludos!",
  },
  {
    name: "Reactivación",
    text: "Hola {nombre}, hace tiempo que no te vemos por la clínica. Recuerda que es importante mantener tus controles dentales al día. Te esperamos!",
  },
];

function cleanPhone(phone: string): string {
  return phone.replace(/[^0-9+]/g, "");
}

function buildWhatsAppUrl(phone: string, message: string): string {
  const clean = cleanPhone(phone);
  const num = clean.startsWith("+") ? clean.slice(1) : clean;
  return `https://wa.me/${num}?text=${encodeURIComponent(message)}`;
}

function personalizeMessage(template: string, patient: PatientWithStats): string {
  const firstName = patient.full_name.split(" ")[0];
  return template.replace(/\{nombre\}/g, firstName);
}

export function Campaigns() {
  const { patients, loading } = usePatients();

  const [tagFilter, setTagFilter] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [message, setMessage] = useState(MESSAGE_TEMPLATES[0].text);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sentIds, setSentIds] = useState<Set<string>>(new Set());

  const activePatients = useMemo(
    () => patients.filter((p) => p.status === "active"),
    [patients],
  );

  // Collect all unique tags with patient counts
  const allTags = useMemo(() => {
    const countMap: Record<string, number> = {};
    for (const tag of INTEREST_TAGS) countMap[tag] = 0;
    for (const p of activePatients) {
      for (const tag of p.interest_tags ?? []) {
        countMap[tag] = (countMap[tag] || 0) + 1;
      }
    }
    return Object.entries(countMap).sort(([a], [b]) => a.localeCompare(b, "es"));
  }, [activePatients]);

  const filtered = useMemo(() => {
    return activePatients.filter((p) => {
      const hasPhone = !!(p.phone || p.phone_mobile);
      if (!hasPhone) return false;
      const matchesTag = !tagFilter || (p.interest_tags ?? []).includes(tagFilter);
      const matchesSearch = !searchTerm || p.full_name.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesTag && matchesSearch;
    });
  }, [activePatients, tagFilter, searchTerm]);

  const allSelected = filtered.length > 0 && filtered.every((p) => selectedIds.has(p.id));

  function toggleAll() {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map((p) => p.id)));
    }
  }

  function toggleOne(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function openWhatsApp(patient: PatientWithStats) {
    const phone = patient.phone_mobile || patient.phone || "";
    const personalizedMsg = personalizeMessage(message, patient);
    const url = buildWhatsAppUrl(phone, personalizedMsg);
    window.open(url, "_blank");
    setSentIds((prev) => new Set(prev).add(patient.id));
  }

  const selectedPatients = filtered.filter((p) => selectedIds.has(p.id));
  const withTagCount = tagFilter
    ? activePatients.filter((p) => (p.interest_tags ?? []).includes(tagFilter)).length
    : activePatients.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-[1.5rem] md:text-[1.75rem] font-semibold text-foreground">
          Campañas WhatsApp
        </h1>
        <p className="text-[0.875rem] text-foreground-secondary mt-1">
          Envía mensajes personalizados a tus pacientes por WhatsApp
        </p>
      </div>

      {loading ? (
        <Loading />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column: message composer */}
          <div className="lg:col-span-1 space-y-4">
            {/* Tag filter */}
            <Card>
              <CardContent className="p-4 space-y-4">
                <div>
                  <label className={labelClass}>Segmentar por tag</label>
                  <select
                    className="w-full h-10 px-4 bg-surface-alt border border-border rounded-[10px] text-[0.875rem] text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-150"
                    value={tagFilter}
                    onChange={(e) => {
                      setTagFilter(e.target.value);
                      setSelectedIds(new Set());
                      setSentIds(new Set());
                    }}
                  >
                    <option value="">Todos los pacientes ({activePatients.length})</option>
                    {allTags.map(([tag, count]) => (
                      <option key={tag} value={tag}>
                        {tag} ({count})
                      </option>
                    ))}
                  </select>
                </div>

                {tagFilter && (
                  <div className="flex items-center gap-2">
                    <span className="text-[0.8125rem] text-foreground-secondary">Público:</span>
                    {(() => {
                      const color = getTagColor(tagFilter);
                      return (
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-[0.75rem] font-medium border ${color.bg} ${color.text} ${color.border}`}
                        >
                          {tagFilter}
                        </span>
                      );
                    })()}
                    <span className="text-[0.8125rem] text-foreground-secondary">
                      ({withTagCount} pacientes)
                    </span>
                  </div>
                )}

                <div className="flex items-center gap-2 p-3 rounded-[10px] bg-primary/5">
                  <Users className="w-5 h-5 text-primary" />
                  <span className="text-[0.875rem] font-medium text-foreground">
                    {filtered.length} pacientes con teléfono
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Message template */}
            <Card>
              <CardContent className="p-4 space-y-4">
                <div>
                  <label className={labelClass}>Plantilla rápida</label>
                  <select
                    className="w-full h-10 px-4 bg-surface-alt border border-border rounded-[10px] text-[0.875rem] text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-150"
                    onChange={(e) => {
                      if (e.target.value) setMessage(e.target.value);
                    }}
                  >
                    <option value="">Seleccionar plantilla...</option>
                    {MESSAGE_TEMPLATES.map((t) => (
                      <option key={t.name} value={t.text}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={labelClass}>
                    Mensaje (usa {"{nombre}"} para personalizar)
                  </label>
                  <textarea
                    className={textareaClass + " !h-32"}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Escribe tu mensaje aquí..."
                  />
                </div>

                <div className="p-3 rounded-[10px] bg-surface-alt">
                  <p className="text-[0.75rem] font-medium text-foreground-secondary mb-1">
                    Vista previa:
                  </p>
                  <p className="text-[0.8125rem] text-foreground">
                    {message.replace(/\{nombre\}/g, "Juan")}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Stats */}
            {sentIds.size > 0 && (
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-[10px] bg-success/10 flex items-center justify-center">
                      <Check className="w-5 h-5 text-success" />
                    </div>
                    <div>
                      <p className="text-[0.875rem] font-semibold text-foreground">
                        {sentIds.size} mensaje{sentIds.size !== 1 ? "s" : ""} enviado
                        {sentIds.size !== 1 ? "s" : ""}
                      </p>
                      <p className="text-[0.75rem] text-foreground-secondary">
                        de {filtered.length} pacientes
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right column: patient list */}
          <div className="lg:col-span-2 space-y-4">
            {/* Search + actions */}
            <Card>
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-secondary" />
                    <input
                      type="text"
                      placeholder="Buscar paciente..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      aria-label="Buscar pacientes para campaña"
                      className="w-full h-10 pl-10 pr-4 bg-surface-alt border border-border rounded-[10px] text-[0.875rem] text-foreground placeholder:text-foreground-secondary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-150"
                    />
                  </div>
                  <Button variant="tertiary" size="sm" onClick={toggleAll}>
                    {allSelected ? "Deseleccionar todos" : "Seleccionar todos"}
                  </Button>
                  {selectedPatients.length > 0 && (
                    <Badge variant="primary">
                      {selectedPatients.length} seleccionado
                      {selectedPatients.length !== 1 ? "s" : ""}
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Patient list */}
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-surface-alt border-b border-border">
                      <tr>
                        <th className="text-left px-4 py-3 w-10">
                          <input
                            type="checkbox"
                            checked={allSelected}
                            onChange={toggleAll}
                            className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                          />
                        </th>
                        <th className="text-left px-4 py-3 text-[0.75rem] font-medium text-foreground-secondary">
                          Paciente
                        </th>
                        <th className="text-left px-4 py-3 text-[0.75rem] font-medium text-foreground-secondary">
                          Teléfono
                        </th>
                        <th className="text-left px-4 py-3 text-[0.75rem] font-medium text-foreground-secondary">
                          Tags
                        </th>
                        <th className="text-left px-4 py-3 text-[0.75rem] font-medium text-foreground-secondary">
                          Enviar
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {filtered.map((patient) => {
                        const phone = patient.phone_mobile || patient.phone || "";
                        const isSent = sentIds.has(patient.id);
                        return (
                          <tr
                            key={patient.id}
                            className="hover:bg-surface-alt transition-colors duration-150"
                          >
                            <td className="px-4 py-3">
                              <input
                                type="checkbox"
                                checked={selectedIds.has(patient.id)}
                                onChange={() => toggleOne(patient.id)}
                                className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                              />
                            </td>
                            <td className="px-4 py-3">
                              <p className="font-medium text-foreground text-[0.875rem]">
                                {patient.full_name}
                              </p>
                            </td>
                            <td className="px-4 py-3">
                              <p className="text-[0.8125rem] text-foreground-secondary">{phone}</p>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex flex-wrap gap-1">
                                {(patient.interest_tags ?? []).slice(0, 2).map((tag) => {
                                  const color = getTagColor(tag);
                                  return (
                                    <span
                                      key={tag}
                                      className={`inline-block px-2 py-0.5 rounded-full text-[0.625rem] font-medium border ${color.bg} ${color.text} ${color.border}`}
                                    >
                                      {tag}
                                    </span>
                                  );
                                })}
                                {(patient.interest_tags ?? []).length > 2 && (
                                  <span className="inline-block px-2 py-0.5 rounded-full text-[0.625rem] font-medium bg-gray-100 text-gray-600">
                                    +{(patient.interest_tags ?? []).length - 2}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <Button
                                variant={isSent ? "tertiary" : "primary"}
                                size="sm"
                                onClick={() => openWhatsApp(patient)}
                                disabled={!message.trim()}
                              >
                                {isSent ? (
                                  <>
                                    <Check className="w-3.5 h-3.5 mr-1 text-success" />
                                    Enviado
                                  </>
                                ) : (
                                  <>
                                    <MessageCircle className="w-3.5 h-3.5 mr-1" />
                                    Enviar
                                  </>
                                )}
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {filtered.length === 0 && (
                  <div className="text-center py-12">
                    <MessageCircle className="w-12 h-12 text-foreground-secondary mx-auto mb-4 opacity-50" />
                    <p className="text-[0.875rem] text-foreground-secondary">
                      No hay pacientes con teléfono registrado
                      {tagFilter ? ` y tag "${tagFilter}"` : ""}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Bulk send helper */}
            {selectedPatients.length > 0 && (
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-[10px] bg-green-100 flex items-center justify-center">
                        <Send className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <p className="text-[0.875rem] font-semibold text-foreground">
                          Envío secuencial
                        </p>
                        <p className="text-[0.75rem] text-foreground-secondary">
                          Se abrirá WhatsApp para cada paciente seleccionado. Envía y cierra la
                          pestaña para continuar.
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="primary"
                      size="md"
                      disabled={!message.trim()}
                      onClick={() => {
                        const pending = selectedPatients.filter((p) => !sentIds.has(p.id));
                        if (pending.length === 0) return;
                        openWhatsApp(pending[0]);
                      }}
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Enviar siguiente ({selectedPatients.filter((p) => !sentIds.has(p.id)).length}{" "}
                      restantes)
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

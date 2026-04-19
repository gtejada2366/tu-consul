import { useEffect, useRef, useState } from "react";
import { Mic, Square, Loader2, AlertCircle, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Modal } from "./ui/modal";
import { Button } from "./ui/button";
import { supabase } from "../lib/supabase";

export interface ParsedDictation {
  motivo_consulta: string | null;
  diagnostico: string | null;
  tratamiento_realizado: string | null;
  observaciones: string | null;
  prescripciones: Array<{ medicamento: string; dosis: string; duracion: string }>;
  proxima_cita: {
    dias_desde_hoy: number | null;
    tipo: string | null;
    notas: string | null;
  } | null;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onApply: (parsed: ParsedDictation, transcript: string) => void;
}

type Phase = "idle" | "recording" | "processing" | "review" | "error";

export function VoiceDictationModal({ open, onClose, onApply }: Props) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [elapsed, setElapsed] = useState(0);
  const [transcript, setTranscript] = useState("");
  const [parsed, setParsed] = useState<ParsedDictation | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (!open) resetState();
    return () => {
      stopTimer();
      stopStream();
    };
  }, [open]);

  function resetState() {
    setPhase("idle");
    setElapsed(0);
    setTranscript("");
    setParsed(null);
    setErrorMsg("");
    chunksRef.current = [];
    stopTimer();
    stopStream();
  }

  function stopTimer() {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }

  function stopStream() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        stopStream();
        await uploadAndParse(blob);
      };

      mediaRecorder.start();
      setPhase("recording");
      setElapsed(0);
      timerRef.current = window.setInterval(() => setElapsed((s) => s + 1), 1000);
    } catch (err) {
      const message = err instanceof Error ? err.message : "No se pudo acceder al micrófono";
      setErrorMsg(message);
      setPhase("error");
    }
  }

  function stopRecording() {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    stopTimer();
    setPhase("processing");
  }

  async function uploadAndParse(blob: Blob) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Sesión expirada, recargá la página");

      const formData = new FormData();
      formData.append("audio", blob, "dictado.webm");

      const res = await fetch("/api/voice/parse", {
        method: "POST",
        headers: { Authorization: `Bearer ${session.access_token}` },
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al procesar audio");
      if (data.warning) {
        setErrorMsg(data.warning);
        setPhase("error");
        return;
      }

      setTranscript(data.transcript || "");
      setParsed(data.parsed);
      setPhase("review");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error desconocido";
      setErrorMsg(message);
      setPhase("error");
    }
  }

  function handleApply() {
    if (!parsed) return;
    onApply(parsed, transcript);
    toast.success("Datos aplicados al formulario");
    onClose();
  }

  function formatTime(seconds: number) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  }

  return (
    <Modal open={open} onClose={onClose} title="Dictar consulta por voz" size="lg">
      <div className="space-y-4">
        {phase === "idle" && (
          <div className="text-center py-8">
            <p className="text-sm text-foreground-secondary mb-6">
              Hablá libremente sobre la consulta. El asistente va a extraer:<br />
              motivo, diagnóstico, tratamiento, recetas y próxima cita.
            </p>
            <button
              onClick={startRecording}
              className="mx-auto w-20 h-20 rounded-full bg-primary hover:bg-primary-hover flex items-center justify-center shadow-lg shadow-primary/30 transition-all"
              aria-label="Empezar a dictar"
            >
              <Mic className="w-8 h-8 text-white" />
            </button>
            <p className="mt-4 text-xs text-foreground-secondary">
              Click para empezar. Max. 5 minutos.
            </p>
          </div>
        )}

        {phase === "recording" && (
          <div className="text-center py-8">
            <div className="relative mx-auto w-20 h-20 mb-4">
              <div className="absolute inset-0 rounded-full bg-danger/20 animate-ping"></div>
              <div className="relative w-20 h-20 rounded-full bg-danger flex items-center justify-center">
                <Mic className="w-8 h-8 text-white" />
              </div>
            </div>
            <p className="text-2xl font-semibold text-foreground tabular-nums">{formatTime(elapsed)}</p>
            <p className="text-sm text-foreground-secondary mt-1 mb-6">Grabando…</p>
            <Button variant="primary" onClick={stopRecording}>
              <Square className="w-4 h-4 mr-2 fill-current" /> Terminar y procesar
            </Button>
          </div>
        )}

        {phase === "processing" && (
          <div className="text-center py-12">
            <Loader2 className="w-10 h-10 text-primary mx-auto animate-spin mb-4" />
            <p className="text-sm font-medium text-foreground">Transcribiendo y extrayendo datos…</p>
            <p className="text-xs text-foreground-secondary mt-1">Esto toma 5-15 segundos</p>
          </div>
        )}

        {phase === "error" && (
          <div className="py-8 text-center">
            <AlertCircle className="w-10 h-10 text-danger mx-auto mb-3" />
            <p className="text-sm font-medium text-foreground mb-2">No pudimos procesar el dictado</p>
            <p className="text-xs text-foreground-secondary mb-6">{errorMsg}</p>
            <Button variant="secondary" onClick={() => resetState()}>
              Intentar de nuevo
            </Button>
          </div>
        )}

        {phase === "review" && parsed && (
          <div className="space-y-4">
            <div className="flex items-start gap-2 p-3 rounded-lg bg-primary/5 border border-primary/20">
              <Sparkles className="w-4 h-4 text-primary mt-0.5 shrink-0" />
              <p className="text-xs text-foreground-secondary">
                <span className="font-medium text-foreground">Revisá antes de aplicar.</span> Claude puede cometer errores —
                verificá los datos extraídos.
              </p>
            </div>

            <details className="text-xs">
              <summary className="cursor-pointer text-foreground-secondary hover:text-foreground">
                Ver transcripción original
              </summary>
              <p className="mt-2 p-3 bg-surface-alt rounded-lg text-foreground-secondary italic">
                "{transcript}"
              </p>
            </details>

            <div className="grid grid-cols-1 gap-3 text-sm">
              <Field label="Motivo de consulta" value={parsed.motivo_consulta} />
              <Field label="Diagnóstico" value={parsed.diagnostico} />
              <Field label="Tratamiento realizado" value={parsed.tratamiento_realizado} />
              <Field label="Observaciones" value={parsed.observaciones} />

              {parsed.prescripciones.length > 0 && (
                <div>
                  <p className="text-[0.75rem] font-medium text-foreground-secondary mb-1">Prescripciones</p>
                  <ul className="space-y-1">
                    {parsed.prescripciones.map((p, i) => (
                      <li key={i} className="p-2 bg-surface-alt rounded-lg text-foreground">
                        <span className="font-medium">{p.medicamento}</span>
                        <span className="text-foreground-secondary"> — {p.dosis} · {p.duracion}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {parsed.proxima_cita && (
                <div>
                  <p className="text-[0.75rem] font-medium text-foreground-secondary mb-1">Próxima cita</p>
                  <p className="p-2 bg-surface-alt rounded-lg text-foreground">
                    {parsed.proxima_cita.tipo || "Cita"}
                    {parsed.proxima_cita.dias_desde_hoy != null && ` · en ${parsed.proxima_cita.dias_desde_hoy} día(s)`}
                    {parsed.proxima_cita.notas && ` · ${parsed.proxima_cita.notas}`}
                  </p>
                </div>
              )}
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <Button variant="secondary" onClick={resetState}>Volver a dictar</Button>
              <Button variant="primary" onClick={handleApply}>Aplicar al formulario</Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}

function Field({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <div>
      <p className="text-[0.75rem] font-medium text-foreground-secondary mb-1">{label}</p>
      <p className="p-2 bg-surface-alt rounded-lg text-foreground">{value}</p>
    </div>
  );
}

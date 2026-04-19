import { getClinicFromRequest } from "../sunat/_lib/supabase-admin.js";
import { IncomingForm } from "formidable";
import { createReadStream } from "fs";
import OpenAI, { toFile } from "openai";
import Anthropic from "@anthropic-ai/sdk";

export const config = {
  api: { bodyParser: false },
};

const SCHEMA_DESCRIPTION = `Sos un asistente que extrae datos estructurados de dictados médicos en español de clínicas dentales peruanas.

El doctor dicta libremente sobre una consulta. Extraé los campos que identifiques. Si algo no se menciona, devolvelo como null (no inventes).

Devolvé ÚNICAMENTE un JSON válido con esta forma:
{
  "motivo_consulta": string | null,           // razón por la que vino el paciente
  "diagnostico": string | null,               // diagnóstico del doctor
  "tratamiento_realizado": string | null,     // qué se hizo en esta consulta
  "observaciones": string | null,             // notas adicionales
  "prescripciones": [                         // array de medicamentos recetados (vacío si no hay)
    {
      "medicamento": string,                   // nombre + concentración (ej: "Ibuprofeno 400mg")
      "dosis": string,                         // ej: "1 comprimido cada 8 horas"
      "duracion": string                       // ej: "5 días"
    }
  ],
  "proxima_cita": {                           // null si no hay próxima cita mencionada
    "dias_desde_hoy": number | null,          // días desde hoy (ej: "la próxima semana" = 7)
    "tipo": string | null,                    // tipo de cita (ej: "Control", "Seguimiento")
    "notas": string | null                    // observaciones para la cita
  } | null
}

Reglas:
- El texto puede tener errores de transcripción (es de Whisper). Interpretá con sentido común médico/dental.
- Números dentales: FDI notation (pieza 36 = molar inferior izquierda). Respetá cómo lo dice el doctor.
- Si el doctor menciona "muela del juicio" o similar, mantené el término coloquial.
- No inventes dosis ni duraciones que no dijo.
- Spanish peruano. Usá terminología local cuando sea natural.`;

async function transcribeAudio(audioPath) {
  const openai = new OpenAI({ apiKey: process.env.OPEN_AI || process.env.OPENAI_API_KEY });
  const file = await toFile(createReadStream(audioPath), "dictado.webm", { type: "audio/webm" });
  const transcription = await openai.audio.transcriptions.create({
    file,
    model: "whisper-1",
    language: "es",
  });
  return transcription.text;
}

async function parseTranscript(transcript) {
  const anthropic = new Anthropic({ apiKey: process.env.Anthropic || process.env.ANTHROPIC_API_KEY });
  const response = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1024,
    system: SCHEMA_DESCRIPTION,
    messages: [
      {
        role: "user",
        content: `Dictado del doctor:\n\n"${transcript}"\n\nExtrae el JSON.`,
      },
    ],
  });

  const textBlock = response.content.find((c) => c.type === "text");
  if (!textBlock) throw new Error("No text in Claude response");

  let jsonText = textBlock.text.trim();
  const codeFenceMatch = jsonText.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeFenceMatch) jsonText = codeFenceMatch[1].trim();

  return JSON.parse(jsonText);
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    await getClinicFromRequest(req);

    const form = new IncomingForm({ maxFileSize: 25 * 1024 * 1024 });
    const { files } = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        else resolve({ fields, files });
      });
    });

    const file = Array.isArray(files.audio) ? files.audio[0] : files.audio;
    if (!file) return res.status(400).json({ error: "No se recibió audio" });

    const transcript = await transcribeAudio(file.filepath);
    if (!transcript || transcript.trim().length < 3) {
      return res.status(200).json({
        transcript,
        parsed: null,
        warning: "No se pudo transcribir el audio o es muy corto.",
      });
    }

    const parsed = await parseTranscript(transcript);

    return res.status(200).json({ transcript, parsed });
  } catch (err) {
    console.error("voice/parse error:", err);
    const message = err instanceof Error ? err.message : "Error desconocido";
    return res.status(500).json({ error: message });
  }
}

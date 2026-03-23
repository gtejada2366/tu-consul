"""Generate Tu Consul functionalities PDF document."""
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.colors import HexColor
from reportlab.lib.units import cm, mm
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    PageBreak, HRFlowable, KeepTogether
)

PRIMARY = HexColor("#1E40AF")
PRIMARY_LIGHT = HexColor("#DBEAFE")
ACCENT = HexColor("#059669")
ACCENT_LIGHT = HexColor("#D1FAE5")
DARK = HexColor("#1F2937")
GRAY = HexColor("#6B7280")
LIGHT_GRAY = HexColor("#F3F4F6")
WHITE = HexColor("#FFFFFF")
TABLE_HEADER_BG = HexColor("#1E40AF")
TABLE_ALT_ROW = HexColor("#F0F4FF")
CHECK = "Si"
DASH = "-"

styles = getSampleStyleSheet()

style_title = ParagraphStyle(
    "DocTitle", parent=styles["Title"],
    fontSize=28, leading=34, textColor=PRIMARY,
    spaceAfter=4, alignment=TA_CENTER,
    fontName="Helvetica-Bold"
)
style_subtitle = ParagraphStyle(
    "DocSubtitle", parent=styles["Normal"],
    fontSize=13, leading=18, textColor=GRAY,
    spaceAfter=6, alignment=TA_CENTER,
    fontName="Helvetica"
)
style_version = ParagraphStyle(
    "Version", parent=styles["Normal"],
    fontSize=10, leading=14, textColor=GRAY,
    spaceAfter=30, alignment=TA_CENTER,
    fontName="Helvetica-Oblique"
)
style_h1 = ParagraphStyle(
    "H1", parent=styles["Heading1"],
    fontSize=18, leading=24, textColor=PRIMARY,
    spaceBefore=24, spaceAfter=10,
    fontName="Helvetica-Bold",
    borderWidth=0, borderPadding=0,
    leftIndent=0
)
style_h2 = ParagraphStyle(
    "H2", parent=styles["Heading2"],
    fontSize=14, leading=18, textColor=DARK,
    spaceBefore=14, spaceAfter=6,
    fontName="Helvetica-Bold"
)
style_h3 = ParagraphStyle(
    "H3", parent=styles["Heading3"],
    fontSize=12, leading=16, textColor=HexColor("#374151"),
    spaceBefore=10, spaceAfter=4,
    fontName="Helvetica-Bold"
)
style_body = ParagraphStyle(
    "Body", parent=styles["Normal"],
    fontSize=10, leading=15, textColor=DARK,
    spaceAfter=6, alignment=TA_JUSTIFY,
    fontName="Helvetica"
)
style_bullet = ParagraphStyle(
    "Bullet", parent=style_body,
    leftIndent=18, bulletIndent=6,
    spaceAfter=3
)
style_bullet2 = ParagraphStyle(
    "Bullet2", parent=style_body,
    leftIndent=36, bulletIndent=22,
    spaceAfter=2, fontSize=9.5
)
style_numbered = ParagraphStyle(
    "Numbered", parent=style_body,
    leftIndent=18, spaceAfter=3
)
style_table_header = ParagraphStyle(
    "TableH", parent=styles["Normal"],
    fontSize=9, leading=12, textColor=WHITE,
    fontName="Helvetica-Bold", alignment=TA_CENTER
)
style_table_cell = ParagraphStyle(
    "TableC", parent=styles["Normal"],
    fontSize=9, leading=12, textColor=DARK,
    fontName="Helvetica", alignment=TA_CENTER
)
style_table_cell_left = ParagraphStyle(
    "TableCL", parent=style_table_cell,
    alignment=TA_LEFT
)
style_footer = ParagraphStyle(
    "Footer", parent=styles["Normal"],
    fontSize=9, leading=12, textColor=GRAY,
    alignment=TA_CENTER, fontName="Helvetica-Oblique"
)


def hr():
    return HRFlowable(width="100%", thickness=1, color=HexColor("#E5E7EB"), spaceBefore=6, spaceAfter=6)

def sp(h=6):
    return Spacer(1, h)

def h1(text):
    return Paragraph(text, style_h1)

def h2(text):
    return Paragraph(text, style_h2)

def h3(text):
    return Paragraph(text, style_h3)

def p(text):
    return Paragraph(text, style_body)

def bullet(text):
    return Paragraph(f"&bull; {text}", style_bullet)

def bullet2(text):
    return Paragraph(f"&ndash; {text}", style_bullet2)

def numbered(n, text):
    return Paragraph(f"<b>{n}.</b> {text}", style_numbered)

def make_table(headers, rows, col_widths=None):
    """Create a styled table."""
    data = [[Paragraph(h, style_table_header) for h in headers]]
    for row in rows:
        data.append([
            Paragraph(str(c), style_table_cell_left if i == 0 else style_table_cell)
            for i, c in enumerate(row)
        ])

    avail_width = A4[0] - 3 * cm
    if col_widths is None:
        n = len(headers)
        col_widths = [avail_width / n] * n

    t = Table(data, colWidths=col_widths, repeatRows=1)
    style_cmds = [
        ("BACKGROUND", (0, 0), (-1, 0), TABLE_HEADER_BG),
        ("TEXTCOLOR", (0, 0), (-1, 0), WHITE),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, 0), 9),
        ("BOTTOMPADDING", (0, 0), (-1, 0), 8),
        ("TOPPADDING", (0, 0), (-1, 0), 8),
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ("ALIGN", (0, 0), (0, -1), "LEFT"),
        ("FONTNAME", (0, 1), (-1, -1), "Helvetica"),
        ("FONTSIZE", (0, 1), (-1, -1), 9),
        ("BOTTOMPADDING", (0, 1), (-1, -1), 6),
        ("TOPPADDING", (0, 1), (-1, -1), 6),
        ("GRID", (0, 0), (-1, -1), 0.5, HexColor("#D1D5DB")),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [WHITE, TABLE_ALT_ROW]),
    ]
    t.setStyle(TableStyle(style_cmds))
    return t


def add_page_number(canvas_obj, doc):
    """Add footer with page number."""
    canvas_obj.saveState()
    canvas_obj.setFont("Helvetica", 8)
    canvas_obj.setFillColor(GRAY)
    canvas_obj.drawCentredString(A4[0] / 2, 1.2 * cm,
        f"Tu Consul  |  Documento de Funcionalidades  |  Pagina {doc.page}")
    canvas_obj.restoreState()


def build_pdf():
    output_path = "FUNCIONALIDADES_TUCONSUL.pdf"
    doc = SimpleDocTemplate(
        output_path, pagesize=A4,
        leftMargin=1.5 * cm, rightMargin=1.5 * cm,
        topMargin=1.5 * cm, bottomMargin=2 * cm
    )
    story = []
    avail = A4[0] - 3 * cm

    # ===== COVER =====
    story.append(sp(60))
    story.append(Paragraph("Tu Consul", style_title))
    story.append(sp(8))
    story.append(Paragraph("Documento de Funcionalidades", ParagraphStyle(
        "CoverSub", parent=style_subtitle, fontSize=16, leading=20
    )))
    story.append(sp(6))
    story.append(HRFlowable(width="40%", thickness=2, color=PRIMARY, spaceBefore=10, spaceAfter=10))
    story.append(sp(6))
    story.append(Paragraph("Plataforma de gestion integral para clinicas dentales", style_subtitle))
    story.append(sp(30))
    story.append(Paragraph("Version: Marzo 2026", style_version))
    story.append(sp(80))

    # Summary table on cover
    summary_headers = ["#", "Modulo", "Descripcion"]
    summary_rows = [
        ["1", "Pagina de Presentacion", "Sitio publico con informacion, precios y registro"],
        ["2", "Reservas Online", "Pacientes agendan citas sin crear cuenta"],
        ["3", "Asistente de Bienvenida", "Configuracion guiada para clinicas nuevas"],
        ["4", "Agenda", "Gestion de citas con vista diaria/semanal"],
        ["5", "Doctores", "Directorio y agenda individual por doctor"],
        ["6", "Pacientes", "Base de datos completa con 10 pestanas"],
        ["7", "Odontograma", "Diagrama dental interactivo con historial"],
        ["8", "Historia Clinica", "Consultas, recetas y resultados de laboratorio"],
        ["9", "Laboratorio", "Ordenes a laboratorios externos"],
        ["10", "Campanas WhatsApp", "Marketing por WhatsApp con plantillas"],
        ["11", "Facturacion", "Cobros, pagos y seguimiento financiero"],
        ["12", "Comprobantes SUNAT", "Boletas y facturas electronicas"],
        ["13", "Reportes", "Graficos de ingresos y rendimiento"],
        ["14", "Configuracion", "Clinica, servicios, sedes, usuarios, horarios, SUNAT"],
        ["15", "Planes de Suscripcion", "3 planes con pago via Mercado Pago"],
    ]
    story.append(make_table(summary_headers, summary_rows, [1.2*cm, 4.5*cm, avail - 5.7*cm]))
    story.append(PageBreak())

    # ===== SECTION 1 =====
    story.append(h1("1. Pagina de Presentacion (Publica)"))
    story.append(p("La plataforma cuenta con una pagina web publica que presenta el servicio a potenciales clientes:"))
    story.append(bullet("<b>Propuesta de valor</b>: agenda inteligente + facturacion SUNAT + reservas online, todo en uno."))
    story.append(bullet("<b>Estadisticas destacadas</b>: cantidad de citas gestionadas, tiempo de actividad, rapidez de configuracion."))
    story.append(bullet("<b>Problemas que resuelve</b>: agendas en papel, pacientes que no llegan, complicaciones con SUNAT."))
    story.append(bullet("<b>Presentacion de funcionalidades</b>: 6 modulos principales con descripcion visual."))
    story.append(bullet("<b>Como funciona</b>: proceso de 3 pasos (crear cuenta, configurar clinica, empezar a atender)."))
    story.append(bullet("<b>Planes y precios</b>: comparativa de los 3 planes de suscripcion (Gratis, Basico, Premium)."))
    story.append(bullet("<b>Testimonio</b>: opinion de un profesional que usa la plataforma."))
    story.append(bullet("<b>Llamada a la accion</b>: boton para comenzar gratis."))
    story.append(hr())

    # ===== SECTION 2 =====
    story.append(h1("2. Reservas Online para Pacientes (Publica)"))
    story.append(p("Los pacientes pueden agendar citas por su cuenta a traves de un enlace exclusivo de cada clinica, sin necesidad de crear una cuenta ni iniciar sesion:"))
    story.append(numbered(1, "<b>Seleccion de doctor</b>: eligen entre los profesionales disponibles."))
    story.append(numbered(2, "<b>Seleccion de fecha</b>: navegan entre dias disponibles."))
    story.append(numbered(3, "<b>Seleccion de horario</b>: ven solo los horarios libres (excluye citas ocupadas y respeta el horario de la clinica)."))
    story.append(numbered(4, "<b>Datos del paciente</b>: ingresan nombre, correo y telefono."))
    story.append(sp(4))
    story.append(p("La clinica puede compartir su enlace de reservas desde la Configuracion."))
    story.append(hr())

    # ===== SECTION 3 =====
    story.append(h1("3. Inicio de Sesion"))
    story.append(bullet("Acceso con correo electronico y contrasena."))
    story.append(bullet("Opcion de registro para nuevos usuarios."))
    story.append(bullet("Al iniciar sesion, se redirige directamente a la Agenda."))
    story.append(hr())

    # ===== SECTION 4 =====
    story.append(h1("4. Asistente de Bienvenida (Onboarding)"))
    story.append(p("Al crear una clinica nueva, se muestra un asistente guiado de 4 pasos para la configuracion inicial:"))
    story.append(numbered(1, "<b>Bienvenida</b>: presentacion del sistema."))
    story.append(numbered(2, "<b>Horarios de atencion</b>: configurar los dias y horas en que la clinica atiende (lunes a sabado)."))
    story.append(numbered(3, "<b>Servicios</b>: seleccionar los tratamientos que ofrece la clinica y asignar precios."))
    story.append(numbered(4, "<b>Listo</b>: confirmacion y acceso al sistema."))
    story.append(sp(4))
    story.append(p("El asistente puede cerrarse y retomarse desde Configuracion."))
    story.append(hr())

    # ===== SECTION 5 =====
    story.append(h1("5. Menu Principal (Barra Lateral)"))
    story.append(p("Una vez dentro del sistema, el usuario ve un menu lateral con las siguientes secciones:"))
    menu_rows = [
        ["Agenda", "Todos"],
        ["Doctores", "Todos"],
        ["Pacientes", "Todos"],
        ["Laboratorio", "Todos"],
        ["Campanas", "Todos"],
        ["Facturacion", "Solo administradores"],
        ["Comprobantes Electronicos", "Solo administradores"],
        ["Reportes", "Solo administradores"],
        ["Configuracion", "Todos (contenido varia segun rol)"],
    ]
    story.append(make_table(["Seccion", "Acceso"], menu_rows, [avail * 0.45, avail * 0.55]))
    story.append(sp(6))
    story.append(p("El menu se adapta en celulares: se convierte en un cajon deslizable accesible desde un boton de menu."))
    story.append(p("En la barra superior hay un <b>buscador global</b> que permite encontrar pacientes rapidamente, y un boton de <b>Upgrade</b> visible para clinicas en plan gratuito o basico."))
    story.append(hr())

    # ===== SECTION 6 =====
    story.append(h1("6. Agenda"))
    story.append(p("La pantalla principal del sistema. Permite gestionar todas las citas de la clinica:"))

    story.append(h2("Vista"))
    story.append(bullet("<b>Vista por dia</b>: muestra las citas del dia en franjas horarias."))
    story.append(bullet("<b>Vista por semana</b>: muestra las citas de la semana distribuidas por doctor."))
    story.append(bullet("<b>Navegacion</b>: botones para ir al dia anterior/siguiente, y boton para volver a Hoy."))

    story.append(h2("Indicadores del dia"))
    story.append(bullet("Citas programadas para hoy"))
    story.append(bullet("Porcentaje de pacientes atendidos"))
    story.append(bullet("Cantidad de pacientes atendidos"))
    story.append(bullet("Ingresos del dia"))

    story.append(h2("Crear una cita"))
    story.append(bullet("Seleccionar paciente (busqueda rapida)"))
    story.append(bullet("Seleccionar doctor"))
    story.append(bullet("Elegir fecha y hora"))
    story.append(bullet("Tipo de cita (consulta, control, urgencia, etc.)"))
    story.append(bullet("Duracion"))
    story.append(bullet("Notas adicionales"))

    story.append(h2("Gestion de citas"))
    story.append(bullet("<b>Ver detalle</b>: al hacer clic en una cita se abre su informacion completa."))
    story.append(bullet("<b>Cambiar estado</b>: marcar como pendiente, confirmada, completada o cancelada."))
    story.append(bullet("<b>Completar cita</b>: al marcar como completada, se pueden registrar los servicios realizados con sus precios."))
    story.append(bullet("<b>Reagendar</b>: arrastrar y soltar la cita a otro horario o dia."))
    story.append(bullet("<b>Cancelar</b>: con confirmacion previa."))
    story.append(hr())

    # ===== SECTION 7 =====
    story.append(h1("7. Doctores"))
    story.append(h2("Lista de doctores"))
    story.append(p("Tarjetas individuales por cada doctor mostrando:"))
    story.append(bullet("Nombre y especialidad"))
    story.append(bullet("Foto o iniciales"))
    story.append(bullet("Citas de hoy y de la semana"))
    story.append(bullet("Total de pacientes a su cargo"))
    story.append(bullet("Proxima cita programada"))
    story.append(bullet("Estado (activo/inactivo)"))
    story.append(sp(4))
    story.append(p("Buscador por nombre o especialidad. Seccion separada para doctores inactivos."))

    story.append(h2("Perfil individual del doctor"))
    story.append(bullet("Encabezado con foto, nombre, especialidad y estado."))
    story.append(bullet("Estadisticas: citas hoy, citas de la semana, completadas, pendientes."))
    story.append(bullet("Vista de su agenda personal (dia o semana)."))
    story.append(bullet("Al seleccionar una cita se ven los detalles del paciente y el horario."))
    story.append(hr())

    # ===== SECTION 8 =====
    story.append(h1("8. Pacientes"))
    story.append(h2("Lista de pacientes"))
    story.append(bullet("Tabla con: nombre, edad, contacto, ultima visita, cantidad de visitas, etiquetas de interes, estado."))
    story.append(bullet("Buscador por nombre, correo o telefono."))
    story.append(bullet("Filtro por estado (activos/inactivos)."))
    story.append(bullet("Filtro por etiquetas de interes (para campanas)."))
    story.append(bullet("Boton para agregar nuevo paciente."))
    story.append(bullet("Exportacion de datos."))

    story.append(h2("Crear paciente"))
    story.append(bullet("Nombre completo (obligatorio), correo electronico, telefono, direccion, fecha de nacimiento, tipo de sangre, alergias."))

    story.append(h2("Perfil del paciente (10 pestanas)"))

    story.append(h3("1. Datos Personales"))
    story.append(p("Nombre, documento de identidad, genero, fecha de nacimiento, estado civil, ocupacion, nacionalidad, nivel educativo, tipo de sangre. Todo editable."))

    story.append(h3("2. Contacto"))
    story.append(p("Telefonos (fijo y celular), correo, direccion completa (ciudad, distrito, referencia), contacto de emergencia (nombre, parentesco, telefono). Todo editable."))

    story.append(h3("3. Antecedentes Medicos"))
    story.append(p("Enfermedades cronicas, alergias, medicamentos actuales, cirugias previas, hospitalizaciones, antecedentes familiares, embarazo, lactancia, tabaquismo, consumo de alcohol. Todo editable."))

    story.append(h3("4. Antecedentes Dentales"))
    story.append(p("Bruxismo, sensibilidad dental, sangrado de encias, historial de ortodoncia, frecuencia de higiene, ultima visita dental, tratamientos previos, notas dentales. Todo editable."))

    story.append(h3("5. Odontograma Interactivo"))
    story.append(bullet("Diagrama visual de las 32 piezas dentales organizadas por cuadrante."))
    story.append(bullet("Al seleccionar un diente se ven y editan sus condiciones (caries, obturaciones, ausencias, etc.)."))
    story.append(bullet("Codigo de colores para cada tipo de condicion."))
    story.append(bullet("Historial de odontogramas: se pueden crear nuevos registros y consultar los anteriores."))
    story.append(bullet("Notas por pieza dental."))

    story.append(h3("6. Seguro"))
    story.append(p("Aseguradora, plan, numero de afiliado, fechas de vigencia, indicador de estado (activo/vencido). Editable."))

    story.append(h3("7. Citas"))
    story.append(p("Lista de citas proximas del paciente con tipo, fecha, hora y estado. Boton para agendar nueva cita."))

    story.append(h3("8. Historia Clinica"))
    story.append(p("Entradas clinicas recientes (consultas, recetas, resultados de laboratorio) con fecha, tipo y descripcion. Enlace a la historia clinica completa."))

    story.append(h3("9. Intereses de Marketing"))
    story.append(p("Etiquetas de interes asignables al paciente para segmentar campanas de WhatsApp (ej: blanqueamiento, ortodoncia, implantes)."))

    story.append(h3("10. Facturacion Potencial (Plan de Tratamiento)"))
    story.append(bullet("Lista de tratamientos planificados con servicio, monto estimado, estado (pendiente/completado) y notas."))
    story.append(bullet("Se pueden marcar como completados o eliminar."))
    story.append(bullet("Resumen con ingreso potencial total y monto pendiente."))
    story.append(sp(4))
    story.append(p("En el encabezado del perfil: boton de WhatsApp directo, boton para agendar cita, y boton para eliminar paciente."))
    story.append(hr())

    # ===== SECTION 9 =====
    story.append(h1("9. Historia Clinica Detallada"))
    story.append(p("Pagina dedicada al historial clinico completo de un paciente:"))
    story.append(bullet("<b>Crear nuevo registro</b> con 3 tipos:"))
    story.append(bullet2("<b>Consulta</b>: titulo, descripcion, signos vitales (presion, temperatura, peso, talla), diagnostico."))
    story.append(bullet2("<b>Receta</b>: lista de medicamentos con dosis y duracion."))
    story.append(bullet2("<b>Resultado de laboratorio</b>: examenes con resultados y estado."))
    story.append(bullet("Tabla de registros con fecha, tipo (con icono de color), titulo, diagnostico y creador."))
    story.append(bullet("<b>Exportar</b> toda la historia clinica como archivo CSV."))
    story.append(bullet("Boton para eliminar registros individuales."))
    story.append(hr())

    # ===== SECTION 10 =====
    story.append(h1("10. Laboratorio"))
    story.append(p("Gestion de trabajos enviados a laboratorios dentales externos (coronas, protesis, etc.):"))
    story.append(h2("Crear orden"))
    story.append(bullet("Seleccionar paciente"))
    story.append(bullet("Asignar doctor"))
    story.append(bullet("Nombre del laboratorio"))
    story.append(bullet("Descripcion del trabajo (con opciones predefinidas)"))
    story.append(bullet("Piezas dentales afectadas"))
    story.append(bullet("Material y tono/color"))
    story.append(bullet("Fecha de entrega"))
    story.append(bullet("Costo estimado"))
    story.append(bullet("Notas"))

    story.append(h2("Vista de ordenes"))
    story.append(bullet("Tabla con: paciente, laboratorio, descripcion, fecha de entrega, estado, estado de pago."))
    story.append(bullet("<b>Estados</b>: ordenado, en proceso, recibido."))
    story.append(bullet("<b>Estado de pago</b>: pendiente, pagado."))
    story.append(bullet("Indicador visual de ordenes vencidas."))
    story.append(bullet("Buscador y filtros por estado y pago."))

    story.append(h2("Resumen"))
    story.append(bullet("Total de ordenes, monto pendiente de pago, ordenes vencidas, costo total."))
    story.append(hr())

    # ===== SECTION 11 =====
    story.append(h1("11. Campanas de WhatsApp"))
    story.append(p("Herramienta para enviar mensajes de marketing y recordatorios a pacientes via WhatsApp:"))
    story.append(bullet("<b>Seleccion de destinatarios</b>: lista de pacientes activos con telefono, con casillas para seleccionar individualmente o todos a la vez."))
    story.append(bullet("<b>Filtros</b>: por etiquetas de interes y por nombre."))
    story.append(bullet("<b>Plantillas predefinidas</b>: recordatorio de cita, promocion, seguimiento post-tratamiento, reactivacion de pacientes inactivos."))
    story.append(bullet("<b>Personalizacion</b>: el mensaje se personaliza automaticamente con el nombre del paciente."))
    story.append(bullet("<b>Vista previa</b>: se muestra como se vera el mensaje para el paciente seleccionado."))
    story.append(bullet("<b>Envio</b>: abre WhatsApp directamente para cada paciente seleccionado."))
    story.append(bullet("<b>Seguimiento</b>: marca a los pacientes como contactados."))
    story.append(hr())

    # ===== SECTION 12 =====
    story.append(h1("12. Facturacion (Solo Administradores)"))
    story.append(p("Registro y seguimiento de pagos e ingresos:"))

    story.append(h2("Crear factura/cobro"))
    story.append(bullet("Seleccionar paciente, servicio del catalogo, monto y notas."))

    story.append(h2("Vista de facturas"))
    story.append(bullet("Tabla con: numero, paciente, servicio, fecha, monto, metodo de pago, estado."))
    story.append(bullet("<b>Estados</b>: pagado, pendiente, vencido (con colores distintivos)."))
    story.append(bullet("Buscador por nombre de paciente o numero de factura."))
    story.append(bullet("Filtro por estado."))

    story.append(h2("Registrar pago"))
    story.append(p("Al marcar como pagada, se selecciona el metodo de pago: efectivo, tarjeta, transferencia o cheque."))

    story.append(h2("Resumen financiero"))
    story.append(bullet("Ingresos totales cobrados, ingresos pendientes, tasa de cobranza (%), exportar facturas como CSV."))
    story.append(hr())

    # ===== SECTION 13 =====
    story.append(h1("13. Comprobantes Electronicos SUNAT"))
    story.append(p("Registro de boletas y facturas electronicas emitidas ante SUNAT (solo administradores):"))
    story.append(bullet("Tabla de documentos con: tipo y numero, nombre del cliente, fecha de emision, montos (subtotal, impuesto, total), estado ante SUNAT."))
    story.append(bullet("<b>Estados SUNAT</b>: pendiente, enviado, aceptado, aceptado con observaciones, rechazado, error, anulado."))
    story.append(bullet("Buscador por nombre de cliente o numero de documento."))
    story.append(bullet("Filtro por tipo (boletas, facturas, notas de credito)."))
    story.append(bullet("Resumen: cantidad de boletas, facturas, monto total emitido, tasa de aceptacion, documentos rechazados."))
    story.append(hr())

    # ===== SECTION 14 =====
    story.append(h1("14. Reportes Financieros"))
    story.append(p("Panel de analisis financiero y operativo con graficos interactivos (solo administradores):"))
    story.append(bullet("<b>Filtro por mes y ano</b>."))
    story.append(bullet("<b>Grafico de barras</b>: ingresos por mes durante el ano seleccionado."))
    story.append(bullet("<b>Grafico circular de servicios</b>: distribucion de ingresos por tipo de servicio."))
    story.append(bullet("<b>Grafico circular de doctores</b>: ingresos generados por cada doctor."))
    story.append(bullet("<b>Tarjetas de indicadores</b>: total de citas, ingresos totales, ingreso promedio por cita, tasa de cobranza."))
    story.append(hr())

    # ===== SECTION 15 =====
    story.append(h1("15. Configuracion"))
    story.append(p("Panel de configuracion adaptado segun el rol del usuario:"))

    story.append(h2("Para Administradores (8 secciones)"))
    story.append(h3("1. Datos de la Clinica"))
    story.append(p("Nombre, correo, telefono, direccion. Incluye el enlace de reservas online para compartir con pacientes."))

    story.append(h3("2. Servicios y Precios"))
    story.append(p("Catalogo de tratamientos con nombre, precio y estado (activo/inactivo). Se pueden crear, editar y desactivar servicios."))

    story.append(h3("3. Sedes"))
    story.append(p("Gestion de sucursales: nombre, direccion, telefono, correo, indicador de sede principal, estado activo/inactivo."))

    story.append(h3("4. Equipo de Trabajo (Usuarios)"))
    story.append(p("Lista de usuarios con nombre, rol, correo, especialidad y estado. Se pueden crear usuarios nuevos (con nombre, correo, contrasena, rol y especialidad), cambiar roles, y activar/desactivar."))

    story.append(h3("5. Horarios de Atencion"))
    story.append(p("Tabla de lunes a sabado con hora de inicio, hora de fin y estado activo/inactivo por cada dia."))

    story.append(h3("6. Preferencias de Notificaciones"))
    story.append(p("Activar/desactivar notificaciones por correo y WhatsApp para: nuevas citas, recordatorios de citas (24h y 1h antes), pagos de facturas, actualizaciones de laboratorio."))

    story.append(h3("7. Facturacion y Plan"))
    story.append(p("Plan de suscripcion actual con detalle de funcionalidades, comparativa de planes, botones para cambiar de plan, historial de transacciones."))

    # Plans table
    story.append(sp(6))
    plan_headers = ["Caracteristica", "Gratis", "Basico (S/99/mes)", "Premium (S/199/mes)"]
    plan_rows = [
        ["Pacientes", "Hasta 50", "Hasta 500", "Ilimitados"],
        ["Usuarios", "1", "Hasta 3", "Ilimitados"],
        ["Sedes", "1", "1", "Ilimitadas"],
        ["Agenda", CHECK, CHECK, CHECK],
        ["Facturacion", CHECK, CHECK, CHECK],
        ["Reportes", DASH, CHECK, CHECK],
        ["SUNAT", DASH, CHECK, CHECK],
        ["Campanas", DASH, DASH, CHECK],
        ["Soporte", "Email", "Email + WhatsApp", "Prioritario"],
    ]
    story.append(make_table(plan_headers, plan_rows, [avail * 0.28, avail * 0.24, avail * 0.24, avail * 0.24]))

    story.append(h3("8. SUNAT (Facturacion Electronica)"))
    story.append(p("RUC y razon social, nombre comercial y direccion fiscal, codigo UBIGEO, usuario y contrasena SOL, series de boleta y factura, subir certificado digital (.pfx) con contrasena, seleccion de ambiente (produccion o pruebas), boton para probar conexion, indicador de estado de configuracion."))

    story.append(h2("Para Doctores y Recepcionistas (3 secciones)"))
    story.append(bullet("<b>Mi Perfil</b>: nombre, correo, especialidad."))
    story.append(bullet("<b>Notificaciones</b>: mismas opciones que administrador."))
    story.append(bullet("<b>Seguridad</b>: cambiar contrasena, cerrar sesion, ultima conexion."))
    story.append(hr())

    # ===== SECTION 16 =====
    story.append(h1("16. Roles y Permisos"))
    story.append(p("El sistema maneja 3 roles con diferentes niveles de acceso:"))
    roles_headers = ["Funcionalidad", "Admin", "Doctor", "Recepcionista"]
    roles_rows = [
        ["Agenda (ver y gestionar citas)", CHECK, CHECK, CHECK],
        ["Pacientes (ver y gestionar)", CHECK, CHECK, CHECK],
        ["Doctores (ver)", CHECK, CHECK, CHECK],
        ["Laboratorio", CHECK, CHECK, CHECK],
        ["Campanas WhatsApp", CHECK, CHECK, CHECK],
        ["Facturacion", CHECK, DASH, DASH],
        ["Comprobantes SUNAT", CHECK, DASH, DASH],
        ["Reportes financieros", CHECK, DASH, DASH],
        ["Configuracion completa", CHECK, DASH, DASH],
        ["Configuracion personal", CHECK, CHECK, CHECK],
    ]
    story.append(make_table(roles_headers, roles_rows, [avail * 0.40, avail * 0.20, avail * 0.20, avail * 0.20]))
    story.append(hr())

    # ===== SECTION 17 =====
    story.append(h1("17. Diseno Adaptable (Responsive)"))
    story.append(p("La plataforma se adapta automaticamente a cualquier dispositivo:"))
    story.append(bullet("<b>Celulares</b>: menu lateral se convierte en cajon deslizable, tablas se convierten en tarjetas, botones tactiles amplios."))
    story.append(bullet("<b>Tabletas</b>: diseno intermedio con 2 columnas."))
    story.append(bullet("<b>Computadoras</b>: diseno completo con menu lateral colapsable y hasta 3 columnas."))
    story.append(hr())

    # ===== SECTION 18 =====
    story.append(h1("18. Pasarela de Pagos (Mercado Pago)"))
    story.append(p("Integracion con Mercado Pago para el cobro de suscripciones:"))
    story.append(bullet("Al seleccionar un plan en Configuracion > Facturacion, se redirige al checkout de Mercado Pago."))
    story.append(bullet("Una vez completado el pago, el plan se actualiza automaticamente."))
    story.append(bullet("Historial de transacciones visible en la misma seccion."))

    # ===== FOOTER =====
    story.append(sp(30))
    story.append(HRFlowable(width="60%", thickness=1.5, color=PRIMARY, spaceBefore=10, spaceAfter=10))
    story.append(Paragraph("Documento generado el 21 de marzo de 2026", style_footer))
    story.append(Paragraph("Tu Consul - El sistema que tu clinica dental necesita", style_footer))

    doc.build(story, onFirstPage=add_page_number, onLaterPages=add_page_number)
    print(f"PDF generado: {output_path}")


if __name__ == "__main__":
    build_pdf()

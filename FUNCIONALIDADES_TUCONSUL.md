# Tu Consul — Documento de Funcionalidades

**Plataforma de gestión integral para clínicas dentales**
*Versión: Marzo 2026*

---

## 1. Página de Presentación (Pública)

La plataforma cuenta con una página web pública que presenta el servicio a potenciales clientes:

- **Propuesta de valor**: "Factura más y pierde menos pacientes" — agenda inteligente + facturación SUNAT + reservas online, todo en uno.
- **Estadísticas destacadas**: cantidad de citas gestionadas, tiempo de actividad, rapidez de configuración.
- **Problemas que resuelve**: agendas en papel, pacientes que no llegan, complicaciones con SUNAT.
- **Presentación de funcionalidades**: 6 módulos principales con descripción visual.
- **Cómo funciona**: proceso de 3 pasos (crear cuenta → configurar clínica → empezar a atender).
- **Planes y precios**: comparativa de los 3 planes de suscripción (Gratis, Básico, Premium).
- **Testimonio**: opinión de un profesional que usa la plataforma.
- **Llamada a la acción**: botón para comenzar gratis.

---

## 2. Reservas Online para Pacientes (Pública)

Los pacientes pueden agendar citas por su cuenta a través de un enlace exclusivo de cada clínica, sin necesidad de crear una cuenta ni iniciar sesión:

1. **Selección de doctor**: eligen entre los profesionales disponibles.
2. **Selección de fecha**: navegan entre días disponibles.
3. **Selección de horario**: ven solo los horarios libres (ya excluye citas ocupadas y respeta el horario de la clínica).
4. **Datos del paciente**: ingresan nombre, correo y teléfono.

La clínica puede compartir su enlace de reservas desde la Configuración.

---

## 3. Inicio de Sesión

- Acceso con correo electrónico y contraseña.
- Opción de registro para nuevos usuarios.
- Al iniciar sesión, se redirige directamente a la Agenda.

---

## 4. Asistente de Bienvenida (Onboarding)

Al crear una clínica nueva, se muestra un asistente guiado de 4 pasos para la configuración inicial:

1. **Bienvenida**: presentación del sistema.
2. **Horarios de atención**: configurar los días y horas en que la clínica atiende (lunes a sábado).
3. **Servicios**: seleccionar los tratamientos que ofrece la clínica (consulta general, limpieza, extracción, endodoncia, corona, etc.) y asignar precios.
4. **Listo**: confirmación y acceso al sistema.

El asistente puede cerrarse y retomarse desde Configuración.

---

## 5. Menú Principal (Barra Lateral)

Una vez dentro del sistema, el usuario ve un menú lateral con las siguientes secciones:

| Sección | Acceso |
|---------|--------|
| Agenda | Todos |
| Doctores | Todos |
| Pacientes | Todos |
| Laboratorio | Todos |
| Campañas | Todos |
| Facturación | Solo administradores |
| Comprobantes Electrónicos | Solo administradores |
| Reportes | Solo administradores |
| Configuración | Todos (contenido varía según rol) |

El menú se adapta en celulares: se convierte en un cajón deslizable accesible desde un botón de menú.

En la barra superior hay un **buscador global** que permite encontrar pacientes rápidamente, y un botón de **"Upgrade"** visible para clínicas en plan gratuito o básico.

---

## 6. Agenda

La pantalla principal del sistema. Permite gestionar todas las citas de la clínica:

### Vista
- **Vista por día**: muestra las citas del día en franjas horarias.
- **Vista por semana**: muestra las citas de la semana distribuidas por doctor.
- **Navegación**: botones para ir al día anterior/siguiente, y botón para volver a "Hoy".

### Indicadores del día
- Citas programadas para hoy
- Porcentaje de pacientes atendidos
- Cantidad de pacientes atendidos
- Ingresos del día

### Crear una cita
- Seleccionar paciente (búsqueda rápida)
- Seleccionar doctor
- Elegir fecha y hora
- Tipo de cita (consulta, control, urgencia, etc.)
- Duración
- Notas adicionales

### Gestión de citas
- **Ver detalle**: al hacer clic en una cita se abre su información completa.
- **Cambiar estado**: marcar como pendiente, confirmada, completada o cancelada.
- **Completar cita**: al marcar como completada, se pueden registrar los servicios realizados con sus precios.
- **Reagendar**: arrastrar y soltar la cita a otro horario o día.
- **Cancelar**: con confirmación previa.

---

## 7. Doctores

### Lista de doctores
- Tarjetas individuales por cada doctor mostrando:
  - Nombre y especialidad
  - Foto o iniciales
  - Citas de hoy y de la semana
  - Total de pacientes a su cargo
  - Próxima cita programada
  - Estado (activo/inactivo)
- Buscador por nombre o especialidad.
- Sección separada para doctores inactivos.

### Perfil individual del doctor
- Encabezado con foto, nombre, especialidad y estado.
- Estadísticas: citas hoy, citas de la semana, completadas, pendientes.
- Vista de su agenda personal (día o semana).
- Al seleccionar una cita se ven los detalles del paciente y el horario.

---

## 8. Pacientes

### Lista de pacientes
- Tabla con: nombre, edad, contacto, última visita, cantidad de visitas, etiquetas de interés, estado.
- Buscador por nombre, correo o teléfono.
- Filtro por estado (activos/inactivos).
- Filtro por etiquetas de interés (para campañas).
- Botón para agregar nuevo paciente.
- Exportación de datos.

### Crear paciente
- Nombre completo (obligatorio)
- Correo electrónico
- Teléfono
- Dirección
- Fecha de nacimiento
- Tipo de sangre
- Alergias

### Perfil del paciente (10 pestañas)

**1. Datos Personales**
Nombre, documento de identidad, género, fecha de nacimiento, estado civil, ocupación, nacionalidad, nivel educativo, tipo de sangre. Todo editable.

**2. Contacto**
Teléfonos (fijo y celular), correo, dirección completa (ciudad, distrito, referencia), contacto de emergencia (nombre, parentesco, teléfono). Todo editable.

**3. Antecedentes Médicos**
Enfermedades crónicas, alergias, medicamentos actuales, cirugías previas, hospitalizaciones, antecedentes familiares, embarazo, lactancia, tabaquismo, consumo de alcohol. Todo editable con casillas de verificación y campos de texto.

**4. Antecedentes Dentales**
Bruxismo, sensibilidad dental, sangrado de encías, historial de ortodoncia, frecuencia de higiene, última visita dental, tratamientos previos, notas dentales. Todo editable.

**5. Odontograma Interactivo**
- Diagrama visual de las 32 piezas dentales organizadas por cuadrante.
- Al seleccionar un diente se ven y editan sus condiciones (caries, obturaciones, ausencias, etc.).
- Código de colores para cada tipo de condición.
- Historial de odontogramas: se pueden crear nuevos registros y consultar los anteriores.
- Notas por pieza dental.

**6. Seguro**
Aseguradora, plan, número de afiliado, fechas de vigencia, indicador de estado (activo/vencido). Editable.

**7. Citas**
Lista de citas próximas del paciente con tipo, fecha, hora y estado. Botón para agendar nueva cita.

**8. Historia Clínica**
Entradas clínicas recientes (consultas, recetas, resultados de laboratorio) con fecha, tipo y descripción. Enlace a la historia clínica completa.

**9. Intereses de Marketing**
Etiquetas de interés asignables al paciente para segmentar campañas de WhatsApp (ej: blanqueamiento, ortodoncia, implantes).

**10. Facturación Potencial (Plan de Tratamiento)**
- Lista de tratamientos planificados con servicio, monto estimado, estado (pendiente/completado) y notas.
- Se pueden marcar como completados o eliminar.
- Resumen con ingreso potencial total y monto pendiente.

En el encabezado del perfil: botón de WhatsApp directo, botón para agendar cita, y botón para eliminar paciente.

---

## 9. Historia Clínica Detallada

Página dedicada al historial clínico completo de un paciente:

- **Crear nuevo registro** con 3 tipos:
  - **Consulta**: título, descripción, signos vitales (presión, temperatura, peso, talla), diagnóstico.
  - **Receta**: lista de medicamentos con dosis y duración.
  - **Resultado de laboratorio**: exámenes con resultados y estado.
- Tabla de registros con fecha, tipo (con ícono de color), título, diagnóstico y creador.
- **Exportar** toda la historia clínica como archivo CSV.
- Botón para eliminar registros individuales.

---

## 10. Laboratorio

Gestión de trabajos enviados a laboratorios dentales externos (coronas, prótesis, etc.):

### Crear orden
- Seleccionar paciente
- Asignar doctor
- Nombre del laboratorio
- Descripción del trabajo (con opciones predefinidas)
- Piezas dentales afectadas
- Material y tono/color
- Fecha de entrega
- Costo estimado
- Notas

### Vista de órdenes
- Tabla con: paciente, laboratorio, descripción, fecha de entrega, estado, estado de pago.
- **Estados**: ordenado, en proceso, recibido.
- **Estado de pago**: pendiente, pagado.
- Indicador visual de órdenes vencidas.
- Buscador y filtros por estado y pago.

### Resumen
- Total de órdenes
- Monto pendiente de pago
- Órdenes vencidas
- Costo total

---

## 11. Campañas de WhatsApp

Herramienta para enviar mensajes de marketing y recordatorios a pacientes vía WhatsApp:

- **Selección de destinatarios**: lista de pacientes activos con teléfono, con casillas para seleccionar individualmente o todos a la vez.
- **Filtros**: por etiquetas de interés y por nombre.
- **Plantillas predefinidas**:
  - Recordatorio de cita
  - Promoción
  - Seguimiento post-tratamiento
  - Reactivación de pacientes inactivos
- **Personalización**: el mensaje se personaliza automáticamente con el nombre del paciente usando `{nombre}`.
- **Vista previa**: se muestra cómo se verá el mensaje para el paciente seleccionado.
- **Envío**: abre WhatsApp directamente para cada paciente seleccionado.
- **Seguimiento**: marca a los pacientes como contactados.

---

## 12. Facturación (Solo Administradores)

Registro y seguimiento de pagos e ingresos:

### Crear factura/cobro
- Seleccionar paciente
- Seleccionar servicio del catálogo
- Monto
- Notas

### Vista de facturas
- Tabla con: número, paciente, servicio, fecha, monto, método de pago, estado.
- **Estados**: pagado, pendiente, vencido (con colores distintivos).
- Buscador por nombre de paciente o número de factura.
- Filtro por estado.

### Registrar pago
- Al marcar como pagada, se selecciona el método de pago: efectivo, tarjeta, transferencia o cheque.

### Resumen financiero
- Ingresos totales cobrados
- Ingresos pendientes
- Tasa de cobranza (%)
- Exportar facturas como archivo CSV

---

## 13. Comprobantes Electrónicos SUNAT (Solo Administradores)

Registro de boletas y facturas electrónicas emitidas ante SUNAT:

- Tabla de documentos con: tipo y número, nombre del cliente, fecha de emisión, montos (subtotal, impuesto, total), estado ante SUNAT.
- **Estados SUNAT**: pendiente, enviado, aceptado, aceptado con observaciones, rechazado, error, anulado.
- Buscador por nombre de cliente o número de documento.
- Filtro por tipo (boletas, facturas, notas de crédito).
- Resumen: cantidad de boletas, facturas, monto total emitido, tasa de aceptación, documentos rechazados.

---

## 14. Reportes Financieros (Solo Administradores)

Panel de análisis financiero y operativo con gráficos interactivos:

- **Filtro por mes y año**.
- **Gráfico de barras**: ingresos por mes durante el año seleccionado.
- **Gráfico circular de servicios**: distribución de ingresos por tipo de servicio.
- **Gráfico circular de doctores**: ingresos generados por cada doctor.
- **Tarjetas de indicadores**:
  - Total de citas
  - Ingresos totales
  - Ingreso promedio por cita
  - Tasa de cobranza

---

## 15. Configuración

Panel de configuración adaptado según el rol del usuario:

### Para Administradores (8 secciones):

**1. Datos de la Clínica**
Nombre, correo, teléfono, dirección. Incluye el enlace de reservas online para compartir con pacientes.

**2. Servicios y Precios**
Catálogo de tratamientos con nombre, precio y estado (activo/inactivo). Se pueden crear, editar y desactivar servicios.

**3. Sedes**
Gestión de sucursales: nombre, dirección, teléfono, correo, indicador de sede principal, estado activo/inactivo.

**4. Equipo de Trabajo (Usuarios)**
Lista de usuarios con nombre, rol, correo, especialidad y estado. Se pueden crear usuarios nuevos (con nombre, correo, contraseña, rol y especialidad), cambiar roles, y activar/desactivar.

**5. Horarios de Atención**
Tabla de lunes a sábado con hora de inicio, hora de fin y estado activo/inactivo por cada día.

**6. Preferencias de Notificaciones**
Activar/desactivar notificaciones por correo y WhatsApp para: nuevas citas, recordatorios de citas (24h y 1h antes), pagos de facturas, actualizaciones de laboratorio.

**7. Facturación y Plan**
- Plan de suscripción actual con detalle de funcionalidades.
- Comparativa de planes disponibles.
- Botones para cambiar de plan.
- Historial de transacciones.

**Planes disponibles:**

| | Gratis | Básico (S/99/mes) | Premium (S/199/mes) |
|---|---|---|---|
| Pacientes | Hasta 50 | Hasta 500 | Ilimitados |
| Usuarios | 1 | Hasta 3 | Ilimitados |
| Sedes | 1 | 1 | Ilimitadas |
| Agenda | Si | Si | Si |
| Facturación | Si | Si | Si |
| Reportes | - | Si | Si |
| SUNAT | - | Si | Si |
| Campañas | - | - | Si |
| Soporte | Email | Email + WhatsApp | Prioritario |

**8. SUNAT (Facturación Electrónica)**
- RUC y razón social
- Nombre comercial y dirección fiscal
- Código UBIGEO
- Usuario y contraseña SOL (SUNAT)
- Series de boleta y factura
- Subir certificado digital (.pfx) con contraseña
- Selección de ambiente (producción o pruebas)
- Botón para probar conexión
- Indicador de estado de configuración

### Para Doctores y Recepcionistas (3 secciones):

**1. Mi Perfil**: nombre, correo, especialidad.
**2. Notificaciones**: mismas opciones que administrador.
**3. Seguridad**: cambiar contraseña, cerrar sesión, última conexión.

---

## 16. Roles y Permisos

El sistema maneja 3 roles con diferentes niveles de acceso:

| Funcionalidad | Administrador | Doctor | Recepcionista |
|---------------|:---:|:---:|:---:|
| Agenda (ver y gestionar citas) | Si | Si | Si |
| Pacientes (ver y gestionar) | Si | Si | Si |
| Doctores (ver) | Si | Si | Si |
| Laboratorio | Si | Si | Si |
| Campañas WhatsApp | Si | Si | Si |
| Facturación | Si | - | - |
| Comprobantes SUNAT | Si | - | - |
| Reportes financieros | Si | - | - |
| Configuración completa | Si | - | - |
| Configuración personal | Si | Si | Si |

---

## 17. Diseño Adaptable (Responsive)

La plataforma se adapta automáticamente a cualquier dispositivo:

- **Celulares**: menú lateral se convierte en cajón deslizable, tablas se convierten en tarjetas, botones táctiles amplios.
- **Tabletas**: diseño intermedio con 2 columnas.
- **Computadoras**: diseño completo con menú lateral colapsable y hasta 3 columnas.

---

## 18. Pasarela de Pagos (Mercado Pago)

Integración con Mercado Pago para el cobro de suscripciones:

- Al seleccionar un plan en Configuración > Facturación, se redirige al checkout de Mercado Pago.
- Una vez completado el pago, el plan se actualiza automáticamente.
- Historial de transacciones visible en la misma sección.

---

## Resumen de Módulos

| # | Módulo | Descripción |
|---|--------|-------------|
| 1 | Página de Presentación | Sitio público con información, precios y registro |
| 2 | Reservas Online | Pacientes agendan citas sin crear cuenta |
| 3 | Asistente de Bienvenida | Configuración guiada para clínicas nuevas |
| 4 | Agenda | Gestión de citas con vista diaria/semanal |
| 5 | Doctores | Directorio y agenda individual por doctor |
| 6 | Pacientes | Base de datos completa con 10 pestañas de información |
| 7 | Odontograma | Diagrama dental interactivo con historial |
| 8 | Historia Clínica | Consultas, recetas y resultados de laboratorio |
| 9 | Laboratorio | Órdenes a laboratorios externos |
| 10 | Campañas | Marketing por WhatsApp con plantillas |
| 11 | Facturación | Cobros, pagos y seguimiento financiero |
| 12 | Comprobantes SUNAT | Boletas y facturas electrónicas |
| 13 | Reportes | Gráficos de ingresos y rendimiento |
| 14 | Configuración | Clínica, servicios, sedes, usuarios, horarios, SUNAT |
| 15 | Planes de Suscripción | 3 planes con pago vía Mercado Pago |

---

*Documento generado el 21 de marzo de 2026*
*Tu Consul — El sistema que tu clínica dental necesita*

-- ============================================================
-- Tu Consul — Datos de Prueba (Seed)
--
-- INSTRUCCIONES:
-- 1. Primero ejecutar schema.sql
-- 2. Crear un usuario en Supabase Auth Dashboard:
--    Email: admin@tuconsul.com | Password: admin123456
-- 3. Ejecutar este archivo en SQL Editor
-- ============================================================

-- Clínica de prueba
INSERT INTO clinics (id, name, email, phone, address, specialties, plan)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Clínica Dental Tu Consul',
  'contacto@tuconsul.com',
  '+54 11 1234-5678',
  'Av. Principal 1234, CABA',
  ARRAY['Odontología General', 'Ortodoncia', 'Endodoncia'],
  'premium'
);

-- Usuario admin (UUID: ba85a0f8-50e2-4969-9196-10811592bd56)
INSERT INTO users (id, clinic_id, full_name, email, role, specialty)
VALUES (
  'ba85a0f8-50e2-4969-9196-10811592bd56',
  '00000000-0000-0000-0000-000000000001',
  'Dr. Rodriguez',
  'admin@tuconsul.com',
  'admin',
  'Odontología General'
);

-- Horarios de la clínica (Lunes a Sábado)
INSERT INTO clinic_schedules (clinic_id, day_of_week, start_time, end_time, is_active) VALUES ('00000000-0000-0000-0000-000000000001', 0, '09:00', '18:00', true);
INSERT INTO clinic_schedules (clinic_id, day_of_week, start_time, end_time, is_active) VALUES ('00000000-0000-0000-0000-000000000001', 1, '09:00', '18:00', true);
INSERT INTO clinic_schedules (clinic_id, day_of_week, start_time, end_time, is_active) VALUES ('00000000-0000-0000-0000-000000000001', 2, '09:00', '18:00', true);
INSERT INTO clinic_schedules (clinic_id, day_of_week, start_time, end_time, is_active) VALUES ('00000000-0000-0000-0000-000000000001', 3, '09:00', '18:00', true);
INSERT INTO clinic_schedules (clinic_id, day_of_week, start_time, end_time, is_active) VALUES ('00000000-0000-0000-0000-000000000001', 4, '09:00', '18:00', true);
INSERT INTO clinic_schedules (clinic_id, day_of_week, start_time, end_time, is_active) VALUES ('00000000-0000-0000-0000-000000000001', 5, '09:00', '13:00', true);

-- Pacientes de prueba
INSERT INTO patients (id, clinic_id, full_name, email, phone, address, birthdate, blood_type, allergies, status) VALUES ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'María González', 'maria.gonzalez@email.com', '+54 11 2345-6789', 'Av. Corrientes 1234, CABA', '1981-05-15', 'O+', ARRAY['Penicilina', 'Látex'], 'active');
INSERT INTO patients (id, clinic_id, full_name, email, phone, address, birthdate, blood_type, allergies, status) VALUES ('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'Carlos Rodríguez', 'carlos.rodriguez@email.com', '+54 11 3456-7890', 'Calle San Martín 567, CABA', '1975-08-22', 'A+', ARRAY['Aspirina'], 'active');
INSERT INTO patients (id, clinic_id, full_name, email, phone, address, birthdate, blood_type, allergies, status) VALUES ('10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'Ana Martínez', 'ana.martinez@email.com', '+54 11 4567-8901', 'Av. Rivadavia 890, CABA', '1990-03-10', 'B-', '{}', 'active');
INSERT INTO patients (id, clinic_id, full_name, email, phone, address, birthdate, blood_type, allergies, status) VALUES ('10000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', 'Luis Fernández', 'luis.fernandez@email.com', '+54 11 5678-9012', 'Calle Florida 234, CABA', '1968-11-28', 'AB+', ARRAY['Ibuprofeno', 'Polen'], 'active');
INSERT INTO patients (id, clinic_id, full_name, email, phone, address, birthdate, blood_type, allergies, status) VALUES ('10000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', 'Patricia López', 'patricia.lopez@email.com', '+54 11 6789-0123', 'Av. Santa Fe 678, CABA', '1985-07-03', 'O-', '{}', 'active');
INSERT INTO patients (id, clinic_id, full_name, email, phone, address, birthdate, blood_type, allergies, status) VALUES ('10000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000001', 'Jorge Sánchez', 'jorge.sanchez@email.com', '+54 11 7890-1234', 'Calle Lavalle 345, CABA', '1972-01-17', 'A-', ARRAY['Anestesia local'], 'active');
INSERT INTO patients (id, clinic_id, full_name, email, phone, address, birthdate, blood_type, allergies, status) VALUES ('10000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000001', 'Laura Díaz', 'laura.diaz@email.com', '+54 11 8901-2345', 'Av. Belgrano 567, CABA', '1995-09-25', 'B+', '{}', 'active');
INSERT INTO patients (id, clinic_id, full_name, email, phone, address, birthdate, blood_type, allergies, status) VALUES ('10000000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000001', 'Roberto Pérez', 'roberto.perez@email.com', '+54 11 9012-3456', 'Calle Maipú 890, CABA', '1960-12-08', 'O+', ARRAY['Penicilina'], 'inactive');

-- Citas
INSERT INTO appointments (clinic_id, patient_id, doctor_id, date, start_time, duration_minutes, type, status) VALUES ('00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'ba85a0f8-50e2-4969-9196-10811592bd56', CURRENT_DATE, '09:00', 30, 'Consulta General', 'confirmed');
INSERT INTO appointments (clinic_id, patient_id, doctor_id, date, start_time, duration_minutes, type, status) VALUES ('00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', 'ba85a0f8-50e2-4969-9196-10811592bd56', CURRENT_DATE, '09:30', 60, 'Primera Vez', 'confirmed');
INSERT INTO appointments (clinic_id, patient_id, doctor_id, date, start_time, duration_minutes, type, status) VALUES ('00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000003', 'ba85a0f8-50e2-4969-9196-10811592bd56', CURRENT_DATE, '10:30', 30, 'Control', 'pending');
INSERT INTO appointments (clinic_id, patient_id, doctor_id, date, start_time, duration_minutes, type, status) VALUES ('00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000004', 'ba85a0f8-50e2-4969-9196-10811592bd56', CURRENT_DATE, '11:00', 30, 'Seguimiento', 'confirmed');
INSERT INTO appointments (clinic_id, patient_id, doctor_id, date, start_time, duration_minutes, type, status) VALUES ('00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000005', 'ba85a0f8-50e2-4969-9196-10811592bd56', CURRENT_DATE, '11:30', 30, 'Urgencia', 'pending');
INSERT INTO appointments (clinic_id, patient_id, doctor_id, date, start_time, duration_minutes, type, status) VALUES ('00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'ba85a0f8-50e2-4969-9196-10811592bd56', CURRENT_DATE - INTERVAL '7 days', '10:00', 30, 'Consulta General', 'completed');
INSERT INTO appointments (clinic_id, patient_id, doctor_id, date, start_time, duration_minutes, type, status) VALUES ('00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', 'ba85a0f8-50e2-4969-9196-10811592bd56', CURRENT_DATE - INTERVAL '14 days', '11:00', 30, 'Control', 'completed');
INSERT INTO appointments (clinic_id, patient_id, doctor_id, date, start_time, duration_minutes, type, status) VALUES ('00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000003', 'ba85a0f8-50e2-4969-9196-10811592bd56', CURRENT_DATE - INTERVAL '21 days', '09:30', 60, 'Primera Vez', 'completed');
INSERT INTO appointments (clinic_id, patient_id, doctor_id, date, start_time, duration_minutes, type, status) VALUES ('00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'ba85a0f8-50e2-4969-9196-10811592bd56', CURRENT_DATE + INTERVAL '7 days', '10:00', 30, 'Control', 'confirmed');

-- Consultas médicas
INSERT INTO consultations (clinic_id, patient_id, doctor_id, date, time, type, title, description, blood_pressure, temperature, weight, height, diagnosis) VALUES ('00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'ba85a0f8-50e2-4969-9196-10811592bd56', CURRENT_DATE - INTERVAL '7 days', '10:30', 'consulta', 'Consulta General', 'Control de rutina. Paciente en buen estado general.', '120/80', '36.5°C', '68kg', '165cm', 'Control de rutina');
INSERT INTO consultations (id, clinic_id, patient_id, doctor_id, date, time, type, title) VALUES ('20000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'ba85a0f8-50e2-4969-9196-10811592bd56', CURRENT_DATE - INTERVAL '7 days', '10:45', 'prescription', 'Receta Médica');
INSERT INTO prescriptions (consultation_id, medication_name, dosage, duration) VALUES ('20000000-0000-0000-0000-000000000002', 'Ibuprofeno 400mg', '1 comprimido cada 8 horas', '5 días');
INSERT INTO prescriptions (consultation_id, medication_name, dosage, duration) VALUES ('20000000-0000-0000-0000-000000000002', 'Amoxicilina 500mg', '1 cápsula cada 8 horas', '7 días');
INSERT INTO consultations (id, clinic_id, patient_id, doctor_id, date, time, type, title) VALUES ('20000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'ba85a0f8-50e2-4969-9196-10811592bd56', CURRENT_DATE - INTERVAL '14 days', '11:00', 'lab', 'Resultados de Laboratorio');
INSERT INTO lab_results (consultation_id, test_name, result, status) VALUES ('20000000-0000-0000-0000-000000000003', 'Hemograma completo', 'Normal', 'normal');
INSERT INTO lab_results (consultation_id, test_name, result, status) VALUES ('20000000-0000-0000-0000-000000000003', 'Glucemia', '95 mg/dL', 'normal');
INSERT INTO lab_results (consultation_id, test_name, result, status) VALUES ('20000000-0000-0000-0000-000000000003', 'Radiografía panorámica', 'Sin hallazgos', 'normal');

-- Facturas
INSERT INTO invoices (clinic_id, patient_id, date, amount, service, payment_method, status, paid_at) VALUES ('00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', CURRENT_DATE, 1500, 'Consulta General', 'Tarjeta de Crédito', 'paid', NOW());
INSERT INTO invoices (clinic_id, patient_id, date, amount, service, payment_method, status, paid_at) VALUES ('00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', CURRENT_DATE, 2500, 'Limpieza Dental', NULL, 'pending', NULL);
INSERT INTO invoices (clinic_id, patient_id, date, amount, service, payment_method, status, paid_at) VALUES ('00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000003', CURRENT_DATE - INTERVAL '1 day', 1500, 'Consulta General', 'Efectivo', 'paid', NOW() - INTERVAL '1 day');
INSERT INTO invoices (clinic_id, patient_id, date, amount, service, payment_method, status, paid_at) VALUES ('00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000004', CURRENT_DATE - INTERVAL '1 day', 3000, 'Tratamiento de Conducto', 'Transferencia', 'paid', NOW() - INTERVAL '1 day');
INSERT INTO invoices (clinic_id, patient_id, date, amount, service, payment_method, status, paid_at) VALUES ('00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000005', CURRENT_DATE - INTERVAL '3 days', 1500, 'Consulta General', NULL, 'overdue', NULL);
INSERT INTO invoices (clinic_id, patient_id, date, amount, service, payment_method, status, paid_at) VALUES ('00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000006', CURRENT_DATE - INTERVAL '4 days', 2000, 'Corona Dental', 'Tarjeta de Débito', 'paid', NOW() - INTERVAL '4 days');
INSERT INTO invoices (clinic_id, patient_id, date, amount, service, payment_method, status, paid_at) VALUES ('00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000007', CURRENT_DATE - INTERVAL '4 days', 1500, 'Primera Consulta', NULL, 'pending', NULL);
INSERT INTO invoices (clinic_id, patient_id, date, amount, service, payment_method, status, paid_at) VALUES ('00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000008', CURRENT_DATE - INTERVAL '5 days', 1800, 'Extracción', 'Efectivo', 'paid', NOW() - INTERVAL '5 days');

-- Preferencias de notificación
INSERT INTO notification_preferences (user_id, new_appointments, appointment_reminders, appointment_changes, patient_messages, system_updates) VALUES ('ba85a0f8-50e2-4969-9196-10811592bd56', true, true, true, false, false);

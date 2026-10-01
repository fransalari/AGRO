from fpdf import FPDF
from pathlib import Path
from datetime import date

OUT = Path(__file__).resolve().parent
PDF_PATH = OUT / "Presentacion_Proyecto_App_Cursogramas_Sancor.pdf"

GREEN = (0, 128, 95)
DARK = (33, 37, 41)
GRAY = (90, 98, 104)
ACCENT = (46, 125, 90)
CONTENT_W = 180


class PDF(FPDF):
    def header(self):
        if self.page_no() == 1:
            return
        self.set_fill_color(*GREEN)
        self.rect(0, 0, 210, 12, "F")
        self.set_y(3)
        self.set_font("Helvetica", "B", 8)
        self.set_text_color(255, 255, 255)
        self.cell(
            0,
            6,
            "Sancor Seguros  |  Proyecto App de Gestion de Cursogramas",
            align="C",
            new_x="LMARGIN",
            new_y="NEXT",
        )
        self.ln(8)
        self.set_text_color(*DARK)

    def footer(self):
        self.set_y(-14)
        self.set_draw_color(*GREEN)
        self.set_line_width(0.3)
        self.line(15, self.get_y(), 195, self.get_y())
        self.set_y(-11)
        self.set_font("Helvetica", "", 8)
        self.set_text_color(*GRAY)
        self.cell(
            0,
            8,
            f"Confidencial  |  {date.today().strftime('%d/%m/%Y')}  |  Pagina {self.page_no()}/{{nb}}",
            align="C",
        )

    def section_title(self, num, title):
        self.set_x(self.l_margin)
        self.set_fill_color(*GREEN)
        self.set_text_color(255, 255, 255)
        self.set_font("Helvetica", "B", 13)
        self.cell(
            CONTENT_W,
            9,
            f"  {num}.  {title}",
            new_x="LMARGIN",
            new_y="NEXT",
            fill=True,
        )
        self.ln(3)
        self.set_text_color(*DARK)

    def sub_title(self, text):
        self.set_x(self.l_margin)
        self.set_font("Helvetica", "B", 11)
        self.set_text_color(*ACCENT)
        self.cell(CONTENT_W, 7, text, new_x="LMARGIN", new_y="NEXT")
        self.set_text_color(*DARK)

    def body(self, text):
        self.set_x(self.l_margin)
        self.set_font("Helvetica", "", 10)
        self.set_text_color(*DARK)
        self.multi_cell(CONTENT_W, 5.5, text)
        self.ln(1)

    def bullet(self, text):
        self.set_x(self.l_margin + 4)
        self.set_font("Helvetica", "B", 10)
        self.set_text_color(*GREEN)
        self.cell(5, 5.5, "-")
        self.set_font("Helvetica", "", 10)
        self.set_text_color(*DARK)
        self.multi_cell(CONTENT_W - 9, 5.5, text)
        self.ln(0.4)

    def key_value(self, key, value):
        self.set_x(self.l_margin)
        self.set_font("Helvetica", "B", 10)
        self.set_text_color(*GREEN)
        self.cell(58, 6, key)
        self.set_font("Helvetica", "", 10)
        self.set_text_color(*DARK)
        self.multi_cell(CONTENT_W - 58, 6, value)

    def legend_row(self, color, label, meaning):
        self.set_x(self.l_margin)
        self.set_fill_color(*color)
        self.cell(8, 6, "", fill=True)
        self.cell(3, 6, "")
        self.set_font("Helvetica", "B", 9)
        self.set_text_color(*DARK)
        self.cell(48, 6, label)
        self.set_font("Helvetica", "", 9)
        self.set_text_color(*GRAY)
        self.multi_cell(CONTENT_W - 59, 6, meaning)
        self.ln(1)

    def card_box(self, title, lines):
        self.set_x(self.l_margin)
        self.set_font("Helvetica", "B", 10)
        self.set_text_color(*GREEN)
        self.cell(CONTENT_W, 6, title, new_x="LMARGIN", new_y="NEXT")
        self.set_font("Helvetica", "", 9)
        self.set_text_color(*DARK)
        for line in lines:
            self.set_x(self.l_margin)
            self.multi_cell(CONTENT_W, 5, f"- {line}")
        self.ln(3)

    def labeled_line(self, label, text):
        self.set_x(self.l_margin)
        self.set_font("Helvetica", "B", 10)
        self.set_text_color(*GREEN)
        self.cell(22, 6, label)
        self.set_font("Helvetica", "", 10)
        self.set_text_color(*DARK)
        self.multi_cell(CONTENT_W - 22, 6, text)


def main():
    pdf = PDF(orientation="P", unit="mm", format="A4")
    pdf.set_margins(15, 18, 15)
    pdf.alias_nb_pages()
    pdf.set_auto_page_break(auto=True, margin=18)
    pdf.add_page()

    # Cover
    pdf.set_fill_color(*GREEN)
    pdf.rect(0, 0, 210, 95, "F")
    pdf.set_y(28)
    pdf.set_font("Helvetica", "B", 14)
    pdf.set_text_color(255, 255, 255)
    pdf.cell(0, 8, "SANCOR SEGUROS", align="C", new_x="LMARGIN", new_y="NEXT")
    pdf.ln(4)
    pdf.set_font("Helvetica", "B", 22)
    pdf.multi_cell(0, 10, "Proyecto App Web\nde Gestion de Cursogramas", align="C")
    pdf.ln(2)
    pdf.set_font("Helvetica", "", 12)
    pdf.multi_cell(
        0,
        6,
        "De la tabla dinamica de Google Sheets\na una plataforma operativa continua",
        align="C",
    )

    pdf.set_y(108)
    pdf.set_text_color(*DARK)
    pdf.set_font("Helvetica", "B", 12)
    pdf.cell(
        0,
        8,
        "Documento de presentacion del proyecto",
        align="C",
        new_x="LMARGIN",
        new_y="NEXT",
    )
    pdf.set_font("Helvetica", "", 10)
    pdf.set_text_color(*GRAY)
    pdf.cell(
        0,
        6,
        f"Fecha: {date.today().strftime('%d/%m/%Y')}",
        align="C",
        new_x="LMARGIN",
        new_y="NEXT",
    )
    pdf.cell(
        0,
        6,
        "Alcance: datos, frontend, permisos, despliegue masivo y actualizacion autonoma",
        align="C",
        new_x="LMARGIN",
        new_y="NEXT",
    )

    pdf.ln(8)
    pdf.set_draw_color(*GREEN)
    pdf.set_line_width(0.6)
    pdf.line(40, pdf.get_y(), 170, pdf.get_y())
    pdf.ln(8)

    pdf.set_font("Helvetica", "B", 11)
    pdf.set_text_color(*GREEN)
    pdf.cell(CONTENT_W, 7, "Objetivo general", new_x="LMARGIN", new_y="NEXT")
    pdf.body(
        "Reemplazar el trabajo manual sobre la hoja de calculo / tabla dinamica por una aplicacion web "
        "estable, siempre disponible, con alertas a lideres, asignacion de cursogramas a usuarios, reglas "
        "de negocio preservadas (colores, vencimientos, normas ADIG, modos de carga) y actualizacion "
        "continua sin depender de formulas fragiles."
    )

    pdf.sub_title("Fuentes de referencia")
    pdf.bullet(
        "Carpeta Drive operativa: https://drive.google.com/drive/folders/10r9xn72xe3ZIDnqI8zt1fovmJujpxN6Q"
    )
    pdf.bullet(
        "Carpeta Drive complementaria: https://drive.google.com/drive/folders/1ZoluGngOyF3vdPXnX_vtGeK7ZeFTqakE"
    )
    pdf.bullet(
        "Hoja de calculo actual (tabla dinamica) + Hoja 2 con formulas de actualizacion diaria"
    )
    pdf.ln(2)
    pdf.set_x(pdf.l_margin)
    pdf.set_font("Helvetica", "I", 9)
    pdf.set_text_color(*GRAY)
    pdf.multi_cell(
        CONTENT_W,
        5,
        "Nota: las carpetas de Drive requieren autenticacion; este documento se elaboro a partir del "
        "alcance funcional descripto y de la logica operativa de la tabla dinamica. Las referencias "
        "exactas de columnas se completan al mapear la hoja. No se modifico ninguna carpeta fuente.",
    )

    # Index
    pdf.add_page()
    pdf.section_title("0", "Indice y vision del producto")
    pdf.body(
        "El proyecto se organiza en cinco pasos secuenciales, desde la limpieza de datos hasta la autonomia operativa."
    )

    steps = [
        ("Paso 1", "Limpiar y consolidar la base de datos con los campos criticos de negocio."),
        ("Paso 2", "Construir un frontend web que reproduzca y mejore la tabla dinamica actual."),
        ("Paso 3", "Probar el sistema con zonas de permisos y configuracion para lideres/gerentes."),
        ("Paso 4", "Escalar a una implementacion masiva en produccion."),
        ("Paso 5", "Modelar la logica de la hoja para actualizacion continua y autonoma."),
    ]
    for t, d in steps:
        pdf.labeled_line(t, d)

    pdf.ln(4)
    pdf.sub_title("Resultado esperado")
    pdf.bullet("App web 24/7, sin caidas por dependencia de formulas locales.")
    pdf.bullet("Alertas a lideres ante nuevos ingresos / registros disponibles.")
    pdf.bullet("Asignacion de cursogramas a usuarios con control de carga.")
    pdf.bullet("Preservacion de comentarios y asignaciones humanas en cada actualizacion.")
    pdf.bullet("Reglas visuales y de negocio (vencimientos, complejidad, ADIG, Excel prestador).")

    # Paso 1
    pdf.add_page()
    pdf.section_title("1", "Limpiar y consolidar la base de datos")
    pdf.body(
        "Consolidar solo los datos mas importantes para la operacion diaria, reduciendo ruido y dejando "
        "una base limpia, tipada y apta para alimentar la app."
    )

    pdf.sub_title("Campos prioritarios a conservar / crear")
    fields = [
        ("Fecha de objetivo:", "Columna a mapear desde la tabla dinamica (vencimiento operativo)."),
        ("Usuario asignado:", "Nombre del usuario responsable del cursograma."),
        ("Provision:", "Provision asociada al caso / cursograma."),
        ("Asignacion/usuario:", "NUEVO: pront matematico / formula de balanceo de carga."),
        ("Categoria:", "Datos relacionados de la categoria perteneciente."),
        ("Norma ADIG:", "Si el prestador tiene norma ADIG para carga masiva."),
        ("Carga manual:", "Flag + cantidad de dias que lleva la carga."),
        ("Carga mixta:", "Flag + cantidad de dias (x dias)."),
        ("Carga por app:", "Flag + cantidad de dias (x dias)."),
        ("Carga masiva:", "Flag + cantidad de dias (x dias)."),
        ("Mixta 2 provis.:", "Caso especial de mezcla entre dos provisiones."),
    ]
    for k, v in fields:
        pdf.key_value(k, v)

    pdf.ln(3)
    pdf.sub_title("Entregables del Paso 1")
    pdf.bullet("Diccionario de datos (columna origen -> campo destino).")
    pdf.bullet("Script/proceso de limpieza y consolidacion.")
    pdf.bullet("Definicion del pront matematico de asignacion por usuario.")
    pdf.bullet("Dataset maestro validado (sin duplicados criticos, tipado correcto).")

    # Paso 2
    pdf.add_page()
    pdf.section_title("2", "Frontend web operativo (reemplazo de la tabla dinamica)")
    pdf.body(
        "Crear un frontend especifico que adapte el funcionamiento actual de la tabla dinamica a una app web "
        "siempre en funcionamiento, con alertas y operaciones de asignacion."
    )

    pdf.sub_title("Capacidades clave")
    pdf.bullet("Vista operativa equivalente a la tabla dinamica (filtros, orden, estados, colores).")
    pdf.bullet("Disponibilidad continua (servicio web estable, sin depender de una sesion de Sheets).")
    pdf.bullet("Alertas a lideres ante nuevos ingresos de registros / usuarios disponibles.")
    pdf.bullet("Asignacion de cursogramas a usuarios desde la interfaz.")
    pdf.bullet("Indicadores de carga por usuario (soportados por el pront matematico).")
    pdf.bullet("Bandejas por modo de carga: manual, mixta, app, masiva, mixta de dos provisiones.")
    pdf.bullet("Identificacion de prestadores con norma ADIG / Excel de liquidacion.")

    pdf.ln(2)
    pdf.sub_title("Modulos sugeridos de la app")
    pdf.card_box(
        "1) Panel de lideres",
        [
            "Alertas de nuevos registros disponibles",
            "Reasignacion y balanceo de carga",
            "Seguimiento de vencimientos (semana / dia)",
        ],
    )
    pdf.card_box(
        "2) Mesa operativa / usuarios",
        [
            "Cola de cursogramas asignados",
            "Comentarios persistentes",
            "Marcas de complejidad y estado de carga",
        ],
    )
    pdf.card_box(
        "3) Administracion / configuracion",
        [
            "Usuarios, roles y permisos",
            "Parametros del pront de asignacion",
            "Reglas de colores y SLA de dias por tipo de carga",
        ],
    )

    # Paso 3
    pdf.add_page()
    pdf.section_title("3", "Pruebas con zonas de permisos y configuracion")
    pdf.body(
        "Poner a prueba el sistema desarrollado con diferentes zonas de permisos y de configuracion, "
        "pensadas para lideres y gerentes empresariales."
    )

    pdf.sub_title("Matriz de roles (propuesta)")
    roles = [
        ("Operador:", "Ver asignados, editar comentarios, actualizar estado de carga propia."),
        ("Lider:", "Asignar/reasignar, ver alertas, configurar carga del equipo, ver vencimientos."),
        ("Gerente:", "Vision consolidada, parametros globales, reportes y auditoria."),
        ("Admin tecnico:", "Integraciones, actualizacion de datos, reglas de sistema, soporte."),
    ]
    for k, v in roles:
        pdf.key_value(k, v)

    pdf.ln(2)
    pdf.sub_title("Plan de prueba")
    pdf.bullet("Casos de uso: ingreso nuevo, asignacion, vencimiento dia/semana, ADIG, carga mixta.")
    pdf.bullet("Pruebas de permisos negativos (un operador no debe poder reasignar masivamente).")
    pdf.bullet("Pruebas de concurrencia (varios lideres asignando a la vez).")
    pdf.bullet("Pruebas de actualizacion diaria sin perdida de comentarios ni usuarios asignados.")
    pdf.bullet("UAT con lideres reales antes del despliegue masivo.")

    # Paso 4
    pdf.add_page()
    pdf.section_title("4", "Implementacion masiva")
    pdf.body(
        "Llevar la idea a una implementacion masiva: adopcion por equipos, capacitacion, monitoreo "
        "y estabilizacion en produccion."
    )

    pdf.sub_title("Fases de despliegue")
    pdf.bullet("Piloto controlado con un equipo / zona.")
    pdf.bullet("Ajuste de reglas y UX con feedback de lideres.")
    pdf.bullet("Rollout por oleadas (equipos / gerencias).")
    pdf.bullet("Corte gradual de dependencia de la tabla dinamica como herramienta primaria.")
    pdf.bullet("Monitoreo de disponibilidad, alertas y tiempos de actualizacion.")

    pdf.ln(2)
    pdf.sub_title("Columnas de la tabla dinamica (a mapear)")
    pdf.body(
        "Referencia: 'Hoja de calculo sin titulo - Hojas de calculo de Google'. "
        "En esta etapa se documenta el mapeo completo columna por columna (letra, nombre, tipo, regla, "
        "si es editable por usuario o calculado por sistema)."
    )
    pdf.bullet("Columna A: CP = Cursograma (clave de negocio).")
    pdf.bullet("Columna D: Nro acreedor (complejos marcados en verde por formula).")
    pdf.bullet("Columna Comentarios: persistente; coloreada por vencimiento.")
    pdf.bullet("CUIT: naranja = prestador con Excel para pronta liquidacion.")
    pdf.bullet("Resto de columnas: inventario completo durante el mapeo funcional.")

    # Paso 5
    pdf.add_page()
    pdf.section_title("5", "Entender la hoja y lograr actualizacion autonoma")
    pdf.body(
        "Comprender el funcionamiento de la hoja en cada paso para luego llevar el sistema a una "
        "actualizacion continua y autonoma, sin tener que mantener formulas manuales para refrescar datos."
    )

    pdf.sub_title("Reglas criticas de actualizacion (no negociables)")
    pdf.bullet(
        "Comentarios y nombres de usuarios NO deben borrarse nunca en la actualizacion, "
        "salvo que el CP (cursograma, columna A) no aparezca en la nueva actualizacion."
    )
    pdf.bullet("Nro acreedor (columna D): los pintados de verde mediante formula son complejos.")
    pdf.bullet(
        "Vencimiento de fecha de objetivo en la misma semana: pintar de naranja la celda de comentarios."
    )
    pdf.bullet("Vencimiento en el dia: pintar de rojo la celda de comentarios.")
    pdf.bullet("CUIT pintado de naranja: prestadores que tienen Excel para su pronta liquidacion.")
    pdf.bullet("Hoja 2: formulas de actualizacion de la nueva hoja de calculo que bajan diariamente.")

    pdf.ln(2)
    pdf.sub_title("Leyenda visual a preservar en la app")
    pdf.legend_row((46, 204, 113), "Verde (acreedor)", "Casos complejos (hoy por formula).")
    pdf.legend_row((230, 126, 34), "Naranja (comentarios)", "Vence dentro de la misma semana.")
    pdf.legend_row((192, 57, 43), "Rojo (comentarios)", "Vence en el dia.")
    pdf.legend_row((230, 126, 34), "Naranja (CUIT)", "Prestador con Excel / liquidacion pronta.")

    pdf.ln(2)
    pdf.sub_title("Modelo objetivo de actualizacion autonoma")
    pdf.bullet("Ingesta diaria del origen (equivalente a lo que hoy hace la Hoja 2).")
    pdf.bullet("Merge inteligente por CP: actualiza datos de sistema, preserva datos humanos.")
    pdf.bullet("Baja/archivo de CP que ya no vienen en la actualizacion (con politica de historial).")
    pdf.bullet("Recalculo de flags visuales y SLA por reglas de negocio en backend (no formulas de celda).")
    pdf.bullet("Auditoria de cambios (quien asigno, quien comento, que se sobrescribio).")

    # Ideas extra
    pdf.add_page()
    pdf.section_title("+", "Ideas adicionales (sin modificar carpetas fuente)")
    pdf.body(
        "Al revisar el alcance, surgen mejoras naturales para la app. Se listan como propuestas; "
        "no se modifico ninguna carpeta ni archivo de Drive."
    )

    pdf.sub_title("Operacion y control")
    pdf.bullet("Dashboard de carga por usuario / equipo / provision / categoria.")
    pdf.bullet("Cola priorizada por vencimiento (rojo > naranja > resto) y complejidad.")
    pdf.bullet("Alertas por canal (mail / Teams) a lideres ante picos de ingresos.")
    pdf.bullet("Bloqueo suave de sobreasignacion segun el pront matematico.")

    pdf.sub_title("Calidad de datos")
    pdf.bullet("Validacion de CUIT / acreedor / provision al ingresar.")
    pdf.bullet("Deteccion de duplicados de CP y conflictos de asignacion.")
    pdf.bullet("Historial de comentarios (append-only) ademas del comentario vigente.")

    pdf.sub_title("ADIG y modos de carga")
    pdf.bullet("Checklist automatico segun modo: manual / mixto / app / masivo.")
    pdf.bullet("Estimacion de dias restantes vs dias objetivo por tipo de carga.")
    pdf.bullet("Ruta especial para mixtas de dos provisiones (doble tracking).")

    pdf.sub_title("Gobierno y escala")
    pdf.bullet("Parametros configurables por gerencia (sin redeploy).")
    pdf.bullet("Exportes controlados (Excel) para liquidacion / auditoria.")
    pdf.bullet("Modo sombra: app en paralelo a Sheets durante el piloto.")

    # Roadmap
    pdf.add_page()
    pdf.section_title("R", "Hoja de ruta resumida")

    phases = [
        ("Fase A - Datos", "Mapear columnas, limpiar, definir pront matematico, dataset maestro."),
        ("Fase B - App nucleo", "Login/roles, grilla operativa, asignacion, comentarios persistentes."),
        ("Fase C - Reglas", "Colores/SLA, ADIG, modos de carga, alertas a lideres."),
        ("Fase D - Sync", "Ingesta diaria + merge por CP sin perder datos humanos."),
        ("Fase E - Piloto", "Pruebas de permisos con lideres/gerentes y ajustes."),
        ("Fase F - Masivo", "Rollout, capacitacion, monitoreo y retiro gradual de Sheets."),
    ]
    for t, d in phases:
        pdf.set_x(pdf.l_margin)
        pdf.set_font("Helvetica", "B", 10)
        pdf.set_text_color(*GREEN)
        pdf.cell(40, 7, t)
        pdf.set_font("Helvetica", "", 10)
        pdf.set_text_color(*DARK)
        pdf.multi_cell(CONTENT_W - 40, 7, d)

    pdf.ln(6)
    pdf.sub_title("Criterios de exito")
    pdf.bullet(
        "Cero perdida de comentarios/asignaciones en actualizaciones diarias (salvo CP ausente)."
    )
    pdf.bullet("Lideres reciben alertas utiles de nuevos ingresos.")
    pdf.bullet("Asignacion guiada por carga equilibrada (pront matematico).")
    pdf.bullet("Reglas visuales equivalentes o superiores a la hoja actual.")
    pdf.bullet("Sistema estable en uso continuo (alta disponibilidad operativa).")

    pdf.ln(8)
    pdf.set_x(pdf.l_margin)
    pdf.set_fill_color(*GREEN)
    pdf.set_text_color(255, 255, 255)
    pdf.set_font("Helvetica", "B", 11)
    pdf.multi_cell(
        CONTENT_W,
        8,
        "  Proximo paso recomendado: mapear columna por columna la tabla dinamica y confirmar "
        "nombres exactos de campos + formula del pront matematico.",
        fill=True,
    )

    pdf.ln(10)
    pdf.set_x(pdf.l_margin)
    pdf.set_text_color(*GRAY)
    pdf.set_font("Helvetica", "I", 9)
    pdf.multi_cell(
        CONTENT_W,
        5,
        "Documento generado para presentacion interna del proyecto. Referencias Drive incluidas; "
        "contenido funcional basado en el brief operativo provisto.",
    )

    pdf.output(str(PDF_PATH))
    print(str(PDF_PATH))


if __name__ == "__main__":
    main()

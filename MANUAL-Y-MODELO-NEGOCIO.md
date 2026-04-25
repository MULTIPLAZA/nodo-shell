# NODO Shell — Manual y Modelo de Negocio

**Versión:** 1.0 — Abril 2026
**Autores:** Emiliano Vitale + Carlos Cardozo (NODO)
**Estado:** Documento vivo — actualizar cuando cambien decisiones estructurales.

---

## Resumen ejecutivo en una página

**Qué es NODO Shell.** Una plataforma propietaria de aplicaciones de gestión empresarial, con identidad visual reconocible (ribbon Office 2010, MDI, densidad alta, atajos de teclado profesionales) y stack PWA moderno. NO es un producto. Es la **infraestructura común** sobre la cual NODO construye todos sus verticales: ERP de distribución, sistema odontológico, gestión de talleres, inmobiliaria, médico, financiero, etc.

**Mercado objetivo.** Empresas medianas y profesionales con operación administrativa intensa: distribuidoras, importadoras, talleres técnicos, consultorios profesionales, inmobiliarias, cooperativas, financieras chicas, empresas de servicios. **NO está dirigido a comercios pequeños tipo lomiterías, despensas o gastronomía de barrio** — ese mercado tiene otro carril en NODO (línea POS gastronomía con su propio producto y posicionamiento). NODO Shell apunta a negocios donde el sistema se usa 6–10 horas al día por personal de oficina, multi-usuario, multi-sucursal, con flujos administrativos complejos. Si un vertical NODO incluye un TPV (ej: distribuidoras con mostrador de venta), es como **módulo interno**, no como propuesta principal.

**Por qué existe.** Porque en la era IA el código tiende a costo cero, pero la **identidad de marca, la coherencia de UX, la densidad de uso profesional y la integración regulatoria local (SIFEN)** son activos no replicables por un agente. NODO Shell concentra esos activos en un solo lugar y los multiplica al servicio de cualquier vertical que NODO decida construir.

**Cómo se monetiza.** No se vende el shell. Se venden **verticales construidos sobre el shell** vía suscripción mensual (NODO Distribución, NODO Odonto, NODO Taller, etc.) y **proyectos a medida** ejecutados por la Fábrica de Software de NODO usando el shell como base. El cliente final nunca compra "el shell" — compra "su sistema". El shell es el activo invisible que hace que todo lo demás escale.

**Qué multiplica.** La velocidad de la Fábrica de Software (cada proyecto arranca con 60% del UI ya resuelto), la coherencia de marca (todos los productos NODO se ven iguales), la madurez de componentes (lo construido para un vertical sirve para los siguientes), y el costo marginal de captar un nuevo nicho (de 600 horas a 250 horas por vertical nuevo).

**El compromiso central.** No forkear nunca. Una sola plataforma, muchas configuraciones, cero excepciones de código por cliente. Las customizaciones específicas viven como proyectos a medida cobrados aparte, no como adaptaciones del shell.

---

# PARTE I — MANIFIESTO DE NODO SHELL

## 1. Qué es NODO Shell

NODO Shell es:

- **Un shell aplicativo con identidad propia.** Layout (titlebar, QAT, ribbon, MDI, status bar), atajos de teclado profesionales, theming, instalable como PWA, offline-ready.
- **Un catálogo de componentes maduros.** Grilla densa, formularios maestro-detalle, lookup, treeview, agenda, charts, side panels, wizards, report viewer, toast.
- **Un opinión fuerte de UX.** Desktop-first (1366×768 mínimo), densidad alta, navegación por teclado, comportamiento reconocible para usuarios provenientes de software empresarial desktop (Tango, Calipso, Bejerman, ERP Lite original).
- **Una plataforma vertical-paraguaya.** SIFEN integrado, tipos de impuestos PY, formularios fiscales locales, idioma español paraguayo, soporte humano local.
- **El activo común detrás de todos los productos NODO.** Cada vertical (Odonto, Taller, Distribución, etc.) consume el shell. El shell no consume a nadie.

## 2. Qué NO es NODO Shell

NODO Shell **no** es:

- **No es un ERP.** Aunque uno de sus verticales sea un ERP, el shell por sí mismo no resuelve negocio. Solo provee la infraestructura.
- **No es un POS de gastronomía ni un sistema para comercios pequeños.** Las lomiterías, pizzerías, despensas, kioscos y minisúper tienen otro carril dentro de NODO (línea POS gastronomía, producto distinto, marca distinta, marketing distinto). NODO Shell apunta a empresas con complejidad administrativa real, multi-usuario, multi-sucursal, donde el sistema se usa profesionalmente 6+ horas al día. Si un vertical NODO eventualmente integra un TPV (ej: distribuidora con mostrador de venta), es como **módulo dentro del vertical**, no como propuesta principal.
- **No es un framework genérico tipo React/Angular.** Es opinado, vertical, y no aspira a competir con frameworks horizontales globales.
- **No es un low-code para no-developers.** No apunta a que un dueño de negocio construya su sistema clickeando. Lo usa el equipo de NODO (o eventualmente partners autorizados) para construir verticales rápido.
- **No es un producto que el cliente final compra.** El cliente compra un vertical (NODO Odonto, NODO Distribución…). El shell es invisible.
- **No es un experimento.** Es la apuesta estructural de la empresa. Toda la economía de NODO en 2027–2030 depende de que esto funcione.

## 3. Los siete principios fundacionales

### Principio 1 — Una sola plataforma, muchas configuraciones.
Cualquier diferencia entre clientes se resuelve con configuración (toggles, parámetros, módulos activables, temas). **Nunca con código bifurcado.** Si un cliente pide algo que no se puede resolver con configuración, o se eleva al shell para todos, o se cobra como proyecto a medida aparte, o se rechaza.

### Principio 2 — Densidad sobre amabilidad.
NODO Shell está pensado para profesionales que pasan 6–10 horas al día en el sistema. La densidad alta y los atajos de teclado son la regla, no la excepción. Cuando exista tensión entre "se ve bonito en una captura" y "se trabaja rápido en producción", **gana producción.** El público que prefiere "amabilidad mobile-first" no es nuestro público.

### Principio 3 — Identidad visual antes que tendencias.
La estética ribbon-MDI no se cambia por modas. Se actualiza con criterio (Fluent flat moderno) pero la metáfora es estable durante años. Coherencia de marca a 5 años > seguir el último framework de moda.

### Principio 4 — Apoyarse en el ecosistema, no reinventarlo.
El shell **viste** componentes maduros (TanStack Table, PDF.js, librerías de charting). No reinventa primitivas. El valor está en la composición y la identidad, no en construir un data-grid desde cero.

### Principio 5 — Crecimiento por demanda real.
El shell crece cuando un vertical real necesita un componente nuevo. No por especulación ("algún día alguien lo va a pedir"). Lo que vive en un solo vertical, queda en ese vertical hasta que un segundo lo necesite idéntico.

### Principio 6 — Documentación viva o no existe.
Cada componente del shell tiene su demo navegable y su uso documentado. Si no está documentado, no está terminado. Si en 6 meses nosotros mismos no recordamos cómo usar un componente, el shell falló.

### Principio 7 — Lo no-codeable es lo defendible.
La identidad, la densidad, los atajos, el lenguaje paraguayo, la integración SIFEN, la marca, la base instalada, la red de soporte humano local — eso es lo que ningún competidor con IA puede replicar. **Toda decisión técnica se evalúa contra el principio: ¿esto refuerza nuestro activo no-codeable o lo diluye?**

## 4. Arquitectura conceptual

NODO se organiza en tres capas:

```
                    ┌─────────────────────────────┐
                    │   CLIENTE FINAL              │
                    │   (lomitería, dentista,      │
                    │    distribuidora, taller)    │
                    └──────────────┬──────────────┘
                                   │
                    ┌──────────────▼──────────────┐
   CAPA 1          │  VERTICALES NODO              │
   (lo que el      │  · NODO Distribución          │
   cliente compra) │  · NODO Odonto                │
                   │  · NODO Taller                │
                   │  · NODO Inmobiliaria          │
                   │  · NODO Salud                 │
                   │  · NODO Financiero            │
                   └──────────────┬──────────────┘
                                  │
                    ┌─────────────▼──────────────┐
   CAPA 2          │  NODO SHELL                   │
   (la plataforma  │  Layout · Componentes ·       │
   común invisible)│  Atajos · PWA · Theming       │
                   └──────────────┬──────────────┘
                                  │
                    ┌─────────────▼──────────────┐
   CAPA 3          │  SATÉLITES                    │
   (apps que se    │  · Pulso Desk (mobile)        │
   conectan vía    │  · MultiCompra (planilla)     │
   API)            │  · Presuya (campo)            │
                   │  · Apps freebie (escáner...)  │
                   └─────────────────────────────┘
```

**Flujo de valor:**
1. El cliente final compra un vertical específico (NODO Odonto).
2. Ese vertical está construido sobre NODO Shell.
3. Si necesita funcionalidad en otro contexto (cajera mobile, planilla densa, etc.), usa un satélite que se conecta vía API.
4. Todo comparte autenticación, datos cuando corresponde, y marca.

## 5. Regla de qué vive dónde

| Cosa | ¿Dónde vive? | Criterio |
|---|---|---|
| Layout (ribbon, MDI, status bar) | Shell | Es la identidad. |
| Componente UI reutilizable (grilla, formulario, agenda) | Shell **si** lo usan 2+ verticales idénticamente | Demanda real, no especulada. |
| Componente UI específico de un rubro (ficha clínica, OT, listado de propiedades) | Vertical | Único en su contexto. |
| Lógica de negocio (cómo se calcula una factura) | Vertical | Cada negocio es distinto. |
| Auth, sesión, permisos | Shell | Horizontal. |
| Integración SIFEN | Shell (vía sifen-engine) | Horizontal y regulada. |
| Integración con sistema externo del rubro (ej: laboratorio dental) | Vertical | Específica. |
| App con metáfora UI distinta (mobile-first, kiosk, planilla) | Satélite | No encaja en ribbon-desktop. |
| Configuración por cliente | Vertical (parámetros) | Nunca código forkeado. |

## 6. Reglas de versionado

- **Versión semántica del shell:** `MAJOR.MINOR.PATCH`.
- **PATCH:** bug fixes que no cambian APIs. Verticales pueden actualizar sin testing extra.
- **MINOR:** nuevos componentes o features compatibles hacia atrás. Verticales actualizan en su próximo ciclo.
- **MAJOR:** breaking changes. Requiere plan de migración de cada vertical, comunicado interno, y prueba completa antes de release.
- **Cada vertical debe estar máximo 1 MAJOR atrás del shell.** Si dos verticales están en versiones distintas del shell, hay que ponerlos al día antes de avanzar con nada nuevo.
- **Changelog del shell obligatorio.** Cada cambio se anota con razón y fecha. Sin changelog, no hay merge.

## 7. Reglas de identidad visual

- **Tipografía base:** Segoe UI con fallback a Inter.
- **Densidad:** filas 26–28px, fuentes 11–12px en grillas, 13–14px en formularios.
- **Paleta:** azul Fluent (`#0f6cbd` como acento principal). Temas alternativos: oscuro, alto contraste.
- **Iconografía:** SVG inline, estilo Fluent UI / Lucide / Tabler. Nada de emojis en la UI.
- **Atajos de teclado canónicos:** F1 ayuda, F2 editar, F3 buscar, F4 lookup, F5 refrescar, F6 navegar paneles, Esc cerrar, Ctrl+S guardar, Ctrl+N nuevo, Ctrl+F filtrar, Alt+letra ir a tab del ribbon.
- **Cualquier vertical que rompa esta identidad pierde la marca NODO.** No se publica como vertical NODO si no respeta los cánones.

## 8. La disciplina anti-fork (la regla más importante de todas)

Esta es la única regla cuya violación mata la empresa entera. Por eso va sola, en mayúsculas, y la firmamos vos y Carlos:

> **NUNCA SE BIFURCA EL CÓDIGO POR UN CLIENTE.**
>
> Si un cliente pide algo que el shell o el vertical actual no resuelven:
> - Si lo necesita más de un cliente → entra al roadmap del shell o del vertical.
> - Si lo necesita uno solo → se ofrece como **proyecto a medida** cobrado aparte por la Fábrica de Software, integrado vía configuración o satélite.
> - Si no se puede integrar limpio → se rechaza educadamente.
>
> **Nunca se acepta "te lo cambio en tu instalación".**

Cada vez que se quiebre esta regla, NODO pierde un mes de productividad futura por ahorrarse un día de incomodidad presente.

---

# PARTE II — MODELO DE NEGOCIO

## 1. Las tres fuentes de ingreso

NODO factura por tres canales, cada uno con lógica económica propia:

### Canal A — Suscripciones a verticales (ingreso recurrente, escalable).
El cliente paga una mensualidad por usar un vertical específico. Es el canal **principal** y el que define la valuación de la empresa.

### Canal B — Proyectos a medida vía Fábrica de Software (ingreso de proyecto, márgenes altos).
Cuando un cliente quiere un sistema que no existe como vertical estandarizado, la Fábrica de Software lo construye sobre el shell. Cobra proyecto + suscripción de mantenimiento.

### Canal C — Servicios (ingreso recurrente o por uso, alto margen).
Asesoría, capacitación, soporte premium, implementación asistida, consultoría con IA, configuración por rubro.

## 2. Pricing tentativo

> **Atención:** los precios son hipótesis iniciales. Validar con 5–10 clientes reales antes de fijar.

### Suscripción a vertical (Canal A)

| Plan | Qué incluye | Pricing tentativo |
|---|---|---|
| **Básico** | Vertical activado, 1 sucursal, 2 usuarios, módulos esenciales, soporte vía agente IA + tutoriales | 250.000 Gs/mes |
| **Profesional** | + Multi-sucursal (hasta 3), 5 usuarios, módulos premium del vertical, soporte humano de 1er nivel | 600.000 Gs/mes |
| **Empresa** | Sucursales ilimitadas, usuarios ilimitados, todos los módulos, soporte prioritario, asesoría incluida 4hs/mes | 1.500.000 Gs/mes |
| **Add-ons** | Cada sucursal extra, cada satélite conectado, módulos especiales del vertical | Por unidad |

### Proyecto a medida (Canal B)

| Tipo | Pricing | Notas |
|---|---|---|
| Vertical chico (ej: gestor de gimnasio) | 25–60M Gs proyecto + suscripción mensual | Forma de pago 50/25/25 |
| Vertical mediano (ERP custom) | 60–150M Gs proyecto + suscripción mensual | |
| Vertical grande | Cotización a medida | Solo si justifica volverlo producto |

### Servicios (Canal C)

| Servicio | Pricing tentativo |
|---|---|
| Onboarding asistido | 1.500.000 Gs único |
| Asesoría mensual | 400.000 Gs/mes (4hs) |
| Capacitación on-site | 800.000 Gs/jornada |
| Reportes a medida | 300.000 Gs por reporte |
| Soporte premium 24/7 | 800.000 Gs/mes |

## 3. Funnel del cliente (ideal en 2 años)

```
1. AWARENESS
   Landing pública del vertical → SEO + Marketplace + redes
   ↓
2. INTERÉS
   Demo navegable pública (mockups en Cloudflare Pages)
   ↓
3. CALIFICACIÓN
   Ventas.Bot (agente IA) toma BANT, agenda demo o cierra solo
   ↓
4. CIERRE
   Vos o un comercial humano (5 minutos, no 5 horas)
   ↓
5. ONBOARDING
   Self-service guiado por wizard del vertical + agente IA
   ↓
6. SOPORTE 1ER NIVEL
   Agente IA + tutoriales + base de conocimiento
   ↓
7. SOPORTE 2DO NIVEL
   Técnico humano (vos, equipo o partner local)
   ↓
8. CRISIS / AUDITORÍA / CRITERIO
   Vos directamente
```

**Métrica clave:** **horas humanas por cliente activo**. Tiene que tender a 0 en clientes Básicos y a 4hs/mes en clientes Empresa. Si un cliente Básico te consume más de 1hs/mes humanas, hay un problema en la automatización o en el cliente.

## 4. Roadmap por fases

### Fase 1 — Año 1 (2026): Validar el shell con un vertical real (cohorte 0).

- Terminar NODO Shell v1.0 (todos los componentes core: grilla, formularios, agenda, side panel, theming, atajos).
- Construir el primer vertical completo sobre el shell. **Recomendación: NODO Distribución** (porque hereda lo más posible de ERP Lite + es el rubro que ya conocés con tu base actual).
- Migrar 3–5 clientes actuales de NODO al primer vertical. Aprender en producción.
- Documentar el shell. Publicar demo navegable pública.
- **KPI Fase 1:** 1 vertical en producción con 5 clientes pagando, churn 0, NPS > 8.

### Fase 2 — Año 2 (2027): Multiplicar verticales (cohorte 1).

- Construir 2–3 verticales más sobre el shell. Recomendación: **NODO Taller** (porque ya tenés el caso Jordan + Taller Autos avanzado), **NODO Odonto** o **NODO Inmobiliaria** según validación de mercado.
- Lanzar marketing del posicionamiento "hecho para quien trabaja, no para quien mira el celular".
- Cada vertical con su landing, su funnel, su pricing.
- **KPI Fase 2:** 3 verticales en producción, 30+ clientes totales, MRR 25M Gs/mes, churn < 5%.

### Fase 3 — Año 3 (2028): Decisión de plataforma pública.

- Evaluar abrir NODO Shell como plataforma licenciable a otros desarrolladores paraguayos (modelo Salesforce / Mendix).
- Documentación pública del shell, programa de partners certificados, marketplace de plantillas de verticales.
- Si no se abre, profundizar verticales existentes y agregar 2 más.
- **KPI Fase 3:** 5+ verticales, 100+ clientes, MRR 80M Gs/mes, decisión tomada sobre apertura.

## 5. KPIs que medir desde el día 1

| KPI | Meta Año 1 | Meta Año 2 | Meta Año 3 |
|---|---|---|---|
| Verticales en producción | 1 | 3 | 5+ |
| Clientes activos totales | 5 | 30 | 100+ |
| MRR (Monthly Recurring Revenue) | 5M Gs | 25M Gs | 80M Gs |
| Churn mensual | < 8% | < 5% | < 3% |
| Horas humanas / cliente Básico / mes | < 2 | < 1 | < 0.5 |
| Componentes maduros del shell | 12 | 25 | 40+ |
| Tiempo para arrancar nuevo vertical | 3 meses | 6 semanas | 3 semanas |
| NPS de clientes | > 7 | > 8 | > 9 |

---

# PARTE III — DECISIONES PENDIENTES

Estas cuatro decisiones tienen que cerrarse entre Emiliano y Carlos en los próximos 60 días. Cada una cambia estructuralmente el modelo:

### Decisión 1 — ¿Shell privado interno o plataforma pública licenciable?
- **Privado:** solo NODO usa el shell. Más control, menos overhead de documentación, sin obligación de soporte a terceros.
- **Público:** otros estudios paraguayos pueden construir verticales sobre NODO Shell pagando licencia. Negocio 10x más grande pero requiere gobernanza.
- **Híbrido recomendado:** privado los primeros 2 años, diseñado para abrirse después.
- **Decisión a tomar:** ¿asumimos el costo extra hoy de "diseñar pensando en abrir mañana"? Sí/No.

### Decisión 2 — Marca por vertical: paraguas único o sub-marcas.
- **Paraguas único:** "NODO" como marca, los verticales son solo línea de producto (NODO Distribución, NODO Odonto). Coherencia total.
- **Sub-marcas:** cada vertical con su propia marca (DentaNodo, TallerNodo). Más SEO, menos coherencia.
- **Recomendado:** paraguas único con prefijo NODO + descriptor del vertical. Sub-marca solo si un vertical alcanza tamaño que justifique escisión.

### Decisión 3 — Política anti-customización: ¿cuán estricta?
- **Estricta:** ningún cambio de código por cliente, jamás. Todo se resuelve con configuración o se rechaza.
- **Flexible:** se acepta customización, pero solo vía proyecto a medida cobrado y siempre integrado limpio (configuración o satélite).
- **Recomendado:** estricta para los verticales estandarizados (NODO Distribución, NODO Odonto). Flexible para proyectos a medida totalmente nuevos vía Fábrica de Software.

### Decisión 4 — Modelo monetario primario: ¿suscripción pura o híbrido con proyecto?
- **Suscripción pura:** apostamos todo a recurrente. Necesitamos volumen y paciencia.
- **Híbrido:** suscripción + proyectos a medida cuando aparezcan. Más cash inmediato, menos elegante en valuación.
- **Recomendado:** híbrido mientras dura la transición (años 1–3), suscripción pura como dirección estratégica.

---

# PARTE IV — LAS TRES REGLAS DE ORO (NO NEGOCIABLES)

Estas tres reglas las firmamos vos y Carlos. Cada vez que aparezca una decisión difícil, se vuelve acá:

### Regla 1 — No forkear nunca.
Una sola plataforma, muchas configuraciones. Toda customización específica de un cliente vive como proyecto a medida cobrado aparte, integrado vía configuración, satélite o módulo. Bajo ninguna circunstancia se mantiene un fork del shell o de un vertical para un cliente.

### Regla 2 — El shell no crece por especulación.
Un componente entra al shell solo cuando dos verticales lo necesitan idénticamente. Hasta entonces, vive en el vertical donde apareció. Esto evita el over-engineering y mantiene el shell ágil.

### Regla 3 — La identidad visual es sagrada.
El ribbon-MDI, la densidad, los atajos, la paleta, la iconografía, la tipografía no se cambian por moda ni por cliente. Solo se actualizan en versiones MAJOR del shell, con plan de migración, y siempre preservando la metáfora central (sistema empresarial denso, profesional, productivo).

---

# ANEXO A — Catálogo inicial de verticales planificados

| Vertical | Estado | Mercado objetivo | Prioridad |
|---|---|---|---|
| **NODO Distribución** | A construir Año 1 | Distribuidoras, mayoristas, ferreterías | 🔴 Alta |
| **NODO Taller** | Caso Jordan + Taller Autos en curso | Talleres mecánicos, electrónica, electrodomésticos | 🔴 Alta |
| **NODO Odonto** | Año 2 | Consultorios odontológicos | 🟡 Media |
| **NODO Inmobiliaria** | Año 2 | Inmobiliarias, administradoras | 🟡 Media |
| **NODO Salud** | Año 3 | Consultorios médicos, clínicas chicas | 🟢 Baja |
| **NODO Financiero** | Año 3 | Cooperativas, financieras chicas | 🟢 Baja |


> **Nota importante:** la línea **POS Gastronomía** de NODO (lomiterías, pizzerías, gastronomía pequeña, despensas) **NO es un vertical de NODO Shell**. Es un producto independiente con su propio carril (mi-pos / NODO POS legacy + agentes NodoConsultor + Ventas.Bot + skills marketing). Tienen marcas, marketing, pricing y posicionamiento distintos. NODO Shell apunta a un público profesional/empresarial; POS Gastronomía apunta a comercio pequeño. Compartirán infraestructura técnica (sifen-engine para SIFEN, base de datos, agentes de IA) pero son productos comercialmente separados.

---

# ANEXO B — Plantilla de evaluación de oportunidad (¿hago un vertical o un proyecto a medida?)

Cuando aparezca un cliente con una necesidad nueva, evaluar:

1. **¿Es un mercado de 50+ negocios paraguayos con la misma necesidad?** Sí → puede ser vertical. No → proyecto a medida vía Fábrica.
2. **¿Hay 3+ clientes interesados ya identificados?** Sí → vertical. No → proyecto a medida que después se evalúa volver vertical.
3. **¿La lógica de negocio es replicable o cada cliente es único?** Replicable → vertical. Único → proyecto a medida.
4. **¿Existe regulación local específica (SIFEN, normas del rubro)?** Sí → vertical (porque la regulación es activo no-codeable nuestro). No → proyecto a medida.
5. **¿El cliente paga la inversión inicial o esperamos vender después?** Paga → proyecto a medida. Esperamos → vertical, pero solo si las 4 anteriores también dan vertical.

**Regla:** si 4 de 5 son "vertical", se construye como vertical. Si 3 o menos, se hace como proyecto a medida y se reevalúa después.

---

# ANEXO C — Glosario

- **Shell:** la plataforma común. NODO Shell.
- **Vertical:** un sistema construido sobre el shell para un rubro o uso específico. Lo que el cliente compra.
- **Satélite:** una app PWA con metáfora UI distinta (mobile, kiosk, planilla) que se conecta al shell vía API.
- **Cohorte 0/1/2:** generaciones de clientes según fase de madurez del shell.
- **Forkear:** mantener una versión modificada del código para un cliente específico. **Prohibido.**
- **No-codeable:** activos de la empresa que ningún competidor con IA puede replicar (marca, regulación, datos, presencia física, identidad visual madura, base instalada).

---

**Documento firmado por:**

Emiliano Vitale — Dueño de NODO
Carlos Cardozo Pintos — Socio de NODO

Fecha de firma original: ___________
Próxima revisión obligatoria: Octubre 2026

---

*Este manual es el contrato interno de NODO consigo misma. Cuando aparezca una tentación de cambiar el rumbo, volver acá. Si una decisión nueva contradice este documento, primero se modifica el documento (con buenas razones), después se ejecuta. Nunca al revés.*

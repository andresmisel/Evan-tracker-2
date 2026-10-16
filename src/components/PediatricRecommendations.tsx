import React, { useState } from 'react';
import {
  Sparkles,
  Moon,
  Milk,
  Baby,
  Smile,
  HeartHandshake,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Brain,
  Lightbulb,
  Clock,
  Eye,
} from 'lucide-react';
import { SparkleGlow, StarSparkle } from './SparkleEffect';

interface PediatricRecommendationsProps {
  babyBirthDate: string;
  babyName: string;
  compact?: boolean;
}

interface AgeStageInfo {
  stageKey: string;
  title: string;
  ageRange: string;
  wakeWindow: string;
  sleepTarget: string;
  feedingTip: string;
  feedingDetails: string[];
  milestones: string[];
  stimulationTips: string[];
  healthAdvice: string[];
  gentleReminders: string[];
}

export function getAgeStage(birthDateStr: string): { months: number; days: number; stage: AgeStageInfo } {
  const birth = new Date(birthDateStr);
  const now = new Date();
  const diffMs = Math.max(0, now.getTime() - birth.getTime());
  const totalDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const months = Math.floor(totalDays / 30.4375);
  const days = Math.floor(totalDays % 30.4375);

  let stage: AgeStageInfo;

  if (months < 1) {
    stage = {
      stageKey: '0-1m',
      title: 'Etapa Recién Nacido (0 - 1 mes)',
      ageRange: 'Primeras 4 semanas',
      wakeWindow: '45 a 60 minutos',
      sleepTarget: '16 a 18 horas diarias',
      feedingTip: 'Tomas frecuentes a demanda (8 a 12 veces al día)',
      feedingDetails: [
        'El estómago del bebé es del tamaño de una nuez o huevo pequeño; digiere rápido la leche.',
        'Tomas de 60 a 90 ml de fórmula o tomas de pecho cada 2 a 3 horas.',
        'Busca señales tempranas de hambre (chuparse las manos, girar la cabeza buscando el pecho) antes de que llore.',
      ],
      milestones: [
        'Enfoca la vista a unos 20-30 cm (la distancia exacta a la cara de mamá o papá al cargarlo).',
        'Reconoce la voz de sus padres y se calma con el contacto piel con piel.',
        'Movimientos reflejos involuntarios (reflejo de Moro y de prensión palmar).',
      ],
      stimulationTips: [
        'Contacto piel con piel diario para regular temperatura y frecuencia cardíaca.',
        'Hablarle suavemente y cantarle a poca distancia mirándolo a los ojos.',
        'Breves sesiones de tummy time sobre tu pecho mientras estás semi-recostado/a.',
      ],
      healthAdvice: [
        'El cordón umbilical debe mantenerse limpio y seco hasta que caiga.',
        '4 a 6 pañales mojados diarios indican excelente hidratación.',
      ],
      gentleReminders: [
        'El llanto es su única forma de comunicarse, responder a él fomenta apego seguro, no se malcrían.',
      ],
    };
  } else if (months < 3) {
    stage = {
      stageKey: '1-2m',
      title: 'Etapa Despertar al Mundo (1 a 2 meses)',
      ageRange: '5 a 10 semanas',
      wakeWindow: '60 a 90 minutos',
      sleepTarget: '15 a 16 horas diarias',
      feedingTip: 'Comienzan a regularse las tomas (6 a 8 veces al día)',
      feedingDetails: [
        'Tomas habituales de 90 a 120 ml (3 - 4 oz) o sesiones de pecho más eficientes.',
        'Las tomas nocturnas empiezan a espaciarse un poco más naturalmente.',
      ],
      milestones: [
        'Aparece la hermosa sonrisa social voluntaria en respuesta a tus palabras o sonrisas.',
        'Comienza a seguir objetos en movimiento con la mirada en un arco de 180°.',
        'Sostiene la cabeza con mayor firmeza por breves períodos boca abajo.',
      ],
      stimulationTips: [
        'Tummy time de 3 a 5 minutos, 2 o 3 veces al día sobre una manta segura.',
        'Móviles con contrastes blanco, negro y rojo que estimulan la agudeza visual.',
        'Sonreírle de cerca y responder a sus pequeños gorjeos imitando sus sonidos.',
      ],
      healthAdvice: [
        'Control pediátrico y vacunas de los 2 meses (Pentavalente, Neumococo, Rotavirus).',
        'El cólico del lactante suele tener su pico alrededor de las 6 semanas y luego decrece.',
      ],
      gentleReminders: [
        'Cada bebé tiene su propio compás; si está irritable por las tardes, el porteo ergonómico ayuda mucho.',
      ],
    };
  } else if (months < 5) {
    // Current age stage for Evan (approx 3m 27d / 4 months)
    stage = {
      stageKey: '3-4m',
      title: 'Etapa Conexión y Curiosidad (3 a 4 meses)',
      ageRange: '12 a 18 semanas',
      wakeWindow: '1.5 a 2.5 horas',
      sleepTarget: '14 a 16 horas diarias (10-12h noche + 3-4 siestas diurnas)',
      feedingTip: 'Tomas más espaciadas y abundantes (120 a 180 ml / 4 a 6 oz)',
      feedingDetails: [
        'El volumen promedio diario ronda entre 700 y 900 ml repartidos en 5 o 6 tomas.',
        'El bebé se distrae con facilidad durante las tomas por su creciente curiosidad por el entorno; alimentar en un lugar tranquilo atenúa las interrupciones.',
        'La leche materna o fórmula sigue siendo su único alimento recomendado hasta los 6 meses.',
      ],
      milestones: [
        'Excelente control cefálico: sostiene la cabeza erguida a 90° y empuja el pecho con los brazos boca abajo.',
        'Descubrimiento y fascinación por sus manos: se las mira con asombro y las lleva a la boca para explorar texturas.',
        'Gorjeos prolongados, balbuceos ("agu", "a-ba", chillidos de alegría) y carcajadas espontáneas.',
        'Intenta alcanzar objetos y juguetes colgantes con ambas manos.',
      ],
      stimulationTips: [
        'Gimnasio de suelo o manta de juegos con texturas y juguetes a su alcance para extender los brazos.',
        'Juegos de "cucú-tras" (ocultar tu rostro tras tus manos y aparecer con una gran sonrisa).',
        'Cantarle canciones con movimientos suaves de sus manitas y masajes en las piernas.',
        'Espejo de seguridad irrompible colocado a nivel del suelo para que observe su reflejo.',
      ],
      healthAdvice: [
        'Vacunación del 4to mes: segunda dosis de Pentavalente, Neumococo y Rotavirus.',
        'Salivación abundante: es completamente normal debido al desarrollo de las glándulas salivales y exploración oral, no siempre significa dientes inmediatos.',
        'Maduración del sueño (conocida como regresión de los 4 meses): el cerebro del bebé incorpora los ciclos de sueño adulto (fases ligeras y profundas). Mantener una rutina predecible y luz tenue ayuda a consolidar el descanso.',
      ],
      gentleReminders: [
        'Si notas que despierta con mayor frecuencia por las noches durante un par de semanas, es un salto madurativo neurológico natural, no un paso atrás.',
      ],
    };
  } else if (months < 7) {
    stage = {
      stageKey: '5-6m',
      title: 'Etapa Movimiento y Exploración (5 a 6 meses)',
      ageRange: '20 a 26 semanas',
      wakeWindow: '2 a 3 horas',
      sleepTarget: '13 a 15 horas diarias (2 o 3 siestas)',
      feedingTip: 'Transición y preparación para alimentación complementaria a los 6 meses',
      feedingDetails: [
        'Tomas de 180 a 210 ml (6 a 7 oz).',
        'Hacia los 6 meses, la mayoría de los bebés muestran interés activo por la comida de los adultos y pierden el reflejo de extrusión.',
        'Consultar con su pediatra el inicio de alimentación complementaria (BLW o papillas).',
      ],
      milestones: [
        'Se gira de boca arriba a boca abajo y viceversa.',
        'Se sienta con mínimo apoyo o trípode con sus manos hacia adelante.',
        'Pasa objetos de una mano a la otra.',
      ],
      stimulationTips: [
        'Colocar juguetes ligeramente fuera de su alcance para animarle a voltearse y estirarse.',
        'Libros de tela blandos con sonidos crujientes y texturas variadas.',
        'Hablarle describiendo lo que haces en la casa usando lenguaje claro.',
      ],
      healthAdvice: [
        'Control pediátrico de los 6 meses y vacunas correspondientes.',
        'Posible erupción de los primeros incisivos inferiores centrales; mordedores fríos alivian las encías.',
      ],
      gentleReminders: [
        'La alimentación antes del año es principalmente complementaria; la leche sigue siendo la base nutricional.',
      ],
    };
  } else if (months < 10) {
    stage = {
      stageKey: '7-9m',
      title: 'Etapa Descubrimiento e Independencia (7 a 9 meses)',
      ageRange: '28 a 38 semanas',
      wakeWindow: '2.5 a 3.5 horas',
      sleepTarget: '13 a 14 horas diarias (2 siestas consolidadas)',
      feedingTip: 'Alimentación complementaria activa + tomas de leche',
      feedingDetails: [
        '2 a 3 comidas pequeñas al día introduciendo alérgenos comunes según pauta pediátrica.',
        'Ofrecer agua en vaso de aprendizaje o vasito abierto durante las comidas.',
      ],
      milestones: [
        'Se sienta solo sin apoyo de forma estable.',
        'Comienza el gateo, reptado o desplazamiento libre por el suelo.',
        'Pinza digital con dedo índice y pulgar para tomar trocitos pequeños.',
      ],
      stimulationTips: [
        'Crear un espacio seguro en el suelo libre de enchufes y objetos pequeños para que explore a gatas.',
        'Juegos de meter y sacar objetos de recipientes.',
      ],
      healthAdvice: [
        'Proteger esquinas y asegurar muebles ante el inicio de incorporación a gatas.',
      ],
      gentleReminders: [
        'Ansiedad por separación (octavo mes): puede extrañar a personas no cotidianas. Es un indicador saludable de apego hacia sus cuidadores principales.',
      ],
    };
  } else {
    stage = {
      stageKey: '10-12m+',
      title: 'Etapa Primer Año y Pasos Hacia Adelante',
      ageRange: '10 a 12+ meses',
      wakeWindow: '3 a 4.5 horas',
      sleepTarget: '12 a 14 horas diarias (1 o 2 siestas)',
      feedingTip: 'Integración paulatina al menú familiar saludable',
      feedingDetails: [
        '3 comidas principales + tomas de leche a demanda.',
        'Estimular la autonomía comiendo con sus propias manos y cuchara.',
      ],
      milestones: [
        'Se pone de pie apoyándose en muebles (cruising) y primeros pasos independientes.',
        'Dice sus primeras palabras con intención ("mamá", "papá", "agua").',
        'Señala con el dedo lo que desea y aplaude.',
      ],
      stimulationTips: [
        'Juguetes de empuje (correpasillos estables).',
        'Nombrar objetos cotidianos y leer cuentos interactivos.',
      ],
      healthAdvice: [
        'Control pediátrico del primer año y vacunas de los 12 meses (Triple Vírica, Meningococo, Neumococo).',
      ],
      gentleReminders: [
        'Celebrar cada pequeño hito sin comparar con otros niños; la marcha autónoma es normal entre los 9 y 18 meses.',
      ],
    };
  }

  return { months, days, stage };
}

export const PediatricRecommendations: React.FC<PediatricRecommendationsProps> = ({
  babyBirthDate,
  babyName,
  compact = false,
}) => {
  const { months, days, stage } = getAgeStage(babyBirthDate);
  const [activeSection, setActiveSection] = useState<'sleep' | 'feeding' | 'milestones' | 'health'>('sleep');
  const [isExpanded, setIsExpanded] = useState(!compact);

  return (
    <section className="rounded-2xl bg-white dark:bg-slate-900 border border-blue-200/70 dark:border-blue-900/40 shadow-sm overflow-hidden transition-all">
      {/* Non-invasive Header with Soft Tone */}
      <div className="p-4 sm:p-5 flex items-center justify-between gap-3 bg-gradient-to-r from-blue-50/70 via-indigo-50/40 to-slate-50/20 dark:from-blue-950/40 dark:via-slate-900 dark:to-slate-900 border-b border-blue-100 dark:border-blue-950/60">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-600/10 dark:bg-blue-600/20 text-blue-600 dark:text-blue-400">
            <Lightbulb size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                Guía Pediátrica para {babyName} ({months}m {days > 0 ? `${days}d` : ''})
              </h3>
              <SparkleGlow size={13} />
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {stage.title} • Recomendaciones suaves basadas en pediatría
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-all cursor-pointer shadow-xs"
        >
          <span>{isExpanded ? 'Contraer' : 'Ver Guía'}</span>
          {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>

      {/* Expandable Content */}
      {isExpanded && (
        <div className="p-4 sm:p-5 space-y-4 animate-fade-in">
          {/* Quick Metrics Banner */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="p-3 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200/50 dark:border-indigo-900/40">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-indigo-700 dark:text-indigo-300 mb-0.5">
                <Clock size={13} />
                <span>Ventana de Vigilia</span>
              </div>
              <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                {stage.wakeWindow}
              </div>
              <div className="text-[10px] text-slate-400">Tiempo despierto recomendado</div>
            </div>

            <div className="p-3 rounded-xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200/50 dark:border-blue-900/40">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-blue-700 dark:text-blue-300 mb-0.5">
                <Moon size={13} />
                <span>Sueño Diario</span>
              </div>
              <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                {stage.sleepTarget}
              </div>
              <div className="text-[10px] text-slate-400">Total en 24 horas</div>
            </div>

            <div className="p-3 rounded-xl bg-cyan-50/60 dark:bg-cyan-950/30 border border-cyan-200/50 dark:border-cyan-900/40">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-cyan-700 dark:text-cyan-300 mb-0.5">
                <Milk size={13} />
                <span>Frecuencia Tomas</span>
              </div>
              <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                Cada 3 a 4 horas
              </div>
              <div className="text-[10px] text-slate-400">O a libre demanda</div>
            </div>

            <div className="p-3 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/50 dark:border-emerald-900/40">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 dark:text-emerald-300 mb-0.5">
                <Brain size={13} />
                <span>Hito Clave</span>
              </div>
              <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                Control cefálico y manos
              </div>
              <div className="text-[10px] text-slate-400">Descubrimiento motor</div>
            </div>
          </div>

          {/* Section Segment Tabs */}
          <div className="flex flex-wrap gap-1.5 border-b border-slate-100 dark:border-slate-800 pb-2 text-xs">
            {[
              { id: 'sleep', label: 'Sueño y Descanso', icon: Moon },
              { id: 'feeding', label: 'Alimentación e Ingesta', icon: Milk },
              { id: 'milestones', label: 'Desarrollo y Juegos', icon: Smile },
              { id: 'health', label: 'Salud y Cuidados', icon: ShieldCheck },
            ].map((sec) => {
              const Icon = sec.icon;
              const isActive = activeSection === sec.id;
              return (
                <button
                  key={sec.id}
                  type="button"
                  onClick={() => setActiveSection(sec.id as any)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <Icon size={14} />
                  <span>{sec.label}</span>
                </button>
              );
            })}
          </div>

          {/* Section: SLEEP */}
          {activeSection === 'sleep' && (
            <div className="space-y-3 text-xs leading-relaxed">
              <div className="p-3.5 rounded-xl bg-indigo-50/40 dark:bg-indigo-950/20 border border-indigo-200/40 dark:border-indigo-900/30 space-y-2">
                <div className="font-bold text-indigo-900 dark:text-indigo-200 flex items-center gap-1.5">
                  <Moon size={15} />
                  <span>Ventanas de vigilia y descanso para {months} meses:</span>
                </div>
                <p className="text-slate-600 dark:text-slate-300">
                  Para la edad de {babyName}, la ventana óptima en la que puede permanecer despierto sin fatigarse en exceso oscila entre <strong>{stage.wakeWindow}</strong>.
                </p>
                <p className="text-slate-600 dark:text-slate-300">
                  Pasado este tiempo, el cuerpo del bebé comienza a segregar cortisol y adrenalina para mantenerse despierto, lo que paradójicamente dificulta conciliar el sueño y provoca llanto al dormir.
                </p>
              </div>

              <div className="space-y-1.5">
                <div className="font-bold text-slate-800 dark:text-slate-200">Recomendaciones prácticas:</div>
                <ul className="space-y-1.5 text-slate-600 dark:text-slate-300 list-disc list-inside">
                  <li><strong>Señales tempranas de sueño:</strong> Frotarse los ojos, perder la mirada, bostezar o menor contacto visual. Inicia la rutina tan pronto las notes.</li>
                  <li><strong>Rutina previa de 10-15 minutos:</strong> Luz tenue, cambio de pañal limpio, canción de cuna o sonido blanco suave para anticiparle que viene el momento de descansar.</li>
                  <li><strong>Siestas diurnas:</strong> Suelen ser 3 a 4 siestas diarias a esta edad, totalizando unas 3 a 4 horas de descanso en el día.</li>
                </ul>
              </div>
            </div>
          )}

          {/* Section: FEEDING */}
          {activeSection === 'feeding' && (
            <div className="space-y-3 text-xs leading-relaxed">
              <div className="p-3.5 rounded-xl bg-blue-50/40 dark:bg-blue-950/20 border border-blue-200/40 dark:border-blue-900/30 space-y-2">
                <div className="font-bold text-blue-900 dark:text-blue-200 flex items-center gap-1.5">
                  <Milk size={15} />
                  <span>{stage.feedingTip}</span>
                </div>
                <ul className="space-y-1.5 text-slate-600 dark:text-slate-300">
                  {stage.feedingDetails.map((detail, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-blue-500 font-bold">•</span>
                      <span>{detail}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300">
                💡 <strong>Recordatorio no invasivo:</strong> Cada bebé regula su apetito de manera autorregulada. Si {babyName} gana peso dentro de sus percentiles y moja de 5 a 6 pañales al día, su nutrición es adecuada aunque en algunas tomas tome un poco más o un poco menos.
              </div>
            </div>
          )}

          {/* Section: MILESTONES */}
          {activeSection === 'milestones' && (
            <div className="space-y-3 text-xs leading-relaxed">
              <div className="space-y-2">
                <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Eye size={15} className="text-blue-500" />
                  <span>Hitos típicos esperados en esta etapa:</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {stage.milestones.map((m, i) => (
                    <div key={i} className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 flex items-start gap-2">
                      <span className="text-emerald-500 font-bold shrink-0">✓</span>
                      <span className="text-slate-700 dark:text-slate-300">{m}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5 pt-2">
                <div className="font-bold text-slate-800 dark:text-slate-200">Ideas suaves de estimulación y juego:</div>
                <ul className="space-y-1.5 text-slate-600 dark:text-slate-300 list-disc list-inside">
                  {stage.stimulationTips.map((tip, i) => (
                    <li key={i}>{tip}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Section: HEALTH & GENTLE REMINDERS */}
          {activeSection === 'health' && (
            <div className="space-y-3 text-xs leading-relaxed">
              <div className="p-3.5 rounded-xl bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-200/40 dark:border-emerald-900/30 space-y-2">
                <div className="font-bold text-emerald-900 dark:text-emerald-200 flex items-center gap-1.5">
                  <ShieldCheck size={15} />
                  <span>Puntos de atención pediátrica:</span>
                </div>
                <ul className="space-y-1 text-slate-600 dark:text-slate-300">
                  {stage.healthAdvice.map((adv, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-emerald-500 font-bold">•</span>
                      <span>{adv}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-3 rounded-xl bg-blue-50/50 dark:bg-blue-950/30 border border-blue-200/40 dark:border-blue-900/30 text-slate-600 dark:text-slate-300">
                🤍 <strong>Mensaje para papá y mamá:</strong> {stage.gentleReminders[0]}
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
};

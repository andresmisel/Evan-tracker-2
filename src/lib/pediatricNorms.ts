export interface PediatricNorms {
  ageInMonths: number;
  ageInDays: number;
  ageDisplay: string;
  wakeWindowDisplay: string;
  wakeWindowMinHours: number;
  wakeWindowMaxHours: number;
  wakeWindowMaxMinutes: number;
  dailyIntakeMlDisplay: string;
  intakePediatricNote: string;
  sleepHoursTotalDisplay: string;
}

export function getPediatricNorms(birthDateStr: string, babyName: string = 'el bebé'): PediatricNorms {
  const birth = new Date(birthDateStr);
  const now = new Date();
  const diffMs = Math.max(0, now.getTime() - birth.getTime());
  const totalDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const ageInMonths = Math.floor(totalDays / 30.4375);
  const ageInDays = Math.floor(totalDays % 30.4375);

  let ageDisplay = '';
  if (ageInMonths <= 0) {
    ageDisplay = `${totalDays} ${totalDays === 1 ? 'día' : 'días'}`;
  } else if (ageInMonths === 1) {
    ageDisplay = `1 mes${ageInDays > 0 ? ` y ${ageInDays} d` : ''}`;
  } else {
    ageDisplay = `${ageInMonths} meses${ageInDays > 0 ? ` y ${ageInDays} d` : ''}`;
  }

  // 0 - 1 month (Newborn)
  if (ageInMonths < 1) {
    return {
      ageInMonths,
      ageInDays,
      ageDisplay,
      wakeWindowDisplay: '45 min a 1 hora',
      wakeWindowMinHours: 0.75,
      wakeWindowMaxHours: 1.0,
      wakeWindowMaxMinutes: 60,
      dailyIntakeMlDisplay: 'entre 450 y 650 ml',
      intakePediatricNote: `En etapa recién nacido (${ageDisplay}), una ingesta promedio entre 450 y 650 ml diarios (o lactancia materna a libre demanda) asegura una ganancia de peso adecuada para ${babyName}.`,
      sleepHoursTotalDisplay: '16 a 18 horas',
    };
  }

  // 1 - 2 months
  if (ageInMonths < 2) {
    return {
      ageInMonths,
      ageInDays,
      ageDisplay,
      wakeWindowDisplay: '1h a 1.5h (60 - 90 min)',
      wakeWindowMinHours: 1.0,
      wakeWindowMaxHours: 1.5,
      wakeWindowMaxMinutes: 90,
      dailyIntakeMlDisplay: 'entre 600 y 800 ml',
      intakePediatricNote: `A los ${ageDisplay}, una ingesta promedio entre 600 y 800 ml diarios asegura una hidratación y curva de crecimiento óptima para ${babyName}.`,
      sleepHoursTotalDisplay: '15 a 16 horas',
    };
  }

  // 2 - 3 months
  if (ageInMonths < 3) {
    return {
      ageInMonths,
      ageInDays,
      ageDisplay,
      wakeWindowDisplay: '1.2h a 1.8h (70 - 105 min)',
      wakeWindowMinHours: 1.2,
      wakeWindowMaxHours: 1.8,
      wakeWindowMaxMinutes: 110,
      dailyIntakeMlDisplay: 'entre 650 y 850 ml',
      intakePediatricNote: `A los ${ageDisplay}, una ingesta promedio entre 650 y 850 ml diarios en 6 a 8 tomas mantiene una curva de peso percentil saludable para ${babyName}.`,
      sleepHoursTotalDisplay: '15 a 16 horas',
    };
  }

  // 3 - 4 months (Evan's bracket)
  if (ageInMonths < 5) {
    return {
      ageInMonths,
      ageInDays,
      ageDisplay,
      wakeWindowDisplay: '1.5h a 2.5h (90 - 150 min)',
      wakeWindowMinHours: 1.5,
      wakeWindowMaxHours: 2.5,
      wakeWindowMaxMinutes: 145,
      dailyIntakeMlDisplay: 'entre 700 y 950 ml',
      intakePediatricNote: `A los ${ageDisplay}, una ingesta promedio entre 700 y 950 ml diarios asegura una curva de peso óptima para ${babyName}.`,
      sleepHoursTotalDisplay: '14 a 16 horas',
    };
  }

  // 5 - 6 months
  if (ageInMonths < 7) {
    return {
      ageInMonths,
      ageInDays,
      ageDisplay,
      wakeWindowDisplay: '2h a 3h (120 - 180 min)',
      wakeWindowMinHours: 2.0,
      wakeWindowMaxHours: 3.0,
      wakeWindowMaxMinutes: 175,
      dailyIntakeMlDisplay: 'entre 750 y 1000 ml',
      intakePediatricNote: `A los ${ageDisplay}, una ingesta promedio entre 750 y 1000 ml diarios sostiene su rápido desarrollo motor antes o al iniciar la alimentación complementaria.`,
      sleepHoursTotalDisplay: '13 a 15 horas',
    };
  }

  // 7 - 9 months
  if (ageInMonths < 10) {
    return {
      ageInMonths,
      ageInDays,
      ageDisplay,
      wakeWindowDisplay: '2.5h a 3.5h (150 - 210 min)',
      wakeWindowMinHours: 2.5,
      wakeWindowMaxHours: 3.5,
      wakeWindowMaxMinutes: 205,
      dailyIntakeMlDisplay: 'entre 600 y 800 ml + sólidos',
      intakePediatricNote: `A los ${ageDisplay}, una ingesta láctea entre 600 y 800 ml diarios combinada con 2 a 3 comidas de alimentación complementaria asegura una nutrición balanceada para ${babyName}.`,
      sleepHoursTotalDisplay: '13 a 14 horas',
    };
  }

  // 10 - 12 months
  if (ageInMonths < 12) {
    return {
      ageInMonths,
      ageInDays,
      ageDisplay,
      wakeWindowDisplay: '3h a 4h (180 - 240 min)',
      wakeWindowMinHours: 3.0,
      wakeWindowMaxHours: 4.0,
      wakeWindowMaxMinutes: 235,
      dailyIntakeMlDisplay: 'entre 500 y 700 ml + sólidos',
      intakePediatricNote: `A los ${ageDisplay}, una ingesta láctea entre 500 y 700 ml diarios complementando sus comidas principales mantiene un ritmo de crecimiento ideal para ${babyName}.`,
      sleepHoursTotalDisplay: '12 a 14 horas',
    };
  }

  // 12+ months (1 year onwards)
  return {
    ageInMonths,
    ageInDays,
    ageDisplay,
    wakeWindowDisplay: '3.5h a 5h (210 - 300 min)',
    wakeWindowMinHours: 3.5,
    wakeWindowMaxHours: 5.0,
    wakeWindowMaxMinutes: 290,
    dailyIntakeMlDisplay: 'entre 400 y 500 ml + menú familiar',
    intakePediatricNote: `A los ${ageDisplay}, una ingesta de leche recomendada entre 400 y 500 ml diarios junto al menú familiar completo proporciona la energía necesaria para los pasos activos de ${babyName}.`,
    sleepHoursTotalDisplay: '12 a 14 horas',
  };
}

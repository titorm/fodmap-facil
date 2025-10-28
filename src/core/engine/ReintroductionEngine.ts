/**
 * Engine Determinístico - Protocolo de Reintrodução FODMAP
 *
 * Regras do Protocolo:
 * 1. Fase de Eliminação: 2-6 semanas de dieta baixa em FODMAP
 * 2. Fase de Reintrodução: Testar cada grupo FODMAP individualmente
 *    - Dia 1: Porção pequena
 *    - Dia 2: Porção média
 *    - Dia 3: Porção grande
 *    - Dias 4-6: Washout (retorno à dieta baixa FODMAP)
 * 3. Fase de Personalização: Incorporar alimentos tolerados
 */

import {
  FODMAPGroup,
  TestPhase,
  SymptomSeverity,
  ReintroductionProtocol,
  ReintroductionTest,
} from "../domain/entities/ReintroductionTest";

export class ReintroductionEngine {
  private static readonly PROTOCOLS: Record<
    FODMAPGroup,
    ReintroductionProtocol
  > = {
    [FODMAPGroup.FRUCTOSE]: {
      fodmapGroup: FODMAPGroup.FRUCTOSE,
      testDuration: 3,
      washoutPeriod: 3,
      recommendedFoods: ["Honey", "Mango", "Asparagus"],
      portionProgression: ["1 tsp", "2 tsp", "1 tbsp"],
    },
    [FODMAPGroup.LACTOSE]: {
      fodmapGroup: FODMAPGroup.LACTOSE,
      testDuration: 3,
      washoutPeriod: 3,
      recommendedFoods: ["Milk", "Yogurt", "Ice cream"],
      portionProgression: ["1/4 cup", "1/2 cup", "1 cup"],
    },
    [FODMAPGroup.FRUCTANS]: {
      fodmapGroup: FODMAPGroup.FRUCTANS,
      testDuration: 3,
      washoutPeriod: 3,
      recommendedFoods: ["Wheat bread", "Garlic", "Onion"],
      portionProgression: ["1 slice", "2 slices", "3 slices"],
    },
    [FODMAPGroup.GALACTANS]: {
      fodmapGroup: FODMAPGroup.GALACTANS,
      testDuration: 3,
      washoutPeriod: 3,
      recommendedFoods: ["Chickpeas", "Lentils", "Kidney beans"],
      portionProgression: ["1/4 cup", "1/2 cup", "3/4 cup"],
    },
    [FODMAPGroup.POLYOLS]: {
      fodmapGroup: FODMAPGroup.POLYOLS,
      testDuration: 3,
      washoutPeriod: 3,
      recommendedFoods: ["Avocado", "Mushrooms", "Cauliflower"],
      portionProgression: ["1/4 cup", "1/2 cup", "1 cup"],
    },
  };

  /**
   * Obtém o protocolo para um grupo FODMAP específico
   */
  static getProtocol(group: FODMAPGroup): ReintroductionProtocol {
    return this.PROTOCOLS[group];
  }

  /**
   * Determina se o usuário pode avançar para o próximo grupo FODMAP
   * Baseado na severidade dos sintomas durante o teste
   */
  static canProgressToNextGroup(test: ReintroductionTest): boolean {
    const maxSeverity = this.getMaxSymptomSeverity(test);

    // Se teve sintomas moderados ou graves, não deve avançar
    return maxSeverity < SymptomSeverity.MODERATE;
  }

  /**
   * Calcula a severidade máxima dos sintomas em um teste
   */
  static getMaxSymptomSeverity(test: ReintroductionTest): SymptomSeverity {
    if (test.symptoms.length === 0) {
      return SymptomSeverity.NONE;
    }

    return Math.max(...test.symptoms.map((s) => s.severity)) as SymptomSeverity;
  }

  /**
   * Determina a tolerância do usuário a um grupo FODMAP
   */
  static determineTolerance(tests: ReintroductionTest[]): {
    group: FODMAPGroup;
    tolerated: boolean;
    maxToleratedPortion?: string;
  } | null {
    if (tests.length === 0) return null;

    const group = tests[0].fodmapGroup;
    const protocol = this.getProtocol(group);

    // Encontra a última porção tolerada (sem sintomas moderados/graves)
    let maxToleratedIndex = -1;

    for (let i = 0; i < tests.length; i++) {
      const severity = this.getMaxSymptomSeverity(tests[i]);
      if (severity < SymptomSeverity.MODERATE) {
        maxToleratedIndex = i;
      } else {
        break;
      }
    }

    return {
      group,
      tolerated: maxToleratedIndex >= 0,
      maxToleratedPortion:
        maxToleratedIndex >= 0
          ? protocol.portionProgression[maxToleratedIndex]
          : undefined,
    };
  }

  /**
   * Calcula o próximo dia de teste baseado no protocolo
   */
  static getNextTestDay(currentDay: number, hadSymptoms: boolean): number {
    if (hadSymptoms) {
      // Se teve sintomas, inicia washout period
      return currentDay + 1;
    }

    // Continua progressão normal
    return currentDay + 1;
  }

  /**
   * Determina se está no período de washout
   */
  static isInWashoutPeriod(dayNumber: number, testDuration: number): boolean {
    return dayNumber > testDuration;
  }

  /**
   * Sugere a próxima porção baseada no dia do teste
   */
  static getSuggestedPortion(
    group: FODMAPGroup,
    dayNumber: number
  ): string | null {
    const protocol = this.getProtocol(group);

    if (dayNumber < 1 || dayNumber > protocol.testDuration) {
      return null;
    }

    return protocol.portionProgression[dayNumber - 1];
  }

  /**
   * Valida se um teste está seguindo o protocolo corretamente
   */
  static validateTestProtocol(test: ReintroductionTest): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];
    const protocol = this.getProtocol(test.fodmapGroup);

    // Valida dia do teste
    if (test.dayNumber < 1) {
      errors.push("Day number must be at least 1");
    }

    // Valida se está na fase correta
    if (test.phase !== TestPhase.REINTRODUCTION) {
      errors.push("Test must be in reintroduction phase");
    }

    // Valida se o alimento está na lista recomendada
    const isRecommendedFood = protocol.recommendedFoods.some(
      (food) => food.toLowerCase() === test.foodItem.toLowerCase()
    );

    if (!isRecommendedFood) {
      errors.push(
        `Food item should be one of: ${protocol.recommendedFoods.join(", ")}`
      );
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Gera recomendações baseadas nos resultados dos testes
   */
  static generateRecommendations(allTests: ReintroductionTest[]): string[] {
    const recommendations: string[] = [];

    // Agrupa testes por grupo FODMAP
    const testsByGroup = allTests.reduce(
      (acc, test) => {
        if (!acc[test.fodmapGroup]) {
          acc[test.fodmapGroup] = [];
        }
        acc[test.fodmapGroup].push(test);
        return acc;
      },
      {} as Record<FODMAPGroup, ReintroductionTest[]>
    );

    // Analisa cada grupo
    Object.entries(testsByGroup).forEach(([group, tests]) => {
      const tolerance = this.determineTolerance(tests);

      if (tolerance?.tolerated) {
        recommendations.push(
          `You can tolerate ${group} up to ${tolerance.maxToleratedPortion}`
        );
      } else {
        recommendations.push(
          `Consider avoiding ${group} or consulting with a dietitian`
        );
      }
    });

    return recommendations;
  }
}

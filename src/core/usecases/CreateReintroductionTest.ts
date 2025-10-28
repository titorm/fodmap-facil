/**
 * Caso de Uso: Criar Teste de Reintrodução
 */

import { ReintroductionTest, FODMAPGroup, TestPhase } from '../domain/entities/ReintroductionTest';
import { ReintroductionEngine } from '../engine/ReintroductionEngine';

export interface CreateReintroductionTestInput {
  userId: string;
  fodmapGroup: FODMAPGroup;
  dayNumber: number;
  foodItem: string;
  portionSize: string;
  notes?: string;
}

export interface CreateReintroductionTestOutput {
  test: ReintroductionTest;
  validation: {
    valid: boolean;
    errors: string[];
    warnings: string[];
  };
}

export class CreateReintroductionTest {
  async execute(input: CreateReintroductionTestInput): Promise<CreateReintroductionTestOutput> {
    const now = new Date();

    // Criar teste
    const test: ReintroductionTest = {
      id: this.generateId(),
      userId: input.userId,
      fodmapGroup: input.fodmapGroup,
      phase: TestPhase.REINTRODUCTION,
      dayNumber: input.dayNumber,
      foodItem: input.foodItem,
      portionSize: input.portionSize,
      symptoms: [],
      notes: input.notes,
      startDate: now,
      createdAt: now,
      updatedAt: now,
    };

    // Validar protocolo
    const protocolValidation = ReintroductionEngine.validateTestProtocol(test);
    const warnings: string[] = [];

    // Verificar porção sugerida
    const suggestedPortion = ReintroductionEngine.getSuggestedPortion(
      input.fodmapGroup,
      input.dayNumber
    );

    if (suggestedPortion && suggestedPortion !== input.portionSize) {
      warnings.push(`Suggested portion for day ${input.dayNumber} is ${suggestedPortion}`);
    }

    return {
      test,
      validation: {
        valid: protocolValidation.valid,
        errors: protocolValidation.errors,
        warnings,
      },
    };
  }

  private generateId(): string {
    return `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

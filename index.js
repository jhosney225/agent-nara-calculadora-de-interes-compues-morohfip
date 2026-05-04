
```javascript
const Anthropic = require('@anthropic-ai/sdk');
const readline = require('readline');

const client = new Anthropic();

// Definición de herramientas para la calculadora de interés compuesto
const tools = [
  {
    name: 'calculate_compound_interest',
    description: 'Calcula el interés compuesto para una inversión a largo plazo. Retorna el monto final, interés ganado y otros detalles.',
    input_schema: {
      type: 'object',
      properties: {
        principal: {
          type: 'number',
          description: 'Monto inicial invertido en moneda local'
        },
        annual_rate: {
          type: 'number',
          description: 'Tasa de interés anual en porcentaje (ej: 5 para 5%)'
        },
        years: {
          type: 'number',
          description: 'Número de años para la inversión'
        },
        compound_frequency: {
          type: 'string',
          enum: ['annually', 'semi-annually', 'quarterly', 'monthly', 'daily'],
          description: 'Frecuencia de capitalización del interés'
        }
      },
      required: ['principal', 'annual_rate', 'years', 'compound_frequency']
    }
  },
  {
    name: 'calculate_multiple_scenarios',
    description: 'Compara múltiples escenarios de inversión con diferentes tasas y períodos',
    input_schema: {
      type: 'object',
      properties: {
        principal: {
          type: 'number',
          description: 'Monto inicial invertido'
        },
        rates: {
          type: 'array',
          items: { type: 'number' },
          description: 'Array de tasas de interés a comparar (en porcentaje)'
        },
        years_array: {
          type: 'array',
          items: { type: 'number' },
          description: 'Array de períodos en años a comparar'
        }
      },
      required: ['principal', 'rates', 'years_array']
    }
  },
  {
    name: 'calculate_inflation_adjusted',
    description: 'Calcula el retorno real de una inversión ajustado por inflación',
    input_schema: {
      type: 'object',
      properties: {
        principal: {
          type: 'number',
          description: 'Monto inicial invertido'
        },
        annual_rate: {
          type: 'number',
          description: 'Tasa de interés anual en porcentaje'
        },
        years: {
          type: 'number',
          description: 'Número de años'
        },
        inflation_rate: {
          type: 'number',
          description: 'Tasa de inflación anual en porcentaje'
        }
      },
      required: ['principal', 'annual_rate', 'years', 'inflation_rate']
    }
  }
];

// Implementación de funciones de cálculo
function calculateCompoundInterest(principal, annualRate, years, compoundFrequency) {
  const frequencies = {
    'annually': 1,
    'semi-annually': 2,
    'quarterly': 4,
    'monthly': 12,
    'daily': 365
  };
  
  const n = frequencies[compoundFrequency];
  const r = annualRate / 100;
  
  const amount = principal * Math.pow(1 + r / n, n * years);
  const interest = amount - principal;
  
  return {
    principal: Number(principal.toFixed(2)),
    annual_rate: Number(annualRate.toFixed(2)),
    years: years,
    compound_frequency: compoundFrequency,
    final_amount: Number(amount.toFixed(2)),
    total_interest: Number(interest.toFixed(2)),
    effective_annual_rate: Number((Math.pow(1 + r / n, n) - 1) * 100).toFixed(4) + '%'
  };
}

function calculateMultipleScenarios(principal, rates, yearsArray) {
  const scenarios = [];
  
  for (const rate of rates) {
    for (const years of yearsArray) {
      const result = calculateCompoundInterest(principal, rate, years, 'annually');
      scenarios.push({
        rate: rate + '%',
        years: years,
        final_amount: result.final_amount,
        total_interest: result.total_interest
      });
    }
  }
  
  return {
    principal: Number(principal.toFixed(2)),
    scenarios: scenarios
  };
}

function calculateInflationAdjusted(principal, annualRate, years, inflationRate) {
  const nominal = calculateCompoundInterest(principal, annualRate, years, 'annually');
  
  const realRate = ((1 + (annualRate / 100)) / (1 + (inflationRate / 100)) - 1) * 100;
  const realAmount = principal * Math.pow(1 + realRate / 100, years);
  const realInterest = realAmount - principal;
  const purchasingPower = realAmount;
  
  return {
    nominal_final_amount: nominal.final_amount,
    nominal_interest: nominal.total_interest,
    inflation_rate: Number(inflationRate.toFixed(2)) + '%',
    real_annual_rate: Number(realRate.toFixed(4)) + '%',
    real_final_amount: Number(realAmount.toFixed(2)),
    real_interest: Number(realInterest.toFixed(2)),
    purchasing_power_lost: Number((nominal.final_amount - realAmount).toFixed(2))
  };
}

// Procesar llamadas de herramientas
function processToolCall(toolName, toolInput) {
  switch
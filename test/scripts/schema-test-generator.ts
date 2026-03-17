import { z } from 'zod';
import fs from 'fs/promises';
import path from 'path';

interface SchemaTestCase {
  name: string;
  input: any;
  isValid: boolean;
  description?: string;
}

interface SchemaTestConfig {
  schema: z.ZodSchema<any>;
  endpoint: string;
  method: string;
  testCount: number;
}

class SchemaTestGenerator {
  static generateValidCases(schema: z.ZodSchema<any>, count: number): SchemaTestCase[] {
    const validCases: SchemaTestCase[] = [];
    
    // Generate valid cases based on schema
    for (let i = 0; i < Math.floor(count * 0.6); i++) {
      try {
        // This is a simplified approach - in real implementation we'd have a more sophisticated
        // method to generate valid test data based on the schema
        const sampleData = this.generateValidSample(schema);
        validCases.push({
          name: `valid_case_${i + 1}`,
          input: sampleData,
          isValid: true,
          description: `Valid case ${i + 1}`
        });
      } catch (error) {
        console.warn(`Could not generate valid case ${i + 1}:`, error);
      }
    }
    
    return validCases;
  }

  static generateInvalidCases(schema: z.ZodSchema<any>, count: number): SchemaTestCase[] {
    const invalidCases: SchemaTestCase[] = [];
    
    // Generate invalid cases by modifying valid data
    for (let i = 0; i < Math.floor(count * 0.4); i++) {
      try {
        const invalidData = this.generateInvalidSample(schema);
        invalidCases.push({
          name: `invalid_case_${i + 1}`,
          input: invalidData,
          isValid: false,
          description: `Invalid case ${i + 1}`
        });
      } catch (error) {
        console.warn(`Could not generate invalid case ${i + 1}:`, error);
      }
    }
    
    return invalidCases;
  }

  private static generateValidSample(schema: z.ZodSchema<any>): any {
    // This is a simplified approach to generate valid samples
    // In a real implementation, we would use more sophisticated methods
    if (schema instanceof z.ZodObject) {
      const shape = schema.shape;
      const result: any = {};
      
      Object.keys(shape).forEach(key => {
        const fieldSchema = shape[key];
        result[key] = this.generateFieldSample(fieldSchema);
      });
      
      return result;
    }
    
    // Fallback for non-object schemas
    return this.getDefaultValidValue(schema);
  }

  private static generateInvalidSample(schema: z.ZodSchema<any>): any {
    // Generate invalid sample by providing wrong types/values
    if (schema instanceof z.ZodObject) {
      const shape = schema.shape;
      const result: any = {};
      const keys = Object.keys(shape);
      
      // Modify some fields to be invalid
      for (const key of keys) {
        const fieldSchema = shape[key];
        
        // Randomly decide to make this field invalid
        if (Math.random() > 0.7) {
          result[key] = this.generateInvalidFieldSample(fieldSchema);
        } else {
          result[key] = this.generateFieldSample(fieldSchema);
        }
      }
      
      return result;
    }
    
    // Return an invalid value based on the schema type
    return this.getDefaultInvalidValue(schema);
  }

  private static generateFieldSample(fieldSchema: any): any {
    if (fieldSchema instanceof z.ZodString) {
      if (fieldSchema._def.checks.some((check: any) => check.kind === 'email')) {
        return 'test@example.com';
      } else if (fieldSchema._def.checks.some((check: any) => check.kind === 'min' && check.value >= 10)) {
        return 'a'.repeat(15); // Generate a long string if minimum length is 10+
      } else {
        return 'sample_text';
      }
    } else if (fieldSchema instanceof z.ZodNumber) {
      if (fieldSchema._def.checks.some((check: any) => check.kind === 'min' && check.value >= 0)) {
        return Math.max(1, Math.abs(Math.random() * 100));
      } else {
        return Math.random() * 100;
      }
    } else if (fieldSchema instanceof z.ZodBoolean) {
      return Math.random() > 0.5;
    } else if (fieldSchema instanceof z.ZodArray) {
      return [this.generateFieldSample(fieldSchema._def.type)];
    } else if (fieldSchema instanceof z.ZodEnum) {
      return fieldSchema._def.values[0]; // Take first enum value
    } else if (fieldSchema instanceof z.ZodDate) {
      return new Date();
    } else if (fieldSchema instanceof z.ZodObject) {
      return this.generateValidSample(fieldSchema);
    } else {
      return this.getDefaultValidValue(fieldSchema);
    }
  }

  private static generateInvalidFieldSample(fieldSchema: any): any {
    if (fieldSchema instanceof z.ZodString) {
      // Return a number for string field
      return 123;
    } else if (fieldSchema instanceof z.ZodNumber) {
      // Return a string for number field
      return 'not_a_number';
    } else if (fieldSchema instanceof z.ZodBoolean) {
      // Return a string for boolean field
      return 'not_a_boolean';
    } else if (fieldSchema instanceof z.ZodArray) {
      // Return a single item instead of array
      return this.generateFieldSample(fieldSchema._def.type);
    } else if (fieldSchema instanceof z.ZodEnum) {
      // Return invalid enum value
      return 'invalid_enum_value';
    } else if (fieldSchema instanceof z.ZodDate) {
      // Return invalid date
      return 'not_a_date';
    } else if (fieldSchema instanceof z.ZodObject) {
      // Return a malformed object
      return 'not_an_object';
    } else {
      return this.getDefaultInvalidValue(fieldSchema);
    }
  }

  private static getDefaultValidValue(schema: z.ZodSchema<any>): any {
    if (schema instanceof z.ZodString) return 'valid_string';
    if (schema instanceof z.ZodNumber) return 42;
    if (schema instanceof z.ZodBoolean) return true;
    if (schema instanceof z.ZodDate) return new Date();
    return 'default_valid_value';
  }

  private static getDefaultInvalidValue(schema: z.ZodSchema<any>): any {
    if (schema instanceof z.ZodString) return 123;
    if (schema instanceof z.ZodNumber) return 'not_a_number';
    if (schema instanceof z.ZodBoolean) return 'not_a_boolean';
    if (schema instanceof z.ZodDate) return 'not_a_date';
    return 'default_invalid_value';
  }

  static async generateTestFile(config: SchemaTestConfig, outputPath: string): Promise<void> {
    const { schema, endpoint, method, testCount } = config;
    
    const validCases = this.generateValidCases(schema, Math.ceil(testCount * 0.6));
    const invalidCases = this.generateInvalidCases(schema, Math.ceil(testCount * 0.4));
    const allCases = [...validCases, ...invalidCases].sort(() => Math.random() - 0.5);
    
    // Generate Jest test file
    const testContent = `
import request from 'supertest';
import app from '../../src/app'; // Adjust path as needed
import { testUser, testCredit, testLoan, testRepayment } from '../fixtures/factory';

describe('${endpoint} API Tests', () => {
  describe('${method.toUpperCase()} ${endpoint}', () => {
    ${allCases.map(testCase => `
    test('${testCase.description}', async () => {
      const testData = ${JSON.stringify(testCase.input, null, 2)};
      const response = await request(app)
        .${method.toLowerCase()}('${endpoint}')
        .send(testData)
        .expect(${testCase.isValid ? '200' : '400'});
      
      expect(response.status).toBe(${testCase.isValid ? 200 : 400});
    });`).join('\n')}
  });
});
    `.trim();

    await fs.mkdir(path.dirname(outputPath), { recursive: true });
    await fs.writeFile(outputPath, testContent);
    console.log(`Generated test file: ${outputPath}`);
  }

  static async generateAllTests(): Promise<void> {
    // This function would typically import all schemas and generate tests for them
    console.log('Generating all schema-based tests...');
    
    // Example schemas (these would come from the actual application)
    const schemas = [
      // These are placeholder examples - in real implementation, 
      // these would be imported from the actual application
    ];
    
    for (const schemaConfig of schemas) {
      const fileName = `${schemaConfig.endpoint.replace(/\//g, '_')}_${schemaConfig.method}.spec.ts`;
      const outputPath = path.join(__dirname, `../../test/generated/${fileName}`);
      await this.generateTestFile(schemaConfig, outputPath);
    }
  }

  // Function to generate boundary test cases
  static generateBoundaryCases(schema: z.ZodSchema<any>, fieldName: string, boundaryValues: any[]): SchemaTestCase[] {
    const boundaryCases: SchemaTestCase[] = [];
    
    boundaryValues.forEach((boundaryValue, index) => {
      boundaryCases.push({
        name: `boundary_case_${fieldName}_${index}`,
        input: { [fieldName]: boundaryValue },
        isValid: true, // This would need to be determined based on schema validation
        description: `Boundary test for ${fieldName} with value: ${boundaryValue}`
      });
    });
    
    return boundaryCases;
  }

  // Function to generate edge cases
  static generateEdgeCases(schema: z.ZodSchema<any>): SchemaTestCase[] {
    const edgeCases: SchemaTestCase[] = [];
    
    // Add common edge cases
    edgeCases.push(
      {
        name: 'empty_object',
        input: {},
        isValid: false,
        description: 'Empty object should fail validation if required fields exist'
      },
      {
        name: 'null_values',
        input: null,
        isValid: false,
        description: 'Null input should fail validation'
      },
      {
        name: 'undefined_values',
        input: undefined,
        isValid: false,
        description: 'Undefined input should fail validation'
      }
    );
    
    return edgeCases;
  }
}

// Export the class
export default SchemaTestGenerator;

// If running as script
if (require.main === module) {
  SchemaTestGenerator.generateAllTests()
    .then(() => console.log('All schema tests generated successfully'))
    .catch(console.error);
}
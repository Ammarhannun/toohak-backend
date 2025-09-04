// Do not delete this file
// Note:: None of these tests access the dataStore - this is because black box tests can only access the specification
// If you want to access information in the dataStore, you will have to do so via a function in the specification and not via direct variable access.

import { echo } from './echo.js';

// Variables defined here are available in all tests and test blocks
const testVar1 = '1';
describe('Echo tests', () => {
  // to use variables that are modified in beforeEach, define them prior to the beforeEach statement in each block
  let ourTestCounter = 0;
  beforeEach(() => {
    // This will execute before each test in THIS block.
    // It is useful for resetting the state and setting up the default test state
    ourTestCounter++;
  });

  test('Test successful echo', () => {
    // Accessing a variable that was defined outside this block is possible if it is in a parent block
    console.log(`Test Counter: ${ourTestCounter}`);

    // Variables defined here are only available in this test block.
    const testVarABC = 'abc';

    // When we know the exact value of a result, we can use the expect().toBe() structure
    let result = echo(testVar1);
    expect(result).toBe(testVar1);
    result = echo(testVarABC);
    expect(result).toBe(testVarABC);
  });

  test('Test invalid echo', () => {
    console.log(`Test Counter: ${ourTestCounter}`);

    // When we do not know the value of a result, but we do know the structure and type of the object response, we can use the expect().toMatchObject({objectStruture})
    // inside the objectStructure, we can match expected types like String or Number using expect.any(String) or expect.any(Number)
    expect(echo({ echo: 'echo' })).toMatchObject({ error: expect.any(String) });
  });
});

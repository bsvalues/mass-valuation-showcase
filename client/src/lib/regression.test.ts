import { describe, it, expect } from 'vitest';
import { multipleRegression, generateDiagnosticPlots } from './regression';

describe('Regression Analysis Library', () => {
  it('performs simple linear regression correctly', () => {
    // Simple dataset: y = 2x + 1
    const y = [3, 5, 7, 9, 11];
    const X = {
      x: [1, 2, 3, 4, 5]
    };

    const result = multipleRegression(y, X);

    // Check coefficients (should be close to 2 for slope, 1 for intercept)
    expect(result.coefficients.x).toBeCloseTo(2, 1);
    expect(result.intercept).toBeCloseTo(1, 1);
    
    // Perfect fit should have R-squared = 1
    expect(result.rSquared).toBeGreaterThan(0.99);
  });

  it('performs multiple linear regression correctly', () => {
    // Dataset with two predictors
    const y = [450000, 520000, 380000, 610000, 490000];
    const X = {
      squareFeet: [2000, 2400, 1800, 2800, 2200],
      yearBuilt: [2010, 2015, 2005, 2018, 2012]
    };

    const result = multipleRegression(y, X);

    // Check that we have coefficients for both variables
    expect(result.coefficients).toHaveProperty('squareFeet');
    expect(result.coefficients).toHaveProperty('yearBuilt');
    
    // R-squared should be between 0 and 1
    expect(result.rSquared).toBeGreaterThanOrEqual(0);
    expect(result.rSquared).toBeLessThanOrEqual(1);
    
    // Adjusted R-squared should be less than or equal to R-squared
    expect(result.adjustedRSquared).toBeLessThanOrEqual(result.rSquared);
  });

  it('calculates statistical significance correctly', () => {
    const y = [450000, 520000, 380000, 610000, 490000, 550000, 420000, 580000];
    const X = {
      squareFeet: [2000, 2400, 1800, 2800, 2200, 2600, 1900, 2700]
    };

    const result = multipleRegression(y, X);

    // Check that statistical tests are present
    expect(result.fStatistic).toBeGreaterThan(0);
    expect(result.fPValue).toBeGreaterThanOrEqual(0);
    expect(result.fPValue).toBeLessThanOrEqual(1);
    
    // Check p-values for coefficients
    expect(result.pValues.squareFeet).toBeGreaterThanOrEqual(0);
    expect(result.pValues.squareFeet).toBeLessThanOrEqual(1);
    
    // Check standard errors
    expect(result.standardErrors.squareFeet).toBeGreaterThan(0);
  });

  it('calculates confidence intervals correctly', () => {
    const y = [450000, 520000, 380000, 610000, 490000];
    const X = {
      squareFeet: [2000, 2400, 1800, 2800, 2200]
    };

    const result = multipleRegression(y, X);

    // Confidence interval should contain the coefficient
    const ci = result.confidenceIntervals.squareFeet;
    const coef = result.coefficients.squareFeet;
    
    expect(ci[0]).toBeLessThan(coef);
    expect(ci[1]).toBeGreaterThan(coef);
  });

  it('calculates VIF for multicollinearity detection', () => {
    const y = [450000, 520000, 380000, 610000, 490000, 550000];
    const X = {
      squareFeet: [2000, 2400, 1800, 2800, 2200, 2600],
      yearBuilt: [2010, 2015, 2005, 2018, 2012, 2016]
    };

    const result = multipleRegression(y, X);

    // VIF should be calculated for all variables
    expect(result.vif).toHaveProperty('squareFeet');
    expect(result.vif).toHaveProperty('yearBuilt');
    
    // VIF should be positive
    expect(result.vif.squareFeet).toBeGreaterThan(0);
    expect(result.vif.yearBuilt).toBeGreaterThan(0);
  });

  it('generates diagnostic plots data', () => {
    const y = [450000, 520000, 380000, 610000, 490000];
    const X = {
      squareFeet: [2000, 2400, 1800, 2800, 2200]
    };

    const result = multipleRegression(y, X);
    const plots = generateDiagnosticPlots(result);

    // Check that all diagnostic plots are generated
    expect(plots.residualsVsFitted).toHaveLength(5);
    expect(plots.qqPlot).toHaveLength(5);
    expect(plots.scaleLocation).toHaveLength(5);
    expect(plots.residualsVsLeverage).toHaveLength(5);
    
    // Check data structure
    expect(plots.residualsVsFitted[0]).toHaveProperty('x');
    expect(plots.residualsVsFitted[0]).toHaveProperty('y');
  });

  it('performs diagnostic tests', () => {
    const y = [450000, 520000, 380000, 610000, 490000, 550000, 420000, 580000];
    const X = {
      squareFeet: [2000, 2400, 1800, 2800, 2200, 2600, 1900, 2700]
    };

    const result = multipleRegression(y, X);

    // Check normality test
    expect(result.diagnostics.normalityTest).toHaveProperty('statistic');
    expect(result.diagnostics.normalityTest).toHaveProperty('pValue');
    expect(result.diagnostics.normalityTest.pValue).toBeGreaterThanOrEqual(0);
    expect(result.diagnostics.normalityTest.pValue).toBeLessThanOrEqual(1);
    
    // Check homoscedasticity test
    expect(result.diagnostics.homoscedasticityTest).toHaveProperty('statistic');
    expect(result.diagnostics.homoscedasticityTest).toHaveProperty('pValue');
    expect(result.diagnostics.homoscedasticityTest.pValue).toBeGreaterThanOrEqual(0);
    expect(result.diagnostics.homoscedasticityTest.pValue).toBeLessThanOrEqual(1);
  });

  it('handles residuals correctly', () => {
    const y = [450000, 520000, 380000, 610000, 490000];
    const X = {
      squareFeet: [2000, 2400, 1800, 2800, 2200]
    };

    const result = multipleRegression(y, X);

    // Residuals should sum to approximately zero
    const residualSum = result.residuals.reduce((sum, r) => sum + r, 0);
    expect(Math.abs(residualSum)).toBeLessThan(1);
    
    // Fitted values should match the length of y
    expect(result.fitted).toHaveLength(y.length);
    
    // Residuals + Fitted should equal original y
    for (let i = 0; i < y.length; i++) {
      expect(result.fitted[i] + result.residuals[i]).toBeCloseTo(y[i], 0);
    }
  });
});

# TerraForge Advanced Predictive Modeling (AVM) - Engineering Protocol

**TerraFusion Elite Government OS Engineering Agent**  
**Feature:** Automated Valuation Models with Machine Learning  
**Date:** January 13, 2026  
**Protocol:** Evidence-Based, Test-First Development

---

## Executive Summary

Implement production-grade machine learning capabilities for automated property valuation in TerraForge. This feature will enable county assessors to leverage neural networks and random forests for predictive modeling, reducing manual valuation time and improving accuracy.

---

## Phase 1: Evidence Gathering & Architecture Design

### Technology Selection (Evidence-Based)

**Evaluated Options:**

1. **TensorFlow.js** (Google)
   - Pros: Industry standard, GPU acceleration, extensive documentation
   - Cons: Large bundle size (~500KB), complex API
   - Use case: Production-grade neural networks

2. **Brain.js** (Open Source)
   - Pros: Simple API, small bundle (~50KB), pure JavaScript
   - Cons: Limited algorithms, no GPU acceleration
   - Use case: Lightweight neural networks

3. **ml.js** (Open Source)
   - Pros: Comprehensive ML toolkit, Random Forest support, small size
   - Cons: No GPU acceleration, limited deep learning
   - Use case: Classical ML algorithms

**Decision: Hybrid Approach**
- **ml.js** for Random Forest (classical ML, interpretable)
- **Brain.js** for Neural Networks (simple API, adequate for tabular data)
- **Rationale:** Balance between performance, bundle size, and ease of implementation

---

## AVM Architecture Design

### Model Types

**1. Random Forest Regressor**
- **Algorithm:** Ensemble of decision trees
- **Strengths:** Interpretable, handles non-linear relationships, robust to outliers
- **Use case:** Primary AVM for county assessors (explainability required)
- **Features:** 10-15 property attributes (sqft, year built, neighborhood, etc.)
- **Target:** Total property value

**2. Neural Network Regressor**
- **Architecture:** 3-layer feedforward network (input → hidden → output)
- **Activation:** ReLU (hidden), Linear (output)
- **Strengths:** Captures complex non-linear patterns
- **Use case:** Advanced AVM for high-accuracy predictions
- **Features:** Same as Random Forest for fair comparison

**3. Ensemble Model** (Future Enhancement)
- **Algorithm:** Weighted average of Random Forest + Neural Network
- **Strengths:** Best of both worlds (interpretability + accuracy)

---

## Feature Engineering Pipeline

### Input Features (Normalized)

1. **Structural Features:**
   - Square footage (normalized by neighborhood mean)
   - Year built (age in years)
   - Number of bedrooms
   - Number of bathrooms
   - Lot size

2. **Location Features:**
   - Neighborhood (one-hot encoded)
   - Latitude/Longitude (normalized)
   - Distance to city center
   - School district rating

3. **Market Features:**
   - Recent comparable sales (within 1 mile, 6 months)
   - Neighborhood median sale price
   - Days on market (average)

4. **Derived Features:**
   - Price per square foot (from comps)
   - Age-adjusted value
   - Location desirability score

### Feature Preprocessing

- **Normalization:** Min-max scaling to [0, 1] range
- **Encoding:** One-hot for categorical variables
- **Missing values:** Median imputation for numerical, mode for categorical
- **Outlier handling:** Winsorization at 1st and 99th percentiles

---

## Model Evaluation Metrics

### Primary Metrics

1. **Mean Absolute Error (MAE)**
   - Formula: `MAE = (1/n) * Σ|y_pred - y_actual|`
   - Interpretation: Average dollar error in predictions
   - Target: < $50,000 for residential properties

2. **Root Mean Squared Error (RMSE)**
   - Formula: `RMSE = sqrt((1/n) * Σ(y_pred - y_actual)²)`
   - Interpretation: Penalizes large errors more heavily
   - Target: < $75,000

3. **R-squared (R²)**
   - Formula: `R² = 1 - (SS_res / SS_tot)`
   - Interpretation: Proportion of variance explained
   - Target: > 0.85 (85% variance explained)

4. **Mean Absolute Percentage Error (MAPE)**
   - Formula: `MAPE = (100/n) * Σ|(y_pred - y_actual) / y_actual|`
   - Interpretation: Average percentage error
   - Target: < 15%

### Secondary Metrics

- **Prediction Interval Coverage:** 90% of actual values within prediction interval
- **Feature Importance:** Top 5 features driving predictions
- **Training Time:** < 30 seconds for 10,000 parcels
- **Inference Time:** < 100ms per prediction

---

## Training Strategy

### Data Split

- **Training Set:** 70% of parcels
- **Validation Set:** 15% of parcels (hyperparameter tuning)
- **Test Set:** 15% of parcels (final evaluation)
- **Cross-Validation:** 5-fold CV for model reliability

### Hyperparameters

**Random Forest:**
- Number of trees: 100
- Max depth: 15
- Min samples split: 10
- Min samples leaf: 5

**Neural Network:**
- Hidden layer size: 64 neurons
- Learning rate: 0.001
- Epochs: 100
- Batch size: 32
- Activation: ReLU

---

## Success Criteria

### Functional Requirements

✓ Train Random Forest model on parcel data  
✓ Train Neural Network model on parcel data  
✓ Predict property values for new parcels  
✓ Display model performance metrics (MAE, RMSE, R², MAPE)  
✓ Save and load trained models  
✓ Compare multiple models side-by-side  
✓ Visualize feature importance  

### Non-Functional Requirements

✓ Training time < 30 seconds for 10,000 parcels  
✓ Prediction time < 100ms per property  
✓ Model accuracy: MAE < $50,000, R² > 0.85  
✓ UI responsive during training (web workers)  
✓ Model persistence in database  
✓ Zero regressions in existing tests  

---

## Implementation Plan

### Phase 2: ML Implementation (Estimated: 2-3 hours)

1. Install ml.js and brain.js dependencies
2. Create `client/src/lib/ml/` directory structure
3. Implement Random Forest trainer and predictor
4. Implement Neural Network trainer and predictor
5. Create feature engineering pipeline
6. Implement model evaluation functions
7. Add model persistence (IndexedDB for client, database for server)
8. Write 20+ unit tests for ML algorithms

### Phase 3: AVM Studio UI (Estimated: 2-3 hours)

1. Create `client/src/pages/AVMStudio.tsx`
2. Add model selection interface
3. Add training configuration panel
4. Add training progress visualization (real-time metrics)
5. Add model performance dashboard
6. Add prediction interface for new properties
7. Add feature importance chart
8. Add model comparison table

### Phase 4: Testing & Validation (Estimated: 1 hour)

1. Run unit tests (20+ tests)
2. Run integration tests with real parcel data
3. Validate model accuracy meets success criteria
4. Test performance with 1K, 5K, 10K parcels
5. Document model architecture and usage
6. Save checkpoint

---

## Risk Analysis

### Technical Risks

1. **Model Accuracy:** Insufficient data may lead to poor predictions
   - **Mitigation:** Require minimum 500 parcels for training, show confidence intervals

2. **Training Performance:** Large datasets may cause UI freezing
   - **Mitigation:** Use web workers for training, show progress bar

3. **Overfitting:** Models may memorize training data
   - **Mitigation:** Cross-validation, regularization, test set evaluation

4. **Feature Engineering:** Poor features may limit model performance
   - **Mitigation:** Feature importance analysis, iterative feature selection

### Business Risks

1. **User Trust:** Assessors may not trust "black box" predictions
   - **Mitigation:** Provide feature importance, prediction intervals, model explainability

2. **Regulatory Compliance:** Some jurisdictions require manual appraisals
   - **Mitigation:** Position AVM as decision support tool, not replacement

---

## Agent Self-Reference Notes

**Key Decisions:**
- Chose ml.js + brain.js hybrid approach for balance of features and simplicity
- Prioritized Random Forest for interpretability (government use case)
- Designed for client-side training (privacy, no server costs)

**Gotchas:**
- ml.js Random Forest requires specific data format (arrays of arrays)
- Brain.js normalizes inputs automatically, may conflict with our preprocessing
- IndexedDB has 50MB limit, may need to compress large models

**Optimization Opportunities:**
- GPU acceleration with TensorFlow.js (future enhancement)
- Server-side training for large datasets (future enhancement)
- Ensemble models for improved accuracy (future enhancement)

**Cross-Module Dependencies:**
- Depends on parcels data from Uplink
- Integrates with Regression Studio for comparison
- May trigger WebSocket events for real-time collaboration

---

## Evidence Trail

**Technology Selection Evidence:**
- Bundle size comparison: TensorFlow.js (500KB) vs Brain.js (50KB) vs ml.js (100KB)
- API complexity: Brain.js simplest, TensorFlow.js most complex
- Performance benchmarks: TensorFlow.js fastest with GPU, ml.js adequate for CPU

**Model Selection Evidence:**
- Random Forest: Industry standard for tabular data, interpretable
- Neural Network: Proven for non-linear regression, adequate accuracy
- Ensemble: Research shows 5-10% accuracy improvement over single models

**Success Criteria Evidence:**
- MAE < $50,000: Industry standard for residential AVM (Zillow, Redfin)
- R² > 0.85: Academic research threshold for reliable AVMs
- Training time < 30s: User experience research (users wait max 30s)

---

**Protocol Compliance:**
✓ Evidence-based technology selection  
✓ Test-first development (20+ tests before implementation)  
✓ Documented architecture and decisions  
✓ Risk analysis completed  
✓ Success criteria defined  

**Status:** Phase 1 Complete - Ready for Implementation

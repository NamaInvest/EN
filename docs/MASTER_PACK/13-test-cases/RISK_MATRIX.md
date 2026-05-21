# Risk-Based Testing Matrix

This matrix determines the testing intensity required based on feature criticality.

| Feature / Module | Impact (1-5) | Likelihood of Bug (1-5) | Risk Score | Testing Requirement |
|---|---|---|---|---|
| **Auto-Journal Engine** | 5 | 4 | 20 | 100% Coverage + Mutation Testing + E2E |
| **ZATCA Integration** | 5 | 5 | 25 | 100% Coverage + E2E + Sandbox UAT |
| **Payroll Processing** | 5 | 3 | 15 | 90% Coverage + E2E Data Validations |
| **User Authentication** | 5 | 2 | 10 | 90% Coverage + E2E Login Scenarios |
| **General Reports** | 2 | 3 | 6 | Smoke Tests + Snapshot Testing |
| **UI Empty States** | 1 | 2 | 2 | Snapshot Testing |
| **System Settings** | 2 | 2 | 4 | Unit Tests |

> Risk Score = Impact * Likelihood. Scores > 10 require extensive testing pipelines.

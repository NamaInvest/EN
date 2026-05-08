/**
 * GOSI Rates Calculator — Saudi Social Insurance.
 *
 * Saudi employees:  Employee 9% + Company 9% Annuity + Company 2% SANED = 20%
 * Non-Saudi expats: Company 2% (Occupation hazards only)
 *
 * Salary ceiling: 45,000 SAR/month
 * Eligible components: Basic salary + Housing allowance only
 */

const GOSI_CEILING = 45_000;

export interface GOSIComponents {
  basicSalary: number;
  housingAllowance: number;
}

export interface GOSIContribution {
  eligibleBase: number;
  employeeShare: number;
  companyAnnuity: number;
  companySaned: number;
  companyOccupationHazards: number;
  totalEmployeeDeduction: number;
  totalCompanyLiability: number;
  totalContribution: number;
}

export class GOSIRatesCalculatorService {
  calculateRates(components: GOSIComponents, isSaudi: boolean): GOSIContribution {
    const eligibleBase = Math.min(
      components.basicSalary + components.housingAllowance,
      GOSI_CEILING
    );

    if (!isSaudi) {
      // Expat: only 2% occupation hazards paid by company
      const companyOccupationHazards = parseFloat((eligibleBase * 0.02).toFixed(2));
      return {
        eligibleBase,
        employeeShare: 0,
        companyAnnuity: 0,
        companySaned: 0,
        companyOccupationHazards,
        totalEmployeeDeduction: 0,
        totalCompanyLiability: companyOccupationHazards,
        totalContribution: companyOccupationHazards,
      };
    }

    // Saudi: 9% employee + 9% company annuity + 2% company SANED
    const employeeShare = parseFloat((eligibleBase * 0.09).toFixed(2));
    const companyAnnuity = parseFloat((eligibleBase * 0.09).toFixed(2));
    const companySaned = parseFloat((eligibleBase * 0.02).toFixed(2));

    return {
      eligibleBase,
      employeeShare,
      companyAnnuity,
      companySaned,
      companyOccupationHazards: 0,
      totalEmployeeDeduction: employeeShare,
      totalCompanyLiability: parseFloat((companyAnnuity + companySaned).toFixed(2)),
      totalContribution: parseFloat((employeeShare + companyAnnuity + companySaned).toFixed(2)),
    };
  }

  exceedsCeiling(components: GOSIComponents): boolean {
    return (components.basicSalary + components.housingAllowance) > GOSI_CEILING;
  }
}

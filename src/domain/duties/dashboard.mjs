import { calculateDutyMetrics, getDutyAssessmentReason } from './metrics.mjs'

function clone(value) {
  return structuredClone(value)
}

function getDutyStatus(metrics) {
  if (!metrics.applicable) return 'NOT_APPLICABLE'
  return metrics.qualified ? 'COMPLETED' : 'ASSESSMENT'
}

function uniqueDepartments(employees, duties) {
  return [...new Set([
    ...employees.map((employee) => employee.department),
    ...duties.map((duty) => duty.department)
  ].filter(Boolean))].sort()
}

export function createDutyDashboard({ duties = [], employees = [], asOf, periodType } = {}) {
  const allDuties = clone(periodType ? duties.filter((duty) => duty.periodType === periodType) : duties)
  const allEmployees = clone(employees)
  const company = calculateDutyMetrics(allDuties, { asOf })
  const people = allEmployees
    .map((employee) => {
      const metrics = calculateDutyMetrics(allDuties.filter((duty) => duty.ownerUid === employee.uid), { asOf })
      return {
        employeeId: employee.employeeId,
        uid: employee.uid,
        displayName: employee.displayName,
        department: employee.department,
        position: employee.position,
        ...metrics,
        dutyStatus: getDutyStatus(metrics)
      }
    })
    .sort((left, right) => left.department.localeCompare(right.department) || left.employeeId.localeCompare(right.employeeId))
  const departments = uniqueDepartments(allEmployees, allDuties).map((department) => {
    const metrics = calculateDutyMetrics(allDuties.filter((duty) => duty.department === department), { asOf })
    return {
      department,
      employeeCount: allEmployees.filter((employee) => employee.department === department).length,
      ...metrics
    }
  })

  return {
    company,
    departments,
    people,
    reviewItems: allDuties.filter((duty) => duty.status === 'SUBMITTED'),
    assessmentItems: allDuties
      .filter((duty) => company.assessmentTaskIds.includes(duty.id))
      .map((duty) => ({ ...duty, assessmentReason: getDutyAssessmentReason(duty) }))
  }
}

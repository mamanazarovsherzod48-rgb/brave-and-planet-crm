const MONTH_NAMES_UZ = [
  'Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun',
  'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr'
];

function calculateNextTargetMonth(groupStartDate, studentJoinedDate, paidCount) {
  const baseDate = new Date(Math.max(new Date(groupStartDate), new Date(studentJoinedDate)));
  const targetDate = new Date(baseDate.getFullYear(), baseDate.getMonth() + paidCount, 1);
  const monthName = MONTH_NAMES_UZ[targetDate.getMonth()];
  const year = targetDate.getFullYear();

  return `${monthName} ${year}`;
}

module.exports = { calculateNextTargetMonth, MONTH_NAMES_UZ };
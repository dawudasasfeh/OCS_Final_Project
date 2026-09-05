// These integers are Domain/Enums/DurationType.cs. If that enum is ever
// renumbered, this map has to change with it.
export const DURATION_TYPE = { Weekly: 1, Monthly: 2, Yearly: 3 };

export const UNIT_NOUN = { Weekly: "week", Monthly: "month", Yearly: "year" };

export function periodLabel(count, durationType) {
  const noun = UNIT_NOUN[durationType] ?? "period";
  return `${count} ${noun}${count === 1 ? "" : "s"}`;
}

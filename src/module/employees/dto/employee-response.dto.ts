export type EmployeeResponse<T extends { password: string }> = Omit<
  T,
  'password'
>;

export function excludePassword<T extends { password: string }>(
  employee: T,
): EmployeeResponse<T> {
  const { password: _password, ...rest } = employee;

  return rest;
}

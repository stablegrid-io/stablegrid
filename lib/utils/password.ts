export const passwordRules = [
  {
    id: 'length',
    label: 'At least 8 characters',
    test: (value: string) => value.length >= 8
  },
  {
    id: 'lowercase',
    label: 'One lowercase letter',
    test: (value: string) => /[a-z]/.test(value)
  },
  {
    id: 'uppercase',
    label: 'One uppercase letter',
    test: (value: string) => /[A-Z]/.test(value)
  },
  {
    id: 'number',
    label: 'One number',
    test: (value: string) => /[0-9]/.test(value)
  },
  {
    id: 'symbol',
    label: 'One symbol',
    test: (value: string) => /[^A-Za-z0-9]/.test(value)
  }
];

export const getPasswordIssues = (password: string) =>
  passwordRules.filter((rule) => !rule.test(password)).map((rule) => rule.label);

export const isPasswordStrong = (password: string) =>
  getPasswordIssues(password).length === 0;

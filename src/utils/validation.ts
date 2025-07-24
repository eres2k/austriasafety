export const validators = {
  required: (value: any) => {
    if (value === null || value === undefined || value === '') {
      return 'Dieses Feld ist erforderlich'
    }
    return null
  },

  email: (value: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(value)) {
      return 'Bitte geben Sie eine gültige E-Mail-Adresse ein'
    }
    return null
  },

  minLength: (min: number) => (value: string) => {
    if (value.length < min) {
      return `Mindestens ${min} Zeichen erforderlich`
    }
    return null
  },

  maxLength: (max: number) => (value: string) => {
    if (value.length > max) {
      return `Maximal ${max} Zeichen erlaubt`
    }
    return null
  },

  pattern: (pattern: RegExp, message: string) => (value: string) => {
    if (!pattern.test(value)) {
      return message
    }
    return null
  }
}

export function validateForm(data: Record<string, any>, rules: Record<string, any[]>) {
  const errors: Record<string, string> = {}

  for (const [field, fieldRules] of Object.entries(rules)) {
    for (const rule of fieldRules) {
      const error = rule(data[field])
      if (error) {
        errors[field] = error
        break
      }
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors
  }
}
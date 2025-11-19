import { useState } from "react"

export function useControlledState<T>(
  value: T | undefined,
  defaultValue: T | undefined,
  onChange?: (value: T, ...args: any[]) => void
): [T, (value: T, ...args: any[]) => void] {
  const [stateValue, setStateValue] = useState(value || defaultValue)

  const setValue = (newValue: T, ...args: any[]) => {
    setStateValue(newValue)
    onChange?.(newValue, ...args)
  }

  return [value !== undefined ? value : stateValue as T, setValue]
}

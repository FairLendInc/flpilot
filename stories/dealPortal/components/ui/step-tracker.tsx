"use client"

import React, { useState } from "react"

import HorizontalSteps from "./horizontal-steps"
import { Button } from "@heroui/react"

const steps = [
  {
    title: "upload",
  },
  {
    title: "approve",
  },
  {
    title: "sign",
  },
]

export default function ControlledStepper() {
  const [currentStep, setCurrentStep] = useState(0)

  return (
    <div>
      <Button
        onPress={() => {
          setCurrentStep(Math.min(currentStep + 1, steps.length - 1))
        }}
      >
        next state
      </Button>
      <Button
        onPress={() => {
          setCurrentStep(Math.max(currentStep - 1, 0))
        }}
      >
        prev state
      </Button>
      <HorizontalSteps currentStep={currentStep} steps={steps} />
    </div>
  )
}

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
          setCurrentStep(currentStep + 1)
        }}
      >
        next state
      </Button>
      <Button
        onPress={() => {
          setCurrentStep(currentStep - 1)
        }}
      >
        prev state
      </Button>
      <HorizontalSteps currentStep={currentStep} steps={steps} />
    </div>
  )
}

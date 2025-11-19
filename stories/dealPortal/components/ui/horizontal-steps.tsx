"use client"

import React, { type ComponentProps } from "react"

import { cn } from "lib/utils"
import type { ButtonProps } from "@heroui/react"
import { domAnimation, LazyMotion, m } from "framer-motion"

export type HorizontalStepProps = {
  title?: React.ReactNode
  className?: string
}

export interface HorizontalStepsProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "onStepChange"> {
  /**
   * An array of steps.
   *
   * @default []
   */
  steps?: HorizontalStepProps[]
  /**
   * The color of the steps.
   *
   * @default "primary"
   */
  color?: ButtonProps["color"]
  /**
   * The current step index.
   *
   * @required
   */
  currentStep: number
  /**
   * Whether to hide the progress bars.
   *
   * @default false
   */
  hideProgressBars?: boolean
  /**
   * The custom class for the steps wrapper.
   */
  className?: string
  /**
   * The custom class for the step.
   */
  stepClassName?: string
}

function CheckIcon(props: ComponentProps<"svg">) {
  return (
    <svg {...props} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <m.path
        animate={{ pathLength: 1 }}
        d="M5 13l4 4L19 7"
        initial={{ pathLength: 0 }}
        strokeLinecap="round"
        strokeLinejoin="round"
        transition={{
          delay: 0.2,
          type: "tween",
          ease: "easeOut",
          duration: 0.3,
        }}
      />
    </svg>
  )
}

const HorizontalSteps = React.forwardRef<HTMLDivElement, HorizontalStepsProps>(
  (
    { color = "primary", steps = [], currentStep, hideProgressBars = false, stepClassName, className, ...props },
    ref
  ) => {
    const colors = React.useMemo(() => {
      let userColor
      let fgColor

      const colorsVars = [
        "[--active-fg-color:hsl(var(--step-fg-color))]",
        "[--active-border-color:hsl(var(--step-color))]",
        "[--active-color:hsl(var(--step-color))]",
        "[--complete-background-color:hsl(var(--step-color))]",
        "[--complete-border-color:hsl(var(--step-color))]",
        "[--inactive-border-color:hsl(var(--heroui-default-300))]",
        "[--inactive-color:hsl(var(--heroui-default-300))]",
      ]

      switch (color) {
        case "primary":
          userColor = "[--step-color:var(--heroui-primary)]"
          fgColor = "[--step-fg-color:var(--heroui-primary-foreground)]"
          break
        case "secondary":
          userColor = "[--step-color:var(--heroui-secondary)]"
          fgColor = "[--step-fg-color:var(--heroui-secondary-foreground)]"
          break
        case "success":
          userColor = "[--step-color:var(--heroui-success)]"
          fgColor = "[--step-fg-color:var(--heroui-success-foreground)]"
          break
        case "warning":
          userColor = "[--step-color:var(--heroui-warning)]"
          fgColor = "[--step-fg-color:var(--heroui-warning-foreground)]"
          break
        case "danger":
          userColor = "[--step-color:var(--heroui-error)]"
          fgColor = "[--step-fg-color:var(--heroui-error-foreground)]"
          break
        case "default":
          userColor = "[--step-color:var(--heroui-default)]"
          fgColor = "[--step-fg-color:var(--heroui-default-foreground)]"
          break
        default:
          userColor = "[--step-color:var(--heroui-primary)]"
          fgColor = "[--step-fg-color:var(--heroui-primary-foreground)]"
          break
      }

      colorsVars.unshift(fgColor)
      colorsVars.unshift(userColor)

      return colorsVars
    }, [color])

    return (
      <div aria-label="Progress" className="flex w-full items-center justify-center">
        <div
          className={cn(
            "flex w-full flex-row flex-nowrap items-start justify-between gap-0 px-4",
            colors,
            className
          )}
        >
          {steps?.map((step, stepIdx) => {
            const status = currentStep === stepIdx ? "active" : currentStep < stepIdx ? "inactive" : "complete"

            return (
              <div
                id={`step-${stepIdx}`}
                key={stepIdx}
                className={cn("relative flex flex-1 min-w-0 items-center my-4")}
              >
                {/* Step content - circle and text */}
                <div className="flex flex-col items-center w-full">
                  <div className="flex items-center justify-center">
                    <LazyMotion features={domAnimation}>
                      <m.div animate={status} className="relative">
                        <m.div
                          ref={stepIdx === 0 ? ref : undefined}
                          aria-current={status === "active" ? "step" : undefined}
                          className={cn(
                            "text-default-foreground relative flex h-[24px] w-[24px] items-center justify-center rounded-full border text-sm font-semibold",
                            {
                              "shadow-md": status === "complete",
                            }
                          )}
                          initial={false}
                          transition={{ duration: 0.25 }}
                          variants={{
                            inactive: {
                              backgroundColor: "transparent",
                              borderColor: "var(--inactive-border-color)",
                              color: "var(--inactive-color)",
                            },
                            active: {
                              backgroundColor: "transparent",
                              borderColor: "var(--active-border-color)",
                              color: "var(--active-color)",
                            },
                            complete: {
                              backgroundColor: "var(--complete-background-color)",
                              borderColor: "var(--complete-border-color)",
                            },
                          }}
                        >
                          <div className="flex items-center justify-center">
                            {status === "complete" ? (
                              <CheckIcon className="h-4 w-4 text-[var(--active-fg-color)]" />
                            ) : (
                              <span>{stepIdx + 1}</span>
                            )}
                          </div>
                        </m.div>
                      </m.div>
                    </LazyMotion>
                  </div>
                  
                  <div className="mt-1 px-1 text-center" id="step title">
                    <p
                      className={cn(
                        "text-default-foreground line-clamp-2 text-[10px] leading-tight font-medium transition-[color,opacity] duration-300",
                        {
                          "text-default-500": status === "inactive",
                        }
                      )}
                    >
                      {step.title}
                    </p>
                  </div>
                </div>
                
                {/* Connector line positioned absolutely */}
                {stepIdx < steps.length - 1 && !hideProgressBars && (
                  <div className="absolute left-[calc(50%+12px)] mx-[6px] top-3 right-[calc(-50%+12px)] h-[1px] bg-default-200 z-0">
                    <div
                      className={cn(
                        "h-[1px] bg-[var(--inactive-border-color)] transition-[width] duration-300",
                        stepIdx < currentStep - 1
                          ? "bg-[var(--active-border-color)] w-full"
                          : "w-0"
                      )}
                    />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    )
  }
)

HorizontalSteps.displayName = "HorizontalSteps"

export default HorizontalSteps

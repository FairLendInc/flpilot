"use client"

import React, { type ComponentProps } from "react"

import { cn } from "lib/utils"
import { Badge } from "../../../mocks/HeroUIMocks"
import type { ButtonProps } from "@heroui/button"
import { Chip, Divider, Spacer } from "../../../mocks/HeroUIMocks";
import { Icon } from "@iconify/react"
import { useControlledState } from "../../../mocks/react-stately-utils";
import { format } from "date-fns"
import { domAnimation, LazyMotion, m } from "framer-motion"

export type VerticalCollapsibleStepProps = {
  className?: string
  description?: React.ReactNode
  title?: React.ReactNode
  details?: string[]
  completedAt?: Date | null
  startedAt?: Date | null
}

export interface VerticalCollapsibleStepsProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * An array of steps.
   *
   * @default []
   */
  steps?: VerticalCollapsibleStepProps[]
  /**
   * The color of the steps.
   *
   * @default "primary"
   */
  color?: ButtonProps["color"]
  /**
   * The current step index.
   */
  currentStep?: number
  /**
   * The default step index.
   *
   * @default 0
   */
  defaultStep?: number
  /**
   * The custom class for the steps wrapper.
   */
  className?: string
  /**
   * The custom class for the step.
   */
  stepClassName?: string
  /**
   * Callback function when the step index changes.
   */
  onStepChange?: (stepIndex: number) => void
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

function Timer({ startTime }: { startTime: Date | null }) {
  const [elapsedTime, setElapsedTime] = React.useState("00:00:00")

  React.useEffect(() => {
    if (!startTime) return

    const updateTimer = () => {
      const now = new Date().getTime()
      const timeStarted = startTime.getTime()
      const elapsed = now - timeStarted

      // Format elapsed time as HH:MM:SS
      const hours = Math.floor(elapsed / 3600000)
        .toString()
        .padStart(2, "0")
      const minutes = Math.floor((elapsed % 3600000) / 60000)
        .toString()
        .padStart(2, "0")
      const seconds = Math.floor((elapsed % 60000) / 1000)
        .toString()
        .padStart(2, "0")

      setElapsedTime(`${hours}:${minutes}:${seconds}`)
    }

    // Update initially
    updateTimer()

    // Set up interval to update every second
    const interval = setInterval(updateTimer, 1000)

    return () => clearInterval(interval)
  }, [startTime])

  if (!startTime) return null

  return (
    <Chip
      variant="faded"
      color="danger"
      className="text-tiny mt-2 pl-3"
      startContent={<Icon icon="lucide:clock" width={16} />}
    >
      <span>{elapsedTime}</span>
    </Chip>
  )
}

const VerticalCollapsibleSteps = React.forwardRef<HTMLDivElement, VerticalCollapsibleStepsProps>(
  (
    {
      color = "primary",
      steps = [],
      defaultStep = 0,
      onStepChange,
      currentStep: currentStepProp,
      stepClassName,
      className,
      ...props
    },
    ref
  ) => {
    const [currentStep] = useControlledState(currentStepProp, defaultStep, onStepChange)

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
      <nav aria-label="Progress" ref={ref} {...props}>
        <ol className={cn("flex flex-col gap-y-3", colors, className)}>
          {steps?.map((step, stepIdx) => {
            const status = currentStep === stepIdx ? "active" : currentStep < stepIdx ? "inactive" : "complete"

            return (
              <li
                key={stepIdx}
                className={cn(
                  "group rounded-large border-default-200 data-[status=active]:bg-default-100 dark:border-default-50 dark:data-[status=active]:bg-default-50 relative gap-4 border",
                  stepClassName
                )}
                data-status={status}
              >
                <div className="flex w-full max-w-full items-center">
                  <div className={cn("rounded-large flex w-full items-center justify-center gap-x-4 px-3 py-2.5")}>
                    <div className="flex h-full items-center">
                      <LazyMotion features={domAnimation}>
                        <m.div animate={status} className="relative">
                          <m.div
                            className={cn(
                              "border-medium text-large text-default-foreground relative flex h-[34px] w-[34px] items-center justify-center rounded-full font-semibold",
                              {
                                "shadow-lg": status === "complete",
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
                                <CheckIcon className="h-6 w-6 text-[var(--active-fg-color)]" />
                              ) : (
                                <span>{stepIdx + 1}</span>
                              )}
                            </div>
                          </m.div>
                        </m.div>
                      </LazyMotion>
                    </div>

                    {status === "complete" ? (
                      <div className="flex flex-1 items-center">
                        <div className="flex-1 text-left">
                          <div
                            className={cn(
                              "text-medium text-default-foreground font-medium transition-[color,opacity] duration-300"
                            )}
                          >
                            {step.title}
                          </div>
                          <div
                            className={cn(
                              "text-tiny text-default-600 lg:text-small transition-[color,opacity] duration-300"
                            )}
                          >
                            {step.description}
                          </div>
                        </div>

                        <Divider orientation="vertical" className="mx-3 h-8" />

                        {step.completedAt && (
                          <Chip color="success" size="sm" variant="faded">
                            {format(step.completedAt, "MMM d, h:mm a")}
                          </Chip>
                        )}
                      </div>
                    ) : (
                      <div className="flex-1 text-left">
                        <div className="flex flex-col">
                          <div
                            className={cn(
                              "text-medium text-default-foreground font-medium transition-[color,opacity] duration-300",
                              {
                                "text-default-500": status === "inactive",
                              }
                            )}
                          >
                            {step.title}
                          </div>
                          <div
                            className={cn(
                              "text-tiny text-default-600 lg:text-small transition-[color,opacity] duration-300",
                              {
                                "text-default-500": status === "inactive",
                              }
                            )}
                          >
                            {step.description}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                {step.details && step.details?.length > 0 && (
                  <LazyMotion features={domAnimation}>
                    <m.div
                      key={stepIdx}
                      animate={status}
                      className="flex flex-col"
                      exit="complete"
                      initial={false}
                      transition={{
                        opacity: {
                          duration: 0.25,
                        },
                        height: {
                          type: "spring",
                          stiffness: 300,
                          damping: 30,
                        },
                      }}
                      variants={{
                        active: { opacity: 1, height: "auto" },
                        inactive: { opacity: 0, height: 0 },
                        complete: { opacity: 0, height: 0 },
                      }}
                    >
                      <div className="flex">
                        <Spacer x={14} />
                        <ul className="text-default-400 list-disc pr-12 pb-2 pl-1">
                          {step.details.map((detail, idx) => (
                            <li key={idx} className="text-tiny mb-1">
                              {detail}
                            </li>
                          ))}
                        </ul>
                      </div>

                      {status === "active" && (
                        <div className="flex">
                          <Spacer x={14} />
                          <Timer startTime={step.startedAt || null} />
                        </div>
                      )}

                      <Spacer y={2} />
                    </m.div>
                  </LazyMotion>
                )}
              </li>
            )
          })}
        </ol>
      </nav>
    )
  }
)

VerticalCollapsibleSteps.displayName = "VerticalCollapsibleSteps"

export default VerticalCollapsibleSteps

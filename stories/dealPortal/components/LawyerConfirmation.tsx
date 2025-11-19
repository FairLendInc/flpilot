import React, { useState } from "react"

import { useDealStore } from "../store/dealStore"
import { Alert, AlertDescription, AlertTitle } from "components/ui/alert"
import { Button } from "components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "components/ui/card"
import { Checkbox } from "components/ui/checkbox"
import { Label } from "components/ui/label"
import { Separator } from "components/ui/separator"
import { AlertTriangle, BadgeCheck, FileCheck, Lock, Scale, ShieldCheck } from "lucide-react"

export function LawyerConfirmation() {
  const { setLawyerConfirmed, logEvent, dealId, confirmLawyerRepresentation } = useDealStore()
  const [confirmations, setConfirmations] = useState({
    isQualified: false,
    hasEngagement: false,
    understandsDuties: false,
    acceptsTerms: false,
  })
  const [isPending, setIsPending] = useState(false)

  const allConfirmed = Object.values(confirmations).every((value) => value === true)

  const handleConfirmation = async () => {
    if (allConfirmed && dealId) {
      setIsPending(true)
      try {
        await confirmLawyerRepresentation(dealId)
        // Log this important action in the event system
        logEvent({
          type: "system",
          description: "Lawyer confirmed representation and accepted terms",
        })
      } catch (error) {
        console.error("Failed to confirm representation:", error)
      } finally {
        setIsPending(false)
      }
    }
  }

  const handleCheckboxChange = (key: keyof typeof confirmations) => {
    setConfirmations((prev) => ({
      ...prev,
      [key]: !prev[key],
    }))
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <Card className="border-primary/20 shadow-lg">
        <CardHeader className="bg-primary/5 border-b text-center">
          <div className="bg-primary/10 mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full">
            <Scale className="text-primary h-6 w-6" />
          </div>
          <CardTitle className="text-2xl">Lawyer Representation Confirmation</CardTitle>
          <CardDescription>Please confirm your representation before accessing the document portal</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pt-6 pb-4">
          <Alert className="border-amber-200 bg-amber-50">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            <AlertTitle className="text-amber-800">Important</AlertTitle>
            <AlertDescription className="text-amber-700">
              Your access to this portal is governed by the terms and conditions outlined below. You must confirm all
              items before proceeding.
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            <div className="bg-card hover:bg-muted/50 rounded-md border p-4 transition-colors">
              <div className="mb-2 flex items-start">
                <ShieldCheck className="text-primary mt-0.5 mr-2 h-5 w-5 flex-shrink-0" />
                <div>
                  <h3 className="font-medium">Qualified Legal Representation</h3>
                  <p className="text-muted-foreground text-sm">
                    I confirm that I am a qualified lawyer licensed to practice law in the relevant jurisdiction and am
                    authorized to represent the buyer in this transaction.
                  </p>
                </div>
              </div>
              <div className="mt-2 ml-7 flex items-center space-x-2">
                <Checkbox
                  id="isQualified"
                  checked={confirmations.isQualified}
                  onCheckedChange={() => handleCheckboxChange("isQualified")}
                />
                <Label htmlFor="isQualified" className="font-medium">
                  I confirm
                </Label>
              </div>
            </div>

            <div className="bg-card hover:bg-muted/50 rounded-md border p-4 transition-colors">
              <div className="mb-2 flex items-start">
                <FileCheck className="text-primary mt-0.5 mr-2 h-5 w-5 flex-shrink-0" />
                <div>
                  <h3 className="font-medium">Engagement Agreement</h3>
                  <p className="text-muted-foreground text-sm">
                    I confirm that I have an engagement agreement with the buyer that covers this transaction, and I
                    have their explicit authorization to access documents and represent them in this process.
                  </p>
                </div>
              </div>
              <div className="mt-2 ml-7 flex items-center space-x-2">
                <Checkbox
                  id="hasEngagement"
                  checked={confirmations.hasEngagement}
                  onCheckedChange={() => handleCheckboxChange("hasEngagement")}
                />
                <Label htmlFor="hasEngagement" className="font-medium">
                  I confirm
                </Label>
              </div>
            </div>

            <div className="bg-card hover:bg-muted/50 rounded-md border p-4 transition-colors">
              <div className="mb-2 flex items-start">
                <BadgeCheck className="text-primary mt-0.5 mr-2 h-5 w-5 flex-shrink-0" />
                <div>
                  <h3 className="font-medium">Professional Duties</h3>
                  <p className="text-muted-foreground text-sm">
                    I understand my professional duties to maintain client confidentiality, avoid conflicts of interest,
                    and act in the best interest of my client throughout this transaction.
                  </p>
                </div>
              </div>
              <div className="mt-2 ml-7 flex items-center space-x-2">
                <Checkbox
                  id="understandsDuties"
                  checked={confirmations.understandsDuties}
                  onCheckedChange={() => handleCheckboxChange("understandsDuties")}
                />
                <Label htmlFor="understandsDuties" className="font-medium">
                  I understand
                </Label>
              </div>
            </div>

            <div className="bg-card hover:bg-muted/50 rounded-md border p-4 transition-colors">
              <div className="mb-2 flex items-start">
                <Lock className="text-primary mt-0.5 mr-2 h-5 w-5 flex-shrink-0" />
                <div>
                  <h3 className="font-medium">Terms of Portal Access</h3>
                  <p className="text-muted-foreground text-sm">
                    I agree to the terms and conditions of using this portal, including data protection obligations, and
                    will not share my access credentials with unauthorized parties.
                  </p>
                </div>
              </div>
              <div className="mt-2 ml-7 flex items-center space-x-2">
                <Checkbox
                  id="acceptsTerms"
                  checked={confirmations.acceptsTerms}
                  onCheckedChange={() => handleCheckboxChange("acceptsTerms")}
                />
                <Label htmlFor="acceptsTerms" className="font-medium">
                  I agree
                </Label>
              </div>
            </div>
          </div>

          <Separator className="my-6" />

          <div className="bg-muted/30 rounded-md border p-4 text-sm">
            <p className="mb-2 font-medium">Legal Disclaimer:</p>
            <p className="text-muted-foreground">
              By confirming the statements above, you are making legally binding representations about your professional
              qualifications and authority to represent the buyer. False representations may constitute a breach of
              professional ethics and may expose you to disciplinary action. This confirmation will be recorded and
              timestamped.
            </p>
          </div>
        </CardContent>
        <CardFooter className="bg-muted/5 flex flex-col items-center justify-between gap-4 border-t sm:flex-row">
          <div className="text-muted-foreground text-sm">
            <span className="font-medium">Note:</span> You must confirm all statements to proceed.
          </div>
          <Button 
            size="lg" 
            onClick={handleConfirmation} 
            disabled={!allConfirmed || isPending} 
            className="w-full sm:w-auto"
          >
            {isPending ? "Confirming..." : "I Confirm My Representation"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}

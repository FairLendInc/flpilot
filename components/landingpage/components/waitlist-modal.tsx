import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useState, useEffect } from "react";

const formSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  phoneNumber: z.string().min(10, "Phone number must be at least 10 digits"),
  investmentRange: z.enum(["10k-50k", "50k-100k", "100k+"] as const),
});

type FormValues = z.infer<typeof formSchema>;

interface WaitlistModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultEmail?: string;
}

const investmentOptions = [
  {
    id: "10k-50k",
    title: "$10k – $50k",
    description: "Getting started",
  },
  {
    id: "50k-100k",
    title: "$50k – $100k",
    description: "Building portfolio",
  },
  {
    id: "100k+",
    title: "$100k+",
    description: "Serious accumulation",
  },
] as const;

export function WaitlistModal({ open, onOpenChange, defaultEmail }: WaitlistModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: defaultEmail || "",
      phoneNumber: "",
      investmentRange: undefined,
    },
  });

  const selectedRange = watch("investmentRange");
  
  // Update email if defaultEmail changes
  useEffect(() => {
    if (defaultEmail) {
      setValue("email", defaultEmail);
    }
  }, [defaultEmail, setValue]);

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      console.log("Waitlist submission:", data);
      toast.success("You've been added to the waiting list!");
      reset();
      onOpenChange(false);
    } catch (error) {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] bg-background/60 backdrop-blur-sm border-white/10 shadow-2xl">
        <DialogHeader>
          <DialogTitle>Join the FairLend MIC Waiting List</DialogTitle>
          <DialogDescription>
            Enter your details to reserve your spot. We'll contact you with full details before you commit any capital.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First name</Label>
              <Input
                id="firstName"
                placeholder="John"
                {...register("firstName")}
                className={`bg-background/50 border-white/10 focus-visible:ring-emerald-500/50 ${errors.firstName ? "border-destructive focus-visible:ring-destructive" : ""}`}
              />
              {errors.firstName && (
                <p className="text-xs text-destructive">{errors.firstName.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last name</Label>
              <Input
                id="lastName"
                placeholder="Doe"
                {...register("lastName")}
                className={`bg-background/50 border-white/10 focus-visible:ring-emerald-500/50 ${errors.lastName ? "border-destructive focus-visible:ring-destructive" : ""}`}
              />
              {errors.lastName && (
                <p className="text-xs text-destructive">{errors.lastName.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="john.doe@example.com"
              {...register("email")}
              className={`bg-background/50 border-white/10 focus-visible:ring-emerald-500/50 ${errors.email ? "border-destructive focus-visible:ring-destructive" : ""}`}
            />
            {errors.email && (
              <p className="text-xs text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phoneNumber">Phone number</Label>
            <Input
              id="phoneNumber"
              type="tel"
              placeholder="(555) 123-4567"
              {...register("phoneNumber")}
              className={`bg-background/50 border-white/10 focus-visible:ring-emerald-500/50 ${errors.phoneNumber ? "border-destructive focus-visible:ring-destructive" : ""}`}
            />
            {errors.phoneNumber && (
              <p className="text-xs text-destructive">{errors.phoneNumber.message}</p>
            )}
          </div>

          <div className="space-y-3">
            <Label>How much would you want to invest?</Label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {investmentOptions.map((option) => (
                <motion.div
                  key={option.id}
                  className={`relative cursor-pointer rounded-xl border p-3 transition-colors ${
                    selectedRange === option.id 
                      ? "border-emerald-500 bg-emerald-500/10" 
                      : "border-white/10 bg-background/50 hover:bg-background/80 hover:border-emerald-500/50"
                  }`}
                  onClick={() => setValue("investmentRange", option.id, { shouldValidate: true })}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                >
                  <div className="flex flex-col h-full justify-between gap-1">
                    <span className="font-bold text-sm">{option.title}</span>
                    <span className="text-xs text-muted-foreground">{option.description}</span>
                  </div>

                  {selectedRange === option.id && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-2 -right-2 rounded-full bg-emerald-600 p-1 text-white shadow-sm"
                    >
                      <Check className="size-3" />
                    </motion.div>
                  )}
                </motion.div>
              ))}
            </div>
            {errors.investmentRange && (
              <p className="text-xs text-destructive">{errors.investmentRange.message}</p>
            )}
          </div>

          <DialogFooter className="pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              {isSubmitting ? "Submitting..." : "Submit"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

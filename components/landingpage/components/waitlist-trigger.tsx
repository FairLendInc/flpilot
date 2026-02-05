"use client";

import { useWaitlist } from "@/lib/context/waitlist-context";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface WaitlistTriggerProps {
	className?: string;
	children?: React.ReactNode;
	variant?: "default" | "outline" | "ghost";
	size?: "default" | "sm" | "lg" | "icon";
	asChild?: boolean; // Not implemented to keep simple but matching standard pattern
    text?: string;
}

export function WaitlistTrigger({ 
    className, 
    children, 
    variant, 
    size 
}: WaitlistTriggerProps) {
	const { setShowWaitlistModal } = useWaitlist();

	return (
		<Button
			className={className}
			onClick={() => setShowWaitlistModal(true)}
			variant={variant}
			size={size}
		>
			{children}
		</Button>
	);
}

// Special trigger for the text link style used in one section
export function WaitlistTextTrigger({ className, children }: { className?: string, children: React.ReactNode }) {
    const { setShowWaitlistModal } = useWaitlist();
    
    return (
        <button
            className={className}
            onClick={() => setShowWaitlistModal(true)}
            type="button"
        >
            {children}
        </button>
    );
}

// Special trigger for the footer/text link style that behaves like a link
export function WaitlistLinkTrigger({ className, children }: { className?: string, children: React.ReactNode }) {
    const { setShowWaitlistModal } = useWaitlist();
    
    return (
        <button
            className={className}
            onClick={() => {
                setShowWaitlistModal(true);
            }}
            type="button"
        >
            {children}
        </button>
    );
}

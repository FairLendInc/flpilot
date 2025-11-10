// import { OnboardingGateWrapper } from "@/components/onboarding/OnboardingGateWrapper";
export default function AuthLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<>
			{/* <OnboardingGateWrapper /> */}
			{children}
		</>
	);
}

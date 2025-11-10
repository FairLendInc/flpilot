import { Suspense } from "react";
import { HeroSection } from "@/components/HeroSection";
import { CTASection } from "@/components/landingpage/components/cta-section";
import { SplineWrapper } from "@/components/SplineWrapper";
import TerminalSection from "@/components/TerminalSection";

export default function Home() {
	return (
		<div className="relative bg-black">
			{/* Hero Section - Fixed in place with scroll snap */}
			<HeroSection>
				<Suspense fallback={<div className="h-full w-full bg-black" />}>
					<SplineWrapper scene="https://prod.spline.design/4d5uBawP6DCEaRtD/scene.splinecode" />
					<div className="h-40" />
				</Suspense>
			</HeroSection>

			{/* Terminal/Problems Section - Slides over hero */}
			<section className="relative z-10 snap-start scroll-mt-0 bg-black">
				<TerminalSection />
			</section>

			{/* CTA Section - Slides over terminal */}
			<section className="relative z-20 snap-start scroll-mt-0 bg-black">
				<CTASection />
			</section>

			{/*<LightRays
					className="custom-rays"
					distortion={0.0}
					followMouse={true}
					lightSpread={0.5}
					mouseInfluence={0.1}
					noiseAmount={0.0}
					rayLength={1.2}
					raysColor="#ffffff"
					raysOrigin="top-center"
					raysSpeed={0.5}
					saturation={1}
				/>
			</div>*/}
			{/*<Testimonials />*/}
		</div>
	);
}

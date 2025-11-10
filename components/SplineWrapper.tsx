import Spline from "@splinetool/react-spline/next";

interface SplineWrapperProps {
	scene: string;
	className?: string;
}

export async function SplineWrapper({ scene, className }: SplineWrapperProps) {
	return <Spline className={className} scene={scene} />;
}

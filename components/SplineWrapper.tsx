import Spline from "@splinetool/react-spline/next";

type SplineWrapperProps = {
	scene: string;
	className?: string;
};

export async function SplineWrapper({ scene, className }: SplineWrapperProps) {
	return <Spline className={className} scene={scene} />;
}

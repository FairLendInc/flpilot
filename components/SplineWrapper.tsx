"use client";

import Spline from "@splinetool/react-spline";
import { useEffect, useState } from "react";

type SplineWrapperProps = {
	scene: string;
	className?: string;
};

export function SplineWrapper({ scene, className }: SplineWrapperProps) {
	const [mounted, setMounted] = useState(false);

	useEffect(() => {
		setMounted(true);
	}, []);

	if (!mounted) {
		return null;
	}

	return <Spline className={className} scene={scene} />;
}

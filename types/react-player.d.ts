declare module "react-player" {
	import type { ComponentProps } from "react";

	interface ReactPlayerProps extends ComponentProps<"div"> {
		url?: string | string[];
		playing?: boolean;
		loop?: boolean;
		controls?: boolean;
		volume?: number;
		muted?: boolean;
		width?: string | number;
		height?: string | number;
		className?: string;
		config?: Record<string, unknown>;
		onReady?: () => void;
		onStart?: () => void;
		onPlay?: () => void;
		onPause?: () => void;
		onEnded?: () => void;
		onError?: (error: Error) => void;
	}

	const ReactPlayer: React.FC<ReactPlayerProps>;
	export default ReactPlayer;
}

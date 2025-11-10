declare module "three" {
	export class WebGLRenderer {
		constructor(options?: unknown);
		setSize(width: number, height: number, updateStyle?: boolean): void;
		setPixelRatio(value: number): void;
		setClearColor(color: string | number, alpha?: number): void;
		render(scene: Scene, camera: OrthographicCamera): void;
		dispose(): void;
		domElement: HTMLCanvasElement;
		shadowMap: { enabled: boolean };
		outputColorSpace: string;
	}

	export class Vector3 {
		x: number;
		y: number;
		z: number;
		constructor(x?: number, y?: number, z?: number);
		// biome-ignore lint/nursery/noShadow: Standard TypeScript type definition pattern - method parameters don't shadow class properties
		set(x: number, y: number, z: number): Vector3;
	}

	export class Vector4 {
		x: number;
		y: number;
		z: number;
		w: number;
		constructor(x?: number, y?: number, z?: number, w?: number);
		// biome-ignore lint/nursery/noShadow: Standard TypeScript type definition pattern - method parameters don't shadow class properties
		set(x: number, y: number, z: number, w: number): Vector4;
	}

	export class Vector2 {
		x: number;
		y: number;
		constructor(x?: number, y?: number);
		// biome-ignore lint/nursery/noShadow: Standard TypeScript type definition pattern - method parameters don't shadow class properties
		set(x: number, y: number): Vector2;
		lerp(v: Vector2, alpha: number): Vector2;
	}

	export class Scene {
		add(object: Mesh): void;
	}

	export class OrthographicCamera {
		constructor(
			left: number,
			right: number,
			top: number,
			bottom: number,
			near?: number,
			far?: number
		);
	}

	export class BufferGeometry {
		setAttribute(name: string, attribute: BufferAttribute): void;
		dispose(): void;
	}

	export class BufferAttribute {
		constructor(
			array: ArrayLike<number>,
			itemSize: number,
			normalized?: boolean
		);
	}

	export class RawShaderMaterial {
		constructor(parameters?: {
			uniforms?: Record<string, { value: unknown }>;
			vertexShader?: string;
			fragmentShader?: string;
			blending?: number;
			depthTest?: boolean;
			depthWrite?: boolean;
			transparent?: boolean;
		});
		dispose(): void;
	}

	export class Mesh {
		constructor(geometry: BufferGeometry, material: RawShaderMaterial);
		frustumCulled: boolean;
	}

	export class Clock {
		getElapsedTime(): number;
	}

	export const SRGBColorSpace: string;
	export const NormalBlending: number;
}
